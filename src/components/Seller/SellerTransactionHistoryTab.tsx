import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletTransactionsAPI } from "../../services/Seller/walletService";
import { enrichTransactions, type EnrichedTransaction } from "../../utils/transactionUtils";

type FilterKey = "all" | "income" | "expense";

interface SellerTransactionHistoryTabProps {
  token: string;
  userId?: number;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} VND`;

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function SellerTransactionHistoryTab({ token, userId }: SellerTransactionHistoryTabProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWalletTransactionsAPI(token, userId);
      const raw = Array.isArray(res) ? res : (res?.data ?? []);
      setTransactions(await enrichTransactions(raw, token));
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (token) void fetchTransactions();
  }, [fetchTransactions, token]);

  const filtered = transactions.filter(t => {
    if (filter === "income") return t.income;
    if (filter === "expense") return !t.income;
    return true;
  });

  const totalIncome  = transactions.filter(t =>  t.income).reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => !t.income).reduce((s, t) => s + (t.amount || 0), 0);

  const filterConfig: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",     label: "Tất cả",    count: transactions.length },
    { key: "income",  label: "Khoản thu", count: transactions.filter(t =>  t.income).length },
    { key: "expense", label: "Khoản chi", count: transactions.filter(t => !t.income).length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Lịch sử giao dịch</h2>
          <p className="text-sm text-gray-500 mt-0.5">Xem chi tiết tất cả khoản thu chi</p>
        </div>
        <button onClick={() => void fetchTransactions()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
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
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              filter === f.key ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}>
            {f.label}
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${filter === f.key ? "bg-white/30" : "bg-gray-200"}`}>
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
            const isOrderLink      = !!trans.resolvedOrderId;
            const isPostLink       = trans.linkType === "post"       && !!trans.resolvedBikeId;
            const isInspectionLink = trans.linkType === "inspection" && !!trans.resolvedBikeId;
            const isClickable      = isOrderLink || isPostLink || isInspectionLink;

            const handleClick = () => {
              if (isOrderLink)      navigate(`/seller/orders/${trans.resolvedOrderId}`);
              else if (isPostLink)       navigate(`/bikes/${trans.resolvedBikeId}`);
              else if (isInspectionLink) navigate(`/seller?tab=inspection`);
            };

            const linkLabel = isOrderLink      ? "→ Xem đơn hàng"
                            : isPostLink       ? "→ Xem bài đăng"
                            : isInspectionLink ? "→ Xem kiểm định"
                            : null;

            return (
              <div key={trans.id || idx} onClick={isClickable ? handleClick : undefined}
                className={`p-4 flex items-center justify-between transition ${isClickable ? "hover:bg-blue-50 cursor-pointer" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${trans.income ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
