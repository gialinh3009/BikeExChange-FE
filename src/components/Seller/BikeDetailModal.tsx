import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
};

interface BikeDetailModalProps {
    bike: BikeBrowseItem | null;
    onClose: () => void;
}

export default function BikeDetailModal({ bike, onClose }: BikeDetailModalProps) {
    const [imageIndex, setImageIndex] = useState(0);

    if (!bike) return null;

    const images = bike.media || [];
    const currentImage = images[imageIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Chi tiết xe</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Image Gallery */}
                    {images.length > 0 && (
                        <div className="space-y-3">
                            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video">
                                {currentImage && (
                                    <img
                                        src={currentImage.url}
                                        alt={bike.title}
                                        className="w-full h-full object-cover"
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
                                <div className="flex gap-2 overflow-x-auto">
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
                                                alt={`${bike.title} ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{bike.title}</h3>
                            <p className="text-lg font-semibold text-emerald-600 mt-1">
                                {bike.pricePoints?.toLocaleString("vi-VN")} VND
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {bike.bikeType && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Loại xe</div>
                                    <div className="text-sm font-semibold text-gray-900">{bike.bikeType}</div>
                                </div>
                            )}
                            {bike.condition && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Tình trạng</div>
                                    <div className="text-sm font-semibold text-gray-900">{bike.condition}</div>
                                </div>
                            )}
                            {bike.frameSize && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Kích thước khung</div>
                                    <div className="text-sm font-semibold text-gray-900">{bike.frameSize}</div>
                                </div>
                            )}
                            {bike.model && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Model</div>
                                    <div className="text-sm font-semibold text-gray-900">{bike.model}</div>
                                </div>
                            )}
                            {bike.year && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Năm sản xuất</div>
                                    <div className="text-sm font-semibold text-gray-900">{bike.year}</div>
                                </div>
                            )}
                            {bike.status && (
                                <div>
                                    <div className="text-xs text-gray-500 font-medium">Trạng thái</div>
                                    <div className="text-sm font-semibold text-gray-900">{bike.status}</div>
                                </div>
                            )}
                        </div>

                        {bike.description && (
                            <div>
                                <div className="text-xs text-gray-500 font-medium mb-2">Mô tả</div>
                                <p className="text-sm text-gray-700 leading-relaxed">{bike.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
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
