import { BASE_URL } from "../config/apiConfig";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getWalletAPI({ userId, token } = {}) {
  const params = new URLSearchParams();
  if (!token && userId != null) {
    params.append("userId", userId);
  }
  const url = params.toString()
    ? `${BASE_URL}/wallet?${params.toString()}`
    : `${BASE_URL}/wallet`;

  const res = await fetch(url, {
    headers: authHeaders(token),
  });

  // Khi BE chưa bật đầy đủ auth hoặc user chưa có ví, có thể trả 403/404.
  // Để tránh vỡ màn hình, fallback về ví 0 điểm.
  if (res.status === 403 || res.status === 404) {
    return { availablePoints: 0, frozenPoints: 0 };
  }

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thông tin ví thất bại.");
  }
  return data.data ?? data;
}

export async function getWalletTransactionsAPI({ userId, type, token } = {}) {
  const params = new URLSearchParams();
  if (!token && userId != null) {
    params.append("userId", userId);
  }
  if (Array.isArray(type)) {
    type.forEach((t) => params.append("type", t));
  } else if (type) {
    params.append("type", type);
  }
  const url = params.toString()
    ? `${BASE_URL}/wallet/transactions?${params.toString()}`
    : `${BASE_URL}/wallet/transactions`;

  const res = await fetch(url, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy lịch sử giao dịch ví thất bại.");
  }
  return data;
}

export async function depositWalletAPI({ amount, referenceId }, token) {
  const res = await fetch(`${BASE_URL}/wallet/deposit`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ amount, referenceId }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Nạp điểm thất bại.");
  }
  return data.data ?? data;
}

export async function requestWithdrawAPI(
  { amount, bankName, bankAccountName, bankAccountNumber },
  token
) {
  const res = await fetch(`${BASE_URL}/wallet/withdraw-request`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      amount,
      bankName,
      bankAccountName,
      bankAccountNumber,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Yêu cầu rút điểm thất bại.");
  }
  return data.data ?? data;
}

