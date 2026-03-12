import { useState, useEffect, useCallback } from "react";
import { Bike, Heart, Search, Star, Wallet, Package, X, MapPin, ImageIcon, Settings, ChevronRight, TrendingUp, LogOut, User, ShoppingBag } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const CONDITION_META: Record<string, { label: string; cls: string }> = {
    "Like New":  { label: "Like New",  cls: "badge-green" },
    "LIKE_NEW":  { label: "Like New",  cls: "badge-green" },
    "Good":      { label: "Good",      cls: "badge-blue"  },
    "GOOD":      { label: "Good",      cls: "badge-blue"  },
    "Fair":      { label: "Fair",      cls: "badge-amber" },
    "FAIR":      { label: "Fair",      cls: "badge-amber" },
    "Excellent": { label: "Excellent", cls: "badge-purple"},
    "EXCELLENT": { label: "Excellent", cls: "badge-purple"},
};

export default function BuyerPage() {
    const location      = useLocation();
    const navigate      = useNavigate();
    const locationState = location.state as { tab?: string; walletTab?: string } | null;

    const [activeTab,        setActiveTab]        = useState(locationState?.tab === "wallet" ? "wallet" : "home");
    const [bikes,            setBikes]            = useState<BikeItem[]>([]);
    const [loading,          setLoading]          = useState(false);
    const [filters,          setFilters]          = useState<FilterState>(DEFAULT_FILTERS);
    const [categories,       setCategories]       = useState<Category[]>([]);
    const [wishCount,        setWishCount]        = useState(0);
    const [wishlistIds,      setWishlistIds]      = useState<Set<number>>(new Set());
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [searchFocused,    setSearchFocused]    = useState(false);

    const user  = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const token = localStorage.getItem("token") ?? "";

    const getRoleFromToken = (jwt: string): string | undefined => {
        try {
            const payload = JSON.parse(atob(jwt.split(".")[1]));
            let r: string | undefined;
            if (payload.role) r = String(payload.role);
            else if (Array.isArray(payload.roles) && payload.roles.length > 0) r = String(payload.roles[0]);
            else if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
                const auth = payload.authorities[0];
                r = typeof auth === "string" ? auth : auth?.authority ?? String(auth);
            }
            return r?.replace(/^ROLE_/i, "").toUpperCase();
        } catch { return undefined; }
    };

    const role      = getRoleFromToken(token) ?? (user?.role as string | undefined)?.toUpperCase();
    const isSeller  = role === "SELLER";
    const roleLabel = role === "SELLER" ? "Người bán" : role === "BUYER" ? "Người mua" : "Thành viên";
    const initials  = (user?.fullName || user?.email || "U").slice(0, 1).toUpperCase();

    const fetchWishlist = () => {
        const BASE = import.meta.env.VITE_API_BASE_URL as string;
        fetch(`${BASE}/buyer/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                const list: { bikeId?: number; bike?: { id?: number }; id?: number }[] =
                    Array.isArray(d) ? d : Array.isArray(d?.data?.content) ? d.data.content
                        : Array.isArray(d?.data) ? d.data : Array.isArray(d?.content) ? d.content : [];
                setWishCount(list.length);
                setWishlistIds(new Set(list.map(i => i.bikeId ?? i.bike?.id ?? i.id ?? 0).filter(Boolean)));
            }).catch(() => {});
    };

    useEffect(() => { fetchWishlist(); }, [activeTab, token]);

    useEffect(() => {
        let mounted = true;
        getCategoriesAPI().then(list => { if (mounted) setCategories(list); }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    const fetchBikes = useCallback(async () => {
        setLoading(true);
        try {
            const raw = await getBuyerListAPI({ keyword: filters.keyword || undefined, category_id: filters.category_id || undefined, size: 50, sort_by_rating: true });
            setBikes(raw?.content ?? []);
        } catch { setBikes([]); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => { if (activeTab === "home") void fetchBikes(); }, [activeTab, fetchBikes]);

    const selectCategory = (id: string) => setFilters(p => ({ ...p, category_id: p.category_id === id ? "" : id }));

    const navItems = [
        { id: "home",     icon: ShoppingBag, label: "Khám phá" },
        { id: "wishlist", icon: Heart,       label: "Yêu thích", badge: wishCount },
        { id: "orders",   icon: Package,     label: "Đơn hàng"  },
        { id: "wallet",   icon: Wallet,      label: "Ví tiền"   },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7ff", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                *{box-sizing:border-box;margin:0;padding:0}

                /* Sidebar nav */
                .nav-btn { display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; border:none; background:transparent; cursor:pointer; border-radius:12px; font-size:13.5px; font-weight:500; color:#64748b; transition:all .15s; text-align:left; font-family:inherit; }
                .nav-btn:hover { background:#f1f5f9; color:#1e293b; }
                .nav-btn.active { background:linear-gradient(135deg,#eff6ff,#eef2ff); color:#2563eb; font-weight:600; }
                .nav-btn.active svg { color:#2563eb; }

                /* Category chips */
                .cat-chip { padding:7px 16px; border-radius:20px; border:1.5px solid #e2e8f0; background:white; font-size:13px; font-weight:500; color:#64748b; cursor:pointer; transition:all .15s; white-space:nowrap; font-family:inherit; }
                .cat-chip:hover { border-color:#93c5fd; color:#2563eb; background:#f0f9ff; }
                .cat-chip.active { border-color:#2563eb; background:#2563eb; color:white; font-weight:600; }

                /* Bike card */
                .bike-card { background:white; border-radius:16px; border:1px solid #e8ecf5; overflow:hidden; transition:all .2s cubic-bezier(.4,0,.2,1); cursor:pointer; display:flex; flex-direction:column; }
                .bike-card:hover { transform:translateY(-4px); box-shadow:0 20px 48px rgba(37,99,235,.1); border-color:#c7d2fe; }

                /* Badges */
                .badge-green  { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }
                .badge-blue   { background:#dbeafe; color:#1d4ed8; border:1px solid #bfdbfe; }
                .badge-amber  { background:#fef9c3; color:#a16207; border:1px solid #fde68a; }
                .badge-purple { background:#f3e8ff; color:#7e22ce; border:1px solid #e9d5ff; }

                /* Search */
                .search-input { border:none; background:transparent; outline:none; font-size:14px; color:#1e293b; width:100%; font-family:inherit; }
                .search-input::placeholder { color:#94a3b8; }

                /* Scrollbar */
                .cat-scroll { overflow-x:auto; scrollbar-width:none; }
                .cat-scroll::-webkit-scrollbar { display:none; }

                /* Skeleton pulse */
                @keyframes skPulse { 0%,100%{opacity:.6} 50%{opacity:.25} }
                .sk { animation:skPulse 1.6s ease infinite; background:#e2e8f0; border-radius:8px; }

                /* Fade in */
                @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
                .fade-up { animation:fadeUp .25s ease both; }

                /* Heart btn */
                .wish-btn { position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; background:white; box-shadow:0 2px 8px rgba(0,0,0,.12); transition:all .15s; }
                .wish-btn:hover { transform:scale(1.1); }

                /* Settings card */
                .setting-card { background:white; border-radius:14px; border:1px solid #e8ecf5; padding:18px 20px; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:space-between; }
                .setting-card:hover { box-shadow:0 8px 24px rgba(37,99,235,.1); border-color:#c7d2fe; transform:translateY(-1px); }

                /* Topbar search focused */
                .search-wrap { border:1.5px solid #e2e8f0; border-radius:12px; background:white; display:flex; align-items:center; gap:10px; padding:9px 14px; flex:1; transition:all .2s; }
                .search-wrap.focused { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.1); }
            `}</style>

            {/* ══════ SIDEBAR ══════ */}
            <aside style={{
                width: 240, background: "white",
                borderRight: "1px solid #e8ecf5",
                display: "flex", flexDirection: "column",
                padding: "20px 14px",
                position: "sticky", top: 0, height: "100vh",
                flexShrink: 0,
            }}>
                {/* Logo */}
                <button onClick={() => setActiveTab("home")} style={{
                    display: "flex", alignItems: "center", gap: 9,
                    marginBottom: 24, paddingLeft: 6,
                    background: "none", border: "none", cursor: "pointer",
                }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(79,70,229,.3)",
                    }}>
                        <Bike size={17} color="white" />
                    </div>
                    <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>BikeExchange</span>
                </button>

                {/* User card */}
                <div style={{
                    background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
                    border: "1px solid #c7d2fe",
                    borderRadius: 14, padding: "12px 13px",
                    marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, color: "white", flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(79,70,229,.3)",
                    }}>
                        {initials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: "#0f172a", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user?.fullName || user?.email || "Người dùng"}
                        </div>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            marginTop: 3, padding: "2px 7px", borderRadius: 99,
                            background: "rgba(37,99,235,.1)", color: "#2563eb",
                            fontSize: 10, fontWeight: 700,
                        }}>
                            {roleLabel}
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    {navItems.map(item => (
                        <button key={item.id} className={`nav-btn${activeTab === item.id ? " active" : ""}`}
                                onClick={() => setActiveTab(item.id)}>
                            <item.icon size={16} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.badge && item.badge > 0 && (
                                <span style={{
                                    background: "#e11d48", color: "white",
                                    borderRadius: 99, padding: "1px 7px",
                                    fontSize: 10, fontWeight: 700,
                                }}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Bottom actions */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
                    <button className="nav-btn" onClick={() => setActiveTab("settings")}>
                        <Settings size={16} />
                        <span>Cài đặt</span>
                    </button>
                    <button className="nav-btn" style={{ color: "#ef4444" }}
                            onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }}>
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* ══════ MAIN ══════ */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                {/* Topbar */}
                {activeTab !== "wallet" && (
                    <header style={{
                        background: "white", borderBottom: "1px solid #e8ecf5",
                        padding: "12px 28px",
                        display: "flex", alignItems: "center", gap: 12,
                        position: "sticky", top: 0, zIndex: 20,
                    }}>
                        <div className={`search-wrap${searchFocused ? " focused" : ""}`}>
                            <Search size={15} color="#94a3b8" />
                            <input
                                className="search-input"
                                placeholder="Tìm kiếm xe đạp, thương hiệu, loại xe..."
                                value={filters.keyword}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && void fetchBikes()}
                            />
                            {filters.keyword && (
                                <button onClick={() => setFilters(p => ({ ...p, keyword: "" }))}
                                        style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}>
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                        <button onClick={() => void fetchBikes()} style={{
                            padding: "9px 20px",
                            background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                            color: "white", border: "none", borderRadius: 12,
                            fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(79,70,229,.3)",
                            whiteSpace: "nowrap", fontFamily: "inherit",
                        }}>
                            Tìm
                        </button>
                        {isSeller && (
                            <Link to="/seller" style={{
                                padding: "9px 18px",
                                background: "#f0fdf4", color: "#16a34a",
                                border: "1.5px solid #bbf7d0",
                                borderRadius: 12, fontSize: 13, fontWeight: 700,
                                textDecoration: "none", whiteSpace: "nowrap",
                            }}>
                                Bài đăng
                            </Link>
                        )}
                    </header>
                )}

                {/* Page content */}
                <main style={{ flex: 1, overflowY: "auto", padding: activeTab === "wallet" ? "0" : "28px 28px" }}>

                    {/* ── HOME ── */}
                    {activeTab === "home" && (
                        <div className="fade-up">
                            {/* ── HERO ── */}
                            <div style={{ borderRadius: 20, marginBottom: 10, overflow: "hidden", position: "relative" }}>

                                {/* Photo zone */}
                                <div style={{ position: "relative", height: 340, overflow: "hidden" }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1400&q=90&auto=format&fit=crop&crop=center"
                                        alt="Road bike"
                                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 50%", filter: "brightness(.72) grayscale(.1)" }}
                                    />
                                    {/* Left text overlay only */}
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        background: "linear-gradient(100deg, rgba(10,15,35,.88) 0%, rgba(10,15,35,.5) 35%, rgba(10,15,35,.05) 58%, transparent 72%)",
                                    }}/>
                                    {/* Bottom fade */}
                                    <div style={{
                                        position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                                        background: "linear-gradient(to bottom, transparent, #f5f7ff)",
                                    }}/>

                                    {/* Content */}
                                    <div style={{ position: "relative", zIndex: 1, padding: "0 36px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        <h1 style={{ color: "white", fontSize: 38, fontWeight: 900, letterSpacing: "-1.2px", lineHeight: 1.12, marginBottom: 14, maxWidth: 500 }}>
                                            Find Your Perfect{" "}
                                            <span style={{ color: "#2563eb", textShadow: "0 0 30px rgba(37,99,235,.6)" }}>Ride</span>
                                        </h1>
                                        <p style={{ color: "rgba(255,255,255,.58)", fontSize: 14, maxWidth: 340, lineHeight: 1.65 }}>
                                            Nền tảng mua bán xe đạp uy tín hàng đầu Việt Nam.<br/>
                                            Kiểm định chuyên nghiệp — giao dịch an toàn.
                                        </p>
                                    </div>
                                </div>

                                {/* ── Feature strip ── */}
                                <div style={{
                                    background: "white",
                                    border: "1px solid #e8ecf5",
                                    borderTop: "none",
                                    borderBottomLeftRadius: 20,
                                    borderBottomRightRadius: 20,
                                    padding: "22px 32px",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(4, 1fr)",
                                    gap: 0,
                                }}>
                                    {[
                                        {
                                            icon: (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                                </svg>
                                            ),
                                            title: "Xe đã kiểm định",
                                            desc: "Chuyên gia kiểm tra từng linh kiện",
                                        },
                                        {
                                            icon: (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                                </svg>
                                            ),
                                            title: "Tìm kiếm thông minh",
                                            desc: "Lọc xe theo loại, giá, tình trạng",
                                        },
                                        {
                                            icon: (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                            ),
                                            title: "Người bán uy tín",
                                            desc: "Đánh giá thực từ người mua",
                                        },
                                        {
                                            icon: (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                                                </svg>
                                            ),
                                            title: "Giao dịch an toàn",
                                            desc: "Thanh toán bảo mật qua ví điện tử",
                                        },
                                    ].map((f, i) => (
                                        <div key={f.title} style={{
                                            display: "flex", flexDirection: "column", alignItems: "center",
                                            textAlign: "center", padding: "4px 16px",
                                            borderLeft: i > 0 ? "1px solid #f1f5f9" : "none",
                                        }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
                                                border: "1px solid #c7d2fe",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                marginBottom: 10,
                                            }}>
                                                {f.icon}
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{f.title}</div>
                                            <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.4 }}>{f.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Category filter */}
                            <div className="cat-scroll" style={{ display: "flex", gap: 8, paddingBottom: 4, marginBottom: 20, marginTop: 20 }}>
                                <button className={`cat-chip${filters.category_id === "" ? " active" : ""}`}
                                        onClick={() => selectCategory("")}>
                                    Tất cả
                                </button>
                                {categories.map(c => (
                                    <button key={c.id}
                                            className={`cat-chip${filters.category_id === String(c.id) ? " active" : ""}`}
                                            onClick={() => selectCategory(String(c.id))}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>

                            {/* Section header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                <div>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                                        {filters.category_id
                                            ? categories.find(c => String(c.id) === filters.category_id)?.name ?? "Xe đạp"
                                            : "Tất cả xe đạp"}
                                    </span>
                                    <span style={{ fontSize: 12.5, color: "#94a3b8", marginLeft: 8 }}>
                                        ({bikes.length} kết quả)
                                    </span>
                                </div>
                                {(filters.keyword || filters.category_id) && (
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)} style={{
                                        fontSize: 12, color: "#2563eb", background: "#eff6ff",
                                        border: "1px solid #bfdbfe", borderRadius: 8,
                                        padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                                    }}>
                                        Xóa lọc
                                    </button>
                                )}
                            </div>

                            {/* Grid */}
                            {loading ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                                    {[1,2,3,4,5,6,7,8].map(i => (
                                        <div key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", overflow: "hidden" }}>
                                            <div className="sk" style={{ height: 176, borderRadius: 0 }}/>
                                            <div style={{ padding: "14px" }}>
                                                <div className="sk" style={{ height: 10, width: "45%", marginBottom: 8 }}/>
                                                <div className="sk" style={{ height: 14, marginBottom: 6 }}/>
                                                <div className="sk" style={{ height: 14, width: "80%", marginBottom: 14 }}/>
                                                <div className="sk" style={{ height: 20, width: "50%" }}/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : bikes.length === 0 ? (
                                <div style={{
                                    background: "white", borderRadius: 20,
                                    border: "1px solid #e8ecf5",
                                    padding: "60px 24px", textAlign: "center",
                                }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                        <Bike size={28} color="#cbd5e1" />
                                    </div>
                                    <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Không tìm thấy xe</h3>
                                    <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Thử thay đổi từ khóa hoặc danh mục</p>
                                    <button onClick={() => setFilters(DEFAULT_FILTERS)} style={{
                                        padding: "9px 22px",
                                        background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                                        color: "white", border: "none", borderRadius: 10,
                                        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                    }}>
                                        Xem tất cả
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                                    {bikes.map((bike, i) => (
                                        <BikeCard
                                            key={bike.id}
                                            bike={bike}
                                            index={i}
                                            initialWished={wishlistIds.has(bike.id)}
                                            onWishChange={(bikeId, wished) => {
                                                setWishlistIds(prev => {
                                                    const next = new Set(prev);
                                                    if (wished) { next.add(bikeId); } else { next.delete(bikeId); }
                                                    return next;
                                                });
                                                setWishCount(prev => wished ? prev + 1 : Math.max(0, prev - 1));
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── WISHLIST ── */}
                    {activeTab === "wishlist" && (
                        <div className="fade-up">
                            <WishList token={token} formatPrice={fmtPrice} />
                        </div>
                    )}

                    {/* ── ORDERS ── */}
                    {activeTab === "orders" && (
                        <div className="fade-up" style={{
                            background: "white", borderRadius: 20,
                            border: "1px solid #e8ecf5",
                            padding: "60px 24px", textAlign: "center",
                        }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                <Package size={28} color="#cbd5e1" />
                            </div>
                            <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Đơn hàng của bạn</h3>
                            <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có đơn hàng nào.</p>
                        </div>
                    )}

                    {/* ── WALLET ── */}
                    {activeTab === "wallet" && (
                        <div className="fade-up">
                            <WalletPage initialTab={locationState?.walletTab === "deposit" ? "deposit" : "overview"} />
                        </div>
                    )}

                    {/* ── SETTINGS ── */}
                    {activeTab === "settings" && (
                        <div className="fade-up" style={{ maxWidth: 560 }}>
                            <div style={{ marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>Cài đặt</h2>
                                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Quản lý tài khoản và tuỳ chọn của bạn</p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                                {/* Profile */}
                                <div className="setting-card" onClick={() => navigate("/profile")}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <User size={18} color="#2563eb" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Hồ sơ cá nhân</div>
                                            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>Xem và chỉnh sửa thông tin của bạn</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} color="#c7d2e8" />
                                </div>

                                {/* Upgrade */}
                                {!isSeller && (
                                    <div className="setting-card" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}
                                         onClick={() => setUpgradeModalOpen(true)}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <TrendingUp size={18} color="#16a34a" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d", marginBottom: 2 }}>Nâng cấp lên Người bán</div>
                                                <div style={{ fontSize: 12.5, color: "#16a34a" }}>Chi phí: 10,000 điểm — Bắt đầu bán xe</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="#86efac" />
                                    </div>
                                )}

                                {/* Logout */}
                                <div className="setting-card" style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}
                                     onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <LogOut size={18} color="#dc2626" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 2 }}>Đăng xuất</div>
                                            <div style={{ fontSize: 12.5, color: "#f87171" }}>Thoát khỏi tài khoản của bạn</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} color="#fca5a5" />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

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

// ─── BikeCard ─────────────────────────────────────────────────────────────────
function BikeCard({ bike, index = 0, initialWished = false, onWishChange }: {
    bike: BikeItem; index?: number;
    initialWished?: boolean;
    onWishChange?: (bikeId: number, wished: boolean) => void;
}) {
    const [wished,  setWished]  = useState(initialWished);
    const [wishing, setWishing] = useState(false);
    useEffect(() => { setWished(initialWished); }, [initialWished]);

    const price  = bike.pricePoints ?? 0;
    const img    = bike.media?.[0]?.url;
    const condM  = CONDITION_META[bike.condition ?? ""];

    const toggleWish = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (wishing) return;
        setWishing(true);
        const run = async () => {
            try {
                if (wished) { await removeFromWishlistAPI(bike.id); } else { await addToWishlistAPI(bike.id); }
                const next = !wished;
                setWished(next);
                onWishChange?.(bike.id, next);
            } catch { /* keep state */ }
            finally { setWishing(false); }
        };
        void run();
    };

    return (
        <div className="bike-card" style={{ animationDelay: `${index * 0.04}s` }}>
            {/* Image */}
            <div style={{ height: 176, background: "linear-gradient(135deg, #f0f4ff, #e8effe)", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {img ? (
                    <img src={img} alt={bike.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                         onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <ImageIcon size={28} color="#c7d2e8" />
                        <span style={{ fontSize: 11, color: "#c7d2e8" }}>Chưa có ảnh</span>
                    </div>
                )}

                {/* Condition badge */}
                {condM && (
                    <span className={condM.cls} style={{
                        position: "absolute", top: 10, left: 10,
                        padding: "3px 8px", borderRadius: 99,
                        fontSize: 10.5, fontWeight: 700,
                    }}>
                        {condM.label}
                    </span>
                )}

                {/* Bike type */}
                {bike.bikeType && (
                    <span style={{
                        position: "absolute", bottom: 10, left: 10,
                        background: "rgba(255,255,255,.92)", backdropFilter: "blur(4px)",
                        color: "#374151", borderRadius: 6,
                        padding: "3px 8px", fontSize: 10.5, fontWeight: 600,
                        border: "1px solid rgba(255,255,255,.7)",
                    }}>
                        {bike.bikeType}
                    </span>
                )}

                {/* Wishlist */}
                <button className="wish-btn" onClick={toggleWish} disabled={wishing}>
                    <Heart size={14} color={wished ? "#e11d48" : "#94a3b8"} fill={wished ? "#e11d48" : "none"} />
                </button>
            </div>

            {/* Info */}
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {bike.brand ?? "—"}
                    </span>
                    {bike.year && <span style={{ fontSize: 10.5, color: "#cbd5e1", fontWeight: 500 }}>{bike.year}</span>}
                </div>

                <h3 style={{
                    fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 8,
                    lineHeight: 1.35,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                    {bike.title ?? "Không có tên"}
                </h3>

                {bike.location && bike.location !== "Not specified" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                        <MapPin size={10} color="#94a3b8" />
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{bike.location}</span>
                    </div>
                )}

                {/* Inspection */}
                <div style={{ marginBottom: 12 }}>
                    {bike.inspectionStatus === "APPROVED" ? (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 9px", borderRadius: 99,
                            background: "#dcfce7", border: "1px solid #bbf7d0",
                            color: "#15803d", fontSize: 10.5, fontWeight: 700,
                        }}>
                            <span>✓</span> Đã kiểm định
                        </span>
                    ) : (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 9px", borderRadius: 99,
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            color: "#94a3b8", fontSize: 10.5, fontWeight: 600,
                        }}>
                            <span>○</span> Chưa kiểm định
                        </span>
                    )}
                </div>

                {/* Price & CTA */}
                <div style={{ marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#2563eb", letterSpacing: "-0.3px" }}>
                            {fmtPrice(price)}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Star size={11} color="#f59e0b" fill="#f59e0b" />
                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>4.8</span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = `/bikes/${bike.id}`}
                        style={{
                            width: "100%", padding: "9px 0",
                            background: "#0f172a",
                            color: "white", border: "none", borderRadius: 10,
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg, #2563eb, #4f46e5)"}
                        onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}
                    >
                        Xem chi tiết
                    </button>
                </div>
            </div>
        </div>
    );
}