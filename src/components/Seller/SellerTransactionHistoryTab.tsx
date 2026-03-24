/**
 * SellerTransactionHistoryTab.tsx
 * 
 * Comprehensive transaction history showing:
 * - Bike posts (SPEND) - with bike name
 * - Inspections (SPEND) - with bike name
 * - Sales (INCOME) - with bike name
 * - Refunds (INCOME) - with bike name
 */

import { useState, useEffect, useCallback } from "react";
import { Package, RefreshCw } from "lucide-react";
import { getWalletTransactionsAPI } from "../../services/Seller/walletService";
import { getBikeDetailAPI } from "../../services/bikeService";

interface Transaction {
  id?: number;
  type?: string;
  amount?: number;
  description?: string;
  createdAt?: string;
  relatedOrderId?: number;
  relatedBikeId?: number;
  bikeName?: string;
  bikeTitle?: string;
}

interface BikeCache {
  [key: number]: { title: string; loading: boolean };
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} VND`;

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const getTransactionConfig = (type?: string, description?: string) => {
  const typeUpper = String(type || "").toUpperCase();
  const descUpper = String(description || "").toUpperCase();

  // Determine if it's income or expense
  const isIncome = typeUpper.includes("REFUND") || 
                   typeUpper.includes("DEPOSIT") || 
                   typeUpper.includes("SALE") ||
                   typeUpper.includes("INCOME") ||
                   descUpper.includes("HOÀN") ||
                   descUpper.includes("BÁN");

  if (typeUpper.includes("POST") || descUpper.includes("BÀI ĐĂNG")) {
    return {
      label: "Phí đăng bài",
      icon: "📝",
      color: isIncome ? "#10b981" : "#ef4444",
      bg: isIncome ? "#f0fdf4" : "#fef2f2",
      isIncome: false,
    };
  }

  if (typeUpper.includes("INSPECTION") || descUpper.includes("KIỂM ĐỊNH")) {
    return {
      label: "Phí kiểm định",
      icon: "✓",
      color: isIncome ? "#10b981" : "#ef4444",
      bg: isIncome ? "#f0fdf4" : "#fef2f2",
      isIncome: false,
    };
  }

  if (isIncome) {
    return {
      label: "Bán hàng",
      icon: "💰",
      color: "#10b981",
      bg: "#f0fdf4",
      isIncome: true,
    };
  }

  return {
    label: "Giao dịch",
    icon: "📊",
    color: "#ef4444",
    bg: "#fef2f2",
    isIncome: false,
  };
};

type FilterKey = "all" | "income" | "expense";

interface SellerTransactionHistoryTabProps {
  token: string;
}

export default function SellerTransactionHistoryTab({ token }: SellerTransactionHistoryTabProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bikeCache, setBikeCache] = useState<BikeCache>({});

  const fetchBikeDetail = useCallback(async (bikeId: number) => {
    if (bikeCache[bikeId]) return bikeCache[bikeId].title;
    
    try {
      setBikeCache(prev => ({ ...prev, [bikeId]: { title: "Đang tải...", loading: true } }));
      const data = await getBikeDetailAPI(bikeId, token);
      const bikeName = data?.title || data?.bikeTitle || "Xe không xác định";
      setBikeCache(prev => ({ ...prev, [bikeId]: { title: bikeName, loading: false } }));
      return bikeName;
    } catch (e) {
      setBikeCache(prev => ({ ...prev, [bikeId]: { title: "Xe không xác định", loading: false } }));
      return "Xe không xác định";
    }
  }, [bikeCache, token]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWalletTransactionsAPI(token);
      const allTransactions = Array.isArray(data) ? data : (data?.data || []);
      setTransactions(allTransactions);

      // Fetch bike details for transactions that have bikeId
      allTransactions.forEach((trans: Transaction) => {
        if (trans.relatedBikeId && !bikeCache[trans.relatedBikeId]) {
          void fetchBikeDetail(trans.relatedBikeId);
        }
      });
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, bikeCache, fetchBikeDetail]);

  useEffect(() => {
    if (token) {
      void fetchTransactions();
    }
  }, [fetchTransactions, token]);

  const getFilteredTransactions = () => {
    return transactions.filter(trans => {
      const typeUpper = String(trans.type || "").toUpperCase();
      const descUpper = String(trans.description || "").toUpperCase();
      const isIncome = typeUpper.includes("REFUND") || 
                       typeUpper.includes("DEPOSIT") || 
                       typeUpper.includes("SALE") ||
                       typeUpper.includes("INCOME") ||
                       descUpper.includes("HOÀN") ||
                       descUpper.includes("BÁN");

      if (filter === "income") return isIncome;
      if (filter === "expense") return !isIncome;
      return true;
    });
  };

  const filtered = getFilteredTransactions();
  const totalIncome = transactions
    .filter(t => {
      const typeUpper = String(t.type || "").toUpperCase();
      const descUpper = String(t.description || "").toUpperCase();
      return typeUpper.includes("REFUND") || 
             typeUpper.includes("DEPOSIT") || 
             typeUpper.includes("SALE") ||
             typeUpper.includes("INCOME") ||
             descUpper.includes("HOÀN") ||
             descUpper.includes("BÁN");
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => {
      const typeUpper = String(t.type || "").toUpperCase();
      const descUpper = String(t.description || "").toUpperCase();
      return !(typeUpper.includes("REFUND") || 
               typeUpper.includes("DEPOSIT") || 
               typeUpper.includes("SALE") ||
               typeUpper.includes("INCOME") ||
               descUpper.includes("HOÀN") ||
               descUpper.includes("BÁN"));
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filterConfig = [
    { key: "all" as FilterKey, label: "Tất cả", count: transactions.length },
    { key: "income" as FilterKey, label: "Khoản thu", count: transactions.filter(t => {
      const typeUpper = String(t.type || "").toUpperCase();
      const descUpper = String(t.description || "").toUpperCase();
      return typeUpper.includes("REFUND") || typeUpper.includes("DEPOSIT") || typeUpper.includes("SALE") || typeUpper.includes("INCOME") || descUpper.includes("HOÀN") || descUpper.includes("BÁN");
    }).length },
    { key: "expense" as FilterKey, label: "Khoản chi", count: transactions.filter(t => {
      const typeUpper = String(t.type || "").toUpperCase();
      const descUpper = String(t.description || "").toUpperCase();
      return !(typeUpper.includes("REFUND") || typeUpper.includes("DEPOSIT") || typeUpper.includes("SALE") || typeUpper.includes("INCOME") || descUpper.includes("HOÀN") || descUpper.includes("BÁN"));
    }).length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
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
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="inline-flex items-center justify-center w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-6 my-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-semibold">Lỗi: {error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-sm mb-1">Không có giao dịch</p>
          <p className="text-gray-500 text-xs">
            {filter === "income" && "Chưa có khoản thu nào"}
            {filter === "expense" && "Chưa có khoản chi nào"}
            {filter === "all" && "Chưa có lịch sử giao dịch"}
          </p>
        </div>
      )}

      {/* Transactions list */}
      {!loading && filtered.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filtered.map((trans, idx) => {
            const config = getTransactionConfig(trans.type, trans.description);
            const typeUpper = String(trans.type || "").toUpperCase();
            const descUpper = String(trans.description || "").toUpperCase();
            const isIncome = typeUpper.includes("REFUND") || 
                           typeUpper.includes("DEPOSIT") || 
                           typeUpper.includes("SALE") ||
                           typeUpper.includes("INCOME") ||
                           descUpper.includes("HOÀN") ||
                           descUpper.includes("BÁN");

            // Get bike name from cache or description
            const bikeName = trans.relatedBikeId && bikeCache[trans.relatedBikeId] 
              ? bikeCache[trans.relatedBikeId].title 
              : (trans.bikeTitle || trans.bikeName || "");

            // Build full description
            let fullDescription = trans.description || config.label;
            if (bikeName && !fullDescription.includes(bikeName)) {
              if (typeUpper.includes("POST") || descUpper.includes("BÀI ĐĂNG")) {
                fullDescription = `Phí đăng bài của xe ${bikeName}`;
              } else if (typeUpper.includes("INSPECTION") || descUpper.includes("KIỂM ĐỊNH")) {
                fullDescription = `Phí kiểm định của xe ${bikeName}`;
              } else if (isIncome && (typeUpper.includes("SALE") || descUpper.includes("BÁN"))) {
                fullDescription = `Bán hàng xe ${bikeName}`;
              }
            }

            return (
              <div key={trans.id || idx} className="p-4 hover:bg-gray-50 transition">
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                  {/* Left: Transaction info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: config.bg, display: "flex", alignItems: "center", justifyContent: "center", color: config.color, flexShrink: 0, fontSize: 18 }}>
                        {config.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                          {fullDescription}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b" }}>
                          {fmtDateTime(trans.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: isIncome ? "#10b981" : "#ef4444" }}>
                      {isIncome ? "+" : "-"}{fmtMoney(Math.abs(trans.amount || 0))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
