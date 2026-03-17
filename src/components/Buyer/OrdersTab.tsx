/**
 * ====================================================================================
 * OrdersTab.tsx — Tab "Đơn hàng" bên trong BuyerPage
 * ====================================================================================
 * Mục đích:
 *   - Hiển thị danh sách đơn hàng được mua (purchased orders)
 *   - Filter theo trạng thái (ESCROWED, ACCEPTED, DELIVERED, COMPLETED, CANCELLED, RETURN_REQUESTED)
 *   - Action buttons: Hủy đơn, Xác nhận nhận hàng, Yêu cầu hoàn hàng, Mở tranh chấp
 *   - Pagination & sorting theo ngày tạo (mới nhất trước)
 *
 * API Calls:
 *   GET /orders/my-purchases?status=ESCROWED → lấy đơn hàng có status cụ thể
 *   GET /orders/my-purchases → lấy tất cả đơn hàng
 *   POST /orders/{id}/cancel → hủy đơn (trạng thái ESCROWED)
 *   POST /orders/{id}/confirm-receipt → xác nhận nhận hàng (trạng thái DELIVERED)
 *   POST /orders/{id}/request-return → yêu cầu hoàn hàng (trạng thái DELIVERED)
 *   POST /orders/{id}/return-dispute → mở tranh chấp (trạng thái RETURN_REQUESTED)
 *
 * Props:
 *   token: string — JWT token từ localStorage
 *   navigate: func — React Router useNavigate()
 * ====================================================================================
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
    AlertTriangle
} from "lucide-react";
import { getMyPurchasesAPI } from "../../services/Buyer/Orderservice";
import {
    cancelOrderAPI,
    confirmReceiptAPI,
    requestReturnAPI,
    openReturnDisputeAPI,
} from "../../services/Buyer/orderActionService";
import RequestReturnModal from "./RequestReturnModal";


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* TYPE DEFINITIONS */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Các trạng thái đơn hàng theo flow:
 * PENDING_PAYMENT → ESCROWED → ACCEPTED → DELIVERED → COMPLETED
 * 
 * Hoặc:
 * ESCROWED → CANCELLED (buyer hủy)
 * DELIVERED → RETURN_REQUESTED → DISPUTED (nếu mở tranh chấp)
 * RETURN_REQUESTED / DISPUTED → REFUNDED (hoàn tiền)
 */
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

/**
 * Cấu trúc object Order từ API GET /orders/my-purchases
 */
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

/**
 * Wrapper response từ API (đôi khi response.data là OrderItem, đôi khi là { order: OrderItem, canReview, isReviewed })
 */
