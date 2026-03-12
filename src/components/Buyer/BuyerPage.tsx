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
interface Category {
    id:          number;
    name:        string;
    description?: string | null;
    imgUrl?:     string | null;   // mapped from img_url column
    createdAt?:  string | null;
}
interface FilterState { keyword: string; category_id: string; }
interface BrowseFilterState {
    keyword:        string;   // → keyword
    category_id:    string;   // → category_id (Long)
    status:         string;   // → status comma-separated: "ACTIVE" | "ACTIVE,RESERVED" | ""=all
    price_min:      string;   // → price_min (Long)
    price_max:      string;   // → price_max (Long)
    brand_id:       string;   // → brand_id (Long)
    min_year:       string;   // → min_year (Integer)
    frame_size:     string;   // → frame_size
    sort_by_rating: boolean;  // → sort_by_rating
    verifiedOnly:   boolean;  // FE-only: nếu true → status="ACTIVE" + inspectionStatus check FE-side
}

const DEFAULT_FILTERS: FilterState = { keyword: "", category_id: "" };
const DEFAULT_BROWSE: BrowseFilterState = {
    keyword: "", category_id: "", status: "ACTIVE",
    price_min: "", price_max: "", brand_id: "", min_year: "",
    frame_size: "", sort_by_rating: true, verifiedOnly: false,
};

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
    // Browse tab — separate state & data
    const [browseFilters,  setBrowseFilters]  = useState<BrowseFilterState>(DEFAULT_BROWSE);
    const [browseResults,  setBrowseResults]  = useState<BikeItem[]>([]);
    const [browseLoading,  setBrowseLoading]  = useState(false);
    const [browseTotal,    setBrowseTotal]    = useState(0);

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

    const fetchWishlist = useCallback(() => {
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
    }, [token]);

    useEffect(() => { fetchWishlist(); }, [activeTab, fetchWishlist]);

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

    // Browse — fetch với full filter params
    const fetchBrowse = useCallback(async () => {
        setBrowseLoading(true);
        try {
            const raw = await getBuyerListAPI({
                keyword:        browseFilters.keyword        || undefined,
                category_id:    browseFilters.category_id   || undefined,
                // status: nếu verifiedOnly thì chỉ lấy ACTIVE, ngược lại lấy ACTIVE (mặc định hiển thị xe đang bán)
                status:         browseFilters.status        || "ACTIVE",
                price_min:      browseFilters.price_min     ? Number(browseFilters.price_min)  : undefined,
                price_max:      browseFilters.price_max     ? Number(browseFilters.price_max)  : undefined,
                brand_id:       browseFilters.brand_id      ? Number(browseFilters.brand_id)   : undefined,
                min_year:       browseFilters.min_year      ? Number(browseFilters.min_year)   : undefined,
                frame_size:     browseFilters.frame_size    || undefined,
                sort_by_rating: browseFilters.sort_by_rating,
                size: 100,
                page: 0,
            });
            // verifiedOnly = filter FE-side vì BE không có inspectionStatus param trong GET /bikes
            const content = browseFilters.verifiedOnly
                ? (raw.content ?? []).filter((b: BikeItem) => b.inspectionStatus === "APPROVED")
                : (raw.content ?? []);
            setBrowseResults(content);
            setBrowseTotal(browseFilters.verifiedOnly ? content.length : (raw.totalElements ?? content.length));
        } catch (e) {
            console.error("fetchBrowse error:", e);
            setBrowseResults([]);
        } finally {
            setBrowseLoading(false);
        }
    }, [browseFilters]);

    useEffect(() => { void fetchBrowse(); }, [fetchBrowse]);

    const navItems = [
        { id: "home",     icon: ShoppingBag, label: "Trang chủ" },
        { id: "browse",   icon: Search,      label: "Tất cả xe"  },
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
                            {/* ── HERO IMAGE BLOCK ── */}
                            <div style={{ borderRadius: 20, marginBottom: 20, overflow: "hidden", position: "relative" }}>
                                <div style={{ position: "relative", height: 340, overflow: "hidden" }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1400&q=90&auto=format&fit=crop&crop=center"
                                        alt="Road bike"
                                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 50%", filter: "brightness(.72) grayscale(.1)" }}
                                    />
                                    {/* Left text overlay only — right side shows natural bike photo */}
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        background: "linear-gradient(100deg, rgba(10,15,35,.9) 0%, rgba(10,15,35,.55) 35%, rgba(10,15,35,.08) 58%, transparent 72%)",
                                    }}/>

                                    {/* Content */}
                                    <div style={{ position: "relative", zIndex: 1, padding: "0 36px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        <h1 style={{ color: "white", fontSize: 38, fontWeight: 900, letterSpacing: "-1.2px", lineHeight: 1.12, marginBottom: 14, maxWidth: 500 }}>
                                            Find Your Perfect{" "}
                                            <span style={{ color: "#2563eb", textShadow: "0 0 30px rgba(37,99,235,.5)" }}>Ride</span>
                                        </h1>
                                        <p style={{ color: "rgba(255,255,255,.58)", fontSize: 14, maxWidth: 340, lineHeight: 1.65 }}>
                                            Nền tảng mua bán xe đạp uy tín hàng đầu Việt Nam.<br/>
                                            Kiểm định chuyên nghiệp — giao dịch an toàn.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── FEATURE STRIP — separate block ── */}
                            <div style={{
                                background: "white",
                                borderRadius: 16,
                                border: "1px solid #e8ecf5",
                                padding: "28px 32px",
                                marginBottom: 24,
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: 0,
                                boxShadow: "0 1px 4px rgba(0,0,0,.04)",
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
                                            width: 48, height: 48, borderRadius: 14,
                                            background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
                                            border: "1px solid #c7d2fe",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            marginBottom: 12,
                                        }}>
                                            {f.icon}
                                        </div>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{f.title}</div>
                                        <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.4 }}>{f.desc}</div>
                                    </div>
                                ))}
                            </div>

                            {/* ── FEATURED BIKES ── */}
                            <div style={{ marginBottom: 32 }}>
                                {/* Section header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                    <div>
                                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>Featured Bikes</h2>
                                        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 3 }}>Xe đạp đã được kiểm định chất lượng</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab("browse")}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            padding: "8px 16px", borderRadius: 10,
                                            border: "1.5px solid #e2e8f0", background: "white",
                                            fontSize: 13, fontWeight: 600, color: "#374151",
                                            cursor: "pointer", fontFamily: "inherit",
                                            transition: "all .15s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#374151"; }}
                                    >
                                        View All
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7"/>
                                        </svg>
                                    </button>
                                </div>

                                {/* Grid — chỉ xe APPROVED, max 8 */}
                                {loading ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                                        {[1,2,3,4].map(i => (
                                            <div key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", overflow: "hidden" }}>
                                                <div className="sk" style={{ height: 220, borderRadius: 0 }}/>
                                                <div style={{ padding: "16px" }}>
                                                    <div className="sk" style={{ height: 14, marginBottom: 8 }}/>
                                                    <div className="sk" style={{ height: 18, width: "40%", marginBottom: 12 }}/>
                                                    <div className="sk" style={{ height: 10, width: "60%" }}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                                        {bikes
                                            .filter(b => b.inspectionStatus === "APPROVED")
                                            .slice(0, 8)
                                            .map((bike, i) => (
                                                <BikeCard
                                                    key={bike.id} bike={bike} index={i}
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
                                        {bikes.filter(b => b.inspectionStatus === "APPROVED").length === 0 && !loading && (
                                            <div style={{ gridColumn: "1/-1", background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "48px 24px", textAlign: "center" }}>
                                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                                    <Bike size={24} color="#cbd5e1"/>
                                                </div>
                                                <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 14 }}>Chưa có xe đã kiểm định</p>
                                                <button onClick={() => setActiveTab("browse")} style={{ padding: "8px 20px", background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                                    Xem tất cả xe
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── BROWSE ALL (with filters) ── */}
                    {activeTab === "browse" && (
                        <div className="fade-up" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

                            {/* ── Filter Sidebar ── */}
                            <div style={{ width: 230, flexShrink: 0, background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "20px", position: "sticky", top: 20 }}>
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Filters</span>
                                    </div>
                                    <button onClick={() => setBrowseFilters(DEFAULT_BROWSE)}
                                            style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                                        Clear all
                                    </button>
                                </div>

                                {/* Verified Only */}
                                <div style={{ marginBottom: 20, padding: "10px 12px", borderRadius: 10, background: browseFilters.verifiedOnly ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${browseFilters.verifiedOnly ? "#93c5fd" : "#e2e8f0"}`, cursor: "pointer" }}
                                     onClick={() => setBrowseFilters(p => ({ ...p, verifiedOnly: !p.verifiedOnly }))}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 4, background: browseFilters.verifiedOnly ? "#2563eb" : "white", border: `2px solid ${browseFilters.verifiedOnly ? "#2563eb" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            {browseFilters.verifiedOnly && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: browseFilters.verifiedOnly ? "#1d4ed8" : "#374151" }}>Verified Only</div>
                                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Xe đã được kiểm định</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Type / Category — maps to category_id (Long) từ GET /categories */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Type</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                        {[{ id: "", name: "Tất cả", imgUrl: null, description: null, createdAt: null }, ...categories.map(c => ({ ...c, id: String(c.id) }))].map(c => {
                                            const active = browseFilters.category_id === String(c.id);
                                            return (
                                                <button key={String(c.id)}
                                                        onClick={() => setBrowseFilters(p => ({ ...p, category_id: p.category_id === String(c.id) ? "" : String(c.id) }))}
                                                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: "none", background: active ? "#eff6ff" : "transparent", color: active ? "#2563eb" : "#374151", fontWeight: active ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                                                    {/* imgUrl thumbnail nếu category có ảnh */}
                                                    {c.imgUrl ? (
                                                        <img src={c.imgUrl} alt={c.name} style={{ width: 18, height: 18, borderRadius: 4, objectFit: "cover", flexShrink: 0, border: "1px solid #e2e8f0" }}
                                                             onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                                                    ) : (
                                                        <div style={{ width: 7, height: 7, borderRadius: "50%", border: `2px solid ${active ? "#2563eb" : "#cbd5e1"}`, background: active ? "#2563eb" : "transparent", flexShrink: 0, marginLeft: 2 }}/>
                                                    )}
                                                    <span style={{ flex: 1 }}>{c.name}</span>
                                                    {active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Price Range — maps to price_min / price_max */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Price Range (điểm)</div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <input type="number" placeholder="Min" value={browseFilters.price_min}
                                               onChange={e => setBrowseFilters(p => ({ ...p, price_min: e.target.value }))}
                                               style={{ width: "50%", padding: "7px 8px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none" }}/>
                                        <input type="number" placeholder="Max" value={browseFilters.price_max}
                                               onChange={e => setBrowseFilters(p => ({ ...p, price_max: e.target.value }))}
                                               style={{ width: "50%", padding: "7px 8px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none" }}/>
                                    </div>
                                </div>

                                {/* Min Year — maps to min_year */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Năm sản xuất từ</div>
                                    <input type="number" placeholder="VD: 2018" value={browseFilters.min_year}
                                           onChange={e => setBrowseFilters(p => ({ ...p, min_year: e.target.value }))}
                                           style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}/>
                                </div>

                                {/* Sort by rating toggle */}
                                <div style={{ padding: "10px 12px", borderRadius: 10, background: browseFilters.sort_by_rating ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${browseFilters.sort_by_rating ? "#93c5fd" : "#e2e8f0"}`, cursor: "pointer" }}
                                     onClick={() => setBrowseFilters(p => ({ ...p, sort_by_rating: !p.sort_by_rating }))}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 4, background: browseFilters.sort_by_rating ? "#2563eb" : "white", border: `2px solid ${browseFilters.sort_by_rating ? "#2563eb" : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            {browseFilters.sort_by_rating && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: browseFilters.sort_by_rating ? "#1d4ed8" : "#374151" }}>Top Rated Sellers</div>
                                            <div style={{ fontSize: 11, color: "#94a3b8" }}>Sort theo đánh giá người bán</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Main Grid ── */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                                    <div>
                                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>Marketplace</h2>
                                        <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 2 }}>
                                            {browseLoading ? "Đang tải..." : `${browseTotal || browseResults.length} xe đang có mặt`}
                                        </p>
                                    </div>
                                    {/* Keyword search */}
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={browseFilters.keyword}
                                            onChange={e => setBrowseFilters(p => ({ ...p, keyword: e.target.value }))}
                                            style={{
                                                padding: "9px 14px 9px 36px",
                                                borderRadius: 10, border: "1.5px solid #e2e8f0",
                                                fontSize: 13, outline: "none", fontFamily: "inherit",
                                                background: "white", width: 200,
                                            }}
                                        />
                                        <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                    </div>
                                </div>

                                {browseLoading ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
                                        {[1,2,3,4,5,6].map(i => (
                                            <div key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", overflow: "hidden" }}>
                                                <div className="sk" style={{ height: 210, borderRadius: 0 }}/>
                                                <div style={{ padding: "16px" }}>
                                                    <div className="sk" style={{ height: 14, marginBottom: 8 }}/>
                                                    <div className="sk" style={{ height: 18, width: "40%", marginBottom: 10 }}/>
                                                    <div className="sk" style={{ height: 10, width: "60%" }}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : browseResults.length === 0 ? (
                                    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "60px 24px", textAlign: "center" }}>
                                        <Bike size={32} color="#cbd5e1" style={{ margin: "0 auto 12px" }}/>
                                        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 14 }}>Không tìm thấy xe phù hợp</p>
                                        <button onClick={() => setBrowseFilters(DEFAULT_BROWSE)} style={{ padding: "8px 20px", background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                            Xóa bộ lọc
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
                                        {browseResults.map((bike, i) => (
                                            <BikeCard
                                                key={bike.id} bike={bike} index={i}
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
    const isVerified = bike.inspectionStatus === "APPROVED";

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
        <div
            className="bike-card"
            style={{ animationDelay: `${index * 0.04}s` }}
            onClick={() => { window.location.href = `/bikes/${bike.id}`; }}
        >
            {/* Image */}
            <div style={{ height: 210, background: "linear-gradient(135deg, #f8faff, #eef2ff)", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {img ? (
                    <img src={img} alt={bike.title}
                         style={{ width: "100%", height: "100%", objectFit: "cover" }}
                         onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <ImageIcon size={32} color="#c7d2e8" />
                        <span style={{ fontSize: 11.5, color: "#c7d2e8" }}>Chưa có ảnh</span>
                    </div>
                )}

                {/* Verified / condition badge — top left */}
                {isVerified ? (
                    <div style={{
                        position: "absolute", top: 12, left: 12,
                        display: "flex", alignItems: "center", gap: 5,
                        background: "#16a34a", color: "white",
                        padding: "4px 10px", borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(22,163,74,.35)",
                    }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Verified
                    </div>
                ) : condM ? (
                    <div className={condM.cls} style={{
                        position: "absolute", top: 12, left: 12,
                        padding: "4px 10px", borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                    }}>
                        {condM.label}
                    </div>
                ) : null}

                {/* Wishlist btn — top right */}
                <button className="wish-btn" onClick={toggleWish} disabled={wishing}>
                    <Heart size={15} color={wished ? "#e11d48" : "#94a3b8"} fill={wished ? "#e11d48" : "none"} />
                </button>
            </div>

            {/* Info */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>

                {/* Title */}
                <h3 style={{
                    fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6,
                    lineHeight: 1.3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                    {bike.title ?? "Không có tên"}
                </h3>

                {/* Price */}
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2563eb", letterSpacing: "-0.5px", marginBottom: 12 }}>
                    {fmtPrice(price)}
                </div>

                {/* Tags row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {bike.bikeType && (
                        <span style={{ padding: "3px 9px", borderRadius: 6, background: "#f1f5f9", color: "#374151", fontSize: 11.5, fontWeight: 600, border: "1px solid #e2e8f0" }}>
                            {bike.bikeType}
                        </span>
                    )}
                    {condM && !isVerified && (
                        <span style={{ padding: "3px 9px", borderRadius: 6, background: "#f1f5f9", color: "#374151", fontSize: 11.5, fontWeight: 600, border: "1px solid #e2e8f0" }}>
                            {condM.label}
                        </span>
                    )}
                    {bike.year && (
                        <span style={{ padding: "3px 9px", borderRadius: 6, background: "#f1f5f9", color: "#374151", fontSize: 11.5, fontWeight: 600, border: "1px solid #e2e8f0" }}>
                            {bike.year}
                        </span>
                    )}
                </div>

                {/* Location + rating */}
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} color="#94a3b8" />
                        <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                            {bike.location && bike.location !== "Not specified" ? bike.location : "Việt Nam"}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>4.8</span>
                    </div>
                </div>
            </div>
        </div>
    );
}