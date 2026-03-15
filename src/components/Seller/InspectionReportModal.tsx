import { X, ShieldCheck, CheckCircle2 } from "lucide-react";

type InspectionDetail = {
    inspection?: unknown;
    report?: unknown;
    history?: unknown;
};

interface InspectionReportModalProps {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    detail: InspectionDetail | null;
    onClose: () => void;
}

export default function InspectionReportModal({
    isOpen,
    isLoading,
    error,
    detail,
    onClose,
}: InspectionReportModalProps) {
    if (!isOpen) return null;

    // Determine status color and text
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; label: string }> = {
            APPROVED: { bg: "bg-emerald-100", text: "text-emerald-800", label: "✓ Đã phê duyệt" },
            REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "✗ Từ chối" },
            IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-800", label: "⏳ Đang kiểm tra" },
            REQUESTED: { bg: "bg-amber-100", text: "text-amber-800", label: "⏱ Chờ xử lý" },
        };
        const s = statusMap[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
        return (
            <span className={`inline-flex items-center gap-1 rounded-full ${s.bg} px-3 py-1 text-sm font-semibold ${s.text}`}>
                {s.label}
            </span>
        );
    };

    // Quality score color
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-emerald-600";
        if (score >= 70) return "text-blue-600";
        if (score >= 50) return "text-amber-600";
        return "text-red-600";
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">Báo cáo kiểm định xe đạp</div>
                            <div className="text-xs text-gray-500 mt-0.5">Kết quả kiểm tra chất lượng</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/50 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <div className="text-sm text-gray-500">Đang tải báo cáo...</div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!isLoading && detail && (() => {
                        const detailData = detail as any;
                        const inspection = detailData?.inspection || {};
                        const report = detailData?.report || {};
                        const history = detailData?.history || [];

                        const qualityScore = report?.qualityScore || 0;
                        const status = inspection?.status || "UNKNOWN";

                        return (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
                                        <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                                        {getStatusBadge(status)}
                                    </div>
                                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
                                        <div className="text-xs text-gray-500 mb-1">Điểm chất lượng</div>
                                        <div className={`text-3xl font-bold ${getScoreColor(qualityScore)}`}>
                                            {qualityScore}/100
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
                                        <div className="text-xs text-gray-500 mb-1">Kiểm định viên</div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {inspection?.inspector?.fullName || "Chưa phân công"}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {inspection?.inspector?.email || "—"}
                                        </div>
                                    </div>
                                </div>

                                {/* Inspection Details */}
                                {report && Object.keys(report).length > 0 && (
                                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <CheckCircle2 size={16} className="text-blue-600" />
                                            </div>
                                            Chi tiết kiểm tra
                                        </h3>
                                        <div className="space-y-4">
                                            {report.frameCondition && (
                                                <div className="flex gap-4">
                                                    <div className="w-32 text-sm font-medium text-gray-700">Khung xe:</div>
                                                    <div className="flex-1 text-sm text-gray-900">{report.frameCondition}</div>
                                                </div>
                                            )}
                                            {report.groupsetCondition && (
                                                <div className="flex gap-4">
                                                    <div className="w-32 text-sm font-medium text-gray-700">Bộ truyền động:</div>
                                                    <div className="flex-1 text-sm text-gray-900">{report.groupsetCondition}</div>
                                                </div>
                                            )}
                                            {report.wheelsCondition && (
                                                <div className="flex gap-4">
                                                    <div className="w-32 text-sm font-medium text-gray-700">Bánh xe:</div>
                                                    <div className="flex-1 text-sm text-gray-900">{report.wheelsCondition}</div>
                                                </div>
                                            )}
                                            {report.notes && (
                                                <div className="flex gap-4">
                                                    <div className="w-32 text-sm font-medium text-gray-700">Ghi chú:</div>
                                                    <div className="flex-1 text-sm text-gray-900 italic">{report.notes}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Request Info */}
                                {inspection && Object.keys(inspection).length > 0 && (
                                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                                        <h3 className="font-bold text-gray-900 mb-4">Thông tin yêu cầu</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {inspection.preferredDate && (
                                                <div>
                                                    <div className="text-gray-500 mb-1">Ngày hẹn:</div>
                                                    <div className="font-medium text-gray-900">{inspection.preferredDate}</div>
                                                </div>
                                            )}
                                            {inspection.preferredTimeSlot && (
                                                <div>
                                                    <div className="text-gray-500 mb-1">Khung giờ:</div>
                                                    <div className="font-medium text-gray-900">{inspection.preferredTimeSlot}</div>
                                                </div>
                                            )}
                                            {inspection.address && (
                                                <div className="md:col-span-2">
                                                    <div className="text-gray-500 mb-1">Địa chỉ:</div>
                                                    <div className="font-medium text-gray-900">{inspection.address}</div>
                                                </div>
                                            )}
                                            {inspection.contactPhone && (
                                                <div>
                                                    <div className="text-gray-500 mb-1">Số điện thoại:</div>
                                                    <div className="font-medium text-gray-900">{inspection.contactPhone}</div>
                                                </div>
                                            )}
                                            {inspection.inspectionFee && (
                                                <div>
                                                    <div className="text-gray-500 mb-1">Phí kiểm định:</div>
                                                    <div className="font-medium text-emerald-700">
                                                        {inspection.inspectionFee.toLocaleString("vi-VN")} điểm
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* History Timeline */}
                                {Array.isArray(history) && history.length > 0 && (
                                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                                        <h3 className="font-bold text-gray-900 mb-4">Lịch sử xử lý</h3>
                                        <div className="space-y-3">
                                            {history.map((item: any, idx: number) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                                        </div>
                                                        {idx < history.length - 1 && (
                                                            <div className="w-0.5 flex-1 bg-gray-200 my-1"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.action || item.status || "Cập nhật"}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {item.timestamp || item.createdAt || "—"}
                                                        </div>
                                                        {item.note && (
                                                            <div className="text-sm text-gray-600 mt-1">{item.note}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Note */}
                                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                                    <strong>Lưu ý:</strong> Báo cáo này được tạo bởi kiểm định viên chuyên nghiệp của BikeExchange.
                                    Kết quả kiểm định có giá trị trong 30 ngày kể từ ngày kiểm tra.
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
