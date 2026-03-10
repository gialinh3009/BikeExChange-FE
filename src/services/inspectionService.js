import { BASE_URL } from "../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listInspectionsAPI(filters = {}, token) {
  const {
    bike_id,
    sellerId,
    inspector_id,
    status,
    date_from,
    date_to,
    page = 0,
    size = 20,
  } = filters;

  const params = new URLSearchParams();
  if (bike_id != null) params.append("bike_id", bike_id);
  if (sellerId != null) params.append("sellerId", sellerId);
  if (inspector_id != null) params.append("inspector_id", inspector_id);
  if (status) params.append("status", status);
  if (date_from) params.append("date_from", date_from);
  if (date_to) params.append("date_to", date_to);
  params.append("page", page);
  params.append("size", size);

  const res = await fetch(`${BASE_URL}/inspections?${params.toString()}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách kiểm định thất bại.");
  }
  return data.data ?? data;
}

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

export async function updateInspectionStatusAPI(id, newStatus, token) {
  const params = new URLSearchParams();
  params.append("status", newStatus);
  const res = await fetch(`${BASE_URL}/inspections/${id}?${params.toString()}`, {
    method: "PUT",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật trạng thái kiểm định thất bại.");
  }
  return data.data ?? data;
}

export async function submitInspectionReportAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/inspections/${id}/report`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Gửi báo cáo kiểm định thất bại.");
  }
  return data.data ?? data;
}

export async function approveInspectionAPI(id, token) {
  const res = await fetch(`${BASE_URL}/inspections/${id}/approve`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Duyệt kiểm định thất bại.");
  }
  return data.data ?? data;
}

