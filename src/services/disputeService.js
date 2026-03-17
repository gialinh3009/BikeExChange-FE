import { BASE_URL } from "../config/apiConfig";

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
 * Get dispute detail by order ID
 * GET /api/orders/{orderId}/history (returns dispute info in timeline)
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
  return data.data ?? data;
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

