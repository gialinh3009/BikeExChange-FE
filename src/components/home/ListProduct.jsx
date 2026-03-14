import { useState, useEffect } from "react";
import { Star, Heart, MapPin, Eye, SlidersHorizontal, ChevronDown, ShieldCheck,
         ChevronLeft, ChevronRight, ImageIcon, Search, X, Bike } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBuyerListAPI } from "../../services/Buyer/BuyerList";
import { getCategoriesAPI } from "../../services/Buyer/Categoryservice";
import { getBrandsAPI } from "../../services/home/brandService";
import { addToWishlistAPI } from "../../services/Buyer/wishlistService";

const SORTS = [
  { label: "Mới nhất",         value: "newest"    },
  { label: "Cũ nhất",          value: "oldest"    },
  { label: "Giá thấp đến cao", value: "price_asc" },
  { label: "Giá cao đến thấp", value: "price_desc"},
];

const CONDITION_META = {
  LIKE_NEW: { label: "Như mới", cls: "bg-blue-100 text-blue-700" },
  GOOD:     { label: "Tốt",     cls: "bg-green-100 text-green-700" },
  FAIR:     { label: "Khá",     cls: "bg-yellow-100 text-yellow-700" },
  POOR:     { label: "Cũ",      cls: "bg-gray-100 text-gray-600" },
  NEW:      { label: "Mới",     cls: "bg-purple-100 text-purple-700" },
};

const EMPTY_FILTER = { keyword: "", categoryId: "", brandId: "", priceMin: "", priceMax: "", minYear: "" };

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);
}

