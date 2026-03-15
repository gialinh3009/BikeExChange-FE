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
};

interface BikeDetailModalProps {
    bike: BikeBrowseItem | null;
    onClose: () => void;
}

export default function BikeDetailModal({ bike, onClose }: BikeDetailModalProps) {
    const [detailIdx, setDetailIdx] = useState(0);

    if (!bike) return null;

    const detailMedias = (bike?.media ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const detailImages = detailMedias.filter((m) => (m.type ?? "").toUpperCase() === "IMAGE" && m.url);
    const detailCurrent = detailImages[detailIdx]?.url;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">Chi tiết xe</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-50"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {/* Carousel */}
                    {detailImages.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                            <div className="relative">
                                <img
                                    src={detailCurrent}
                                    alt="Ảnh xe"
                                    className="h-64 w-full object-cover"
                                />
                                {detailImages.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDetailIdx((i) =>
                                                    i <= 0 ? detailImages.length - 1 : i - 1
                                                )
                                            }
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
                                            title="Ảnh trước"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDetailIdx((i) =>
                                                    i >= detailImages.length - 1 ? 0 : i + 1
                                                )
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
                                            title="Ảnh tiếp"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                                            {detailIdx + 1}/{detailImages.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            {detailImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto p-3">
                                    {detailImages.map((m, idx) => (
                                        <button
                                            key={`${m.url}-${idx}`}
                                            type="button"
                                            onClick={() => setDetailIdx(idx)}
                                            className={`shrink-0 overflow-hidden rounded-xl border ${
                                                idx === detailIdx ? "border-blue-500" : "border-gray-200"
                                            }`}
                                            title={`Ảnh ${idx + 1}`}
                                        >
                                            <img
                                                src={m.url}
                                                alt={`Thumb ${idx + 1}`}
                                                className="h-14 w-20 object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-lg font-bold text-gray-900">{bike.title}</div>
                    <div className="text-sm text-emerald-700 font-semibold">
                        {bike.pricePoints?.toLocaleString("vi-VN")} VND
                    </div>
                    <div className="text-sm text-gray-600">{bike.condition ?? "—"}</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {(bike as unknown as { description?: string })?.description ?? ""}
                    </div>
                </div>
            </div>
        </div>
    );
}
