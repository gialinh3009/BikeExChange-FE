/**
 * DisputeDetailPage.tsx  —  /orders/:id/dispute
 *
 * Show dispute details for order in DISPUTED status
 * Both Buyer and Seller can view
 */
import React, { useState, useEffect } from "react";
import {
    ChevronLeft, AlertTriangle, Clock, CheckCircle,
    FileText, User, DollarSign, Calendar, RefreshCw, XCircle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getDisputeDetailAPI, getDisputeByOrderIdAPI } from "../../services/disputeService";

type OrderStatus = "DISPUTED" | "COMPLETED" | "REFUNDED" | "CANCELLED";

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
    createdAt: string;
    updatedAt: string;
    acceptedAt?: string;
    deliveredAt?: string;
    returnReason?: string;
}

interface DisputeInfo {
    id: number;
    orderId: number;
    orderStatus: string;
    amountPoints: number;
    bikeTitle: string;
    sellerName: string;
    sellerPhone?: string;
    sellerShopName?: string;
    reporterName: string;
    reporterEmail?: string;
    reporterPhone?: string;
    reporterAddress?: string;
    reason?: string;
    status: string; // OPEN, INVESTIGATING, RESOLVED_REFUND, RESOLVED_RELEASE, REJECTED
    disputeType?: string;
    buyerContactAddress?: string;
    buyerContactPhone?: string;
    buyerContactEmail?: string;
    resolutionNote?: string;
    createdAt?: string;
    resolvedAt?: string;
}

interface HistoryEvent {
    status: string;
    timestamp: string;
    actor?: string;
    note?: string;
}

interface OrderHistoryDetail {
    order: OrderDetail;
    timeline?: HistoryEvent[];
    dispute?: DisputeInfo;
}