// ─── Verified Bike Card ───────────────────────────────────────────────────
function VerifiedCard({ bike, onNavigate, onHeartClick, wishedIds }) {
  const img = bike.media?.find(m => m.type === "IMAGE" && !m.url?.includes("example.com"))?.url;
  const cond = CONDITION_META[bike.condition] ?? { label: bike.condition ?? "—", cls: "bg-gray-100 text-gray-600" };
  const wished = wishedIds?.has(bike.id);

  return (
    <div
      className="group bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={() => onNavigate(`/bikes/${bike.id}`)}
    >
      <div className="relative bg-gray-50 h-44 flex items-center justify-center overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt={bike.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon size={36} strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
          <ShieldCheck size={10} strokeWidth={2.5} /> Đã kiểm định
        </div>
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded ${cond.cls}`}>
          {cond.label}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <p className="text-xs text-blue-600 font-medium truncate">{bike.brand ?? "—"}</p>
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {bike.title}
        </h3>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
          ))}
          <span className="text-xs text-gray-400 ml-0.5">5.0</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin size={10} />
          {bike.location && bike.location !== "Not specified" ? bike.location : "Việt Nam"}
          {bike.year && <span className="ml-auto">Năm {bike.year}</span>}
        </div>
        <div className="text-emerald-600 font-bold text-base mt-auto">
          {fmtVND(bike.pricePoints)}
        </div>
        <button
          className={`w-full flex items-center justify-center gap-1.5 border text-xs font-medium py-1.5 rounded transition-colors mt-1 ${
            wished ? "border-red-300 text-red-500 bg-red-50" : "border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500"
          }`}
          onClick={e => { e.stopPropagation(); onHeartClick(bike.id); }}
        >
          <Heart size={13} className={wished ? "fill-red-500 text-red-500" : ""} />
          {wished ? "Đã yêu thích" : "Yêu thích"}
        </button>
      </div>
    </div>
  );
}

// ─── Regular Bike Card ────────────────────────────────────────────────────
function RegularCard({ bike, onNavigate, onHeartClick, wishedIds }) {
  const img = bike.media?.find(m => m.type === "IMAGE" && !m.url?.includes("example.com"))?.url;
  const cond = CONDITION_META[bike.condition] ?? { label: bike.condition ?? "—", cls: "bg-gray-100 text-gray-600" };
  const isInspected = bike.inspectionStatus === "APPROVED" || bike.inspection_status === "APPROVED";
  const wished = wishedIds?.has(bike.id);

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
      onClick={() => onNavigate(`/bikes/${bike.id}`)}
    >
      <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 h-44 flex items-center justify-center overflow-hidden flex-shrink-0">
        {img ? (
          <img src={img} alt={bike.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon size={36} strokeWidth={1.2} />
          </div>
        )}
        {isInspected && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
            <ShieldCheck size={10} strokeWidth={2.5} /> Đã kiểm định
          </div>
        )}
        <button
          className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow hover:bg-white transition-colors"
          onClick={e => { e.stopPropagation(); onHeartClick(bike.id); }}
        >
          <Heart size={16} className={wished ? "text-red-500 fill-red-500" : "text-gray-400"} />
        </button>
      </div>

      <div className="p-4 space-y-2.5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-blue-600 font-medium truncate">{bike.brand ?? "—"}</p>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {bike.title}
            </h3>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-lg ${cond.cls}`}>
            {cond.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {bike.location && bike.location !== "Not specified" ? bike.location : "Việt Nam"}
          </span>
          {bike.year && <span>Năm {bike.year}</span>}
        </div>

        <div className="mt-auto pt-1">
          <div className="text-blue-600 font-bold text-base">
            {fmtVND(bike.pricePoints)}
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-colors"
          onClick={e => { e.stopPropagation(); onNavigate(`/bikes/${bike.id}`); }}
        >
          <Eye size={14} /> Xem chi tiết
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-44 bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-8 bg-gray-100 rounded-xl animate-pulse mt-2" />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function ListProduct() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [brands,     setBrands]     = useState([]);
  const [sortBy,     setSortBy]     = useState("newest");

  // Draft filter (what user edits in the panel)
  const [filterForm, setFilterForm] = useState(EMPTY_FILTER);
  // Applied filter (sent to API — only updates when user clicks Áp dụng)
  const [activeFilter, setActiveFilter] = useState(EMPTY_FILTER);

  // Verified bikes
  const [verifiedBikes,   setVerifiedBikes]   = useState([]);
  const [verifiedLoading, setVerifiedLoading] = useState(true);
  const [verifiedPage,    setVerifiedPage]    = useState(0);
  const VERIFIED_PER_PAGE = 5;

  // All bikes
  const [allBikes,   setAllBikes]   = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 8;

  // Wishlist
  const [wishedIds,     setWishedIds]     = useState(new Set());
  // modal: null | { bikeId, type: "auth" | "confirm" }
  const [wishModal,     setWishModal]     = useState(null);
  const [wishLoading,   setWishLoading]   = useState(false);

  // Fetch categories + brands once
  useEffect(() => {
    getCategoriesAPI().then(setCategories).catch(() => {});
    getBrandsAPI().then(setBrands).catch(() => {});
  }, []);

  // Sync URL params (set by Header nav) → both filterForm & activeFilter (immediate apply)
  useEffect(() => {
    const f = {
      keyword:    searchParams.get("q")          || "",
      categoryId: searchParams.get("categoryId") || "",
      brandId:    searchParams.get("brandId")    || "",
      priceMin:   "",
      priceMax:   "",
      minYear:    "",
    };
    setFilterForm(f);
    setActiveFilter(f);
    setPage(0);
  }, [searchParams]);

  // Reset page when active filter changes
  useEffect(() => { setPage(0); }, [activeFilter]);

  // Fetch verified bikes (section 1)
  useEffect(() => {
    setVerifiedLoading(true);
    getBuyerListAPI({
      category_id: activeFilter.categoryId || undefined,
      brand_id:    activeFilter.brandId    || undefined,
      page: 0,
      size: 100,
    })
      .then(({ content }) => {
        setVerifiedBikes(content.filter(b =>
          b.inspectionStatus === "APPROVED" || b.inspection_status === "APPROVED" || b.verified === true
        ));
      })
      .catch(() => setVerifiedBikes([]))
      .finally(() => setVerifiedLoading(false));
  }, [activeFilter.categoryId, activeFilter.brandId]);

  // Fetch all bikes (section 2)
  useEffect(() => {
    setAllLoading(true);
    getBuyerListAPI({
      category_id:    activeFilter.categoryId                  || undefined,
      brand_id:       activeFilter.brandId                     || undefined,
      keyword:        activeFilter.keyword                     || undefined,
      price_min:      activeFilter.priceMin ? Number(activeFilter.priceMin) : undefined,
      price_max:      activeFilter.priceMax ? Number(activeFilter.priceMax) : undefined,
      min_year:       activeFilter.minYear  ? Number(activeFilter.minYear)  : undefined,
      sort_by_rating: false,
      page,
      size: PAGE_SIZE,
    })
      .then(({ content, totalPages: tp }) => {
        let list = content;
        if (sortBy === "price_asc")  list = [...list].sort((a, b) => a.pricePoints - b.pricePoints);
        if (sortBy === "price_desc") list = [...list].sort((a, b) => b.pricePoints - a.pricePoints);
        if (sortBy === "oldest")     list = [...list].sort((a, b) => a.id - b.id);
        setAllBikes(list);
        setTotalPages(tp);
      })
      .catch(() => setAllBikes([]))
      .finally(() => setAllLoading(false));
  }, [activeFilter, sortBy, page]);

  const handleHeartClick = (bikeId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishModal({ bikeId, type: "auth" });
    } else {
      setWishModal({ bikeId, type: "confirm" });
    }
  };

  const handleConfirmWish = async () => {
    if (!wishModal) return;
    setWishLoading(true);
    try {
      await addToWishlistAPI(wishModal.bikeId);
      setWishedIds(prev => new Set([...prev, wishModal.bikeId]));
    } catch {
      // silent — API might already have it in wishlist
    } finally {
      setWishLoading(false);
      setWishModal(null);
    }
  };

  const handleApply = () => {
    setActiveFilter({ ...filterForm });
    setPage(0);
    setTimeout(() => {
      document.getElementById("all-bikes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleClear = () => {
    setFilterForm(EMPTY_FILTER);
    setActiveFilter(EMPTY_FILTER);
    setSearchParams({});
    setPage(0);
  };

  const hasFilter = Object.values(activeFilter).some(v => v !== "");

  // Verified carousel
  const verifiedTotalPages = Math.max(1, Math.ceil(verifiedBikes.length / VERIFIED_PER_PAGE));
  const verifiedMaxPage    = verifiedTotalPages - 1;

  return (
    <div id="products">

      {/* ══════════════════════════════════════════
          SECTION 1: Xe đã được kiểm định — framed carousel
      ══════════════════════════════════════════ */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-sm">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-extrabold text-base leading-tight">
                    🏆 Xe đã được kiểm định đánh giá tốt
                  </h2>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    Chỉ những xe đạt chất lượng kiểm định mới xuất hiện tại đây
                  </p>
                </div>
              </div>
              <span className="text-white/70 text-sm font-medium hidden sm:block">
                {verifiedPage + 1}/{verifiedTotalPages}
              </span>
            </div>

            {/* Carousel body */}
            <div className="bg-white relative">
              {verifiedLoading ? (
                <div className="grid grid-cols-5 gap-0 divide-x divide-gray-100">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} />)}
                </div>
              ) : verifiedBikes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Chưa có xe nào được kiểm định.
                </div>
              ) : (
                <>
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{
                        width: `${verifiedTotalPages * 100}%`,
                        transform: `translateX(-${verifiedPage * (100 / verifiedTotalPages)}%)`,
                      }}
                    >
                      {verifiedBikes.map(bike => (
                        <div
                          key={bike.id}
                          style={{ width: `${100 / verifiedBikes.length}%` }}
                          className="border-r border-gray-100 last:border-r-0"
                        >
                          <VerifiedCard bike={bike} onNavigate={navigate} onHeartClick={handleHeartClick} wishedIds={wishedIds} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {verifiedPage > 0 && (
                    <button
                      onClick={() => setVerifiedPage(p => p - 1)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:border-emerald-400 transition-all"
                    >
                      <ChevronLeft size={18} className="text-gray-600" />
                    </button>
                  )}
                  {verifiedPage < verifiedMaxPage && (
                    <button
                      onClick={() => setVerifiedPage(p => p + 1)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:border-emerald-400 transition-all"
                    >
                      <ChevronRight size={18} className="text-gray-600" />
                    </button>
                  )}
                </>
              )}
            </div>

            {verifiedTotalPages > 1 && (
              <div className="bg-white border-t border-gray-100 py-2.5 flex justify-center gap-1.5">
                {[...Array(verifiedTotalPages)].map((_, i) => (
                  <button key={i} onClick={() => setVerifiedPage(i)}
                    className={`rounded-full transition-all ${i === verifiedPage ? "w-5 h-2 bg-emerald-500" : "w-2 h-2 bg-gray-200 hover:bg-gray-300"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2: Tất cả xe đạp
      ══════════════════════════════════════════ */}
      <section id="all-bikes" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                {activeFilter.categoryId
                  ? (categories.find(c => String(c.id) === activeFilter.categoryId)?.name ?? "Danh mục")
                  : activeFilter.keyword
                  ? `Kết quả: "${activeFilter.keyword}"`
                  : "Tất cả xe"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {activeFilter.keyword
                  ? <>Tìm thấy xe phù hợp với <span className="text-blue-600">"{activeFilter.keyword}"</span></>
                  : activeFilter.categoryId || activeFilter.brandId
                  ? <>Xe đạp theo <span className="text-blue-600">bộ lọc đã chọn</span></>
                  : <>Tất cả xe đạp</>}
              </h2>
            </div>
            {!allLoading && (
              <p className="text-sm text-gray-400 shrink-0">
                Hiển thị <span className="font-semibold text-gray-600">{allBikes.length}</span> xe / trang {page + 1}
              </p>
            )}
          </div>

          {/* ── Filter Panel ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-8">

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm xe đạp, thương hiệu..."
                  value={filterForm.keyword}
                  onChange={e => setFilterForm(f => ({ ...f, keyword: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleApply()}
                  className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
                {filterForm.keyword && (
                  <button
                    onClick={() => setFilterForm(f => ({ ...f, keyword: "" }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category chips */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Loại xe</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterForm(f => ({ ...f, categoryId: "" }))}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    !filterForm.categoryId
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >Tất cả</button>
                {categories.map(cat => (
                  <button key={cat.id}
                    onClick={() => setFilterForm(f => ({ ...f, categoryId: String(cat.id) }))}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      filterForm.categoryId === String(cat.id)
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand + Price + Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Thương hiệu</label>
                <div className="relative">
                  <select
                    value={filterForm.brandId}
                    onChange={e => setFilterForm(f => ({ ...f, brandId: e.target.value }))}
                    className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer pr-8"
                  >
                    <option value="">Tất cả thương hiệu</option>
                    {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Giá từ (VND)</label>
                <input
                  type="number" min="0" placeholder="0"
                  value={filterForm.priceMin}
                  onChange={e => setFilterForm(f => ({ ...f, priceMin: e.target.value }))}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Giá đến (VND)</label>
                <input
                  type="number" min="0" placeholder="Không giới hạn"
                  value={filterForm.priceMax}
                  onChange={e => setFilterForm(f => ({ ...f, priceMax: e.target.value }))}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Năm sản xuất (từ)</label>
                <input
                  type="number" min="2000" max="2025" placeholder="Ví dụ: 2020"
                  value={filterForm.minYear}
                  onChange={e => setFilterForm(f => ({ ...f, minYear: e.target.value }))}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={14} /> Xóa bộ lọc
              </button>

              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => { setSortBy(e.target.value); setPage(0); }}
                    className="appearance-none border border-gray-200 bg-gray-50 rounded-xl pl-3 pr-8 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer"
                  >
                    {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Search size={14} /> Áp dụng bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Active filter badge */}
          {hasFilter && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {activeFilter.keyword    && <FilterChip label={`"${activeFilter.keyword}"`}    onRemove={() => { setFilterForm(f => ({...f, keyword: ""}));    setActiveFilter(f => ({...f, keyword: ""}));    }} />}
              {activeFilter.categoryId && <FilterChip label={categories.find(c => String(c.id) === activeFilter.categoryId)?.name ?? "Danh mục"} onRemove={() => { setFilterForm(f => ({...f, categoryId: ""})); setActiveFilter(f => ({...f, categoryId: ""})); }} />}
              {activeFilter.brandId    && <FilterChip label={brands.find(b => String(b.id) === activeFilter.brandId)?.name ?? "Thương hiệu"}    onRemove={() => { setFilterForm(f => ({...f, brandId: ""}));    setActiveFilter(f => ({...f, brandId: ""}));    }} />}
              {activeFilter.priceMin   && <FilterChip label={`Từ ${Number(activeFilter.priceMin).toLocaleString("vi-VN")} đ`} onRemove={() => { setFilterForm(f => ({...f, priceMin: ""})); setActiveFilter(f => ({...f, priceMin: ""})); }} />}
              {activeFilter.priceMax   && <FilterChip label={`Đến ${Number(activeFilter.priceMax).toLocaleString("vi-VN")} đ`} onRemove={() => { setFilterForm(f => ({...f, priceMax: ""})); setActiveFilter(f => ({...f, priceMax: ""})); }} />}
              {activeFilter.minYear    && <FilterChip label={`Từ năm ${activeFilter.minYear}`} onRemove={() => { setFilterForm(f => ({...f, minYear: ""}));  setActiveFilter(f => ({...f, minYear: ""}));  }} />}
            </div>
          )}

          {/* Grid */}
          {allLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : allBikes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              Không có xe phù hợp. Thử điều chỉnh bộ lọc nhé!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {allBikes.map(bike => (
                <RegularCard key={bike.id} bike={bike} onNavigate={navigate} onHeartClick={handleHeartClick} wishedIds={wishedIds} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                ← Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                    i === page ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Wishlist modals ── */}
      {wishModal?.type === "auth" && (
        <WishlistAuthModal
          onClose={() => setWishModal(null)}
          onLogin={() => { setWishModal(null); navigate("/login"); }}
          onRegister={() => { setWishModal(null); navigate("/register"); }}
        />
      )}
      {wishModal?.type === "confirm" && (
        <WishlistConfirmModal
          loading={wishLoading}
          onClose={() => setWishModal(null)}
          onConfirm={handleConfirmWish}
        />
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900"><X size={11} /></button>
    </span>
  );
}

// ─── Modal: yêu cầu đăng nhập ─────────────────────────────────────────────
function WishlistAuthModal({ onClose, onLogin, onRegister }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-80 p-7 flex flex-col items-center gap-4 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Bike size={30} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-blue-600 tracking-tight">BikeExchange</h2>
        <p className="text-sm text-gray-600 text-center leading-relaxed">
          Vui lòng đăng nhập tài khoản để thêm xe vào danh sách yêu thích.
        </p>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onRegister}
            className="flex-1 py-2.5 text-sm font-semibold border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 transition-colors"
          >
            Đăng ký
          </button>
          <button
            onClick={onLogin}
            className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: xác nhận thêm vào yêu thích ──────────────────────────────────
function WishlistConfirmModal({ onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-80 p-7 flex flex-col items-center gap-4 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Heart size={28} className="text-red-500 fill-red-100" />
        </div>
        <h2 className="text-base font-extrabold text-gray-800">Thêm vào yêu thích</h2>
        <p className="text-sm text-gray-500 text-center">
          Bạn có muốn thêm chiếc xe này vào danh sách yêu thích không?
        </p>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? "Đang lưu..." : "Có, thêm vào"}
          </button>
        </div>
      </div>
    </div>
  );
}
