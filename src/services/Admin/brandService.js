import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Lấy danh sách brands (Admin)
 */
export async function getBrandsAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/brands`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách brands thất bại.");
  }
  return data.data ?? data;
}

/**
 * Tạo brand mới
 */
export async function createBrandAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/admin/brands`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo brand thất bại.");
  }
  return data.data ?? data;
}

/**
 * Cập nhật brand
 */
export async function updateBrandAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/admin/brands/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật brand thất bại.");
  }
  return data.data ?? data;
}

/**
 * Xóa brand
 */
export async function deleteBrandAPI(id, token) {
  const res = await fetch(`${BASE_URL}/admin/brands/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xóa brand thất bại.");
  }
  return data;
}
