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
    orderId: number;
    orderAmount: number;
    bikeTitle: string;
    buyerName: string;
    sellerName: string;
    status: string; // DISPUTED, RESOLVED
    reason: string;
    createdAt: string;
    resolvedAt?: string;
    resolution?: string; // REFUND, KEPT
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
                .dispute-card:hover { background: #f8faff !important; }
            `}</style>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, marginBottom: 12, borderBottom: "1px solid #e8ecf4" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    Danh sách tranh chấp ({disputes.length})
                </p>
                <button
                    onClick={() => fetchDisputes()}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid #e8ecf4", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#64748b", fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
                >
                    <RefreshCw size={12} /> Làm mới
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {disputes.map((dispute) => (
                    <div
                        key={dispute.orderId}
                        className="dispute-card"
                        style={{
                            background: "white",
                            border: "1.5px solid #e8ecf4",
                            borderRadius: 12,
                            padding: "14px 16px",
                            transition: "background .15s",
                        }}
                    >
                        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: dispute.status === "DISPUTED" ? "#fef2f2" : "#f0fdf4",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: dispute.status === "DISPUTED" ? "#ef4444" : "#10b981",
                                    flexShrink: 0,
                                }}
                            >
                                {dispute.status === "DISPUTED" ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        Đơn #{dispute.orderId}
                                    </p>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: "4px 8px",
                                            borderRadius: 4,
                                            background: dispute.status === "DISPUTED" ? "#fef2f2" : "#f0fdf4",
                                            color: dispute.status === "DISPUTED" ? "#ef4444" : "#10b981",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {dispute.status === "DISPUTED" ? "🚨 Đang xử lý" : "✓ Đã giải quyết"}
                                    </span>
                                </div>

                                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {dispute.bikeTitle}
                                </p>

                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <p style={{ fontSize: 11, color: "#94a3b8" }}>Mua: {dispute.buyerName}</p>
                                    <p style={{ fontSize: 11, color: "#94a3b8" }}>Bán: {dispute.sellerName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px", marginBottom: 10 }}>
                            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>Lý do:</p>
                            <p style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.4 }}>
                                {dispute.reason.length > 80 ? dispute.reason.substring(0, 80) + "..." : dispute.reason}
                            </p>
                        </div>

                        {/* Info row */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                            <div>
                                <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Giá trị</p>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{fmtMoney(dispute.orderAmount)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Ngày khiếu nại</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{fmtDate(dispute.createdAt)}</p>
                            </div>
                        </div>

                        {/* Resolution */}
                        {dispute.resolvedAt && (
                            <div
                                style={{
                                    background: "#f0fdf4",
                                    border: "1px solid #dcfce7",
                                    borderRadius: 8,
                                    padding: "10px",
                                    marginBottom: 10,
                                }}
                            >
                                <p style={{ fontSize: 11, color: "#15803d", fontWeight: 600, marginBottom: 3 }}>✓ Quyết định xử lý</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>
                                    {dispute.resolution === "REFUND" ? "Hoàn tiền cho Buyer" : dispute.resolution === "KEPT" ? "Giữ lại cho Seller" : dispute.resolution}
                                </p>
                                <p style={{ fontSize: 10, color: "#22c55e", marginTop: 4 }}>
                                    Ngày xử lý: {fmtDate(dispute.resolvedAt)}
                                </p>
                            </div>
                        )}

                        {/* Action button */}
                        <button
                            onClick={() => navigate(`/orders/${dispute.orderId}/dispute`)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                background: "#eff6ff",
                                color: "#2563eb",
                                border: "1.5px solid #bfdbfe",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                transition: "all .2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#dbeafe";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#eff6ff";
                            }}
                        >
                            <Eye size={14} /> Xem chi tiết
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
