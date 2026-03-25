import { Bike, Clock, ShieldCheck, X } from "lucide-react";
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
    bikes,
    bikesLoading,
    bikesError,
    inspectionFilter,
    onFilterChange,
    onRefresh,
    onViewInspection,
    onRequestInspection,
    onViewBikeDetail,
    canRequestInspection,
}: InspectionTabProps) {
    const [inspectionFee, setInspectionFee] = useState<number | null>(null);

    useEffect(() => {
        getInspectionFeeAPI()
            .then(setInspectionFee)
            .catch(() => setInspectionFee(null));
    }, []);
    const filteredBikes = bikes.filter((bike) => {
        const status = (bike?.inspectionStatus ?? "").toUpperCase();
        if (inspectionFilter === "approved") {
            return status === "APPROVED" || bike?.status === "VERIFIED";
        }
        if (inspectionFilter === "pending") {
            return status === "REQUESTED" || status === "ASSIGNED" || status === "IN_PROGRESS" || status === "INSPECTED";
        }
        return true;
    });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Kiểm định xe đạp</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Quản lý trạng thái kiểm định của các xe đạp đã đăng bán
                            {inspectionFee !== null && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                    Phí: {inspectionFee.toLocaleString("vi-VN")} VND
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={bikesLoading}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                        {bikesLoading ? "Đang tải..." : "Làm mới"}
                    </button>
                </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => onFilterChange("all")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                            inspectionFilter === "all"
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => onFilterChange("approved")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                            inspectionFilter === "approved"
                                ? "bg-emerald-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        Đã kiểm định
                    </button>
                    <button
                        onClick={() => onFilterChange("pending")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                            inspectionFilter === "pending"
                                ? "bg-amber-600 text-white"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        Đang kiểm định
                    </button>
                    <div className="ml-auto text-xs text-gray-600 font-medium">
                        Tổng: {bikes.length} xe
                    </div>
                </div>
            </div>

            {bikesLoading && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
                    Đang tải danh sách xe...
                </div>
            )}

            {bikesError && (
                <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
                    {bikesError}
                </div>
            )}

            {!bikesLoading && !bikesError && (
                <>
                    {filteredBikes.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <ShieldCheck size={32} className="text-gray-400" />
                            </div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                                {inspectionFilter === "approved" && "Chưa có xe nào được kiểm định"}
                                {inspectionFilter === "pending" && "Không có xe nào đang kiểm định"}
                                {inspectionFilter === "all" && "Bạn chưa có xe nào"}
                            </div>
                            <div className="text-sm text-gray-500">
                                {inspectionFilter === "approved" && "Các xe đã được kiểm định sẽ hiển thị ở đây"}
                                {inspectionFilter === "pending" && "Các xe đang chờ hoặc đang được kiểm định sẽ hiển thị ở đây"}
                                {inspectionFilter === "all" && "Hãy đăng tin bán xe để bắt đầu"}
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredBikes.map((bike) => {
                                const status = (bike?.inspectionStatus ?? "").toUpperCase();
                                const isApproved = status === "APPROVED" || bike?.status === "VERIFIED";
                                const isPending = status === "REQUESTED" || status === "ASSIGNED" || status === "IN_PROGRESS" || status === "INSPECTED";
                                const isRejected = status === "REJECTED";
                                const isNone = status === "" || status === "NONE";
                                const firstImage = bike?.media?.find((m) => m.type === "IMAGE")?.url;

                                return (
                                    <div key={bike.id} className="px-6 py-4 hover:bg-gray-50 transition">
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {firstImage ? (
                                                    <img
                                                        src={firstImage}
                                                        alt={bike.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Bike size={32} className="text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-semibold text-gray-900 truncate">
                                                            {bike?.title ?? `Xe #${bike.id}`}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-0.5">
                                                            {bike?.condition || "—"} • {bike?.pricePoints?.toLocaleString("vi-VN")} VND
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        {isApproved && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                                                <ShieldCheck size={14} />
                                                                Đã kiểm định
                                                            </span>
                                                        )}
                                                        {isPending && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                                                <Clock size={14} />
                                                                {status === "REQUESTED" && "Chờ xử lý"}
                                                                {status === "ASSIGNED" && "Đã phân công"}
                                                                {status === "IN_PROGRESS" && "Đang kiểm tra"}
                                                                {status === "INSPECTED" && "Đã kiểm tra"}
                                                            </span>
                                                        )}
                                                        {isRejected && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                                                                <X size={14} />
                                                                Từ chối
                                                            </span>
                                                        )}
                                                        {isNone && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                                                Chưa kiểm định
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-3">
                                                    {isApproved && (
                                                        <button
                                                            type="button"
                                                            onClick={() => bike?.id && onViewInspection(bike.id)}
                                                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                                        >
                                                            Xem báo cáo
                                                        </button>
                                                    )}
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => bike?.id && onViewInspection(bike.id)}
                                                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition"
                                                        >
                                                            Xem trạng thái
                                                        </button>
                                                    )}
                                                    {(isNone || isRejected) && canRequestInspection(bike) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onRequestInspection(bike)}
                                                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                                                        >
                                                            Đăng ký kiểm định
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewBikeDetail(bike)}
                                                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                                                    >
                                                        Xem chi tiết xe
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
