import { BASE_URL } from "../../config/apiConfig";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/**
 * GET /wishlist
 */
export async function getWishlistAPI() {
    const res = await fetch(`${BASE_URL}/wishlist`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lấy wishlist thất bại.");
    return data;
}

/**
 * POST /wishlist?bikeId=xxx
 * 400 = xe đã có trong wishlist → không throw, coi như thành công
 */
export async function addToWishlistAPI(bikeId) {
    const res = await fetch(`${BASE_URL}/wishlist?bikeId=${bikeId}`, {
        method: "POST",
        headers: getAuthHeaders(),
    });

    if (res.status === 400) {
        console.warn("addToWishlist 400 - đã có trong wishlist");
        return { alreadyAdded: true };
    }

    const text = await res.text();
    if (!res.ok) {
        const parsed = (() => { try { return JSON.parse(text); } catch { return {}; } })();
        throw new Error(parsed.message || "Thêm wishlist thất bại.");
    }
    return text ? JSON.parse(text) : { success: true };
}

/**
 * DELETE /wishlist/{bikeId}
 */
export async function removeFromWishlistAPI(bikeId) {
    const res = await fetch(`${BASE_URL}/wishlist/${bikeId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Xóa wishlist thất bại.");
    }
    return true;
}