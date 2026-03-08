import { BASE_URL } from "../config/apiConfig";

export async function loginAPI({ email, password }) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Đăng nhập thất bại.");
    }
    return data.data; // { accessToken, tokenType, id, email, fullName, phone, role }
}

export async function registerAPI({ fullName, email, password, phone, address, role }) {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fullName, email, password, phone, address, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Đăng ký thất bại.");
    }
    return data.data;
}
