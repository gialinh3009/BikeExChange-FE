import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bike, Menu, X, Search, Heart, User, ChevronDown,
  Tag, SlidersHorizontal,
} from "lucide-react";
import { getCategoriesAPI } from "../../services/Buyer/Categoryservice";
import { getBrandsAPI } from "../../services/home/brandService";
import { getWishlistAPI } from "../../services/Buyer/wishlistService";

function categoryIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("địa hình") || n.includes("mtb") || n.includes("mountain")) return "🚵";
  if (n.includes("đường trường") || n.includes("road"))  return "🚴";
  if (n.includes("thành thị") || n.includes("city") || n.includes("hybrid")) return "🚲";
  if (n.includes("gấp") || n.includes("folding")) return "🪄";
  if (n.includes("điện") || n.includes("electric")) return "⚡";
  if (n.includes("trẻ em") || n.includes("kid"))  return "🧒";
  if (n.includes("gravel")) return "🛤️";
  return "🚲";
}

export default function Header() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState("");

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [catOpen,     setCatOpen]     = useState(false);
  const [brandOpen,   setBrandOpen]   = useState(false);
  const [catSearch,   setCatSearch]   = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  const [categories, setCategories] = useState([]);   // [{id, name, bikeCount}]
  const [brands,     setBrands]     = useState([]);   // [{id, name}]

  const [sticky,      setSticky]      = useState(false);  // sticky filter bar visible
  const [wishCount,   setWishCount]   = useState(0);

  const catRef   = useRef(null);
  const brandRef = useRef(null);

  useEffect(() => {
    setKeyword(searchParams.get("q") || "");
  }, [searchParams]);

  /* ── fetch categories + brands ── */
  useEffect(() => {
    getCategoriesAPI().then(setCategories).catch(() => {});
    getBrandsAPI().then(setBrands).catch(() => {});
  }, []);

  /* ── fetch wishlist count (logged-in only) ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getWishlistAPI().then(list => setWishCount(Array.isArray(list) ? list.length : 0)).catch(() => {});
  }, []);

  /* ── listen for wishlist updates dispatched by ListProduct ── */
  useEffect(() => {
    const handler = (e) => setWishCount(e.detail?.count ?? 0);
    window.addEventListener("wishlist-updated", handler);
    return () => window.removeEventListener("wishlist-updated", handler);
  }, []);

  /* ── sticky filter bar on scroll ── */
  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 460);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
      if (brandRef.current && !brandRef.current.contains(e.target)) setBrandOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── helpers ── */
  const scrollToAllBikes = () => {
    setTimeout(() => {
      document.getElementById("all-bikes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const goToMarketplace = (params) => {
    const search = params.toString();
    const target = search ? `/?${search}` : "/";
    if (window.location.pathname !== "/" || window.location.search !== (search ? `?${search}` : "")) {
      navigate(target);
    } else {
      setSearchParams(params);
    }
    scrollToAllBikes();
  };

  const submitKeyword = () => {
    const next = new URLSearchParams(searchParams);
    const q = keyword.trim();
    if (q) next.set("q", q);
    else next.delete("q");
    goToMarketplace(next);
  };

  const selectCategory = (cat) => {
    const next = new URLSearchParams(searchParams);
    next.set("categoryId", String(cat.id));
    setCatOpen(false);
    setCatSearch("");
    goToMarketplace(next);
  };

  const selectBrand = (brand) => {
    // toggle: click lại brand đang active thì clear
    const next = new URLSearchParams(searchParams);
    if (String(brand.id) === searchParams.get("brandId")) {
      next.delete("brandId");
    } else {
      next.set("brandId", String(brand.id));
    }
    setBrandOpen(false);
    goToMarketplace(next);
  };

  const clearFilter = () => {
    setKeyword("");
    goToMarketplace(new URLSearchParams());
  };

  const activeCategoryId = searchParams.get("categoryId");
  const activeBrandId    = searchParams.get("brandId");
  const activeCatName    = categories.find(c => String(c.id) === activeCategoryId)?.name;
  const activeBrandName  = brands.find(b => String(b.id) === activeBrandId)?.name;

  const filteredCats   = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="flex h-16 items-center gap-4">

            <div className="flex items-center gap-3 lg:gap-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group" onClick={clearFilter}>
              <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:bg-blue-700 transition-colors">
                <Bike size={22} />
              </div>
              <span className="text-xl font-bold text-gray-800">
                Bike<span className="text-blue-600">Exchange</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">

              {/* ── Sản phẩm dropdown ── */}
              <div className="relative" ref={catRef}>
                <button
                  onClick={() => { setCatOpen(v => !v); setBrandOpen(false); }}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    catOpen || activeCategoryId ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}>
                  Sản phẩm
                  <ChevronDown size={14} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
                </button>

                {catOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {/* Search in dropdown */}
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Tìm loại xe..."
                          value={catSearch}
                          onChange={e => setCatSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-gray-50"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-50 pt-1">
                      {/* All */}
                      <button
                        onClick={() => { clearFilter(); setCatOpen(false); scrollToAllBikes(); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 ${!activeCategoryId ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
                        Tất cả sản phẩm
                      </button>

                      {filteredCats.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-gray-400">Không tìm thấy</p>
                      ) : (
                        filteredCats.map(cat => (
                          <button key={cat.id}
                            onClick={() => selectCategory(cat)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 ${
                              String(cat.id) === activeCategoryId ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"
                            }`}>
                            <span>{cat.name}</span>
                            {cat.bikeCount != null && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cat.bikeCount}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Thương hiệu dropdown ── */}
              <div className="relative" ref={brandRef}>
                <button
                  onClick={() => { setBrandOpen(v => !v); setCatOpen(false); }}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    brandOpen || activeBrandId ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}>
                  <Tag size={14} />
                  Thương hiệu
                  <ChevronDown size={14} className={`transition-transform ${brandOpen ? "rotate-180" : ""}`} />
                </button>

                {brandOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="max-h-64 overflow-y-auto">
                      {/* Clear option */}
                      <button
                        onClick={() => { clearFilter(); setBrandOpen(false); scrollToAllBikes(); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 ${!activeBrandId ? "text-blue-600 font-semibold" : "text-gray-500"}`}>
                        Tất cả thương hiệu
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      {brands.map(brand => (
                        <button key={brand.id}
                          onClick={() => selectBrand(brand)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between ${
                            String(brand.id) === activeBrandId ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"
                          }`}>
                          <span>{brand.name}</span>
                          {String(brand.id) === activeBrandId && <span className="text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </nav>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center flex-1 min-w-[380px] max-w-4xl">
              <div className="relative w-full">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitKeyword();
                  }}
                  placeholder="Tìm xe đạp, thương hiệu, mẫu xe..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-24 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={submitKeyword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  Tìm
                </button>
              </div>
            </div>

            {/* Right actions */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                onClick={() => {
                  const token = localStorage.getItem("token");
                  navigate(token ? "/buyer" : "/login", token ? { state: { tab: "wishlist" } } : undefined);
                }}
                className="relative p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xe yêu thích"
              >
                <Heart size={20} />
                {wishCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                    {wishCount > 99 ? "99+" : wishCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 ml-2">
                {(() => {
                  const token = localStorage.getItem("token");
                  const user  = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
                  if (token && user) {
                    const name     = (user.fullName || user.email || "Tôi").split(" ").pop();
                    const roleMap  = { ADMIN: "/admin", SELLER: "/seller", INSPECTOR: "/inspector", BUYER: "/buyer" };
                    const dest     = roleMap[user.role?.toUpperCase()] ?? "/buyer";
                    return (
                      <button
                        onClick={() => navigate(dest)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                      >
                        <span>{name}</span>
                        <User size={15} />
                      </button>
                    );
                  }
                  return (
                    <>
                      <button onClick={() => navigate("/login")}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                        <User size={15} /> Đăng nhập
                      </button>
                      <button onClick={() => navigate("/register")}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                        Đăng ký
                      </button>
                    </>
                  );
                })()}
              </div>

              <button onClick={() => setMobileOpen(v => !v)}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <div className="mb-2 flex items-center gap-2 px-1">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submitKeyword();
                      setMobileOpen(false);
                    }
                  }}
                  placeholder="Tìm sản phẩm..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  submitKeyword();
                  setMobileOpen(false);
                }}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Tìm
              </button>
            </div>
            <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại xe</div>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { selectCategory(cat); setMobileOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                {cat.name}
              </button>
            ))}
            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
              <button onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="flex-1 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl">Đăng nhập</button>
              <button onClick={() => { navigate("/register"); setMobileOpen(false); }}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl">Đăng ký</button>
            </div>
          </div>
        )}
      </header>

      {/* ── Sticky filter bar (hiện khi cuộn qua banner) ── */}
      {sticky && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md transition-all">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <SlidersHorizontal size={15} className="text-gray-400 flex-shrink-0" />

            {/* Clear / All */}
            <button
              onClick={() => { clearFilter(); scrollToAllBikes(); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                !activeCategoryId && !activeBrandId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}>
              Tất cả
            </button>

            {/* Category chips */}
            {categories.map(cat => (
              <button key={cat.id}
                onClick={() => selectCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  String(cat.id) === activeCategoryId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}>
                {cat.name}
                {cat.bikeCount != null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${String(cat.id) === activeCategoryId ? "bg-white/20" : "bg-gray-200"}`}>
                    {cat.bikeCount}
                  </span>
                )}
              </button>
            ))}

            {/* Brand chips */}
            {brands.slice(0, 6).map(brand => (
              <button key={brand.id}
                onClick={() => selectBrand(brand)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  String(brand.id) === activeBrandId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}>
                {brand.name}
              </button>
            ))}

            {/* Active filter badge */}
            {(activeCatName || activeBrandName) && (
              <div className="flex-shrink-0 flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-gray-400">Đang lọc:</span>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium flex items-center gap-1.5">
                  {activeCatName || activeBrandName}
                  <button onClick={clearFilter} className="hover:text-blue-900">✕</button>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
