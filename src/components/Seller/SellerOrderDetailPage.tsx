/**
 * SellerOrderDetailPage.tsx  —  /seller/orders/:id
 *
 * API calls:
 *   GET  /orders/{id}/history          → OrderHistoryDetailResponse (timeline)
 *   POST /orders/{id}/accept           → SELLER xác nhận nhận đơn (ESCROWED)
 *   POST /orders/{id}/deliver          → SELLER đánh dấu đã giao (ACCEPTED)
 *   POST /orders/{id}/confirm-return   → SELLER xác nhận nhận lại hàng (RETURN_REQUESTED)
 *   POST /orders/{id}/seller-cancel    → SELLER hủy đơn (ESCROWED/ACCEPTED)
 */
import React, { useState, useEffect, useCallback } from "react";
import {
    ChevronLeft, Package, CheckCircle, XCircle, Truck,
    RotateCcw, AlertTriangle, Clock, RefreshCw,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config/apiConfig";
import {
    acceptOrderAPI,
    confirmDeliveryAPI,
    deliverOrderAPI,
    confirmReturnAPI,
    sellerCancelOrderAPI,
} from "../../services/orderService";

type OrderStatus =
    | "PENDING_PAYMENT" | "ESCROWED" | "ACCEPTED" | "SHIPPED" | "DELIVERED"
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
}

const TRACKING_HINTS: Record<string, string> = {
    GHN: "GHN + 8-20 ký tự chữ/số (VD: GHN12345678)",
    GHTK: "GHTK + 6-20 ký tự hoặc S + 8-20 số (VD: GHTK123456 hoặc S12345678)",
    VTP: "VTP + 6-20 ký tự chữ/số (VD: VTP123456)",
    "J&T": "JT/JNT + 8-20 ký tự chữ/số (VD: JT12345678)",
    JNT: "JT/JNT + 8-20 ký tự chữ/số (VD: JNT12345678)",
    JT: "JT/JNT + 8-20 ký tự chữ/số (VD: JT12345678)",
};

function validateTrackingCodeByCarrier(carrier: string, trackingCode: string): string | null {
    const normalizedCarrier = String(carrier || "").trim().toUpperCase();
    const normalizedCode = String(trackingCode || "").trim().toUpperCase();

    if (!normalizedCarrier || normalizedCarrier === "OTHER") {
        return null;
    }

    if (!normalizedCode) {
        return `Vui lòng nhập mã vận đơn cho ${normalizedCarrier}`;
    }

    const patterns: Record<string, RegExp> = {
        GHN: /^GHN[0-9A-Z]{8,20}$/,
        GHTK: /^(GHTK[0-9A-Z]{6,20}|S[0-9]{8,20})$/,
        VTP: /^VTP[0-9A-Z]{6,20}$/,
        "J&T": /^(JT[0-9A-Z]{8,20}|JNT[0-9A-Z]{8,20})$/,
    };

    const pattern = patterns[normalizedCarrier];
    if (!pattern) return null;

    if (!pattern.test(normalizedCode)) {
        return `Mã vận đơn không đúng định dạng của ${normalizedCarrier}.`;
    }

    return null;
}

