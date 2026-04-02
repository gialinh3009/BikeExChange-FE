import { useState } from "react";
import { Plus, ShieldCheck, Edit2, Trash2, Eye, Bike, Tag, Calendar } from "lucide-react";

type BikeItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
    createdAt?: string;
    description?: string;
    bikeType?: string;
    frameSize?: string;
    model?: string;
    year?: string;
    brand?: string;
};

interface PostsTabProps {
    bikes: BikeItem[];
    bikesLoading: boolean;
    bikesError: string | null;
    onCreateClick: () => void;
    onRequestInspection: (bike: BikeItem) => void;
    onViewInspection: (bikeId: number) => void;
    onViewDetails: (bike: BikeItem) => void;
    onEditBike: (bike: BikeItem) => void;
    onDeleteBike: (bike: BikeItem) => void;
    canRequestInspection: (bike: BikeItem) => boolean;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:    { label: "Đang bán",   color: "#16a34a", bg: "#f0fdf4" },
    VERIFIED:  { label: "Đã kiểm định", color: "#0284c7", bg: "#f0f9ff" },
    DRAFT:     { label: "Bản nháp",   color: "#d97706", bg: "#fffbeb" },
    RESERVED:  { label: "Đã đặt cọc", color: "#7c3aed", bg: "#f5f3ff" },
    SOLD:      { label: "Đã bán",     color: "#0f172a", bg: "#f1f5f9" },
    CANCELLED: { label: "Đã hủy",     color: "#ef4444", bg: "#fef2f2" },
};

type FilterKey = "all" | "active" | "sold" | "hidden";

