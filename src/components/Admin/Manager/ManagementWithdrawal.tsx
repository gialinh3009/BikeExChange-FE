import { useCallback, useEffect, useState } from "react";
import { Search, Wallet, CheckCircle, Clock, XCircle, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  getWithdrawalsAPI,
  approveWithdrawalAPI,
  rejectWithdrawalAPI,
} from "../../../services/Admin/withdrawalsManagerServices.js";


// ─── Types ────────────────────────────────────────────────────────────────────


type WithdrawalStatus = "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
type WithdrawalType = "WITHDRAW" | "DEPOSIT";
type FilterStatus = "all" | Lowercase<WithdrawalStatus>;


interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  type: WithdrawalType;
  status: WithdrawalStatus;
  referenceId: string | null;
  remarks: string | null;
  userEmail: string;
  userFullName: string;
  createdAt: string;
}


// ─── Constants ────────────────────────────────────────────────────────────────


const STATUS_LABEL: Record<WithdrawalStatus, { label: string; color: string }> = {
  SUCCESS: { label: "Thành công", color: "bg-green-100 text-green-700" },
  PENDING: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
};


const TYPE_LABEL: Record<WithdrawalType, { label: string; color: string }> = {
  WITHDRAW: { label: "Rút điểm", color: "bg-orange-100 text-orange-700" },
  DEPOSIT: { label: "Nạp điểm", color: "bg-blue-100 text-blue-700" },
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
  return value.toLocaleString("vi-VN") + " ₫";
}


// ─── Main Component ───────────────────────────────────────────────────────────


// ─── Reject Modal ─────────────────────────────────────────────────────────────


interface RejectModalProps {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}


function RejectModal({ onConfirm, onClose, loading }: RejectModalProps) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Lý do từ chối</h2>
        <textarea
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          rows={3}
          placeholder="Nhập lý do từ chối..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────


export default function ManagementWithdrawal() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);


  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWithdrawalsAPI();
      const list = response?.data ?? [];
      setWithdrawals(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách rút điểm.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);


  const filtered = withdrawals.filter((w) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      w.userFullName.toLowerCase().includes(keyword) ||
      w.userEmail.toLowerCase().includes(keyword) ||
      String(w.id).includes(keyword) ||
      (w.referenceId ?? "").toLowerCase().includes(keyword);
    const matchStatus =
      filterStatus === "all" || w.status.toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });


  const handleApprove = async (id: number) => {
    if (!window.confirm("Xác nhận duyệt yêu cầu rút điểm này?")) return;
    setActionLoading(true);
    try {
      await approveWithdrawalAPI(id);
      showToast("success", "Đã duyệt yêu cầu rút điểm.");
      fetchWithdrawals();
    } catch (err: any) {
      showToast("error", err.message || "Duyệt thất bại.");
    } finally {
      setActionLoading(false);
    }
  };


  const handleReject = async (reason: string) => {
    if (!rejectTargetId) return;
    setActionLoading(true);
    try {
      await rejectWithdrawalAPI(rejectTargetId, reason);
      showToast("success", "Đã từ chối yêu cầu rút điểm.");
      setRejectTargetId(null);
      fetchWithdrawals();
    } catch (err: any) {
      showToast("error", err.message || "Từ chối thất bại.");
    } finally {
      setActionLoading(false);
    }
  };


  const successCount = withdrawals.filter((w) => w.status === "SUCCESS").length;
  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;
  const totalPoints = withdrawals
    .filter((w) => w.status === "SUCCESS" && w.type === "WITHDRAW")
    .reduce((sum, w) => sum + w.amount, 0);


  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}


      {/* Reject Modal */}
      {rejectTargetId !== null && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setRejectTargetId(null)}
          loading={actionLoading}
        />
      )}


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Rút Điểm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách các yêu cầu rút điểm trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={fetchWithdrawals}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Tổng giao dịch", value: withdrawals.length, icon: Wallet, color: "bg-blue-100 text-blue-700" },
          { label: "Thành công", value: successCount, icon: CheckCircle, color: "bg-green-100 text-green-700" },
          { label: "Đang xử lý", value: pendingCount, icon: Clock, color: "bg-yellow-100 text-yellow-700" },
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


      {/* Total withdrawn points banner */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <XCircle size={20} className="text-orange-600" />
        </span>
        <div>
          <div className="text-xl font-bold text-gray-900">{formatPoints(totalPoints)}</div>
          <div className="text-xs text-gray-500">Tổng điểm đã rút thành công</div>
        </div>
      </div>


      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Tìm tên, email, mã giao dịch..."
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
      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchWithdrawals} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Người dùng</th>
                <th className="px-5 py-3 font-medium text-right">Số tiền (VND)</th>
                <th className="px-5 py-3 font-medium">Loại</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Mã tham chiếu</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const statusInfo = STATUS_LABEL[w.status] ?? { label: w.status, color: "bg-gray-100 text-gray-600" };
                const typeInfo = TYPE_LABEL[w.type] ?? { label: w.type, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-blue-50">
                    <td className="px-5 py-3 font-medium text-gray-500">#{w.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{w.userFullName}</div>
                      <div className="text-xs text-gray-400">{w.userEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatPoints(w.amount)}
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
                    <td className="px-5 py-3 max-w-xs truncate text-gray-500 text-xs">
                      {w.referenceId ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(w.createdAt)}</td>
                    <td className="px-5 py-3 text-center">
                      {w.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(w.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <ThumbsUp size={12} /> Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectTargetId(w.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            <ThumbsDown size={12} /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
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



