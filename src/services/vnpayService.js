import { BASE_URL } from "../config/apiConfig";

export async function createVnPayPaymentURLAPI(amount, token) {
  const params = new URLSearchParams();
  params.append("amount", amount);

  const res = await fetch(`${BASE_URL}/vnpay/create-payment?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo URL thanh toán VNPay thất bại.");
  }
  return data.paymentUrl ?? data;
}

