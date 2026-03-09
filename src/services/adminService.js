import { BASE_URL } from "../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getAdminDashboardAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy số liệu dashboard thất bại.");
  }
  return data.data ?? data;
}

export async function getWithdrawalsAPI({ status } = {}, token) {
  const params = new URLSearchParams();
  if (Array.isArray(status)) {
    status.forEach((s) => params.append("status", s));
  } else if (status) {
    params.append("status", status);
  }
  const url = params.toString()
    ? `${BASE_URL}/admin/withdrawals?${params.toString()}`
    : `${BASE_URL}/admin/withdrawals`;

  const res = await fetch(url, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách yêu cầu rút tiền thất bại.");
  }
  return data.data ?? data;
}

export async function approveWithdrawalAPI(transactionId, token) {
  const res = await fetch(`${BASE_URL}/admin/withdrawals/${transactionId}/approve`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Duyệt rút tiền thất bại.");
  }
  return data;
}

export async function rejectWithdrawalAPI(transactionId, reason, token) {
  const params = new URLSearchParams();
  if (reason) params.append("reason", reason);
  const res = await fetch(
    `${BASE_URL}/admin/withdrawals/${transactionId}/reject?${params.toString()}`,
    {
      method: "POST",
      headers: authHeader(token),
    }
  );
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Từ chối rút tiền thất bại.");
  }
  return data;
}

export async function listUsersAdminAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách người dùng thất bại.");
  }
  return data.data ?? data;
}

export async function changeUserRoleAdminAPI(userId, role, token) {
  const params = new URLSearchParams();
  params.append("role", role);
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/role?${params.toString()}`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đổi quyền người dùng thất bại.");
  }
  return data.data ?? data;
}

export async function changeUserStatusAdminAPI(userId, status, token) {
  const params = new URLSearchParams();
  params.append("status", status);
  const res = await fetch(
    `${BASE_URL}/admin/users/${userId}/status?${params.toString()}`,
    {
      method: "POST",
      headers: authHeader(token),
    }
  );
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đổi trạng thái người dùng thất bại.");
  }
  return data.data ?? data;
}

export async function createInspectorAdminAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/admin/inspectors/create`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo tài khoản kiểm định viên thất bại.");
  }
  return data.data ?? data;
}

export async function approvePostAdminAPI(postId, token) {
  const res = await fetch(`${BASE_URL}/admin/posts/${postId}/approve`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Duyệt bài đăng thất bại.");
  }
  return data.data ?? data;
}

export async function rejectPostAdminAPI(postId, reason, token) {
  const params = new URLSearchParams();
  if (reason) params.append("reason", reason);
  const res = await fetch(
    `${BASE_URL}/admin/posts/${postId}/reject?${params.toString()}`,
    {
      method: "POST",
      headers: authHeader(token),
    }
  );
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Từ chối bài đăng thất bại.");
  }
  return data.data ?? data;
}

