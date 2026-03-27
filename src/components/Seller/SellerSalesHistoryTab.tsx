/**
 * SellerSalesHistoryTab.tsx
 * 
 * Seller sales history view with filters:
 * - All orders
 * - Completed orders
 * - Cancelled orders
 */

import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, AlertCircle, RefreshCw, TrendingUp, Bike } from "lucide-react";
import { getSellerSalesHistoryAPI } from "../../services/orderService";
import { batchGetBikeImages } from "../../utils/bikeImageCache";

type OrderStatus = "ESCROWED" | "ACCEPTED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "RETURN_REQUESTED" | "DISPUTED";

interface SalesHistoryOrder {
  id: number;
  bikeId?: number;
  bikeTitle: string;
  buyerName: string;
  amountPoints: number;
  status: OrderStatus;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ESCROWED: { label: "Chờ xác nhận", color: "#3b82f6", bg: "#eff6ff", icon: <AlertCircle size={14} /> },
  ACCEPTED: { label: "Đã xác nhận", color: "#8b5cf6", bg: "#f5f3ff", icon: <CheckCircle size={14} /> },
  SHIPPED: { label: "Đang vận chuyển", color: "#0ea5e9", bg: "#f0f9ff", icon: <TrendingUp size={14} /> },
  DELIVERED: { label: "Đã giao hàng", color: "#f59e0b", bg: "#fffbeb", icon: <TrendingUp size={14} /> },
  COMPLETED: { label: "Hoàn thành", color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  CANCELLED: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2", icon: <AlertCircle size={14} /> },
  REFUNDED: { label: "Đã hoàn tiền", color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng", color: "#f59e0b", bg: "#fffbeb", icon: <AlertCircle size={14} /> },
  DISPUTED: { label: "Đang tranh chấp", color: "#ef4444", bg: "#fef2f2", icon: <AlertCircle size={14} /> },
};

type FilterKey = "all" | "completed" | "cancelled";

interface SellerSalesHistoryTabProps {
  token: string;
}

export default function SellerSalesHistoryTab({ token }: SellerSalesHistoryTabProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<SalesHistoryOrder[]>([]);
  const [bikeImages, setBikeImages] = useState<Map<number, string>>(new Map());

  const fetchSalesHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSellerSalesHistoryAPI(undefined, token);
      
      // Handle different response formats
      let allOrders: SalesHistoryOrder[] = [];
      
      if (Array.isArray(data)) {
        if (data.length > 0 && data[0]?.order) {
          allOrders = data.map((item: { order: SalesHistoryOrder }) => item.order);
        } else {
          allOrders = data;
        }
      } else if (data?.data) {
        if (Array.isArray(data.data)) {
          if (data.data.length > 0 && data.data[0]?.order) {
            allOrders = data.data.map((item: { order: SalesHistoryOrder }) => item.order);
          } else {
            allOrders = data.data;
          }
        } else if (data.data?.content && Array.isArray(data.data.content)) {
          if (data.data.content.length > 0 && data.data.content[0]?.order) {
            allOrders = data.data.content.map((item: { order: SalesHistoryOrder }) => item.order);
          } else {
            allOrders = data.data.content;
          }
        }
      } else if (data?.content && Array.isArray(data.content)) {
        if (data.content.length > 0 && data.content[0]?.order) {
          allOrders = data.content.map((item: { order: SalesHistoryOrder }) => item.order);
        } else {
          allOrders = data.content;
        }
      }
      
      setOrders(allOrders);

      // Fetch bike images
      const bikeIds = allOrders.map(o => o.bikeId).filter((id): id is number => !!id);
      if (bikeIds.length > 0) {
        batchGetBikeImages(bikeIds, token).then(setBikeImages).catch(() => {});
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void fetchSalesHistory();
    }
  }, [fetchSalesHistory, token]);

  const getFilteredOrders = () => {
    switch (filter) {
      case "completed":
        return orders.filter(o => o.status === "COMPLETED");
      case "cancelled":
        return orders.filter(o => o.status === "CANCELLED");
      default:
        return orders;
    }
  };

  const filtered = getFilteredOrders();
  const completedCount = orders.filter(o => o.status === "COMPLETED").length;
  const cancelledCount = orders.filter(o => o.status === "CANCELLED").length;
  const totalRevenue = orders
    .filter(o => o.status === "COMPLETED")
    .reduce((sum, o) => sum + (o.amountPoints || 0), 0);

  const filterConfig = [
    { key: "all" as FilterKey, label: "Tất cả", count: orders.length },
    { key: "completed" as FilterKey, label: "Đã bán", count: completedCount },
    { key: "cancelled" as FilterKey, label: "Đã hủy", count: cancelledCount },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lịch sử bán hàng</h2>
          <p className="text-sm text-gray-500 mt-0.5">Toàn bộ đơn hàng bạn đã xử lý — hoàn thành, đang giao và đã hủy</p>
        </div>
        <button onClick={() => void fetchSalesHistory()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tổng đơn</p>
            <p className="text-3xl font-extrabold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Đã bán</p>
            <p className="text-3xl font-extrabold text-emerald-700">{completedCount}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Doanh thu</p>
            <p className="text-xl font-extrabold text-orange-700">{fmtMoney(totalRevenue)}</p>
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

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      )}
      {error && !loading && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package size={36} className="text-gray-300" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Không có đơn hàng</p>
          <p className="text-gray-400 text-sm">
            {filter === "completed" ? "Chưa có đơn hàng nào hoàn thành" :
             filter === "cancelled" ? "Chưa có đơn hàng nào bị hủy" : "Chưa có lịch sử bán hàng"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(order => {
            const config = STATUS_CONFIG[order.status];
            const imgUrl = order.bikeId ? bikeImages.get(order.bikeId) : undefined;
            return (
              <div key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                    {imgUrl ? (
                      <img src={imgUrl} alt={order.bikeTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Bike size={28} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-gray-900 truncate">{order.bikeTitle}</p>
                      <span className="text-base font-extrabold text-orange-600 whitespace-nowrap">{fmtMoney(order.amountPoints)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Người mua: <span className="font-semibold text-gray-700">{order.buyerName}</span>
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{ color: config.color, background: config.bg, borderColor: config.color + "33" }}>
                        {config.icon} {config.label}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDateTime(order.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <button onClick={() => window.location.href = `/seller/orders/${order.id}`}
                    className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition">
                    Chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
