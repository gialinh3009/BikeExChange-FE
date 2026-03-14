import { BASE_URL } from "../config/apiConfig";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Decode JWT token to extract user ID
export function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    // JWT stores user ID as 'sub' (subject)
    return payload.sub ? parseInt(payload.sub, 10) : null;
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

export async function loginAPI(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đăng nhập thất bại.");
  }

  return data.data ?? data;
}

export async function registerAPI(email, fullName, phone, address, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, fullName, phone, address, password }),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đăng ký thất bại.");
  }

  return data.data ?? data;
}

export async function verifyEmailAPI(token) {
  const res = await fetch(`${BASE_URL}/auth/verify-email?token=${token}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Xác thực email thất bại.");
  }

  return data.data ?? data;
}

export async function forgotPasswordAPI(email) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Yêu cầu đặt lại mật khẩu thất bại.");
  }

  return data;
}

export async function resetPasswordAPI(token, newPassword) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Đặt lại mật khẩu thất bại.");
  }

  return data;
}

export async function activateAccountAPI(token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${BASE_URL}/auth/activate-account`, {
    method: "POST",
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Kích hoạt tài khoản thất bại.");
  }

  return data;
}

export async function getUserProfileAPI(token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  const res = await fetch(`${BASE_URL}/users/profile`, {
    headers: authHeaders(token),
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy thông tin tài khoản thất bại.");
  }

  return data.data ?? data;
}


export async function upgradeToSellerAPI(shopName, shopDescription, token) {
  if (!token) {
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  // Extract user ID from token (JWT payload contains 'sub' field with user ID)
  const userId = getUserIdFromToken(token);
  if (!userId) {
    throw new Error("Không thể lấy thông tin người dùng từ token. Vui lòng đăng nhập lại.");
  }

  console.log("🔑 Upgrade API - Token:", token.substring(0, 50) + "...");
  console.log("🔑 Upgrade API - User ID from token:", userId);
  console.log("🔑 Upgrade API - Shop Name:", shopName);
  console.log("🔑 Upgrade API - Shop Description:", shopDescription);

  const res = await fetch(`${BASE_URL}/users/${userId}/upgrade-to-seller`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ shopName, shopDescription, agreeToTerms: true }),
  });

  console.log("🔑 Upgrade API - Response Status:", res.status);

  const data = await res.json();

  console.log("🔑 Upgrade API - Response Data:", data);

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Nâng cấp thành Seller thất bại.");
  }

  return data.data ?? data;
}
