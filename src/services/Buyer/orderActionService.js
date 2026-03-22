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
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    completed: "COMPLETED",
    confirmed_receipt: "COMPLETED",
    confirm_receipt: "COMPLETED",
    confirm_return: "REFUNDED",
    request_return: "RETURN_REQUESTED",
    return_requested: "RETURN_REQUESTED",
    return_dispute: "DISPUTED",
    open_dispute: "DISPUTED",
    disputed: "DISPUTED",
    seller_cancel: "CANCELLED",
    seller_cancelled: "CANCELLED",
    cancelled: "CANCELLED",
    cancel: "CANCELLED",
    refunded: "REFUNDED",
};

const STATUS_ALIASES = {
    CREATED: "ESCROWED",
    ORDER_CREATED: "ESCROWED",
    ESCROW: "ESCROWED",
    ACCEPT: "ACCEPTED",
    ACCEPT_ORDER: "ACCEPTED",
    SHIPPING: "SHIPPED",
    SHIP: "SHIPPED",
    IN_TRANSIT: "SHIPPED",
    SHIPPED: "SHIPPED",
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
    "SHIPPED",
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
    if (normalized.includes("SHIP") || normalized.includes("TRANSIT")) return "SHIPPED";
    if (normalized.includes("DELIVER")) return "DELIVERED";
    if (normalized.includes("ACCEPT")) return "ACCEPTED";
    if (normalized.includes("ESCROW") || normalized.includes("CREATE")) return "ESCROWED";

    return null;
}

function normalizeHistoryEvents(rawEvents = []) {
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents
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
                } catch {
                    note = evt.metadata;
                }
            }

            return {
                status,
                timestamp: evt?.timestamp || evt?.createdAt || evt?.updatedAt,
                actor: evt?.performedByName || evt?.actor || (evt?.performedBy != null ? `User #${evt.performedBy}` : undefined),
                note: note || undefined,
            };
        })
        .filter((evt) => !!evt.timestamp);
}

function ensureCurrentStatusInTimeline(timeline, order = {}) {
    const currentStatus = canonicalizeStatus(order?.status);
    if (!currentStatus || currentStatus === "ESCROWED") return timeline;

    const hasStatus = timeline.some((evt) => canonicalizeStatus(evt?.status) === currentStatus);
    if (hasStatus) return timeline;

    const timestamp = order?.updatedAt || order?.deliveredAt || order?.acceptedAt || order?.createdAt || new Date().toISOString();
    const statusNoteMap = {
        RETURN_REQUESTED: "Người mua đã gửi yêu cầu hoàn hàng.",
        DISPUTED: "Đơn hàng đã được mở tranh chấp và đang chờ Admin xử lý.",
        REFUNDED: "Đơn hàng đã được hoàn tiền.",
        CANCELLED: "Đơn hàng đã bị hủy.",
        COMPLETED: "Giao dịch đã hoàn tất.",
    };

    return [
        ...timeline,
        {
            status: currentStatus,
            timestamp,
            actor: "Hệ thống",
            note: statusNoteMap[currentStatus],
        },
    ];
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

    const normalizedTimeline = normalizeHistoryEvents(sourceTimeline);
    const timeline = ensureCurrentStatusInTimeline(normalizedTimeline, payload?.order)
        .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

    return {
        ...payload,
        timeline,
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
