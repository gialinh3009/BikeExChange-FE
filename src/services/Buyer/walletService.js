import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        "accept": "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
};

const getUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        return user?.id ?? user?.userId ?? null;
    } catch { return null; }
};

/**
 * GET /wallet?userId=xxx
 * Returns: { data: { availablePoints, frozenPoints, user, ... }, success }
 */
export async function getWalletAPI() {
    const userId = getUserId();
    const url = userId ? `${BASE_URL}/wallet?userId=${userId}` : `${BASE_URL}/wallet`;
    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể lấy thông tin ví.");
    return data.data; // { availablePoints, frozenPoints, user, ... }
}

/**
 * GET /wallet/transactions?userId=xxx&type=DEPOSIT|WITHDRAW
 * Returns: { data: [...], summary: { totalAmount, totalCount, byType } }
 */
export async function getTransactionsAPI(type = "") {
    const userId = getUserId();
    const params = new URLSearchParams();
    if (userId) params.append("userId", String(userId));
    if (type)   params.append("type", type);
    const res = await fetch(`${BASE_URL}/wallet/transactions?${params}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể lấy lịch sử giao dịch.");
    return { list: data.data ?? [], summary: data.summary ?? {} };
}

/**
 * GET /vnpay/create-payment?amount=xxx
 * BE trả về { paymentUrl: "https://sandbox.vnpayment.vn/..." }
 * Tham khảo từ project cũ cùng BE: data.paymentUrl
 */
export async function createVNPayPaymentURL(amount) {
    const res = await fetch(
        `${BASE_URL}/vnpay/create-payment?amount=${amount}`,
        { headers: authHeaders() }
    );

    // Nếu BE redirect thẳng (302) thì lấy URL đó
    if (res.redirected) return res.url;

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Không thể tạo link thanh toán.");
    }

    // Project cũ cùng BE dùng: data.paymentUrl
    const url = data.paymentUrl
        ?? data.data?.paymentUrl
        ?? data.data
        ?? data.url;

    if (!url || typeof url !== "string") {
        console.error("VNPay response:", data);
        throw new Error("Không nhận được link thanh toán hợp lệ.");
    }

    return url;
}

/**
 * POST /wallet/deposit
 * Gọi sau khi VNPay callback thành công
 * Body: { amount, referenceId }
 */
export async function depositWalletAPI(amount, referenceId) {
    const res = await fetch(`${BASE_URL}/wallet/deposit`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ amount, referenceId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Nạp tiền thất bại.");
    return data;
}

/**
 * POST /wallet/withdraw-request
 * Body: { amount, bankAccount, bankName, ... } — cần hỏi BE team
 */
export async function withdrawWalletAPI(payload) {
    const res = await fetch(`${BASE_URL}/wallet/withdraw-request`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Yêu cầu rút tiền thất bại.");
    return data;
}