import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/** GET /users/{userId} */
export async function getUserProfileAPI(userId) {
    const res  = await fetch(`${BASE_URL}/users/${userId}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải hồ sơ.");
    return data;
}

/** PUT /users/{userId} — chỉ gửi các field được phép chỉnh sửa */
export async function updateUserProfileAPI(userId, payload) {
    const res  = await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Cập nhật thất bại.");
    return data;
}