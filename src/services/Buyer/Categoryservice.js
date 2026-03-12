/**
 * Categoryservice.js — Category API service
 * Khớp 100% với CategoryController.java
 *
 * GET /categories
 *   - Không có auth required (public)
 *   - Response: { success: true, data: Category[] }  ← List, KHÔNG phải Page
 *   - Category fields: id (Long), name (String), description (String), imgUrl (String), createdAt (LocalDateTime)
 *
 * GET /categories/:id/bikes
 *   - Response: { success: true, data: BikeResponse[] }  ← List
 */

const BASE = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
    const token = localStorage.getItem("token") ?? "";
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

/**
 * GET /categories — List all categories (no pagination)
 * @returns {Promise<Array<{ id: number, name: string, description?: string, imgUrl?: string, createdAt?: string }>>}
 */
export async function getCategoriesAPI() {
    const res = await fetch(`${BASE}/categories`, {
        headers: authHeaders(),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`getCategoriesAPI ${res.status}: ${msg}`);
    }

    const json = await res.json();

    // Response: { success: true, data: Category[] }
    // data là List<Category> — KHÔNG phải Page
    if (Array.isArray(json?.data))    return json.data;
    if (Array.isArray(json))          return json;
    return [];
}

/**
 * GET /categories/:id/bikes — List all bikes belonging to a category (no pagination)
 * @param {number} categoryId
 * @returns {Promise<BikeResponse[]>}
 */
export async function getCategoryBikesAPI(categoryId) {
    const res = await fetch(`${BASE}/categories/${categoryId}/bikes`, {
        headers: authHeaders(),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`getCategoryBikesAPI ${res.status}: ${msg}`);
    }

    const json = await res.json();

    // Response: { success: true, data: BikeResponse[] }
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json))       return json;
    return [];
}