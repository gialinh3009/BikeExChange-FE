import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getComponentsAPI() {
  const res = await fetch(`${BASE_URL}/admin/components`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách linh kiện.");
  return data;
}

export async function createComponentAPI({ name, description }) {
  const res = await fetch(`${BASE_URL}/admin/components`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Tạo linh kiện thất bại.");
  return data;
}

export async function updateComponentAPI(componentId, { name, description }) {
  const res = await fetch(`${BASE_URL}/admin/components/${componentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật linh kiện thất bại.");
  return data;
}

export async function deleteComponentAPI(componentId) {
  const res = await fetch(`${BASE_URL}/admin/components/${componentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Xóa linh kiện thất bại.");
  return data;
}