/**
 * OrderDetailPage.tsx  —  /orders/:id
 *
 * API calls:
 *   GET  /orders/{id}/history          → OrderHistoryDetailResponse (timeline)
 *   POST /orders/{id}/cancel           → BUYER hủy đơn (ESCROWED)
 *   POST /orders/{id}/confirm-receipt  → BUYER xác nhận nhận hàng (DELIVERED)
 *   POST /orders/{id}/request-return   → BUYER yêu cầu hoàn hàng (DELIVERED, trong 14 ngày)
 *   POST /orders/{orderId}/return-dispute → BUYER mở tranh chấp (RETURN_REQUESTED)
 */
import React, { useState, useEffect, useCallback } from "react";
import {
    ChevronLeft, Package, CheckCircle, XCircle, Truck,
    RotateCcw, AlertTriangle, Clock, RefreshCw, MessageSquare,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import RequestReturnModal from "./RequestReturnModal";
import {
    getOrderHistoryAPI,
    cancelOrderAPI,
    confirmReceiptAPI,
    requestReturnAPI,
    openReturnDisputeAPI,
} from "../../services/Buyer/orderActionService";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type OrderStatus =
    | "PENDING_PAYMENT" | "ESCROWED" | "ACCEPTED" | "DELIVERED"
    | "COMPLETED" | "CANCELLED" | "REFUNDED"
    | "RETURN_REQUESTED" | "DISPUTED";

interface OrderDetail {
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
    acceptedAt?: string;
    deliveredAt?: string;
    shippingCarrier?: string;
    trackingCode?: string;
    shippingNote?: string;
    returnReason?: string;
    daysUntilAutoRelease?: number;
}

interface HistoryEvent {
    status: OrderStatus;
    timestamp: string;
    actor?: string;
    note?: string;
}

interface OrderHistoryDetail {
    order: OrderDetail;
    timeline?: HistoryEvent[];
    canReview?: boolean;
    isReviewed?: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
    PENDING_PAYMENT:  { label: "Chờ thanh toán",      color: "#f59e0b", bg: "#fffbeb", icon: <Clock size={14} />,          desc: "Đang chờ xử lý thanh toán" },
    ESCROWED:         { label: "Đơn hàng đã được tạo", color: "#3b82f6", bg: "#eff6ff", icon: <Clock size={14} />,          desc: "Đơn hàng của bạn đã được tạo, đang chờ seller xác nhận" },
    ACCEPTED:         { label: "Seller đã xác nhận",   color: "#8b5cf6", bg: "#f5f3ff", icon: <CheckCircle size={14} />,    desc: "Seller đã nhận đơn, đang chuẩn bị giao hàng" },
    DELIVERED:        { label: "Đang giao hàng",       color: "#f59e0b", bg: "#fffbeb", icon: <Truck size={14} />,          desc: "Hàng đã được giao, vui lòng xác nhận khi nhận được" },
    COMPLETED:        { label: "Hoàn thành",           color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} />,    desc: "Giao dịch hoàn tất, tiền đã về tay seller" },
    CANCELLED:        { label: "Đã hủy",               color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={14} />,        desc: "Đơn hàng đã bị hủy, tiền đã hoàn về ví bạn" },
    REFUNDED:         { label: "Đã hoàn tiền",         color: "#10b981", bg: "#f0fdf4", icon: <RotateCcw size={14} />,      desc: "Tiền đã được hoàn về ví của bạn" },
    RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng",   color: "#f59e0b", bg: "#fffbeb", icon: <RotateCcw size={14} />,      desc: "Đang chờ seller xác nhận nhận lại hàng" },
    DISPUTED:         { label: "Đang tranh chấp",      color: "#ef4444", bg: "#fef2f2", icon: <AlertTriangle size={14} />,  desc: "Admin đang xử lý tranh chấp giữa hai bên" },
};

// Thứ tự timeline chuẩn theo flow
const TIMELINE_ORDER: OrderStatus[] = [
    "ESCROWED", "ACCEPTED", "DELIVERED", "COMPLETED",
];

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: "ESCROWED",  label: "Đơn đã tạo",         icon: <Package size={16} /> },
    { status: "ACCEPTED",  label: "Seller xác nhận",     icon: <CheckCircle size={16} /> },
    { status: "DELIVERED", label: "Đã giao hàng",        icon: <Truck size={16} /> },
    { status: "COMPLETED", label: "Hoàn thành",          icon: <CheckCircle size={16} /> },
];

