import { BASE_URL } from "../../config/apiConfig";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const ACTION_TO_STATUS = {
    created: "ESCROWED",
    accepted: "ACCEPTED",
    delivered: "DELIVERED",
    confirm_receipt: "COMPLETED",
    confirm_return: "REFUNDED",
    request_return: "RETURN_REQUESTED",
    return_dispute: "DISPUTED",
    seller_cancel: "CANCELLED",
    cancel: "CANCELLED",
    refunded: "REFUNDED",
};

const STATUS_ALIASES = {
    CREATED: "ESCROWED",
    ORDER_CREATED: "ESCROWED",
    ESCROW: "ESCROWED",
    ACCEPT: "ACCEPTED",
    ACCEPT_ORDER: "ACCEPTED",
    SHIPPED: "DELIVERED",
    RETURNED: "RETURN_REQUESTED",
    REQUESTED_RETURN: "RETURN_REQUESTED",
    REQUEST_REFUND: "RETURN_REQUESTED",
    REFUND_REQUESTED: "RETURN_REQUESTED",
    RETURN_DISPUTE: "DISPUTED",
    OPEN_DISPUTE: "DISPUTED",
    REFUND: "REFUNDED",
    REFUND_APPROVED: "REFUNDED",
    RETURN_CONFIRMED: "REFUNDED",
    CONFIRM_RETURN: "REFUNDED",
};

const KNOWN_STATUSES = new Set([
    "PENDING_PAYMENT",
    "ESCROWED",
    "ACCEPTED",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
    "RETURN_REQUESTED",
    "DISPUTED",
]);

function canonicalizeStatus(rawStatus) {
    if (!rawStatus) return null;

    const normalized = String(rawStatus).trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (!normalized) return null;

    if (KNOWN_STATUSES.has(normalized)) {
        return normalized;
    }

    if (STATUS_ALIASES[normalized]) {
        return STATUS_ALIASES[normalized];
    }

    if (normalized.includes("REFUND")) return "REFUNDED";
    if (normalized.includes("DISPUTE")) return "DISPUTED";
    if (normalized.includes("RETURN")) return "RETURN_REQUESTED";
    if (normalized.includes("CANCEL")) return "CANCELLED";
    if (normalized.includes("COMPLETE") || normalized.includes("CONFIRM_RECEIPT")) return "COMPLETED";
    if (normalized.includes("DELIVER") || normalized.includes("SHIP")) return "DELIVERED";
    if (normalized.includes("ACCEPT")) return "ACCEPTED";
    if (normalized.includes("ESCROW") || normalized.includes("CREATE")) return "ESCROWED";

    return null;
}

function normalizeHistoryEvents(rawEvents = []) {
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents
        .map((evt) => {
            const actionStatus = ACTION_TO_STATUS[String(evt?.action || "").toLowerCase()];
            const status =
                canonicalizeStatus(evt?.status) ||
                canonicalizeStatus(evt?.newStatus) ||
                canonicalizeStatus(actionStatus) ||
                canonicalizeStatus(evt?.type) ||
                "PENDING_PAYMENT";

            return {
                status,
                timestamp: evt?.timestamp || evt?.createdAt || evt?.updatedAt,
                actor: evt?.performedByName || evt?.actor || (evt?.performedBy != null ? `User #${evt.performedBy}` : undefined),
                note: evt?.note || evt?.metadata?.reason || undefined,
            };
        })
        .filter((evt) => !!evt.timestamp);
}

export async function getOrderHistoryAPI(orderId) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Không tải được chi tiết đơn hàng.");
    }

    const payload = data.data ?? {};
    const sourceTimeline = Array.isArray(payload.timeline) && payload.timeline.length > 0
        ? payload.timeline
        : payload.history;

    return {
        ...payload,
        timeline: normalizeHistoryEvents(sourceTimeline),
        isReviewed: payload.isReviewed ?? payload.reviewed ?? false,
    };
}

async function postOrderAction(orderId, endpoint, body) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/${endpoint}`, {
        method: "POST",
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Lỗi thao tác đơn hàng.");
    }
    return data.data ?? data;
}

export async function cancelOrderAPI(orderId) {
    return postOrderAction(orderId, "cancel");
}

export async function confirmReceiptAPI(orderId) {
    return postOrderAction(orderId, "confirm-receipt");
}

export async function requestReturnAPI(orderId, reason) {
    return postOrderAction(orderId, "request-return", { reason });
}

export async function openReturnDisputeAPI(orderId, payload) {
    return postOrderAction(orderId, "return-dispute", payload);
}
