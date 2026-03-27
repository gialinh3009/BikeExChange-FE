import { Bike, Clock, ShieldCheck, X, RefreshCw, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getInspectionFeeAPI } from "../../services/settingsService";

type BikeItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
};

interface InspectionTabProps {
    bikes: BikeItem[];
    bikesLoading: boolean;
    bikesError: string | null;
    inspectionFilter: "all" | "approved" | "pending";
    onFilterChange: (filter: "all" | "approved" | "pending") => void;
    onRefresh: () => void;
    onViewInspection: (bikeId: number) => void;
    onRequestInspection: (bike: BikeItem) => void;
    onViewBikeDetail: (bike: BikeItem) => void;
    canRequestInspection: (bike: BikeItem) => boolean;
}

export default function InspectionTab({
    bikes, bikesLoading, bikesError, inspectionFilter,
    onFilterChange, onRefresh, onViewInspection,
    onRequestInspection, onViewBikeDetail, canRequestInspection,
}: InspectionTabProps) {
    const [inspectionFee, setInspectionFee] = useState<number | null>(null);

    useEffect(() => {
        getInspectionFeeAPI().then(setInspectionFee).catch(() => setInspectionFee(null));
    }, []);

    const filteredBikes = bikes.filter(bike => {
        const status = (bike?.inspectionStatus ?? "").toUpperCase();
        if (inspectionFilter === "approved") return status === "APPROVED" || bike?.status === "VERIFIED";
        if (inspectionFilter === "pending")  return ["REQUESTED","ASSIGNED","IN_PROGRESS","INSPECTED"].includes(status);
        return true;
    });

    const approvedCount = bikes.filter(b => (b.inspectionStatus ?? "").toUpperCase() === "APPROVED" || b.status === "VERIFIED").length;
    const pendingCount  = bikes.filter(b => ["REQUESTED","ASSIGNED","IN_PROGRESS","INSPECTED"].includes((b.inspectionStatus ?? "").toUpperCase())).length;
    const noneCount     = bikes.filter(b => { const s = (b.inspectionStatus ?? "").toUpperCase(); return s === "" || s === "NONE" || s === "REJECTED"; }).length;

    return (
        <div>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Kiểm định xe đạp</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Quản lý trạng thái kiểm định của các xe đang rao bán
                        {inspectionFee !== null && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                💰 Phí: {inspectionFee.toLocaleString("vi-VN")} VND
                            </span>
                        )}
                    </p>
                </div>
                <button onClick={onRefresh} disabled={bikesLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">
                    <RefreshCw size={14} className={bikesLoading ? "animate-spin" : ""} /> Làm mới
                </button>
            </div>

            {/* ── Stats ── */}
            {!bikesLoading && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Đã kiểm định</p>
                        <p className="text-3xl font-extrabold text-emerald-700">{approvedCount}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Đang xử lý</p>
                        <p className="text-3xl font-extrabold text-amber-700">{pendingCount}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Chưa kiểm định</p>
                        <p className="text-3xl font-extrabold text-gray-700">{noneCount}</p>
                    </div>
                </div>
            )}

            {/* ── Filters ── */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {[
                    { key: "all"      as const, label: "Tất cả",         count: bikes.length,   activeClass: "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100" },
                    { key: "approved" as const, label: "Đã kiểm định",   count: approvedCount,  activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100" },
                    { key: "pending"  as const, label: "Đang kiểm định", count: pendingCount,   activeClass: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100" },
                ].map(f => (
                    <button key={f.key} onClick={() => onFilterChange(f.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            inspectionFilter === f.key ? f.activeClass : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600"
                        }`}>
                        {f.label}
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                            inspectionFilter === f.key ? "bg-white/30" : "bg-gray-100 text-gray-600"
                        }`}>{f.count}</span>
                    </button>
                ))}
            </div>

            {/* ── Error / Loading ── */}
            {bikesError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} /> {bikesError}
                </div>
            )}
            {bikesLoading && (
                <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                    <span className="text-sm">Đang tải danh sách xe...</span>
                </div>
            )}

            {/* ── Empty ── */}
            {!bikesLoading && !bikesError && filteredBikes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <ShieldCheck size={36} className="text-gray-300" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">
                        {inspectionFilter === "approved" ? "Chưa có xe nào được kiểm định" :
                         inspectionFilter === "pending"  ? "Không có xe nào đang kiểm định" : "Bạn chưa có xe nào"}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {inspectionFilter === "approved" ? "Các xe đã kiểm định sẽ hiển thị ở đây" :
                         inspectionFilter === "pending"  ? "Các xe đang chờ kiểm định sẽ hiển thị ở đây" : "Hãy đăng tin bán xe để bắt đầu"}
                    </p>
                </div>
            )}

            {/* ── List ── */}
            {!bikesLoading && !bikesError && filteredBikes.length > 0 && (
                <div className="space-y-3">
                    {filteredBikes.map(bike => {
                        const status     = (bike?.inspectionStatus ?? "").toUpperCase();
                        const isApproved = status === "APPROVED" || bike?.status === "VERIFIED";
                        const isPending  = ["REQUESTED","ASSIGNED","IN_PROGRESS","INSPECTED"].includes(status);
                        const isRejected = status === "REJECTED";
                        const isNone     = status === "" || status === "NONE";
                        const imgUrl     = bike?.media?.find(m => m.type === "IMAGE")?.url;

                        return (
                            <div key={bike.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all overflow-hidden">
                                <div className="flex gap-4 p-4">
                                    {/* Image */}
                                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={bike.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Bike size={32} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className="font-bold text-gray-900 truncate">{bike.title ?? `Xe #${bike.id}`}</p>
                                            {/* Status badge */}
                                            {isApproved && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 whitespace-nowrap">
                                                    <ShieldCheck size={12} /> Đã kiểm định
                                                </span>
                                            )}
                                            {isPending && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 whitespace-nowrap">
                                                    <Clock size={12} />
                                                    {status === "REQUESTED" ? "Chờ xử lý" : status === "ASSIGNED" ? "Đã phân công" : status === "IN_PROGRESS" ? "Đang kiểm tra" : "Đã kiểm tra"}
                                                </span>
                                            )}
                                            {isRejected && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-bold text-red-700 whitespace-nowrap">
                                                    <X size={12} /> Từ chối
                                                </span>
                                            )}
                                            {isNone && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 whitespace-nowrap">
                                                    Chưa kiểm định
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {bike.condition || "—"} · {bike.pricePoints?.toLocaleString("vi-VN")} đ
                                        </p>
                                    </div>
                                </div>

                                {/* Action bar */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100 flex-wrap">
                                    {isApproved && (
                                        <button onClick={() => bike.id && onViewInspection(bike.id)}
                                            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                                            <ShieldCheck size={12} /> Xem báo cáo
                                        </button>
                                    )}
                                    {isPending && (
                                        <button onClick={() => bike.id && onViewInspection(bike.id)}
                                            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
                                            <Clock size={12} /> Xem trạng thái
                                        </button>
                                    )}
                                    {(isNone || isRejected) && canRequestInspection(bike) && (
                                        <button onClick={() => onRequestInspection(bike)}
                                            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition">
                                            <ShieldCheck size={12} /> Đăng ký kiểm định
                                        </button>
                                    )}
                                    <button onClick={() => onViewBikeDetail(bike)}
                                        className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
                                        Xem chi tiết xe
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
