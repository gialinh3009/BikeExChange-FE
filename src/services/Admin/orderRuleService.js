import { BASE_URL } from "../../config/apiConfig";
function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
export async function getOrderRulesAPI() {
  const res = await fetch(`${BASE_URL}/admin/order-rules`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải cấu hình đơn hàng.");
  return data.data;
}
export async function updateSellerUpgradeFeeAPI(sellerUpgradeFee) {
  const res = await fetch(`${BASE_URL}/admin/order-rules/seller-upgrade-fee?sellerUpgradeFee=${sellerUpgradeFee}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật phí nâng cấp tài khoản.");
  return data.data;
}


export async function updateInspectionFeeAPI(inspectionFee) {
  const res = await fetch(`${BASE_URL}/admin/order-rules/inspection-fee?inspectionFee=${inspectionFee}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật phí kiểm định.");
  return data.data;
}


export async function updateBikePostFeeAPI(bikePostFee) {
  const res = await fetch(`${BASE_URL}/admin/order-rules/bike-post-fee?bikePostFee=${bikePostFee}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật phí đăng xe.");
  return data.data;
}


export async function updateCommissionRateAPI(commissionRate) {
  const res = await fetch(`${BASE_URL}/admin/order-rules/commission-rate?commissionRate=${commissionRate}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật tỷ lệ hoa hồng.");
  return data.data;
}



// API mới: cập nhật thời gian hoàn trả theo ngày, giờ, phút
export async function updateReturnWindow({ days, hours, minutes }) {
  const params = [];
  if (days !== undefined) params.push(`returnWindowDays=${days}`);
  if (hours !== undefined) params.push(`returnWindowHours=${hours}`);
  if (minutes !== undefined) params.push(`returnWindowMinutes=${minutes}`);
  const query = params.length ? `?${params.join("&")}` : "";
  const res = await fetch(`${BASE_URL}/admin/order-rules/return-window${query}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Không thể cập nhật thời gian hoàn trả.");
  return data.data;
}



