import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/** GET /bikes/{id} → trả về object bike */
export async function getBikeDetailAPI(id) {
    const res  = await fetch(`${BASE_URL}/bikes/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải thông tin xe.");
    return data.data;
}