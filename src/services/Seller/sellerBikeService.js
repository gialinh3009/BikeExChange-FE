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

  // Kiểm tra nếu payload là FormData (có file)
  const isFormData = payload instanceof FormData;
  
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  if (isFormData) {
    // Không set Content-Type khi gửi FormData, browser sẽ tự set
    options.body = payload;
  } else {
    // Gửi JSON thường
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(payload);
  }

  const res = await fetch(`${BASE_URL}/bikes`, options);

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

// ===== CATEGORY & BRAND APIs =====
export async function listCategoriesAPI(token) {
  const res = await fetch(`${BASE_URL}/categories`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách danh mục thất bại.");
  }
  return data.data ?? data;
}

export async function listBrandsAPI(token) {
  const res = await fetch(`${BASE_URL}/brands`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách thương hiệu thất bại.");
  }
  return data.data ?? data;
}

// ===== ORDER APIs =====
export async function getPendingConfirmationsAPI(token) {
  const res = await fetch(`${BASE_URL}/orders/pending-confirmations`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách đơn chờ xác nhận thất bại.");
  }
  return data.data ?? data;
}

export async function getSellerSalesAPI(status, token) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  
  const res = await fetch(`${BASE_URL}/orders/my-sales?${params.toString()}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy lịch sử bán hàng thất bại.");
  }
  return data.data ?? data;
}

export async function acceptOrderAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/accept`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận đơn thất bại.");
  }
  return data.data ?? data;
}

export async function deliverOrderAPI(orderId, payload, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/deliver`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đánh dấu giao hàng thất bại.");
  }
  return data.data ?? data;
}

export async function confirmReturnAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/confirm-return`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận nhận hàng trả thất bại.");
  }
  return data.data ?? data;
}

export async function cancelOrderAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Hủy đơn thất bại.");
  }
  return data.data ?? data;
}

export async function getOrderHistoryAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy lịch sử đơn thất bại.");
  }
  return data.data ?? data;
}

// ===== INSPECTION APIs =====
export async function listInspectionsAPI(sellerId, token) {
  const res = await fetch(`${BASE_URL}/inspections`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách kiểm định thất bại.");
  }
  return data.data ?? data;
}

export async function getInspectionDetailAPI(inspectionId, token) {
  const res = await fetch(`${BASE_URL}/inspections/${inspectionId}`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy chi tiết kiểm định thất bại.");
  }
  return data.data ?? data;
}

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

// ===== WALLET APIs =====
export async function getWalletAPI(token) {
  const res = await fetch(`${BASE_URL}/wallet`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thông tin ví thất bại.");
  }
  return data.data ?? data;
}

export async function getWalletTransactionsAPI(token) {
  const res = await fetch(`${BASE_URL}/wallet/transactions`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy lịch sử giao dịch thất bại.");
  }
  return data.data ?? data;
}

export async function requestWithdrawAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/wallet/withdraw-request`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Yêu cầu rút tiền thất bại.");
  }
  return data.data ?? data;
}
