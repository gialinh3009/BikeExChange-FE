import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(res, fallbackMessage) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || fallbackMessage);
  }
  return data.data;
}

export async function getAdminCombosAPI() {
  const res = await fetch(`${BASE_URL}/admin/listing-combos`, {
    headers: authHeaders(),
  });
  return parseResponse(res, "Không thể tải danh sách combo.");
}

export async function createAdminComboAPI(payload) {
  const res = await fetch(`${BASE_URL}/admin/listing-combos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res, "Không thể tạo combo.");
}

export async function updateAdminComboAPI(id, payload) {
  const res = await fetch(`${BASE_URL}/admin/listing-combos/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(res, "Không thể cập nhật combo.");
}

export async function deactivateAdminComboAPI(id) {
  const res = await fetch(`${BASE_URL}/admin/listing-combos/${id}/deactivate`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return parseResponse(res, "Không thể ngừng kích hoạt combo.");
}

export async function deleteAdminComboAPI(id) {
  const res = await fetch(`${BASE_URL}/admin/listing-combos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await parseResponse(res, "Không thể xóa combo.");
  return true;
}
