import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, Truck, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { BASE_URL } from "../../config/apiConfig";
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

type TabKey = "escrowed" | "accepted" | "delivered";

interface SellerOrdersTabProps {
  token: string;
}

export default function SellerOrdersTab({ token }: SellerOrdersTabProps) {
  const [tab, setTab] = useState<TabKey>("escrowed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/orders/my-sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as unknown;
      if (!res.ok) throw new Error((data as Record<string, unknown>).message as string || "Failed to fetch orders");
      
      interface OrderWrapper {
        order: SellerOrder;
      }
      
      let allOrders: SellerOrder[] = [];
      if (Array.isArray(data)) {
        if (data.length > 0 && (data[0] as Record<string, unknown>)?.order) {
          allOrders = (data as OrderWrapper[]).map((item) => item.order);
        } else {
          allOrders = data as SellerOrder[];
        }
      } else if ((data as Record<string, unknown>)?.data) {
        const dataArray = ((data as Record<string, unknown>).data) as unknown[];
        if (Array.isArray(dataArray)) {
          if (dataArray.length > 0 && (dataArray[0] as Record<string, unknown>)?.order) {
            allOrders = (dataArray as OrderWrapper[]).map((item) => item.order);
          } else {
            allOrders = dataArray as SellerOrder[];
          }
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
    if (token) void fetchOrders();
  }, [fetchOrders, token]);

  const getFilteredOrders = () => {
    const statusMap: Record<TabKey, OrderStatus[]> = {
      escrowed: ["ESCROWED"],
      accepted: ["ACCEPTED"],
      delivered: ["DELIVERED"],
    };
    return orders.filter(o => statusMap[tab].includes(o.status));
  };

  const filtered = getFilteredOrders();
  const tabConfig = [
    { key: "escrowed" as TabKey, label: "Chờ xác nhận", count: orders.filter(o => o.status === "ESCROWED").length },
    { key: "accepted" as TabKey, label: "Chuẩn bị giao", count: orders.filter(o => o.status === "ACCEPTED").length },
    { key: "delivered" as TabKey, label: "Đã giao", count: orders.filter(o => o.status === "DELIVERED").length },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #e8ecf4", paddingBottom: 12 }}>
        {tabConfig.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: tab === t.key ? "#2563eb" : "transparent", color: tab === t.key ? "white" : "#64748b", fontWeight: tab === t.key ? 700 : 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {t.label}
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: tab === t.key ? "rgba(255,255,255,.3)" : "#f1f5f9", fontSize: 11, fontWeight: 700 }}>{t.count}</span>
          </button>
        ))}
        <button onClick={() => void fetchOrders()} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: "none", border: "1.5px solid #e8ecf4", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
          <RefreshCw size={12} /> Làm mới
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e8ecf4", borderTopColor: "#2563eb", animation: "spin .8s linear infinite", margin: "0 auto" }} /></div>}

      {error && !loading && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 20 }}><p style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>Lỗi: {error}</p></div>}

      {!loading && filtered.length === 0 && <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: 40, textAlign: "center" }}><Package size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} /><p style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Không có đơn hàng</p></div>}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(order => {
            const config = STATUS_CONFIG[order.status];
            return (
              <div key={order.id} style={{ background: "white", borderRadius: 14, border: "1.5px solid #e8ecf4", padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: config.bg, display: "flex", alignItems: "center", justifyContent: "center", color: config.color, flexShrink: 0 }}>{config.icon}</div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{order.bikeTitle}</p>
                        <p style={{ fontSize: 12, color: "#64748b" }}>Người mua: <span style={{ fontWeight: 600, color: "#0f172a" }}>{order.buyerName}</span></p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                      <div><p style={{ color: "#94a3b8", marginBottom: 2 }}>Số tiền</p><p style={{ fontWeight: 700, color: "#2563eb" }}>{fmtMoney(order.amountPoints)}</p></div>
                      <div><p style={{ color: "#94a3b8", marginBottom: 2 }}>Ngày tạo</p><p style={{ fontWeight: 600, color: "#0f172a" }}>{fmtDateTime(order.createdAt)}</p></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                    {order.status === "ESCROWED" && <button onClick={() => setApprovalModal({ open: true, order })} style={{ padding: "10px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Xác nhận</button>}
                    {order.status === "ACCEPTED" && <button onClick={() => setDeliveryModal({ open: true, order })} style={{ padding: "10px 14px", background: "#10b981", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚚 Giao hàng</button>}
                    {order.status === "DELIVERED" && <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, textAlign: "center" }}><p style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Chờ buyer confirm</p></div>}
                    <button onClick={() => window.location.href = `/seller/orders/${order.id}`} style={{ padding: "8px 14px", background: "transparent", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Chi tiết</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderApprovalModal isOpen={approvalModal.open} order={approvalModal.order} token={token} onClose={() => setApprovalModal({ open: false, order: null })} onSuccess={() => { setApprovalModal({ open: false, order: null }); void fetchOrders(); }} />
      <OrderDeliveryForm isOpen={deliveryModal.open} order={deliveryModal.order} token={token} onClose={() => setDeliveryModal({ open: false, order: null })} onSuccess={() => { setDeliveryModal({ open: false, order: null }); void fetchOrders(); }} />
    </div>
  );
}
