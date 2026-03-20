/**
 * ListProduct.jsx
 * Trang hiển thị xe: carousel xe kiểm định + danh sách tất cả xe + bộ lọc
 * State management + API calls — UI được tách ra BikeCards / FilterPanel / WishlistModals
 */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { RegularCard, Skeleton } from "../Buyer/BikeCards.jsx";
import FilterPanel, { FilterChip }      from "../Buyer/FilterPanel.jsx";
import { WishlistAuthModal, WishlistConfirmModal } from "../Buyer/WishlistModals.jsx";

import { getBuyerListAPI }  from "../../services/Buyer/BuyerList";
import { getCategoriesAPI } from "../../services/Buyer/Categoryservice";
import { getBrandsAPI }     from "../../services/home/brandService";
import { getUserProfileAPI } from "../../services/Buyer/Userservice";
import { addToWishlistAPI, removeFromWishlistAPI, getWishlistAPI } from "../../services/Buyer/wishlistService";

const EMPTY_FILTER = {
  keyword: "",
  categoryId: "",
  brandId: "",
  priceMin: "",
  priceMax: "",
  minYear: "",
  inspectedOnly: false,
};
const PAGE_SIZE     = 8;

function getSellerRating(bike, ratings = {}) {
  return Number(
    ratings[bike?.sellerId]
    ?? bike?.sellerRating
    ?? bike?.seller_rating
    ?? bike?.seller?.rating
    ?? bike?.user?.rating
    ?? 0
  );
}

function isInspectedBike(bike) {
  return bike?.status === "VERIFIED"
    || bike?.inspectionStatus === "APPROVED"
    || bike?.inspection_status === "APPROVED"
    || bike?.verified === true;
}

function getBikePriority(bike) {
  if (bike?.status !== "ACTIVE" && bike?.status !== "VERIFIED") return 0;
  if (isInspectedBike(bike)) return 2;
  if (bike?.status === "ACTIVE") return 1;
  return 0;
}

function compareBikes(a, b, sortBy, ratings = {}) {
  if (sortBy === "price_asc") {
    const diff = (a.pricePoints ?? 0) - (b.pricePoints ?? 0);
    return diff !== 0 ? diff : (b.id ?? 0) - (a.id ?? 0);
  }
  if (sortBy === "price_desc") {
    const diff = (b.pricePoints ?? 0) - (a.pricePoints ?? 0);
    return diff !== 0 ? diff : (b.id ?? 0) - (a.id ?? 0);
  }
  if (sortBy === "oldest") {
    return (a.id ?? 0) - (b.id ?? 0);
  }

  // newest / mặc định:
  //   1. Xe đã kiểm định (VERIFIED) luôn lên trước xe chưa kiểm định
  //   2. Trong cùng nhóm (cùng verified hoặc cùng active): seller rating cao hơn lên trước
  //   3. Cùng rating: id mới hơn (lớn hơn) lên trước
  const priorityDiff = getBikePriority(b) - getBikePriority(a);
  if (priorityDiff !== 0) return priorityDiff;

  const ratingDiff = getSellerRating(b, ratings) - getSellerRating(a, ratings);
  if (ratingDiff !== 0) return ratingDiff;

  return (b.id ?? 0) - (a.id ?? 0);
}

