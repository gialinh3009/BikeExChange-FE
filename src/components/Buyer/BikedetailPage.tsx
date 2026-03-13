import { useState, useEffect } from "react";
import {
    ChevronLeft, Heart, Share2, MapPin, Calendar,
    Star, MessageSquare, CheckCircle, Image as ImageIcon,
    ShieldCheck, Zap, Phone, Mail, User,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

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
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN").format(p) + " điểm";

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

    const user  = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const token = localStorage.getItem("token") ?? "";

    /* Fetch bike */
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res  = await fetch(`${BASE_URL}/bikes/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || "Không thể tải chi tiết xe");
                setBike(data.data);
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
                const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
                const [userRes, statsRes] = await Promise.all([
                    fetch(`${BASE_URL}/users/${bike.sellerId}`, { headers }),
                    fetch(`${BASE_URL}/users/${bike.sellerId}/stats`, { headers }),
                ]);
                const userData  = userRes.ok  ? await userRes.json()  : null;
                const statsData = statsRes.ok ? await statsRes.json() : null;
                if (userData) {
                    setSeller({
                        id:             userData.id,
                        fullName:       userData.fullName  ?? "Người bán",
                        email:          userData.email     ?? "",
                        phone:          userData.phone,
                        rating:         statsData?.rating          ?? userData.rating         ?? 0,
                        totalBikesSold: statsData?.totalBikesSold  ?? userData.totalBikesSold ?? 0,
                    });
                }
            } catch { /* silent */ }
        })();
    }, [bike?.sellerId]);

    /* Buy now */
    const handleBuyNow = async () => {
        if (!user?.id) { navigate("/login"); return; }
        if (user.id === bike?.sellerId) { alert("Bạn không thể mua xe của chính mình"); return; }
        setOrdering(true);
        try {
            const res  = await fetch(`${BASE_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bikeId: bike?.id, idempotencyKey: `${user.id}-${bike?.id}-${Date.now()}` }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) { console.error("Order 400 detail:", data); throw new Error(data.message || data.error || JSON.stringify(data)); }
            alert("Đặt mua thành công! Kiểm tra đơn hàng của bạn.");
            navigate("/buyer");
        } catch (e) {
            alert(String(e instanceof Error ? e.message : e));
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
            const res = await fetch(`${BASE_URL}/buyer/wishlist/${bike?.id}`, {
                method: wished ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setWished(!wished);
        } catch { /* silent */ }
    };

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
    const isVerified = bike.inspectionStatus === "APPROVED";
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

            {/* ── Sticky top bar ── */}
            <div style={{
                background: "white",
                borderBottom: "1px solid #e8ecf4",
                padding: "0 32px",
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                zIndex: 50,
                boxShadow: "0 1px 8px rgba(0,0,0,.04)",
            }}>
                <button
                    className="icon-btn"
                    onClick={() => navigate(-1)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#2563eb", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "6px 10px", borderRadius: 8, transition: "background .15s, border-color .15s" }}
                >
                    <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="icon-btn" onClick={handleWishlist} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${wished ? "#fecdd3" : "#e8ecf4"}`, background: wished ? "#fff0f3" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                        <Heart size={15} color={wished ? "#e11d48" : "#94a3b8"} fill={wished ? "#e11d48" : "none"} />
                    </button>
                    <button className="icon-btn" onClick={() => { navigator.clipboard?.writeText(window.location.href); }} style={{ width: 36, height: 36, borderRadius: 8, border: "1.5px solid #e8ecf4", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                        <Share2 size={15} color="#94a3b8" />
                    </button>
                </div>
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
                                    <CheckCircle size={12} strokeWidth={3} /> Verified Bike
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
                                onClick={handleBuyNow}
                                disabled={ordering}
                                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", background: ordering ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: ordering ? "not-allowed" : "pointer", transition: "background .15s", boxShadow: "0 2px 12px rgba(37,99,235,.25)" }}
                            >
                                <Zap size={15} fill="white" color="white" />
                                {ordering ? "Đang xử lý..." : "Mua ngay"}
                            </button>
                            <button className="icon-btn" onClick={handleWishlist} style={{ width: 48, flexShrink: 0, borderRadius: 10, border: `1.5px solid ${wished ? "#fecdd3" : "#e8ecf4"}`, background: wished ? "#fff0f3" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                                <Heart size={18} color={wished ? "#e11d48" : "#94a3b8"} fill={wished ? "#e11d48" : "none"} />
                            </button>
                            <button className="icon-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ width: 48, flexShrink: 0, borderRadius: 10, border: "1.5px solid #e8ecf4", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                                <Share2 size={18} color="#94a3b8" />
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
                                    onClick={() => navigate(`/profile?userId=${seller.id}`)}
                                    style={{ padding: "7px 13px", background: "white", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background .15s", flexShrink: 0 }}
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
                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    className="btn-outline"
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 0", background: "white", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .15s" }}
                                    onClick={() => alert(`Email: ${seller.email}`)}
                                >
                                    <MessageSquare size={15} /> Liên hệ người bán
                                </button>
                                {seller.phone && (
                                    <button className="icon-btn" onClick={() => window.open(`tel:${seller.phone}`)} style={{ width: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "white", border: "1.5px solid #e8ecf4", borderRadius: 10, cursor: "pointer", transition: "all .15s" }}>
                                        <Phone size={16} color="#2563eb" />
                                    </button>
                                )}
                                <button className="icon-btn" onClick={() => window.open(`mailto:${seller.email}`)} style={{ width: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "white", border: "1.5px solid #e8ecf4", borderRadius: 10, cursor: "pointer", transition: "all .15s" }}>
                                    <Mail size={16} color="#2563eb" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}