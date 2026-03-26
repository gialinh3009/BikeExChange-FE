import { BASE_URL } from "../config/apiConfig";

/**
 * Public Settings Service
 * Fetch system-wide fee/rate configs from admin-controlled settings.
 * All values can change at any time — always fetch from API, never hardcode.
 */

async function fetchSetting(path) {
  const res = await fetch(`${BASE_URL}/public/settings/${path}`);
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Không thể tải cấu hình: ${path}`);
  }
  return data.data;
}

/** Phí đăng 1 bài xe (VND) */
export async function getBikePostFeeAPI() {
  return Number(await fetchSetting("bike-post-fee"));
}

/** Phí nâng cấp lên Seller (VND) */
export async function getSellerUpgradeFeeAPI() {
  return Number(await fetchSetting("seller-upgrade-fee"));
}

/** Phí kiểm định xe (VND) */
export async function getInspectionFeeAPI() {
  return Number(await fetchSetting("inspection-fee"));
}

/** Số ngày cho phép trả hàng */
export async function getReturnWindowDaysAPI() {
  return Number(await fetchSetting("return-window-days"));
}

/** Tỷ lệ hoa hồng dạng phần trăm (0 - 100) */
export async function getCommissionRateAPI() {
  return Number(await fetchSetting("commission-rate"));
}
