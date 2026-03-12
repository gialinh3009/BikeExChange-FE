import { BASE_URL } from "../../config/apiConfig";

/**
 * GET /categories?page=0&size=50
 * Response: { success: true, data: { content: [{id, name, description, imgUrl, createdAt}] } }
 */
export async function getCategoriesAPI() {
    const token = localStorage.getItem("token") ?? "";

    const res = await fetch(`${BASE_URL}/categories?page=0&size=50`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
        throw new Error(data.message || "Lấy danh mục thất bại.");
    }

    // BE trả: data.data.content (Page object)
    const content = data?.data?.content ?? data?.data ?? [];
    if (!Array.isArray(content)) return [];

    return content.map((c) => ({
        id:     c.id,
        name:   c.name,
        imgUrl: c.imgUrl ?? null,
    }));
}