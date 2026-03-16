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
  if (!res.ok || !data.success)
    throw new Error(data.message || "Không thể tải danh sách khiếu nại.");
  return data;
}

/**
 * Admin chấp nhận khiếu nại
 * POST /admin/dispute/{disputeId}/resolve?resolutionType=...
 */
export async function resolveDisputeAPI(disputeId, resolutionType, resolutionNote) {
  const res = await fetch(
    `${BASE_URL}/admin/dispute/${disputeId}/resolve?resolutionType=${resolutionType}`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ resolutionNote }),
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message || "Không thể xử lý khiếu nại.");
  return data;
}

/**
 * Từ chối khiếu nại (giữ nguyên từ code cũ)
 */
export async function rejectDisputeAPI(disputeId, reason) {
  const res = await fetch(`${BASE_URL}/admin/disputes/${disputeId}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message || "Không thể từ chối khiếu nại.");
  return data;
}