function getTrackingHintByCarrier(carrier: string): string {
    const normalizedCarrier = String(carrier || "").trim().toUpperCase();
    if (!normalizedCarrier) {
        return "Mã vận đơn theo từng đơn vị vận chuyển (GHN/GHTK/VTP/J&T).";
    }
    return TRACKING_HINTS[normalizedCarrier] || "Mã vận đơn theo định dạng của đơn vị vận chuyển đã chọn.";
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
    ESCROWED:         { label: "Chờ xác nhận",         color: "#3b82f6", bg: "#eff6ff", icon: <Clock size={14} />,          desc: "Buyer đã tạo đơn, đang chờ bạn xác nhận" },
    ACCEPTED:         { label: "Đã xác nhận",          color: "#8b5cf6", bg: "#f5f3ff", icon: <CheckCircle size={14} />,    desc: "Bạn đã xác nhận, chuẩn bị giao hàng" },
    SHIPPED:          { label: "Đang vận chuyển",      color: "#0ea5e9", bg: "#f0f9ff", icon: <Truck size={14} />,          desc: "Bạn đã gửi hàng cho đơn vị vận chuyển" },
    DELIVERED:        { label: "Đã giao hàng",         color: "#f59e0b", bg: "#fffbeb", icon: <Truck size={14} />,          desc: "Bạn đã giao hàng, chờ buyer xác nhận" },
    COMPLETED:        { label: "Hoàn thành",           color: "#10b981", bg: "#f0fdf4", icon: <CheckCircle size={14} />,    desc: "Giao dịch hoàn tất, tiền đã về ví bạn" },
    CANCELLED:        { label: "Đã hủy",               color: "#ef4444", bg: "#fef2f2", icon: <XCircle size={14} />,        desc: "Đơn hàng đã bị hủy" },
    REFUNDED:         { label: "Đã hoàn tiền",         color: "#10b981", bg: "#f0fdf4", icon: <RotateCcw size={14} />,      desc: "Tiền đã hoàn về buyer" },
    RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng",   color: "#f59e0b", bg: "#fffbeb", icon: <RotateCcw size={14} />,      desc: "Buyer yêu cầu hoàn hàng, chờ bạn xác nhận" },
    DISPUTED:         { label: "Đang tranh chấp",      color: "#ef4444", bg: "#fef2f2", icon: <AlertTriangle size={14} />,  desc: "Admin đang xử lý tranh chấp" },
};

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: "ESCROWED",  label: "Đơn đã tạo",         icon: <Package size={16} /> },
    { status: "ACCEPTED",  label: "Bạn xác nhận",       icon: <CheckCircle size={16} /> },
    { status: "SHIPPED",   label: "Đã gửi hàng",        icon: <Truck size={16} /> },
    { status: "DELIVERED", label: "Xác nhận đã giao",   icon: <Truck size={16} /> },
    { status: "COMPLETED", label: "Hoàn thành",         icon: <CheckCircle size={16} /> },
];

function getStepIndex(status: OrderStatus): number {
    const TIMELINE_ORDER: OrderStatus[] = ["ESCROWED", "ACCEPTED", "SHIPPED", "DELIVERED", "COMPLETED"];
    const idx = TIMELINE_ORDER.indexOf(status);
    if (status === "CANCELLED" || status === "REFUNDED") return -1;
    if (status === "RETURN_REQUESTED" || status === "DISPUTED") return 3;
    return idx;
}

