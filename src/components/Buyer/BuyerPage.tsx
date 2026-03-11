import { useState, useEffect, useCallback } from "react";
import { Bike, Heart, Search, Star, Wallet, Package, X, MapPin, Image, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import WishList from "./WishList";
import WalletPage from "./WalletPage";
import UpgradeToSellerModal from "./UpgradeToSellerModal";
import { getBuyerListAPI } from "../../services/Buyer/BuyerList";
import { addToWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";
import { getCategoriesAPI } from "../../services/Buyer/Categoryservice";

interface MediaItem { url: string; type: string; sortOrder: number; }

interface BikeItem {
    id: number; title: string; brand?: string; model?: string; year?: number;
    pricePoints: number; condition?: string; bikeType?: string; status: string;
    inspectionStatus?: string; location?: string; views?: number; mileage?: number;
    sellerId?: number; media?: MediaItem[];
}

interface Category { id: number; name: string; imgUrl?: string | null; }

interface FilterState { keyword: string; category_id: string; }

const DEFAULT_FILTERS: FilterState = { keyword: "", category_id: "" };

const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const conditionColor: Record<string, { bg: string; color: string }> = {
    "Like New": { bg: "#f0fdf4", color: "#16a34a" },
    "Good":     { bg: "#eff6ff", color: "#2563eb" },
    "Fair":     { bg: "#fffbeb", color: "#d97706" },
};

const navItems = [
    { id: "home",     icon: Bike,    label: "Trang chủ" },
    { id: "wishlist", icon: Heart,   label: "Yêu thích" },
    { id: "orders",   icon: Package, label: "Đơn hàng" },
    { id: "wallet",   icon: Wallet,  label: "Ví tiền" },
    { id: "settings", icon: Settings, label: "Cài đặt" },
];

export default function BuyerPage() {
    const location = useLocation();
    const locationState = location.state as { tab?: string; walletTab?: string } | null;

    const [activeTab, setActiveTab]               = useState(locationState?.tab === "wallet" ? "wallet" : "home");
    const [bikes, setBikes]                       = useState<BikeItem[]>([]);
    const [loading, setLoading]                   = useState(false);
    const [filters, setFilters]                   = useState<FilterState>(DEFAULT_FILTERS);
    const [categories, setCategories]             = useState<Category[]>([]);
    const [wishCount, setWishCount]               = useState(0);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const user      = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const role      = user?.role as string | undefined;
    const isSeller  = role === "SELLER";
    const roleLabel = role === "SELLER" ? "Người bán" : role === "BUYER" ? "Người mua" : "Thành viên";
    const token     = localStorage.getItem("token") ?? "";

    // Wishlist count
    useEffect(() => {
        const BASE = import.meta.env.VITE_API_BASE_URL as string;
        fetch(`${BASE}/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d) ? d
                    : Array.isArray(d?.data?.content) ? d.data.content
                        : Array.isArray(d?.data) ? d.data
                            : Array.isArray(d?.content) ? d.content : [];
                setWishCount(list.length);
            })
            .catch(() => {});
    }, [activeTab, token]);

    // Categories
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await getCategoriesAPI();
                if (mounted) setCategories(list);
            } catch {
                if (mounted) setCategories([]);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Fetch bikes
    const fetchBikes = useCallback(async () => {
        setLoading(true);
        try {
            const raw = await getBuyerListAPI({
                keyword:        filters.keyword || undefined,
                category_id:    filters.category_id || undefined,
                size:           50,
                sort_by_rating: true,
            });
            setBikes(raw?.content ?? []);
        } catch (e) {
            console.error("fetchBikes error:", e);
            setBikes([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (activeTab === "home") void fetchBikes();
    }, [activeTab, fetchBikes]);

    const setFilter      = (key: keyof FilterState, val: string) => setFilters(p => ({ ...p, [key]: val }));
    const resetFilters   = () => setFilters(DEFAULT_FILTERS);
    const selectCategory = (id: string) => setFilters(p => ({ ...p, category_id: p.category_id === id ? "" : id }));

    return (
        <div style={{ fontFamily: "'DM Sans','Nunito',sans-serif", minHeight: "100vh", background: "#f4f6fb", display: "flex" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
                *{box-sizing:border-box;margin:0;padding:0}
                .nav-item{transition:all .15s;cursor:pointer;border-radius:10px}
                .nav-item:hover{background:rgba(255,255,255,.07)}
                .nav-item.active{background:rgba(255,255,255,.12)}
                .bike-card{transition:transform .2s,box-shadow .2s;cursor:pointer}
                .bike-card:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(0,0,0,.09)!important}
                .chip{display:inline-flex;align-items:center;padding:5px 14px;border-radius:18px;border:1.5px solid #e8ecf4;background:white;font-size:12px;font-weight:500;color:#64748b;cursor:pointer;transition:all .13s;white-space:nowrap;flex-shrink:0}
                .chip:hover{border-color:#3b82f6;color:#3b82f6}
                .chip.on{border-color:#3b82f6;background:#eff6ff;color:#2563eb;font-weight:700}
                .search-box{border:none;background:transparent;outline:none;font-size:13.5px;color:#1e293b;width:100%;font-family:inherit}
                .category-bar::-webkit-scrollbar{height:0}
                @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
                .pulse{animation:pulse 1.4s infinite}
                @keyframes fadeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
                .fade-in{animation:fadeIn .3s ease}
                ::-webkit-scrollbar{width:5px}
                ::-webkit-scrollbar-thumb{background:#dde3ee;border-radius:3px}
                .condition-badge{display:inline-block;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700}
            `}</style>

            {/* Sidebar */}
            <aside style={{ width: 224, background: "#0f172a", display: "flex", flexDirection: "column", padding: "22px 13px", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
                <Link to="/home" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26, paddingLeft: 5, textDecoration: "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bike size={16} color="white" />
                    </div>
                    <span style={{ color: "white", fontWeight: 800, fontSize: 15.5 }}>BikeExchange</span>
                </Link>

                <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 11, padding: "10px 11px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>
                        {(user?.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ color: "white", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || "Người dùng"}</div>
                        <div style={{ color: "#475569", fontSize: 10.5, marginTop: 1 }}>{roleLabel}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    {navItems.map(item => (
                        <button key={item.id} className={`nav-item${activeTab === item.id ? " active" : ""}`} onClick={() => setActiveTab(item.id)}
                                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", color: activeTab === item.id ? "white" : "#64748b", fontSize: 13, fontWeight: activeTab === item.id ? 600 : 400, border: "none", background: "transparent", cursor: "pointer", width: "100%" }}>
                            <item.icon size={15} />
                            {item.label}
                            {item.id === "wishlist" && wishCount > 0 && (
                                <span style={{ marginLeft: "auto", background: "#e11d48", color: "white", borderRadius: 9, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{wishCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                {/* Topbar */}
                <header style={{ background: "white", borderBottom: "1px solid #e8ecf4", padding: "13px 22px", display: "flex", alignItems: "center", gap: 11, position: "sticky", top: 0, zIndex: 20 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f4f6fb", borderRadius: 10, padding: "8px 13px", border: "1.5px solid #e8ecf4" }}>
                        <Search size={14} color="#94a3b8" />
                        <input className="search-box" placeholder="Tìm xe theo tên, thương hiệu, loại xe..."
                               value={filters.keyword}
                               onChange={e => setFilter("keyword", e.target.value)}
                               onKeyDown={e => e.key === "Enter" && void fetchBikes()} />
                        {filters.keyword && (
                            <button onClick={() => setFilter("keyword", "")} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "#94a3b8" }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => void fetchBikes()} style={{ padding: "8px 16px", background: "#1e293b", color: "white", border: "none", borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                        Tìm
                    </button>
                    {isSeller && (
                        <Link to="/seller" style={{ padding: "8px 16px", background: "#3b82f6", color: "white", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                            Bài đăng
                        </Link>
                    )}
                </header>

                <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

                    {/* HOME */}
                    {activeTab === "home" && (
                        <div className="fade-in">
                            {/* Category chips */}
                            <div className="category-bar" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
                                <button type="button" className={`chip${filters.category_id === "" ? " on" : ""}`} onClick={() => selectCategory("")}>
                                    Tất cả
                                </button>
                                {categories.map(c => (
                                    <button key={c.id} type="button" className={`chip${filters.category_id === String(c.id) ? " on" : ""}`} onClick={() => selectCategory(String(c.id))}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>

                            {/* Count */}
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Tất cả xe</span>
                                <span style={{ fontSize: 12.5, color: "#94a3b8", marginLeft: 8 }}>({bikes.length} kết quả)</span>
                            </div>

                            {/* Grid */}
                            {loading ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
                                    {[1,2,3,4,5,6].map(i => (
                                        <div key={i} style={{ borderRadius: 14, border: "1.5px solid #e8ecf4", overflow: "hidden", background: "white" }}>
                                            <div style={{ height: 160, background: "#f4f6fb" }} className="pulse" />
                                            <div style={{ padding: 14 }}>
                                                <div style={{ height: 10, background: "#eee", borderRadius: 4, marginBottom: 8, width: "40%" }} className="pulse" />
                                                <div style={{ height: 14, background: "#eee", borderRadius: 4, marginBottom: 8 }} className="pulse" />
                                                <div style={{ height: 18, background: "#eee", borderRadius: 4, width: "50%" }} className="pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : bikes.length === 0 ? (
                                <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e8ecf4", padding: "60px 24px", textAlign: "center" }}>
                                    <Bike size={48} color="#e2e8f0" style={{ marginBottom: 14 }} />
                                    <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Không tìm thấy xe</h3>
                                    <p style={{ color: "#94a3b8", fontSize: 13 }}>Thử thay đổi từ khóa hoặc danh mục.</p>
                                    <button onClick={resetFilters} style={{ marginTop: 14, padding: "8px 20px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
                                    {bikes.map(bike => <BikeCard key={bike.id} bike={bike} />)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* WISHLIST */}
                    {activeTab === "wishlist" && (
                        <div className="fade-in"><WishList token={token} formatPrice={fmtPrice} /></div>
                    )}

                    {/* ORDERS */}
                    {activeTab === "orders" && (
                        <div className="fade-in" style={{ background: "white", borderRadius: 14, border: "1.5px solid #e8ecf4", padding: "44px 24px", textAlign: "center" }}>
                            <Package size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
                            <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 5 }}>Đơn hàng của bạn</h3>
                            <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có đơn hàng nào.</p>
                        </div>
                    )}

                    {/* WALLET */}
                    {activeTab === "wallet" && (
                        <div className="fade-in">
                            <WalletPage initialTab={locationState?.walletTab === "deposit" ? "deposit" : "overview"} />
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === "settings" && (
                        <div className="fade-in" style={{ maxWidth: 600 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>Cài đặt</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                                {/* Profile */}
                                <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e8ecf4", padding: "18px 20px", cursor: "pointer", transition: "all .15s" }}
                                     onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,.1)"; }}
                                     onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8ecf4"; e.currentTarget.style.boxShadow = "none"; }}
                                     onClick={() => window.location.href = "/profile"}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>Xem hồ sơ người dùng</h3>
                                            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Xem và chỉnh sửa thông tin cá nhân của bạn</p>
                                        </div>
                                        <div style={{ fontSize: 20 }}>→</div>
                                    </div>
                                </div>

                                {/* Upgrade */}
                                {!isSeller && (
                                    <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 14, border: "1.5px solid #bbf7d0", padding: "18px 20px", cursor: "pointer", transition: "all .15s" }}
                                         onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,.15)"; }}
                                         onMouseLeave={e => { e.currentTarget.style.borderColor = "#bbf7d0"; e.currentTarget.style.boxShadow = "none"; }}
                                         onClick={() => setUpgradeModalOpen(true)}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div>
                                                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#15803d", marginBottom: 5 }}>📈 Nâng cấp lên người bán</h3>
                                                <p style={{ fontSize: 13, color: "#16a34a", margin: 0 }}>Chi phí: 10,000 điểm - Bắt đầu bán xe trên nền tảng</p>
                                            </div>
                                            <div style={{ fontSize: 20, color: "#16a34a" }}>→</div>
                                        </div>
                                    </div>
                                )}

                                {/* Logout */}
                                <div style={{ background: "#fff1f2", borderRadius: 14, border: "1.5px solid #fecdd3", padding: "18px 20px", cursor: "pointer", transition: "all .15s" }}
                                     onMouseEnter={e => { e.currentTarget.style.borderColor = "#e11d48"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(225,29,72,.1)"; }}
                                     onMouseLeave={e => { e.currentTarget.style.borderColor = "#fecdd3"; e.currentTarget.style.boxShadow = "none"; }}
                                     onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e11d48", marginBottom: 5 }}>🚪 Đăng xuất</h3>
                                            <p style={{ fontSize: 13, color: "#f43f5e", margin: 0 }}>Thoát khỏi tài khoản của bạn</p>
                                        </div>
                                        <div style={{ fontSize: 20, color: "#e11d48" }}>→</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Upgrade Modal */}
            <UpgradeToSellerModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                userId={user?.id ?? user?.userId}
                onSuccess={(updatedUser) => {
                    localStorage.setItem("user", JSON.stringify({ ...user, role: "SELLER", shopName: updatedUser.shopName, shopDescription: updatedUser.shopDescription }));
                    window.location.reload();
                }}
            />
        </div>
    );
}

// ─── BikeCard ─────────────────────────────────────────────────────────────
function BikeCard({ bike }: { bike: BikeItem }) {
    const [wished, setWished]   = useState(false);
    const [wishing, setWishing] = useState(false);

    const price = bike.pricePoints ?? 0;
    const img   = bike.media?.[0]?.url;
    const cond  = conditionColor[bike.condition ?? ""] ?? { bg: "#f4f6fb", color: "#64748b" };

    const toggleWish = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setWishing(true);
        const run = async () => {
            try {
                if (wished) {
                    await removeFromWishlistAPI(bike.id);
                } else {
                    await addToWishlistAPI(bike.id);
                }
                setWished(!wished);
            } catch { setWished(!wished); }
            finally { setWishing(false); }
        };
        void run();
    };

    return (
        <div className="bike-card" style={{ borderRadius: 13, border: "1.5px solid #e8ecf4", overflow: "hidden", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            {/* Image */}
            <div style={{ height: 160, background: "linear-gradient(135deg,#f0f4ff,#e8effe)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {img ? (
                    <img src={img} alt={bike.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                        <Image size={28} color="#c7d2e8" />
                        <span style={{ fontSize: 10, color: "#c7d2e8" }}>Chưa có ảnh</span>
                    </div>
                )}
                {bike.condition && (
                    <span className="condition-badge" style={{ position: "absolute", top: 9, left: 9, background: cond.bg, color: cond.color }}>{bike.condition}</span>
                )}
                {bike.bikeType && (
                    <span style={{ position: "absolute", bottom: 9, left: 9, background: "rgba(255,255,255,.92)", color: "#374151", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 600, border: "1px solid #e8ecf4" }}>{bike.bikeType}</span>
                )}
                <button onClick={toggleWish} disabled={wishing} style={{ position: "absolute", top: 9, right: 9, width: 29, height: 29, borderRadius: 7, border: "none", cursor: "pointer", background: wished ? "#fff0f3" : "rgba(255,255,255,.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.09)" }}>
                    <Heart size={13} color={wished ? "#e11d48" : "#94a3b8"} fill={wished ? "#e11d48" : "none"} />
                </button>
            </div>

            {/* Info */}
            <div style={{ padding: "12px 13px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>{bike.brand ?? "—"}</span>
                    {bike.year && <span style={{ fontSize: 10.5, color: "#94a3b8" }}>{bike.year}</span>}
                </div>

                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {bike.title ?? "Không có tên"}
                </h3>

                {bike.location && bike.location !== "Not specified" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 7 }}>
                        <MapPin size={10} color="#94a3b8" />
                        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>{bike.location}</span>
                    </div>
                )}

                {bike.inspectionStatus === "APPROVED" && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "#ecfdf3", color: "#15803d", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                        <span>✓</span><span>Đã kiểm định</span>
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#2563eb" }}>{fmtPrice(price)}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>4.8</span>
                    </div>
                </div>

                <button onClick={() => window.location.href = `/bikes/${bike.id}`}
                        style={{ width: "100%", padding: "8px 0", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                        onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}>
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}