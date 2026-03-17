/**
 * ====================================================================================
 * Bikeservice.js — API calls liên quan đến thông tin xe
 * ====================================================================================
 * Mục đích: Fetch chi tiết thông tin một chiếc xe từ backend
 * Base URL: https://bikeexchange-be.onrender.com/api
 * ====================================================================================
 */

import { BASE_URL } from "../../config/apiConfig";

/**
 * ━ Helper để tạo request headers với JWT token
 * ━ token: lấy từ localStorage
 * ━ Content-Type: json nếu cần (POST/PUT requests)
 */
const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * API: GET /bikes/{id}
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Mục đích: Lấy chi tiết thông tin một chiếc xe
 *
 * Input:
 *   id: number — bike ID
 *
 * Output (success):
 *   {
 *     data: {
 *       id, title, description, brand, model, year, pricePoints,
 *       mileage, condition, bikeType, frameSize, status,
 *       inspectionStatus, location, views, sellerId,
 *       createdAt, updatedAt,
 *       media: [ { url, type, sortOrder }, ... ]
 *     }
 *   }
 *
 * Error: throw new Error(message)
 *
 * Gọi từ: BikedetailPage.tsx (dòng: const data = await getBikeDetailAPI(id))
 */
export async function getBikeDetailAPI(id) {
    const res  = await fetch(`${BASE_URL}/bikes/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không thể tải thông tin xe.");
    return data.data;
}