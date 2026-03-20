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

/**
 * Tạo tài khoản kiểm định viên
 * POST /admin/inspectors/create
 */
export async function createInspectorAPI({ email, password, fullName, phone, address }) {
  const res = await fetch(`${BASE_URL}/admin/inspectors/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password, fullName, phone, address }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Tạo tài khoản kiểm định viên thất bại.");
  return data;
}

/**
 * Khóa tài khoản người dùng
 * POST /admin/users/{userId}/lock?reason=...
 */
export async function lockUserAPI(userId, reason) {
  const params = new URLSearchParams();
  if (reason) params.set("reason", reason);
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/lock?${params}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Khóa tài khoản thất bại.");
  return data;
}

/**
 * Mở khóa tài khoản người dùng
 * POST /admin/users/{userId}/unlock
 */
export async function unlockUserAPI(userId) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/unlock`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Mở khóa tài khoản thất bại.");
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

