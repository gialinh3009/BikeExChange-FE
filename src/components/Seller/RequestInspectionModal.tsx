import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { getInspectionFeeAPI } from "../../services/settingsService";
import AddressFields, {
    type AddressParts,
    OutOfAreaPopup,
} from "./AddressFields";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
};

export interface RequestInspectionForm {
    preferredDate: string;
    preferredTimeSlot: string;
    addressParts: AddressParts;
    contactPhone: string;
    notes: string;
}

interface RequestInspectionModalProps {
    isOpen: boolean;
    bike: BikeBrowseItem | null;
    isLoading: boolean;
    error: string | null;
    success: string | null;
    form: RequestInspectionForm;
    onFormChange: (field: keyof RequestInspectionForm, value: string | AddressParts) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export default function RequestInspectionModal({
    isOpen, bike, isLoading, error, success,
    form, onFormChange, onSubmit, onClose,
}: RequestInspectionModalProps) {
    const [inspectionFee, setInspectionFee] = useState<number | null>(null);
    const [showOutOfArea, setShowOutOfArea] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let mounted = true;
        getInspectionFeeAPI()
            .then((fee) => { if (mounted && Number.isFinite(Number(fee))) setInspectionFee(Number(fee)); })
            .catch(() => { if (mounted) setInspectionFee(null); });
        return () => { mounted = false; };
    }, [isOpen]);

    if (!isOpen || !bike) return null;

    const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    return (
        <>
            {showOutOfArea && <OutOfAreaPopup onClose={() => setShowOutOfArea(false)} />}

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Đăng ký kiểm định</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Bike info */}
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                            <div className="font-semibold text-gray-900">{bike.title}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                {bike.condition} • {bike.pricePoints?.toLocaleString("vi-VN")} VND
                            </div>
                        </div>

                        {/* Fee */}
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-amber-900">Phí kiểm định</div>
                                    <div className="text-xs text-amber-700 mt-1">Sẽ được trừ từ ví của bạn khi gửi yêu cầu</div>
                                </div>
                                <div className="text-lg font-bold text-amber-900">
                                    {inspectionFee !== null ? `${inspectionFee.toLocaleString("vi-VN")} VND` : "Đang cập nhật"}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex gap-2">
                                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" /> {success}
                            </div>
                        )}

                        {!success && (
                            <div className="space-y-4">
                                {/* Ngày ưu tiên */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ngày ưu tiên</label>
                                    <input type="date" value={form.preferredDate}
                                        onChange={(e) => onFormChange("preferredDate", e.target.value)}
                                        className={inputCls} />
                                </div>

                                {/* Khung giờ */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Khung giờ</label>
                                    <select value={form.preferredTimeSlot}
                                        onChange={(e) => onFormChange("preferredTimeSlot", e.target.value)}
                                        className={inputCls}>
                                        <option value="">-- Chọn khung giờ --</option>
                                        <option value="Sáng">Sáng (7h - 12h)</option>
                                        <option value="Chiều">Chiều (12h - 17h)</option>
                                        <option value="Tối">Tối (17h - 21h)</option>
                                    </select>
                                </div>

                                {/* Địa chỉ cascade */}
                                <AddressFields
                                    value={form.addressParts}
                                    onChange={(parts) => onFormChange("addressParts", parts)}
                                    onOutOfArea={() => setShowOutOfArea(true)}
                                />

                                {/* SĐT */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">SĐT liên hệ</label>
                                    <input type="tel" placeholder="0901234567" value={form.contactPhone}
                                        onChange={(e) => onFormChange("contactPhone", e.target.value)}
                                        className={inputCls} />
                                </div>

                                {/* Ghi chú */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ghi chú</label>
                                    <textarea placeholder="Ghi chú cho kiểm định viên..." value={form.notes}
                                        onChange={(e) => onFormChange("notes", e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                        <button onClick={onClose}
                            className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            Đóng
                        </button>
                        {!success && (
                            <button onClick={onSubmit} disabled={isLoading}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 text-sm font-semibold text-white transition">
                                {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
