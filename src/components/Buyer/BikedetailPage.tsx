import { useState, useEffect } from "react";
import {
    ChevronLeft, Heart, Share2, MapPin, Star, AlertCircle,
    MessageSquare, Phone, Mail, Image, Zap,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

interface MediaItem {
    url: string;
    type: string;
    sortOrder: number;
}

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
    phone: string;
    rating: number;
    totalBikesSold: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

export default function BikedetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bike, setBike] = useState<BikeDetail | null>(null);
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [wished, setWished] = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const [ordering, setOrdering] = useState(false);

    const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const token = localStorage.getItem("token") ?? "";

    // Fetch bike details
    useEffect(() => {
        const fetchBike = async () => {
            if (!id) return;
            try {
                const res = await fetch(`${BASE_URL}/bikes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || "Không thể tải chi tiết xe");
                }

                setBike(data.data);
            } catch (e) {
                setError(String(e instanceof Error ? e.message : e));
            } finally {
                setLoading(false);
            }
        };

        void fetchBike();
    }, [id, token]);

    // Fetch seller profile
    useEffect(() => {
        if (!bike?.sellerId) return;

        const fetchSeller = async () => {
            try {
                const res = await fetch(`${BASE_URL}/users/${bike.sellerId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    setSeller(data.data);
                }
            } catch (e) {
                console.error("Error fetching seller:", e);
            }
        };

        void fetchSeller();
    }, [bike?.sellerId, token]);

    const handleBuyNow = async () => {
        if (!user?.id) {
            navigate("/login");
            return;
        }

        if (user.id === bike?.sellerId) {
            alert("Bạn không thể mua xe của chính mình");
            return;
        }

        setOrdering(true);
        try {
            const res = await fetch(`${BASE_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bikeId: bike?.id,
                    idempotencyKey: `${user.id}-${bike?.id}-${Date.now()}`,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Lỗi tạo đơn hàng");
            }

            alert("Đơn hàng đã được tạo! Điểm đã được giữ lại.");
            navigate("/orders");
        } catch (e) {
            alert(String(e instanceof Error ? e.message : e));
        } finally {
            setOrdering(false);
        }
    };

    const handleWishlist = async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const endpoint = wished ? `/wishlist/${bike?.id}` : `/wishlist`;
            const method = wished ? "DELETE" : "POST";

            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: method === "POST" ? JSON.stringify({ bikeId: bike?.id }) : undefined,
            });

            if (res.ok) {
                setWished(!wished);
            }
        } catch (e) {
            console.error("Wishlist error:", e);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#f4f6fb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans',sans-serif",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "3px solid #e8ecf4",
                        borderTopColor: "#3b82f6",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 16px",
                    }} />
                    <p style={{ color: "#64748b" }}>Đang tải...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !bike) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#f4f6fb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans',sans-serif",
                padding: "20px",
            }}>
                <div style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 24,
                    textAlign: "center",
                    maxWidth: 400,
                }}>
                    <AlertCircle size={40} color="#e11d48" style={{ marginBottom: 16 }} />
                    <h2 style={{ color: "#0f172a", fontWeight: 700, marginBottom: 8 }}>
                        Lỗi tải trang
                    </h2>
                    <p style={{ color: "#64748b", marginBottom: 20 }}>
                        {error || "Xe không tìm thấy"}
                    </p>
                    <button onClick={() => navigate(-1)}
                            style={{
                                padding: "10px 20px",
                                background: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 600,
                            }}>
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const images = bike.media?.filter(m => m.type === "IMAGE") ?? [];
    const currentImg = images[activeImg]?.url || "";

    const inspectionStatusColor: Record<string, string> = {
        "REQUESTED": "#f59e0b",
        "APPROVED": "#10b981",
        "REJECTED": "#e11d48",
        "PENDING": "#6366f1",
    };

    const statusBadgeColor: Record<string, string> = {
        "VERIFIED": "#10b981",
        "DRAFT": "#94a3b8",
        "PENDING_VERIFICATION": "#f59e0b",
    };

    return (
        <div style={{
            fontFamily: "'DM Sans',sans-serif",
            minHeight: "100vh",
            background: "#f4f6fb",
            padding: "20px",
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #dde3ee; border-radius: 3px; }
      `}</style>

            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                    background: "white",
                    padding: "12px 16px",
                    borderRadius: 12,
                }}>
                    <button onClick={() => navigate(-1)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                background: "none",
                                border: "none",
                                color: "#3b82f6",
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}>
                        <ChevronLeft size={18} /> Quay lại
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={handleWishlist}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    border: "none",
                                    background: wished ? "#fff0f3" : "#f4f6fb",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                            <Heart size={16} color={wished ? "#e11d48" : "#94a3b8"}
                                   fill={wished ? "#e11d48" : "none"} />
                        </button>
                        <button style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: "none",
                            background: "#f4f6fb",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Share2 size={16} color="#94a3b8" />
                        </button>
                    </div>
                </div>

                {/* Main grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {/* Left: Images */}
                    <div>
                        {/* Main image */}
                        <div style={{
                            background: "white",
                            borderRadius: 14,
                            overflow: "hidden",
                            marginBottom: 12,
                            height: 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            {currentImg ? (
                                <img src={currentImg} alt={bike.title}
                                     style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div style={{ textAlign: "center" }}>
                                    <Image size={48} color="#e2e8f0" style={{ marginBottom: 12 }} />
                                    <p style={{ color: "#94a3b8" }}>Chưa có ảnh</p>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                                {images.map((img, idx) => (
                                    <button
                                        key={String(idx)}
                                        onClick={() => setActiveImg(idx)}
                                        style={{
                                            border: idx === activeImg ? "2.5px solid #3b82f6" : "1.5px solid #e8ecf4",
                                            borderRadius: 10,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            height: 80,
                                            padding: 0,
                                            background: "white",
                                            transition: "border-color 0.2s",
                                        }}>
                                        <img src={img.url} alt={`View ${idx + 1}`}
                                             style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Title & status */}
                        <div style={{ background: "white", padding: 18, borderRadius: 12 }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                                {bike.status && (
                                    <span style={{
                                        background: statusBadgeColor[bike.status] || "#64748b",
                                        color: "white",
                                        borderRadius: 6,
                                        padding: "4px 10px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}>
                                        {bike.status === "VERIFIED" ? "✓ Đã xác minh"
                                            : bike.status === "DRAFT" ? "Bản nháp"
                                                : "Chờ xác minh"}
                                    </span>
                                )}
                                {bike.inspectionStatus && (
                                    <span style={{
                                        background: `${inspectionStatusColor[bike.inspectionStatus]}20`,
                                        color: inspectionStatusColor[bike.inspectionStatus],
                                        borderRadius: 6,
                                        padding: "4px 10px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}>
                                        {bike.inspectionStatus === "APPROVED" ? "✓ Kiểm định OK"
                                            : bike.inspectionStatus === "REQUESTED" ? "Chờ kiểm định"
                                                : "Kiểm định"}
                                    </span>
                                )}
                            </div>

                            <h1 style={{
                                fontSize: 24,
                                fontWeight: 800,
                                color: "#0f172a",
                                marginBottom: 12,
                                lineHeight: 1.3,
                            }}>
                                {bike.title}
                            </h1>

                            <p style={{
                                color: "#64748b",
                                fontSize: 14,
                                lineHeight: 1.6,
                                marginBottom: 12,
                            }}>
                                {bike.description}
                            </p>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>4.8</span>
                                <span style={{ color: "#94a3b8", fontSize: 13 }}>(12 reviews)</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div style={{ background: "#eff6ff", padding: 18, borderRadius: 12 }}>
                            <span style={{ color: "#64748b", fontSize: 12 }}>Giá</span>
                            <h2 style={{
                                fontSize: 32,
                                fontWeight: 800,
                                color: "#2563eb",
                                marginTop: 4,
                            }}>
                                {fmtPrice(bike.pricePoints)}
                            </h2>
                            <p style={{ color: "#3b82f6", fontSize: 12, marginTop: 6 }}>
                                + Chi phí kiểm định, thanh toán (nếu có)
                            </p>
                        </div>

                        {/* Specs */}
                        <div style={{ background: "white", padding: 18, borderRadius: 12 }}>
                            <h3 style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#0f172a",
                                marginBottom: 12,
                            }}>
                                Thông tin xe
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                {bike.brand && (
                                    <div>
                                        <span style={{
                                            display: "block",
                                            color: "#94a3b8",
                                            fontSize: 11,
                                            marginBottom: 3,
                                        }}>
                                            Hãng
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0f172a",
                                        }}>
                                            {bike.brand}
                                        </span>
                                    </div>
                                )}
                                {bike.model && (
                                    <div>
                                        <span style={{
                                            display: "block",
                                            color: "#94a3b8",
                                            fontSize: 11,
                                            marginBottom: 3,
                                        }}>
                                            Model
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0f172a",
                                        }}>
                                            {bike.model}
                                        </span>
                                    </div>
                                )}
                                {bike.year && (
                                    <div>
                                        <span style={{
                                            display: "block",
                                            color: "#94a3b8",
                                            fontSize: 11,
                                            marginBottom: 3,
                                        }}>
                                            Năm
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0f172a",
                                        }}>
                                            {bike.year}
                                        </span>
                                    </div>
                                )}
                                {bike.bikeType && (
                                    <div>
                                        <span style={{
                                            display: "block",
                                            color: "#94a3b8",
                                            fontSize: 11,
                                            marginBottom: 3,
                                        }}>
                                            Loại
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0f172a",
                                        }}>
                                            {bike.bikeType}
                                        </span>
                                    </div>
                                )}
                                {bike.condition && (
                                    <div>
                                        <span style={{
                                            display: "block",
                                            color: "#94a3b8",
                                            fontSize: 11,
                                            marginBottom: 3,
                                        }}>
                                            Tình trạng
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0f172a",
                                        }}>
                                            {bike.condition}
                                        </span>
                                    </div>
                                )}
                                {bike.mileage !== undefined && (
                                    <div>
                                        <span style={{
                                            display: "block",
                                            color: "#94a3b8",
                                            fontSize: 11,
                                            marginBottom: 3,
                                        }}>
                                            Số km
                                        </span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: "#0f172a",
                                        }}>
                                            {bike.mileage.toLocaleString()} km
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        {bike.location && bike.location !== "Not specified" && (
                            <div style={{ background: "white", padding: 18, borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <MapPin size={18} color="#3b82f6" style={{ marginTop: 2 }} />
                                <div>
                                    <span style={{ color: "#94a3b8", fontSize: 11, display: "block" }}>Địa chỉ</span>
                                    <span style={{ color: "#0f172a", fontWeight: 600, marginTop: 3, display: "block" }}>
                                        {bike.location}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* CTA Buttons */}
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={handleBuyNow} disabled={ordering}
                                    style={{
                                        flex: 1,
                                        padding: "14px 20px",
                                        background: ordering ? "#cbd5e1" : "#0f172a",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 10,
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: ordering ? "not-allowed" : "pointer",
                                        transition: "background 0.2s",
                                    }}
                                    onMouseEnter={e => { if (!ordering) e.currentTarget.style.background = "#2563eb"; }}
                                    onMouseLeave={e => { if (!ordering) e.currentTarget.style.background = "#0f172a"; }}>
                                {ordering ? "Đang xử lý..." : "Mua ngay"}
                            </button>
                            <button
                                style={{
                                    flex: 1,
                                    padding: "14px 20px",
                                    background: "white",
                                    color: "#0f172a",
                                    border: "2px solid #3b82f6",
                                    borderRadius: 10,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}>
                                <MessageSquare size={14} />
                                Liên hệ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Seller info */}
                {seller && (
                    <div style={{
                        marginTop: 32,
                        background: "white",
                        padding: 24,
                        borderRadius: 14,
                        border: "1.5px solid #e8ecf4",
                    }}>
                        <h3 style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#0f172a",
                            marginBottom: 18,
                        }}>
                            Thông tin người bán
                        </h3>

                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "start" }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 32,
                                fontWeight: 800,
                                color: "white",
                            }}>
                                {seller.fullName[0].toUpperCase()}
                            </div>

                            <div>
                                <h4 style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    marginBottom: 6,
                                }}>
                                    {seller.fullName}
                                </h4>
                                <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
                                    <div>
                                        <span style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            color: "#64748b",
                                            fontSize: 12,
                                        }}>
                                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                            {seller.rating} sao
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            color: "#64748b",
                                            fontSize: 12,
                                        }}>
                                            <Zap size={14} color="#10b981" />
                                            {seller.totalBikesSold} xe đã bán
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <span style={{
                                        fontSize: 12,
                                        color: "#94a3b8",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}>
                                        <Mail size={13} /> {seller.email}
                                    </span>
                                    {seller.phone && (
                                        <span style={{
                                            fontSize: 12,
                                            color: "#94a3b8",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                        }}>
                                            <Phone size={13} /> {seller.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                style={{
                                    padding: "10px 18px",
                                    background: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 9,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}>
                                Nhắn tin
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}