import { Plus, ShieldCheck } from "lucide-react";

type BikeItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
    createdAt?: string;
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
    const sortedBikes = [...bikes].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        }
        return (b.id || 0) - (a.id || 0);
    });

    const totalBikes = bikes.length;
    const activeBikes = bikes.filter((b) => b.status === "ACTIVE" || b.status === "PENDING").length;
    const soldBikes = bikes.filter((b) => b.status === "RESERVED" || b.status === "SOLD").length;
    const hiddenBikes = bikes.filter((b) => b.status === "CANCELLED" || b.status === "HIDDEN" || b.status === "INACTIVE").length;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div>
                    <h2 className="font-bold text-gray-900 text-lg">Bài đăng của tôi</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Quản lý tất cả bài đăng bán xe của bạn</p>
                </div>
                <button
                    onClick={onCreateClick}
                    className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl transition shadow-md"
                >
                    <Plus size={16} />
                    Đăng tin mới
                </button>
            </div>

            {!bikesLoading && !bikesError && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Tổng xe</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalBikes}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-green-200 hover:shadow-sm transition">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Xe đang bán</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{activeBikes}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Xe đã bán</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{soldBikes}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Xe bị ẩn</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">{hiddenBikes}</p>
                    </div>
                </div>
            )}

            {bikesError && (
                <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
                    {bikesError}
                </div>
            )}
            {bikesLoading && <div className="px-6 py-6 text-sm text-gray-500">Đang tải...</div>}

            {!bikesLoading && (
                <div className="divide-y divide-gray-100">
                    {sortedBikes.length === 0 && (
                        <div className="px-6 py-10 text-sm text-gray-500">
                            Bạn chưa có bài đăng nào.
                        </div>
                    )}
                    {sortedBikes.map((bike) => {
                        const isVerified =
                            bike?.status === "VERIFIED" || bike?.inspectionStatus === "APPROVED";
                        const requestedStatus = (bike?.inspectionStatus ?? "").toUpperCase();
                        return (
                            <div key={bike.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="min-w-0 flex items-start gap-3">
                                    {bike?.media && bike.media.length > 0 && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={bike.media[0].url}
                                                alt={bike?.title}
                                                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                            />
                                        </div>
                                    )}
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
                                            {bike?.condition || "—"} • {bike.createdAt ? new Date(bike.createdAt).toLocaleDateString("vi-VN", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            }) : "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="text-sm font-semibold text-emerald-700">
                                        {bike?.pricePoints?.toLocaleString("vi-VN")} VND
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
