import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/** POST /orders — tạo đơn mua xe */
export async function createOrderAPI(bikeId) {
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res  = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ bikeId, idempotencyKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Đặt mua thất bại.");
    return data.data ?? data;
}

/** POST /orders/{id}/approve */
export async function approveOrderAPI(orderId) {
    const res  = await fetch(`${BASE_URL}/orders/${orderId}/approve`, {
        method: "POST",
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Xác nhận thất bại.");
    return data.data ?? data;
}