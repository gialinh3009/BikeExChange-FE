import { Plus, ShieldCheck } from "lucide-react";

type BikeItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
};

interface PostsTabProps {
    bikes: BikeItem[];
    bikesLoading: boolean;
    bikesError: string | null;
    onCreateClick: () => void;
    onRequestInspection: (bike: BikeItem) => void;
    onViewInspection: (bikeId: number) => void;
    canRequestInspection: (bike: BikeItem) => boolean;
}

export default function PostsTab({
    bikes,
    bikesLoading,
    bikesError,
    onCreateClick,
    onRequestInspection,
    onViewInspection,
    canRequestInspection,
}: PostsTabProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Bài đăng của tôi</h2>
                <button
                    onClick={onCreateClick}
                    className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition"
                >
                    <Plus size={15} />
                    Đăng tin
                </button>
            </div>

            {bikesError && (
                <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
                    {bikesError}
                </div>
            )}
            {bikesLoading && <div className="px-6 py-6 text-sm text-gray-500">Đang tải...</div>}

            {!bikesLoading && (
                <div className="divide-y divide-gray-100">
                    {bikes.length === 0 && (
                        <div className="px-6 py-10 text-sm text-gray-500">
                            Bạn chưa có bài đăng nào.
                        </div>
                    )}
                    {bikes.map((bike) => {
                        const isVerified =
                            bike?.status === "VERIFIED" || bike?.inspectionStatus === "APPROVED";
                        const requestedStatus = (bike?.inspectionStatus ?? "").toUpperCase();
                        return (
                            <div key={bike.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="font-semibold text-gray-900 truncate max-w-xs">
                                            {bike?.title ?? `Xe #${bike.id}`}
                                        </div>
                                        {isVerified && (
                                            <button
                                                type="button"
                                                onClick={() => bike?.id && onViewInspection(bike.id)}
                                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                title="Xem báo cáo kiểm định"
                                            >
                                                <ShieldCheck size={14} />
                                                Đã kiểm định
                                            </button>
                                        )}
                                        {!isVerified && requestedStatus === "REQUESTED" && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                Đang chờ kiểm định
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                        {bike?.condition || "—"}
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="text-sm font-semibold text-emerald-700">
                                        {bike?.pricePoints?.toLocaleString("vi-VN")} điểm
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {bike?.status ?? "ACTIVE"}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        {bike?.id && canRequestInspection(bike) && (
                                            <button
                                                type="button"
                                                onClick={() => onRequestInspection(bike)}
                                                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                            >
                                                Đăng ký kiểm định
                                            </button>
                                        )}
                                        {bike?.id && (isVerified || requestedStatus === "REQUESTED") && (
                                            <button
                                                type="button"
                                                onClick={() => onViewInspection(bike.id)}
                                                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                Xem kiểm định
                                            </button>
                                        )}
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
