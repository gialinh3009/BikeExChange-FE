import { BASE_URL } from "../../config/apiConfig";

// Get all categories
export async function getCategoriesAPI() {
  const res = await fetch(`${BASE_URL}/categories`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy danh sách danh mục thất bại.");
  }
  return data.data ?? data;
}

// Get all brands
export async function getBrandsAPI() {
  const res = await fetch(`${BASE_URL}/brands`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy danh sách hãng xe thất bại.");
  }
  return data.data ?? data;
}
