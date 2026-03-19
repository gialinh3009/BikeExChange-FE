import { useCallback, useEffect, useState } from "react";
import { Search, ArrowLeftRight, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { getAdminTransactionsAPI } from "../../../services/Admin/transactionsManagerService";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxStatus = "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
type TxType =
  | "ESCROW_RELEASE"
  | "SPEND"
  | "EARN"
  | "WITHDRAW"
  | "DEPOSIT"
  | "REFUND"
  | "COMMISSION"
  | "ESCROW"
  | "ADMIN_ADJUST";

type FilterStatus = "all" | Lowercase<TxStatus>;
type FilterType = "all" | Lowercase<TxType>;

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: TxType;
  status: TxStatus;
  referenceId: string | null;
  remarks: string | null;
  userEmail: string;
  userFullName: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TxStatus, { label: string; color: string }> = {
  SUCCESS: { label: "Thành công", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
};

const TYPE_LABEL: Record<TxType, { label: string; color: string }> = {
  ESCROW_RELEASE: { label: "Giải phóng ký quỹ", color: "bg-indigo-100 text-indigo-700" },
  SPEND: { label: "Chi tiêu", color: "bg-orange-100 text-orange-700" },
  EARN: { label: "Thu nhập", color: "bg-green-100 text-green-700" },
  WITHDRAW: { label: "Rút điểm", color: "bg-red-100 text-red-700" },
  DEPOSIT: { label: "Nạp điểm", color: "bg-blue-100 text-blue-700" },
  REFUND: { label: "Hoàn tiền", color: "bg-pink-100 text-pink-700" },
  COMMISSION: { label: "Hoa hồng", color: "bg-purple-100 text-purple-700" },
  ESCROW: { label: "Ký quỹ", color: "bg-cyan-100 text-cyan-700" },
  ADMIN_ADJUST: { label: "Điều chỉnh admin", color: "bg-gray-100 text-gray-700" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPoints(value: number) {
  return value.toLocaleString("vi-VN") + " VNĐ";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManagerTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminTransactionsAPI();
      const list = response?.data ?? [];
      setTransactions(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách giao dịch.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = transactions.filter((t) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      t.userFullName.toLowerCase().includes(keyword) ||
      t.userEmail.toLowerCase().includes(keyword) ||
      String(t.id).includes(keyword) ||
      (t.referenceId ?? "").toLowerCase().includes(keyword) ||
      (t.remarks ?? "").toLowerCase().includes(keyword);
    const matchStatus =
      filterStatus === "all" || t.status.toLowerCase() === filterStatus;
    const matchType =
      filterType === "all" || t.type.toLowerCase() === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const successCount = transactions.filter((t) => t.status === "SUCCESS").length;
  const failedCount = transactions.filter((t) => t.status === "FAILED").length;
  const totalVolume = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Giao Dịch</h1>
          <p className="mt-1 text-sm text-gray-500">Tất cả giao dịch điểm trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={fetchTransactions}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Tổng giao dịch", value: transactions.length, icon: ArrowLeftRight, color: "bg-blue-100 text-blue-700" },
          { label: "Thành công", value: successCount, icon: CheckCircle, color: "bg-green-100 text-green-700" },
          { label: "Thất bại", value: failedCount, icon: XCircle, color: "bg-red-100 text-red-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
            </span>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Volume banner */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ArrowLeftRight size={20} className="text-blue-600" />
        </span>
        <div>
          <div className="text-xl font-bold text-gray-900">{formatPoints(totalVolume)}</div>
          <div className="text-xs text-gray-500">Tổng khối lượng giao dịch thành công</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Tìm tên, email, mã tham chiếu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="success">Thành công</option>
          <option value="pending">Đang xử lý</option>
          <option value="failed">Thất bại</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
        >
          <option value="all">Tất cả loại</option>
          <option value="escrow_release">Giải phóng ký quỹ</option>
          <option value="spend">Chi tiêu</option>
          <option value="earn">Thu nhập</option>
          <option value="withdraw">Rút điểm</option>
          <option value="deposit">Nạp điểm</option>
          <option value="refund">Hoàn tiền</option>
          <option value="commission">Hoa hồng</option>
          <option value="escrow">Ký quỹ</option>
          <option value="admin_adjust">Điều chỉnh admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchTransactions} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Người dùng</th>
                <th className="px-5 py-3 font-medium text-right">Số điểm</th>
                <th className="px-5 py-3 font-medium">Loại</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Mã tham chiếu</th>
                <th className="px-5 py-3 font-medium">Ghi chú</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const statusInfo = STATUS_LABEL[t.status] ?? { label: t.status, color: "bg-gray-100 text-gray-600" };
                const typeInfo = TYPE_LABEL[t.type] ?? { label: t.type, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-blue-50">
                    <td className="px-5 py-3 font-medium text-gray-500">#{t.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{t.userFullName}</div>
                      <div className="text-xs text-gray-400">{t.userEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatPoints(t.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-[180px] truncate text-xs text-gray-500">
                      {t.referenceId ?? "—"}
                    </td>
                    <td className="px-5 py-3 max-w-[160px] truncate text-xs text-gray-500">
                      {t.remarks ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Không có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
