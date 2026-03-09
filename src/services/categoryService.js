import { BASE_URL } from "../config/apiConfig";

export async function listCategoriesAPI({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("size", size);

  const res = await fetch(`${BASE_URL}/categories?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách danh mục thất bại.");
  }
  return data.data ?? data;
}

export async function createCategoryAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo danh mục thất bại.");
  }
  return data.data ?? data;
}

export async function updateCategoryAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật danh mục thất bại.");
  }
  return data.data ?? data;
}

export async function deleteCategoryAPI(id, token) {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 404) {
    throw new Error("Danh mục không tồn tại.");
  }
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xoá danh mục thất bại.");
  }
  return data;
}

export async function listBikesByCategoryAPI(id, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("size", size);

  const res = await fetch(`${BASE_URL}/categories/${id}/bikes?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách xe theo danh mục thất bại.");
  }
  return data.data ?? data;
}

