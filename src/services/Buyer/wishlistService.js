import { BASE_URL } from "../../config/apiConfig";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── GET /buyer/wishlist ────────────────────────────────────────────────────
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