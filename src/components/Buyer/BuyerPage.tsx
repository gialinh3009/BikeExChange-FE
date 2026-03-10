import { useState, useEffect, useCallback } from "react";
import {
    Bike, Heart, Search, Star, Wallet, Package,
    ChevronDown, X, SlidersHorizontal, RotateCcw, MapPin, Image, Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import WishList from "./WishList";
import WalletPage from "./WalletPage";
import { getBuyerListAPI } from "../../services/Buyer/BuyerList";
import { addToWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";

// ─── Types ────────────────────────────────────────────────────────────────
interface MediaItem {
    url: string;
    type: string;
    sortOrder: number;
}

interface BikeItem {
    id: number;
    title: string;
    brand?: string;
    model?: string;
    year?: number;
    pricePoints: number;
    condition?: string;
    bikeType?: string;
    status: string;
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
    keyword: string;
    category_id: string;
    status: string;
    inspectionStatus: string;
    price_min: string;
    price_max: string;
    min_year: string;
}

const PRICE_RANGES = [
    { label: "Dưới 5 triệu", min: "", max: "5000000" },
    { label: "5 – 10 triệu", min: "5000000", max: "10000000" },
    { label: "10 – 20 triệu", min: "10000000", max: "20000000" },
    { label: "Trên 20 triệu", min: "20000000", max: "" },
];
const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

const DEFAULT_FILTERS: FilterState = {
    keyword: "",
    category_id: "",
    status: "",
    inspectionStatus: "",
    price_min: "",
    price_max: "",
    min_year: "",
};

const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const conditionColor: Record<string, { bg: string; color: string }> = {
    "Like New": { bg: "#f0fdf4", color: "#16a34a" },
    "Good": { bg: "#eff6ff", color: "#2563eb" },
    "Fair": { bg: "#fffbeb", color: "#d97706" },
};

const navItems = [
    { id: "home", icon: Bike, label: "Trang chủ" },
    { id: "wishlist", icon: Heart, label: "Yêu thích" },
    { id: "orders", icon: Package, label: "Đơn hàng" },
    { id: "wallet", icon: Wallet, label: "Ví tiền" },
    { id: "settings", icon: Settings, label: "Cài đặt", divider: true },
];

// ─── Main ────────────────────────────────────────────────────────────────
export default function BuyerPage() {
    const [activeTab, setActiveTab] = useState("home");
    const [bikes, setBikes] = useState<BikeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterOpen, setFilterOpen] = useState(true);
    const [wishCount, setWishCount] = useState<number>(0);

    const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const role = user?.role as string | undefined;
    const isSeller = role === "SELLER";
    const roleLabel =
        role === "SELLER" ? "Người bán"
            : role === "BUYER" ? "Người mua"
                : "Thành viên";
    const token = localStorage.getItem("token") ?? "";

    // Fetch wishlist count
    useEffect(() => {
        const BASE = import.meta.env.VITE_API_BASE_URL as string;
        fetch(`${BASE}/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => {
                const list = Array.isArray(d) ? d : Array.isArray(d?.data?.content) ? d.data.content : Array.isArray(d?.data) ? d.data : Array.isArray(d?.content) ? d.content : [];
                setWishCount(list.length);
            })
            .catch(() => { /* ignore */ });
    }, [activeTab, token]);

    // Fetch categories
    useEffect(() => {
        const BASE = import.meta.env.VITE_API_BASE_URL as string;
        const tok = localStorage.getItem("token") ?? "";
        fetch(`${BASE}/categories?page=0&size=50`, {
            headers: { Authorization: `Bearer ${tok}` },
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
            const params = {
                ...filters,
                size: 12,
                sort_by_rating: true,
            };
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (!params[key as keyof typeof params]) {
                    delete params[key as keyof typeof params];
                }
            });

            const raw = await getBuyerListAPI(params);
            const list = raw?.content ?? [];
            setBikes(list);
        } catch (e) {
            console.error("Error fetching bikes:", e);
            setBikes([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (activeTab === "home") {
            void fetchBikes();
        }
    }, [activeTab, fetchBikes]);

    const setFilter = (key: keyof FilterState, val: string) =>
        setFilters(prev => ({ ...prev, [key]: val }));

    const setPriceRange = (min: string, max: string) =>
        setFilters(prev => ({ ...prev, price_min: min, price_max: max }));

    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const activeFilterCount = Object.values(filters).filter(v => v !== "" && v !== "VERIFIED").length;

    return (
        <div style={{
            fontFamily: "'DM Sans','Nunito',sans-serif",
            minHeight: "100vh",
            background: "#f4f6fb",
            display: "flex",
        }}>
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
            <aside style={{
                width: 224,
                background: "#0f172a",
                display: "flex",
                flexDirection: "column",
                padding: "22px 13px",
                position: "sticky",
                top: 0,
                height: "100vh",
                flexShrink: 0,
            }}>
                <Link to="/home" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 26,
                    paddingLeft: 5,
                    textDecoration: "none",
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <Bike size={16} color="white" />
                    </div>
                    <span style={{
                        color: "white",
                        fontWeight: 800,
                        fontSize: 15.5,
                        letterSpacing: "-0.3px",
                    }}>BikeExchange</span>
                </Link>

                <div style={{
                    background: "rgba(255,255,255,.06)",
                    borderRadius: 11,
                    padding: "10px 11px",
                    marginBottom: 22,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "white",
                        flexShrink: 0,
                    }}>
                        {(user?.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>{user?.email || "Người dùng"}</div>
                        <div style={{ color: "#475569", fontSize: 10.5, marginTop: 1 }}>{roleLabel}</div>
                    </div>
                </div>

                <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item${activeTab === item.id ? " active" : ""}`}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                                padding: "9px 11px",
                                color: activeTab === item.id ? "white" : "#64748b",
                                fontSize: 13,
                                fontWeight: activeTab === item.id ? 600 : 400,
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                width: "100%",
                            }}
                        >
                            <item.icon size={15} />
                            {item.label}
                            {item.id === "wishlist" && wishCount > 0 && (
                                <span style={{
                                    marginLeft: "auto",
                                    background: "#e11d48",
                                    color: "white",
                                    borderRadius: 9,
                                    padding: "1px 6px",
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}>
                                    {wishCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ── Main ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Topbar */}
                <header style={{
                    background: "white",
                    borderBottom: "1px solid #e8ecf4",
                    padding: "13px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                }}>
                    <div style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#f4f6fb",
                        borderRadius: 10,
                        padding: "8px 13px",
                        border: "1.5px solid #e8ecf4",
                    }}>
                        <Search size={14} color="#94a3b8" />
                        <input
                            className="search-box"
                            placeholder="Tìm xe theo tên, thương hiệu, loại xe..."
                            value={filters.keyword}
                            onChange={e => setFilter("keyword", e.target.value)}
                            onKeyDown={e => e.key === "Enter" && void fetchBikes()}
                        />
                        {filters.keyword && (
                            <button
                                onClick={() => setFilter("keyword", "")}
                                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", color: "#94a3b8" }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => void fetchBikes()}
                            style={{
                                padding: "8px 16px",
                                background: "#1e293b",
                                color: "white",
                                border: "none",
                                borderRadius: 9,
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: "pointer",
                            }}>
                        Tìm
                    </button>
                    {isSeller && (
                        <Link to="/seller" style={{
                            padding: "8px 16px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 9,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "none",
                        }}>
                            Bài đăng
                        </Link>
                    )}
                </header>

                <main style={{ flex: 1, padding: "22px", overflowY: "auto" }}>
                    {activeTab === "home" && (
                        <div className="fade-in">
                            {/* Filter + Grid */}
                            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                {/* ── Filter Panel ── */}
                                <div style={{
                                    width: 232,
                                    flexShrink: 0,
                                    background: "white",
                                    borderRadius: 14,
                                    border: "1.5px solid #e8ecf4",
                                    overflow: "hidden",
                                    position: "sticky",
                                    top: 76,
                                }}>
                                    <div style={{
                                        padding: "14px 16px",
                                        borderBottom: "1px solid #f1f5f9",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <SlidersHorizontal size={14} color="#3b82f6" />
                                            <span style={{
                                                fontSize: 13.5,
                                                fontWeight: 700,
                                                color: "#0f172a",
                                            }}>Bộ lọc</span>
                                            {activeFilterCount > 0 && (
                                                <span style={{
                                                    background: "#3b82f6",
                                                    color: "white",
                                                    borderRadius: 9,
                                                    padding: "1px 7px",
                                                    fontSize: 10.5,
                                                    fontWeight: 700,
                                                }}>
                                                    {activeFilterCount}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 5 }}>
                                            {activeFilterCount > 0 && (
                                                <button onClick={resetFilters}
                                                        style={{
                                                            border: "none",
                                                            background: "#fff1f2",
                                                            color: "#e11d48",
                                                            borderRadius: 6,
                                                            padding: "3px 8px",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 3,
                                                        }}>
                                                    <RotateCcw size={10} /> Xóa
                                                </button>
                                            )}
                                            <button onClick={() => setFilterOpen(v => !v)}
                                                    style={{
                                                        border: "none",
                                                        background: "#f4f6fb",
                                                        borderRadius: 6,
                                                        padding: "3px 7px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                    }}>
                                                <ChevronDown size={13} color="#64748b"
                                                             style={{
                                                                 transform: filterOpen ? "rotate(180deg)" : "none",
                                                                 transition: "transform .2s",
                                                             }} />
                                            </button>
                                        </div>
                                    </div>

                                    {filterOpen && (
                                        <div style={{
                                            padding: "14px 16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 16,
                                        }}>
                                            {/* Category */}
                                            <div>
                                                <div style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: "#374151",
                                                    marginBottom: 7,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.6px",
                                                }}>
                                                    Loại xe
                                                </div>
                                                <div style={{ position: "relative" }}>
                                                    <select
                                                        className="filter-select"
                                                        value={filters.category_id}
                                                        onChange={e => setFilter("category_id", e.target.value)}
                                                    >
                                                        <option value="">Tất cả loại</option>
                                                        {categories.length > 0
                                                            ? categories.map(c => (
                                                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                                                            ))
                                                            : <option value="" disabled>Đang tải...</option>
                                                        }
                                                    </select>
                                                    <ChevronDown size={12} color="#94a3b8"
                                                                 style={{
                                                                     position: "absolute",
                                                                     right: 9,
                                                                     top: "50%",
                                                                     transform: "translateY(-50%)",
                                                                     pointerEvents: "none",
                                                                 }} />
                                                </div>
                                            </div>

                                            {/* Inspection Status */}
                                            <div>
                                                <div style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: "#374151",
                                                    marginBottom: 7,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.6px",
                                                }}>
                                                    Trạng thái kiểm định
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                                    <button
                                                        className={`chip${filters.inspectionStatus === "" ? " on" : ""}`}
                                                        onClick={() => setFilter("inspectionStatus", "")}
                                                    >
                                                        Tất cả
                                                    </button>
                                                    <button
                                                        className={`chip${filters.inspectionStatus === "APPROVED" ? " on" : ""}`}
                                                        onClick={() => setFilter("inspectionStatus", filters.inspectionStatus === "APPROVED" ? "" : "APPROVED")}
                                                    >
                                                        ✓ Đã kiểm định
                                                    </button>
                                                    <button
                                                        className={`chip${filters.inspectionStatus === "REQUESTED" ? " on" : ""}`}
                                                        onClick={() => setFilter("inspectionStatus", filters.inspectionStatus === "REQUESTED" ? "" : "REQUESTED")}
                                                    >
                                                        ⏳ Chưa kiểm định
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Price Range */}
                                            <div>
                                                <div style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: "#374151",
                                                    marginBottom: 7,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.6px",
                                                }}>
                                                    Khoảng giá
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                                    <button
                                                        className={`chip${filters.price_min === "" && filters.price_max === "" ? " on" : ""}`}
                                                        onClick={() => setPriceRange("", "")}
                                                    >
                                                        Tất cả
                                                    </button>
                                                    {PRICE_RANGES.map(r => (
                                                        <button
                                                            key={r.label}
                                                            className={`chip${filters.price_min === r.min && filters.price_max === r.max ? " on" : ""}`}
                                                            onClick={() => setPriceRange(r.min, r.max)}
                                                        >
                                                            {r.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                                                    <input
                                                        placeholder="Từ (đ)"
                                                        value={filters.price_min}
                                                        onChange={e => setFilter("price_min", e.target.value)}
                                                        style={{
                                                            flex: 1,
                                                            border: "1.5px solid #e8ecf4",
                                                            borderRadius: 7,
                                                            padding: "6px 8px",
                                                            fontSize: 11.5,
                                                            outline: "none",
                                                            fontFamily: "inherit",
                                                        }}
                                                    />
                                                    <input
                                                        placeholder="Đến (đ)"
                                                        value={filters.price_max}
                                                        onChange={e => setFilter("price_max", e.target.value)}
                                                        style={{
                                                            flex: 1,
                                                            border: "1.5px solid #e8ecf4",
                                                            borderRadius: 7,
                                                            padding: "6px 8px",
                                                            fontSize: 11.5,
                                                            outline: "none",
                                                            fontFamily: "inherit",
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Year */}
                                            <div>
                                                <div style={{
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: "#374151",
                                                    marginBottom: 7,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.6px",
                                                }}>
                                                    Năm sản xuất (từ)
                                                </div>
                                                <div style={{ position: "relative" }}>
                                                    <select
                                                        className="filter-select"
                                                        value={filters.min_year}
                                                        onChange={e => setFilter("min_year", e.target.value)}
                                                    >
                                                        <option value="">Tất cả năm</option>
                                                        {YEARS.map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={12} color="#94a3b8"
                                                                 style={{
                                                                     position: "absolute",
                                                                     right: 9,
                                                                     top: "50%",
                                                                     transform: "translateY(-50%)",
                                                                     pointerEvents: "none",
                                                                 }} />
                                                </div>
                                            </div>

                                            <button onClick={() => void fetchBikes()}
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 0",
                                                        background: "#0f172a",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: 9,
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        transition: "background .15s",
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}
                                            >
                                                Áp dụng bộ lọc
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Bike Grid ── */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 14,
                                    }}>
                                        <div>
                                            <span style={{
                                                fontSize: 14.5,
                                                fontWeight: 700,
                                                color: "#0f172a",
                                            }}>
                                                Xe đề xuất
                                            </span>
                                            <span style={{
                                                fontSize: 12.5,
                                                color: "#94a3b8",
                                                marginLeft: 7,
                                            }}>
                                                ({bikes.length} kết quả)
                                            </span>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
                                            {[1, 2, 3, 4, 5, 6].map(i => (
                                                <div key={i}
                                                     style={{
                                                         borderRadius: 13,
                                                         border: "1.5px solid #e8ecf4",
                                                         overflow: "hidden",
                                                         background: "white",
                                                     }}>
                                                    <div style={{ height: 148, background: "#f4f6fb" }} className="pulse" />
                                                    <div style={{ padding: 13 }}>
                                                        <div style={{
                                                            height: 10,
                                                            background: "#eee",
                                                            borderRadius: 4,
                                                            marginBottom: 6,
                                                            width: "45%",
                                                        }} className="pulse" />
                                                        <div style={{
                                                            height: 14,
                                                            background: "#eee",
                                                            borderRadius: 4,
                                                            marginBottom: 6,
                                                        }} className="pulse" />
                                                        <div style={{
                                                            height: 17,
                                                            background: "#eee",
                                                            borderRadius: 4,
                                                            width: "38%",
                                                        }} className="pulse" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : bikes.length === 0 ? (
                                        <div style={{
                                            background: "white",
                                            borderRadius: 14,
                                            border: "1.5px solid #e8ecf4",
                                            padding: "44px 24px",
                                            textAlign: "center",
                                        }}>
                                            <Bike size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
                                            <h3 style={{
                                                color: "#0f172a",
                                                fontWeight: 700,
                                                fontSize: 15,
                                                marginBottom: 5,
                                            }}>
                                                Không tìm thấy xe
                                            </h3>
                                            <p style={{
                                                color: "#94a3b8",
                                                fontSize: 12.5,
                                            }}>
                                                Thử thay đổi bộ lọc.
                                            </p>
                                            <button onClick={resetFilters}
                                                    style={{
                                                        marginTop: 14,
                                                        padding: "7px 16px",
                                                        background: "#0f172a",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: 8,
                                                        fontSize: 12.5,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                    }}>
                                                Xóa bộ lọc
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
                                            {bikes.map(bike => <BikeCard key={bike.id} bike={bike} />)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "wishlist" && <div className="fade-in"><WishList token={token} formatPrice={fmtPrice} /></div>}
                    {activeTab === "orders" && (
                        <div className="fade-in" style={{
                            background: "white",
                            borderRadius: 14,
                            border: "1.5px solid #e8ecf4",
                            padding: "44px 24px",
                            textAlign: "center",
                        }}>
                            <Package size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
                            <h3 style={{
                                color: "#0f172a",
                                fontWeight: 700,
                                fontSize: 16,
                                marginBottom: 5,
                            }}>
                                Đơn hàng của bạn
                            </h3>
                            <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có đơn hàng nào.</p>
                        </div>
                    )}
                    {activeTab === "wallet" && <div className="fade-in"><WalletPage /></div>}

                    {activeTab === "settings" && (
                        <div className="fade-in" style={{ maxWidth: 600 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
                                Cài đặt
                            </h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {/* View Profile */}
                                <div style={{
                                    background: "white",
                                    borderRadius: 14,
                                    border: "1.5px solid #e8ecf4",
                                    padding: "18px 20px",
                                    cursor: "pointer",
                                    transition: "all .15s",
                                }}
                                     onMouseEnter={e => {
                                         e.currentTarget.style.borderColor = "#3b82f6";
                                         e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,.1)";
                                     }}
                                     onMouseLeave={e => {
                                         e.currentTarget.style.borderColor = "#e8ecf4";
                                         e.currentTarget.style.boxShadow = "none";
                                     }}
                                     onClick={() => window.location.href = "/profile"}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>
                                                Xem hồ sơ người dùng
                                            </h3>
                                            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                                                Xem và chỉnh sửa thông tin cá nhân của bạn
                                            </p>
                                        </div>
                                        <div style={{ fontSize: 20 }}>→</div>
                                    </div>
                                </div>

                                {/* Upgrade to Seller */}
                                {!isSeller && (
                                    <div style={{
                                        background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                                        borderRadius: 14,
                                        border: "1.5px solid #bbf7d0",
                                        padding: "18px 20px",
                                        cursor: "pointer",
                                        transition: "all .15s",
                                    }}
                                         onMouseEnter={e => {
                                             e.currentTarget.style.borderColor = "#16a34a";
                                             e.currentTarget.style.boxShadow = "0 4px 12px rgba(22,163,74,.15)";
                                         }}
                                         onMouseLeave={e => {
                                             e.currentTarget.style.borderColor = "#bbf7d0";
                                             e.currentTarget.style.boxShadow = "none";
                                         }}
                                         onClick={() => alert("Tính năng nâng cấp lên người bán sẽ sớm được phát hành")}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div>
                                                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#15803d", marginBottom: 5 }}>
                                                    📈 Nâng cấp lên người bán
                                                </h3>
                                                <p style={{ fontSize: 13, color: "#16a34a", margin: 0 }}>
                                                    Bạn có thể bắt đầu bán xe trên nền tảng của chúng tôi
                                                </p>
                                            </div>
                                            <div style={{ fontSize: 20, color: "#16a34a" }}>→</div>
                                        </div>
                                    </div>
                                )}

                                {/* Logout */}
                                <div style={{
                                    background: "#fff1f2",
                                    borderRadius: 14,
                                    border: "1.5px solid #fecdd3",
                                    padding: "18px 20px",
                                    cursor: "pointer",
                                    transition: "all .15s",
                                }}
                                     onMouseEnter={e => {
                                         e.currentTarget.style.borderColor = "#e11d48";
                                         e.currentTarget.style.boxShadow = "0 4px 12px rgba(225,29,72,.1)";
                                     }}
                                     onMouseLeave={e => {
                                         e.currentTarget.style.borderColor = "#fecdd3";
                                         e.currentTarget.style.boxShadow = "none";
                                     }}
                                     onClick={() => {
                                         localStorage.removeItem("token");
                                         localStorage.removeItem("user");
                                         window.location.href = "/login";
                                     }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e11d48", marginBottom: 5 }}>
                                                🚪 Đăng xuất
                                            </h3>
                                            <p style={{ fontSize: 13, color: "#f43f5e", margin: 0 }}>
                                                Thoát khỏi tài khoản của bạn
                                            </p>
                                        </div>
                                        <div style={{ fontSize: 20, color: "#e11d48" }}>→</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// ─── BikeCard ─────────────────────────────────────────────────────────────
function BikeCard({ bike }: { bike: BikeItem }) {
    const [wished, setWished] = useState(false);
    const [wishing, setWishing] = useState(false);

    const price = bike.pricePoints ?? 0;
    const img = bike.media?.[0]?.url;

    const cond = conditionColor[bike.condition ?? ""] ?? { bg: "#f4f6fb", color: "#64748b" };

    const toggleWish = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setWishing(true);

        const perform = async () => {
            try {
                if (wished) {
                    await removeFromWishlistAPI(bike.id);
                } else {
                    await addToWishlistAPI(bike.id);
                }
                setWished(!wished);
            } catch {
                setWished(!wished);
            } finally {
                setWishing(false);
            }
        };

        void perform();
    };

    return (
        <div className="bike-card" style={{
            borderRadius: 13,
            border: "1.5px solid #e8ecf4",
            overflow: "hidden",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        }}>
            {/* Image */}
            <div style={{
                height: 148,
                background: "linear-gradient(135deg,#f0f4ff,#e8effe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}>
                {img ? (
                    <img src={img} alt={bike.title}
                         style={{ width: "100%", height: "100%", objectFit: "cover" }}
                         onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                    }}>
                        <Image size={28} color="#c7d2e8" />
                        <span style={{ fontSize: 10, color: "#c7d2e8" }}>Chưa có ảnh</span>
                    </div>
                )}

                {/* Condition badge */}
                {bike.condition && (
                    <span className="condition-badge" style={{
                        position: "absolute",
                        top: 9,
                        left: 9,
                        background: cond.bg,
                        color: cond.color,
                    }}>
                        {bike.condition}
                    </span>
                )}

                {/* Bike Type badge */}
                {bike.bikeType && (
                    <span style={{
                        position: "absolute",
                        bottom: 9,
                        left: 9,
                        background: "rgba(255,255,255,.92)",
                        color: "#374151",
                        borderRadius: 5,
                        padding: "2px 7px",
                        fontSize: 10,
                        fontWeight: 600,
                        border: "1px solid #e8ecf4",
                    }}>
                        {bike.bikeType}
                    </span>
                )}

                {/* Wishlist button */}
                <button onClick={toggleWish} disabled={wishing} style={{
                    position: "absolute",
                    top: 9,
                    right: 9,
                    width: 29,
                    height: 29,
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    background: wished ? "#fff0f3" : "rgba(255,255,255,.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,.09)",
                    transition: "all .15s",
                }}>
                    <Heart size={13} color={wished ? "#e11d48" : "#94a3b8"}
                           fill={wished ? "#e11d48" : "none"} />
                </button>
            </div>

            {/* Info */}
            <div style={{ padding: "12px 13px" }}>
                {/* Brand + year */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 3,
                }}>
                    <span style={{
                        fontSize: 10.5,
                        color: "#94a3b8",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                    }}>
                        {bike.brand ?? "—"}
                    </span>
                    {bike.year && (
                        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>{bike.year}</span>
                    )}
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 6,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}>
                    {bike.title ?? "Không có tên"}
                </h3>

                {/* Location */}
                {bike.location && bike.location !== "Not specified" && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        marginBottom: 7,
                    }}>
                        <MapPin size={10} color="#94a3b8" />
                        <span style={{ fontSize: 10.5, color: "#94a3b8" }}>{bike.location}</span>
                    </div>
                )}

                {/* Price + rating */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#2563eb" }}>
                        {fmtPrice(price)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Star size={11} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>4.8</span>
                    </div>
                </div>

                <button onClick={() => window.location.href = `/bikes/${bike.id}`}
                        style={{
                            width: "100%",
                            padding: "8px 0",
                            background: "#0f172a",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                        onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}>
                    Xem chi tiết
                </button>
            </div>
        </div>
    );
}