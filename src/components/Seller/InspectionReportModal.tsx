import { X } from "lucide-react";

interface InspectionReportModalProps {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    detail: any;
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

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">Báo cáo kiểm định</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-50"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {isLoading && <div className="text-sm text-gray-500">Đang tải...</div>}
                    {error && (
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {detail && (
                        <div className="space-y-4">
                            {detail.inspection && (
                                <div>
                                    <div className="font-semibold text-gray-900 mb-2">Thông tin kiểm định</div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>Trạng thái: {(detail.inspection as any)?.status || "—"}</div>
                                        <div>Ngày kiểm định: {(detail.inspection as any)?.inspectionDate || "—"}</div>
                                    </div>
                                </div>
                            )}
                            {detail.report && (
                                <div>
                                    <div className="font-semibold text-gray-900 mb-2">Báo cáo</div>
                                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {(detail.report as any)?.content || "—"}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
