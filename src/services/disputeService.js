import { BASE_URL } from "../config/apiConfig";

export async function createDisputeAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/dispute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo khiếu nại thất bại.");
  }
  return data.data ?? data;
}

export async function resolveDisputeAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/admin/dispute/${id}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xử lý khiếu nại thất bại.");
  }
  return data.data ?? data;
}

