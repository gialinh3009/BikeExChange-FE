import { useState, useEffect, useCallback } from "react";
import {
    Bike, Heart, ShoppingBag, Truck, LogOut, Search, Bell,
    Sparkles, ArrowRight, Star, Eye, Wallet, Settings, Package,
    ChevronDown, X, SlidersHorizontal, RotateCcw, MapPin, Image,
} from "lucide-react";
import { Link } from "react-router-dom";
import WishList from "./WishList";
import WalletPage from "./WalletPage";
import { getBuyerListAPI } from "../../services/Buyer/BuyerList";
import { addToWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";

// ─── Types — match với BE response ───────────────────────────────────────────
interface MediaItem {
    url: string;
    type: string;
    sortOrder: number;
}

interface BikeItem {
    id: number;
    title?: string;
    brand?: string;
    model?: string;
    year?: number;
    pricePoints?: number;        // giá tính bằng points
    price?: number;              // fallback nếu BE đổi field
    condition?: string;          // "Like New" | "Good" | "Fair"
    bikeType?: string;           // "Hybrid" | "Mountain" | ...
    status?: string;             // "AVAILABLE" | "SOLD" | "DRAFT"
    inspectionStatus?: string;
    location?: string;
    views?: number;
    mileage?: number;
    sellerId?: number;
    media?: MediaItem[];
}

interface Category {
    id: number;
    name: string;
    description?: string;
    imgUrl?: string;
}

interface FilterState {
    keyword:     string;
    category_id: string;
    frame_size:  string;
    status:      string;
    price_min:   string;
    price_max:   string;
    min_year:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BIKE_TYPES  = ["Hybrid", "Mountain", "Road", "City", "Folding", "BMX"];
const FRAME_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const CONDITIONS  = [
    { value: "Like New", label: "Như mới"      },
    { value: "Good",     label: "Tốt"          },
    { value: "Fair",     label: "Khá"          },
    { value: "Poor",     label: "Cần bảo dưỡng"},
];
const STATUSES = [
    { value: "AVAILABLE", label: "Đang bán"  },
    { value: "SOLD",      label: "Đã bán"    },
    { value: "DRAFT",     label: "Bản nháp"  },
];
const PRICE_RANGES = [
    { label: "Dưới 5 triệu",  min: "",         max: "5000000"  },
    { label: "5 – 10 triệu",  min: "5000000",  max: "10000000" },
    { label: "10 – 20 triệu", min: "10000000", max: "20000000" },
    { label: "Trên 20 triệu", min: "20000000", max: ""         },
];
const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

const DEFAULT_FILTERS: FilterState = {
    keyword: "", category_id: "", frame_size: "",
    status: "", price_min: "", price_max: "", min_year: "",
};

const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const navItems = [
    { id: "home",     icon: Bike,        label: "Trang chủ" },
    { id: "wishlist", icon: Heart,       label: "Yêu thích"  },
    { id: "orders",   icon: Package,     label: "Đơn hàng"   },
    { id: "wallet",   icon: Wallet,      label: "Ví tiền"    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BuyerPage() {
    const [activeTab,  setActiveTab]  = useState("home");
    const [bikes,      setBikes]      = useState<BikeItem[]>([]);
    const [loading,    setLoading]    = useState(false);
    const [filters,    setFilters]    = useState<FilterState>(DEFAULT_FILTERS);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterOpen, setFilterOpen] = useState(true);
    const [wishCount,  setWishCount]  = useState<number>(0);

    const user  = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const role  = user?.role as string | undefined;
    const isSeller = role === "SELLER";
    const roleLabel =
        role === "SELLER" ? "Người bán"
        : role === "BUYER" ? "Người mua"
        : "Thành viên";
    const token = localStorage.getItem("token") ?? "";

    // Fetch wishlist count
    useEffect(() => {
        const token = localStorage.getItem("token") ?? "";
        const BASE  = import.meta.env.VITE_API_BASE_URL as string;
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
    }, [activeTab]); // re-fetch khi switch tab về wishlist

    // Fetch categories: GET /categories → data.content[]
    useEffect(() => {
        const BASE  = import.meta.env.VITE_API_BASE_URL as string;
        const _tok  = localStorage.getItem("token") ?? "";
        fetch(`${BASE}/categories?page=0&size=50`, {
            headers: { Authorization: `Bearer ${_tok}` },
        })
            .then(r => r.json())
            .then(d => {
                const list = d?.data?.content ?? d?.data ?? d?.content ?? [];
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => setCategories([]));
    }, []);

    const fetchBikes = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { size: 12 };
            if (filters.keyword)     params.keyword     = filters.keyword;
            if (filters.category_id) params.category_id = filters.category_id;
            if (filters.frame_size)  params.frame_size  = filters.frame_size;
            if (filters.status)      params.status      = filters.status;
            if (filters.price_min)   params.price_min   = filters.price_min;
            if (filters.price_max)   params.price_max   = filters.price_max;
            if (filters.min_year)    params.min_year    = filters.min_year;

            const raw = await getBuyerListAPI(params);
            // getBuyerListAPI returns data.data — handle array or paginated
            const list = Array.isArray(raw) ? raw : raw?.content ?? raw?.items ?? [];
            setBikes(list);
        } catch {
            // mock data với đúng fields từ BE
            setBikes([
                { id:1, title:"Trek FX 3 Disc 2023",    brand:"Trek",        bikeType:"Hybrid",   year:2023, pricePoints:8500000,  condition:"Like New", status:"AVAILABLE", location:"Hà Nội",      media:[{url:"",type:"IMAGE",sortOrder:1}] },
                { id:2, title:"Giant Escape 3 2022",     brand:"Giant",       bikeType:"City",     year:2022, pricePoints:6200000,  condition:"Good",     status:"AVAILABLE", location:"TP.HCM",      media:[] },
                { id:3, title:"Specialized Sirrus X",    brand:"Specialized", bikeType:"Road",     year:2022, pricePoints:12000000, condition:"Like New", status:"AVAILABLE", location:"Đà Nẵng",     media:[] },
                { id:4, title:"Cannondale Quick 4 2021", brand:"Cannondale",  bikeType:"Hybrid",   year:2021, pricePoints:9800000,  condition:"Good",     status:"AVAILABLE", location:"Hà Nội",      media:[] },
                { id:5, title:"Scott Sub Cross 40",      brand:"Scott",       bikeType:"Mountain", year:2022, pricePoints:7400000,  condition:"Good",     status:"AVAILABLE", location:"TP.HCM",      media:[] },
                { id:6, title:"Merida Crossway 40-D",    brand:"Merida",      bikeType:"City",     year:2020, pricePoints:5900000,  condition:"Fair",     status:"AVAILABLE", location:"Bình Dương",  media:[] },
            ]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { if (activeTab === "home") void fetchBikes(); }, [activeTab, fetchBikes]);

    const setFilter = (key: keyof FilterState, val: string) =>
        setFilters(prev => ({ ...prev, [key]: val }));

    const setPriceRange = (min: string, max: string) =>
        setFilters(prev => ({ ...prev, price_min: min, price_max: max }));

    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div style={{ fontFamily:"'DM Sans','Nunito',sans-serif", minHeight:"100vh", background:"#f4f6fb", display:"flex" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-item{transition:all .15s;cursor:pointer;border-radius:10px}
        .nav-item:hover{background:rgba(255,255,255,.07)}
        .nav-item.active{background:rgba(255,255,255,.12)}
        .bike-card{transition:transform .2s,box-shadow .2s;cursor:pointer}
        .bike-card:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(0,0,0,.09)!important}
        .filter-select{appearance:none;border:1.5px solid #e8ecf4;border-radius:9px;padding:8px 30px 8px 11px;font-size:12.5px;color:#374151;background:white;cursor:pointer;width:100%;outline:none;transition:border .15s;font-family:inherit}
        .filter-select:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        .chip{display:inline-flex;align-items:center;padding:5px 11px;border-radius:18px;border:1.5px solid #e8ecf4;background:white;font-size:11.5px;font-weight:500;color:#64748b;cursor:pointer;transition:all .13s;white-space:nowrap}
        .chip:hover{border-color:#3b82f6;color:#3b82f6}
        .chip.on{border-color:#3b82f6;background:#eff6ff;color:#2563eb;font-weight:700}
        .search-box{border:none;background:transparent;outline:none;font-size:13.5px;color:#1e293b;width:100%;font-family:inherit}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        .pulse{animation:pulse 1.4s infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
        .fade-in{animation:fadeIn .3s ease}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#dde3ee;border-radius:3px}
        .condition-badge{display:inline-block;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700}
      `}</style>

            {/* ── Sidebar ── */}
            <aside style={{ width:224, background:"#0f172a", display:"flex", flexDirection:"column", padding:"22px 13px", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
                <Link to="/buyer" style={{ display:"flex", alignItems:"center", gap:8, marginBottom:26, paddingLeft:5, textDecoration:"none" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Bike size={16} color="white" />
                    </div>
                    <span style={{ color:"white", fontWeight:800, fontSize:15.5, letterSpacing:"-0.3px" }}>BikeExchange</span>
                </Link>

                <div style={{ background:"rgba(255,255,255,.06)", borderRadius:11, padding:"10px 11px", marginBottom:22, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"white", flexShrink:0 }}>
                        {(user?.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                        <div style={{ color:"white", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email || "Người dùng"}</div>
                        <div style={{ color:"#475569", fontSize:10.5, marginTop:1 }}>{roleLabel}</div>
                    </div>
                </div>

                <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
                    {navItems.map(item => (
                        <div key={item.id} className={`nav-item${activeTab===item.id?" active":""}`}
                             onClick={() => setActiveTab(item.id)}
                             style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", color:activeTab===item.id?"white":"#64748b", fontSize:13, fontWeight:activeTab===item.id?600:400 }}>
                            <item.icon size={15} />
                            {item.label}
                            {item.id==="wishlist" && wishCount > 0 && <span style={{ marginLeft:"auto", background:"#e11d48", color:"white", borderRadius:9, padding:"1px 6px", fontSize:10, fontWeight:700 }}>{wishCount}</span>}
                        </div>
                    ))}
                </nav>

                <button onClick={handleLogout}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 11px", borderRadius:9, border:"none", background:"transparent", color:"#475569", cursor:"pointer", fontSize:12.5, fontWeight:500, width:"100%" }}
                        onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.1)";e.currentTarget.style.color="#f87171"}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#475569"}}
                >
                    <LogOut size={14}/> Đăng xuất
                </button>
            </aside>

            {/* ── Main ── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
                {/* Topbar */}
                <header style={{ background:"white", borderBottom:"1px solid #e8ecf4", padding:"13px 22px", display:"flex", alignItems:"center", gap:11, position:"sticky", top:0, zIndex:20 }}>
                    <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"#f4f6fb", borderRadius:10, padding:"8px 13px", border:"1.5px solid #e8ecf4" }}>
                        <Search size={14} color="#94a3b8"/>
                        <input className="search-box" placeholder="Tìm xe theo tên, thương hiệu, loại xe..."
                               value={filters.keyword} onChange={e=>setFilter("keyword",e.target.value)}
                               onKeyDown={e=>e.key==="Enter"&&fetchBikes()} />
                        {filters.keyword && <button onClick={()=>setFilter("keyword","")} style={{border:"none",background:"none",cursor:"pointer",display:"flex",color:"#94a3b8"}}><X size={12}/></button>}
                    </div>
                    <button onClick={fetchBikes} style={{ padding:"8px 16px", background:"#1e293b", color:"white", border:"none", borderRadius:9, fontSize:12.5, fontWeight:700, cursor:"pointer" }}>Tìm</button>
                    {isSeller && (
                        <Link
                            to="/seller"
                            style={{
                                padding:"8px 16px",
                                background:"#3b82f6",
                                color:"white",
                                border:"none",
                                borderRadius:9,
                                fontSize:12.5,
                                fontWeight:700,
                                cursor:"pointer",
                                textDecoration:"none",
                            }}
                        >
                            Bài đăng
                        </Link>
                    )}
                    <button style={{ width:36, height:36, borderRadius:9, border:"1.5px solid #e8ecf4", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                        <Bell size={15} color="#64748b"/>
                        <span style={{ position:"absolute", top:7, right:7, width:6, height:6, background:"#ef4444", borderRadius:"50%", border:"1.5px solid white" }}/>
                    </button>
                    <button style={{ width:36, height:36, borderRadius:9, border:"1.5px solid #e8ecf4", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Settings size={15} color="#64748b"/>
                    </button>
                </header>

                <main style={{ flex:1, padding:"22px", overflowY:"auto" }}>

                    {/* HOME */}
                    {activeTab==="home" && (
                        <div className="fade-in">
                            {/* Hero */}
                            <div style={{ background:"linear-gradient(120deg,#1e3a5f,#0f172a 55%,#1e1b4b)", borderRadius:16, padding:"26px 30px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", overflow:"hidden" }}>
                                <div style={{ position:"absolute", right:-20, top:-20, width:180, height:180, borderRadius:"50%", background:"rgba(99,102,241,.07)" }}/>
                                <div style={{ position:"absolute", right:110, bottom:-40, width:120, height:120, borderRadius:"50%", background:"rgba(59,130,246,.08)" }}/>
                                <div style={{ position:"relative", zIndex:1 }}>
                                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(59,130,246,.18)", borderRadius:18, padding:"3px 10px", marginBottom:10 }}>
                                        <Sparkles size={11} color="#60a5fa"/><span style={{ color:"#60a5fa", fontSize:11, fontWeight:600 }}>Gợi ý cho bạn</span>
                                    </div>
                                    <h1 style={{ color:"white", fontSize:24, fontWeight:800, lineHeight:1.25, marginBottom:7 }}>Xin chào, {user?.email?.split("@")[0]||"bạn"} 👋</h1>
                                    <p style={{ color:"#64748b", fontSize:13, maxWidth:360, lineHeight:1.6 }}>Khám phá xe đạp chất lượng, được kiểm định rõ ràng.</p>
                                    <div style={{ display:"flex", gap:8, marginTop:16 }}>
                                        <button style={{ background:"#3b82f6", color:"white", border:"none", borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>Khám phá <ArrowRight size={12}/></button>
                                        <button onClick={()=>setActiveTab("wishlist")} style={{ background:"rgba(255,255,255,.07)", color:"white", border:"1px solid rgba(255,255,255,.12)", borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><Heart size={12}/> Yêu thích</button>
                                    </div>
                                </div>
                                <div style={{ position:"relative", zIndex:1, display:"flex", gap:20 }}>
                                    {[{v:"2.4K+",l:"Xe đã bán"},{v:"1.8K+",l:"Người dùng"},{v:"99%",l:"Hài lòng"}].map(s=>(
                                        <div key={s.l} style={{ textAlign:"center" }}>
                                            <div style={{ color:"white", fontSize:19, fontWeight:800 }}>{s.v}</div>
                                            <div style={{ color:"#475569", fontSize:10.5, marginTop:3 }}>{s.l}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:13, marginBottom:20 }}>
                                {[
                                    { label:"Đơn đã mua",      value:"5",  icon:ShoppingBag, bg:"#eff6ff", color:"#2563eb", trend:"+2 tháng này"   },
                                    { label:"Yêu thích",        value:String(wishCount), icon:Heart,       bg:"#fff1f2", color:"#e11d48", trend:""       },
                                    { label:"Đang vận chuyển",  value:"1",  icon:Truck,       bg:"#fffbeb", color:"#d97706", trend:"Hôm nay"        },
                                    { label:"Đã xem",           value:"38", icon:Eye,         bg:"#f0fdf4", color:"#16a34a", trend:"Tuần này"       },
                                ].map(s=>(
                                    <div key={s.label} style={{ background:"white", borderRadius:13, padding:"16px", border:"1.5px solid #e8ecf4", transition:"transform .18s,box-shadow .18s" }}
                                         onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.07)"}}
                                         onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                                        <div style={{ width:38, height:38, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                                            <s.icon size={18} color={s.color}/>
                                        </div>
                                        <div style={{ fontSize:22, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{s.value}</div>
                                        <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>{s.label}</div>
                                        <div style={{ fontSize:11, color:s.color, marginTop:5, fontWeight:500 }}>{s.trend}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Filter + Grid */}
                            <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>

                                {/* ── Filter Panel ── */}
                                <div style={{ width:232, flexShrink:0, background:"white", borderRadius:14, border:"1.5px solid #e8ecf4", overflow:"hidden", position:"sticky", top:76 }}>
                                    <div style={{ padding:"14px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                            <SlidersHorizontal size={14} color="#3b82f6"/>
                                            <span style={{ fontSize:13.5, fontWeight:700, color:"#0f172a" }}>Bộ lọc</span>
                                            {activeFilterCount>0 && <span style={{ background:"#3b82f6", color:"white", borderRadius:9, padding:"1px 7px", fontSize:10.5, fontWeight:700 }}>{activeFilterCount}</span>}
                                        </div>
                                        <div style={{ display:"flex", gap:5 }}>
                                            {activeFilterCount>0 && (
                                                <button onClick={resetFilters} style={{ border:"none", background:"#fff1f2", color:"#e11d48", borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                                                    <RotateCcw size={10}/> Xóa
                                                </button>
                                            )}
                                            <button onClick={()=>setFilterOpen(v=>!v)} style={{ border:"none", background:"#f4f6fb", borderRadius:6, padding:"3px 7px", cursor:"pointer", display:"flex" }}>
                                                <ChevronDown size={13} color="#64748b" style={{ transform:filterOpen?"rotate(180deg)":"none", transition:"transform .2s" }}/>
                                            </button>
                                        </div>
                                    </div>

                                    {filterOpen && (
                                        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:16 }}>

                                            {/* Loại xe → category_id → GET /categories → data.content[] */}
                                            <Fsec label="Loại xe">
                                                <div style={{ position:"relative" }}>
                                                    <select className="filter-select" value={filters.category_id} onChange={e=>setFilter("category_id",e.target.value)}>
                                                        <option value="">Tất cả loại</option>
                                                        {categories.length>0
                                                            ? categories.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)
                                                            : <option value="" disabled>Đang tải...</option>
                                                        }
                                                    </select>
                                                    <ChevronDown size={12} color="#94a3b8" style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                                                </div>
                                            </Fsec>

                                            {/* Loại xe đạp → bikeType (dùng frame_size param tạm thời, hoặc dùng keyword) */}
                                            <Fsec label="Kiểu xe">
                                                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                                    <button className={`chip${filters.frame_size===""?" on":""}`} onClick={()=>setFilter("frame_size","")}>Tất cả</button>
                                                    {BIKE_TYPES.map(t=>(
                                                        <button key={t} className={`chip${filters.frame_size===t?" on":""}`} onClick={()=>setFilter("frame_size",filters.frame_size===t?"":t)}>{t}</button>
                                                    ))}
                                                </div>
                                            </Fsec>

                                            {/* Tình trạng → status */}
                                            <Fsec label="Tình trạng">
                                                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                                    <button className={`chip${filters.status===""?" on":""}`} onClick={()=>setFilter("status","")}>Tất cả</button>
                                                    {STATUSES.map(s=>(
                                                        <button key={s.value} className={`chip${filters.status===s.value?" on":""}`} onClick={()=>setFilter("status",filters.status===s.value?"":s.value)}>{s.label}</button>
                                                    ))}
                                                </div>
                                            </Fsec>

                                            {/* Độ mới → condition (filter client-side vì BE chưa có param) */}
                                            <Fsec label="Độ mới">
                                                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                                    {CONDITIONS.map(c=>(
                                                        <button key={c.value} className="chip" style={{ justifyContent:"flex-start" }}>{c.label}</button>
                                                    ))}
                                                </div>
                                            </Fsec>

                                            {/* Khoảng giá → price_min / price_max */}
                                            <Fsec label="Khoảng giá">
                                                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                                                    <button className={`chip${filters.price_min===""&&filters.price_max===""?" on":""}`} onClick={()=>setPriceRange("","")}>Tất cả</button>
                                                    {PRICE_RANGES.map(r=>(
                                                        <button key={r.label} className={`chip${filters.price_min===r.min&&filters.price_max===r.max?" on":""}`}
                                                                onClick={()=>setPriceRange(r.min,r.max)}>{r.label}</button>
                                                    ))}
                                                </div>
                                                <div style={{ display:"flex", gap:5, marginTop:7 }}>
                                                    <input placeholder="Từ (đ)" value={filters.price_min} onChange={e=>setFilter("price_min",e.target.value)}
                                                           style={{ flex:1, border:"1.5px solid #e8ecf4", borderRadius:7, padding:"6px 8px", fontSize:11.5, outline:"none", fontFamily:"inherit" }}/>
                                                    <input placeholder="Đến (đ)" value={filters.price_max} onChange={e=>setFilter("price_max",e.target.value)}
                                                           style={{ flex:1, border:"1.5px solid #e8ecf4", borderRadius:7, padding:"6px 8px", fontSize:11.5, outline:"none", fontFamily:"inherit" }}/>
                                                </div>
                                            </Fsec>

                                            {/* Năm → min_year */}
                                            <Fsec label="Năm sản xuất (từ)">
                                                <div style={{ position:"relative" }}>
                                                    <select className="filter-select" value={filters.min_year} onChange={e=>setFilter("min_year",e.target.value)}>
                                                        <option value="">Tất cả năm</option>
                                                        {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                    <ChevronDown size={12} color="#94a3b8" style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                                                </div>
                                            </Fsec>

                                            {/* Kích thước khung → frame_size */}
                                            <Fsec label="Kích thước khung">
                                                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                                    {FRAME_SIZES.map(s=>(
                                                        <button key={s} className="chip">{s}</button>
                                                    ))}
                                                </div>
                                            </Fsec>

                                            <button onClick={fetchBikes} style={{ width:"100%", padding:"10px 0", background:"#0f172a", color:"white", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", transition:"background .15s" }}
                                                    onMouseEnter={e=>e.currentTarget.style.background="#2563eb"}
                                                    onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>
                                                Áp dụng bộ lọc
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Bike Grid ── */}
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                                        <div>
                                            <span style={{ fontSize:14.5, fontWeight:700, color:"#0f172a" }}>Xe đề xuất</span>
                                            <span style={{ fontSize:12.5, color:"#94a3b8", marginLeft:7 }}>({bikes.length} kết quả)</span>
                                        </div>
                                        {activeFilterCount>0 && (
                                            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:"#eff6ff", borderRadius:18, fontSize:11.5, color:"#2563eb", fontWeight:600 }}>
                                                <SlidersHorizontal size={10}/> {activeFilterCount} bộ lọc
                                                <button onClick={resetFilters} style={{ border:"none", background:"none", cursor:"pointer", color:"#2563eb", display:"flex" }}><X size={10}/></button>
                                            </div>
                                        )}
                                    </div>

                                    {loading ? (
                                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13 }}>
                                            {[1,2,3,4,5,6].map(i=>(
                                                <div key={i} style={{ borderRadius:13, border:"1.5px solid #e8ecf4", overflow:"hidden", background:"white" }}>
                                                    <div style={{ height:148, background:"#f4f6fb" }} className="pulse"/>
                                                    <div style={{ padding:13 }}>
                                                        <div style={{ height:10, background:"#eee", borderRadius:4, marginBottom:6, width:"45%" }} className="pulse"/>
                                                        <div style={{ height:14, background:"#eee", borderRadius:4, marginBottom:6 }} className="pulse"/>
                                                        <div style={{ height:17, background:"#eee", borderRadius:4, width:"38%" }} className="pulse"/>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : bikes.length===0 ? (
                                        <div style={{ background:"white", borderRadius:14, border:"1.5px solid #e8ecf4", padding:"44px 24px", textAlign:"center" }}>
                                            <Bike size={40} color="#e2e8f0" style={{ marginBottom:12 }}/>
                                            <h3 style={{ color:"#0f172a", fontWeight:700, fontSize:15, marginBottom:5 }}>Không tìm thấy xe</h3>
                                            <p style={{ color:"#94a3b8", fontSize:12.5 }}>Thử thay đổi bộ lọc.</p>
                                            <button onClick={resetFilters} style={{ marginTop:14, padding:"7px 16px", background:"#0f172a", color:"white", border:"none", borderRadius:8, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Xóa bộ lọc</button>
                                        </div>
                                    ) : (
                                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:13 }}>
                                            {bikes.map(bike=><BikeCard key={bike.id} bike={bike}/>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab==="wishlist" && <div className="fade-in"><WishList token={token} formatPrice={fmtPrice}/></div>}
                    {activeTab==="orders"   && <EmptyTab icon={<Package size={40} color="#e2e8f0"/>}  title="Đơn hàng của bạn"  sub="Chưa có đơn hàng nào."/>}
                    {activeTab==="wallet" && <div className="fade-in"><WalletPage/></div>}
                </main>
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Fsec({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.6px" }}>{label}</div>
            {children}
        </div>
    );
}

function EmptyTab({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
    return (
        <div className="fade-in">
            <div style={{ background:"white", borderRadius:14, border:"1.5px solid #e8ecf4", padding:40, textAlign:"center" }}>
                <div style={{ marginBottom:12 }}>{icon}</div>
                <h3 style={{ color:"#0f172a", fontWeight:700, fontSize:16, marginBottom:5 }}>{title}</h3>
                <p style={{ color:"#94a3b8", fontSize:13 }}>{sub}</p>
            </div>
        </div>
    );
}

// ─── BikeCard — dùng đúng fields từ BE ───────────────────────────────────────
function BikeCard({ bike }: { bike: BikeItem }) {
    const [wished,  setWished]  = useState(false);
    const [wishing, setWishing] = useState(false);

    const price = bike.pricePoints ?? bike.price ?? 0;
    const img   = bike.media?.[0]?.url;

    // condition badge color
    const condColor: Record<string, { bg: string; color: string }> = {
        "Like New": { bg:"#f0fdf4", color:"#16a34a" },
        "Good":     { bg:"#eff6ff", color:"#2563eb" },
        "Fair":     { bg:"#fffbeb", color:"#d97706" },
        "Poor":     { bg:"#fff1f2", color:"#e11d48" },
    };
    const cond = condColor[bike.condition ?? ""] ?? { bg:"#f4f6fb", color:"#64748b" };

    const toggleWish = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setWishing(true);
        try {
            if (wished) { await removeFromWishlistAPI(bike.id); } else { await addToWishlistAPI(bike.id); }
            setWished(!wished);
        } catch { setWished(!wished); }
        finally  { setWishing(false); }
    };

    return (
        <div className="bike-card" style={{ borderRadius:13, border:"1.5px solid #e8ecf4", overflow:"hidden", background:"white", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            {/* Image */}
            <div style={{ height:148, background:"linear-gradient(135deg,#f0f4ff,#e8effe)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                {img
                    ? <img src={img} alt={bike.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                    : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                        <Image size={28} color="#c7d2e8"/>
                        <span style={{ fontSize:10, color:"#c7d2e8" }}>Chưa có ảnh</span>
                    </div>
                }
                {/* Condition badge */}
                {bike.condition && (
                    <span className="condition-badge" style={{ position:"absolute", top:9, left:9, background:cond.bg, color:cond.color }}>{bike.condition}</span>
                )}
                {/* bikeType badge */}
                {bike.bikeType && (
                    <span style={{ position:"absolute", bottom:9, left:9, background:"rgba(255,255,255,.92)", color:"#374151", borderRadius:5, padding:"2px 7px", fontSize:10, fontWeight:600, border:"1px solid #e8ecf4" }}>{bike.bikeType}</span>
                )}
                <button onClick={toggleWish} disabled={wishing} style={{ position:"absolute", top:9, right:9, width:29, height:29, borderRadius:7, border:"none", cursor:"pointer", background:wished?"#fff0f3":"rgba(255,255,255,.9)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 6px rgba(0,0,0,.09)", transition:"all .15s" }}>
                    <Heart size={13} color={wished?"#e11d48":"#94a3b8"} fill={wished?"#e11d48":"none"}/>
                </button>
            </div>

            {/* Info */}
            <div style={{ padding:"12px 13px" }}>
                {/* Brand + year */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:10.5, color:"#94a3b8", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.3px" }}>{bike.brand ?? "—"}</span>
                    {bike.year && <span style={{ fontSize:10.5, color:"#94a3b8" }}>{bike.year}</span>}
                </div>
                {/* Title */}
                <h3 style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:6, lineHeight:1.35, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {bike.title ?? "Không có tên"}
                </h3>
                {/* Location */}
                {bike.location && bike.location!=="Not specified" && (
                    <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:7 }}>
                        <MapPin size={10} color="#94a3b8"/>
                        <span style={{ fontSize:10.5, color:"#94a3b8" }}>{bike.location}</span>
                    </div>
                )}
                {/* Price + rating */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:"#2563eb" }}>{fmtPrice(price)}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b"/>
                        <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>4.8</span>
                    </div>
                </div>
                <button style={{ width:"100%", padding:"8px 0", background:"#0f172a", color:"white", border:"none", borderRadius:8, fontSize:12.5, fontWeight:600, cursor:"pointer", transition:"background .15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#2563eb"}
                        onMouseLeave={e=>e.currentTarget.style.background="#0f172a"}>
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}