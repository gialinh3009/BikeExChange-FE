import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// List inspections
export async function listInspectionsAPI({ page = 0, size = 20 } = {}, token) {
  const res = await fetch(`${BASE_URL}/inspections?page=${page}&size=${size}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách kiểm định thất bại.");
  }
  return data.data ?? data;
}

// Request inspection
export async function requestInspectionAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/inspections`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Yêu cầu kiểm định thất bại.");
  }
  return data.data ?? data;
}

// Get inspection detail
export async function getInspectionDetailAPI(id, token) {
  const res = await fetch(`${BASE_URL}/inspections/${id}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết kiểm định thất bại.");
  }
  return data.data ?? data;
}

// Get inspection report for a bike
export async function getInspectionReportAPI(bikeId, token) {
  const res = await fetch(`${BASE_URL}/inspections/bikes/${bikeId}/report`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy báo cáo kiểm định thất bại.");
  }
  return data.data ?? data;
}
