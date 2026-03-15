import { useCallback, useEffect, useState } from "react";
import { Search, AlertTriangle, ShoppingBag, RefreshCw, Eye, X, CheckCircle, XCircle } from "lucide-react";
import {
  getPendingDisputesAPI,
  resolveDisputeAPI,
  rejectDisputeAPI,
} from "../../../services/Admin/disputesManagementService";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED";

interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
  rating: number;
  shopName: string | null;
}

interface Brand {
  id: number;
  name: string;
}

interface BikeMedia {
  id: number;
  url: string;
  type: string;
  sortOrder: number;
}

interface Bike {
  id: number;
  title: string;
  brand: Brand;
  model: string;
  year: number;
  pricePoints: number;
  condition: string;
  location: string;
  seller: UserInfo;
  media: BikeMedia[];
}

interface Order {
  id: number;
  buyer: UserInfo;
  bike: Bike;
  amountPoints: number;
  status: OrderStatus;
  idempotencyKey: string;
  deliveredAt: string | null;
  returnReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Dispute {
  id: number;
  order: Order;
  reason?: string;
  status?: string;
  createdAt?: string;
  resolvedAt?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUS_LABEL: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Đã giao", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn trả", color: "bg-orange-100 text-orange-700" },
  RETURNED: { label: "Đã hoàn trả", color: "bg-red-100 text-red-700" },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatPoints(value: number) {
  return value.toLocaleString("vi-VN") + " pts";
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  dispute: Dispute;
  onClose: () => void;
  onResolve: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: boolean;
}

function DetailModal({ dispute, onClose, onResolve, onReject, actionLoading }: DetailModalProps) {
  const { order } = dispute;
  const statusInfo = ORDER_STATUS_LABEL[order.status] ?? {
    label: order.status,
    color: "bg-gray-100 text-gray-600",
  };
  const thumbUrl = order.bike.media?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Chi tiết khiếu nại #{dispute.id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5" style={{ maxHeight: "70vh" }}>
          {/* Bike info */}
          <div className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            {thumbUrl && (
              <img
                src={thumbUrl}
                alt={order.bike.title}
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{order.bike.title}</p>
              <p className="text-sm text-gray-500">
                {order.bike.brand.name} · {order.bike.model} · {order.bike.year}
              </p>
              <p className="text-sm text-gray-500">{order.bike.location}</p>
              <p className="mt-1 text-sm font-medium text-blue-700">{formatPoints(order.amountPoints)}</p>
            </div>
          </div>

          {/* Order status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Trạng thái đơn hàng:</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Buyer / Seller */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Người mua</p>
              <p className="font-medium text-gray-900">{order.buyer.fullName}</p>
              <p className="text-xs text-gray-500">{order.buyer.email}</p>
              <p className="text-xs text-gray-500">{order.buyer.phone}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Người bán</p>
              <p className="font-medium text-gray-900">{order.bike.seller.fullName}</p>
              <p className="text-xs text-gray-500">{order.bike.seller.email}</p>
              <p className="text-xs text-gray-500">{order.bike.seller.phone}</p>
              {order.bike.seller.shopName && (
                <p className="text-xs text-blue-600">{order.bike.seller.shopName}</p>
              )}
            </div>
          </div>

          {/* Return reason */}
          {order.returnReason && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-500">
                Lý do hoàn trả
              </p>
              <p className="text-sm text-gray-700">{order.returnReason}</p>
            </div>
          )}

          {/* Dispute reason */}
          {dispute.reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                Nội dung khiếu nại
              </p>
              <p className="text-sm text-gray-700">{dispute.reason}</p>
            </div>
          )}

          {/* Dates */}
          <div className="flex gap-6 text-sm text-gray-500">
            <span>Đơn tạo: {formatDate(order.createdAt)}</span>
            {order.deliveredAt && <span>Giao hàng: {formatDate(order.deliveredAt)}</span>}
            {dispute.createdAt && <span>Khiếu nại: {formatDate(dispute.createdAt)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={() => onReject(dispute.id)}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle size={15} /> Từ chối
          </button>
          <button
            type="button"
            onClick={() => onResolve(dispute.id)}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={15} /> Chấp nhận hoàn trả
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManagementDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingDisputesAPI();
      const list = response?.data ?? [];
      setDisputes(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khiếu nại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (disputeId: number) => {
    setActionLoading(true);
    try {
      await resolveDisputeAPI(disputeId, "APPROVED");
      showToast("success", "Đã chấp nhận khiếu nại thành công.");
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      showToast("error", err.message || "Xử lý thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (disputeId: number) => {
    if (!window.confirm("Bạn có chắc muốn từ chối khiếu nại này?")) return;
    setActionLoading(true);
    try {
      await rejectDisputeAPI(disputeId, "REJECTED");
      showToast("success", "Đã từ chối khiếu nại.");
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      showToast("error", err.message || "Xử lý thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = disputes.filter((d) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      d.order.buyer.fullName.toLowerCase().includes(keyword) ||
      d.order.buyer.email.toLowerCase().includes(keyword) ||
      d.order.bike.seller.fullName.toLowerCase().includes(keyword) ||
      d.order.bike.title.toLowerCase().includes(keyword) ||
      String(d.id).includes(keyword) ||
      String(d.order.id).includes(keyword)
    );
  });

  const returnRequestedCount = disputes.filter(
    (d) => d.order.status === "RETURN_REQUESTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDispute && (
        <DetailModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onResolve={handleResolve}
          onReject={handleReject}
          actionLoading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Khiếu Nại</h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách khiếu nại đang chờ xử lý trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDisputes}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Tổng khiếu nại chờ xử lý", value: disputes.length, icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
          { label: "Yêu cầu hoàn trả", value: returnRequestedCount, icon: ShoppingBag, color: "bg-red-100 text-red-700" },
          { label: "Kết quả tìm kiếm", value: filtered.length, icon: Search, color: "bg-blue-100 text-blue-700" },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Tìm theo người mua, người bán, xe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchDisputes} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Xe đạp</th>
                <th className="px-5 py-3 font-medium">Người mua</th>
                <th className="px-5 py-3 font-medium">Người bán</th>
                <th className="px-5 py-3 font-medium text-right">Giá trị</th>
                <th className="px-5 py-3 font-medium">Trạng thái đơn</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dispute) => {
                const { order } = dispute;
                const statusInfo = ORDER_STATUS_LABEL[order.status] ?? {
                  label: order.status,
                  color: "bg-gray-100 text-gray-600",
                };
                const thumbUrl = order.bike.media?.[0]?.url;

                return (
                  <tr key={dispute.id} className="border-b border-gray-50 hover:bg-blue-50">
                    <td className="px-5 py-3 font-medium text-gray-500">#{dispute.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {thumbUrl && (
                          <img
                            src={thumbUrl}
                            alt={order.bike.title}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="max-w-xs truncate font-medium text-gray-900">
                            {order.bike.title}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.bike.brand.name} · {order.bike.year}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{order.buyer.fullName}</div>
                      <div className="text-xs text-gray-400">{order.buyer.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{order.bike.seller.fullName}</div>
                      <div className="text-xs text-gray-400">{order.bike.seller.shopName ?? order.bike.seller.email}</div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatPoints(order.amountPoints)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedDispute(dispute)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Eye size={13} /> Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Không có khiếu nại nào chờ xử lý
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