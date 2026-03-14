/**
 * OrdersTab.tsx
 * Tab "Đơn hàng" bên trong BuyerPage.
 * Gọi GET /orders/my-purchases → hiển thị danh sách + badge trạng thái + action buttons.
 */
import { useState, useEffect, useCallback } from "react";
import { Package, ChevronRight, RefreshCw, XCircle, CheckCircle, RotateCcw, Clock, Truck, AlertTriangle } from "lucide-react";

const BASE = import.meta.env.VITE_API_BASE_URL as string;

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus =
    | "ESCROWED" | "ACCEPTED" | "DELIVERED"
    | "COMPLETED" | "CANCELLED" | "REFUNDED"
    | "RETURN_REQUESTED" | "DISPUTED" | "PENDING_PAYMENT";

interface OrderItem {
    id: number;
    bikeId: number;
    bikeTitle: string;
    sellerId: number;
    sellerName: string;
    amountPoints: number;
    status: OrderStatus;
    createdAt: string;
    deliveredAt?: string;
    daysUntilAutoRelease?: number;
}

interface ApiPurchase {
    order: OrderItem;
    canReview: boolean;
    isReviewed: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtPoints = (p: number) => new Intl.NumberFormat("vi-VN").format(p) + " điểm";

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING_PAYMENT:  { label: "Chờ thanh toán",   color: "#f59e0b", bg: "#fffbeb", icon: <Clock size={13} /> },
    ESCROWED:         { label: "Chờ seller xác nhận", color: "#3b82f6", bg: "#eff6ff", icon: <Clock size={13} /> },
    ACCEPTED:         { label: "Đã xác nhận",       color: "#8b5cf6", bg: "#f5f3ff", icon: <CheckCircle size={13} /> },
    DELIVERED:        { label: "Đã giao hàng",      color: "#f59e0b", bg: "#fffbeb", icon: <Truck size={13} /> },
    COMPLETED:        { label: "Hoàn thành",        color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={13} /> },
    CANCELLED:        { label: "Đã hủy",            color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={13} /> },
    REFUNDED:         { label: "Đã hoàn tiền",      color: "#10b981", bg: "#f0fdf4", icon: <RotateCcw size={13} /> },
    RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng", color: "#f59e0b", bg: "#fffbeb", icon: <RotateCcw size={13} /> },
    DISPUTED:         { label: "Đang tranh chấp",   color: "#ef4444", bg: "#fef2f2", icon: <AlertTriangle size={13} /> },
};

const STATUS_FILTERS: { label: string; value: string }[] = [
    { label: "Tất cả",          value: "" },
    { label: "Chờ xác nhận",    value: "ESCROWED" },
    { label: "Đã xác nhận",     value: "ACCEPTED" },
    { label: "Đã giao",         value: "DELIVERED" },
    { label: "Hoàn thành",      value: "COMPLETED" },
    { label: "Đã hủy",          value: "CANCELLED" },
    { label: "Hoàn hàng",       value: "RETURN_REQUESTED" },
];

/* ─── Props ───────────────────────────────────────────────────────────────── */
interface Props {
    token: string;
    navigate: (path: string) => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function OrdersTab({ token, navigate }: Props) {
    const [orders, setOrders]         = useState<OrderItem[]>([]);
    const [loading, setLoading]       = useState(true);
    const [filter, setFilter]         = useState("");
    const [actionLoading, setAction]  = useState<number | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);

