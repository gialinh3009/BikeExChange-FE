import { X, ShieldCheck, Clock, AlertCircle, XCircle, CheckCircle2, FileText, Edit3, Trash2 } from "lucide-react";

// ── Types matching backend DTOs ──────────────────────────────────────────────

export type InspectionStatus = "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "INSPECTED" | "APPROVED" | "REJECTED";

interface InspectionData {
    id: number;
    bikeId: number;
    bikeTitle: string;
    ownerId: number;
    ownerName: string;
    inspectorId?: number;
    inspectorName?: string;
    status: InspectionStatus;
    feePoints: number;
    preferredDate?: string;
    preferredTimeSlot?: string;
    address?: string;
    contactPhone?: string;
    notes?: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
}

interface ReportData {
    id: number;
    requestId: number;
    frameCondition?: string;
    groupsetCondition?: string;
    wheelCondition?: string;
    overallScore?: number;
    adminDecision?: InspectionStatus;
    comments?: string;
    createdAt: string;
    medias?: { url: string; type: string; sortOrder: number }[];
}

interface HistoryEvent {
    id: number;
    action: string;
    performedBy?: number;
    metadata?: string;
    timestamp: string;
}

export interface InspectionDetail {
    inspection?: InspectionData;
    report?: ReportData;
    history?: HistoryEvent[];
}

interface InspectionReportModalProps {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    detail: InspectionDetail | null;
    onClose: () => void;
    onCancelInspection?: (inspectionId: number) => void;
    onEditInspection?: (inspection: InspectionData) => void;
    cancelLoading?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s?: string) => {
    if (!s) return "—";
    try { return new Date(s).toLocaleString("vi-VN"); } catch { return s; }
};

const fmtMoney = (n?: number | null) =>
    n != null ? `${Number(n).toLocaleString("vi-VN")} VND` : "—";

// ── Status config for 4 states ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; desc: string }> = {
    NONE: {
        label: "Chưa kiểm định",
        color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb",
        icon: <FileText size={18} />,
        desc: "Xe chưa được gửi yêu cầu kiểm định.",
    },
    REQUESTED: {
        label: "Đang chờ xử lý",
        color: "#d97706", bg: "#fffbeb", border: "#fde68a",
        icon: <Clock size={18} />,
        desc: "Yêu cầu kiểm định đã được gửi, đang chờ phân công inspector.",
    },
    ASSIGNED: {
        label: "Đã phân công inspector",
        color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
        icon: <Clock size={18} />,
        desc: "Inspector đã được phân công, sẽ liên hệ với bạn sớm.",
    },
    IN_PROGRESS: {
        label: "Đang kiểm định",
        color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
        icon: <Clock size={18} />,
        desc: "Inspector đang tiến hành kiểm định xe của bạn.",
    },
    INSPECTED: {
        label: "Đã kiểm tra xong",
        color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc",
        icon: <Clock size={18} />,
        desc: "Inspector đã hoàn thành kiểm tra, đang chờ admin phê duyệt.",
    },
    APPROVED: {
        label: "Đã kiểm định — Đạt",
        color: "#059669", bg: "#f0fdf4", border: "#bbf7d0",
        icon: <CheckCircle2 size={18} />,
        desc: "Xe đã được kiểm định và xác nhận đạt chất lượng.",
    },
    REJECTED: {
        label: "Từ chối kiểm định",
        color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
        icon: <XCircle size={18} />,
        desc: "Yêu cầu kiểm định đã bị từ chối. Bạn có thể gửi lại yêu cầu mới.",
    },
};

function getStatusConfig(status?: string) {
    if (!status) return STATUS_CONFIG.NONE;
    return STATUS_CONFIG[status.toUpperCase()] ?? STATUS_CONFIG.NONE;
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score?: number }) {
    if (score == null) return <span className="text-sm text-gray-400">—</span>;
    const color = score >= 8 ? "#059669" : score >= 5 ? "#d97706" : "#dc2626";
    return (
        <span style={{ color, fontWeight: 700, fontSize: 20 }}>
            {score}<span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>/10</span>
        </span>
    );
}

