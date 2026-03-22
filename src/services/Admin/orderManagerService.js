import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminOrdersAPI() {
  const res = await fetch(`${BASE_URL}/admin/orders`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách đơn hàng.");
  return data;
}

export async function getOrderRulesAPI() {
  const res = await fetch(`${BASE_URL}/admin/order-rules`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải cấu hình order.");
  return data?.data ?? data;
}

export async function updateOrderRulesAPI(payload) {
  const res = await fetch(`${BASE_URL}/admin/order-rules`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật cấu hình order.");
  return data?.data ?? data;
}
