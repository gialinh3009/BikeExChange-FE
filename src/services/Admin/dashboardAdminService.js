import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Lấy thống kê tổng quan
 */
export async function getOverviewStatisticsAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/dashboard/overview`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thống kê tổng quan thất bại.");
  }
  return data.data ?? data;
}

/**
 * Lấy thống kê người dùng
 */
export async function getUserStatisticsAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/dashboard/users`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thống kê người dùng thất bại.");
  }
  return data.data ?? data;
}

/**
 * Lấy thống kê doanh thu
 */
export async function getRevenueStatisticsAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/dashboard/revenue`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thống kê doanh thu thất bại.");
  }
  return data.data ?? data;
}

/**
 * Lấy thống kê đơn hàng
 */
export async function getOrderStatisticsAPI(token) {
  const res = await fetch(`${BASE_URL}/admin/dashboard/orders`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thống kê đơn hàng thất bại.");
  }
  return data.data ?? data;
}
