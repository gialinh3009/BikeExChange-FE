/**
 * BuyerList.js — Bike API service
 * Khớp 100% với BikeController.java GET /bikes (không sửa BE)
 *
 * Params BE:
 *   keyword        String
 *   category_id    Long     — single only (BE không hỗ trợ multi)
 *   status         String   — comma-separated: "ACTIVE" | "ACTIVE,RESERVED" | undefined=all
 *   price_min      Long
 *   price_max      Long
 *   brand_id       Long
 *   min_year       Integer
 *   frame_size     String
 *   sort_by_rating boolean
 *   page           int
 *   size           int
 *
 * Multi-category được xử lý ở BuyerPage bằng Promise.all — mỗi category_id 1 request riêng.
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
 * GET /bikes
 */
export async function getBuyerListAPI(params = {}) {
    const q = new URLSearchParams();

    if (params.keyword    != null && params.keyword    !== "") q.set("keyword",        String(params.keyword));
    if (params.category_id != null && params.category_id !== "") q.set("category_id",  String(params.category_id));
    if (params.status     != null && params.status     !== "") q.set("status",         String(params.status));
    if (params.price_min  != null)                             q.set("price_min",      String(params.price_min));
    if (params.price_max  != null)                             q.set("price_max",      String(params.price_max));
    if (params.brand_id   != null)                             q.set("brand_id",       String(params.brand_id));
    if (params.min_year   != null)                             q.set("min_year",       String(params.min_year));
    if (params.frame_size != null && params.frame_size !== "") q.set("frame_size",     String(params.frame_size));
    if (params.sort_by_rating)                                 q.set("sort_by_rating", "true");

    q.set("page", String(params.page ?? 0));
    q.set("size", String(params.size ?? 20));

    const res = await fetch(`${BASE}/bikes?${q.toString()}`, { headers: authHeaders() });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`getBuyerListAPI ${res.status}: ${msg}`);
    }

    const json = await res.json();
    const page = json?.data ?? json;
    return {
        content:       Array.isArray(page?.content) ? page.content : [],
        totalElements: page?.totalElements ?? 0,
        totalPages:    page?.totalPages    ?? 1,
        number:        page?.number        ?? 0,
        size:          page?.size          ?? 20,
    };
}

/**
 * GET /bikes/:id
 */
export async function getBikeDetailAPI(bikeId) {
    const res = await fetch(`${BASE}/bikes/${bikeId}`, { headers: authHeaders() });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`getBikeDetailAPI ${res.status}: ${msg}`);
    }

    const json = await res.json();
    return json?.data ?? json;
}