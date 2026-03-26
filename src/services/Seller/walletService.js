import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// GET /wallet → { availablePoints, frozenPoints, remainingFreePosts }
export async function getWalletAPI(token) {
  const res = await fetch(`${BASE_URL}/wallet`, {
    headers: authHeader(token),
  });
  if (res.status === 403 || res.status === 404) {
    return { availablePoints: 0, frozenPoints: 0, remainingFreePosts: 0 };
  }
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thông tin ví thất bại.");
  }
  return data.data ?? data;
}

// GET /wallet/transactions?userId=X
// Returns { data: PointTransactionDto[], summary: { totalCount, totalAmount, byType } }
export async function getWalletTransactionsAPI(token, userId) {
  const params = new URLSearchParams();
  if (userId != null) params.append("userId", String(userId));
  const url = params.toString()
    ? `${BASE_URL}/wallet/transactions?${params.toString()}`
    : `${BASE_URL}/wallet/transactions`;
  const res = await fetch(url, { headers: authHeader(token) });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Lấy lịch sử giao dịch thất bại.");
  }
  // Backend returns { success, data: [...], summary: { totalCount, totalAmount, byType } }
  return {
    data: Array.isArray(json.data) ? json.data : [],
    summary: json.summary ?? { totalCount: 0, totalAmount: 0, byType: {} },
  };
}

// GET /wallet/combos
export async function getCombosAPI(token) {
  const res = await fetch(`${BASE_URL}/wallet/combos`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách combo thất bại.");
  }
  return data.data ?? data;
}

// POST /wallet/buy-combo/{comboId}
export async function buyComboAPI(comboId, token) {
  const res = await fetch(`${BASE_URL}/wallet/buy-combo/${comboId}`, {
    method: "POST",
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Mua combo thất bại.");
  }
  return data.data ?? data;
}
