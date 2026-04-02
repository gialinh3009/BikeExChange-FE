import { BASE_URL } from "../config/apiConfig";

/* ── Status normalization (same logic as orderActionService) ── */

const ACTION_TO_STATUS = {
  created: "ESCROWED", accepted: "ACCEPTED", delivered: "DELIVERED",
  completed: "COMPLETED", confirmed_receipt: "COMPLETED", confirm_receipt: "COMPLETED",
  confirm_return: "REFUNDED", request_return: "RETURN_REQUESTED",
  return_requested: "RETURN_REQUESTED", return_dispute: "DISPUTED",
  open_dispute: "DISPUTED", disputed: "DISPUTED",
  seller_cancel: "CANCELLED", seller_cancelled: "CANCELLED",
  cancelled: "CANCELLED", cancel: "CANCELLED", refunded: "REFUNDED",
};

const STATUS_ALIASES = {
  CREATED: "ESCROWED", ORDER_CREATED: "ESCROWED", ESCROW: "ESCROWED",
  ACCEPT: "ACCEPTED", ACCEPT_ORDER: "ACCEPTED", SHIPPED: "DELIVERED",
  RETURNED: "RETURN_REQUESTED", REQUESTED_RETURN: "RETURN_REQUESTED",
  REQUEST_REFUND: "RETURN_REQUESTED", REFUND_REQUESTED: "RETURN_REQUESTED",
  RETURN_DISPUTE: "DISPUTED", OPEN_DISPUTE: "DISPUTED",
  REFUND: "REFUNDED", REFUND_APPROVED: "REFUNDED",
  RETURN_CONFIRMED: "REFUNDED", CONFIRM_RETURN: "REFUNDED",
};

const KNOWN_STATUSES = new Set([
  "PENDING_PAYMENT", "ESCROWED", "ACCEPTED", "DELIVERED",
  "COMPLETED", "CANCELLED", "REFUNDED", "RETURN_REQUESTED", "DISPUTED",
]);

function canonicalizeStatus(rawStatus) {
  if (!rawStatus) return null;
  const n = String(rawStatus).trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!n) return null;
  if (KNOWN_STATUSES.has(n)) return n;
  if (STATUS_ALIASES[n]) return STATUS_ALIASES[n];
  if (n.includes("REFUND")) return "REFUNDED";
  if (n.includes("DISPUTE")) return "DISPUTED";
  if (n.includes("RETURN")) return "RETURN_REQUESTED";
  if (n.includes("CANCEL")) return "CANCELLED";
  if (n.includes("COMPLETE") || n.includes("CONFIRM_RECEIPT")) return "COMPLETED";
  if (n.includes("DELIVER") || n.includes("SHIP")) return "DELIVERED";
  if (n.includes("ACCEPT")) return "ACCEPTED";
  if (n.includes("ESCROW") || n.includes("CREATE")) return "ESCROWED";
  return null;
}

function normalizeTimeline(rawEvents = [], order = {}) {
  if (!Array.isArray(rawEvents)) return [];

  const events = rawEvents
    .map((evt) => {
      const actionRaw = String(evt?.action || "").trim();
      const actionStatus = ACTION_TO_STATUS[actionRaw.toLowerCase()];
      const status =
        canonicalizeStatus(evt?.status) ||
        canonicalizeStatus(evt?.newStatus) ||
        canonicalizeStatus(actionRaw) ||
        canonicalizeStatus(actionStatus) ||
        canonicalizeStatus(evt?.type) ||
        "UNKNOWN";

      let note = evt?.note;
      if (!note && typeof evt?.metadata === "string" && evt.metadata.trim()) {
        try {
          const parsed = JSON.parse(evt.metadata);
          note = parsed?.reason || parsed?.note || parsed?.resolutionNote || parsed?.message || evt.metadata;
        } catch { note = evt.metadata; }
      }

      return {
        status,
        timestamp: evt?.timestamp || evt?.createdAt || evt?.updatedAt,
        actor: evt?.performedByName || evt?.actor || (evt?.performedBy != null ? `User #${evt.performedBy}` : undefined),
        note: note || undefined,
      };
    })
    .filter((evt) => !!evt.timestamp);

  // Ensure current order status appears in timeline
  const currentStatus = canonicalizeStatus(order?.status);
  if (currentStatus && currentStatus !== "ESCROWED" && !events.some((e) => canonicalizeStatus(e.status) === currentStatus)) {
    const ts = order?.updatedAt || order?.deliveredAt || order?.acceptedAt || order?.createdAt || new Date().toISOString();
    events.push({ status: currentStatus, timestamp: ts, actor: "Hệ thống" });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/* ── APIs ── */

/**
 * Get list of disputes for current buyer/seller
 * GET /api/orders/my-disputes
 */
export async function getMyDisputesAPI(token) {
  const res = await fetch(`${BASE_URL}/orders/my-disputes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách tranh chấp thất bại.");
  }
  return data.data ?? data;
}

/**
 * Get list of disputes for current seller (disputes on their bikes)
 * GET /api/orders/my-seller-disputes
 */
export async function getSellerDisputesAPI(token) {
  const res = await fetch(`${BASE_URL}/orders/my-seller-disputes`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách tranh chấp thất bại.");
  }
  return data.data ?? data;
}

/**
 * Get order history detail for dispute page
 * GET /api/orders/{orderId}/history
 */
export async function getDisputeDetailAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết tranh chấp thất bại.");
  }
  const payload = data.data ?? data;
  const rawTimeline = Array.isArray(payload.timeline) ? payload.timeline
    : Array.isArray(payload.history) ? payload.history : [];
  const timeline = normalizeTimeline(rawTimeline, payload.order);
  return { ...payload, timeline };
}

/**
 * Get dispute detail for a specific order (buyer perspective)
 * Fetches all disputes and filters by orderId
 */
export async function getDisputeByOrderIdAPI(orderId, token) {
  const disputes = await getMyDisputesAPI(token);
  const list = Array.isArray(disputes) ? disputes : disputes.data ?? [];
  const dispute = list.find(d => Number(d.orderId) === Number(orderId));
  if (!dispute) throw new Error("Không tìm thấy tranh chấp cho đơn hàng này");
  return dispute;
}

/**
 * Get dispute detail for a specific order (seller perspective)
 * Fetches seller disputes and filters by orderId
 */
export async function getSellerDisputeByOrderIdAPI(orderId, token) {
  const disputes = await getSellerDisputesAPI(token);
  const list = Array.isArray(disputes) ? disputes : disputes.data ?? [];
  const dispute = list.find(d => Number(d.orderId) === Number(orderId));
  if (!dispute) throw new Error("Không tìm thấy tranh chấp cho đơn hàng này");
  return dispute;
}

export async function createDisputeAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/dispute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo khiếu nại thất bại.");
  }
  return data.data ?? data;
}

export async function resolveDisputeAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/admin/dispute/${id}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xử lý khiếu nại thất bại.");
  }
  return data.data ?? data;
}

