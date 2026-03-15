import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ===== BIKES APIs =====
export async function listBikesAPI({ page = 0, size = 20 } = {}, token) {
  const params = new URLSearchParams();
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
  
  return data.data ?? data;
}

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

export async function createBikeAPI(payload, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${BASE_URL}/bikes`, {
    method: "POST",
    headers: authHeader(token),
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

export async function deleteBikeAPI(id, token) {
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

// ===== CATEGORIES & BRANDS APIs =====
export async function getCategoriesAPI() {
  const res = await fetch(`${BASE_URL}/categories`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy danh sách danh mục thất bại.");
  }
  return data.data ?? data;
}

export async function getBrandsAPI() {
  const res = await fetch(`${BASE_URL}/brands`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy danh sách hãng xe thất bại.");
  }
  return data.data ?? data;
}

// ===== INSPECTIONS APIs =====
export async function listInspectionsAPI({ page = 0, size = 20 } = {}, token) {
  const params = new URLSearchParams();
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

  if (res.status === 403 || res.status === 404) {
    return { availablePoints: 0, frozenPoints: 0 };
  }

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
