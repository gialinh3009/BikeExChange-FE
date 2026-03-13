import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getUserStatisticsAPI() {
  const res = await fetch(`${BASE_URL}/admin/statistics/users`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải thống kê người dùng.");
  return data.data;
}

export async function getRevenueStatisticsAPI() {
  const res = await fetch(`${BASE_URL}/admin/statistics/revenue`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải thống kê doanh thu.");
  return data.data;
}

export async function getOrderStatisticsAPI() {
  const res = await fetch(`${BASE_URL}/admin/statistics/orders`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải thống kê đơn hàng.");
  return data.data;
}
export async function getInspectionStatisticsAPI() {
  const res = await fetch(`${BASE_URL}/admin/statistics/inspections`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message || "Không thể tải thống kê kiểm định.");
  return data.data;
}
export async function getBikeStatisticsAPI() {
  const res = await fetch(`${BASE_URL}/admin/statistics/bikes`, {
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Không thể tải thống kê xe.");
  }

  return data.data;
}

export async function getAdminDashboardAPI() {
  const res = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: authHeaders(),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Không thể tải dữ liệu dashboard.");
  }

  return data.data;
}