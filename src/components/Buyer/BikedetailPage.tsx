import { useState, useEffect } from "react";
import {
    ChevronLeft, Heart, MapPin, Calendar,
    Star, MessageSquare, CheckCircle, Image as ImageIcon,
    ShieldCheck, Zap,  User,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getBikeDetailAPI } from "../../services/Buyer/Bikeservice";
import { getUserProfileAPI } from "../../services/Buyer/Userservice";
import { createOrderAPI } from "../../services/Buyer/Orderservice";
import { getWalletAPI } from "../../services/Buyer/walletService";
import { getWishlistAPI } from "../../services/Buyer/wishlistService";
import { addToWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";
import { WishlistAuthModal } from "./WishlistModals.jsx";
import Header from "../home/Header";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface MediaItem { url: string; type: string; sortOrder: number; }

interface BikeDetail {
    id: number;
    title: string;
    description: string;
    brand?: string;
    model?: string;
    year?: number;
    pricePoints: number;
    mileage?: number;
    condition?: string;
    bikeType?: string;
    frameSize?: string;
    status: string;
    inspectionStatus?: string;
    location?: string;
    views?: number;
    sellerId?: number;
    createdAt?: string;
    updatedAt?: string;
    media?: MediaItem[];
}

interface SellerProfile {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    rating: number;
    totalBikesSold: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN").format(p) + " VND";

const timeAgo = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Hôm nay";
    if (d === 1) return "1 ngày trước";
    if (d < 30) return `${d} ngày trước`;
    const m = Math.floor(d / 30);
    return `${m} tháng trước`;
};

const conditionLabel: Record<string, string> = {
    LIKE_NEW: "Like New", GOOD: "Good", FAIR: "Fair",
    POOR: "Poor", NEW: "New",
};

const conditionColor: Record<string, string> = {
    LIKE_NEW: "#10b981", GOOD: "#3b82f6", FAIR: "#f59e0b",
    POOR: "#ef4444", NEW: "#8b5cf6",
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function BikedetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bike, setBike]       = useState<BikeDetail | null>(null);
    const [seller, setSeller]   = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [wished, setWished]   = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const [ordering, setOrdering]   = useState(false);
    const [imgError, setImgError]   = useState<Record<number, boolean>>({});
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);

    const user  = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const token = localStorage.getItem("token") ?? "";
    const isPurchasable = bike?.status === "ACTIVE" || bike?.status === "VERIFIED";

    /* Fetch bike */
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        if (!id) return;
        (async () => {
            try {
                const data = await getBikeDetailAPI(id);
                setBike(data);
            } catch (e) {
                setError(String(e instanceof Error ? e.message : e));
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    /* Fetch seller
     * GET /users/{id}      → User entity (fullName, email, phone, role...)
     * GET /users/{id}/stats → { totalBikesSold, rating, isVerified }
     */
    useEffect(() => {
        if (!bike?.sellerId) return;
        (async () => {
            try {
                const userData = await getUserProfileAPI(bike.sellerId);
                // For stats, since no service, skip for now
                setSeller({
                    id:             userData.id,
                    fullName:       userData.fullName  ?? "Người bán",
                    email:          userData.email     ?? "",
                    phone:          userData.phone,
                    rating:         userData.rating         ?? 0,
                    totalBikesSold: userData.totalBikesSold ?? 0,
                });
            } catch { /* silent */ }
        })();
    }, [bike?.sellerId]);

    /* Buy now */
    const handleBuyNow = async () => {
        if (!user?.id) { navigate("/login"); return; }
        if (user.id === bike?.sellerId) { alert("Bạn không thể mua xe của chính mình"); return; }
        if (!isPurchasable) { alert("Xe này hiện không còn sẵn để mua."); return; }
        setOrdering(true);
        try {
            await createOrderAPI({ bikeId: bike?.id, idempotencyKey: `${user.id}-${bike?.id}-${Date.now()}` });
            setShowConfirm(false);
            setTimeout(() => {
                setOrdering(false);
                setShowSuccess(true);
            }, 300);
        } catch (e) {
            const msg = String(e instanceof Error ? e.message : e).toLowerCase();
            setShowConfirm(false);
            if (msg.includes("not enough") || msg.includes("insufficient") || msg.includes("points") || msg.includes("balance") || msg.includes("tiền") || msg.includes("ví")) {
                setShowInsufficientFunds(true);
            } else {
                alert(String(e instanceof Error ? e.message : e));
            }
        } finally {
            setOrdering(false);
        }
    };

    /* Wishlist
     * BE: POST /buyer/wishlist/{bikeId} (bikeId in PATH, no body)
     *     DELETE /buyer/wishlist/{bikeId}
     */
    const handleWishlist = async () => {
        if (!token) { navigate("/login"); return; }
        try {
            if (wished) {
                await removeFromWishlistAPI(bike?.id);
            } else {
                await addToWishlistAPI(bike?.id);
            }
            setWished(!wished);
            // Dispatch event to update wishlist count in other components
            window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { bikeId: bike?.id, wished: !wished } }));
        } catch { /* silent */ }
    };

    // Đồng bộ wishlist
    useEffect(() => {
        if (!token) return;
        getWishlistAPI().then(list => {
            const ids = list.map(item => item.bike?.id ?? item.bikeId ?? item.id);
            setWished(ids.includes(Number(id)));
        });
    }, [id, token]);

    if (!token) {
        return (
            <div style={{ minHeight: "100vh", background: "#f4f6fb" }}>
                <WishlistAuthModal
                    title="BikeExchange"
                    message="Vui lòng đăng nhập hoặc đăng ký để tiếp tục xem chi tiết xe."
                    onClose={() => navigate("/")}
                    onLogin={() => navigate("/login")}
                    onRegister={() => navigate("/register")}
                />
            </div>
        );
    }

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e8ecf4", borderTopColor: "#2563eb", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
            </div>
        </div>
    );

    /* ── Error ── */
    if (error || !bike) return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 380, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>
                <p style={{ color: "#ef4444", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Không tìm thấy xe</p>
                <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>{error}</p>
                <button onClick={() => navigate(-1)} style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Quay lại</button>
            </div>
        </div>
    );

    const images     = (bike.media ?? []).filter(m => m.type === "IMAGE").sort((a, b) => a.sortOrder - b.sortOrder);
    const currentImg = images[activeImg]?.url ?? "";
    const isVerified = bike.status === "VERIFIED" || bike.inspectionStatus === "APPROVED";
    const condLabel  = bike.condition ? (conditionLabel[bike.condition] ?? bike.condition) : null;
    const condColor  = bike.condition ? (conditionColor[bike.condition] ?? "#64748b") : "#64748b";

    const specs = [
        { label: "Hãng",       value: bike.brand },
        { label: "Model",      value: bike.model },
        { label: "Năm SX",     value: bike.year?.toString() },
        { label: "Loại xe",    value: bike.bikeType },
        { label: "Cỡ khung",   value: bike.frameSize },
        { label: "Tình trạng", value: condLabel, color: condColor },
        { label: "Số km",      value: bike.mileage !== undefined ? `${bike.mileage.toLocaleString()} km` : undefined },
        { label: "Địa điểm",   value: bike.location && bike.location !== "Not specified" ? bike.location : undefined },
    ].filter(s => s.value);

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
            {/* ── Header navigation ── */}
            <Header />

            {/* Modal xác nhận mua hàng — chi tiết */}
            {showConfirm && bike && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 680, boxShadow: "0 12px 60px rgba(0,0,0,.25)", overflow: "hidden", maxHeight: "94vh", display: "flex", flexDirection: "column" }}>
                        {/* Header */}
                        <div style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)", padding: "26px 36px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                            <Zap size={22} fill="white" color="white" />
                            <h3 style={{ fontWeight: 800, fontSize: 20, color: "white", margin: 0 }}>Xác nhận mua hàng</h3>
                        </div>

                        <div style={{ padding: "28px 36px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
                            {/* Thông tin xe */}
                            <div style={{ display: "flex", gap: 18, alignItems: "flex-start", background: "#f8faff", borderRadius: 16, padding: "20px", border: "1px solid #e2e8f0" }}>
                                {(() => {
                                    const imgs = (bike.media ?? []).filter(m => m.type === "IMAGE").sort((a, b) => a.sortOrder - b.sortOrder);
                                    return imgs[0]?.url ? (
                                        <img src={imgs[0].url} alt={bike.title} style={{ width: 116, height: 90, objectFit: "cover", borderRadius: 12, flexShrink: 0, border: "1px solid #e2e8f0" }} />
                                    ) : (
                                        <div style={{ width: 116, height: 90, borderRadius: 12, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <ImageIcon size={30} color="#94a3b8" />
                                        </div>
                                    );
                                })()}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 8, lineHeight: 1.3 }}>{bike.title}</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginBottom: 8 }}>
                                        {bike.brand && <span style={{ fontSize: 14, color: "#64748b" }}>{bike.brand}</span>}
                                        {bike.model && <span style={{ fontSize: 14, color: "#64748b" }}>· {bike.model}</span>}
                                        {bike.year  && <span style={{ fontSize: 14, color: "#64748b" }}>· {bike.year}</span>}
                                        {bike.condition && (
                                            <span style={{ fontSize: 14, fontWeight: 700, color: conditionColor[bike.condition] ?? "#64748b" }}>
                                                {conditionLabel[bike.condition] ?? bike.condition}
                                            </span>
                                        )}
                                    </div>
                                    {bike.location && bike.location !== "Not specified" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <MapPin size={13} color="#94a3b8" />
                                            <span style={{ fontSize: 13, color: "#94a3b8" }}>{bike.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hồ sơ người bán */}
                            {seller && (
                                <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f0fdf4", borderRadius: 16, padding: "16px 20px", border: "1px solid #bbf7d0" }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#22c55e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "white", flexShrink: 0 }}>
                                        {seller.fullName?.[0]?.toUpperCase() ?? <User size={18} color="white" />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 15, color: "#15803d", marginBottom: 3 }}>Người bán: {seller.fullName}</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <Star size={13} color="#f59e0b" fill="#f59e0b" />
                                            <span style={{ fontSize: 13, color: "#64748b" }}>{seller.rating} · {seller.totalBikesSold} xe đã bán</span>
                                        </div>
                                    </div>
                                    <button
                                        style={{ padding: "8px 18px", background: "white", color: "#16a34a", border: "1.5px solid #16a34a", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                                        onClick={() => { setShowConfirm(false); navigate(`/sellers/${seller.id}`); }}
                                    >
                                        Xem hồ sơ
                                    </button>
                                </div>
                            )}

                            {/* Bảng thanh toán */}
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 15, color: "#64748b" }}>Giá xe</span>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{fmtPrice(bike.pricePoints)}</span>
                                </div>
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#fffbeb" }}>
                                    <div style={{ flex: 1, paddingRight: 16 }}>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "#92400e" }}>Thanh toán trả trước</span>
                                        <p style={{ fontSize: 13, color: "#a16207", margin: "5px 0 0", lineHeight: 1.6 }}>
                                            Số tiền này sẽ được <strong>tạm giữ</strong> cho đến khi bạn xác nhận đã nhận xe thành công
                                        </p>
                                    </div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: "#d97706", flexShrink: 0 }}>{fmtPrice(bike.pricePoints)}</span>
                                </div>
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 15, color: "#64748b" }}>Số dư hiện tại</span>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: walletBalance !== null && walletBalance >= bike.pricePoints ? "#10b981" : "#ef4444" }}>
                                        {walletBalance !== null ? fmtPrice(walletBalance) : "—"}
                                    </span>
                                </div>
                                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8faff" }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>Số dư sau giao dịch</span>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: "#2563eb" }}>
                                        {walletBalance !== null ? fmtPrice(Math.max(0, walletBalance - bike.pricePoints)) : "—"}
                                    </span>
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div style={{ display: "flex", gap: 14, paddingTop: 4 }}>
                                <button
                                    style={{ flex: 1, padding: "15px 0", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 16, cursor: "pointer" }}
                                    onClick={() => setShowConfirm(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    style={{ flex: 2, padding: "15px 0", background: ordering ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: ordering ? "not-allowed" : "pointer", boxShadow: "0 2px 14px rgba(37,99,235,.32)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                                    disabled={ordering}
                                    onClick={handleBuyNow}
                                >
                                    <Zap size={16} fill="white" color="white" />
                                    {ordering ? "Đang xử lý..." : "Xác nhận mua hàng"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal thành công */}
            {showSuccess && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.18)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: 16, padding: 32, minWidth: 340, boxShadow: "0 4px 24px rgba(0,0,0,.12)", textAlign: "center" }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Đã mua hàng thành công</h3>
                        <p style={{ color: "#475569", fontSize: 15, marginBottom: 24 }}>Cảm ơn bạn đã mua xe!</p>
                        <button style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
                            onClick={() => { setShowSuccess(false); navigate("/buyer"); }}>
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}
            {/* Modal không đủ tiền trong ví */}
            {showInsufficientFunds && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "36px 32px", minWidth: 360, maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,.18)", textAlign: "center" }}>
                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fff7ed", border: "2px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 28 }}>
                            💰
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: 20, color: "#0f172a", marginBottom: 10 }}>Số dư ví không đủ</h3>
                        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.65, marginBottom: 28 }}>
                            Bạn không có đủ tiền trong ví để thực hiện giao dịch này.<br />
                            Vui lòng nạp thêm tiền vào ví và thử lại.
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button
                                style={{ padding: "11px 22px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                                onClick={() => setShowInsufficientFunds(false)}
                            >
                                Quay lại
                            </button>
                            <button
                                style={{ padding: "11px 22px", background: "#2563eb", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 10px rgba(37,99,235,.3)" }}
                                onClick={() => { setShowInsufficientFunds(false); navigate("/buyer", { state: { tab: "wallet", walletTab: "deposit" } }); }}
                            >
                                Chuyển đến ví
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
                * { box-sizing: border-box; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                .bdp-wrap { animation: fadeUp .35s ease; }
                .thumb-btn:hover { border-color: #2563eb !important; }
                .btn-primary:hover:not(:disabled) { background: #1d4ed8 !important; }
                .btn-outline:hover { background: #eff6ff !important; }
                .seller-card:hover { box-shadow: 0 6px 24px rgba(37,99,235,.1) !important; }
                .spec-row:hover { background: #f8faff !important; }
                .icon-btn:hover { background: #f0f7ff !important; border-color: #bfdbfe !important; }
            `}</style>

            {/* ── Sticky back bar (sticks below Header) ── */}
            <div style={{
                background: "white",
                borderBottom: "1px solid #e8ecf4",
                padding: "0 32px",
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 64,
                zIndex: 40,
                boxShadow: "0 1px 8px rgba(0,0,0,.04)",
            }}>
                <button
                    className="icon-btn"
                    onClick={() => navigate(-1)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#2563eb", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "6px 10px", borderRadius: 8, transition: "background .15s, border-color .15s" }}
                >
                    <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại
                </button>
                {/* Xóa các nút tim và share ở góc phải, chỉ giữ lại nút quay lại */}
            </div>

            {/* ── Page body ── */}
            <div className="bdp-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

                    {/* ════ LEFT: Gallery ════ */}
                    <div>
                        <div style={{ position: "relative", background: "white", borderRadius: 20, overflow: "hidden", aspectRatio: "4/3", border: "1.5px solid #e8ecf4", boxShadow: "0 2px 16px rgba(0,0,0,.06)" }}>
                            {/* Verified badge */}
                            {isVerified && (
                                <div style={{ position: "absolute", top: 14, left: 14, zIndex: 10, display: "flex", alignItems: "center", gap: 5, background: "#10b981", color: "white", borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 700, letterSpacing: ".2px" }}>
                                    <CheckCircle size={12} strokeWidth={3} /> Xe đã được kiểm định
                                </div>
                            )}
                            {currentImg && !imgError[activeImg] ? (
                                <img
                                    src={currentImg}
                                    alt={bike.title}
                                    onError={() => setImgError(p => ({ ...p, [activeImg]: true }))}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8faff" }}>
                                    <ImageIcon size={44} color="#dde3ee" strokeWidth={1.2} />
                                    <span style={{ marginTop: 10, fontSize: 13, color: "#94a3b8" }}>Chưa có ảnh</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        className="thumb-btn"
                                        onClick={() => setActiveImg(idx)}
                                        style={{ flexShrink: 0, width: 74, height: 58, borderRadius: 10, overflow: "hidden", cursor: "pointer", border: idx === activeImg ? "2.5px solid #2563eb" : "2px solid #e8ecf4", padding: 0, background: "white", transition: "border-color .15s" }}
                                    >
                                        <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ════ RIGHT: Detail ════ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* Tags */}
                        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                            {bike.bikeType && <span style={{ background: "#eff6ff", color: "#2563eb", borderRadius: 6, padding: "4px 11px", fontSize: 12, fontWeight: 600 }}>{bike.bikeType}</span>}
                            {condLabel     && <span style={{ background: `${condColor}15`, color: condColor, borderRadius: 6, padding: "4px 11px", fontSize: 12, fontWeight: 600 }}>{condLabel}</span>}
                            {bike.brand    && <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "4px 11px", fontSize: 12, fontWeight: 600 }}>{bike.brand}</span>}
                        </div>

                        {/* Title + price */}
                        <div>
                            <h1 style={{ fontSize: 25, fontWeight: 800, color: "#0f172a", lineHeight: 1.25, marginBottom: 10 }}>{bike.title}</h1>
                            <p style={{ fontSize: 27, fontWeight: 800, color: "#2563eb", marginBottom: 10 }}>{fmtPrice(bike.pricePoints)}</p>
                            {!isPurchasable && (
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>
                                    Xe này hiện không còn ở trạng thái mở bán.
                                </p>
                            )}
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {bike.location && bike.location !== "Not specified" && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 13 }}>
                                        <MapPin size={13} color="#2563eb" /> {bike.location}
                                    </span>
                                )}
                                {bike.createdAt && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 13 }}>
                                        <Calendar size={13} color="#94a3b8" /> {timeAgo(bike.createdAt)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {bike.description && (
                            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.75, paddingBottom: 18, borderBottom: "1px solid #f1f5f9" }}>{bike.description}</p>
                        )}

                        {/* Buy CTA */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                className="btn-primary"
                                onClick={async () => {
                                    if (!user?.id) { navigate("/login"); return; }
                                    setWalletLoading(true);
                                    try {
                                        const w = await getWalletAPI();
                                        setWalletBalance(w.availablePoints ?? w.balance ?? 0);
                                    } catch { setWalletBalance(null); }
                                    finally { setWalletLoading(false); }
                                    setShowConfirm(true);
                                }}
                                disabled={ordering || !isPurchasable || walletLoading}
                                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", background: ordering || !isPurchasable || walletLoading ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: ordering || !isPurchasable || walletLoading ? "not-allowed" : "pointer", transition: "background .15s", boxShadow: "0 2px 12px rgba(37,99,235,.25)" }}
                            >
                                <Zap size={15} fill="white" color="white" />
                                {ordering ? "Đang xử lý..." : walletLoading ? "Đang tải..." : !isPurchasable ? "Không khả dụng" : "Mua ngay"}
                            </button>
                            <button className="icon-btn" onClick={handleWishlist} style={{ width: 48, flexShrink: 0, borderRadius: 10, border: `1.5px solid ${wished ? "#fecdd3" : "#e8ecf4"}`, background: wished ? "#fff0f3" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                                <Heart size={18} color={wished ? "#e11d48" : "#94a3b8"} fill={wished ? "#e11d48" : "none"} />
                            </button>
                        </div>

                        {/* Seller card */}
                        {seller && (
                            <div className="seller-card" style={{ background: "white", border: "1.5px solid #e8ecf4", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow .2s" }}>
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "white", flexShrink: 0 }}>
                                    {seller.fullName?.[0]?.toUpperCase() ?? <User size={18} color="white" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 2 }}>{seller.fullName}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                                        <span style={{ fontSize: 12, color: "#64748b" }}>{seller.rating} · {seller.totalBikesSold} xe đã bán</span>
                                    </div>
                                </div>
                                <button
                                    className="btn-outline"
                                    style={{ padding: "7px 13px", background: "white", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background .15s", flexShrink: 0 }}
                                    onClick={() => bike?.sellerId && navigate(`/sellers/${bike.sellerId}`)}
                                >
                                    Xem hồ sơ
                                </button>
                            </div>
                        )}

                        {/* Specifications */}
                        <div style={{ background: "white", border: "1.5px solid #e8ecf4", borderRadius: 14, overflow: "hidden" }}>
                            <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 7 }}>
                                <ShieldCheck size={15} color="#2563eb" />
                                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Thông số</span>
                            </div>
                            {specs.map((s, i) => (
                                <div key={s.label} className="spec-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 16px", borderBottom: i < specs.length - 1 ? "1px solid #f8fafc" : "none", transition: "background .15s" }}>
                                    <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{s.label}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: s.color ?? "#0f172a" }}>{s.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Contact row */}
                        {seller && (
                            <div style={{ display: "flex", gap: 0 }}>
                                <button
                                    className="btn-outline"
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0", background: "white", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .15s" }}
                                    onClick={() => alert(`Email: ${seller.email}`)}
                                >
                                    <MessageSquare size={15} /> Liên hệ người bán
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}