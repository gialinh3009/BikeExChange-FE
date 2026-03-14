/**
 * ListProduct.jsx
 * Trang hiển thị xe: carousel xe kiểm định + danh sách tất cả xe + bộ lọc
 * State management + API calls — UI được tách ra BikeCards / FilterPanel / WishlistModals
 */
import { useState, useEffect } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { XeDaDuocKiemDinhCard as VerifiedCard, RegularCard, Skeleton } from "../Buyer/BikeCards.jsx";
import FilterPanel, { FilterChip, SORTS }      from "../Buyer/FilterPanel.jsx";
import { WishlistAuthModal, WishlistConfirmModal } from "../Buyer/WishlistModals.jsx";

import { getBuyerListAPI }  from "../../services/Buyer/BuyerList";
import { getCategoriesAPI } from "../../services/Buyer/Categoryservice";
import { getBrandsAPI }     from "../../services/home/brandService";
import { addToWishlistAPI, removeFromWishlistAPI, getWishlistAPI } from "../../services/Buyer/wishlistService";

const EMPTY_FILTER = { keyword: "", categoryId: "", brandId: "", priceMin: "", priceMax: "", minYear: "" };
const PAGE_SIZE     = 8;
const VERIFIED_PER_PAGE = 5; // eslint-disable-line no-unused-vars