// ── Row helper ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right">{value ?? "—"}</span>
        </div>
    );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function InspectionReportModal({
    isOpen,
    isLoading,
    error,
    detail,
    onClose,
    onCancelInspection,
    onEditInspection,
    cancelLoading = false,
}: InspectionReportModalProps) {
    if (!isOpen) return null;

    const inspection = detail?.inspection;
    const report = detail?.report;
    const history = detail?.history ?? [];
    const cfg = getStatusConfig(inspection?.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-blue-600" />
                        <h2 className="font-bold text-gray-900 text-base">Báo cáo kiểm định</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
                            <p className="text-sm text-gray-500">Đang tải thông tin kiểm định...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2">
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && !error && detail && (
                        <>
                            {/* Status banner */}
                            <div
                                className="rounded-xl border px-4 py-3 flex items-start gap-3"
                                style={{ background: cfg.bg, borderColor: cfg.border }}
                            >
                                <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
                                <div>
                                    <p className="font-semibold text-sm" style={{ color: cfg.color }}>{cfg.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: cfg.color, opacity: 0.85 }}>{cfg.desc}</p>
                                </div>
                            </div>

                            {/* Inspection info */}
                            {inspection && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Thông tin kiểm định</p>
                                    <div className="bg-gray-50 rounded-xl px-4 py-1">
                                        <InfoRow label="Mã yêu cầu" value={`#${inspection.id}`} />
                                        <InfoRow label="Xe đạp" value={inspection.bikeTitle} />
                                        <InfoRow label="Chủ xe" value={inspection.ownerName} />
                                        <InfoRow
                                            label="Inspector"
                                            value={inspection.inspectorName ?? <span className="text-gray-400 italic">Chưa phân công</span>}
                                        />
                                        <InfoRow label="Phí kiểm định" value={fmtMoney(inspection.feePoints)} />
                                        <InfoRow label="Ngày yêu cầu" value={fmtDate(inspection.createdAt)} />
                                        {inspection.preferredDate && (
                                            <InfoRow label="Ngày ưu tiên" value={inspection.preferredDate} />
                                        )}
                                        {inspection.preferredTimeSlot && (
                                            <InfoRow label="Khung giờ" value={inspection.preferredTimeSlot} />
                                        )}
                                        {inspection.address && (
                                            <InfoRow label="Địa chỉ" value={inspection.address} />
                                        )}
                                        {inspection.contactPhone && (
                                            <InfoRow label="Số điện thoại" value={inspection.contactPhone} />
                                        )}
                                        {inspection.notes && (
                                            <InfoRow label="Ghi chú" value={inspection.notes} />
                                        )}
                                        {inspection.completedAt && (
                                            <InfoRow label="Hoàn thành lúc" value={fmtDate(inspection.completedAt)} />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Report info — only shown when inspector submitted report */}
                            {report && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kết quả kiểm định</p>
                                    <div className="bg-gray-50 rounded-xl px-4 py-1">
                                        <InfoRow label="Điểm tổng thể" value={<ScoreBadge score={report.overallScore} />} />
                                        <InfoRow label="Khung xe" value={report.frameCondition} />
                                        <InfoRow label="Bộ truyền động" value={report.groupsetCondition} />
                                        <InfoRow label="Bánh xe" value={report.wheelCondition} />
                                        {report.adminDecision && (
                                            <InfoRow
                                                label="Quyết định admin"
                                                value={
                                                    <span style={{ color: report.adminDecision === "APPROVED" ? "#059669" : "#dc2626", fontWeight: 700 }}>
                                                        {report.adminDecision === "APPROVED" ? "✓ Đạt" : "✗ Không đạt"}
                                                    </span>
                                                }
                                            />
                                        )}
                                        {report.comments && (
                                            <InfoRow label="Nhận xét" value={report.comments} />
                                        )}
                                        <InfoRow label="Ngày báo cáo" value={fmtDate(report.createdAt)} />
                                    </div>

                                    {/* Report images */}
                                    {report.medias && report.medias.length > 0 && (
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            {report.medias
                                                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                                .map((m, i) => (
                                                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={m.url}
                                                            alt={`Ảnh kiểm định ${i + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition"
                                                        />
                                                    </a>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* History */}
                            {history.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lịch sử hoạt động</p>
                                    <div className="space-y-2">
                                        {history.map((evt, i) => (
                                            <div key={evt.id ?? i} className="flex items-start justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                                                <span className="text-sm font-medium text-gray-800">{evt.action}</span>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{fmtDate(evt.timestamp)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* No data */}
                    {!isLoading && !error && !detail && (
                        <div className="text-center py-10">
                            <ShieldCheck size={40} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Không có dữ liệu kiểm định</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0 gap-3">
                    {/* Seller actions — only when REQUESTED */}
                    {inspection?.status === "REQUESTED" && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => inspection && onEditInspection?.(inspection)}
                                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
                            >
                                <Edit3 size={14} /> Chỉnh sửa
                            </button>
                            <button
                                onClick={() => inspection?.id && onCancelInspection?.(inspection.id)}
                                disabled={cancelLoading}
                                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                            >
                                <Trash2 size={14} /> {cancelLoading ? "Đang hủy..." : "Hủy yêu cầu"}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
