import { BASE_URL } from "../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listBrandsAPI(token) {
  const res = await fetch(`${BASE_URL}/brands`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách hãng xe thất bại.");
  }
  return data.data ?? data;
}

