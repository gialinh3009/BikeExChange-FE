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

// Get inspection detail for a specific bike (by bikeId)
// Fetches all inspections for this bike, picks the active one
// (REQUESTED > ASSIGNED > IN_PROGRESS > INSPECTED > APPROVED > REJECTED)
export async function getInspectionDetailByBikeIdAPI(bikeId, token) {
  const res = await fetch(`${BASE_URL}/inspections?page=0&size=200`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách kiểm định thất bại.");
  }

  const pageData = data.data ?? data;
  const items = pageData?.content ?? (Array.isArray(pageData) ? pageData : []);

  // Filter all inspections for this bike
  const bikeInspections = items.filter((i) => Number(i.bikeId) === Number(bikeId));
  if (bikeInspections.length === 0) {
    throw new Error("Chưa có yêu cầu kiểm định cho xe này.");
  }

  // Priority order: pick the most relevant active inspection
  const STATUS_PRIORITY = ["REQUESTED", "ASSIGNED", "IN_PROGRESS", "INSPECTED", "APPROVED", "REJECTED"];
  const sorted = [...bikeInspections].sort((a, b) => {
    const pa = STATUS_PRIORITY.indexOf(a.status ?? "REJECTED");
    const pb = STATUS_PRIORITY.indexOf(b.status ?? "REJECTED");
    if (pa !== pb) return pa - pb;
    // Same status: pick newest
    return (b.id ?? 0) - (a.id ?? 0);
  });
  const match = sorted[0];

  // Fetch full detail (inspection + report + history)
  const detailRes = await fetch(`${BASE_URL}/inspections/${match.id}`, {
    headers: authHeader(token),
  });
  const detailData = await detailRes.json();
  if (!detailRes.ok || detailData.success === false) {
    throw new Error(detailData.message || "Lấy chi tiết kiểm định thất bại.");
  }
  return detailData.data ?? detailData;
}

// Cancel inspection request (Seller) - only allowed when status is REQUESTED
export async function cancelInspectionAPI(inspectionId, token) {
  const res = await fetch(`${BASE_URL}/inspections/${inspectionId}/cancel`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Hủy yêu cầu kiểm định thất bại.");
  }
  return data.data ?? data;
}

// Update inspection request info (Seller) - only allowed when status is REQUESTED
export async function updateInspectionAPI(inspectionId, payload, token) {
  const res = await fetch(`${BASE_URL}/inspections/${inspectionId}/edit`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật yêu cầu kiểm định thất bại.");
  }
  return data.data ?? data;
}
