import { useState, useEffect } from "react";
import { Bike, Heart, Wallet, Package, Settings, ChevronLeft, ChevronRight, TrendingUp, LogOut, User, AlertTriangle, Star } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import WalletPage from "./WalletPage";
import UpgradeToSellerModal from "./UpgradeToSellerModal";
import { getMyPurchasesAPI, getOrderAPI } from "../../services/Buyer/Orderservice";
import { getWishlistAPI, removeFromWishlistAPI } from "../../services/Buyer/wishlistService";
import OrdersTab from "./OrdersTab";
import DisputesTab from "./DisputesTab";
import { getWalletAPI } from "../../services/Buyer/walletService";
import Header from "../home/Header";
import WishList from "./WishList";


interface WishlistItem {
    id: number;
    bikeId?: number;
    bike?: {
        id: number; title?: string; name?: string;
        pricePoints?: number; price?: number; brand?: string;
        media?: { url: string; type: string }[];
    };
}
interface OrderItem {
    id: number;
    bikeId?: number;
    bikeTitle?: string;
    amountPoints?: number;
    totalAmount?: number;
    status?: string;
    createdAt?: string;
    buyerId?: number;
    sellerId?: number;
}
interface WalletData { availablePoints: number; }


const fmtPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);


export default function BuyerPage() {
    const location      = useLocation();
    const navigate      = useNavigate();
    const locationState = location.state as { tab?: string; walletTab?: string } | null;
    const isValidTab = (tab?: string) => ["overview", "orders", "review", "disputes", "wallet", "wishlist", "settings"].includes(String(tab || ""));
    const initialTab = isValidTab(locationState?.tab) ? String(locationState?.tab) : "overview";

    const [activeTab,        setActiveTab]        = useState(initialTab);
    const [wishCount,        setWishCount]        = useState(0);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [wishPage,         setWishPage]         = useState(0);
    const [wishSlideDir,     setWishSlideDir]     = useState<"left"|"right"|null>(null);
    const WISH_PER_PAGE = 6;

    // Overview tab data
    const [overview, setOverview] = useState<{
        wallet: WalletData | null;
        orders: OrderItem[];
        wishlist: WishlistItem[];
    } | null>(null);

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



    useEffect(() => {
        if (activeTab !== "overview") return;
        let cancelled = false;
        Promise.allSettled([
            getWalletAPI() as Promise<WalletData>,
            getWishlistAPI() as Promise<WishlistItem[]>,
            getMyPurchasesAPI({ size: 5 }) as Promise<OrderItem[]>,
        ]).then(([walletRes, wishRes, ordersRes]) => {
            if (cancelled) return;
            const newWishlist = wishRes.status === "fulfilled" ? wishRes.value : [];
            const newWishCount = wishRes.status === "fulfilled" ? wishRes.value.length : 0;
            const newOrders = ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)
                ? ordersRes.value.map((p: OrderItem & { order?: OrderItem }) => p.order ?? p).slice(0, 5)
                : [];
            const newWallet = walletRes.status === "fulfilled" ? walletRes.value : null;
            setOverview({ wallet: newWallet, orders: newOrders, wishlist: newWishlist });
            setWishCount(newWishCount);
        });
        return () => { cancelled = true; };
    }, [activeTab]);

    useEffect(() => {
        if (isValidTab(locationState?.tab)) {
            setActiveTab(String(locationState?.tab));
        }
    }, [locationState?.tab]);

    const navItems = [
        { id: "overview",  icon: User,       label: "Tổng quan" },
        { id: "orders",    icon: Package,     label: "Lịch sử mua hàng"  },
        { id: "review",    icon: Star,        label: "Cần đánh giá" },
        { id: "disputes",  icon: AlertTriangle, label: "Tranh chấp" },
        { id: "wallet",    icon: Wallet,      label: "Ví & ưu đãi"   },
        { id: "wishlist",  icon: Heart,       label: "Yêu thích" },
    ];

    const handleRemoveOverviewWish = async (bikeId: number) => {
        try {
            await removeFromWishlistAPI(bikeId);
            setOverview(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    wishlist: prev.wishlist.filter(item => (item.bike?.id ?? item.bikeId ?? item.id) !== bikeId),
                };
            });
            setWishCount(prev => {
                const next = Math.max(0, prev - 1);
                window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count: next } }));
                return next;
            });
        } catch {
            // Silent fail to keep dashboard lightweight.
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f5f7ff", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <Header />
            <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
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



                {/* Page content */}
                <main style={{ flex: 1, overflowY: "auto", padding: activeTab === "wallet" ? "0" : "32px" }}>

                    {/* ── HOME ── */}
                    {/* ── OVERVIEW (CellphoneS style) ── */}
                    {activeTab === "overview" && (
                        <div className="fade-up">
                            {/* Top row: Đơn hàng gần đây + Ưu đãi */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

                                {/* Đơn hàng gần đây */}
                                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "24px" }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Đơn hàng gần đây</h3>
                                    {overview === null ? (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0" }}>
                                            <div className="sk" style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 12 }} />
                                            <div className="sk" style={{ width: 160, height: 12, marginBottom: 8 }} />
                                        </div>
                                    ) : (overview?.orders?.length ?? 0) === 0 ? (
                                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                                <Package size={28} color="#cbd5e1" />
                                            </div>
                                            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>Bạn chưa có đơn hàng nào gần đây!</p>
                                            <button onClick={() => navigate("/")}
                                                    style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                                                Mua sắm ngay
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {(overview?.orders ?? []).map((order) => (
                                                <div key={order.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", cursor: "pointer", position: "relative" }}
                                                    onClick={async () => {
                                                        // Use buyer service to keep endpoint/auth handling centralized.
                                                        try {
                                                            const orderDetail = await getOrderAPI(order.id);
                                                            navigate(`/order-detail/${order.id}`, { state: { order: orderDetail } });
                                                        } catch {
                                                            navigate(`/order-detail/${order.id}`);
                                                        }
                                                    }}
                                                >
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <Bike size={16} color="#2563eb" />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeof order.bikeTitle === "string" ? order.bikeTitle : `Đơn #${order.id}`}</p>
                                                        <p style={{ fontSize: 11, color: "#94a3b8" }}>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalAmount ?? order.amountPoints ?? 0)}</p>
                                                        {order.status === "CANCELLED" || order.status === "Đã hủy" ? (
                                                            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginTop: 2, display: "inline-block" }}>Đã hủy</span>
                                                        ) : null}
                                                    </div>
                                                    <ChevronRight size={14} color="#c7d2e8" />
                                                </div>
                                            ))}
                                            <button onClick={() => setActiveTab("orders")}
                                                    style={{ marginTop: 4, fontSize: 13, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                                                Xem tất cả →
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Ví & điểm */}
                                <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "24px" }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Ví & ưu đãi</h3>
                                    <div style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
                                        <p style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 4 }}>Số dư ví (VND)</p>
                                        <p style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(overview?.wallet?.availablePoints ?? 0)}

                                        </p>
                                    </div>
                                    <button onClick={() => setActiveTab("wallet")}
                                            style={{ width: "100%", padding: "10px", background: "#eff6ff", color: "#2563eb", border: "1px solid #c7d2fe", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                        Quản lý ví →
                                    </button>
                                </div>
                            </div>

                            {/* Sản phẩm yêu thích — carousel 6/trang */}
                            {(() => {
                                const allWish = overview?.wishlist ?? [];
                                const totalWishPages = Math.max(1, Math.ceil(allWish.length / WISH_PER_PAGE));
                                const pageItems = allWish.slice(wishPage * WISH_PER_PAGE, (wishPage + 1) * WISH_PER_PAGE);
                                const goWish = (dir: "left" | "right") => {
                                    const next = dir === "right" ? wishPage + 1 : wishPage - 1;
                                    setWishSlideDir(dir);
                                    setWishPage(next);
                                    setTimeout(() => setWishSlideDir(null), 350);
                                };
                                return (
                                    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "24px", marginBottom: 20 }}>
                                        <style>{`
                                            @keyframes slideInRight { from { opacity:0; transform:translateX(60px) } to { opacity:1; transform:none } }
                                            @keyframes slideInLeft  { from { opacity:0; transform:translateX(-60px) } to { opacity:1; transform:none } }
                                            .wish-slide-right { animation: slideInRight .32s cubic-bezier(.4,0,.2,1) both; }
                                            .wish-slide-left  { animation: slideInLeft  .32s cubic-bezier(.4,0,.2,1) both; }
                                        `}</style>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                                                Sản phẩm yêu thích
                                                {wishCount > 0 && <span style={{ marginLeft: 8, fontSize: 13, color: "#e11d48", fontWeight: 600 }}>({wishCount})</span>}
                                            </h3>
                                            {totalWishPages > 1 && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <button
                                                        onClick={() => goWish("left")}
                                                        disabled={wishPage === 0}
                                                        style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #e2e8f0", background: wishPage === 0 ? "#f8fafc" : "white", cursor: wishPage === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: wishPage === 0 ? 0.4 : 1, transition: "all .15s" }}>
                                                        <ChevronLeft size={15} color="#475569" />
                                                    </button>
                                                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{wishPage + 1}/{totalWishPages}</span>
                                                    <button
                                                        onClick={() => goWish("right")}
                                                        disabled={wishPage >= totalWishPages - 1}
                                                        style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid #e2e8f0", background: wishPage >= totalWishPages - 1 ? "#f8fafc" : "white", cursor: wishPage >= totalWishPages - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: wishPage >= totalWishPages - 1 ? 0.4 : 1, transition: "all .15s" }}>
                                                        <ChevronRight size={15} color="#475569" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {allWish.length === 0 && wishCount === 0 ? (
                                            <div style={{ textAlign: "center", padding: "32px 0" }}>
                                                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                                    <Heart size={28} color="#cbd5e1" />
                                                </div>
                                                <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>Bạn chưa có sản phẩm nào yêu thích!</p>
                                                <button onClick={() => navigate("/")}
                                                        style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                                                    Mua sắm ngay
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className={wishSlideDir === "right" ? "wish-slide-right" : wishSlideDir === "left" ? "wish-slide-left" : ""}
                                                style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, overflow: "hidden" }}>
                                                {pageItems.map(item => {
                                                    const bike = item.bike;
                                                    const bikeId = bike?.id ?? item.bikeId ?? item.id;
                                                    const img = bike?.media?.find((m: { type: string; url: string }) => m.type === "IMAGE" && !m.url?.includes("dicebear"))?.url;
                                                    const brandName = typeof bike?.brand === "object" && bike?.brand !== null ? (bike.brand as { name?: string }).name ?? "—" : bike?.brand ?? "—";
                                                    return (
                                                        <div key={item.id} onClick={() => navigate(`/bikes/${bikeId}`)}
                                                             style={{ borderRadius: 12, border: "1px solid #e8ecf5", overflow: "hidden", cursor: "pointer", transition: "all .2s" }}
                                                             onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(37,99,235,.1)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#c7d2fe"; }}
                                                             onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#e8ecf5"; }}>
                                                            <div style={{ height: 120, background: "#f8fafc", overflow: "hidden", position: "relative" }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveOverviewWish(bikeId);
                                                                    }}
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: 8,
                                                                        right: 8,
                                                                        width: 30,
                                                                        height: 30,
                                                                        borderRadius: "50%",
                                                                        border: "1px solid #fecdd3",
                                                                        background: "rgba(255,255,255,.96)",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        color: "#e11d48",
                                                                        cursor: "pointer",
                                                                        zIndex: 2,
                                                                    }}
                                                                    title="Bỏ yêu thích"
                                                                >
                                                                    <Heart size={14} fill="#e11d48" />
                                                                </button>
                                                                {img
                                                                    ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Bike size={24} color="#c7d2e8" /></div>
                                                                }
                                                            </div>
                                                            <div style={{ padding: "10px" }}>
                                                                <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brandName}</p>
                                                                <p style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{bike?.title ?? bike?.name ?? "Xe đạp"}</p>
                                                                <p style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{fmtPrice(bike?.pricePoints ?? bike?.price ?? 0)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Chương trình nổi bật */}
                            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8ecf5", padding: "24px" }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Chương trình nổi bật</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                    {[
                                        { icon: <Bike size={20} color="#2563eb" />, bg: "#eff6ff", title: "Khám phá xe", desc: "Tìm xe đạp phù hợp", action: () => navigate("/") },
                                        { icon: <Package size={20} color="#7c3aed" />, bg: "#f5f3ff", title: "Lịch sử mua", desc: "Xem các đơn hàng", action: () => setActiveTab("orders") },
                                        { icon: <Settings size={20} color="#059669" />, bg: "#f0fdf4", title: "Cài đặt", desc: "Quản lý tài khoản", action: () => setActiveTab("settings") },
                                    ].map(item => (
                                        <div key={item.title} onClick={item.action}
                                             style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 16px", borderRadius: 12, background: item.bg, cursor: "pointer", textAlign: "center", transition: "opacity .15s" }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{item.title}</p>
                                                <p style={{ fontSize: 11.5, color: "#94a3b8" }}>{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ── ORDERS ── */}
                    {activeTab === "orders" && (
                        <div className="fade-up">
                            <OrdersTab token={token} navigate={navigate} />
                        </div>
                    )}

                    {/* ── REVIEW NEEDED ── */}
                    {activeTab === "review" && (
                        <div className="fade-up">
                            <OrdersTab token={token} navigate={navigate} mode="review-needed" />
                        </div>
                    )}

                    {/* ── DISPUTES ── */}
                    {activeTab === "disputes" && (
                        <div className="fade-up">
                            <DisputesTab />
                        </div>
                    )}

                    {/* ── WALLET ── */}
                    {activeTab === "wallet" && (
                        <div className="fade-up">
                            <WalletPage initialTab={locationState?.walletTab === "deposit" ? "deposit" : "overview"} />
                        </div>
                    )}

                    {/* ── WISHLIST ── */}
                    {activeTab === "wishlist" && (
                        <div className="fade-up">
                            <WishList token={token} formatPrice={fmtPrice} />
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
        </div>
    );
}