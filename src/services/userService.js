import { BASE_URL } from "../config/apiConfig";

export async function getUserByIdAPI(userId, token) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lấy thông tin người dùng thất bại.");
  return data;
}

export async function getUserByEmailAPI(email, token) {
  const res = await fetch(`${BASE_URL}/users/email/${encodeURIComponent(email)}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lấy thông tin người dùng theo email thất bại.");
  return data;
}

export async function updateUserAPI(userId, payload, token) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Cập nhật người dùng thất bại.");
  return data;
}

export async function adminVerifyUserAPI(userId, token) {
  const res = await fetch(`${BASE_URL}/users/${userId}/verify`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Xác minh người dùng thất bại.");
  return data;
}

export async function getUserStatsAPI(userId, token) {
  const res = await fetch(`${BASE_URL}/users/${userId}/stats`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lấy thống kê người dùng thất bại.");
  return data;
}

export async function upgradeToSellerAPI(userId, payload, token) {
  const res = await fetch(`${BASE_URL}/users/${userId}/upgrade-to-seller`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Nâng cấp lên người bán thất bại.");
  return data;
}

