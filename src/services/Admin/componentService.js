import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Lấy danh sách components
 */
export async function getComponentsAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/components`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách components thất bại.");
  }
  return data.data ?? data;
}

/**
 * Tạo component mới
 */
export async function createComponentAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/admin/components`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo component thất bại.");
  }
  return data.data ?? data;
}

/**
 * Cập nhật component
 */
export async function updateComponentAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/admin/components/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật component thất bại.");
  }
  return data.data ?? data;
}

/**
 * Xóa component
 */
export async function deleteComponentAPI(id, token) {
  const res = await fetch(`${BASE_URL}/admin/components/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xóa component thất bại.");
  }
  return data;
}
