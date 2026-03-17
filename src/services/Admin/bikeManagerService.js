import { BASE_URL } from "../../config/apiConfig";
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}


/**
 * Lấy danh sách xe đạp
 * GET /bikes?page=0&size=20
 */
export async function getBikesAPI({ page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page, size });
  const res = await fetch(`${BASE_URL}/bikes?${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải danh sách xe đạp.");
  return data;
}


/**
 * Xem chi tiết xe đạp
 * GET /bikes/{id}
 */
export async function getBikeDetailAPI(id) {
  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải thông tin xe đạp.");
  return data;
}


/**
 * Xóa xe đạp
 * DELETE /bikes/{id}
 */
export async function deleteBikeAPI(id) {
  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể xóa xe đạp.");
  return data;
}



