import { BASE_URL } from "../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listSellerPostsAPI({ status, page = 0, size = 20 } = {}, token) {
  const params = new URLSearchParams();
  if (Array.isArray(status)) {
    status.forEach((s) => params.append("status", s));
  } else if (status) {
    params.append("status", status);
  }
  params.append("page", page);
  params.append("size", size);

  const res = await fetch(`${BASE_URL}/seller/posts?${params.toString()}`, {
    headers: authHeader(token),
  });

  // BE cho path này chưa hoàn chỉnh / bị chặn bởi security.
  // Nếu 403 / 404 thì trả về danh sách rỗng thay vì throw lỗi làm vỡ UI.
  if (res.status === 403 || res.status === 404) {
    return { content: [] };
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách bài đăng người bán thất bại.");
  }
  return data.data ?? data;
}

export async function getSellerPostAPI(id, token) {
  const res = await fetch(`${BASE_URL}/seller/posts/${id}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết bài đăng thất bại.");
  }
  return data.data ?? data;
}

export async function createSellerPostAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/seller/posts`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo bài đăng thất bại.");
  }
  return data.data ?? data;
}

export async function updateSellerPostAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/seller/posts/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật bài đăng thất bại.");
  }
  return data.data ?? data;
}

export async function deleteSellerPostAPI(id, token) {
  const res = await fetch(`${BASE_URL}/seller/posts/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Huỷ bài đăng thất bại.");
  }
  return data;
}

