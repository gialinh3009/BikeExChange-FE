/**
 * DisputeDetailPage.tsx  —  /orders/:id/dispute
 *
 * Show dispute details for order in DISPUTED status
 * Both Buyer and Seller can view
 */
import React, { useState, useEffect } from "react";
import {
    ChevronLeft, AlertTriangle, Clock, CheckCircle,
    FileText, User, DollarSign, Calendar, RefreshCw,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getDisputeDetailAPI } from "../../services/disputeService";

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
    orderId: number;
    status: string; // DISPUTED, RESOLVED, etc
    reason?: string;
    createdAt?: string;
    resolvedAt?: string;
    resolution?: string; // REFUND, KEPT, etc
    adminNote?: string;
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
            const data = await getDisputeDetailAPI(Number(id), token);
            setDetail(data);
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
                <div style={{ background: "linear-gradient(135deg, #fef2f2 0%, #ffe5e5 100%)", borderRadius: 18, border: "1.5px solid #fecaca", padding: "28px 24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(239,68,68,.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}>
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Trạng thái tranh chấp</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", marginBottom: 4 }}>Đang tranh chấp</p>
                            <p style={{ fontSize: 12, color: "#64748b" }}>Admin đang xử lý vụ tranh chấp này</p>
                        </div>
                    </div>
                    {dispute?.createdAt && (
                        <p style={{ fontSize: 12, color: "#64748b", marginTop: 12, borderTop: "1px solid #fed7d7", paddingTop: 12 }}>
                            ⏱ Khiếu nại từ: <strong>{fmtDateTime(dispute.createdAt)}</strong>
                        </p>
                    )}
                </div>

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

                        {dispute.resolvedAt && (
                            <>
                                <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc", background: "#f0fdf4" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <CheckCircle size={16} color="#10b981" />
                                        <div>
                                            <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>Quyết định xử lý</p>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>
                                                {dispute.resolution === "REFUND" ? "✓ Hoàn tiền cho Buyer" : dispute.resolution === "KEPT" ? "Giữ lại cho Seller" : dispute.resolution}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {dispute.adminNote && (
                                    <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Ghi chú từ Admin</p>
                                            <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>{dispute.adminNote}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="info-row" style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc" }}>
                                    <p style={{ fontSize: 12, color: "#64748b" }}>
                                        ✓ Xử lý lúc: <strong>{fmtDateTime(dispute.resolvedAt)}</strong>
                                    </p>
                                </div>
                            </>
                        )}

                        {!dispute.resolvedAt && (
                            <div className="info-row" style={{ padding: "14px 20px", background: "#fffbeb" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Clock size={16} color="#f59e0b" />
                                    <p style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>
                                        Admin đang xem xét vụ tranh chấp này. Vui lòng đợi quyết định.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Timeline ── */}
                {detail.timeline && detail.timeline.length > 0 && (
                    <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                            <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Lịch sử đơn hàng</p>
                        </div>

                        <div style={{ padding: "20px" }}>
                            {detail.timeline.map((evt, i) => (
                                <div key={i} style={{ display: "flex", gap: 12, marginBottom: i === detail.timeline!.length - 1 ? 0 : 20, paddingBottom: i === detail.timeline!.length - 1 ? 0 : 20, borderBottom: i === detail.timeline!.length - 1 ? "none" : "1px solid #f1f5f9" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: evt.status === "DISPUTED" ? "#ef4444" : "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 700 }}>
                                            {evt.status === "DISPUTED" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                        </div>
                                        {i < detail.timeline!.length - 1 && (
                                            <div style={{ width: 2, height: 32, background: "#e8ecf4", marginTop: 8 }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, paddingTop: 4 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: evt.status === "DISPUTED" ? "#ef4444" : "#0f172a", marginBottom: 2 }}>
                                            {evt.status === "DISPUTED" ? "🚨 Tranh chấp được mở" : `✓ ${evt.status}`}
                                        </p>
                                        {evt.note && <p style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{evt.note}</p>}
                                        {evt.actor && <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>bởi {evt.actor}</p>}
                                        <p style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDateTime(evt.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
