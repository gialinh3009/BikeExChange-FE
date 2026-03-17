/**
 * ====================================================================================
 * Orderservice.js — API calls liên quan đến đơn hàng (orders)
 * ====================================================================================
 * Mục đích:
 *   - Tạo đơn hàng (POST /orders)
 *   - Lấy danh sách mua hàng của buyer (GET /orders/my-purchases)
 *   - Lấy chi tiết đơn hàng (GET /orders/{id}/history)
 * ====================================================================================
 */

import { BASE_URL } from "../../config/apiConfig";

/**
 * ━ Helper: Tạo headers với JWT token từ localStorage
 */
const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API: POST /orders
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Mục đích: Tạo đơn hàng mới (khi buyer bấm "Mua ngay")
 *
 * Input:
 *   payload = {
 *     bikeId: number,
 *     idempotencyKey: string (để prevent duplicate orders nếu network timeout)
 *   }
 *
 * Output (success): { success: true, data: { id, status: "ESCROWED", ... } }
 * Error: throw new Error(message)
 *
 * Trạng thái sau khi tạo: ESCROWED (chờ seller xác nhận)
 */
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

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API: POST /orders/{id}/accept (SELLER ACTION - không dùng trong buyer service)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Giữ lại để tương thích (có thể dùng trong seller page)
 */
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

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API: GET /orders/my-purchases
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Mục đích: Lấy danh sách đơn hàng mà buyer đã mua
 *
 * Input:
 *   params = {
 *     status?: "ESCROWED" | "ACCEPTED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURN_REQUESTED" | "DISPUTED",
 *     page?: number (0-based),
 *     size?: number (default 20)
 *   }
 *
 * Output: 
 *   Array<{ order: { id, bikeId, bikeTitle, status, ... }, canReview, isReviewed }>
 *   hoặc Array<{ id, bikeId, ... }> (tùy response format)
 *
 * Gọi từ:
 *   - OrdersTab.tsx (list đơn hàng với filter)
 *   - BuyerPage.tsx (overview - lấy 5 đơn gần đây)
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

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API: GET /orders (Legacy - gọi chung danh sách)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Giữ lại nhưng không dùng nhiều (dùng getMyPurchasesAPI thay thế)
 */
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

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API: GET /orders/{id}/history
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Mục đích: Lấy chi tiết đơn hàng + timeline events
 *
 * Input: orderId: number
 *
 * Output:
 *   {
 *     order: { id, bikeId, bikeTitle, status, createdAt, ... },
 *     timeline: [ { status, timestamp, actor, note }, ... ],
 *     canReview: boolean,
 *     isReviewed: boolean
 *   }
 *
 * Gọi từ: OrderDetailPage.tsx
 */
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