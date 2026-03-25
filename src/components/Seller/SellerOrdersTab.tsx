/**
 * SellerOrdersTab.tsx
 * 
 * Seller orders management with 3 tabs:
 * 1. ESCROWED - Danh sách đơn chờ xác nhận
 * 2. ACCEPTED - Danh sách đơn đã xác nhận (chuẩn bị giao)
 * 3. DELIVERED - Danh sách đơn đã giao (chờ buyer confirm)
 */

import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, Truck, Clock, AlertCircle, RefreshCw, RotateCcw, X } from "lucide-react";
import { confirmDeliveryAPI, confirmReturnAPI, getSellerSalesHistoryAPI, sellerCancelOrderAPI } from "../../services/orderService";
import OrderApprovalModal from "./OrderApprovalModal";
import OrderDeliveryForm from "./OrderDeliveryForm";

type OrderStatus = "ESCROWED" | "ACCEPTED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "RETURN_REQUESTED" | "DISPUTED";

interface SellerOrder {
  id: number;
  bikeTitle: string;
  buyerName: string;
  amountPoints: number;
  status: OrderStatus;
  createdAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
  shippingCarrier?: string;
  trackingCode?: string;
  daysUntilAutoRelease?: number;
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
  ESCROWED: { label: "Chờ xác nhận", color: "#3b82f6", bg: "#eff6ff", icon: <Clock size={14} /> },
  ACCEPTED: { label: "Đã xác nhận", color: "#8b5cf6", bg: "#f5f3ff", icon: <CheckCircle size={14} /> },
  SHIPPED: { label: "Đang vận chuyển", color: "#0ea5e9", bg: "#f0f9ff", icon: <Truck size={14} /> },
  DELIVERED: { label: "Đã giao hàng", color: "#f59e0b", bg: "#fffbeb", icon: <Truck size={14} /> },
  COMPLETED: { label: "Hoàn thành", color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  CANCELLED: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2", icon: <AlertCircle size={14} /> },
  REFUNDED: { label: "Đã hoàn tiền", color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng", color: "#f59e0b", bg: "#fffbeb", icon: <AlertCircle size={14} /> },
  DISPUTED: { label: "Đang tranh chấp", color: "#ef4444", bg: "#fef2f2", icon: <AlertCircle size={14} /> },
};

type TabKey = "escrowed" | "accepted" | "shipped" | "delivered" | "returnRequested";

interface SellerOrdersTabProps {
  token: string;
}

export default function SellerOrdersTab({ token }: SellerOrdersTabProps) {
  const [tab, setTab] = useState<TabKey>("escrowed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [actionOrderId, setActionOrderId] = useState<number | null>(null);

  // Modals
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });
  const [shippingNotice, setShippingNotice] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });

  const fetchOrders = useCallback(async () => {
    console.log("🔄 Starting fetchOrders, token:", token ? "✓ Present" : "✗ Missing");
    setLoading(true);
    setError("");
    try {
      const data = await getSellerSalesHistoryAPI(undefined, token);
      console.log("📦 Raw API Response:", data);
      console.log("📦 Response type:", typeof data);
      console.log("📦 Response keys:", Object.keys(data || {}));
      
      // Handle different response formats
      let allOrders: SellerOrder[] = [];
      
      if (Array.isArray(data)) {
        // If data is array of objects with 'order' field, extract them
        if (data.length > 0 && data[0]?.order) {
          allOrders = data.map((item: { order: SellerOrder }) => item.order);
        } else {
          allOrders = data;
        }
      } else if (data?.data) {
        if (Array.isArray(data.data)) {
          // Check if items have 'order' field
          if (data.data.length > 0 && data.data[0]?.order) {
            allOrders = data.data.map((item: { order: SellerOrder }) => item.order);
          } else {
            allOrders = data.data;
          }
        } else if (data.data?.content && Array.isArray(data.data.content)) {
          if (data.data.content.length > 0 && data.data.content[0]?.order) {
            allOrders = data.data.content.map((item: { order: SellerOrder }) => item.order);
          } else {
            allOrders = data.data.content;
          }
        } else if (data.data?.orders && Array.isArray(data.data.orders)) {
          allOrders = data.data.orders;
        }
      } else if (data?.content && Array.isArray(data.content)) {
        if (data.content.length > 0 && data.content[0]?.order) {
          allOrders = data.content.map((item: { order: SellerOrder }) => item.order);
        } else {
          allOrders = data.content;
        }
      } else if (data?.orders && Array.isArray(data.orders)) {
        allOrders = data.orders;
      }
      
      console.log("✅ Parsed orders count:", allOrders.length);
      if (allOrders.length > 0) {
        console.log("✅ First order structure:", allOrders[0]);
        console.log("✅ First order keys:", Object.keys(allOrders[0]));
      }
      console.log("✅ Orders:", allOrders);
      
      // Log status distribution
      const statusCounts: Record<string, number> = {};
      allOrders.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });
      console.log("📊 Status distribution:", statusCounts);
      
      setOrders(allOrders);
    } catch (e) {
      console.error("❌ Fetch orders error:", e);
      setError(String(e instanceof Error ? e.message : e));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    console.log("📌 useEffect triggered, token available:", !!token);
    if (token) {
      void fetchOrders();
    } else {
      console.warn("⚠️ No token available");
    }
  }, [fetchOrders, token]);

  const getFilteredOrders = () => {
    const statusMap: Record<TabKey, OrderStatus[]> = {
      escrowed: ["ESCROWED"],
      accepted: ["ACCEPTED"],
      shipped: ["SHIPPED"],
      delivered: ["DELIVERED"],
      returnRequested: ["RETURN_REQUESTED"],
    };
    return orders.filter(o => statusMap[tab].includes(o.status));
  };

  const handleConfirmReturn = async (orderId: number) => {
    if (!confirm("Xác nhận đã nhận lại hàng từ buyer?")) return;
    setActionOrderId(orderId);
    try {
      await confirmReturnAPI(orderId, token);
      await fetchOrders();
    } catch (e) {
      alert(String(e instanceof Error ? e.message : e));
    } finally {
      setActionOrderId(null);
    }
  };

  const handleSellerCancel = async (orderId: number) => {
    if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này? Tiền ký quỹ sẽ được hoàn lại cho người mua.")) return;
    setActionOrderId(orderId);
    try {
      await sellerCancelOrderAPI(orderId, token);
      await fetchOrders();
    } catch (e) {
      alert(String(e instanceof Error ? e.message : e));
    } finally {
      setActionOrderId(null);
    }
  };

  const handleConfirmDelivery = async (orderId: number) => {
    setActionOrderId(orderId);
    try {
      await confirmDeliveryAPI(orderId, token);
      await fetchOrders();
    } catch (e) {
      alert(String(e instanceof Error ? e.message : e));
    } finally {
      setActionOrderId(null);
    }
  };

  const handleApprovalSuccess = () => {
    setApprovalModal({ open: false, order: null });
    void fetchOrders();
  };

  const handleDeliverySuccess = () => {
    setDeliveryModal({ open: false, order: null });
    void fetchOrders();
  };

  const filtered = getFilteredOrders();

  const tabConfig = [
    { key: "escrowed" as TabKey, label: "Chờ xác nhận", count: orders.filter(o => o.status === "ESCROWED").length },
    { key: "accepted" as TabKey, label: "Chuẩn bị giao", count: orders.filter(o => o.status === "ACCEPTED").length },
    { key: "shipped" as TabKey, label: "Đang vận chuyển", count: orders.filter(o => o.status === "SHIPPED").length },
    { key: "delivered" as TabKey, label: "Đã giao", count: orders.filter(o => o.status === "DELIVERED").length },
    { key: "returnRequested" as TabKey, label: "Hoàn hàng", count: orders.filter(o => o.status === "RETURN_REQUESTED").length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Đơn hàng của tôi</h2>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả đơn hàng bán hàng</p>
          </div>
          <button
            onClick={() => void fetchOrders()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
          {tabConfig.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                tab === t.key ? "bg-white/30" : "bg-gray-200"
              }`}>
                {t.count}
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
            {tab === "escrowed" && "Chưa có đơn hàng nào chờ xác nhận"}
            {tab === "accepted" && "Chưa có đơn hàng nào chuẩn bị giao"}
            {tab === "shipped" && "Chưa có đơn hàng nào đang vận chuyển"}
            {tab === "delivered" && "Chưa có đơn hàng nào đã giao"}
            {tab === "returnRequested" && "Chưa có đơn hoàn hàng nào chờ xác nhận"}
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
                className="order-card"
                style={{
                  background: "white",
                  borderRadius: 14,
                  border: "1.5px solid #e8ecf4",
                  padding: 16,
                  transition: "all .2s",
                  cursor: "pointer",
                }}
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

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                      <div>
                        <p style={{ color: "#94a3b8", marginBottom: 2 }}>Số tiền</p>
                        <p style={{ fontWeight: 700, color: "#2563eb" }}>{fmtMoney(order.amountPoints)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94a3b8", marginBottom: 2 }}>Ngày tạo</p>
                        <p style={{ fontWeight: 600, color: "#0f172a" }}>{fmtDateTime(order.createdAt)}</p>
                      </div>
                    </div>

                    {/* Shipping info for DELIVERED */}
                    {order.status === "DELIVERED" && (
                      <div style={{ marginTop: 12, padding: "10px 12px", background: "#f8faff", borderRadius: 8, fontSize: 12 }}>
                        <p style={{ color: "#94a3b8", marginBottom: 4 }}>Thông tin vận chuyển</p>
                        <p style={{ color: "#0f172a", fontWeight: 600 }}>
                          {order.shippingCarrier} - {order.trackingCode}
                        </p>
                        {order.daysUntilAutoRelease && (
                          <p style={{ color: "#f59e0b", marginTop: 4, fontSize: 11 }}>
                            ⏱️ Tự động giải phóng trong {order.daysUntilAutoRelease} ngày
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Action button */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                    {order.status === "ESCROWED" && (
                      <>
                        <button
                          onClick={() => setApprovalModal({ open: true, order })}
                          style={{
                            padding: "10px 14px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "opacity .2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          ✓ Xác nhận
                        </button>
                        <button
                          onClick={() => void handleSellerCancel(order.id)}
                          disabled={actionOrderId === order.id}
                          style={{
                            padding: "10px 14px",
                            background: actionOrderId === order.id ? "#94a3b8" : "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: actionOrderId === order.id ? "not-allowed" : "pointer",
                            transition: "opacity .2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                          onMouseEnter={(e) => !actionOrderId && (e.currentTarget.style.opacity = "0.85")}
                          onMouseLeave={(e) => !actionOrderId && (e.currentTarget.style.opacity = "1")}
                        >
                          <X size={13} /> {actionOrderId === order.id ? "Đang xử lý..." : "Hủy"}
                        </button>
                      </>
                    )}

                    {order.status === "ACCEPTED" && (
                      <button
                        onClick={() => setShippingNotice({ open: true, order })}
                        style={{
                          padding: "10px 14px",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "opacity .2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        🚚 Giao hàng
                      </button>
                    )}

                    {order.status === "SHIPPED" && (
                      <button
                        onClick={() => void handleConfirmDelivery(order.id)}
                        disabled={actionOrderId === order.id}
                        style={{
                          padding: "10px 14px",
                          background: actionOrderId === order.id ? "#94a3b8" : "#0ea5e9",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: actionOrderId === order.id ? "not-allowed" : "pointer",
                          transition: "opacity .2s",
                        }}
                      >
                        {actionOrderId === order.id ? "Đang xử lý..." : "✅ Xác nhận đã giao"}
                      </button>
                    )}

                    {order.status === "DELIVERED" && (
                      <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, textAlign: "center" }}>
                        <p style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Chờ buyer confirm</p>
                      </div>
                    )}

                    {order.status === "RETURN_REQUESTED" && (
                      <button
                        onClick={() => void handleConfirmReturn(order.id)}
                        disabled={actionOrderId === order.id}
                        style={{
                          padding: "10px 14px",
                          background: actionOrderId === order.id ? "#94a3b8" : "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: actionOrderId === order.id ? "not-allowed" : "pointer",
                          transition: "opacity .2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <RotateCcw size={13} /> {actionOrderId === order.id ? "Đang xử lý..." : "Xác nhận nhận hàng trả"}
                      </button>
                    )}

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
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <OrderApprovalModal
        isOpen={approvalModal.open}
        order={approvalModal.order}
        token={token}
        onClose={() => setApprovalModal({ open: false, order: null })}
        onSuccess={handleApprovalSuccess}
      />

      <OrderDeliveryForm
        isOpen={deliveryModal.open}
        order={deliveryModal.order}
        token={token}
        onClose={() => setDeliveryModal({ open: false, order: null })}
        onSuccess={handleDeliverySuccess}
      />

      {/* Shipping Notice Modal */}
      {shippingNotice.open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "white", borderRadius: 16, maxWidth: 480, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>📦</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  Lưu ý về phí vận chuyển
                </h3>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 16 }}>
                Người bán và người mua vui lòng <strong>chủ động thương lượng phí vận chuyển</strong> trước khi tiến hành giao dịch.
              </p>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 12 }}>
                BikeExchange không tham gia tính toán hoặc thu hộ phí vận chuyển. Nền tảng chỉ hỗ trợ:
              </p>
              <ul style={{ margin: "0 0 16px 0", paddingLeft: 20, fontSize: 14, color: "#374151", lineHeight: 2 }}>
                <li>Cung cấp đơn vị vận chuyển</li>
                <li>Cung cấp mã vận đơn</li>
              </ul>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 0 }}>
                nhằm giúp người dùng dễ dàng theo dõi trạng thái đơn hàng.
              </p>
              <div style={{
                marginTop: 16, padding: "12px 14px", background: "#fef3c7",
                borderRadius: 10, border: "1px solid #fcd34d",
              }}>
                <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
                  👉 Vì vậy, hãy thống nhất rõ ràng chi phí vận chuyển giữa hai bên để tránh phát sinh vấn đề không mong muốn.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: "flex", gap: 12, padding: "16px 24px 20px",
              borderTop: "1px solid #e5e7eb",
            }}>
              <button
                onClick={() => setShippingNotice({ open: false, order: null })}
                style={{
                  flex: 1, padding: "11px 16px", background: "#f1f5f9",
                  color: "#374151", border: "none", borderRadius: 9,
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              >
                Đã hiểu
              </button>
              <button
                onClick={() => {
                  const order = shippingNotice.order;
                  setShippingNotice({ open: false, order: null });
                  setDeliveryModal({ open: true, order });
                }}
                style={{
                  flex: 1, padding: "11px 16px", background: "#10b981",
                  color: "white", border: "none", borderRadius: 9,
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
              >
                🚚 Đã xác nhận với người mua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
