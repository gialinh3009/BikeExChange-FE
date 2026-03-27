import { useState } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { deleteBikeAPI } from "../../services/Seller/bikeManagementService";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
};

interface DeleteBikeModalProps {
    bike: BikeBrowseItem | null;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeleteBikeModal({ bike, token, onClose, onSuccess }: DeleteBikeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!bike) return;
        try {
            setLoading(true);
            setError(null);
            await deleteBikeAPI(bike.id, token);
            setSuccessMsg(`Xe "${bike.title}" đã được xóa thành công!`);
            onSuccess();
            // Đóng modal sau 1.5s để user thấy thông báo
            setTimeout(() => { setSuccessMsg(null); onClose(); }, 1500);
        } catch (e) {
            setError((e as Error).message || "Xóa xe thất bại.");
        } finally {
            setLoading(false);
        }
    };

    if (!bike) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Xóa xe</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {successMsg ? (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <CheckCircle size={22} className="text-green-600 flex-shrink-0" />
                            <p className="text-sm font-semibold text-green-800">{successMsg}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <AlertTriangle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Bạn chắc chắn muốn xóa xe này?</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Xe "<strong>{bike.title}</strong>" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                                    </p>
                                </div>
                            </div>
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!successMsg && (
                    <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="rounded-xl bg-red-600 text-white px-6 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? "Đang xóa..." : "Xóa xe"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
