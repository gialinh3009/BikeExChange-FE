/**
 * brandService.js — Brand API service
 * GET /brands  — List all brands (public, no auth required)
 * GET /brands/:id — Get brand detail
 */

import { BASE_URL } from "../../config/apiConfig";

function authHeaders() {
  const token = localStorage.getItem("token") ?? "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * GET /brands — List all brands
 * @returns {Promise<Array<{ id: number, name: string, description?: string, logoUrl?: string }>>}
 */
export async function getBrandsAPI() {
  const res = await fetch(`${BASE_URL}/brands`, { headers: authHeaders() });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`getBrandsAPI ${res.status}: ${msg}`);
  }
  const json = await res.json();
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json))       return json;
  return [];
}

/**
 * GET /brands/:id — Get brand detail
 * @param {number} id
 */
export async function getBrandDetailAPI(id) {
  const res = await fetch(`${BASE_URL}/brands/${id}`, { headers: authHeaders() });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`getBrandDetailAPI ${res.status}: ${msg}`);
  }
  const json = await res.json();
  return json?.data ?? json;
}
