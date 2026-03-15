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
    request_return: "RETURN_REQUESTED",
    return_dispute: "DISPUTED",
    seller_cancel: "CANCELLED",
    cancel: "CANCELLED",
    refunded: "REFUNDED",
};

function normalizeHistoryEvents(rawEvents = []) {
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents
        .map((evt) => {
            const status = evt?.status || ACTION_TO_STATUS[String(evt?.action || "").toLowerCase()] || "ESCROWED";
            return {
                status,
                timestamp: evt?.timestamp,
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
    return {
        ...payload,
        timeline: Array.isArray(payload.timeline)
            ? payload.timeline
            : normalizeHistoryEvents(payload.history),
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

export async function openReturnDisputeAPI(orderId) {
    return postOrderAction(orderId, "return-dispute");
}
