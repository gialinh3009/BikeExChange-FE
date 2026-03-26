/**
 * Shared transaction enrichment utilities for Seller wallet/transaction views.
 * Avoids duplicating logic between WalletTab and SellerTransactionHistoryTab.
 */
import { getBikeDetailAPI } from "../services/bikeService";
import { BASE_URL } from "../config/apiConfig";

export type RawTransaction = {
  id?: number;
  type?: string;
  amount?: number;
  description?: string;
  createdAt?: string;
  referenceId?: string;
  remarks?: string;
};

export type EnrichedTransaction = RawTransaction & {
  resolvedLabel: string;
  resolvedOrderId?: number;
  resolvedBikeId?: number;
  linkType?: "post" | "inspection";
  income: boolean;
};

export function isIncomeType(type?: string): boolean {
  const t = String(type || "").toUpperCase();
  return t === "EARN" || t === "DEPOSIT" || t === "REFUND" || t === "INCOME" || t === "ESCROW_RELEASE";
}

export function parseOrderIdFromRef(ref?: string): number | null {
  if (!ref) return null;
  const m = ref.match(/Order:\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

export function parseBikeIdFromRef(ref?: string): number | null {
  if (!ref) return null;
  const patterns = [
    /BIKE_POST_FEE_(\d+)/i,
    /Inspection.*Bike:\s*(\d+)/i,
    /Post fee:\s*(\d+)/i,
  ];
  for (const p of patterns) {
    const m = ref.match(p);
    if (m) return Number(m[1]);
  }
  return null;
}

async function fetchBikeTitle(bikeId: number, token: string): Promise<string> {
  try {
    const data = await getBikeDetailAPI(bikeId, token);
    return data?.title || data?.bikeTitle || `Xe #${bikeId}`;
  } catch {
    return `Xe #${bikeId}`;
  }
}

async function fetchOrderBikeTitle(orderId: number, token: string): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const order = data?.data?.order || data?.order || data;
    return order?.bikeTitle || order?.bike?.title || `Đơn #${orderId}`;
  } catch {
    return `Đơn #${orderId}`;
  }
}

export async function enrichTransaction(trans: RawTransaction, token: string): Promise<EnrichedTransaction> {
  const typeUpper = String(trans.type || "").toUpperCase();
  const ref = trans.referenceId || "";
  const income = isIncomeType(trans.type);

  if (typeUpper === "EARN") {
    const orderId = parseOrderIdFromRef(ref);
    if (orderId) {
      const bikeTitle = await fetchOrderBikeTitle(orderId, token);
      return { ...trans, income, resolvedLabel: `Xe ${bikeTitle} đã bán`, resolvedOrderId: orderId };
    }
    return { ...trans, income, resolvedLabel: "Bán hàng" };
  }

  if (typeUpper === "SPEND") {
    const bikeId = parseBikeIdFromRef(ref);
    const bikeName = bikeId ? await fetchBikeTitle(bikeId, token) : null;
    if (/BIKE_POST_FEE/i.test(ref) || /Post fee/i.test(ref)) {
      return { ...trans, income, resolvedLabel: bikeName ? `Bài đăng của xe ${bikeName}` : "Phí đăng bài", resolvedBikeId: bikeId ?? undefined, linkType: "post" };
    }
    if (/Inspection/i.test(ref)) {
      return { ...trans, income, resolvedLabel: bikeName ? `Phí kiểm định xe ${bikeName}` : "Phí kiểm định", resolvedBikeId: bikeId ?? undefined, linkType: "inspection" };
    }
    if (/Seller Upgrade/i.test(ref)) return { ...trans, income, resolvedLabel: "Phí nâng cấp tài khoản" };
    return { ...trans, income, resolvedLabel: bikeName ? `Chi phí xe ${bikeName}` : "Khoản chi" };
  }

  if (typeUpper === "DEPOSIT") return { ...trans, income, resolvedLabel: "Nạp tiền vào ví" };

  if (typeUpper === "REFUND") {
    const bikeId = parseBikeIdFromRef(ref);
    const bikeName = bikeId ? await fetchBikeTitle(bikeId, token) : null;
    return { ...trans, income, resolvedLabel: bikeName ? `Hoàn tiền xe ${bikeName}` : "Hoàn tiền" };
  }

  if (typeUpper === "WITHDRAW") return { ...trans, income: false, resolvedLabel: "Rút tiền" };
  if (typeUpper === "ESCROW_HOLD") return { ...trans, income: false, resolvedLabel: "Phí Kiểm Định", resolvedBikeId: parseBikeIdFromRef(ref) ?? undefined, linkType: "inspection" };
  if (typeUpper === "ESCROW_RELEASE") return { ...trans, income: true, resolvedLabel: "Giải phóng tiền đặt cọc" };

  return { ...trans, income, resolvedLabel: trans.description || trans.type || "Giao dịch" };
}

export async function enrichTransactions(list: RawTransaction[], token: string): Promise<EnrichedTransaction[]> {
  return Promise.all(list.map(t => enrichTransaction(t, token)));
}
