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
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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


                            {Boolean(detail.inspection) && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Thông tin kiểm định</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
                                        <pre>{JSON.stringify(detail.inspection, null, 2) || ""}</pre>
                                    </div>
                                </div>
                            )}


                            {Boolean(detail.report) && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Báo cáo chi tiết</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
                                        <pre>{JSON.stringify(detail.report, null, 2) || ""}</pre>
                                    </div>
                                </div>
                            )}


                            {Boolean(detail.history) && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Lịch sử</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">
                                        <pre>{JSON.stringify(detail.history, null, 2) || ""}</pre>
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



