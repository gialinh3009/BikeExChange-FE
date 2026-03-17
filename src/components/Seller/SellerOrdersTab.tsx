/**
 * SellerOrdersTab.tsx
 * 
 * Seller orders management with 3 tabs:
 * 1. ESCROWED - Danh sách đơn chờ xác nhận
 * 2. ACCEPTED - Danh sách đơn đã xác nhận (chuẩn bị giao)
 * 3. DELIVERED - Danh sách đơn đã giao (chờ buyer confirm)
 */

import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, Truck, Clock, AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import { confirmReturnAPI, getSellerSalesHistoryAPI } from "../../services/orderService";
import OrderApprovalModal from "./OrderApprovalModal";
import OrderDeliveryForm from "./OrderDeliveryForm";

type OrderStatus = "ESCROWED" | "ACCEPTED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "RETURN_REQUESTED" | "DISPUTED";

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
  DELIVERED: { label: "Đã giao hàng", color: "#f59e0b", bg: "#fffbeb", icon: <Truck size={14} /> },
  COMPLETED: { label: "Hoàn thành", color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  CANCELLED: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2", icon: <AlertCircle size={14} /> },
  REFUNDED: { label: "Đã hoàn tiền", color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} /> },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng", color: "#f59e0b", bg: "#fffbeb", icon: <AlertCircle size={14} /> },
  DISPUTED: { label: "Đang tranh chấp", color: "#ef4444", bg: "#fef2f2", icon: <AlertCircle size={14} /> },
};

type TabKey = "escrowed" | "accepted" | "delivered" | "returnRequested";

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
          allOrders = data.map((item: any) => item.order);
        } else {
          allOrders = data;
        }
      } else if (data?.data) {
        if (Array.isArray(data.data)) {
          // Check if items have 'order' field
          if (data.data.length > 0 && data.data[0]?.order) {
            allOrders = data.data.map((item: any) => item.order);
          } else {
            allOrders = data.data;
          }
        } else if (data.data?.content && Array.isArray(data.data.content)) {
          if (data.data.content.length > 0 && data.data.content[0]?.order) {
            allOrders = data.data.content.map((item: any) => item.order);
          } else {
            allOrders = data.data.content;
          }
        } else if (data.data?.orders && Array.isArray(data.data.orders)) {
          allOrders = data.data.orders;
        }
      } else if (data?.content && Array.isArray(data.content)) {
        if (data.content.length > 0 && data.content[0]?.order) {
          allOrders = data.content.map((item: any) => item.order);
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
    { key: "delivered" as TabKey, label: "Đã giao", count: orders.filter(o => o.status === "DELIVERED").length },
    { key: "returnRequested" as TabKey, label: "Hoàn hàng", count: orders.filter(o => o.status === "RETURN_REQUESTED").length },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .ot-wrap { animation: fadeUp .3s ease; }
        .order-card:hover { background: #f8faff !important; }
      `}</style>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e8ecf4", paddingBottom: 12 }}>
        {tabConfig.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: tab === t.key ? "#2563eb" : "transparent",
              color: tab === t.key ? "white" : "#64748b",
              fontWeight: tab === t.key ? 700 : 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all .2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: tab === t.key ? "rgba(255,255,255,.3)" : "#f1f5f9",
              fontSize: 11,
              fontWeight: 700,
            }}>
              {t.count}
            </span>
          </button>
        ))}
        <button
          onClick={() => void fetchOrders()}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "1.5px solid #e8ecf4",
            borderRadius: 8,
            padding: "6px 12px",
            color: "#64748b",
            fontSize: 12,
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          <RefreshCw size={12} /> Làm mới
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e8ecf4", borderTopColor: "#2563eb", animation: "spin .8s linear infinite", margin: "0 auto" }} />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <p style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>Lỗi: {error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: 40, textAlign: "center" }}>
          <Package size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Không có đơn hàng</p>
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
            {tab === "escrowed" && "Chưa có đơn hàng nào chờ xác nhận"}
            {tab === "accepted" && "Chưa có đơn hàng nào chuẩn bị giao"}
            {tab === "delivered" && "Chưa có đơn hàng nào đã giao"}
            {tab === "returnRequested" && "Chưa có đơn hoàn hàng nào chờ xác nhận"}
          </p>
        </div>
      )}

      {/* Orders list */}
      {!loading && filtered.length > 0 && (
        <div className="ot-wrap" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                    )}

                    {order.status === "ACCEPTED" && (
                      <button
                        onClick={() => setDeliveryModal({ open: true, order })}
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
    </div>
  );
}
