import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Lấy danh sách bikes của seller hiện tại
 * Backend không có API riêng, nên ta dùng GET /bikes với filter
 */
export async function listSellerBikesAPI({ status, page = 0, size = 20 } = {}, token) {
  const params = new URLSearchParams();
  
  // Backend không có filter theo seller_id trong GET /bikes
  // Nên ta phải lấy tất cả bikes và filter ở frontend
  // Hoặc dùng search với keyword rỗng
  
  if (Array.isArray(status)) {
    status.forEach((s) => params.append("status", s));
  } else if (status) {
    params.append("status", status);
  }
  params.append("page", page);
  params.append("size", size);

  const res = await fetch(`${BASE_URL}/bikes?${params.toString()}`, {
    headers: authHeader(token),
  });

  if (res.status === 403 || res.status === 404) {
    return { content: [] };
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách xe thất bại.");
  }
  
  // Backend trả về data.data (Page object)
  return data.data ?? data;
}

/**
 * Lấy chi tiết 1 bike
 */
export async function getSellerBikeAPI(id, token) {
  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết xe thất bại.");
  }
  return data.data ?? data;
}

/**
 * Tạo bike mới (đăng tin)
 * Phí: 5 điểm (backend tự động trừ)
 * Backend lấy sellerId từ token, không cần gửi trong payload
 */
export async function createSellerBikeAPI(payload, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${BASE_URL}/bikes`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });

  // Handle 401 Unauthorized
  if (res.status === 401) {
    throw new Error("Token hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.");
  }

  // Handle 400 Bad Request
  if (res.status === 400) {
    const data = await res.json();
    const errorMsg = data.message || "Dữ liệu không hợp lệ.";
    console.error("❌ 400 Bad Request:", errorMsg);
    console.error("📦 Payload:", payload);
    throw new Error(errorMsg + " Vui lòng kiểm tra lại thông tin xe.");
  }

  // Handle 403 Forbidden
  if (res.status === 403) {
    throw new Error("Bạn không có quyền đăng bài. Vui lòng nâng cấp thành Seller.");
  }

  // Handle 500 Server Error
  if (res.status === 500) {
    throw new Error("Lỗi server. Vui lòng thử lại sau.");
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo xe thất bại.");
  }
  return data.data ?? data;
}

/**
 * Cập nhật bike
 */
export async function updateSellerBikeAPI(id, payload, token) {
  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Cập nhật xe thất bại.");
  }
  return data.data ?? data;
}

/**
 * Xóa bike (soft delete - set status = CANCELLED)
 */
export async function deleteSellerBikeAPI(id, token) {
  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xóa xe thất bại.");
  }
  return data;
}
