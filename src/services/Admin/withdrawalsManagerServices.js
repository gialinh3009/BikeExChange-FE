import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getWithdrawalsAPI() {
  const res = await fetch(`${BASE_URL}/admin/withdrawals`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách rút điểm.");
  return data;
}

export async function approveWithdrawalAPI(id) {
  const res = await fetch(`${BASE_URL}/admin/withdrawals/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể duyệt yêu cầu rút điểm.");
  return data;
}

export async function rejectWithdrawalAPI(id, reason) {
  const params = new URLSearchParams({ reason });
  const res = await fetch(`${BASE_URL}/admin/withdrawals/${id}/reject?${params}`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể từ chối yêu cầu rút điểm.");
  return data;
}
