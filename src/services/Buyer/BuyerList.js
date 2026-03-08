import { BASE_URL } from "../config/apiConfig";

export async function getBuyerListAPI({
                                          keyword = "",
                                          category_id,
                                          status,
                                          price_min,
                                          price_max,
                                          min_year,
                                          frame_size,
                                          page = 0,
                                          size = 20,
                                      } = {}) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();

    if (keyword) params.append("keyword", keyword);
    if (category_id !== undefined && category_id !== null)
        params.append("category_id", category_id);
    if (status) params.append("status", status);
    if (price_min !== undefined && price_min !== null)
        params.append("price_min", price_min);
    if (price_max !== undefined && price_max !== null)
        params.append("price_max", price_max);
    if (min_year !== undefined && min_year !== null)
        params.append("min_year", min_year);
    if (frame_size) params.append("frame_size", frame_size);
    params.append("page", page);
    params.append("size", size);

    const res = await fetch(`${BASE_URL}/bikes?${params.toString()}`, {
        method: "GET",
        headers,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Lấy danh sách xe thất bại.");
    }

    return data.data;
}
