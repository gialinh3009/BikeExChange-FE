import { BASE_URL } from "../../config/apiConfig";

const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export async function getRevenueSummaryAPI() {
    const res = await fetch(`${BASE_URL}/admin/wallet/revenue-summary`, {
        method: "GET",
        headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Không tải được doanh thu hệ thống.");
    }
    return data.data;
}
