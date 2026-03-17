import { X } from "lucide-react";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
};

interface RequestInspectionModalProps {
    isOpen: boolean;
    bike: BikeBrowseItem | null;
    isLoading: boolean;
    error: string | null;
    success: string | null;
    form: {
        preferredDate: string;
        preferredTimeSlot: string;
        address: string;
        contactPhone: string;
        notes: string;
    };
    onFormChange: (field: string, value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export default function RequestInspectionModal({
    isOpen,
    bike,
    isLoading,
    error,
    success,
    form,
    onFormChange,
    onSubmit,
    onClose,
}: RequestInspectionModalProps) {
    if (!isOpen || !bike) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <div className="font-semibold text-gray-900">Đăng ký kiểm định</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            Xe: <span className="font-semibold">{bike.title}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-50"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {error && (
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            {success}
                        </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Ngày ưu tiên</label>
                            <input
                                value={form.preferredDate}
                                onChange={(e) => onFormChange("preferredDate", e.target.value)}
                                placeholder="2026-03-15"
                                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Khung giờ</label>
                            <input
                                value={form.preferredTimeSlot}
                                onChange={(e) => onFormChange("preferredTimeSlot", e.target.value)}
                                placeholder="Sáng / Chiều / 09:00-12:00"
                                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                            <input
                                value={form.address}
                                onChange={(e) => onFormChange("address", e.target.value)}
                                placeholder="123 Lê Lợi, Q1"
                                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">SĐT liên hệ</label>
                            <input
                                value={form.contactPhone}
                                onChange={(e) => onFormChange("contactPhone", e.target.value)}
                                placeholder="0901 234 567"
                                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Ghi chú cho kiểm định viên</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => onFormChange("notes", e.target.value)}
                                placeholder="Ghi rõ tình trạng, mong muốn kiểm định, lưu ý về giấy tờ..."
                                className="mt-1 w-full min-h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isLoading}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {isLoading ? "Đang gửi..." : "Gửi yêu cầu kiểm định"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
