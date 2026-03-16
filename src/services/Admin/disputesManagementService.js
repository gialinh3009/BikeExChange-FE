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

/**
 * Admin chấp nhận khiếu nại (hoàn tiền cho người mua)
 * POST /admin/dispute/{disputeId}/resolve?resolutionType=REFUND
 * Body: { resolutionNote }
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
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể xử lý khiếu nại.");
  return data;
}

