import { BASE_URL } from "../../config/apiConfig";

export async function getBuyerListAPI({
                                          keyword        = "",
                                          category_id    = "",
                                          page           = 0,
                                          size           = 50,
                                          sort_by_rating = true,
                                      } = {}) {
    const token = localStorage.getItem("token") ?? "";

    const params = new URLSearchParams();
    if (keyword)     params.append("keyword",       keyword);
    if (category_id) params.append("category_id",   String(category_id));
    params.append("sort_by_rating", String(sort_by_rating));
    params.append("page",           String(page));
    params.append("size",           String(size));

    const res = await fetch(`${BASE_URL}/bikes?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
        throw new Error(data.message || "Lấy danh sách xe thất bại.");
    }

    const pageData   = data?.data ?? {};
    const rawContent = Array.isArray(pageData?.content) ? pageData.content : [];

    // TODO: Xóa DRAFT khi BE fix xong status trong DB
    const filtered = rawContent.filter(
        (b) => b?.status === "ACTIVE"
            || b?.status === "RESERVED"
            || b?.status === "DRAFT"
    );

    // APPROVED lên đầu
    filtered.sort((a, b) => {
        const aOk = a.inspectionStatus === "APPROVED" ? 0 : 1;
        const bOk = b.inspectionStatus === "APPROVED" ? 0 : 1;
        return aOk - bOk;
    });

    return { ...pageData, content: filtered };
}