interface RowData {
    label: string;
    value: string;
    icon?: React.ReactNode;
    highlight?: boolean;
    warn?: boolean;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function DisputeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [detail, setDetail] = useState<OrderHistoryDetail | null>(null);

    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập");
            const [historyData, disputeData] = await Promise.all([
                getDisputeDetailAPI(Number(id), token),
                getDisputeByOrderIdAPI(Number(id), token),
            ]);
            // Ensure DISPUTED event exists in timeline for dispute orders
            const timeline = Array.isArray(historyData.timeline) ? [...historyData.timeline] : [];
            const hasDisputed = timeline.some((e: HistoryEvent) => e.status === "DISPUTED");
            if (!hasDisputed && disputeData?.createdAt) {
                timeline.push({
                    status: "DISPUTED",
                    timestamp: disputeData.createdAt,
                    actor: disputeData.reporterName || "Người mua",
                    note: disputeData.reason || "Đã mở tranh chấp với Admin",
                });
                timeline.sort((a: HistoryEvent, b: HistoryEvent) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            }
            setDetail({ ...historyData, timeline, dispute: disputeData });
        } catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid #e8ecf4", borderTop: "3px solid #2563eb", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                    <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ background: "white", borderBottom: "1px solid #e8ecf4", height: 54, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                        <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại
                    </button>
                </div>
                <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Không thể tải thông tin tranh chấp</p>
                    <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>{error || "Đơn hàng này không có tranh chấp"}</p>
                    <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const order = detail.order;
    const dispute = detail.dispute;

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                .page-wrap { animation: fadeUp .3s ease; }
                .info-row:hover { background: #f8faff !important; }
            `}</style>

            {/* ── Top bar ── */}
            <div style={{ background: "white", borderBottom: "1px solid #e8ecf4", height: 54, display: "flex", alignItems: "center", padding: "0 24px", gap: 12, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,.04)" }}>
                <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "6px 10px", borderRadius: 8 }}>
                    <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại
                </button>
                <span style={{ color: "#e2e8f0" }}>|</span>
                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Tranh chấp đơn hàng #{order.id}</span>
                <button onClick={() => fetchDetail()} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: "none", border: "1.5px solid #e8ecf4", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
                    <RefreshCw size={12} /> Làm mới
                </button>
            </div>

            <div className="page-wrap" style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 64px" }}>

                {/* ── Dispute Status Hero ── */}
                {(() => {
                    const isPending = !dispute || dispute.status === "OPEN" || dispute.status === "INVESTIGATING";
                    const isResolved = dispute?.status === "RESOLVED_REFUND" || dispute?.status === "RESOLVED_RELEASE";
                    const isRejected = dispute?.status === "REJECTED";

                    const heroLabel = isPending ? "Đang xử lý tranh chấp"
                        : isResolved ? (dispute?.status === "RESOLVED_REFUND" ? "Đã hoàn tiền cho Buyer" : "Giữ lại cho Seller")
                        : isRejected ? "Tranh chấp bị từ chối" : "Tranh chấp";
                    const heroDesc = isPending ? "Admin đang xem xét và xử lý vụ tranh chấp này"
                        : isResolved ? "Admin đã xử lý xong tranh chấp"
                        : isRejected ? "Admin đã từ chối yêu cầu tranh chấp" : "";
                    const heroColor = isPending ? "#f59e0b" : isResolved ? "#10b981" : isRejected ? "#ef4444" : "#64748b";
                    const heroBg = isPending ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                        : isResolved ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                        : "linear-gradient(135deg, #fef2f2 0%, #ffe5e5 100%)";
                    const heroBorder = isPending ? "#fde68a" : isResolved ? "#bbf7d0" : "#fecaca";
                    const heroIcon = isPending ? <Clock size={28} /> : isResolved ? <CheckCircle size={28} /> : <AlertTriangle size={28} />;

                    return (
                        <div style={{ background: heroBg, borderRadius: 18, border: `1.5px solid ${heroBorder}`, padding: "28px 24px", marginBottom: 20, boxShadow: `0 2px 12px rgba(0,0,0,.06)` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: heroColor, flexShrink: 0 }}>
                                    {heroIcon}
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Trạng thái tranh chấp</p>
                                    <p style={{ fontSize: 18, fontWeight: 800, color: heroColor, marginBottom: 4 }}>{heroLabel}</p>
                                    <p style={{ fontSize: 12, color: "#64748b" }}>{heroDesc}</p>
                                </div>
                            </div>
                            {dispute?.createdAt && (
                                <p style={{ fontSize: 12, color: "#64748b", marginTop: 12, borderTop: `1px solid ${heroBorder}`, paddingTop: 12 }}>
                                    ⏱ Khiếu nại từ: <strong>{fmtDateTime(dispute.createdAt)}</strong>
                                    {dispute.resolvedAt && <> · Xử lý lúc: <strong>{fmtDateTime(dispute.resolvedAt)}</strong></>}
                                </p>
                            )}
                        </div>
                    );
                })()}

                {/* ── Order Info ── */}
                <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                        <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Thông tin đơn hàng</p>
                    </div>
                    {[
                        { label: "Xe đạp", value: order.bikeTitle, icon: <FileText size={14} /> },
                        { label: "Người mua", value: order.buyerName, icon: <User size={14} /> },
                        { label: "Người bán", value: order.sellerName, icon: <User size={14} /> },
                        { label: "Giá trị", value: fmtMoney(order.amountPoints), highlight: true, icon: <DollarSign size={14} /> },
                        { label: "Ngày tạo đơn", value: fmtDateTime(order.createdAt), icon: <Calendar size={14} /> },
                        order.deliveredAt ? { label: "Ngày giao hàng", value: fmtDateTime(order.deliveredAt), icon: <Calendar size={14} /> } : null,
                        order.returnReason ? { label: "Lý do hoàn hàng", value: order.returnReason, warn: true } : null,
                    ].filter(Boolean).map((rowItem, i) => {
                        const row = rowItem as RowData | null;
                        if (!row) return null;
                        return (
                            <div key={i} className="info-row" style={{ display: "flex", gap: 12, padding: "12px 20px", borderBottom: "1px solid #f8fafc", transition: "background .15s", alignItems: "center" }}>
                                <span style={{ color: "#94a3b8" }}>
                                    {row.icon}
                                </span>
                                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, minWidth: 100 }}>
                                    {row.label}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: row.highlight ? "#2563eb" : row.warn ? "#ef4444" : "#0f172a", flex: 1 }}>
                                    {row.value}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Dispute Details ── */}
                {dispute && (
                    <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                            <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Chi tiết tranh chấp</p>
                        </div>

                        {dispute.reason && (
                            <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                                <div style={{ marginBottom: 8 }}>
                                    <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Lý do khiếu nại</p>
                                    <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>{dispute.reason}</p>
                                </div>
                            </div>
                        )}

                        {/* Buyer contact info */}
                        {(dispute.buyerContactPhone || dispute.buyerContactEmail || dispute.buyerContactAddress) && (
                            <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Thông tin liên hệ Buyer</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {dispute.buyerContactPhone && <p style={{ fontSize: 13, color: "#0f172a" }}>📞 {dispute.buyerContactPhone}</p>}
                                    {dispute.buyerContactEmail && <p style={{ fontSize: 13, color: "#0f172a" }}>✉️ {dispute.buyerContactEmail}</p>}
                                    {dispute.buyerContactAddress && <p style={{ fontSize: 13, color: "#0f172a" }}>📍 {dispute.buyerContactAddress}</p>}
                                </div>
                            </div>
                        )}

                        {/* Resolution result */}
                        {(() => {
                            const isResolved = dispute.status === "RESOLVED_REFUND" || dispute.status === "RESOLVED_RELEASE";
                            const isRejected = dispute.status === "REJECTED";
                            if (!isResolved && !isRejected) {
                                return (
                                    <div className="info-row" style={{ padding: "14px 20px", background: "#fffbeb" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Clock size={16} color="#f59e0b" />
                                            <p style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>
                                                Admin đang xem xét vụ tranh chấp này. Vui lòng đợi quyết định.
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            const resColor = isResolved ? "#10b981" : "#ef4444";
                            const resBg = isResolved ? "#f0fdf4" : "#fef2f2";
                            const resLabel = dispute.status === "RESOLVED_REFUND" ? "Hoàn tiền cho Buyer"
                                : dispute.status === "RESOLVED_RELEASE" ? "Giữ lại cho Seller"
                                : "Từ chối yêu cầu";
                            return (
                                <>
                                    <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc", background: resBg }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircle size={16} color={resColor} />
                                            <div>
                                                <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>Quyết định của Admin</p>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: resColor }}>
                                                    {isResolved ? "✓" : "✕"} {resLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {dispute.resolutionNote && (
                                        <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                                            <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Ghi chú từ Admin</p>
                                            <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5, background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>{dispute.resolutionNote}</p>
                                        </div>
                                    )}

                                    {dispute.resolvedAt && (
                                        <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                                            <p style={{ fontSize: 12, color: "#64748b" }}>
                                                ✓ Xử lý lúc: <strong>{fmtDateTime(dispute.resolvedAt)}</strong>
                                            </p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

            </div>
        </div>
    );
}
