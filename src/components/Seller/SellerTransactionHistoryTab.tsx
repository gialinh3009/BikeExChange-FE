import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletTransactionsAPI } from "../../services/Seller/walletService";
import { getBikeDetailAPI } from "../../services/bikeService";
import { BASE_URL } from "../../config/apiConfig";

type RawTransaction = {
  id?: number;
  type?: string;
  amount?: number;
  description?: string;
  createdAt?: string;
  referenceId?: string;
  remarks?: string;
};

type EnrichedTransaction = RawTransaction & {
  resolvedLabel: string;
  resolvedOrderId?: number;
  resolvedBikeId?: number;
  linkType?: "post" | "inspection";
  income: boolean;
};

type FilterKey = "all" | "income" | "expense";

interface SellerTransactionHistoryTabProps {
  token: string;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} VND`;

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function parseOrderIdFromRef(ref?: string): number | null {
  if (!ref) return null;
  const m = ref.match(/Order:\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

function parseBikeIdFromRef(ref?: string): number | null {
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

function isIncomeType(type?: string): boolean {
  const t = String(type || "").toUpperCase();
  return t === "EARN" || t === "DEPOSIT" || t === "REFUND" || t === "INCOME";
}

export default function SellerTransactionHistoryTab({ token }: SellerTransactionHistoryTabProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);

  const fetchBikeTitle = useCallback(async (bikeId: number): Promise<string> => {
    try {
      const data = await getBikeDetailAPI(bikeId, token);
      return data?.title || data?.bikeTitle || `Xe #${bikeId}`;
    } catch {
      return `Xe #${bikeId}`;
    }
  }, [token]);

  const fetchOrderInfo = useCallback(async (orderId: number): Promise<{ bikeTitle: string }> => {
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const order = data?.data?.order || data?.order || data;
      return { bikeTitle: order?.bikeTitle || order?.bike?.title || `Đơn #${orderId}` };
    } catch {
      return { bikeTitle: `Đơn #${orderId}` };
    }
  }, [token]);

  const enrichTransaction = useCallback(async (trans: RawTransaction): Promise<EnrichedTransaction> => {
    const typeUpper = String(trans.type || "").toUpperCase();
    const ref = trans.referenceId || "";
    const income = isIncomeType(trans.type);

    if (typeUpper === "EARN") {
      const orderId = parseOrderIdFromRef(ref);
      if (orderId) {
        const info = await fetchOrderInfo(orderId);
        return { ...trans, income, resolvedLabel: `Xe ${info.bikeTitle} đã bán`, resolvedOrderId: orderId };
      }
      return { ...trans, income, resolvedLabel: "Bán hàng" };
    }

    if (typeUpper === "SPEND") {
      const bikeId = parseBikeIdFromRef(ref);
      const bikeName = bikeId ? await fetchBikeTitle(bikeId) : null;
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
      const bikeName = bikeId ? await fetchBikeTitle(bikeId) : null;
      return { ...trans, income, resolvedLabel: bikeName ? `Hoàn tiền xe ${bikeName}` : "Hoàn tiền" };
    }

    if (typeUpper === "WITHDRAW") return { ...trans, income, resolvedLabel: "Rút tiền" };
    if (typeUpper === "ESCROW_HOLD") return { ...trans, income: false, resolvedLabel: "Phí Kiểm Định", resolvedBikeId: parseBikeIdFromRef(ref) ?? undefined, linkType: "inspection" };
    if (typeUpper === "ESCROW_RELEASE") return { ...trans, income: true, resolvedLabel: "Giải phóng tiền đặt cọc" };

    return { ...trans, income, resolvedLabel: trans.description || trans.type || "Giao dịch" };
  }, [fetchBikeTitle, fetchOrderInfo]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWalletTransactionsAPI(token);
      const raw: RawTransaction[] = Array.isArray(res) ? res : (res?.data || []);
      const enriched = await Promise.all(raw.map(t => enrichTransaction(t)));
      setTransactions(enriched);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, enrichTransaction]);

  useEffect(() => {
    if (token) void fetchTransactions();
  }, [fetchTransactions, token]);

  const filtered = transactions.filter(t => {
    if (filter === "income") return t.income;
    if (filter === "expense") return !t.income;
    return true;
  });

  const totalIncome = transactions.filter(t => t.income).reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => !t.income).reduce((s, t) => s + (t.amount || 0), 0);

  const filterConfig: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: transactions.length },
    { key: "income", label: "Khoản thu", count: transactions.filter(t => t.income).length },
    { key: "expense", label: "Khoản chi", count: transactions.filter(t => !t.income).length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Lịch sử giao dịch</h2>
          <p className="text-sm text-gray-500 mt-0.5">Xem chi tiết tất cả khoản thu chi (bài đăng, kiểm định, bán hàng)</p>
        </div>
        <button
          onClick={() => void fetchTransactions()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      {!loading && transactions.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Tổng giao dịch</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Khoản thu</p>
            <p className="text-lg font-bold text-green-600">+{fmtMoney(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Khoản chi</p>
            <p className="text-lg font-bold text-red-600">-{fmtMoney(totalExpense)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 flex-wrap">
        {filterConfig.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {f.label}
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
              filter === f.key ? "bg-white/30" : "bg-gray-200"
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          Đang tải...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-6 my-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-semibold">Lỗi: {error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-sm mb-1">Không có giao dịch</p>
          <p className="text-gray-500 text-xs">
            {filter === "income" ? "Chưa có khoản thu nào" : filter === "expense" ? "Chưa có khoản chi nào" : "Chưa có lịch sử giao dịch"}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filtered.map((trans, idx) => {
            const isOrderLink = !!trans.resolvedOrderId;
            const isPostLink = trans.linkType === "post" && !!trans.resolvedBikeId;
            const isInspectionLink = trans.linkType === "inspection" && !!trans.resolvedBikeId;
            const isClickable = isOrderLink || isPostLink || isInspectionLink;

            const handleClick = () => {
              if (isOrderLink) navigate(`/seller/orders/${trans.resolvedOrderId}`);
              else if (isPostLink) navigate(`/bikes/${trans.resolvedBikeId}`);
              else if (isInspectionLink) navigate(`/seller?tab=inspection`);
            };

            const linkLabel = isOrderLink ? "→ Xem đơn hàng"
              : isPostLink ? "→ Xem bài đăng"
              : isInspectionLink ? "→ Xem kiểm định"
              : null;

            return (
              <div
                key={trans.id || idx}
                onClick={isClickable ? handleClick : undefined}
                className={`p-4 flex items-center justify-between transition ${
                  isClickable ? "hover:bg-blue-50 cursor-pointer" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    trans.income ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {trans.income ? "↑" : "↓"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      {trans.resolvedLabel}
                      {linkLabel && <span className="text-xs text-blue-500 font-normal">{linkLabel}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(trans.createdAt)}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ml-4 ${trans.income ? "text-green-600" : "text-red-600"}`}>
                  {trans.income ? "+" : "-"}{fmtMoney(Math.abs(trans.amount || 0))}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