    const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const url = filter
                ? `${BASE}/orders/my-purchases?status=${filter}`
                : `${BASE}/orders/my-purchases`;
            const res  = await fetch(url, { headers: authHeaders });
            const data = await res.json();
            if (data.success) {
                // Response là List<BuyerPurchaseHistoryResponse> — mỗi item có .order
                const list: OrderItem[] = (data.data as ApiPurchase[]).map(p => p.order);
                setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("fetchOrders:", e);
        } finally {
            setLoading(false);
        }
    }, [filter, token, authHeaders]);

    useEffect(() => { void fetchOrders(); }, [fetchOrders]);

    /* ── Actions ── */
    const doAction = async (orderId: number, endpoint: string, body?: object) => {
        setAction(orderId);
        const url = `${BASE}/orders/${orderId}/${endpoint}`;
        const options: RequestInit = {
            method: "POST",
            headers: authHeaders,
            ...(body ? { body: JSON.stringify(body) } : {}),
        };
        try {
            const res = await fetch(url, options);
            const data = await res.json();
            if (!res.ok || !data.success) {
                // eslint-disable-next-line no-throw-literal
                throw new Error(data.message || "Lỗi thao tác");
            }
            await fetchOrders();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            alert(String(e instanceof Error ? e.message : e));
        } finally {
            setAction(null);
        }
    };

    const handleCancel = (id: number) => {
        setShowCancelConfirm(id);
    };

    const handleConfirmReceipt = (id: number) => {
        void doAction(id, "confirm-receipt");
    };

    const handleRequestReturn = async (id: number) => {
        const reason = prompt("Nhập lý do yêu cầu hoàn hàng:");
        if (!reason?.trim()) return;
        void doAction(id, "request-return", { reason });
    };

    /* ── Render action buttons per status ── */
    const renderActions = (order: OrderItem) => {
        const busy = actionLoading === order.id;

        const btnStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${border}`,
            background: bg, color, fontSize: 12, fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
            transition: "opacity .15s",
        });

        switch (order.status) {
            case "ESCROWED":
                return (
                    <button style={btnStyle("#ef4444", "#fef2f2", "#fecaca")}
                            onClick={() => handleCancel(order.id)} disabled={busy}>
                        <XCircle size={13} /> {busy ? "Đang hủy..." : "Hủy đơn"}
                    </button>
                );
            case "DELIVERED":
                return (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button style={btnStyle("#10b981", "#f0fdf4", "#6ee7b7")}
                                onClick={() => handleConfirmReceipt(order.id)} disabled={busy}>
                            <CheckCircle size={13} /> {busy ? "Đang xử lý..." : "Xác nhận nhận hàng"}
                        </button>
                        <button style={btnStyle("#f59e0b", "#fffbeb", "#fde68a")}
                                onClick={() => handleRequestReturn(order.id)} disabled={busy}>
                            <RotateCcw size={13} /> Yêu cầu hoàn hàng
                        </button>
                        {order.daysUntilAutoRelease !== undefined && (
                            <span style={{ fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>
                                Tự động xác nhận sau {order.daysUntilAutoRelease} ngày
                            </span>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    /* ── Empty state ── */
    if (!loading && orders.length === 0) return (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #e8ecf5", padding: "60px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Package size={28} color="#cbd5e1" />
            </div>
            <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Chưa có đơn hàng</h3>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>
                {filter ? "Không có đơn nào ở trạng thái này." : "Hãy tìm kiếm và mua xe đạp bạn yêu thích!"}
            </p>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Header + filter tabs ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Đơn hàng của tôi</h2>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{orders.length} đơn hàng</p>
                </div>
                <button onClick={() => fetchOrders()}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "white", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
                    <RefreshCw size={13} /> Làm mới
                </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {STATUS_FILTERS.map(f => (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                            style={{
                                flexShrink: 0, padding: "6px 14px", borderRadius: 20,
                                border: "1.5px solid",
                                borderColor: filter === f.value ? "#2563eb" : "#e8ecf4",
                                background: filter === f.value ? "#eff6ff" : "white",
                                color: filter === f.value ? "#2563eb" : "#64748b",
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                                transition: "all .15s",
                            }}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── List ── */}
            {loading ? (
                <div style={{ background: "white", borderRadius: 16, padding: 40, textAlign: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e8ecf4", borderTopColor: "#2563eb", animation: "spin .8s linear infinite", margin: "0 auto" }} />
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {orders.map(order => {
                        const meta = STATUS_META[order.status] ?? STATUS_META.ESCROWED;
                        return (
                            <div key={order.id} style={{
                                background: "white", borderRadius: 16,
                                border: "1.5px solid #e8ecf4",
                                padding: "16px 18px",
                                boxShadow: "0 1px 6px rgba(0,0,0,.04)",
                            }}>
                                {/* Top row */}
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                        <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {order.bikeTitle}
                                        </p>
                                        <p style={{ fontSize: 12, color: "#94a3b8" }}>
                                            Người bán: <span style={{ color: "#475569", fontWeight: 600 }}>{order.sellerName}</span>
                                            {" · "}#{order.id}
                                            {" · "}{fmtDate(order.createdAt)}
                                        </p>
                                    </div>
                                    {/* Status badge */}
                                    <span style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        flexShrink: 0, padding: "4px 10px", borderRadius: 20,
                                        background: meta.bg, color: meta.color,
                                        fontSize: 11, fontWeight: 700,
                                    }}>
                                        {meta.icon} {meta.label}
                                    </span>
                                </div>

                                {/* Price */}
                                <p style={{ fontSize: 16, fontWeight: 800, color: "#2563eb", marginBottom: 14 }}>
                                    {fmtPoints(order.amountPoints)}
                                </p>

                                {/* Bottom: actions + detail link */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        {showCancelConfirm === order.id && (
                                            <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.18)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <div style={{ background: "white", borderRadius: 16, padding: 32, minWidth: 340, boxShadow: "0 4px 24px rgba(0,0,0,.12)", textAlign: "center" }}>
                                                    <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Xác nhận hủy đơn hàng</h3>
                                                    <p style={{ color: "#475569", fontSize: 15, marginBottom: 24 }}>Bạn có chắc chắn muốn hủy đơn hàng này?</p>
                                                    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                                                        <button style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
                                                            onClick={async () => { setShowCancelConfirm(null); await doAction(order.id, "cancel"); navigate("/buyer"); }}>
                                                            Xác nhận
                                                        </button>
                                                        <button style={{ padding: "10px 24px", background: "#f1f5f9", color: "#2563eb", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
                                                            onClick={() => setShowCancelConfirm(null)}>
                                                            Quay lại
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {renderActions(order)}
                                    </div>
                                    <button
                                        onClick={async () => {
                                            // Always call API to get order detail
                                            try {
                                                const token = localStorage.getItem("token") ?? "";
                                                const res = await fetch(`/api/orders/${order.id}`, {
                                                    method: "GET",
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                if (res.status === 401) {
                                                    navigate("/login");
                                                    return;
                                                }
                                                const orderDetail = await res.json();
                                                localStorage.setItem("orderDetail", JSON.stringify(orderDetail));
                                                navigate(`/order-detail/${order.id}`);
                                            } catch {
                                                navigate(`/order-detail/${order.id}`);
                                            }
                                        }}
                                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 14px", background: "#f8faff", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer" }}>
                                        Xem chi tiết <ChevronRight size={13} />
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