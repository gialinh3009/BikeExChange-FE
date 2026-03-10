import { BASE_URL } from "../config/apiConfig";

export async function healthCheckAPI() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) {
    throw new Error("Backend không phản hồi.");
  }
  const text = await res.text();
  return text;
}

