import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, AlertTriangle, CheckCircle, Clock, Package,
    User, Phone, Mail, FileText, Calendar,
} from "lucide-react";
import { getSellerDisputeByOrderIdAPI, getDisputeDetailAPI } from "../../services/disputeService";

const fmtMoney = (p: number) =>
    `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    ESCROWED:         { label: "Chờ xác nhận",      color: "#3b82f6", bg: "#eff6ff" },
    ACCEPTED:         { label: "Đã xác nhận",        color: "#8b5cf6", bg: "#f5f3ff" },
    SHIPPED:          { label: "Đang vận chuyển",    color: "#0ea5e9", bg: "#f0f9ff" },
    DELIVERED:        { label: "Đã giao hàng",       color: "#f59e0b", bg: "#fffbeb" },
    RETURN_REQUESTED: { label: "Yêu cầu hoàn",       color: "#f97316", bg: "#fff7ed" },
    DISPUTED:         { label: "Tranh chấp",          color: "#ef4444", bg: "#fef2f2" },
    COMPLETED:        { label: "Đã hoàn thành",      color: "#10b981", bg: "#f0fdf4" },
    REFUNDED:         { label: "Đã hoàn tiền",       color: "#10b981", bg: "#f0fdf4" },
    CANCELLED:        { label: "Đã hủy",             color: "#64748b", bg: "#f8fafc" },
    UNKNOWN:          { label: "—",                  color: "#94a3b8", bg: "#f8fafc" },
};

export default function SellerDisputeDetailPage() {
    const { id: orderId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const token = localStorage.getItem("token") ?? "";

    const [dispute, setDispute] = useState<any>(null);
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!orderId) return;
        (async () => {
            setLoading(true);
            setError("");
            try {
                const [d, h] = await Promise.all([
                    getSellerDisputeByOrderIdAPI(orderId, token),
                    getDisputeDetailAPI(orderId, token),
                ]);
                setDispute(d);
                setDetail(h);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        })();
    }, [orderId, token]);

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #e8ecf4", borderTop: "3px solid #f97316", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <AlertTriangle size={40} color="#ef4444" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>{error}</p>
                <button onClick={() => navigate("/seller")} style={{ padding: "8px 20px", background: "#f97316", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                    Quay lại
                </button>
            </div>
        </div>
    );

    if (!dispute) return null;

    const isPending = dispute.status === "OPEN" || dispute.status === "INVESTIGATING";
    const isResolved = dispute.status === "RESOLVED_REFUND" || dispute.status === "RESOLVED_RELEASE";
    const isRejected = dispute.status === "REJECTED";

    const statusLabel = isPending ? "Đang xử lý"
        : dispute.status === "RESOLVED_REFUND" ? "Hoàn tiền cho Buyer"
        : dispute.status === "RESOLVED_RELEASE" ? "Giữ lại cho bạn"
        : isRejected ? "Đã từ chối" : dispute.status;

    const statusColor = isPending ? "#f59e0b"
        : dispute.status === "RESOLVED_RELEASE" ? "#10b981"
        : dispute.status === "RESOLVED_REFUND" ? "#ef4444"
        : "#64748b";

    const statusBg = isPending ? "#fffbeb"
        : dispute.status === "RESOLVED_RELEASE" ? "#f0fdf4"
        : dispute.status === "RESOLVED_REFUND" ? "#fef2f2"
        : "#f8fafc";

    const timeline: any[] = detail?.timeline ?? [];

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", padding: "24px 20px 64px" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            {/* Back button */}
            <button
                onClick={() => navigate("/seller")}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0 }}
            >
                <ArrowLeft size={16} /> Quay lại danh sách tranh chấp
            </button>


            <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Header card */}
                <div style={{ background: "white", borderRadius: 16, border: `1.5px solid ${statusColor}40`, padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", gap: 14, flex: 1 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: statusBg, display: "flex", alignItems: "center", justifyContent: "center", color: statusColor, flexShrink: 0 }}>
                                {isPending ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
                            </div>
                            <div>
                                <p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                                    Tranh chấp — Đơn #{dispute.orderId}
                                </p>
                                <p style={{ fontSize: 13, color: "#64748b" }}>{dispute.bikeTitle}</p>
                            </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 20, background: statusBg, color: statusColor, whiteSpace: "nowrap", flexShrink: 0 }}>
                            {isPending && "⏳ "}{dispute.status === "RESOLVED_RELEASE" && "✓ "}{dispute.status === "RESOLVED_REFUND" && "✕ "}
                            {statusLabel}
                        </span>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Thông tin người mua */}
                    <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <User size={14} color="#3b82f6" />
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Thông tin người mua</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <InfoRow icon={<User size={13} />} label="Tên" value={dispute.reporterName} />
                            {dispute.reporterEmail && <InfoRow icon={<Mail size={13} />} label="Email" value={dispute.reporterEmail} />}
                            {(dispute.buyerContactPhone || dispute.reporterPhone) && (
                                <InfoRow icon={<Phone size={13} />} label="SĐT" value={dispute.buyerContactPhone ?? dispute.reporterPhone} />
                            )}
                            {dispute.buyerContactAddress && (
                                <InfoRow icon={<Package size={13} />} label="Địa chỉ" value={dispute.buyerContactAddress} />
                            )}
                        </div>
                    </div>

                    {/* Thông tin đơn hàng */}
                    <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Package size={14} color="#f97316" />
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Thông tin đơn hàng</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <InfoRow icon={<Package size={13} />} label="Giá trị" value={fmtMoney(dispute.amountPoints)} accent="#f97316" />
                            <InfoRow icon={<Calendar size={13} />} label="Ngày khiếu nại" value={fmtDateTime(dispute.createdAt)} />
                            {dispute.resolvedAt && <InfoRow icon={<Calendar size={13} />} label="Ngày xử lý" value={fmtDateTime(dispute.resolvedAt)} />}
                            <InfoRow icon={<Clock size={13} />} label="Trạng thái đơn" value={
                                dispute.orderStatus === "REFUNDED" ? "Đã hoàn tiền"
                                : dispute.orderStatus === "COMPLETED" ? "Đã hoàn thành"
                                : dispute.orderStatus === "DISPUTED" ? "Tranh chấp"
                                : dispute.orderStatus
                            } />
                        </div>
                    </div>
                </div>

                {/* Lý do khiếu nại */}
                <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={14} color="#ef4444" />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Lý do khiếu nại</p>
                    </div>
                    <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                        {dispute.reason}
                    </p>
                </div>

                {/* Kết quả xử lý */}
                {(isResolved || isRejected) && (
                    <div style={{
                        background: dispute.status === "RESOLVED_RELEASE" ? "#f0fdf4" : "#fef2f2",
                        border: `1.5px solid ${dispute.status === "RESOLVED_RELEASE" ? "#bbf7d0" : "#fecaca"}`,
                        borderRadius: 16, padding: "18px 20px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <CheckCircle size={16} color={dispute.status === "RESOLVED_RELEASE" ? "#10b981" : "#ef4444"} />
                            <p style={{ fontSize: 14, fontWeight: 700, color: dispute.status === "RESOLVED_RELEASE" ? "#15803d" : "#dc2626" }}>
                                Kết quả: {statusLabel}
                            </p>
                        </div>
                        {dispute.resolutionNote && (
                            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, background: "rgba(255,255,255,.7)", borderRadius: 8, padding: "10px 12px" }}>
                                <strong>Ghi chú Admin:</strong> {dispute.resolutionNote}
                            </p>
                        )}
                        {dispute.resolvedAt && (
                            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Xử lý ngày: {fmtDateTime(dispute.resolvedAt)}</p>
                        )}
                    </div>
                )}

                {/* Timeline */}
                {timeline.length > 0 && (
                    <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Clock size={14} color="#8b5cf6" />
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Lịch sử đơn hàng</p>
                        </div>
                        <div style={{ position: "relative" }}>
                            {timeline.map((evt: any, idx: number) => {
                                const meta = STATUS_META[evt.status] ?? STATUS_META.UNKNOWN;
                                const isLast = idx === timeline.length - 1;
                                return (
                                    <div key={idx} style={{ display: "flex", gap: 14, marginBottom: isLast ? 0 : 16, position: "relative" }}>
                                        {/* Line */}
                                        {!isLast && (
                                            <div style={{ position: "absolute", left: 11, top: 24, bottom: -16, width: 2, background: "#e8ecf4", zIndex: 0 }} />
                                        )}
                                        {/* Dot */}
                                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: isLast ? meta.color : meta.bg, border: `2px solid ${meta.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }} />
                                        {/* Content */}
                                        <div style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                                                {evt.actor && (
                                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>· {evt.actor}</span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: 12, color: "#94a3b8" }}>{fmtDateTime(evt.timestamp)}</p>
                                            {evt.note && (
                                                <p style={{ fontSize: 12, color: "#475569", marginTop: 4, background: "#f8fafc", borderRadius: 6, padding: "6px 10px", lineHeight: 1.5 }}>
                                                    {evt.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: "#94a3b8", flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 72, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: accent ?? "#0f172a", wordBreak: "break-word" }}>{value ?? "—"}</span>
        </div>
    );
}
