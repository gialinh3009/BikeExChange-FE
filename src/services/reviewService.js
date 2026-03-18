import { BASE_URL } from "../config/apiConfig";

export async function createReviewAPI({ orderId, rating, comment }, token) {
  const params = new URLSearchParams();
  params.append("orderId", orderId);
  params.append("rating", rating);
  if (comment) params.append("comment", comment);

  const res = await fetch(`${BASE_URL}/reviews?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo đánh giá thất bại.");
  }
  return data.data ?? data;
}

export async function listReviewsBySellerAPI(sellerId) {
  const res = await fetch(`${BASE_URL}/reviews/seller/${sellerId}`);
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách đánh giá thất bại.");
  }
  return data.data ?? data;
}

