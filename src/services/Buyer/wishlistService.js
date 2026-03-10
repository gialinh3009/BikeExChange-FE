import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── GET /wishlist ──────────────────────────────────────────────────────────
/**
 * Get all wishlist items for current user
 * @returns {Promise<Array>} - List of wishlisted bikes or bike IDs
 */
export async function getWishlistAPI() {
    const res = await fetch(`${BASE_URL}/wishlist`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        console.warn("Could not fetch wishlist:", data.message);
        return [];
    }

    // BE may return: { data: [...], success: true } or { data: { content: [...] } }
    const content = data.data?.content ?? data.data ?? data ?? [];
    return Array.isArray(content) ? content : [];
}

// ── POST /wishlist ────────────────────────────────────────────────────────
/**
 * Add bike to wishlist
 * @param {number} bikeId
 * @returns {Promise<Object>}
 */
export async function addToWishlistAPI(bikeId) {
    const res = await fetch(`${BASE_URL}/wishlist`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ bikeId }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Thêm vào yêu thích thất bại.");
    }

    return data.data;
}

// ── DELETE /wishlist/{bikeId} ──────────────────────────────────────────────
/**
 * Remove bike from wishlist
 * @param {number} bikeId
 * @returns {Promise<void>}
 */
export async function removeFromWishlistAPI(bikeId) {
    const res = await fetch(`${BASE_URL}/wishlist/${bikeId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Xóa khỏi yêu thích thất bại.");
    }

    return data.data;
}