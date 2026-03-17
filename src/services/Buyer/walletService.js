import { BASE_URL } from "../../config/apiConfig";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/**
 * GET /wallet → { availablePoints, frozenPoints, userId }
 */
export async function getWalletAPI() {
    const res = await fetch(`${BASE_URL}/wallet`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải ví.");
    return data.data ?? data;
}

/**
 * GET /wallet/transactions?type=xxx
 * Returns { list: [], summary: { totalAmount, totalCount } }
 */
export async function getTransactionsAPI(type = "") {
    const params = new URLSearchParams();
    if (type) params.append("type", type);

    const res = await fetch(`${BASE_URL}/wallet/transactions?${params.toString()}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải lịch sử giao dịch.");

    const raw = data.data ?? data;
    const list = Array.isArray(raw)
        ? raw
        : raw?.content ?? raw?.transactions ?? raw?.items ?? [];
    const summary = {
        totalAmount: raw?.totalAmount ?? null,
        totalCount:  raw?.totalCount  ?? list.length,
    };
    return { list, summary };
}

/**
 * GET /vnpay/create-payment?amount=xxx&returnUrl=xxx
 * Returns VNPay payment URL string
 */
export async function createVNPayPaymentURL(amount) {
    const token = localStorage.getItem("token");
    const returnUrl = `${window.location.origin}/payment-success`;

    const params = new URLSearchParams({
        amount: String(amount),
        returnUrl,
    });

    const res = await fetch(`${BASE_URL}/vnpay/create-payment?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tạo link thanh toán.");

    // BE trả về { data: "https://..." } hoặc { paymentUrl: "..." } hoặc string
    return data.data ?? data.paymentUrl ?? data.url ?? data;
}

/**
 * POST /wallet/deposit — xác nhận nạp tiền sau VNPay callback
 */
export async function depositWalletAPI(amount, referenceId) {
    const res = await fetch(`${BASE_URL}/wallet/deposit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, referenceId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi xác nhận deposit.");
    return data.data ?? data;
}

/**
 * POST /wallet/withdraw-request
 */
export async function withdrawWalletAPI({ amount, bankName, bankAccount, accountName }) {
    const payload = { amount, bankName, bankAccount, accountName };

    const res = await fetch(`${BASE_URL}/wallet/withdraw-request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Không thể tạo yêu cầu rút tiền.");
    }
    return data.data ?? data;
}