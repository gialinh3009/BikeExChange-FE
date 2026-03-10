import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Heart, MapPin, Calendar, Gauge, Tag,
    CheckCircle, Clock, AlertCircle, ShieldCheck, ShoppingCart,
    ChevronLeft, ChevronRight, Bike, Eye, Loader2, X, Coins, Star
} from "lucide-react";
import { getBikeDetailAPI } from "../../services/Buyer/Bikeservice";
import { createOrderAPI } from "../../services/Buyer/Orderservice";
import { addToWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Media { url: string; type: string; sortOrder: number; }
interface BikeDetail {
    id: number; title: string; description: string; brand: string;
    model: string; year: number; pricePoints: number; mileage: number;
    condition: string; bikeType: string; location: string; status: string;
    inspectionStatus: string; sellerId: number; views: number;
    createdAt: string; updatedAt: string; media: Media[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FALLBACK_IMG = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80";

const inspectionBadge = (s: string) => {
    if (s === "APPROVED")
        return { label: "Đã kiểm định", icon: ShieldCheck, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (s === "REQUESTED" || s === "PENDING")
        return { label: "Đang kiểm định", icon: Clock, cls: "bg-amber-100 text-amber-700 border-amber-200" };
    return { label: "Chưa kiểm định", icon: AlertCircle, cls: "bg-gray-100 text-gray-600 border-gray-200" };
};

const conditionColor: Record<string, string> = {
    "New":       "bg-green-100 text-green-700",
    "Like New":  "bg-emerald-100 text-emerald-700",
    "Good":      "bg-blue-100 text-blue-700",
    "Fair":      "bg-amber-100 text-amber-700",
    "Poor":      "bg-red-100 text-red-700",
};

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ bike, onConfirm, onCancel, loading }: {
    bike: BikeDetail; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <ShoppingCart size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Xác nhận đặt mua</h3>
                        <p className="text-sm text-gray-500">Vui lòng kiểm tra lại thông tin</p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 flex gap-3">
                    <img
                        src={bike.media?.[0]?.url || FALLBACK_IMG}
                        alt={bike.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{bike.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{bike.brand} · {bike.year} · {bike.condition}</p>
                        <div className="flex items-center gap-1 mt-2">
                            <Coins size={14} className="text-amber-500" />
                            <span className="font-bold text-amber-600">{bike.pricePoints.toLocaleString()} điểm</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 mb-5 text-xs text-blue-700 flex items-start gap-2">
                    <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                    <span>Điểm sẽ được trừ từ ví khi người bán xác nhận đơn hàng. Bạn có thể huỷ trước khi được xác nhận.</span>
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={loading}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
                        Huỷ
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60">
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
                        {loading ? "Đang đặt..." : "Xác nhận mua"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt mua thành công!</h3>
                <p className="text-sm text-gray-500 mb-6">Đơn hàng đã được tạo. Vui lòng chờ người bán xác nhận.</p>
                <button onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition">
                    Xem đơn hàng
                </button>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BikedetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bike,         setBike]         = useState<BikeDetail | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");
    const [imgIdx,       setImgIdx]       = useState(0);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [showSuccess,  setShowSuccess]  = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError,   setOrderError]   = useState("");
    const [wished,       setWished]       = useState(false);
    const [wishLoading,  setWishLoading]  = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getBikeDetailAPI(id)
            .then(setBike)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    const imgs = (() => {
        const list = bike?.media?.filter((m) => m.type === "IMAGE") ?? [];
        return list.length > 0 ? list.map((m) => m.url) : [FALLBACK_IMG];
    })();

    const handleOrder = async () => {
        if (!bike) return;
        setOrderLoading(true);
        setOrderError("");
        try {
            await createOrderAPI(bike.id);
            setShowConfirm(false);
            setShowSuccess(true);
        } catch (e: unknown) {
            setOrderError(e instanceof Error ? e.message : "Đặt mua thất bại");
            setShowConfirm(false);
        } finally {
            setOrderLoading(false);
        }
    };

    const handleWish = async () => {
        if (!bike || wishLoading) return;
        setWishLoading(true);
        try {
            if (wished) {
                await removeFromWishlistAPI(bike.id);
                setWished(false);
            } else {
                await addToWishlistAPI(bike.id);
                setWished(true);
            }
        } catch {
            // silent fail
        } finally {
            setWishLoading(false);
        }
    };

    // ── Loading ──
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 size={36} className="animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Đang tải thông tin xe...</p>
            </div>
        </div>
    );

    // ── Error ──
    if (error || !bike) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <Bike size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">{error || "Không tìm thấy xe"}</p>
                <button onClick={() => navigate(-1)}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
                    Quay lại
                </button>
            </div>
        </div>
    );

    const badge = inspectionBadge(bike.inspectionStatus);
    const BadgeIcon = badge.icon;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modals */}
            {showConfirm && (
                <ConfirmModal bike={bike} onConfirm={handleOrder}
                              onCancel={() => setShowConfirm(false)} loading={orderLoading} />
            )}
            {showSuccess && (
                <SuccessModal onClose={() => { setShowSuccess(false); navigate("/buyer", { state: { tab: "orders" } }); }} />
            )}

            {/* Top nav */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                        <ArrowLeft size={18} /> Quay lại
                    </button>
                    <button onClick={handleWish} disabled={wishLoading}
                            className={`p-2 rounded-xl border transition ${wished ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                        {wishLoading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={wished ? "currentColor" : "none"} />}
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── Left col ── */}
                <div className="lg:col-span-3 space-y-5">

                    {/* Gallery */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="relative aspect-[4/3] bg-gray-100">
                            <img src={imgs[imgIdx]}
                                 onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                                 className="w-full h-full object-cover" alt={bike.title} />

                            {imgs.length > 1 && (
                                <>
                                    <button onClick={() => setImgIdx((i) => (i - 1 + imgs.length) % imgs.length)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button onClick={() => setImgIdx((i) => (i + 1) % imgs.length)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition">
                                        <ChevronRight size={18} />
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {imgs.map((_, i) => (
                                            <button key={i} onClick={() => setImgIdx(i)}
                                                    className={`w-2 h-2 rounded-full transition ${i === imgIdx ? "bg-white scale-125" : "bg-white/50"}`} />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Badges overlay */}
                            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium ${badge.cls}`}>
                                <BadgeIcon size={12} />{badge.label}
                            </div>
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                                <Eye size={11} /> {bike.views}
                            </div>
                        </div>

                        {imgs.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {imgs.map((src, i) => (
                                    <button key={i} onClick={() => setImgIdx(i)}
                                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === imgIdx ? "border-blue-500" : "border-transparent"}`}>
                                        <img src={src} onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                                             className="w-full h-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-3">Mô tả</h2>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            {bike.description || "Người bán chưa cung cấp mô tả."}
                        </p>
                    </div>

                    {/* Specs */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-4">Thông số kỹ thuật</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: Tag,      label: "Hãng",         value: bike.brand },
                                { icon: Bike,     label: "Model",        value: bike.model },
                                { icon: Calendar, label: "Năm sản xuất", value: String(bike.year) },
                                { icon: Gauge,    label: "Số km đã đi",  value: `${bike.mileage.toLocaleString()} km` },
                                { icon: Tag,      label: "Loại xe",      value: bike.bikeType },
                                { icon: Star,     label: "Tình trạng",   value: bike.condition },
                                { icon: MapPin,   label: "Vị trí",       value: bike.location },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                                    <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">{label}</p>
                                        <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right col ── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h1 className="text-xl font-bold text-gray-900 leading-snug mb-3">{bike.title}</h1>

                        <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conditionColor[bike.condition] ?? "bg-gray-100 text-gray-600"}`}>
                {bike.condition}
              </span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{bike.bikeType}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">{bike.brand}</span>
                        </div>

                        {/* Price */}
                        <div className="bg-amber-50 rounded-xl p-4 mb-4">
                            <p className="text-xs text-amber-600 mb-1">Giá bán</p>
                            <div className="flex items-baseline gap-2">
                                <Coins size={20} className="text-amber-500 shrink-0" />
                                <span className="text-3xl font-extrabold text-amber-600">{bike.pricePoints.toLocaleString()}</span>
                                <span className="text-sm text-amber-500 font-medium">điểm</span>
                            </div>
                        </div>

                        {orderError && (
                            <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />{orderError}
                            </div>
                        )}

                        <button onClick={() => setShowConfirm(true)}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition">
                            <ShoppingCart size={16} /> Đặt mua ngay
                        </button>

                        <button onClick={handleWish} disabled={wishLoading}
                                className={`w-full mt-2.5 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition ${wished ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                            {wishLoading ? <Loader2 size={15} className="animate-spin" /> : <Heart size={15} fill={wished ? "currentColor" : "none"} />}
                            {wished ? "Đã lưu yêu thích" : "Lưu yêu thích"}
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            {[
                                { label: "Mã xe",    value: `#${bike.id}` },
                                { label: "Đăng lúc", value: new Date(bike.createdAt).toLocaleDateString("vi-VN") },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">{label}</span>
                                    <span className="text-gray-600 font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inspection */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" /> Trạng thái kiểm định
                        </h3>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${badge.cls}`}>
                            <BadgeIcon size={18} />
                            <div>
                                <p className="text-sm font-semibold">{badge.label}</p>
                                <p className="text-xs opacity-70">
                                    {bike.inspectionStatus === "APPROVED" ? "Xe đã được kiểm định và đạt tiêu chuẩn."
                                        : bike.inspectionStatus === "REQUESTED" ? "Yêu cầu kiểm định đang được xử lý."
                                            : "Xe chưa được kiểm định."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}