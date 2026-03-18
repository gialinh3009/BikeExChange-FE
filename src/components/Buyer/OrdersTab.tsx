/**
 * OrdersTab.tsx
 * Tab "Đơn hàng" bên trong BuyerPage.
 * Gọi GET /orders/my-purchases → hiển thị danh sách + badge trạng thái + action buttons.
 */

import { useState, useEffect, useCallback } from "react";
import {
    Package,
    ChevronRight,
    RefreshCw,
    XCircle,
    CheckCircle,
    RotateCcw,
    Clock,
    Truck,
    AlertTriangle,
    MessageSquare,
} from "lucide-react";
import { getMyPurchasesAPI } from "../../services/Buyer/Orderservice";
import {
    cancelOrderAPI,
    confirmReceiptAPI,
    requestReturnAPI,
    openReturnDisputeAPI,
} from "../../services/Buyer/orderActionService";
import RequestReturnModal from "./RequestReturnModal";
import OrderConfirmationModal from "./OrderConfirmationModal";
import OpenDisputeModal from "./OpenDisputeModal";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type OrderStatus =
    | "ESCROWED"
    | "ACCEPTED"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED"
    | "REFUNDED"
    | "RETURN_REQUESTED"
    | "DISPUTED"
    | "PENDING_PAYMENT";

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
    shippingCarrier?: string;
    trackingCode?: string;
    canReview?: boolean;
    isReviewed?: boolean;
}

interface ApiPurchase {
    order: OrderItem;
    canReview: boolean;
    isReviewed: boolean;
}

