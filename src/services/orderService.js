import { BASE_URL } from "../config/apiConfig";

export async function createOrderAPI({ bikeId, idempotencyKey }, token) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bikeId, idempotencyKey }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo đơn hàng thất bại.");
  }
  return data.data ?? data;
}

export async function approveOrderAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận đơn hàng thất bại.");
  }
  return data;
}

export async function getSellerSalesHistoryAPI(status, token) {
  const statusParam = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE_URL}/orders/my-sales${statusParam}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Không thể tải lịch sử bán hàng.");
  }
  return data.data || data;
}

export async function acceptOrderAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận nhận đơn thất bại.");
  }
  return data.data || data;
}

export async function deliverOrderAPI(orderId, deliveryData, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/deliver`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deliveryData),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đánh dấu gửi hàng thất bại.");
  }
  return data.data || data;
}

export async function confirmDeliveryAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/confirm-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận đã giao thất bại.");
  }
  return data.data || data;
}

export async function confirmReturnAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/confirm-return`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác nhận nhận lại hàng thất bại.");
  }
  return data.data || data;
}

export async function sellerCancelOrderAPI(orderId, token) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/seller-cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Hủy đơn hàng thất bại.");
  }
  return data.data || data;
}

