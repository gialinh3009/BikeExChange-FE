import { X, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

type InspectionDetail = {
    inspection?: any;
    report?: any;
    history?: any;
};

interface InspectionReportModalProps {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    detail: InspectionDetail | null;
    onClose: () => void;
}

function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleString("vi-VN");
    } catch {
        return dateString;
    }
}

function renderInspectionInfo(inspection: any) {
    if (!inspection) return null;
    
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-500 font-semibold">ID</p>
                    <p className="text-sm font-medium text-gray-900">#{inspection.id}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">Trạng thái</p>
                    <p className="text-sm font-medium text-gray-900">{inspection.status || "N/A"}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">Xe đạp</p>
                    <p className="text-sm font-medium text-gray-900">{inspection.bikeTitle || "N/A"}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">Chủ xe</p>
                    <p className="text-sm font-medium text-gray-900">{inspection.ownerName || "N/A"}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">Kiểm định viên</p>
                    <p className="text-sm font-medium text-gray-900">{inspection.inspectorName || "N/A"}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">Phí kiểm định</p>
                    <p className="text-sm font-medium text-gray-900">{inspection.feePoints || 0} điểm</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-semibold">Ngày tạo</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(inspection.createdAt)}</p>
                </div>
                {inspection.preferredDate && (
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-semibold">Ngày ưu tiên</p>
                        <p className="text-sm font-medium text-gray-900">{inspection.preferredDate}</p>
                    </div>
                )}
                {inspection.address && (
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-semibold">Địa chỉ</p>
                        <p className="text-sm font-medium text-gray-900">{inspection.address}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function renderReportInfo(report: any) {
    if (!report) return null;
    
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-500 font-semibold">ID</p>
                    <p className="text-sm font-medium text-gray-900">#{report.id}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">Kết quả</p>
                    <p className={`text-sm font-medium ${report.result ? "text-emerald-600" : "text-red-600"}`}>
                        {report.result ? "✓ Đạt" : "✗ Không đạt"}
                    </p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-semibold">Ghi chú</p>
                    <p className="text-sm font-medium text-gray-900">{report.notes || "Không có ghi chú"}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-semibold">Ngày báo cáo</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(report.createdAt)}</p>
                </div>
            </div>
        </div>
    );
}

export default function InspectionReportModal({
    isOpen,
    isLoading,
    error,
    detail,
    onClose,
}: InspectionReportModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-emerald-600" />
                        <h2 className="font-bold text-gray-900">Báo cáo kiểm định</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-500 mt-2">Đang tải báo cáo...</p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && detail && (
                        <div className="space-y-6">
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-semibold text-emerald-900">Xe đã được kiểm định</div>
                                    <p className="text-sm text-emerald-700 mt-1">
                                        Xe của bạn đã hoàn thành quá trình kiểm định và được xác nhận chất lượng.
                                    </p>
                                </div>
                            </div>

                            {detail.inspection && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Thông tin kiểm định</h3>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        {renderInspectionInfo(detail.inspection)}
                                    </div>
                                </div>
                            )}

                            {detail.report && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Báo cáo chi tiết</h3>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        {renderReportInfo(detail.report)}
                                    </div>
                                </div>
                            )}

                            {detail.history && Array.isArray(detail.history) && detail.history.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Lịch sử hoạt động</h3>
                                    <div className="space-y-2">
                                        {detail.history.map((event: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900">{event.action || event.entityType}</span>
                                                    <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                                                </div>
                                                {event.note && <p className="text-gray-600 mt-1">{event.note}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && !error && !detail && (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500">Không có dữ liệu báo cáo</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