export default function ListProduct() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Lookup data ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [brands,     setBrands]     = useState([]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const [sortBy, setSortByState] = useState("newest");
  const setSortBy = (v) => { setSortByState(v); setPage(0); };

  // ── Filter (draft vs applied) ──────────────────────────────────────────────
  const [filterForm,   setFilterForm]   = useState(EMPTY_FILTER);
  const [activeFilter, setActiveFilter] = useState(EMPTY_FILTER);

  // ── Verified bikes (carousel) ──────────────────────────────────────────────
  const [verifiedBikes,   setVerifiedBikes]   = useState([]);
  const [verifiedLoading, setVerifiedLoading] = useState(true);
  const [verifiedPage,    setVerifiedPage]    = useState(0);

  // ── All bikes (grid) ───────────────────────────────────────────────────────
  const [allBikes,   setAllBikes]   = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const [wishedIds,   setWishedIds]   = useState(new Set());
  const [wishModal,   setWishModal]   = useState(null); // { bikeId, type: "auth"|"confirm" }
  const [wishLoading, setWishLoading] = useState(false);

  // ── Fetch lookup data ──────────────────────────────────────────────────────
  useEffect(() => {
    getCategoriesAPI().then(setCategories).catch(() => {});
    getBrandsAPI().then(setBrands).catch(() => {});
  }, []);

  // ── Load existing wishlist on mount (persists heart state across navigation) ─
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getWishlistAPI()
      .then(list => {
        const ids = list
          .map(item => item.bike?.id ?? item.bikeId ?? item.id)
          .filter(Boolean);
        setWishedIds(new Set(ids));
        window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count: ids.length } }));
      })
      .catch(() => {});
  }, []);

  // ── Sync URL params → filter (Header nav writes URL, ListProduct reads it) ─
  useEffect(() => {
    const f = {
      keyword:    searchParams.get("q")          || "",
      categoryId: searchParams.get("categoryId") || "",
      brandId:    searchParams.get("brandId")    || "",
      priceMin: "", priceMax: "", minYear: "",
    };
    setFilterForm(f);
    setActiveFilter(f);
    setPage(0);
  }, [searchParams]);

  useEffect(() => { setPage(0); }, [activeFilter]);

  // ── Fetch verified bikes ───────────────────────────────────────────────────
  useEffect(() => {
    setVerifiedLoading(true);
    getBuyerListAPI({
      category_id: activeFilter.categoryId || undefined,
      brand_id:    activeFilter.brandId    || undefined,
      page: 0, size: 100,
    })
      .then(({ content }) => {
        setVerifiedBikes(content.filter(b =>
          b.inspectionStatus === "APPROVED" || b.inspection_status === "APPROVED" || b.verified === true
        ));
      })
      .catch(() => setVerifiedBikes([]))
      .finally(() => setVerifiedLoading(false));
  }, [activeFilter.categoryId, activeFilter.brandId]);

  // ── Fetch all bikes ────────────────────────────────────────────────────────
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
      page, size: PAGE_SIZE,
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

  // ── Wishlist handlers ──────────────────────────────────────────────────────
  const handleHeartClick = (bikeId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishModal({ bikeId, type: "auth" });
      return;
    }
    if (wishedIds.has(bikeId)) {
      // Already wished → remove directly (no modal needed)
      handleRemoveWish(bikeId);
    } else {
      setWishModal({ bikeId, type: "confirm" });
    }
  };

  const handleRemoveWish = async (bikeId) => {
    try {
      await removeFromWishlistAPI(bikeId);
      setWishedIds(prev => {
        const next = new Set(prev);
        next.delete(bikeId);
        window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count: next.size } }));
        return next;
      });
    } catch { /* silent */ }
  };

  const handleConfirmWish = async () => {
    if (!wishModal) return;
    setWishLoading(true);
    try {
      await addToWishlistAPI(wishModal.bikeId);
      setWishedIds(prev => {
        const next = new Set([...prev, wishModal.bikeId]);
        window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { count: next.size } }));
        return next;
      });
    } catch { /* silent */ }
    finally { setWishLoading(false); setWishModal(null); }
  };

  // ── Filter handlers ────────────────────────────────────────────────────────
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

  // helper: remove a single active filter key
  const removeFilter = (key) => {
    setFilterForm(f => ({ ...f, [key]: "" }));
    setActiveFilter(f => ({ ...f, [key]: "" }));
  };

  const hasFilter     = Object.values(activeFilter).some(v => v !== "");
  const verTotalPages = Math.max(1, Math.ceil(verifiedBikes.length / VERIFIED_PER_PAGE));
  const verMaxPage    = verTotalPages - 1;

  return (
    <div id="products">

      {/* ══ SECTION 1: Xe đã được kiểm định ══ */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-sm">

            {/* Header strip */}
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
                {verifiedPage + 1}/{verTotalPages}
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
                        width: `${verTotalPages * 100}%`,
                        transform: `translateX(-${verifiedPage * (100 / verTotalPages)}%)`,
                      }}
                    >
                      {verifiedBikes.map(bike => (
                        <div key={bike.id}
                          style={{ width: `${100 / verifiedBikes.length}%` }}
                          className="border-r border-gray-100 last:border-r-0"
                        >
                          <VerifiedCard
                            bike={bike}
                            onNavigate={() => navigate(`/bikes/${bike.id}`)}
                            onHeartClick={handleHeartClick}
                            wishedIds={wishedIds}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {verifiedPage > 0 && (
                    <button onClick={() => setVerifiedPage(p => p - 1)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:border-emerald-400 transition-all">
                      <ChevronLeft size={18} className="text-gray-600" />
                    </button>
                  )}
                  {verifiedPage < verMaxPage && (
                    <button onClick={() => setVerifiedPage(p => p + 1)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:border-emerald-400 transition-all">
                      <ChevronRight size={18} className="text-gray-600" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Dot indicators */}
            {verTotalPages > 1 && (
              <div className="bg-white border-t border-gray-100 py-2.5 flex justify-center gap-1.5">
                {[...Array(verTotalPages)].map((_, i) => (
                  <button key={i} onClick={() => setVerifiedPage(i)}
                    className={`rounded-full transition-all ${i === verifiedPage ? "w-5 h-2 bg-emerald-500" : "w-2 h-2 bg-gray-200 hover:bg-gray-300"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: Tất cả xe đạp ══ */}
      <section id="all-bikes" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                {activeFilter.categoryId
                  ? (categories.find(c => String(c.id) === activeFilter.categoryId)?.name ?? "Danh mục")
                  : activeFilter.keyword ? `Kết quả: "${activeFilter.keyword}"`
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

          {/* Filter panel */}
          <FilterPanel
            filterForm={filterForm} setFilterForm={setFilterForm}
            categories={categories} brands={brands}
            sortBy={sortBy} setSortBy={setSortBy}
            onApply={handleApply} onClear={handleClear}
          />

          {/* Active filter chips */}
          {hasFilter && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {activeFilter.keyword    && <FilterChip label={`"${activeFilter.keyword}"`} onRemove={() => removeFilter("keyword")} />}
              {activeFilter.categoryId && <FilterChip label={categories.find(c => String(c.id) === activeFilter.categoryId)?.name ?? "Danh mục"} onRemove={() => removeFilter("categoryId")} />}
              {activeFilter.brandId    && <FilterChip label={brands.find(b => String(b.id) === activeFilter.brandId)?.name ?? "Thương hiệu"} onRemove={() => removeFilter("brandId")} />}
              {activeFilter.priceMin   && <FilterChip label={`Từ ${Number(activeFilter.priceMin).toLocaleString("vi-VN")} ₫`} onRemove={() => removeFilter("priceMin")} />}
              {activeFilter.priceMax   && <FilterChip label={`Đến ${Number(activeFilter.priceMax).toLocaleString("vi-VN")} ₫`} onRemove={() => removeFilter("priceMax")} />}
              {activeFilter.minYear    && <FilterChip label={`Từ năm ${activeFilter.minYear}`} onRemove={() => removeFilter("minYear")} />}
            </div>
          )}

          {/* Bike grid */}
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
                <RegularCard
                  key={bike.id}
                  bike={bike}
                  onNavigate={() => navigate(`/bikes/${bike.id}`)}
                  onHeartClick={handleHeartClick}
                  wishedIds={wishedIds}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 hover:border-blue-300 hover:text-blue-600 transition-colors">
                ← Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${i === page ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 hover:border-blue-300 hover:text-blue-600 transition-colors">
                Sau →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Wishlist modals */}
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
