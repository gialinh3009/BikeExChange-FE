import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminInspectorsAPI({ page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({ page, size });

  const res = await fetch(`${BASE_URL}/admin/inspectors?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách kiểm định viên.");
  return data;
}