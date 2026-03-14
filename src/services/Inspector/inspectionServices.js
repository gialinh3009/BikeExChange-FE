import { BASE_URL } from "../../config/apiConfig";
 
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
 
// Lấy danh sách inspection (có phân trang)
export async function getInspectionsAPI(page = 0, size = 20) {
  const res = await fetch(`${BASE_URL}/inspections?page=${page}&size=${size}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách kiểm định.");
  return data;
}

export async function getInspectionsByStatusAPI(status, page = 0, size = 20) {
  const res = await fetch(`${BASE_URL}/inspections?status=${status}&page=${page}&size=${size}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách kiểm định.");
  return data;
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