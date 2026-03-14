import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bike, Menu, X, Search, Heart, User, ChevronDown,
  Tag, SlidersHorizontal,
} from "lucide-react";
import { getCategoriesAPI } from "../../services/Buyer/Categoryservice";
import { getBrandsAPI } from "../../services/home/brandService";

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

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [catOpen,     setCatOpen]     = useState(false);
  const [brandOpen,   setBrandOpen]   = useState(false);
  const [catSearch,   setCatSearch]   = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  const [categories, setCategories] = useState([]);   // [{id, name, bikeCount}]
  const [brands,     setBrands]     = useState([]);   // [{id, name}]

  const [sticky, setSticky] = useState(false);  // sticky filter bar visible

  const catRef   = useRef(null);
  const brandRef = useRef(null);

  /* ── fetch categories + brands ── */
  useEffect(() => {
    getCategoriesAPI().then(setCategories).catch(() => {});
    getBrandsAPI().then(setBrands).catch(() => {});
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

  const selectCategory = (cat) => {
    setSearchParams({ categoryId: cat.id });
    setCatOpen(false);
    setCatSearch("");
    if (window.location.pathname !== "/") navigate("/");
    scrollToAllBikes();
  };

  const selectBrand = (brand) => {
    // toggle: click lại brand đang active thì clear
    if (String(brand.id) === searchParams.get("brandId")) {
      setSearchParams({});
    } else {
      setSearchParams({ brandId: brand.id });
    }
    setBrandOpen(false);
    if (window.location.pathname !== "/") navigate("/");
    scrollToAllBikes();
  };

  const clearFilter = () => setSearchParams({});

  const activeCategoryId = searchParams.get("categoryId");
  const activeBrandId    = searchParams.get("brandId");
  const activeCatName    = categories.find(c => String(c.id) === activeCategoryId)?.name;
  const activeBrandName  = brands.find(b => String(b.id) === activeBrandId)?.name;

  const filteredCats   = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-md">
        {/* Top bar */}
        <div className="bg-blue-700 text-white text-xs py-1.5 text-center tracking-wide">
          Miễn phí vận chuyển cho đơn hàng trên 2.000.000 ₫ &nbsp;|&nbsp; Hotline:{" "}
          <span className="font-semibold">0909 123 456</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

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

              <Link to="/" onClick={clearFilter}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Trang chủ
              </Link>

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

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const token = localStorage.getItem("token");
                  navigate(token ? "/buyer" : "/login");
                }}
                className="relative p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xe yêu thích"
              >
                <Heart size={20} />
              </button>

              <div className="hidden sm:flex items-center gap-2 ml-2">
                <button onClick={() => navigate("/login")}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                  <User size={15} /> Đăng nhập
                </button>
                <button onClick={() => navigate("/register")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                  Đăng ký
                </button>
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
            <Link to="/" onClick={() => { clearFilter(); setMobileOpen(false); }}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              Trang chủ
            </Link>
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
