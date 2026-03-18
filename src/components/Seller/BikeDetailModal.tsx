import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { getBikeDetailAPI } from "../../services/Seller/bikeManagementService";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
    description?: string;
    bikeType?: string;
    frameSize?: string;
    model?: string;
    year?: string;
    brand?: string;
};

interface BikeDetailModalProps {
    bike: BikeBrowseItem | null;
    onClose: () => void;
    onEdit?: (bike: BikeBrowseItem) => void;
    onDelete?: (bike: BikeBrowseItem) => void;
}

export default function BikeDetailModal({ bike, onClose, onEdit, onDelete }: BikeDetailModalProps) {
    const [imageIndex, setImageIndex] = useState(0);
    const [fullBikeData, setFullBikeData] = useState<BikeBrowseItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bike) return;

        const fetchBikeDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem("token") || "";
                const data = await getBikeDetailAPI(bike.id, token);
                setFullBikeData(data);
            } catch (e) {
                console.error("Error fetching bike details:", e);
                setError((e as Error).message || "Không thể tải chi tiết xe");
                // Fallback to the bike data passed in
                setFullBikeData(bike);
            } finally {
                setLoading(false);
            }
        };

        fetchBikeDetails();
    }, [bike]);

    if (!bike) return null;

    const displayBike = fullBikeData || bike;

    const images = displayBike.media || [];
    const currentImage = images[imageIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 text-lg">Chi tiết xe</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-600 mt-2">Đang tải thông tin...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                            {error}
                        </div>
                    )}
                    {!loading && (
                        <>
                    {/* Image Gallery */}
                    {images.length > 0 && (
                        <div className="space-y-3">
                            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                                {currentImage && (
                                    <img
                                        src={currentImage.url}
                                        alt={displayBike.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error("❌ Image load error:", currentImage.url);
                                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E";
                                        }}
                                    />
                                )}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-lg transition"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-lg transition"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                                            {imageIndex + 1} / {images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setImageIndex(idx)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                                                idx === imageIndex ? "border-blue-500" : "border-gray-200"
                                            }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`${displayBike.title} ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3C/svg%3E";
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Title and Price */}
                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{displayBike.title}</h3>
                        <p className="text-2xl font-bold text-emerald-600">
                            {displayBike.pricePoints?.toLocaleString("vi-VN")} VND
                        </p>
                    </div>

                    {/* Bike Details Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Hãng */}
                        <div className="border-b border-gray-100 pb-4">
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Hãng</div>
                            <div className="text-base font-semibold text-gray-900">
                                {displayBike.brand || "—"}
                            </div>
                        </div>

                        {/* Model */}
                        <div className="border-b border-gray-100 pb-4">
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Model</div>
                            <div className="text-base font-semibold text-gray-900">
                                {displayBike.model || "—"}
                            </div>
                        </div>

                        {/* Năm sản xuất */}
                        <div className="border-b border-gray-100 pb-4">
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Năm sản xuất</div>
                            <div className="text-base font-semibold text-gray-900">
                                {displayBike.year || "—"}
                            </div>
                        </div>

                        {/* Loại xe */}
                        <div className="border-b border-gray-100 pb-4">
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Loại xe</div>
                            <div className="text-base font-semibold text-gray-900">
                                {displayBike.bikeType || "—"}
                            </div>
                        </div>

                        {/* Tình trạng */}
                        <div className="border-b border-gray-100 pb-4">
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Tình trạng</div>
                            <div className="text-base font-semibold text-gray-900">
                                {displayBike.condition || "—"}
                            </div>
                        </div>

                        {/* Kích thước khung */}
                        <div className="border-b border-gray-100 pb-4">
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Kích thước khung</div>
                            <div className="text-base font-semibold text-gray-900">
                                {displayBike.frameSize || "—"}
                            </div>
                        </div>
                    </div>

                    {/* Mô tả */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Mô tả</div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {displayBike.description || "Không có mô tả"}
                        </p>
                    </div>
                        </>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                    >
                        Đóng
                    </button>
                    {onEdit && (
                        <button
                            onClick={() => {
                                onEdit(displayBike);
                                onClose();
                            }}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-6 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition flex items-center gap-2"
                        >
                            <Edit2 size={16} />
                            Chỉnh sửa
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => {
                                onDelete(displayBike);
                                onClose();
                            }}
                            className="rounded-lg border border-red-300 bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Xóa
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
