import { BASE_URL } from "../../config/apiConfig";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── POST /orders ───────────────────────────────────────────────────────────
/**
 * Create a new order (buy a bike)
 * @param {Object} payload - { bikeId, idempotencyKey? }
 * @returns {Promise<Object>} - Order data
 */
export async function createOrderAPI(payload) {
    const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Tạo đơn hàng thất bại.");
    }

    // BE trả về { data: { id, bikeId, buyerId, amountPoints, status, ... }, success: true }
    return data.data;
}

// ── POST /orders/{id}/approve ──────────────────────────────────────────────
/**
 * Approve an order (buyer confirms payment)
 * @param {number} orderId
 * @returns {Promise<Object>}
 */
export async function approveOrderAPI(orderId) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/approve`, {
        method: "POST",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Phê duyệt đơn hàng thất bại.");
    }

    return data.data;
}

// ── GET /orders (list user's orders) ───────────────────────────────────────
/**
 * Get all orders for the current user
 * @param {Object} params - { status?, page?, size? }
 */
export async function getOrdersAPI(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.status) searchParams.append("status", params.status);
    if (params.page !== undefined) searchParams.append("page", String(params.page));
    if (params.size !== undefined) searchParams.append("size", String(params.size));

    // Note: BE API docs don't list a GET /orders endpoint for listing
    // This may need to be adapted based on actual BE implementation
    // Or you could fetch from /wallet or a dedicated endpoint

    const res = await fetch(`${BASE_URL}/orders?${searchParams.toString()}`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        console.warn("Could not fetch orders list:", data.message);
        return { content: [], pageable: { pageNumber: 0, pageSize: 20 } };
    }

    return data.data || data;
}

// ── GET /orders/:id (not in docs, but useful) ──────────────────────────────
/**
 * Get order details
 * @param {number} orderId
 */
export async function getOrderAPI(orderId) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Không thể tải chi tiết đơn hàng.");
    }

    return data.data;
}