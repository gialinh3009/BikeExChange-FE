import { BASE_URL } from "../../config/apiConfig";

export async function getBuyerListAPI({
                                          keyword = "",
                                          category_id,
                                          status = "", // Allow empty = show all
                                          inspectionStatus,
                                          price_min,
                                          price_max,
                                          min_year,
                                          page = 0,
                                          size = 12,
                                          sort_by_rating = true,
                                      } = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();

    // Add params theo BE API
    if (keyword) params.append("keyword", keyword);
    if (category_id) params.append("category_id", String(category_id));
    if (status) params.append("status", status);
    if (inspectionStatus) params.append("inspectionStatus", inspectionStatus);
    if (price_min) params.append("price_min", String(price_min));
    if (price_max) params.append("price_max", String(price_max));
    if (min_year) params.append("min_year", String(min_year));
    if (sort_by_rating) params.append("sort_by_rating", String(sort_by_rating));

    params.append("page", String(page));
    params.append("size", String(size));

    const res = await fetch(`${BASE_URL}/bikes?${params.toString()}`, {
        method: "GET",
        headers,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Lấy danh sách xe thất bại.");
    }

    // BE trả về data.data.content (paginated)
    return data.data;
}