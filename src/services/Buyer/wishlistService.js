/**
 * ====================================================================================
 * wishlistService.js — API calls liên quan đến danh sách yêu thích
 * ====================================================================================
 * Mục đích:
 *   - GET /buyer/wishlist — Lấy danh sách xe yêu thích
 *   - POST /buyer/wishlist/{bikeId} — Thêm xe vào yêu thích
 *   - DELETE /buyer/wishlist/{bikeId} — Xóa xe khỏi yêu thích
 * ====================================================================================
 */

import { BASE_URL } from "../../config/apiConfig";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/**
 * ━ GET /buyer/wishlist — Lấy toàn bộ danh sách yêu thích
 * ━ Output: Array<{ id, bike: { id, title, pricePoints, ... } }>
 * ━ Gọi từ: WishList.tsx, BikedetailPage.tsx (sync wishlist status)
 */
export async function getWishlistAPI() {
    const res = await fetch(`${BASE_URL}/buyer/wishlist`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        console.warn("Could not fetch wishlist:", data.message);
        return [];
    }

    const content = data.data?.content ?? data.data ?? data ?? [];
    return Array.isArray(content) ? content : [];
}

// ── POST /buyer/wishlist/{bikeId} ──────────────────────────────────────────
export async function addToWishlistAPI(bikeId) {
    const res = await fetch(`${BASE_URL}/buyer/wishlist/${bikeId}`, {
        method: "POST",
        headers: authHeaders(),
        // Không cần body - bikeId nằm trong URL
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Thêm vào yêu thích thất bại.");
    }

    return data.data ?? data;
}

// ── DELETE /buyer/wishlist/{bikeId} ────────────────────────────────────────
export async function removeFromWishlistAPI(bikeId) {
    const res = await fetch(`${BASE_URL}/buyer/wishlist/${bikeId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Xóa khỏi yêu thích thất bại.");
    }

    return data.data ?? data;
}