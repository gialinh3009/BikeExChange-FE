import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package, Bike } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletTransactionsAPI } from "../../services/Seller/walletService";
import { enrichTransactions, type EnrichedTransaction } from "../../utils/transactionUtils";
import { batchGetBikeImages } from "../../utils/bikeImageCache";

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
  const [bikeImages, setBikeImages] = useState<Map<number, string>>(new Map());

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWalletTransactionsAPI(token, userId);
      const raw = Array.isArray(res) ? res : (res?.data ?? []);
      const enriched = await enrichTransactions(raw, token);
      setTransactions(enriched);

      // Fetch bike images for transactions that have a bikeId
      const bikeIds = enriched.map(t => t.resolvedBikeId).filter((id): id is number => !!id);
      if (bikeIds.length > 0) {
        batchGetBikeImages(bikeIds, token).then(setBikeImages).catch(() => {});
      }
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
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lịch sử giao dịch</h2>
          <p className="text-sm text-gray-500 mt-0.5">Toàn bộ khoản thu và chi trong ví của bạn</p>
        </div>
        <button onClick={() => void fetchTransactions()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tổng giao dịch</p>
            <p className="text-3xl font-extrabold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Khoản thu</p>
            <p className="text-xl font-extrabold text-emerald-700">+{fmtMoney(totalIncome)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Khoản chi</p>
            <p className="text-xl font-extrabold text-red-600">-{fmtMoney(totalExpense)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {filterConfig.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filter === f.key
                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100"
                : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600"
            }`}>
            {f.label}
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
              filter === f.key ? "bg-white/30" : "bg-gray-100 text-gray-600"
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package size={36} className="text-gray-300" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Không có giao dịch</p>
          <p className="text-gray-400 text-sm">
            {filter === "income" ? "Chưa có khoản thu nào" : filter === "expense" ? "Chưa có khoản chi nào" : "Chưa có lịch sử giao dịch"}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((trans, idx) => {
            const isOrderLink      = !!trans.resolvedOrderId;
            const isPostLink       = trans.linkType === "post"       && !!trans.resolvedBikeId;
            const isInspectionLink = trans.linkType === "inspection" && !!trans.resolvedBikeId;
            const isClickable      = isOrderLink || isPostLink || isInspectionLink;
            const handleClick = () => {
              if (isOrderLink)           navigate(`/seller/orders/${trans.resolvedOrderId}`);
              else if (isPostLink)       navigate(`/bikes/${trans.resolvedBikeId}`);
              else if (isInspectionLink) navigate(`/seller?tab=inspection`);
            };
            const linkLabel = isOrderLink ? "Xem đơn hàng" : isPostLink ? "Xem bài đăng" : isInspectionLink ? "Xem kiểm định" : null;
            const imgUrl = trans.resolvedBikeId ? bikeImages.get(trans.resolvedBikeId) : undefined;

            return (
              <div key={trans.id || idx} onClick={isClickable ? handleClick : undefined}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  isClickable
                    ? "hover:border-orange-200 hover:bg-orange-50 cursor-pointer border-gray-100 bg-white shadow-sm"
                    : "border-gray-100 bg-white shadow-sm hover:shadow-md"
                }`}>
                {/* Image / icon */}
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                  {imgUrl ? (
                    <img src={imgUrl} alt={trans.resolvedLabel} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${trans.income ? "bg-emerald-50" : "bg-red-50"}`}>
                      {trans.resolvedBikeId
                        ? <Bike size={16} className={trans.income ? "text-emerald-500" : "text-red-500"} />
                        : <span className={`text-sm font-bold ${trans.income ? "text-emerald-600" : "text-red-600"}`}>{trans.income ? "+" : "-"}</span>
                      }
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {trans.resolvedLabel}
                    {linkLabel && <span className="ml-1.5 text-xs text-orange-500 font-normal">→ {linkLabel}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(trans.createdAt)}</p>
                </div>
                {/* Amount */}
                <span className={`text-sm font-extrabold flex-shrink-0 ${trans.income ? "text-emerald-600" : "text-red-600"}`}>
                  {trans.income ? "+" : "-"}{fmtMoney(Math.abs(trans.amount || 0))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
