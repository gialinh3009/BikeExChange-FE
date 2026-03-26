import { BASE_URL } from "../../config/apiConfig";
 
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
 
// Lấy danh sách inspection (có phân trang, lọc theo status nếu có)
export async function getInspectionsAPI(page = 0, size = 20, status = null) {
  const params = new URLSearchParams({ page, size });
  if (status) params.append("status", status);
  const res = await fetch(`${BASE_URL}/inspections?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách kiểm định.");
  return data;
}
 
// Lấy danh sách inspection theo status (backward compat)
export async function getInspectionsByStatusAPI(status, page = 0, size = 20) {
  return getInspectionsAPI(page, size, status);
}


// Cập nhật trạng thái inspection: ASSIGNED | REQUESTED | REJECTED
export async function updateInspectionStatusAPI(id, status) {
  const res = await fetch(`${BASE_URL}/inspections/${id}?status=${status}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật trạng thái kiểm định.");
  return data;
}
// Từ chối inspection với lý do
export async function rejectInspectionAPI(id, reason) {
  const res = await fetch(`${BASE_URL}/inspections/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể từ chối kiểm định.");
  return data;
}


// Tạo báo cáo kiểm định cho một inspection
export async function createInspectionReportAPI(inspectionId, reportData) {
  const res = await fetch(`${BASE_URL}/inspections/${inspectionId}/report`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(reportData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tạo báo cáo kiểm định.");
  return data;
}

