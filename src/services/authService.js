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
  return data.data;
}

export async function registerAPI({ fullName, email, password, phone, address, role }) {
  // Register là public route, không cần token
  // Nếu gửi token cũ/hết hạn lên sẽ bị BE trả về 401
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, phone, address, role }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Đăng ký thất bại.");
  }
  return data.data;
}

export async function verifyEmailAPI(token) {
  const params = new URLSearchParams();
  params.append("token", token);
  const res = await fetch(`${BASE_URL}/auth/verify?${params.toString()}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác minh email thất bại.");
  }
  return data;
}

export async function forgotPasswordAPI(email) {
  const params = new URLSearchParams();
  params.append("email", email);
  const res = await fetch(`${BASE_URL}/auth/forgot-password?${params.toString()}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Gửi yêu cầu quên mật khẩu thất bại.");
  }
  return data;
}

export async function resetPasswordAPI(payload) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đặt lại mật khẩu thất bại.");
  }
  return data;
}

export async function changeUserStatusAPI(id, status, token) {
  const params = new URLSearchParams();
  params.append("status", status);
  const res = await fetch(`${BASE_URL}/auth/change-status/${id}?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Thay đổi trạng thái người dùng thất bại.");
  }
  return data;
}