interface OpenDisputePayload {
    reason: string;
    buyerAddress: string;
    buyerPhone: string;
    buyerEmail: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const fmtMoney = (p: number) =>
    `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

const STATUS_META: Record<
    OrderStatus,
    { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
    PENDING_PAYMENT: {
        label: "Chờ thanh toán",
        color: "#f59e0b",
        bg: "#fffbeb",
        icon: <Clock size={13} />
    },
    ESCROWED: {
        label: "Chờ seller xác nhận",
        color: "#3b82f6",
        bg: "#eff6ff",
        icon: <Clock size={13} />
    },
    ACCEPTED: {
        label: "Đã xác nhận",
        color: "#8b5cf6",
        bg: "#f5f3ff",
        icon: <CheckCircle size={13} />
    },
    DELIVERED: {
        label: "Đã giao hàng",
        color: "#f59e0b",
        bg: "#fffbeb",
        icon: <Truck size={13} />
    },
    COMPLETED: {
        label: "Hoàn thành",
        color: "#10b981",
        bg: "#f0fdf4",
        icon: <CheckCircle size={13} />
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "#ef4444",
        bg: "#fef2f2",
        icon: <XCircle size={13} />
    },
    REFUNDED: {
        label: "Đã hoàn tiền",
        color: "#10b981",
        bg: "#f0fdf4",
        icon: <RotateCcw size={13} />
    },
    RETURN_REQUESTED: {
        label: "Yêu cầu hoàn hàng",
        color: "#f59e0b",
        bg: "#fffbeb",
        icon: <RotateCcw size={13} />
    },
    DISPUTED: {
        label: "Đang tranh chấp",
        color: "#ef4444",
        bg: "#fef2f2",
        icon: <AlertTriangle size={13} />
    }
};

const STATUS_FILTERS = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xác nhận", value: "ESCROWED" },
    { label: "Đã xác nhận", value: "ACCEPTED" },
    { label: "Đã giao", value: "DELIVERED" },
    { label: "Hoàn thành", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
    { label: "Hoàn hàng", value: "RETURN_REQUESTED" }
];

/* ─── Props ───────────────────────────────────────────────────────────────── */

interface Props {
    token: string;
    navigate: (path: string) => void;
    mode?: "all" | "review-needed";
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function OrdersTab({ token, navigate, mode = "all" }: Props) {

    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [actionLoading, setAction] = useState<number | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);
    const [showReturnModalForOrder, setShowReturnModalForOrder] = useState<number | null>(null);
    const [showDisputeModalForOrder, setShowDisputeModalForOrder] = useState<number | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{ open: boolean; order: OrderItem | null }>({ open: false, order: null });

    void token;

    const fetchOrders = useCallback(async () => {

        setLoading(true);

        try {

            const purchases = await getMyPurchasesAPI({ status: filter || undefined });

            if (Array.isArray(purchases)) {

                const list: OrderItem[] = (purchases as ApiPurchase[]).map((p) => ({
                    ...p.order,
                    canReview: p.canReview,
                    isReviewed: p.isReviewed,
                }));

                setOrders(
                    list.sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
                );
            }

        } catch (e) {
            console.error("fetchOrders:", e);
        } finally {
            setLoading(false);
        }

    }, [filter]);

    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    /* ── Actions ── */

    const doAction = async (orderId: number, actionKey: "cancel" | "confirm-receipt" | "request-return", reason?: string) => {

        setAction(orderId);

        try {
            if (actionKey === "cancel") {
                await cancelOrderAPI(orderId);
            } else if (actionKey === "confirm-receipt") {
                await confirmReceiptAPI(orderId);
            } else {
                await requestReturnAPI(orderId, reason ?? "");
            }

            await fetchOrders();

        } catch (e) {

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
        const order = orders.find(o => o.id === id);
        if (order) {
            setConfirmationModal({ open: true, order });
        }
    };

    const handleConfirmationSuccess = () => {
        setConfirmationModal({ open: false, order: null });
        void fetchOrders();
    };

    const handleRequestReturn = (id: number) => {
        setShowReturnModalForOrder(id);
    };

    const submitRequestReturn = async (reason: string) => {
        if (!showReturnModalForOrder) return;
        await doAction(showReturnModalForOrder, "request-return", reason);
        setShowReturnModalForOrder(null);
    };

    const handleOpenDispute = (id: number) => {
        setShowDisputeModalForOrder(id);
    };

    const submitOpenDispute = async (payload: OpenDisputePayload) => {
        if (!showDisputeModalForOrder) return;
        setAction(showDisputeModalForOrder);
        try {
            await openReturnDisputeAPI(showDisputeModalForOrder, payload);
            await fetchOrders();
            setShowDisputeModalForOrder(null);
        } catch (e) {
            console.error(e);
            alert(String(e instanceof Error ? e.message : e));
        } finally {
            setAction(null);
        }
    };

    const renderActions = (order: OrderItem) => {

        const busy = actionLoading === order.id;

        const btnStyle = (
            color: string,
            bg: string,
            border: string
        ): React.CSSProperties => ({
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 14px",
            borderRadius: 8,
            border: `1.5px solid ${border}`,
            background: bg,
            color,
            fontSize: 12,
            fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1
        });

        switch (order.status) {

            case "ESCROWED":
                return (
                    <button
                        style={btnStyle("#ef4444", "#fef2f2", "#fecaca")}
                        onClick={() => handleCancel(order.id)}
                        disabled={busy}
                    >
                        <XCircle size={13} /> Hủy đơn
                    </button>
                );

            case "DELIVERED":
                return (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {order.daysUntilAutoRelease !== undefined && (
                            <span style={{ fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>
                                Tự động xác nhận sau {order.daysUntilAutoRelease} ngày
                            </span>
                        )}
                    </div>
                );

            case "RETURN_REQUESTED":
                return (
                    <button
                        style={btnStyle("#ef4444", "#fef2f2", "#fecaca")}
                        onClick={() => handleOpenDispute(order.id)}
                        disabled={busy}
                    >
                        <AlertTriangle size={13} /> Mở tranh chấp
                    </button>
                );

            case "COMPLETED":
                return null;

            default:
                return null;
        }
    };

    const displayedOrders = mode === "review-needed"
        ? orders.filter((order) => order.status === "COMPLETED" && order.canReview && !order.isReviewed)
        : orders;

    if (!loading && displayedOrders.length === 0) return (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #e8ecf5", padding: "60px 24px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Package size={28} color="#cbd5e1" />
            </div>
            <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                {mode === "review-needed" ? "Chưa có đơn cần đánh giá" : "Chưa có đơn hàng"}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>
                {mode === "review-needed"
                    ? "Các đơn chưa đánh giá sẽ xuất hiện tại đây."
                    : (filter ? "Không có đơn nào ở trạng thái này." : "Hãy tìm kiếm và mua xe đạp bạn yêu thích!")}
            </p>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                        {mode === "review-needed" ? "Đánh giá" : "Đơn hàng của tôi"}
                    </h2>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                        {displayedOrders.length} {mode === "review-needed" ? "đơn chưa đánh giá" : "đơn hàng"}
                    </p>
                </div>
                <button onClick={() => fetchOrders()}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "white", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
                    <RefreshCw size={13} /> Làm mới
                </button>
            </div>

            {mode === "all" && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                    {STATUS_FILTERS.map(f => (
                        <button key={f.value} onClick={() => setFilter(f.value)}
                                style={{
                                    flexShrink: 0,
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    border: "1.5px solid",
                                    borderColor: filter === f.value ? "#2563eb" : "#e8ecf4",
                                    background: filter === f.value ? "#eff6ff" : "white",
                                    color: filter === f.value ? "#2563eb" : "#64748b",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}>
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {displayedOrders.map(order => {
                    const meta = STATUS_META[order.status] ?? STATUS_META.ESCROWED;
                    return (
                        <div key={order.id}
                             style={{
                                 background: "white",
                                 borderRadius: 16,
                                 border: "1.5px solid #e8ecf4",
                                 padding: "16px 18px"
                             }}>

                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                    <p style={{ fontWeight: 700, fontSize: 15 }}>{order.bikeTitle}</p>
                                    <p style={{ fontSize: 12, color: "#94a3b8" }}>
                                        Người bán: {order.sellerName} · #{order.id} · {fmtDate(order.createdAt)}
                                    </p>
                                </div>

                                <span style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 10px",
                                    borderRadius: 20,
                                    background: meta.bg,
                                    color: meta.color,
                                    fontSize: 11,
                                    fontWeight: 700
                                }}>
                                    {meta.icon} {meta.label}
                                </span>
                            </div>

                            <p style={{ fontSize: 16, fontWeight: 800, color: "#2563eb", marginBottom: 14 }}>
                                {fmtMoney(order.amountPoints)}
                            </p>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                                    {showCancelConfirm === order.id && (
                                        <div style={{
                                            position: "fixed",
                                            top: 0,
                                            left: 0,
                                            width: "100vw",
                                            height: "100vh",
                                            background: "rgba(0,0,0,0.18)",
                                            zIndex: 9999,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            <div style={{
                                                background: "white",
                                                borderRadius: 16,
                                                padding: 32,
                                                minWidth: 340,
                                                boxShadow: "0 4px 24px rgba(0,0,0,.12)",
                                                textAlign: "center"
                                            }}>
                                                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                                                    Xác nhận hủy đơn hàng
                                                </h3>

                                                <p style={{ color: "#475569", fontSize: 15, marginBottom: 24 }}>
                                                    Bạn có chắc chắn muốn hủy đơn hàng này?
                                                </p>

                                                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>

                                                    <button
                                                        style={{
                                                            padding: "10px 24px",
                                                            background: "#2563eb",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: 8,
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                            fontSize: 15
                                                        }}
                                                        onClick={async () => {
                                                            setShowCancelConfirm(null);
                                                            await doAction(order.id, "cancel");
                                                            navigate("/buyer");
                                                        }}
                                                    >
                                                        Xác nhận
                                                    </button>

                                                    <button
                                                        style={{
                                                            padding: "10px 24px",
                                                            background: "#f1f5f9",
                                                            color: "#2563eb",
                                                            border: "none",
                                                            borderRadius: 8,
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                            fontSize: 15
                                                        }}
                                                        onClick={() => setShowCancelConfirm(null)}
                                                    >
                                                        Quay lại
                                                    </button>

                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {renderActions(order)}

                                </div>

                                <button
                                    onClick={() => navigate(`/order-detail/${order.id}`)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        padding: "7px 14px",
                                        background: "#f8faff",
                                        border: "1.5px solid #e8ecf4",
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#2563eb",
                                        cursor: "pointer"
                                    }}>
                                    Xem chi tiết <ChevronRight size={13} />
                                </button>

                            </div>

                        </div>
                    );
                })}
            </div>

            <RequestReturnModal
                open={showReturnModalForOrder !== null}
                loading={actionLoading !== null}
                onClose={() => setShowReturnModalForOrder(null)}
                onConfirm={submitRequestReturn}
            />

            <OpenDisputeModal
                open={showDisputeModalForOrder !== null}
                loading={actionLoading !== null}
                onClose={() => setShowDisputeModalForOrder(null)}
                onConfirm={submitOpenDispute}
            />

            <OrderConfirmationModal
                isOpen={confirmationModal.open}
                order={confirmationModal.order}
                token={token}
                onClose={() => setConfirmationModal({ open: false, order: null })}
                onSuccess={handleConfirmationSuccess}
            />

        </div>
    );
}