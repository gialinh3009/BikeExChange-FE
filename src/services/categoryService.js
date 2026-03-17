import { BASE_URL } from "../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res, fallback) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 403) throw new Error("Truy cập bị từ chối (403 Access Denied).");
  throw new Error(data.message || fallback);
}

export async function getCategoriesAPI({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  const res = await fetch(`${BASE_URL}/categories?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, "Không thể tải danh sách danh mục.");
  return res.json();
}

// Alias for compatibility
export const listCategoriesAPI = getCategoriesAPI;

export async function createCategoryAPI(payload) {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res, "Tạo danh mục thất bại.");
  return res.json();
}

export async function updateCategoryAPI(id, payload) {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res, "Cập nhật danh mục thất bại.");
  return res.json();
}

export async function deleteCategoryAPI(id) {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: { accept: "*/*" },
  });
  if (!res.ok) await parseError(res, "Xóa danh mục thất bại.");
  return true;
}