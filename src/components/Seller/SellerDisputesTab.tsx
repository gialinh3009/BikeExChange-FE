/**
 * SellerDisputesTab.tsx
 * 
 * Show list of disputes for seller
 * Tab component for use in seller dashboard
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

interface SellerDisputesTabProps {
    token: string;
}

export default function SellerDisputesTab({ token }: SellerDisputesTabProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [disputes, setDisputes] = useState<DisputeItem[]>([]);

    const fetchDisputes = async () => {
        setLoading(true);
        setError("");
        try {
            if (!token) throw new Error("Vui lòng đăng nhập");
            const data = await getMyDisputesAPI(token);
            setDisputes(Array.isArray(data) ? data : data.data ?? []);
        } catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 text-sm">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => fetchDisputes()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <CheckCircle size={32} className="text-blue-600" />
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-1">Không có tranh chấp</p>
                    <p className="text-gray-500 text-xs">Tất cả các giao dịch của bạn đều bình thường</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Tranh chấp</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Các đơn hàng đang có khiếu nại — admin sẽ xem xét và đưa ra quyết định ({disputes.length})</p>
                </div>
                <button onClick={() => fetchDisputes()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm">
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>

            {/* Disputes list */}
            <div className="space-y-3">
                {disputes.map((dispute) => (
                    <div key={dispute.orderId}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all overflow-hidden p-4">

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