export default function SellerOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const orderId = Number(id);
    const token = localStorage.getItem("token") || "";

    const [detail, setDetail] = useState<OrderHistoryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionBusy, setAction] = useState<string | null>(null);
    const [deliveryForm, setDeliveryForm] = useState({ shippingCarrier: "", trackingCode: "", shippingNote: "" });

    const fetchDetail = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/orders/${orderId}/history`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch order");
            setDetail(data.data || data);
        } catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        } finally {
            setLoading(false);
        }
    }, [orderId, token]);

    useEffect(() => {
        void fetchDetail();
    }, [fetchDetail]);

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

    const handleAccept = () => {
        if (!orderId) return;
        void doAction("accept", () => acceptOrderAPI(orderId, token), "Xác nhận nhận đơn hàng này?");
    };

    const handleDeliver = () => {
        if (!deliveryForm.shippingCarrier) {
            alert("Vui lòng nhập đơn vị vận chuyển");
            return;
        }

        const trackingError = validateTrackingCodeByCarrier(deliveryForm.shippingCarrier, deliveryForm.trackingCode);
        if (trackingError) {
            alert(trackingError);
            return;
        }

        if (!orderId) return;
        void doAction("deliver", () => deliverOrderAPI(orderId, deliveryForm, token), "Xác nhận đã giao hàng?");
    };

    const handleConfirmDelivery = () => {
        if (!orderId) return;
        void doAction("confirm-delivery", () => confirmDeliveryAPI(orderId, token), "Xác nhận đơn hàng đã giao thành công tới buyer?");
    };

    const handleConfirmReturn = () => {
        if (!orderId) return;
        void doAction(
            "confirm-return",
            () => confirmReturnAPI(orderId, token),
            "Xác nhận đã nhận lại hàng?"
        );
    };

    const handleSellerCancel = () => {
        if (!orderId) return;
        void doAction(
            "seller-cancel",
            () => sellerCancelOrderAPI(orderId, token),
            "Bạn chắc chắn muốn hủy đơn hàng này?"
        );
    };

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

    const order = detail.order;
    const meta = STATUS_META[order.status] ?? STATUS_META.ESCROWED;
    const stepIdx = getStepIndex(order.status);
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

                    {!isCancelledOrRefunded && (
                        <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                            {TIMELINE_STEPS.map((step, i) => {
                                const done = i <= stepIdx;
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
                </div>

                <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                        <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Thông tin đơn hàng</p>
                    </div>
                    {[
                        { label: "Xe đạp", value: order.bikeTitle },
                        { label: "Người mua", value: order.buyerName },
                        { label: "Số tiền", value: fmtMoney(order.amountPoints), highlight: true },
                        { label: "Ngày tạo", value: fmtDateTime(order.createdAt) },
                        { label: "Cập nhật", value: fmtDateTime(order.updatedAt) },
                        order.acceptedAt ? { label: "Bạn xác nhận", value: fmtDateTime(order.acceptedAt) } : null,
                        order.deliveredAt ? { label: "Bạn giao hàng", value: fmtDateTime(order.deliveredAt) } : null,
                        order.shippingCarrier ? { label: "Đơn vị vận chuyển", value: order.shippingCarrier } : null,
                        order.trackingCode ? { label: "Mã vận đơn", value: order.trackingCode } : null,
                        order.shippingNote ? { label: "Ghi chú giao", value: order.shippingNote } : null,
                        order.returnReason ? { label: "Lý do hoàn", value: order.returnReason, warn: true } : null,
                    ].filter(Boolean).map((row, i) => row && (
                        <div key={i} className="info-row" style={{ display: "grid", gridTemplateColumns: "140px 1fr", padding: "11px 20px", borderBottom: "1px solid #f8fafc", transition: "background .15s", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{row.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: (row as { highlight?: boolean; warn?: boolean }).highlight ? "#2563eb" : (row as { warn?: boolean }).warn ? "#ef4444" : "#0f172a" }}>
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>

                {detail.timeline && detail.timeline.length > 0 && (
                    <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 20 }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                            <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Lịch sử hoạt động</p>
                        </div>
                        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {detail.timeline.map((evt, i) => {
                                const evtMeta = STATUS_META[evt.status] ?? STATUS_META.ESCROWED;
                                const isLast = i === detail.timeline!.length - 1;
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
                                            {evt.note && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{evt.note}</p>}
                                            {evt.actor && <p style={{ fontSize: 11, color: "#94a3b8" }}>bởi {evt.actor}</p>}
                                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{fmtDateTime(evt.timestamp)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {(() => {
                    const busy = actionBusy !== null;

                    if (order.status === "ESCROWED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                                Buyer đã tạo đơn hàng. Hãy xác nhận để bắt đầu xử lý.
                            </p>
                            <button className="action-btn" onClick={handleAccept} disabled={busy}
                                    style={{ ...btnBase, background: busy ? "#f1f5f9" : "#2563eb", color: "white", border: "none", boxShadow: "0 2px 12px rgba(37,99,235,.25)", opacity: busy ? .6 : 1 }}>
                                <CheckCircle size={16} /> {busy ? "Đang xử lý..." : "✓ Xác nhận nhận đơn"}
                            </button>
                            <button className="action-btn" onClick={handleSellerCancel} disabled={busy}
                                    style={{ ...btnBase, background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca", opacity: busy ? .6 : 1 }}>
                                <XCircle size={16} /> {busy ? "Đang xử lý..." : "Hủy đơn hàng"}
                            </button>
                        </div>
                    );

                    if (order.status === "ACCEPTED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                                Nhập thông tin vận chuyển và đánh dấu đã gửi hàng.
                            </p>
                            <input
                                type="text"
                                placeholder="Đơn vị vận chuyển (VD: GHN, GHTK)"
                                value={deliveryForm.shippingCarrier}
                                onChange={(e) => setDeliveryForm(prev => ({ ...prev, shippingCarrier: e.target.value }))}
                                style={{ padding: "10px 14px", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
                            />
                            <input
                                type="text"
                                placeholder="Mã vận đơn (VD: GHN12345678)"
                                value={deliveryForm.trackingCode}
                                onChange={(e) => setDeliveryForm(prev => ({ ...prev, trackingCode: e.target.value }))}
                                style={{ padding: "10px 14px", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
                            />
                            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                                {getTrackingHintByCarrier(deliveryForm.shippingCarrier)}
                            </p>
                            <input
                                type="text"
                                placeholder="Ghi chú (tuỳ chọn)"
                                value={deliveryForm.shippingNote}
                                onChange={(e) => setDeliveryForm(prev => ({ ...prev, shippingNote: e.target.value }))}
                                style={{ padding: "10px 14px", border: "1.5px solid #e8ecf4", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }}
                            />
                            <button className="action-btn" onClick={handleDeliver} disabled={busy}
                                    style={{ ...btnBase, background: busy ? "#f1f5f9" : "#10b981", color: "white", border: "none", boxShadow: "0 2px 12px rgba(16,185,129,.25)", opacity: busy ? .6 : 1 }}>
                                <Truck size={16} /> {busy ? "Đang xử lý..." : "🚚 Đánh dấu đã gửi"}
                            </button>
                            <button className="action-btn" onClick={handleSellerCancel} disabled={busy}
                                    style={{ ...btnBase, background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca", opacity: busy ? .6 : 1 }}>
                                <XCircle size={16} /> {busy ? "Đang xử lý..." : "Hủy đơn hàng"}
                            </button>
                        </div>
                    );

                    if (order.status === "SHIPPED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                                Hàng đang vận chuyển. Khi buyer nhận được hàng, hãy xác nhận đã giao thành công.
                            </p>
                            <button className="action-btn" onClick={handleConfirmDelivery} disabled={busy}
                                    style={{ ...btnBase, background: busy ? "#f1f5f9" : "#0ea5e9", color: "white", border: "none", boxShadow: "0 2px 12px rgba(14,165,233,.25)", opacity: busy ? .6 : 1 }}>
                                <CheckCircle size={16} /> {busy ? "Đang xử lý..." : "✅ Xác nhận đã giao"}
                            </button>
                        </div>
                    );

                    if (order.status === "RETURN_REQUESTED") return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                                Buyer yêu cầu hoàn hàng. Xác nhận khi bạn đã nhận lại hàng.
                            </p>
                            <button className="action-btn" onClick={handleConfirmReturn} disabled={busy}
                                    style={{ ...btnBase, background: busy ? "#f1f5f9" : "#10b981", color: "white", border: "none", boxShadow: "0 2px 12px rgba(16,185,129,.25)", opacity: busy ? .6 : 1 }}>
                                <RotateCcw size={16} /> {busy ? "Đang xử lý..." : "✓ Xác nhận đã nhận lại hàng"}
                            </button>
                        </div>
                    );

                    return null;
                })()}
            </div>
        </div>
    );
}
