import { BASE_URL } from "../../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Get wallet information
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

// Get wallet transactions
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

// GET /wallet/combos — danh sách gói combo tin đăng
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

// POST /wallet/buy-combo/{comboId} — mua gói combo tin đăng
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
