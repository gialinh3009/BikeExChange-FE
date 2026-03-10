import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── GET /wallet ────────────────────────────────────────────────────────────
export async function getWalletAPI() {
    const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const userId = user?.id ?? user?.userId;

    if (!userId) throw new Error("User not authenticated");

    const res = await fetch(`${BASE_URL}/wallet?userId=${userId}`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể lấy ví.");

    // BE trả về { data: { availablePoints, frozenPoints, userId, ... }, success: true }
    return data.data;
}

// ── GET /wallet/transactions ───────────────────────────────────────────────
export async function getTransactionsAPI(type = "") {
    const url = type ? `${BASE_URL}/wallet/transactions?type=${type}` : `${BASE_URL}/wallet/transactions`;
    const res = await fetch(url, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) {
        console.warn("Could not fetch transactions:", data.message);
        return [];
    }

    // BE trả về { data: [...], success: true, summary: {...} }
    const transactions = data.data || [];
    return Array.isArray(transactions) ? transactions : [];
}

// ── GET /vnpay/create-payment ──────────────────────────────────────────────
/**
 * Tạo link thanh toán VNPay
 * @param {number} amount - Số tiền (đơn vị VND)
 * @returns {Promise<string>} - URL thanh toán để redirect
 */
export async function createVNPayPaymentURL(amount) {
    if (!amount || amount < 10000) {
        throw new Error("Số tiền tối thiểu là 10,000đ");
    }

    const res = await fetch(`${BASE_URL}/vnpay/create-payment?amount=${amount}`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Tạo link thanh toán thất bại.");

    // BE trả về { success: true, paymentUrl: "https://sandbox.vnpayment.vn/..." }
    return data.paymentUrl;
}

// ── POST /wallet/withdraw-request ──────────────────────────────────────────
/**
 * Yêu cầu rút tiền
 * @param {Object} payload - { amount, bankName, bankAccount, accountName }
 */
export async function withdrawWalletAPI(payload) {
    const res = await fetch(`${BASE_URL}/wallet/withdraw-request`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Yêu cầu rút tiền thất bại.");

    return data.data;
}