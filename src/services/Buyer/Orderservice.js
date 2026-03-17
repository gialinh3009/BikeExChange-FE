import { BASE_URL } from "../../config/apiConfig";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── POST /orders ───────────────────────────────────────────────────────────
export async function createOrderAPI(payload) {
    const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Tạo đơn hàng thất bại.");
    }

    return data.data;
}

// ── POST /orders/{id}/accept ───────────────────────────────────────────────
export async function approveOrderAPI(orderId) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/accept`, {
        method: "POST",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Phê duyệt đơn hàng thất bại.");
    }

    return data.data;
}

// ── GET /orders/my-purchases ───────────────────────────────────────────────
/**
 * Get buyer's purchase history
 * @param {Object} params - { status?, page?, size? }
 */
export async function getMyPurchasesAPI(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.status) searchParams.append("status", params.status);
    if (params.page !== undefined) searchParams.append("page", String(params.page));
    if (params.size !== undefined) searchParams.append("size", String(params.size));

    const query = searchParams.toString();
    const res = await fetch(`${BASE_URL}/orders/my-purchases${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        console.warn("Could not fetch purchases:", data.message);
        return [];
    }

    // Response: { data: [], summary: {...}, success: true }
    return Array.isArray(data.data) ? data.data : [];
}

// ── GET /orders (legacy — BE không support GET, giữ lại để không break code cũ) ─
export async function getOrdersAPI(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.status) searchParams.append("status", params.status);
    if (params.page !== undefined) searchParams.append("page", String(params.page));
    if (params.size !== undefined) searchParams.append("size", String(params.size));

    const res = await fetch(`${BASE_URL}/orders?${searchParams.toString()}`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        console.warn("Could not fetch orders list:", data.message);
        return { content: [], pageable: { pageNumber: 0, pageSize: 20 } };
    }

    return data.data || data;
}

// ── GET /orders/{id}/history ───────────────────────────────────────────────
export async function getOrderAPI(orderId) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Không thể tải chi tiết đơn hàng.");
    }

    const payload = data.data ?? {};
    return payload.order ?? payload;
}