function getStepIndex(status: OrderStatus): number {
    const idx = TIMELINE_ORDER.indexOf(status);
    if (status === "CANCELLED" || status === "REFUNDED") return -1; // special
    if (status === "RETURN_REQUESTED" || status === "DISPUTED") return 2; // stays at DELIVERED step
    return idx;
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function OrderDetailPage() {
    const { id }  = useParams<{ id: string }>();
    const navigate = useNavigate();
    const orderId = Number(id);

    const [detail, setDetail]       = useState<OrderHistoryDetail | null>(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [actionBusy, setAction]   = useState<string | null>(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const data = await getOrderHistoryAPI(orderId);
            setDetail(data);
        } catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => { void fetchDetail(); }, [fetchDetail]);

    /* ── Actions ── */
    const doAction = async (actionKey: string, fn: () => Promise<unknown>, confirmMsg?: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        setAction(actionKey);
        try {
            await fn();
            await fetchDetail();
        } catch (e) {
            alert(String(e instanceof Error ? e.message : e));
        } finally {
            setAction(null);
        }
    };

    const handleCancel = () => {
        if (!orderId) return;
        setShowCancelConfirm(true);
    };

    const confirmCancel = () => {
        if (!orderId) return;
        setShowCancelConfirm(false);
        void doAction("cancel", () => cancelOrderAPI(orderId));
    };

    const handleConfirmReceipt = () => {
        if (!orderId) return;
        void doAction(
            "confirm-receipt",
            () => confirmReceiptAPI(orderId),
            "Xác nhận đã nhận hàng? Tiền sẽ được giải ngân ngay cho người bán.",
        );
    };

    const handleRequestReturn = () => {
        setShowReturnModal(true);
    };

    const submitRequestReturn = async (reason: string) => {
        if (!orderId) return;
        await doAction("request-return", () => requestReturnAPI(orderId, reason));
        setShowReturnModal(false);
    };

    const handleDispute = () => {
        if (!orderId) return;
        void doAction(
            "return-dispute",
            () => openReturnDisputeAPI(orderId),
            "Mở tranh chấp với Admin? Hành động này sẽ đưa đơn hàng vào trạng thái xem xét.",
        );
    };

    /* ── Loading / Error ── */
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e8ecf4", borderTopColor: "#2563eb", animation: "spin .8s linear infinite" }} />
        </div>
    );

    if (error || !detail?.order) return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 360 }}>
                <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 8 }}>Không tìm thấy đơn hàng</p>
                <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>{error}</p>
                <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Quay lại</button>
            </div>
        </div>
    );

    const order    = detail.order;
    const meta     = STATUS_META[order.status] ?? STATUS_META.ESCROWED;
    const stepIdx  = getStepIndex(order.status);
    const isCancelledOrRefunded = order.status === "CANCELLED" || order.status === "REFUNDED";

    const btnBase: React.CSSProperties = {
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
        cursor: "pointer", transition: "opacity .15s",
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                .od-wrap { animation: fadeUp .3s ease; }
                .info-row:hover { background: #f8faff !important; }
                .action-btn:hover:not(:disabled) { opacity: .85 !important; }
            `}</style>

            {/* ── Top bar ── */}
            <div style={{ background: "white", borderBottom: "1px solid #e8ecf4", height: 54, display: "flex", alignItems: "center", padding: "0 24px", gap: 12, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,.04)" }}>
                <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}>
                    <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại
                </button>
                <span style={{ color: "#e2e8f0" }}>|</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Chi tiết đơn hàng #{order.id}</span>
                <button onClick={() => fetchDetail()} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: "none", border: "1.5px solid #e8ecf4", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                    <RefreshCw size={12} /> Làm mới
                </button>
            </div>

            <div className="od-wrap" style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 64px" }}>

                {/* ── Status hero ── */}
                <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", padding: "24px 24px 20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0 }}>
                            {meta.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>Trạng thái đơn hàng</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>{meta.label}</p>
                            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{meta.desc}</p>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>#{order.id}</span>
                    </div>

                    {/* ── Progress timeline ── */}
                    {!isCancelledOrRefunded && (
                        <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                            {TIMELINE_STEPS.map((step, i) => {
                                const done    = i <= stepIdx;
                                const current = i === stepIdx;
                                return (
                                    <div key={step.status} style={{ display: "flex", alignItems: "center", flex: i < TIMELINE_STEPS.length - 1 ? 1 : "none" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: "50%",
                                                background: done ? (current ? "#2563eb" : "#10b981") : "#f1f5f9",
                                                color: done ? "white" : "#cbd5e1",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                border: current ? "2.5px solid #93c5fd" : "none",
                                                boxShadow: current ? "0 0 0 4px #dbeafe" : "none",
                                                transition: "all .3s",
                                            }}>
                                                {step.icon}
                                            </div>
                                            <span style={{ fontSize: 10, color: done ? "#0f172a" : "#94a3b8", fontWeight: done ? 600 : 400, whiteSpace: "nowrap" }}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {i < TIMELINE_STEPS.length - 1 && (
                                            <div style={{ flex: 1, height: 2, background: i < stepIdx ? "#10b981" : "#e8ecf4", margin: "0 4px 16px", transition: "background .3s" }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Cancelled / Refunded */}
                    {isCancelledOrRefunded && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: meta.bg, borderRadius: 10, padding: "10px 14px" }}>
                            {meta.icon}
                            <span style={{ fontSize: 13, color: meta.color, fontWeight: 600 }}>{meta.desc}</span>
                        </div>
                    )}
                </div>

                {/* ── Order info ── */}
                <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Thông tin đơn hàng</p>
                    </div>
                    {[
                        { label: "Xe đạp",       value: order.bikeTitle,                    link: `/bikes/${order.bikeId}` },
                        { label: "Người bán",    value: order.sellerName,                  link: `/sellers/${order.sellerId}` },
                        { label: "Số tiền",      value: fmtMoney(order.amountPoints),       highlight: true },
                        { label: "Ngày tạo",     value: fmtDateTime(order.createdAt) },
                        { label: "Cập nhật",     value: fmtDateTime(order.updatedAt) },
                        order.acceptedAt ? { label: "Seller xác nhận", value: fmtDateTime(order.acceptedAt) } : null,
                        order.deliveredAt ? { label: "Đã giao hàng",   value: fmtDateTime(order.deliveredAt) } : null,
                        order.shippingCarrier ? { label: "Đơn vị vận chuyển", value: order.shippingCarrier } : null,
                        order.trackingCode ? { label: "Mã vận đơn",    value: order.trackingCode } : null,
                        order.shippingNote ? { label: "Ghi chú giao",  value: order.shippingNote } : null,
                        order.returnReason ? { label: "Lý do hoàn",    value: order.returnReason, warn: true } : null,
                        order.daysUntilAutoRelease !== undefined && order.status === "DELIVERED"
                            ? { label: "Tự động xác nhận sau", value: `${order.daysUntilAutoRelease} ngày`, warn: order.daysUntilAutoRelease <= 2 }
                            : null,
                    ].filter(Boolean).map((row, i) => row && (
                        <div key={i} className="info-row" style={{ display: "grid", gridTemplateColumns: "140px 1fr", padding: "11px 20px", borderBottom: "1px solid #f8fafc", transition: "background .15s", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{row.label}</span>
                            {row.link ? (
                                <button onClick={() => navigate(row.link!)} style={{ background: "none", border: "none", padding: 0, color: "#2563eb", fontWeight: 600, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                                    {row.value}
                                </button>
                            ) : (
                                <span style={{ fontSize: 13, fontWeight: 600, color: (row as {highlight?:boolean;warn?:boolean}).highlight ? "#2563eb" : (row as {warn?:boolean}).warn ? "#ef4444" : "#0f172a" }}>
                                    {row.value}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Timeline events (from /history) ── */}
                {detail.timeline && detail.timeline.length > 0 && (
                    <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 20 }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                            <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Lịch sử hoạt động</p>
                        </div>
                        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {detail.timeline.map((evt, i) => {
                                const evtMeta = STATUS_META[evt.status] ?? STATUS_META.ESCROWED;
                                const isLast  = i === detail.timeline!.length - 1;
                                return (
                                    <div key={i} style={{ display: "flex", gap: 12 }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: evtMeta.bg, color: evtMeta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {evtMeta.icon}
                                            </div>
                                            {!isLast && <div style={{ width: 2, flex: 1, background: "#f1f5f9", marginTop: 4 }} />}
                                        </div>
                                        <div style={{ paddingBottom: isLast ? 0 : 4 }}>
                                            <p style={{ fontWeight: 700, color: evtMeta.color, fontSize: 13, marginBottom: 2 }}>{evtMeta.label}</p>
                                            {evt.note   && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{evt.note}</p>}
                                            {evt.actor  && <p style={{ fontSize: 11, color: "#94a3b8" }}>bởi {evt.actor}</p>}
                                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{fmtDateTime(evt.timestamp)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Action buttons ── */}
                {(() => {
                    const busy = actionBusy !== null;

                    if (order.status === "ESCROWED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                                Đơn hàng đang chờ seller xác nhận. Bạn có thể hủy đơn để lấy lại tiền.
                            </p>
                            <button className="action-btn" onClick={handleCancel} disabled={busy}
                                    style={{ ...btnBase, background: busy ? "#f1f5f9" : "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca", opacity: busy ? .6 : 1 }}>
                                <XCircle size={16} /> {busy ? "Đang hủy..." : "Hủy đơn hàng"}
                            </button>
                        </div>
                    );

                    if (order.status === "DELIVERED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#64748b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px" }}>
                                ⏱ Hàng đã được giao. Xác nhận nhận hàng để giải ngân tiền cho seller, hoặc yêu cầu hoàn hàng nếu có vấn đề.
                                {order.daysUntilAutoRelease !== undefined && ` Hệ thống tự động xác nhận sau ${order.daysUntilAutoRelease} ngày.`}
                            </p>
                            <button className="action-btn" onClick={handleConfirmReceipt} disabled={busy}
                                    style={{ ...btnBase, background: busy ? "#f1f5f9" : "#2563eb", color: "white", border: "none", boxShadow: "0 2px 12px rgba(37,99,235,.25)", opacity: busy ? .6 : 1 }}>
                                <CheckCircle size={16} /> {busy ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
                            </button>
                            <button className="action-btn" onClick={handleRequestReturn} disabled={busy}
                                    style={{ ...btnBase, background: "white", color: "#f59e0b", border: "1.5px solid #fde68a", opacity: busy ? .6 : 1 }}>
                                <RotateCcw size={16} /> Yêu cầu hoàn hàng
                            </button>
                        </div>
                    );

                    if (order.status === "RETURN_REQUESTED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#64748b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px" }}>
                                Đang chờ seller xác nhận nhận lại hàng. Nếu seller không phản hồi, bạn có thể mở tranh chấp.
                            </p>
                            <button className="action-btn" onClick={handleDispute} disabled={busy}
                                    style={{ ...btnBase, background: "white", color: "#ef4444", border: "1.5px solid #fecaca", opacity: busy ? .6 : 1 }}>
                                <AlertTriangle size={16} /> Mở tranh chấp với Admin
                            </button>
                        </div>
                    );

                    if (order.status === "COMPLETED" && !detail.isReviewed && detail.canReview) return (
                        <button className="action-btn"
                                onClick={() => navigate(`/orders/${order.id}/review`)}
                                style={{ ...btnBase, background: "#eff6ff", color: "#2563eb", border: "1.5px solid #bfdbfe" }}>
                            <MessageSquare size={16} /> Đánh giá giao dịch
                        </button>
                    );

                    return null;
                })()}
            </div>

            <RequestReturnModal
                open={showReturnModal}
                loading={actionBusy === "request-return"}
                onClose={() => setShowReturnModal(false)}
                onConfirm={submitRequestReturn}
            />

            {showCancelConfirm && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.28)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            background: "white",
                            borderRadius: 18,
                            padding: "28px 24px",
                            boxShadow: "0 20px 60px rgba(15,23,42,.2)",
                            textAlign: "center",
                        }}
                    >
                        <h3 style={{ fontSize: 36 - 12, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                            Xác nhận hủy đơn hàng
                        </h3>
                        <p style={{ fontSize: 15, color: "#475569", marginBottom: 24 }}>
                            Bạn có chắc chắn muốn hủy đơn hàng này?
                        </p>

                        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                            <button
                                onClick={confirmCancel}
                                style={{
                                    minWidth: 130,
                                    padding: "10px 20px",
                                    borderRadius: 10,
                                    border: "none",
                                    background: "#2563eb",
                                    color: "white",
                                    fontSize: 20 - 4,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Xác nhận
                            </button>
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                style={{
                                    minWidth: 130,
                                    padding: "10px 20px",
                                    borderRadius: 10,
                                    border: "none",
                                    background: "#e2e8f0",
                                    color: "#2563eb",
                                    fontSize: 20 - 4,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}