import { useCallback, useEffect, useState } from "react";
import { Search, ShoppingBag, CheckCircle, Clock, RefreshCw, Eye, X } from "lucide-react";
import { getAdminOrdersAPI } from "../../../services/Admin/orderManagerService";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED"
  | "ESCROWED";

type FilterStatus = "all" | Lowercase<OrderStatus>;

interface Order {
  id: number;
  buyerId: number;
  buyerName: string;
  bikeId: number;
  bikeTitle: string;
  sellerId: number;
  sellerName: string;
  amountPoints: number;
  status: OrderStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
  deliveryProofImageUrl: string | null;
  deliveryProofImageUrl2: string | null;
  shippingCarrier: string | null;
  trackingCode: string | null;
  shippingNote: string | null;
  returnReason: string | null;
  daysUntilAutoRelease: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Đã giao", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-600" },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn trả", color: "bg-orange-100 text-orange-700" },
  RETURNED: { label: "Đã hoàn trả", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Đã hoàn tiền", color: "bg-pink-100 text-pink-700" },
  ESCROWED: { label: "Đang giữ tiền", color: "bg-indigo-100 text-indigo-700" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPoints(value: number) {
  return value.toLocaleString("vi-VN") + " pts";
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Chi tiết đơn hàng #{order.id}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Trạng thái:</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Bike */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Xe đạp</p>
            <p className="font-semibold text-gray-900">{order.bikeTitle}</p>
            <p className="text-sm text-blue-700 font-medium mt-1">{formatPoints(order.amountPoints)}</p>
          </div>

          {/* Buyer / Seller */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Người mua</p>
              <p className="font-medium text-gray-900">{order.buyerName}</p>
              <p className="text-xs text-gray-400">ID: {order.buyerId}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Người bán</p>
              <p className="font-medium text-gray-900">{order.sellerName}</p>
              <p className="text-xs text-gray-400">ID: {order.sellerId}</p>
            </div>
          </div>

          {/* Shipping info */}
          <div className="space-y-2 text-sm">
            {order.shippingCarrier && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Đơn vị vận chuyển:</span>
                <span className="text-gray-900">{order.shippingCarrier}</span>
              </div>
            )}
            {order.trackingCode && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Mã vận đơn:</span>
                <span className="text-gray-900 font-mono">{order.trackingCode}</span>
              </div>
            )}
            {order.shippingNote && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Ghi chú:</span>
                <span className="text-gray-900">{order.shippingNote}</span>
              </div>
            )}
            {order.returnReason && (
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-1">Lý do hoàn trả</p>
                <p className="text-gray-700">{order.returnReason}</p>
              </div>
            )}
            {order.daysUntilAutoRelease !== null && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Tự động giải phóng:</span>
                <span className="text-gray-900">{order.daysUntilAutoRelease} ngày</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <span>Tạo: {formatDate(order.createdAt)}</span>
            <span>Cập nhật: {formatDate(order.updatedAt)}</span>
            {order.acceptedAt && <span>Xác nhận: {formatDate(order.acceptedAt)}</span>}
            {order.deliveredAt && <span>Giao hàng: {formatDate(order.deliveredAt)}</span>}
          </div>

          {/* Delivery proof images */}
          {(order.deliveryProofImageUrl || order.deliveryProofImageUrl2) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ảnh giao hàng</p>
              <div className="flex gap-3">
                {order.deliveryProofImageUrl && (
                  <img src={order.deliveryProofImageUrl} alt="Proof 1" className="h-24 w-24 rounded-lg object-cover" />
                )}
                {order.deliveryProofImageUrl2 && (
                  <img src={order.deliveryProofImageUrl2} alt="Proof 2" className="h-24 w-24 rounded-lg object-cover" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManagerOrder() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminOrdersAPI();
      const list = response?.data ?? [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      o.buyerName.toLowerCase().includes(keyword) ||
      o.sellerName.toLowerCase().includes(keyword) ||
      o.bikeTitle.toLowerCase().includes(keyword) ||
      String(o.id).includes(keyword) ||
      o.idempotencyKey.toLowerCase().includes(keyword);
    const matchStatus =
      filterStatus === "all" || o.status.toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const totalPoints = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.amountPoints, 0);

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {selectedOrder && (
        <DetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
          <p className="mt-1 text-sm text-gray-500">Tất cả đơn hàng trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Tổng đơn hàng", value: orders.length, icon: ShoppingBag, color: "bg-blue-100 text-blue-700" },
          { label: "Hoàn thành", value: completedCount, icon: CheckCircle, color: "bg-green-100 text-green-700" },
          { label: "Chờ xử lý", value: pendingCount, icon: Clock, color: "bg-yellow-100 text-yellow-700" },
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

      {/* Total points banner */}
      <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <CheckCircle size={20} className="text-green-600" />
        </span>
        <div>
          <div className="text-xl font-bold text-gray-900">{formatPoints(totalPoints)}</div>
          <div className="text-xs text-gray-500">Tổng điểm từ đơn hàng hoàn thành</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Tìm người mua, người bán, tên xe, mã đơn..."
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
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="delivered">Đã giao</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
          <option value="return_requested">Yêu cầu hoàn trả</option>
          <option value="returned">Đã hoàn trả</option>
          <option value="refunded">Đã hoàn tiền</option>
          <option value="escrowed">Đang giữ tiền</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchOrders} className="text-sm text-gray-600 underline">
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
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 font-medium text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const statusInfo = STATUS_LABEL[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-blue-50">
                    <td className="px-5 py-3 font-medium text-gray-500">#{o.id}</td>
                    <td className="px-5 py-3">
                      <div className="max-w-[200px] truncate font-medium text-gray-900">{o.bikeTitle}</div>
                      <div className="text-xs text-gray-400">{o.idempotencyKey}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{o.buyerName}</td>
                    <td className="px-5 py-3 text-gray-700">{o.sellerName}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatPoints(o.amountPoints)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
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
                    Không có đơn hàng nào
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