export default function ListProduct() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Lookup data ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [brands,     setBrands]     = useState([]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy]             = useState("newest");
  const [activeSortBy, setActiveSortBy] = useState("newest");

  // ── Filter (draft vs applied) ──────────────────────────────────────────────
  const [filterForm,   setFilterForm]   = useState(EMPTY_FILTER);
  const [activeFilter, setActiveFilter] = useState(EMPTY_FILTER);

  // ── All bikes (grid) ───────────────────────────────────────────────────────
  const [allBikes,   setAllBikes]   = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sellerRatings, setSellerRatings] = useState({});
  const fetchSeqRef = useRef(0);

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
      priceMin: "", priceMax: "", minYear: "", inspectedOnly: false,
    };
    setFilterForm(f);
    setActiveFilter(f);
    setSortBy("newest");
    setActiveSortBy("newest");
    setPage(0);
  }, [searchParams]);

  useEffect(() => { setPage(0); }, [activeFilter]);

  // ── Fetch all bikes ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSeq = ++fetchSeqRef.current;
    setAllLoading(true);

    const isInspectedOnly  = activeFilter.inspectedOnly === true;
    const isCategoryFilter = !!activeFilter.categoryId;
    const isKeywordFilter  = !!activeFilter.keyword;
    // Dùng client-side pagination khi FE cần filter thêm sau khi nhận response từ API
    // (category theo bikeType, keyword theo title+brand, inspected-only)
    const useClientPagination = isInspectedOnly || isCategoryFilter || isKeywordFilter;

    getBuyerListAPI({
      // KHÔNG gửi category_id: BE dùng join table bike_categories có thể thiếu/sai data.
      // Category filter được thực hiện client-side bằng cách so khớp
      // bike.bikeType (từ GET /bikes response) với category.name (từ GET /categories response).
      brand_id:       activeFilter.brandId ? Number(activeFilter.brandId) : undefined,
      keyword:        activeFilter.keyword || undefined,
      status:         "ACTIVE,VERIFIED",
      price_min:      activeFilter.priceMin ? Number(activeFilter.priceMin) : undefined,
      price_max:      activeFilter.priceMax ? Number(activeFilter.priceMax) : undefined,
      min_year:       activeFilter.minYear  ? Number(activeFilter.minYear)  : undefined,
      sort_by_rating: true,
      page:           useClientPagination ? 0    : page,
      size:           useClientPagination ? 1000 : PAGE_SIZE,
    })
      .then(({ content, totalPages: tp }) => {
        if (fetchSeq !== fetchSeqRef.current) return;

        // Chuẩn hóa chuỗi: lowercase trim
        const normSearch = (s) => String(s || "").toLowerCase().trim();

        // 1. Status guard
        let filtered = content.filter(b => b?.status === "ACTIVE" || b?.status === "VERIFIED");

        // 2. Keyword filter client-side: chỉ giữ xe có keyword xuất hiện trong title hoặc brand
        //    BE tìm trên cả model (field ẩn) nên trả về xe không liên quan với keyword của user.
        //    FE lọc lại theo đúng những field hiển thị trên card (title + brand).
        if (activeFilter.keyword) {
          const kw = normSearch(activeFilter.keyword);
          filtered = filtered.filter(bike =>
            normSearch(bike.title).includes(kw) ||
            normSearch(bike.brand).includes(kw)
          );
        }

        // Chuẩn hóa chuỗi: uppercase, bỏ ký tự đặc biệt (dùng cho category filter bên dưới)
        const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

        // 3. Category filter: so khớp bike.bikeType (API field) với category.name (từ GET /categories API)
        //    Cả 2 đều lấy từ API thật — chỉ là phép join xảy ra ở FE vì BE không có filter theo bikeType
        if (isCategoryFilter && categories.length > 0) {
          const selectedCat = categories.find(c => String(c.id) === activeFilter.categoryId);
          if (selectedCat) {
            const catNorm = norm(selectedCat.name);
            if (catNorm) {
              filtered = filtered.filter(bike => {
                const typeNorm = norm(bike.bikeType || bike.type);
                return typeNorm && (
                  typeNorm === catNorm ||
                  typeNorm.includes(catNorm) ||
                  catNorm.includes(typeNorm)
                );
              });
            }
          }
        }

        // 4. Inspected-only filter
        if (isInspectedOnly) {
          filtered = filtered.filter(isInspectedBike);
        }

        // 5. Sort
        const sorted = [...filtered].sort((a, b) => compareBikes(a, b, activeSortBy, sellerRatings));

        if (useClientPagination) {
          const clientPages = Math.ceil(sorted.length / PAGE_SIZE);
          const start = page * PAGE_SIZE;
          setAllBikes(sorted.slice(start, start + PAGE_SIZE));
          setTotalPages(Math.max(clientPages, 1));
        } else {
          setAllBikes(sorted);
          setTotalPages(tp);
        }
      })
      .catch(() => {
        if (fetchSeq === fetchSeqRef.current) setAllBikes([]);
      })
      .finally(() => {
        if (fetchSeq === fetchSeqRef.current) setAllLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeSortBy, page, categories]);

  // ── Resolve seller rating by sellerId (list API có thể không trả rating) ──
  useEffect(() => {
    const sellerIds = [...new Set(
      allBikes
        .map((bike) => bike?.sellerId)
        .filter((id) => id != null)
    )];

    const missingIds = sellerIds.filter((id) => sellerRatings[id] == null);
    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.map(async (sellerId) => {
        try {
          const profile = await getUserProfileAPI(sellerId);
          const rating = Number(
            profile?.rating
            ?? profile?.data?.rating
            ?? profile?.user?.rating
            ?? 0
          );
          return [sellerId, Number.isFinite(rating) ? rating : 0];
        } catch {
          return [sellerId, 0];
        }
      })
    ).then((entries) => {
      const patch = Object.fromEntries(entries);
      setSellerRatings((prev) => {
        const next = { ...prev, ...patch };
        // Re-sort sau khi có rating thực từ API
        setAllBikes(bikes =>
          [...bikes].sort((a, b) => compareBikes(a, b, activeSortBy, next))
        );
        return next;
      });
    });
  }, [allBikes, sellerRatings]);

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

  const handleBikeNavigate = (bikeId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishModal({ bikeId, type: "detail-auth" });
      return;
    }
    navigate(`/bikes/${bikeId}`);
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
    setActiveSortBy(sortBy);
    setPage(0);
    setTimeout(() => {
      document.getElementById("all-bikes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleClear = () => {
    setFilterForm(EMPTY_FILTER);
    setActiveFilter(EMPTY_FILTER);
    setSortBy("newest");
    setActiveSortBy("newest");
    setSearchParams({});
    setPage(0);
  };

  // helper: remove a single active filter key
  const removeFilter = (key) => {
    const resetValue = key === "inspectedOnly" ? false : "";
    setFilterForm(f => ({ ...f, [key]: resetValue }));
    setActiveFilter(f => ({ ...f, [key]: resetValue }));
  };

  const hasFilter = Boolean(
    activeFilter.keyword
    || activeFilter.categoryId
  );

  // allBikes đã được filter + paginate trong useEffect — dùng trực tiếp
  const displayedBikes = useMemo(() => allBikes, [allBikes]);

  const hasFilterFull = Boolean(
    activeFilter.keyword
    || activeFilter.brandId
    || activeFilter.priceMin
    || activeFilter.priceMax
    || activeFilter.minYear
    || activeFilter.inspectedOnly
  );

  return (
    <div id="products">

      {/* ══ Tất cả xe đạp ══ */}
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
                Hiển thị <span className="font-semibold text-gray-600">{displayedBikes.length}</span> xe / trang {page + 1}
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
          {(hasFilter || hasFilterFull) && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {activeFilter.keyword    && <FilterChip label={`"${activeFilter.keyword}"`} onRemove={() => removeFilter("keyword")} />}
              {activeFilter.categoryId && <FilterChip label={categories.find(c => String(c.id) === activeFilter.categoryId)?.name ?? "Danh mục"} onRemove={() => removeFilter("categoryId")} />}
              {activeFilter.brandId    && <FilterChip label={brands.find(b => String(b.id) === activeFilter.brandId)?.name ?? "Thương hiệu"} onRemove={() => removeFilter("brandId")} />}
              {activeFilter.priceMin   && <FilterChip label={`Từ ${Number(activeFilter.priceMin).toLocaleString("vi-VN")} ₫`} onRemove={() => removeFilter("priceMin")} />}
              {activeFilter.priceMax   && <FilterChip label={`Đến ${Number(activeFilter.priceMax).toLocaleString("vi-VN")} ₫`} onRemove={() => removeFilter("priceMax")} />}
              {activeFilter.minYear    && <FilterChip label={`Từ năm ${activeFilter.minYear}`} onRemove={() => removeFilter("minYear")} />}
              {activeFilter.inspectedOnly && <FilterChip label="Xe da kiem dinh" onRemove={() => removeFilter("inspectedOnly")} />}
            </div>
          )}

          {/* Bike grid */}
          {allLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : displayedBikes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              Không có xe phù hợp. Thử điều chỉnh bộ lọc nhé!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayedBikes.map(bike => (
                <RegularCard
                  key={bike.id}
                  bike={{
                    ...bike,
                    sellerRating:
                      sellerRatings[bike?.sellerId]
                      ?? bike?.sellerRating
                      ?? bike?.seller_rating
                      ?? bike?.seller?.rating
                      ?? bike?.user?.rating
                      ?? 0,
                  }}
                  onNavigate={() => handleBikeNavigate(bike.id)}
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
      {wishModal?.type === "detail-auth" && (
        <WishlistAuthModal
          title="BikeExchange"
          message="Vui lòng đăng nhập hoặc đăng ký để tiếp tục xem chi tiết xe."
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
