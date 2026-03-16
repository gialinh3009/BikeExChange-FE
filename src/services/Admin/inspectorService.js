import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getAdminInspectionReportsAPI({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  const res = await fetch(`${BASE_URL}/admin/inspection-reports?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách báo cáo kiểm định.");
  return data;
}

/**
 * Duyệt hoặc từ chối kết quả kiểm định
 * POST /inspections/{id}/approve?result=true|false
 */
/**
 * Lấy danh sách yêu cầu kiểm định theo trạng thái
 * GET /inspections?status=REQUESTED&page=0&size=20
 * status: REQUESTED | ASSIGNED | INSPECTED | APPROVED | REJECTED | (bỏ trống = tất cả)
 */
export async function getInspectionsByStatusAPI({ status, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (status && status !== "ALL") params.append("status", status);
  const res = await fetch(`${BASE_URL}/inspections?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách kiểm định.");
  return data;
}

export async function approveInspectionAPI(inspectionId, result) {
  const res = await fetch(`${BASE_URL}/inspections/${inspectionId}/approve?result=${result}`, {
    method: "POST",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể xử lý kiểm định.");
  return data;
}
