import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Lấy danh sách inspectors (Admin)
 */
export async function getAdminInspectorsAPI(params = {}, token) {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append("page", params.page);
  if (params.size !== undefined) queryParams.append("size", params.size);
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);

  const res = await fetch(`${BASE_URL}/admin/inspectors?${queryParams.toString()}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách inspectors thất bại.");
  }
  return data.data ?? data;
}

/**
 * Lấy chi tiết inspector
 */
export async function getInspectorDetailAPI(id, token) {
  const res = await fetch(`${BASE_URL}/admin/inspectors/${id}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết inspector thất bại.");
  }
  return data.data ?? data;
}

/**
 * Cập nhật trạng thái inspector
 */
export async function updateInspectorStatusAPI(id, status, token) {
  const res = await fetch(`${BASE_URL}/admin/inspectors/${id}/status`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật trạng thái inspector thất bại.");
  }
  return data.data ?? data;
}
