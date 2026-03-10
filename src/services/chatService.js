import { BASE_URL } from "../config/apiConfig";

function authHeader(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getConversationsAPI(token) {
  const res = await fetch(`${BASE_URL}/chat/conversations`, {
    headers: authHeader(token),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy danh sách hội thoại thất bại.");
  }
  return data.data ?? data;
}

export async function createConversationAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/chat/conversations`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Tạo hội thoại thất bại.");
  }
  return data.data ?? data;
}

export async function getMessagesAPI(conversationId, { page = 0, size = 50 } = {}, token) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("size", size);

  const res = await fetch(
    `${BASE_URL}/chat/conversations/${conversationId}/messages?${params.toString()}`,
    {
      headers: authHeader(token),
    }
  );
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Lấy tin nhắn thất bại.");
  }
  return data.data ?? data;
}

export async function sendMessageAPI(payload, token) {
  const res = await fetch(`${BASE_URL}/chat/messages`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Gửi tin nhắn thất bại.");
  }
  return data.data ?? data;
}

