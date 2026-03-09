import { BASE_URL } from "../config/apiConfig";

export async function createOrderAPI({ bikeId, idempotencyKey }, token) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bikeId, idempotencyKey }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo đơn hàng thất bại.");
  }
  return data.data ?? data;
}

export async function approveOrderAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận đơn hàng thất bại.");
  }
  return data;
}