export default function PostsTab({
    bikes, bikesLoading, bikesError, onCreateClick,
    onRequestInspection, onViewInspection, onViewDetails,
    onEditBike, onDeleteBike, canRequestInspection,
}: PostsTabProps) {
    const [filter, setFilter] = useState<FilterKey>("all");

    const sortedBikes = [...bikes].sort((a, b) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.id || 0) - (a.id || 0);
    });

    const totalBikes  = bikes.length;
    const activeBikes = bikes.filter(b => b.status === "ACTIVE" || b.status === "VERIFIED").length;
    const soldBikes   = bikes.filter(b => b.status === "SOLD" || b.status === "RESERVED").length;
    const hiddenBikes = bikes.filter(b => b.status === "CANCELLED" || b.status === "DRAFT").length;

    const filteredBikes = sortedBikes.filter(b => {
        if (filter === "active") return b.status === "ACTIVE" || b.status === "VERIFIED";
        if (filter === "sold")   return b.status === "SOLD"   || b.status === "RESERVED";
        if (filter === "hidden") return b.status === "CANCELLED" || b.status === "DRAFT";
        return true;
    });

    return (
        <div>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Bài đăng của tôi</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả xe đạp bạn đang rao bán</p>
                </div>
                <button onClick={onCreateClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-orange-200 transition-all">
                    <Plus size={16} /> Đăng tin mới
                </button>
            </div>

            {/* ── Stats (clickable filters) ── */}
            {!bikesLoading && !bikesError && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {([
                        { key: "all"    as FilterKey, label: "Tổng xe",    value: totalBikes,  emoji: "🚲", activeColor: "orange" },
                        { key: "active" as FilterKey, label: "Đang bán",   value: activeBikes, emoji: "✅", activeColor: "green"  },
                        { key: "sold"   as FilterKey, label: "Đã bán",     value: soldBikes,   emoji: "🏷️", activeColor: "blue"   },
                        { key: "hidden" as FilterKey, label: "Đã ẩn/Hủy", value: hiddenBikes, emoji: "👁️", activeColor: "slate"  },
                    ] as const).map(s => {
                        const isActive = filter === s.key;
                        return (
                            <button key={s.key} onClick={() => setFilter(s.key)}
                                className={`text-left bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all ${
                                    isActive
                                        ? s.key === "all"    ? "border-orange-400 ring-2 ring-orange-200"
                                        : s.key === "active" ? "border-green-400 ring-2 ring-green-200"
                                        : s.key === "sold"   ? "border-blue-400 ring-2 ring-blue-200"
                                        :                      "border-slate-400 ring-2 ring-slate-200"
                                        : "border-gray-100 hover:border-orange-200"
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
                                    <span className="text-lg">{s.emoji}</span>
                                </div>
                                <p className={`text-3xl font-extrabold ${
                                    isActive
                                        ? s.key === "active" ? "text-green-600"
                                        : s.key === "sold"   ? "text-blue-600"
                                        : s.key === "hidden" ? "text-slate-600"
                                        :                      "text-orange-600"
                                        : "text-gray-900"
                                }`}>{s.value}</p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Error / Loading ── */}
            {bikesError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{bikesError}</div>
            )}
            {bikesLoading && (
                <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                    <span className="text-sm">Đang tải danh sách xe...</span>
                </div>
            )}

            {/* ── List ── */}
            {!bikesLoading && (
                <div className="space-y-3">
                    {filteredBikes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                                <Bike size={36} className="text-orange-300" />
                            </div>
                            <p className="text-gray-700 font-semibold mb-1">
                                {filter === "all"    ? "Chưa có bài đăng nào" :
                                 filter === "active" ? "Không có xe đang bán" :
                                 filter === "sold"   ? "Chưa có xe nào được bán" :
                                                       "Không có xe nào bị ẩn/hủy"}
                            </p>
                            {filter === "all" && (
                                <>
                                    <p className="text-gray-400 text-sm mb-4">Hãy đăng tin bán xe đầu tiên của bạn</p>
                                    <button onClick={onCreateClick}
                                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                                        <Plus size={15} /> Đăng tin ngay
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {filteredBikes.map(bike => {
                        const isVerified = bike?.status === "VERIFIED" || bike?.inspectionStatus === "APPROVED";
                        const reqStatus  = (bike?.inspectionStatus ?? "").toUpperCase();
                        const imgUrl     = bike?.media?.find(m => m.type === "IMAGE")?.url ?? bike?.media?.[0]?.url;
                        const statusCfg  = STATUS_LABEL[bike.status ?? "ACTIVE"] ?? { label: bike.status ?? "ACTIVE", color: "#64748b", bg: "#f8fafc" };

                        return (
                            <div key={bike.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all overflow-hidden">
                                <div className="flex gap-4 p-4">
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={bike.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Bike size={28} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="font-bold text-gray-900 truncate text-base">{bike.title ?? `Xe #${bike.id}`}</p>
                                            <span className="text-base font-extrabold text-orange-600 whitespace-nowrap">
                                                {bike.pricePoints?.toLocaleString("vi-VN")} đ
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {/* Status badge */}
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                                style={{ color: statusCfg.color, background: statusCfg.bg }}>
                                                {statusCfg.label}
                                            </span>
                                            {/* Inspection badge */}
                                            {isVerified && (
                                                <button onClick={() => bike.id && onViewInspection(bike.id)}
                                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                                                    <ShieldCheck size={11} /> Đã kiểm định
                                                </button>
                                            )}
                                            {!isVerified && reqStatus === "REQUESTED" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                                    ⏳ Chờ kiểm định
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            {bike.condition && (
                                                <span className="flex items-center gap-1"><Tag size={11} />{bike.condition}</span>
                                            )}
                                            {bike.createdAt && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {new Date(bike.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action bar */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100 flex-wrap">
                                    {bike.id && canRequestInspection(bike) && (
                                        <button onClick={() => onRequestInspection(bike)}
                                            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition">
                                            <ShieldCheck size={12} /> Đăng ký kiểm định
                                        </button>
                                    )}
                                    {bike.id && (isVerified || reqStatus === "REQUESTED") && (
                                        <button onClick={() => onViewInspection(bike.id)}
                                            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                                            <ShieldCheck size={12} /> Xem kiểm định
                                        </button>
                                    )}
                                    <div className="ml-auto flex items-center gap-2">
                                        <button onClick={() => onViewDetails(bike)}
                                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
                                            <Eye size={12} /> Xem
                                        </button>
                                        {bike.status !== "SOLD" && bike.status !== "RESERVED" && (
                                        <button onClick={() => onEditBike(bike)}
                                            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
                                            <Edit2 size={12} /> Sửa
                                        </button>
<<<<<<< Updated upstream
                                        {bike.status === "ACTIVE" && (
                                            <button onClick={() => onDeleteBike(bike)}
                                                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                                                <Trash2 size={12} /> Xóa
                                            </button>
                                        )}
=======
                                        )}
                                        <button onClick={() => onDeleteBike(bike)}
                                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                                            <Trash2 size={12} /> Xóa
                                        </button>
>>>>>>> Stashed changes
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
