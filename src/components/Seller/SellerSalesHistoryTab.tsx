/**
 * SellerSalesHistoryTab.tsx
 * 
 * Seller sales history view with filters:
 * - All orders
 * - Completed orders
 * - Cancelled orders
 */

import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { getSellerSalesHistoryAPI } from "../../services/orderService";

type OrderStatus = "ESCROWED" | "ACCEPTED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "RETURN_REQUESTED" | "DISPUTED";

interface SalesHistoryOrder {
  id: number;
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Lịch sử bán hàng</h2>
            <p className="text-sm text-gray-500 mt-0.5">Xem lại tất cả các đơn hàng đã bán và đã hủy</p>
          </div>
          <button
            onClick={() => void fetchSalesHistory()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Đã bán</p>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
            <p className="text-lg font-bold text-blue-600">{fmtMoney(totalRevenue)}</p>
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
          <p className="text-gray-900 font-semibold text-sm mb-1">Không có đơn hàng</p>
          <p className="text-gray-500 text-xs">
            {filter === "completed" && "Chưa có đơn hàng nào hoàn thành"}
            {filter === "cancelled" && "Chưa có đơn hàng nào bị hủy"}
            {filter === "all" && "Chưa có lịch sử bán hàng"}
          </p>
        </div>
      )}

      {/* Orders list */}
      {!loading && filtered.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filtered.map(order => {
            const config = STATUS_CONFIG[order.status];
            return (
              <div
                key={order.id}
                className="p-4 hover:bg-gray-50 transition"
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                  {/* Left: Order info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: config.bg, display: "flex", alignItems: "center", justifyContent: "center", color: config.color, flexShrink: 0 }}>
                        {config.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                          {order.bikeTitle}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b" }}>
                          Người mua: <span style={{ fontWeight: 600, color: "#0f172a" }}>{order.buyerName}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
                      <div>
                        <p style={{ color: "#94a3b8", marginBottom: 2 }}>Số tiền</p>
                        <p style={{ fontWeight: 700, color: "#2563eb" }}>{fmtMoney(order.amountPoints)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", marginBottom: 2 }}>Ngày tạo</p>
                        <p style={{ fontWeight: 600, color: "#0f172a" }}>{fmtDateTime(order.createdAt)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", marginBottom: 2 }}>Trạng thái</p>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", background: config.bg, borderRadius: 6, color: config.color, fontSize: 11, fontWeight: 600 }}>
                          {config.icon}
                          {config.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: View detail button */}
                  <button
                    onClick={() => window.location.href = `/seller/orders/${order.id}`}
                    style={{
                      padding: "8px 14px",
                      background: "transparent",
                      color: "#2563eb",
                      border: "1.5px solid #2563eb",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all .2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
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
