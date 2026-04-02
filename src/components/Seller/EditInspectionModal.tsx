import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, Edit3 } from "lucide-react";
import { updateInspectionAPI } from "../../services/Seller/inspectionService";
import AddressFields, {
    type AddressParts,
    EMPTY_ADDRESS,
    buildAddressString,
    OutOfAreaPopup,
} from "./AddressFields";

interface EditForm {
    preferredDate: string;
    preferredTimeSlot: string;
    addressParts: AddressParts;
    contactPhone: string;
    notes: string;
}

interface EditInspectionModalProps {
    isOpen: boolean;
    inspectionId: number | null;
    initialData: {
        preferredDate?: string;
        preferredTimeSlot?: string;
        address?: string;
        contactPhone?: string;
        notes?: string;
    };
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditInspectionModal({
    isOpen, inspectionId, initialData, token, onClose, onSuccess,
}: EditInspectionModalProps) {
    const [form, setForm] = useState<EditForm>({
        preferredDate: "",
        preferredTimeSlot: "",
        addressParts: { ...EMPTY_ADDRESS },
        contactPhone: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showOutOfArea, setShowOutOfArea] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setSuccess(false);
        // Address from BE is a plain string — put it in `detail`, selects start empty
        // so user can re-select if needed, or just keep the detail field
        setForm({
            preferredDate: initialData.preferredDate ?? "",
            preferredTimeSlot: initialData.preferredTimeSlot ?? "",
            addressParts: {
                ...EMPTY_ADDRESS,
                // Put the full existing address string into detail as fallback
                detail: initialData.address ?? "",
            },
            contactPhone: initialData.contactPhone ?? "",
            notes: initialData.notes ?? "",
        });
    }, [isOpen, initialData]);

    if (!isOpen || inspectionId == null) return null;

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            const addressStr = buildAddressString(form.addressParts) || form.addressParts.detail || null;
            await updateInspectionAPI(
                inspectionId,
                {
                    preferredDate: form.preferredDate || null,
                    preferredTimeSlot: form.preferredTimeSlot || null,
                    address: addressStr,
                    contactPhone: form.contactPhone || null,
                    notes: form.notes || null,
                },
                token
            );
            setSuccess(true);
            onSuccess();
        } catch (e) {
            setError((e as Error).message || "Cập nhật thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

    return (
        <>
            {showOutOfArea && <OutOfAreaPopup onClose={() => setShowOutOfArea(false)} />}

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Edit3 size={18} className="text-blue-600" />
                            <h2 className="font-bold text-gray-900">Chỉnh sửa yêu cầu kiểm định</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                            Chỉ có thể chỉnh sửa khi đơn đang ở trạng thái <span className="font-semibold">Chờ xử lý</span>.
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> {error}
                            </div>
                        )}

                        {success ? (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex gap-2">
                                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                                Cập nhật yêu cầu kiểm định thành công.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Ngày ưu tiên */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ngày ưu tiên</label>
                                    <input type="date" value={form.preferredDate}
                                        onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                                        className={inputCls} />
                                </div>

                                {/* Khung giờ */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Khung giờ</label>
                                    <select value={form.preferredTimeSlot}
                                        onChange={(e) => setForm((p) => ({ ...p, preferredTimeSlot: e.target.value }))}
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
                                    onChange={(parts) => setForm((p) => ({ ...p, addressParts: parts }))}
                                    onOutOfArea={() => setShowOutOfArea(true)}
                                />

                                {/* SĐT */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">SĐT liên hệ</label>
                                    <input type="tel" placeholder="0901234567" value={form.contactPhone}
                                        onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                                        className={inputCls} />
                                </div>

                                {/* Ghi chú */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ghi chú</label>
                                    <textarea placeholder="Ghi chú cho kiểm định viên..." value={form.notes}
                                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                        <button onClick={onClose}
                            className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                            {success ? "Đóng" : "Hủy bỏ"}
                        </button>
                        {!success && (
                            <button onClick={handleSubmit} disabled={loading}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 text-sm font-semibold text-white transition">
                                {loading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
