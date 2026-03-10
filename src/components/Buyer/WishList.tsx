import { useState, useEffect } from "react";
import { Heart, Bike, Trash2, ShoppingCart, Star, RefreshCw, PackageOpen } from "lucide-react";
import { getWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";

// category từ BE là object {id, name, description, createdAt} — KHÔNG phải string
interface CategoryObj {
    id: number;
    name: string;
    description?: string;
    createdAt?: string;
}

interface MediaItem {
    url: string;
    type: string;
    sortOrder?: number;
}

interface BikeData {
    id: number;
    title?: string;        // BE dùng "title", không phải "name"
    name?: string;
    brand?: string;
    bikeType?: string;
    pricePoints?: number;  // BE dùng "pricePoints", không phải "price"
    price?: number;
    condition?: string;    // string: "Like New" | "Good" | "Fair" | "Poor"
    year?: number;
    category?: CategoryObj | string;
    media?: MediaItem[];
}

interface WishlistItem {
    id: number;
    bikeId?: number;
    bike?: BikeData;
    // một số BE trả flat fields thẳng lên item
    title?: string;
    brand?: string;
    pricePoints?: number;
    price?: number;
    condition?: string;
    category?: CategoryObj | string;
}

interface WishlistProps {
    token?: string;
    formatPrice?: (price: number) => string;
}

// ── Safe helpers ──────────────────────────────────────────────────────────────

/** Lấy tên category dù BE trả object hay string */
function safeCategoryName(cat?: CategoryObj | string | null): string {
    if (!cat) return "";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object" && cat !== null) return cat.name ?? "";
    return "";
}

/** Lấy giá trị an toàn, tránh render object */
function safeStr(val: unknown): string {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object") return ""; // KHÔNG render object
    return String(val);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WishList({ formatPrice }: WishlistProps) {
    const [items,    setItems]    = useState<WishlistItem[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);
    const [error,    setError]    = useState("");

    useEffect(() => { fetchWishlist(); }, []);

    const fetchWishlist = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getWishlistAPI();
            // Handle tất cả các shape BE có thể trả
            let list: WishlistItem[] = [];
            if (Array.isArray(res))                   list = res;
            else if (Array.isArray(res?.data?.content)) list = res.data.content;
            else if (Array.isArray(res?.data))          list = res.data;
            else if (Array.isArray(res?.content))       list = res.content;
            else if (Array.isArray(res?.items))         list = res.items;
            setItems(list);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Có lỗi xảy ra";
            setError(message);
            // Mock fallback để không crash
            setItems([
                { id:1, bike:{ id:1, title:"Trek FX 3 Disc",    brand:"Trek",        pricePoints:8500000,  condition:"Like New" } },
                { id:2, bike:{ id:2, title:"Giant Escape 3",     brand:"Giant",       pricePoints:6200000,  condition:"Good"     } },
                { id:3, bike:{ id:3, title:"Specialized Sirrus", brand:"Specialized", pricePoints:12000000, condition:"Like New" } },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (bikeId: number) => {
        setRemoving(bikeId);
        try {
            await removeFromWishlistAPI(bikeId);
            setItems(prev => prev.filter(item => getBikeId(item) !== bikeId));
        } catch {
            setError("Không thể xóa khỏi danh sách yêu thích");
        } finally {
            setRemoving(null);
        }
    };

    const handleRemoveAll = () => {
        if (!window.confirm("Xóa tất cả xe khỏi danh sách yêu thích?")) return;
        items.forEach(item => handleRemove(getBikeId(item)));
    };

    const fmtPrice = formatPrice ?? ((p: number) =>
            new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p)
    );

    const getBikeId = (item: WishlistItem): number =>
        item.bike?.id ?? item.bikeId ?? item.id;

    /** Normalize bike — ĐẢM BẢO tất cả fields đều là primitive, không có object */
    const getBike = (item: WishlistItem) => {
        const b = item.bike;
        return {
            id:        b?.id         ?? item.bikeId ?? item.id,
            title:     safeStr(b?.title ?? b?.name ?? item.title ?? "Không có tên"),
            brand:     safeStr(b?.brand ?? item.brand),
            price:     b?.pricePoints ?? b?.price ?? item.pricePoints ?? item.price ?? 0,
            condition: safeStr(b?.condition ?? item.condition),
            category:  safeCategoryName(b?.category ?? item.category),
            imgUrl:    b?.media?.[0]?.url ?? "",
            year:      b?.year,
        };
    };

    const condStyle: Record<string, { bg: string; color: string }> = {
        "Like New": { bg:"#f0fdf4", color:"#16a34a" },
        "Good":     { bg:"#eff6ff", color:"#2563eb" },
        "Fair":     { bg:"#fffbeb", color:"#d97706" },
        "Poor":     { bg:"#fff1f2", color:"#e11d48" },
    };

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

            {/* Header */}
            <div style={{ marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                        <h1 style={{ fontSize:22, fontWeight:800, color:"#1a1a2e", display:"flex", alignItems:"center", gap:8 }}>
                            <Heart size={22} color="#e11d48" fill="#e11d48"/> Xe yêu thích
                        </h1>
                        <p style={{ color:"#94a3b8", fontSize:14, marginTop:4 }}>{items.length} xe trong danh sách</p>
                    </div>
                    <button onClick={fetchWishlist} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", border:"1px solid #eef0f6", borderRadius:10, background:"white", fontSize:13, color:"#64748b", cursor:"pointer", fontWeight:500 }}>
                        <RefreshCw size={14} className={loading?"spin":""}/> Làm mới
                    </button>
                </div>
                {error && (
                    <div style={{ marginTop:12, padding:"10px 14px", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, color:"#c2410c", fontSize:13 }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                    {[1,2,3].map(i=>(
                        <div key={i} style={{ borderRadius:16, border:"1px solid #eef0f6", overflow:"hidden", background:"white" }}>
                            <div style={{ height:160, background:"#f7f8fc" }} className="pulse"/>
                            <div style={{ padding:16 }}>
                                <div style={{ height:12, background:"#f0f0f0", borderRadius:4, marginBottom:8, width:"60%" }} className="pulse"/>
                                <div style={{ height:16, background:"#f0f0f0", borderRadius:4, marginBottom:8 }} className="pulse"/>
                                <div style={{ height:20, background:"#f0f0f0", borderRadius:4, width:"40%" }} className="pulse"/>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty */}
            {!loading && items.length===0 && (
                <div style={{ background:"white", borderRadius:20, border:"1px solid #eef0f6", padding:"60px 40px", textAlign:"center" }}>
                    <div style={{ width:80, height:80, borderRadius:"50%", background:"#fff0f3", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                        <PackageOpen size={36} color="#fda4af"/>
                    </div>
                    <h3 style={{ fontSize:18, fontWeight:700, color:"#1a1a2e", marginBottom:8 }}>Chưa có xe yêu thích</h3>
                    <p style={{ color:"#94a3b8", fontSize:14, maxWidth:280, margin:"0 auto" }}>Nhấn ❤️ trên bất kỳ xe nào để thêm vào đây.</p>
                </div>
            )}

            {/* Grid */}
            {!loading && items.length>0 && (
                <>
                    {/* Summary bar */}
                    <div style={{ background:"white", borderRadius:14, border:"1px solid #eef0f6", padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", gap:20 }}>
                            <div>
                                <div style={{ fontSize:12, color:"#94a3b8" }}>Tổng xe</div>
                                <div style={{ fontSize:18, fontWeight:800, color:"#1a1a2e" }}>{items.length}</div>
                            </div>
                            <div style={{ width:1, background:"#eef0f6" }}/>
                            <div>
                                <div style={{ fontSize:12, color:"#94a3b8" }}>Tổng giá trị</div>
                                <div style={{ fontSize:18, fontWeight:800, color:"#2563eb" }}>
                                    {fmtPrice(items.reduce((sum,item) => {
                                        const b = item.bike;
                                        return sum + (b?.pricePoints ?? b?.price ?? item.pricePoints ?? item.price ?? 0);
                                    }, 0))}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleRemoveAll} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", background:"#fff0f3", color:"#e11d48", border:"1px solid #fecdd3", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                            <Trash2 size={14}/> Xóa tất cả
                        </button>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                        {items.map((item, idx) => {
                            const bike  = getBike(item);
                            const isRm  = removing === bike.id;
                            const cs    = condStyle[bike.condition] ?? { bg:"#f4f6fb", color:"#64748b" };

                            return (
                                <div key={item.id ?? idx} className="wl-card fade-slide"
                                     style={{ borderRadius:16, border:"1px solid #eef0f6", overflow:"hidden", background:"white", boxShadow:"0 2px 8px rgba(0,0,0,.04)", opacity:isRm?.5:1, transition:"opacity .2s" }}>

                                    {/* Image */}
                                    <div style={{ height:160, background:"linear-gradient(135deg,#fdf2f8,#fce7f3)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                                        {bike.imgUrl && (
                                            <img src={bike.imgUrl} alt={bike.title}
                                                 style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }}
                                                 onError={e => { (e.target as HTMLImageElement).style.display="none"; }}/>
                                        )}
                                        {/* Condition badge */}
                                        {bike.condition && (
                                            <span style={{ position:"absolute", top:10, left:10, background:cs.bg, color:cs.color, borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700, zIndex:1 }}>
                        {bike.condition}
                      </span>
                                        )}
                                        {/* Heart remove button */}
                                        <button className="remove-btn" onClick={()=>handleRemove(bike.id)} disabled={isRm}
                                                style={{ position:"absolute", top:10, right:10, width:32, height:32, borderRadius:8, border:"none", cursor:"pointer", background:"#fff0f3", color:"#e11d48", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 6px rgba(0,0,0,.1)", transition:"all .15s ease", zIndex:1 }}>
                                            {isRm ? <RefreshCw size={13} className="spin"/> : <Heart size={14} fill="#e11d48" color="#e11d48"/>}
                                        </button>
                                        {!bike.imgUrl && (
                                            <div style={{ width:64, height:64, borderRadius:16, background:"rgba(255,255,255,.85)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                <Bike size={32} color="#e11d48"/>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding:"14px 16px" }}>
                                        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4, fontWeight:500 }}>
                                            {bike.brand || bike.category || "Xe đạp"}
                                        </div>
                                        <h3 style={{ fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:8, lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                                            {bike.title}
                                        </h3>
                                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                                            <span style={{ fontSize:16, fontWeight:800, color:"#2563eb" }}>{fmtPrice(bike.price)}</span>
                                            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                                                <Star size={12} color="#f59e0b" fill="#f59e0b"/>
                                                <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>4.8</span>
                                            </div>
                                        </div>
                                        <div style={{ display:"flex", gap:8 }}>
                                            <button style={{ flex:1, padding:"9px 0", background:"#1a1a2e", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"background .15s ease" }}
                                                    onMouseEnter={e=>e.currentTarget.style.background="#2563eb"}
                                                    onMouseLeave={e=>e.currentTarget.style.background="#1a1a2e"}>
                                                <ShoppingCart size={13}/> Mua ngay
                                            </button>
                                            <button onClick={()=>handleRemove(bike.id)} className="remove-btn"
                                                    style={{ width:38, height:38, border:"1px solid #eef0f6", borderRadius:10, background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", transition:"all .15s ease" }}>
                                                <Trash2 size={14}/>
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