import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getBrandsAPI() {
  const res = await fetch(`${BASE_URL}/brands`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách thương hiệu.");
  return data;
}

export async function createBrandAPI({ name, description }) {
  const res = await fetch(`${BASE_URL}/brands`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Tạo thương hiệu thất bại.");
  return data;
}

export async function updateBrandAPI(brandId, { name, description }) {
  const res = await fetch(`${BASE_URL}/brands/${brandId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật thương hiệu thất bại.");
  return data;
}

export async function deleteBrandAPI(brandId) {
  const res = await fetch(`${BASE_URL}/brands/${brandId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Xóa thương hiệu thất bại.");
  return data;
}