interface ApiPurchase {
    order: OrderItem;
    canReview: boolean;
    isReviewed: boolean;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* FORMAT & HELPER FUNCTIONS */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * ━ Format số tiền sang VND
 * ━ Input: 1000000 → Output: "1.000.000 đ"
 */
const fmtMoney = (p: number) =>
    `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

/**
 * ━ Format date ISO → "dd/mm/yyyy"
 * ━ Input: "2024-03-17T10:30:00Z" → Output: "17/03/2024"
 */
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

/**
 * ━ Metadata cho mỗi trạng thái đơn hàng
 * ━ Dùng để render badge color + icon + label mô tả
 */
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

/**
 * ━ Filter tabs: để user chọn lọc đơn theo trạng thái
 */
const STATUS_FILTERS = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xác nhận", value: "ESCROWED" },
    { label: "Đã xác nhận", value: "ACCEPTED" },
    { label: "Đã giao", value: "DELIVERED" },
    { label: "Hoàn thành", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
    { label: "Hoàn hàng", value: "RETURN_REQUESTED" }
];


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/* MAIN COMPONENT */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Props (interface Props):
 *   token: string — JWT token (hiện tại không dùng vì service tự lấy từ localStorage)
 *   navigate: func(path: string) — để navigate sang OrderDetailPage hoặc trang khác
 */
interface Props {
    token: string;
    navigate: (path: string) => void;
}

export default function OrdersTab({ token, navigate }: Props) {

    // ━ State quản lý orders
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");  // status filter: "", "ESCROWED", "ACCEPTED", etc.
    const [actionLoading, setAction] = useState<number | null>(null);  // orderId đang trong quá trình action
    
    // ━ State cho modal confirm
    const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);  // orderId cần confirm hủy
    const [showReturnModalForOrder, setShowReturnModalForOrder] = useState<number | null>(null);  // orderId cần return

    void token;  // ESLint: token được pass nhưng không dùng

    /**
     * ━ fetchOrders: Fetch đơn hàng từ API
     * ━ - Gọi GET /orders/my-purchases?status={filter} để lấy đơn theo filter
     * ━ - Gọi GET /orders/my-purchases để lấy tất cả (để hiển thị totalOrders)
     * ━ - Parse wrapper response (some return .order, some return object directly)
     * ━ - Sort by createdAt descending (mới nhất trước)
     */
    const fetchOrders = useCallback(async () => {

        setLoading(true);

        try {
            const [filteredRes, allRes] = await Promise.allSettled([
                getMyPurchasesAPI({ status: filter || undefined }),
                getMyPurchasesAPI(),
            ]);

            const filteredPurchases = filteredRes.status === "fulfilled" ? filteredRes.value : [];
            const allPurchases = allRes.status === "fulfilled" ? allRes.value : [];

            const list: OrderItem[] = Array.isArray(filteredPurchases)
                ? (filteredPurchases as Array<ApiPurchase | OrderItem>)
                    .map((p) => ((p as ApiPurchase)?.order ?? (p as OrderItem)))
                    .filter((o): o is OrderItem => Boolean(o?.id))
                : [];

            setOrders(
                list.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
            );

            setTotalOrders(Array.isArray(allPurchases) ? allPurchases.length : 0);

        } catch (e) {
            console.error("fetchOrders:", e);
        } finally {
            setLoading(false);
        }

    }, [filter]);

    // ━ Re-fetch khi filter thay đổi
    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    /**
     * ━ doAction: Wrapper function để thực hiện các action (cancel, confirm-receipt, request-return, dispute)
     * ━ - Gọi API function tương ứng
     * ━ - Sau thành công, re-fetch orders  để cập nhật UI
     * ━ - Bắt error và show alert
     */
    const doAction = async (orderId: number, actionKey: "cancel" | "confirm-receipt" | "request-return" | "return-dispute", reason?: string) => {

        setAction(orderId);

        try {
            if (actionKey === "cancel") {
                await cancelOrderAPI(orderId);
            } else if (actionKey === "confirm-receipt") {
                await confirmReceiptAPI(orderId);
            } else if (actionKey === "request-return") {
                await requestReturnAPI(orderId, reason ?? "");
            } else {
                await openReturnDisputeAPI(orderId);
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
        void doAction(id, "confirm-receipt");
    };

    const handleRequestReturn = (id: number) => {
        setShowReturnModalForOrder(id);
    };

    const submitRequestReturn = async (reason: string) => {
        if (!showReturnModalForOrder) return;
        await doAction(showReturnModalForOrder, "request-return", reason);
        setShowReturnModalForOrder(null);
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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                        <button
                            style={btnStyle("#10b981", "#f0fdf4", "#6ee7b7")}
                            onClick={() => handleConfirmReceipt(order.id)}
                            disabled={busy}
                        >
                            <CheckCircle size={13} /> Xác nhận nhận hàng
                        </button>

                        <button
                            style={btnStyle("#f59e0b", "#fffbeb", "#fde68a")}
                            onClick={() => handleRequestReturn(order.id)}
                            disabled={busy}
                        >
                            <RotateCcw size={13} /> Yêu cầu hoàn hàng
                        </button>

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
                        onClick={() => void doAction(order.id, "return-dispute")}
                        disabled={busy}
                    >
                        <AlertTriangle size={13} /> Mở tranh chấp
                    </button>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Đơn hàng của tôi</h2>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{totalOrders} đơn hàng</p>
                </div>
                <button onClick={() => fetchOrders()}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "white", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
                    <RefreshCw size={13} /> Làm mới
                </button>
            </div>

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

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {!loading && orders.length === 0 ? (
                    <div style={{ background: "white", borderRadius: 20, border: "1px solid #e8ecf5", padding: "60px 24px", textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <Package size={28} color="#cbd5e1" />
                        </div>
                        <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Chưa có đơn hàng</h3>
                        <p style={{ color: "#94a3b8", fontSize: 13 }}>
                            {filter ? "Không có đơn nào ở trạng thái này." : "Bạn chưa có đơn hàng nào."}
                        </p>
                    </div>
                ) : (
                    orders.map(order => {
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
                    })
                )}
            </div>

            <RequestReturnModal
                open={showReturnModalForOrder !== null}
                loading={actionLoading !== null}
                onClose={() => setShowReturnModalForOrder(null)}
                onConfirm={submitRequestReturn}
            />
        </div>
    );
}