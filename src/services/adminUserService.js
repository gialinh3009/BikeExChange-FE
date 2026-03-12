import { BASE_URL } from "../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminUsersAPI({ page = 0, size = 10, keyword = "", role = "", status = "" } = {}) {
  const params = new URLSearchParams({ page, size });
  if (keyword) params.set("keyword", keyword);
  if (role) params.set("role", role);
  if (status) params.set("status", status);

  const res = await fetch(`${BASE_URL}/admin/users?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách người dùng.");
  return data;
}

export async function getAdminInspectorsAPI({ page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({ page, size });

  const res = await fetch(`${BASE_URL}/admin/inspectors?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch kiá»ƒm Ä‘á»‹nh viÃªn.");
  return data;
}

export async function updateUserStatusAPI(userId, status) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
  return data;
}

export async function deleteUserAPI(userId) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Xóa người dùng thất bại.");
  return data;
}

export async function getAdminDashboardAPI() {
  const res = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải dữ liệu dashboard.");
  return data.data;
}