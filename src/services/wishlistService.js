import { BASE_URL } from "../config/apiConfig";

export async function getWishlistAPI(token) {
  const res = await fetch(`${BASE_URL}/wishlist`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách yêu thích thất bại.");
  }
  return data.data ?? data;
}

export async function addToWishlistAPI(bikeId, token) {
  const params = new URLSearchParams();
  params.append("bikeId", bikeId);
  const res = await fetch(`${BASE_URL}/wishlist?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Thêm vào yêu thích thất bại.");
  }
  return data;
}

export async function removeFromWishlistAPI(bikeId, token) {
  const res = await fetch(`${BASE_URL}/wishlist/${bikeId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 404) {
    throw new Error("Mục yêu thích không tồn tại.");
  }
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xoá khỏi yêu thích thất bại.");
  }
  return data;
}

