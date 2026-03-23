/**
 * DisputesTab.tsx
 * 
 * Show list of disputes for buyer/seller
 * Tab component for use in profile/orders pages
 */
import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyDisputesAPI } from "../../services/disputeService";

interface DisputeItem {
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
    reason: string;
    status: string; // OPEN, INVESTIGATING, RESOLVED_REFUND, RESOLVED_RELEASE, REJECTED
    disputeType?: string;
    resolutionNote?: string;
    createdAt: string;
    resolvedAt?: string;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
};

export default function DisputesTab() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [disputes, setDisputes] = useState<DisputeItem[]>([]);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Vui lòng đăng nhập");
            const data = await getMyDisputesAPI(token);
            setDisputes(Array.isArray(data) ? data : data.data ?? []);
        } catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #e8ecf4", borderTop: "3px solid #2563eb", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <AlertTriangle size={40} color="#ef4444" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>{error}</p>
                <button
                    onClick={() => fetchDisputes()}
                    style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#2563eb" }}>
                    <CheckCircle size={28} />
                </div>
                <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Không có tranh chấp</p>
                <p style={{ fontSize: 12, color: "#94a3b8" }}>Tất cả các giao dịch của bạn đều bình thường</p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                .dispute-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08) !important; transform: translateY(-1px); }
                .dispute-card { transition: all .2s ease; }
            `}</style>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid #e8ecf4" }}>
                <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Danh sách tranh chấp</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{disputes.length} tranh chấp</p>
                </div>
                <button
                    onClick={() => fetchDisputes()}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1.5px solid #e8ecf4", borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "#64748b", fontWeight: 600, cursor: "pointer" }}
                >
                    <RefreshCw size={13} /> Làm mới
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {disputes.map((dispute) => {
                    const isPending = dispute.status === "OPEN" || dispute.status === "INVESTIGATING";
                    const isResolved = dispute.status === "RESOLVED_REFUND" || dispute.status === "RESOLVED_RELEASE";
                    const isRejected = dispute.status === "REJECTED";

                    const statusLabel = isPending ? "Đang xử lý" : isResolved
                        ? (dispute.status === "RESOLVED_REFUND" ? "Đã hoàn tiền" : "Giữ lại cho Seller")
                        : isRejected ? "Đã từ chối" : dispute.status;
                    const statusColor = isPending ? "#f59e0b" : isResolved ? "#10b981" : isRejected ? "#ef4444" : "#64748b";
                    const statusBg = isPending ? "#fffbeb" : isResolved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#f8fafc";
                    const borderColor = isPending ? "#fde68a" : isResolved ? "#bbf7d0" : isRejected ? "#fecaca" : "#e8ecf4";

                    return (
                        <div
                            key={dispute.orderId}
                            className="dispute-card"
                            style={{
                                background: "white",
                                border: `1.5px solid ${borderColor}`,
                                borderRadius: 16,
                                padding: "18px 20px",
                                cursor: "pointer",
                            }}
                            onClick={() => navigate(`/orders/${dispute.orderId}/dispute`)}
                        >
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                                <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: statusBg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: statusColor,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {isPending ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                                            Đơn #{dispute.orderId} — {dispute.bikeTitle}
                                        </p>
                                        <p style={{ fontSize: 12, color: "#64748b" }}>
                                            Người bán: <strong>{dispute.sellerName}</strong>
                                            {dispute.sellerShopName && <> · {dispute.sellerShopName}</>}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "5px 10px",
                                        borderRadius: 20,
                                        background: statusBg,
                                        color: statusColor,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                        marginLeft: 8,
                                    }}
                                >
                                    {isPending && "⏳ "}{isResolved && "✓ "}{isRejected && "✕ "}{statusLabel}
                                </span>
                            </div>

                            {/* Reason */}
                            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                                <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Lý do khiếu nại:</p>
                                <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.5 }}>
                                    {dispute.reason.length > 120 ? dispute.reason.substring(0, 120) + "..." : dispute.reason}
                                </p>
                            </div>

                            {/* Info grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                                <div>
                                    <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Giá trị đơn</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: "#2563eb" }}>{fmtMoney(dispute.amountPoints)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Ngày khiếu nại</p>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmtDate(dispute.createdAt)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Trạng thái đơn</p>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{dispute.orderStatus === "REFUNDED" ? "Đã hoàn tiền" : dispute.orderStatus === "COMPLETED" ? "Đã hoàn thành" : dispute.orderStatus === "DISPUTED" ? "Tranh chấp" : dispute.orderStatus}</p>
                                </div>
                            </div>

                            {/* Resolution result */}
                            {(isResolved || isRejected) && (
                                <div
                                    style={{
                                        background: isResolved ? "#f0fdf4" : "#fef2f2",
                                        border: `1px solid ${isResolved ? "#dcfce7" : "#fecaca"}`,
                                        borderRadius: 10,
                                        padding: "12px 14px",
                                        marginBottom: 12,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <CheckCircle size={14} color={isResolved ? "#10b981" : "#ef4444"} />
                                        <p style={{ fontSize: 12, fontWeight: 700, color: isResolved ? "#15803d" : "#dc2626" }}>
                                            Kết quả: {statusLabel}
                                        </p>
                                    </div>
                                    {dispute.resolutionNote && (
                                        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, marginTop: 4 }}>
                                            Ghi chú Admin: {dispute.resolutionNote}
                                        </p>
                                    )}
                                    {dispute.resolvedAt && (
                                        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                                            Xử lý ngày: {fmtDate(dispute.resolvedAt)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* View detail */}
                            <div
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    background: "#f8faff",
                                    border: "1.5px solid #e8ecf4",
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#2563eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                <Eye size={14} /> Xem chi tiết
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
