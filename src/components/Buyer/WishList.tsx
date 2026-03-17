import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bike, ShoppingCart, Star, RefreshCw, PackageOpen } from "lucide-react";
import { getWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";
import { getUserProfileAPI } from "../../services/Buyer/Userservice";

interface CategoryObj { id: number; name: string; description?: string; createdAt?: string; }

interface BikeData {
    id: number;
    name?: string;
    title?: string;
    price?: number;
    pricePoints?: number;
    condition?: string | number | null;
    brand?: string;
    category?: string | CategoryObj | null;
    bikeType?: string;
    location?: string;
    sellerId?: number;
    sellerRating?: number;
    seller_rating?: number;
    seller?: { rating?: number };
    user?: { rating?: number };
    media?: { url: string; type: string }[];
}

interface WishlistItem {
    id: number;
    bikeId?: number;
    bike?: BikeData;
    name?: string;
    price?: number;
    pricePoints?: number;
    condition?: string | number | null;
    brand?: string;
}

interface WishlistProps {
    token: string;
    formatPrice?: (price: number) => string;
}

export default function WishList({ formatPrice }: WishlistProps) {
    const navigate = useNavigate();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [sellerRatings, setSellerRatings] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);
    const [error, setError] = useState("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void fetchWishlist(); }, []);

    const emitWishlistCount = (count: number) => {
        window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count } }));
    };

    const fetchWishlist = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getWishlistAPI();
            const result = Array.isArray(data) 
                ? data 
                : (data as any)?.content ?? (data as any)?.data ?? (data as any)?.items ?? [];
            setItems(result);
            emitWishlistCount(result.length);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
            setError(message);
            setItems([]);
            emitWishlistCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (bikeId: number) => {
        setRemoving(bikeId);
        try {
            await removeFromWishlistAPI(bikeId);
            setItems(prev => {
                const next = prev.filter(item => (item.bike?.id ?? item.bikeId ?? item.id) !== bikeId);
                emitWishlistCount(next.length);
                return next;
            });
        } catch {
            setError("Không thể xóa khỏi danh sách yêu thích");
        } finally {
            setRemoving(null);
        }
    };

    const fmtPrice = formatPrice ?? ((p: number) =>
            new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p)
    );

    const safeStr = (v: unknown): string | undefined => {
        if (v == null) return undefined;
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
        if (typeof v === "object" && "name" in (v as object)) return (v as CategoryObj).name;
        return undefined;
    };

    const getBike = (item: WishlistItem): BikeData => {
        const b = item.bike;
        return {
            id:        b?.id        ?? item.bikeId ?? item.id,
            name:      b?.name      ?? b?.title    ?? item.name,
            price:     b?.pricePoints ?? b?.price  ?? item.price ?? 0,
            condition: safeStr(b?.condition ?? item.condition),
            brand:     safeStr(b?.brand     ?? item.brand),
            bikeType:  safeStr(b?.bikeType),
            sellerId:  b?.sellerId,
            sellerRating: b?.sellerRating,
            seller_rating: b?.seller_rating,
            seller: b?.seller,
            user: b?.user,
            media:     b?.media,
        };
    };

    const getBikeRating = (bike: BikeData): number => {
        const direct = Number(
            bike?.sellerRating
            ?? bike?.seller_rating
            ?? bike?.seller?.rating
            ?? bike?.user?.rating
            ?? NaN
        );
        if (Number.isFinite(direct)) return Math.max(0, Math.min(5, direct));
        if (bike?.sellerId != null && sellerRatings[bike.sellerId] != null) {
            return Math.max(0, Math.min(5, sellerRatings[bike.sellerId]));
        }
        return 0;
    };

    useEffect(() => {
        const sellerIds = [...new Set(
            items
                .map((item) => item?.bike?.sellerId)
                .filter((id): id is number => id != null)
        )];

        const missing = sellerIds.filter((id) => sellerRatings[id] == null);
        if (missing.length === 0) return;

        Promise.all(
            missing.map(async (sellerId) => {
                try {
                    const profile = await getUserProfileAPI(sellerId);
                    const rating = Number(
                        profile?.rating
                        ?? profile?.data?.rating
                        ?? profile?.user?.rating
                        ?? 0
                    );
                    return [sellerId, Number.isFinite(rating) ? rating : 0] as const;
                } catch {
                    return [sellerId, 0] as const;
                }
            })
        ).then((entries) => {
            const patch: Record<number, number> = {};
            entries.forEach(([id, rating]) => { patch[id] = rating; });
            setSellerRatings((prev) => ({ ...prev, ...patch }));
        });
    }, [items, sellerRatings]);

    return (
        <div>
            <style>{`
        .wl-card{transition:transform .2s ease,box-shadow .2s ease}
        .wl-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.08)!important}
        .remove-btn:hover{background:#fee2e2!important;color:#dc2626!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
        .fade-slide{animation:fadeSlide .3s ease}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .pulse{animation:pulse 1.5s infinite}
      `}</style>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 8 }}>
                            <Heart size={22} color="#e11d48" fill="#e11d48" /> Xe yêu thích
                        </h1>
                        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{items.length} xe trong danh sách</p>
                    </div>
                    <button onClick={fetchWishlist} style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                        border: "1px solid #eef0f6", borderRadius: 10, background: "white",
                        fontSize: 13, color: "#64748b", cursor: "pointer", fontWeight: 500,
                    }}>
                        <RefreshCw size={14} className={loading ? "spin" : ""} /> Làm mới
                    </button>
                </div>
                {error && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, color: "#c2410c", fontSize: 13 }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {loading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {[1,2,3].map(i => (
                        <div key={i} style={{ borderRadius: 16, border: "1px solid #eef0f6", overflow: "hidden", background: "white" }}>
                            <div style={{ height: 160, background: "#f7f8fc" }} className="pulse" />
                            <div style={{ padding: 16 }}>
                                <div style={{ height: 12, background: "#f0f0f0", borderRadius: 4, marginBottom: 8, width: "60%" }} className="pulse" />
                                <div style={{ height: 16, background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} className="pulse" />
                                <div style={{ height: 20, background: "#f0f0f0", borderRadius: 4, width: "40%" }} className="pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && items.length === 0 && (
                <div style={{ background: "white", borderRadius: 20, border: "1px solid #eef0f6", padding: "60px 40px", textAlign: "center" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff0f3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <PackageOpen size={36} color="#fda4af" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>Chưa có xe yêu thích</h3>
                    <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 280, margin: "0 auto" }}>Nhấn ❤️ trên bất kỳ xe nào để thêm vào đây.</p>
                </div>
            )}

            {!loading && items.length > 0 && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                        {items.map((item, idx) => {
                            const bike = getBike(item);
                            const isRemoving = removing === bike.id;
                            const sellerRating = getBikeRating(bike);
                            return (
                                <div key={item.id ?? idx} className="wl-card fade-slide" style={{ borderRadius: 16, border: "1px solid #eef0f6", overflow: "hidden", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.04)", opacity: isRemoving ? 0.5 : 1, transition: "opacity .2s" }}>
                                    <div style={{ height: 160, background: "linear-gradient(135deg,#fdf2f8,#fce7f3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                        {bike.condition != null && typeof bike.condition !== "object" && (
                                            <span style={{ position: "absolute", top: 10, left: 10, background: "#1a1a2e", color: "white", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>{String(bike.condition)}</span>
                                        )}
                                        <button className="remove-btn" onClick={() => handleRemove(bike.id)} disabled={isRemoving} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", background: "#fff0f3", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.1)", transition: "all .15s ease", zIndex: 2 }}>
                                            {isRemoving ? <RefreshCw size={13} className="spin" /> : <Heart size={14} fill="#e11d48" color="#e11d48" />}
                                        </button>
                                        {bike.media?.[0]?.url
                                            ? <img src={bike.media[0].url} alt={bike.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            : <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Bike size={32} color="#e11d48" />
                                            </div>
                                        }
                                    </div>
                                    <div style={{ padding: "14px 16px" }}>
                                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{bike.brand ?? "Xe đạp"}</div>
                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 8, lineHeight: 1.3 }}>{bike.name ?? "Không có tên"}</h3>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: "#2563eb" }}>{fmtPrice(bike.price ?? 0)}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                                                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{sellerRating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                onClick={() => navigate(`/bikes/${bike.id}`)}
                                                style={{ flex: 1, padding: "9px 0", background: "#1a1a2e", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background .15s ease" }}
                                                onMouseEnter={e => (e.currentTarget.style.background = "#2563eb")}
                                                onMouseLeave={e => (e.currentTarget.style.background = "#1a1a2e")}
                                            >
                                                <ShoppingCart size={13} /> Mua ngay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}