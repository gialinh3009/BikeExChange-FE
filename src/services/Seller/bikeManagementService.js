import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// List all bikes (public)
export async function listBikesAPI({ page = 0, size = 20 } = {}, token) {
  const res = await fetch(`${BASE_URL}/bikes?page=${page}&size=${size}`, {
    headers: authHeader(token),
  });

  if (res.status === 403 || res.status === 404) {
    return { content: [] };
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách xe thất bại.");
  }
  
  return data.data ?? data;
}

// List seller's own bikes using seller_id param — returns ALL statuses
export async function listSellerBikesAPI({ page = 0, size = 200 } = {}, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  // Decode sellerId from JWT token
  let sellerId = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    sellerId = payload.sub || payload.userId || payload.id || null;
    // Also try from localStorage user
    if (!sellerId) {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      sellerId = user?.id ?? null;
    }
  } catch {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    sellerId = user?.id ?? null;
  }

  // Build URL: use seller_id param so BE filters server-side, get all statuses
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (sellerId) params.append("seller_id", String(sellerId));

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

  return data.data ?? data;
}

// Get bike detail
export async function getBikeDetailAPI(id, token) {
  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết xe thất bại.");
  }
  return data.data ?? data;
}

// Create bike (JSON)
export async function createBikeAPI(payload, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${BASE_URL}/bikes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new Error("Token hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.");
  }

  if (res.status === 400) {
    const data = await res.json();
    throw new Error(data.message || "Dữ liệu không hợp lệ.");
  }

  if (res.status === 403) {
    throw new Error("Bạn không có quyền đăng bài. Vui lòng nâng cấp thành Seller.");
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo xe thất bại.");
  }
  return data.data ?? data;
}

// Create bike with images (FormData)
export async function createBikeWithImagesAPI(formData, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  try {
    const res = await fetch(`${BASE_URL}/bikes/with-images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.status === 401) {
      throw new Error("Token hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.");
    }

    if (res.status === 400) {
      const data = await res.json();
      throw new Error(data.message || "Dữ liệu không hợp lệ.");
    }

    if (res.status === 403) {
      throw new Error("Bạn không có quyền đăng bài. Vui lòng nâng cấp thành Seller.");
    }

    if (res.status === 500) {
      const data = await res.json();
      throw new Error(data.message || "Lỗi server. Vui lòng thử lại.");
    }

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Tạo xe thất bại.");
    }
    return data.data ?? data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Lỗi khi tạo xe. Vui lòng thử lại.");
  }
}

// Update bike
export async function updateBikeAPI(id, payload, token) {
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

// Delete bike
export async function deleteBikeAPI(id, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${BASE_URL}/bikes/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });

  if (res.status === 401) {
    throw new Error("Token hết hạn hoặc không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.");
  }

  if (res.status === 403) {
    throw new Error("Bạn không có quyền xóa xe này.");
  }

  if (res.status === 404) {
    throw new Error("Xe không tồn tại.");
  }

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Xóa xe thất bại.");
  }

  return data;
}
