/**
 * BuyerList.js — Bike API service
 * Params khớp 100% với BikeController.java GET /bikes
 *
 * Controller params:
 *   keyword        String   — tìm theo title/brand/model
 *   category_id    Long     — lọc theo category
 *   status         String   — BikeStatus comma-separated (ACTIVE|RESERVED|SOLD|CANCELLED)
 *   price_min      Long     — giá tối thiểu (điểm)
 *   price_max      Long     — giá tối đa (điểm)
 *   brand_id       Long     — lọc theo brand ID
 *   min_year       Integer  — năm sản xuất tối thiểu
 *   frame_size     String   — kích thước khung (54cm, L, ...)
 *   sort_by_rating boolean  — sort theo seller rating (default false)
 *   page           int      — trang 0-based (default 0)
 *   size           int      — số item/trang (default 20)
 *
 * BikeResponse fields (từ BikeResponse.java):
 *   id, title, description, brand (String), model, year, pricePoints,
 *   mileage, condition, bikeType, location,
 *   status        → ACTIVE | RESERVED | SOLD | CANCELLED
 *   inspectionStatus → NONE | PENDING | APPROVED | REJECTED
 *   sellerId, views, createdAt, updatedAt
 *   media: [{ url, type, sortOrder }]
 *
 * Response wrapper: { success: true, data: Page<BikeResponse> }
 * Page: { content: [], totalElements, totalPages, number, size }
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

    if (params.keyword     != null && params.keyword     !== "") q.set("keyword",        String(params.keyword));
    if (params.category_id != null && params.category_id !== "") q.set("category_id",    String(params.category_id));
    if (params.status      != null && params.status      !== "") q.set("status",         String(params.status));
    if (params.price_min   != null)                              q.set("price_min",      String(params.price_min));
    if (params.price_max   != null)                              q.set("price_max",      String(params.price_max));
    if (params.brand_id    != null)                              q.set("brand_id",       String(params.brand_id));
    if (params.min_year    != null)                              q.set("min_year",       String(params.min_year));
    if (params.frame_size  != null && params.frame_size  !== "") q.set("frame_size",     String(params.frame_size));
    if (params.sort_by_rating)                                   q.set("sort_by_rating", "true");

    q.set("page", String(params.page ?? 0));
    q.set("size", String(params.size ?? 20));

    const res = await fetch(`${BASE}/bikes?${q.toString()}`, { headers: authHeaders() });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`getBuyerListAPI ${res.status}: ${msg}`);
    }

    const json = await res.json();
    // { success: true, data: { content: [], totalElements, totalPages, number, size } }
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
    // { success: true, data: BikeResponse }
    return json?.data ?? json;
}