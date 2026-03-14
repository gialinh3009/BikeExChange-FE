import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPendingDisputesAPI() {
  const res = await fetch(`${BASE_URL}/admin/disputes/pending`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách khiếu nại.");
  return data;
}

export async function resolveDisputeAPI(disputeId, resolution) {
  const res = await fetch(`${BASE_URL}/admin/disputes/${disputeId}/resolve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ resolution }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể xử lý khiếu nại.");
  return data;
}

export async function rejectDisputeAPI(disputeId, reason) {
  const res = await fetch(`${BASE_URL}/admin/disputes/${disputeId}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể từ chối khiếu nại.");
  return data;
}