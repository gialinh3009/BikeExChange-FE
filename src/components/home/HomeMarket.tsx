import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, Heart, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { getBuyerListAPI } from "../../services/Buyer/BuyerList";

type BikeItem = {
  id: number;
  title: string;
  brand?: string;
  model?: string;
  year?: number;
  pricePoints: number;
  condition?: string | null;
  bikeType?: string | null;
  frameSize?: string | null;
  location?: string | null;
  status?: string;
  inspectionStatus?: string;
  media?: { url: string; type: string; sortOrder: number }[];
};

type PageResponse<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

const BIKE_TYPES = ["Tất cả", "Road", "MTB", "Gravel", "Touring", "Hybrid", "Fixie"] as const;
const BRANDS = [
  "Tất cả",
  "Giant",
  "Trek",
  "Cannondale",
  "Specialized",
  "Merida",
  "Bianchi",
  "Pinarello",
  "Scott",
  "Marin",
  "Fuji",
  "Trinx",
  "Nakamura",
  "Twitter",
  "Asama",
] as const;
const FRAME_SIZES = ["Tất cả", "XS", "S", "M", "L", "XL", "48cm", "50cm", "52cm", "54cm", "56cm", "58cm"] as const;
const CONDITIONS = ["Tất cả", "Mới", "Rất tốt", "Tốt", "Bình thường", "Đã qua sử dụng"] as const;

type VerifiedFilter = "all" | "verified" | "not_verified";

function firstImageUrl(b: BikeItem): string | null {
  const media = (b.media ?? [])
    .filter((m) => (m.type ?? "").toUpperCase() === "IMAGE" && m.url)
    .slice()
    .sort((a, c) => (a.sortOrder ?? 0) - (c.sortOrder ?? 0));
  return media[0]?.url ?? null;
}

export default function HomeMarket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [bikeType, setBikeType] = useState<(typeof BIKE_TYPES)[number]>("Tất cả");
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>("Tất cả");
  const [frameSize, setFrameSize] = useState<(typeof FRAME_SIZES)[number]>("Tất cả");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("Tất cả");
  const [verified, setVerified] = useState<VerifiedFilter>("all");

  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [data, setData] = useState<PageResponse<BikeItem>>({ content: [] });

  const statusParam = useMemo(() => {
    if (verified === "verified") return ["VERIFIED"];
    if (verified === "not_verified") return ["ACTIVE"];
    return ["ACTIVE", "VERIFIED"];
  }, [verified]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/home";
  };

  const dashboardPath = useMemo(() => {
    const role = currentUser?.role;
    if (role === "ADMIN") return "/admin";
    // Seller dùng chung dashboard Buyer tại /buyer,
    // trang quản lý bài đăng riêng vẫn là /seller.
    if (role === "SELLER") return "/buyer";
    if (role === "INSPECTOR") return "/inspector";
    if (role === "BUYER") return "/buyer";
    return "/home";
  }, [currentUser?.role]);

  const load = async (opts?: { resetPage?: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      const targetPage = opts?.resetPage ? 0 : page;
      const res = (await getBuyerListAPI({
        keyword: keyword.trim() || "",
        // getBuyerListAPI supports frame_size in JS; TS signature is loose, so cast.
        frame_size: frameSize === "Tất cả" ? undefined : frameSize,
        status: statusParam,
        page: targetPage,
        size,
      } as any)) as PageResponse<BikeItem>;
      setData(res);
      if (opts?.resetPage) setPage(0);
    } catch (e) {
      setError((e as Error).message || "Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load({ resetPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam, frameSize]);

  const filtered = useMemo(() => {
    const list = data.content ?? [];
    return list.filter((b) => {
      const okType = bikeType === "Tất cả" ? true : (b.bikeType ?? "").toLowerCase() === bikeType.toLowerCase();
      const okBrand = brand === "Tất cả" ? true : (b.brand ?? "").toLowerCase() === brand.toLowerCase();
      const okCond = condition === "Tất cả" ? true : (b.condition ?? "").toLowerCase() === condition.toLowerCase();
      return okType && okBrand && okCond;
    });
  }, [bikeType, brand, condition, data.content]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md transition group-hover:shadow-lg">
              <Bike size={20} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-emerald-700 transition">
                BikeExchange
              </div>
              <div className="text-xs text-gray-500">Marketplace</div>
            </div>
          </Link>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load({ resetPage: true });
            }}
            className="hidden w-full max-w-xl lg:flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-sm"
          >
            <Search size={16} className="text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="Tìm xe đạp, hãng, model..."
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Tìm
            </button>
          </form>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <Link
                  to={dashboardPath}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Vào dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Tất cả sản phẩm</h1>
            <p className="mt-1 text-sm text-gray-500">
              {typeof data.totalElements === "number"
                ? `${data.totalElements.toLocaleString("vi-VN")} tin`
                : "Khám phá các xe đang được đăng bán"}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            <SlidersHorizontal size={16} />
            Bộ lọc
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar filters */}
          <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm h-fit">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Loại xe</label>
                <select
                  value={bikeType}
                  onChange={(e) => setBikeType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {BIKE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Hãng xe</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Kích thước khung</label>
                <select
                  value={frameSize}
                  onChange={(e) => setFrameSize(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {FRAME_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Tình trạng</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="text-sm font-semibold text-gray-700 mb-2">Đã kiểm định</div>
                {(
                  [
                    { id: "all", label: "Tất cả" },
                    { id: "verified", label: "Đã kiểm định" },
                    { id: "not_verified", label: "Chưa kiểm định" },
                  ] as const
                ).map((o) => (
                  <label key={o.id} className="flex items-center gap-2 py-1.5 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="verified"
                      checked={verified === o.id}
                      onChange={() => setVerified(o.id)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  setBikeType("Tất cả");
                  setBrand("Tất cả");
                  setFrameSize("Tất cả");
                  setCondition("Tất cả");
                  setVerified("all");
                  setPage(0);
                  void load({ resetPage: true });
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset bộ lọc
              </button>
            </div>
          </aside>

          {/* Grid */}
          <section>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading && <div className="text-sm text-gray-500">Đang tải...</div>}

            {!loading && filtered.length === 0 && (
              <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
                Không có sản phẩm phù hợp với bộ lọc.
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((b) => {
                const img = firstImageUrl(b);
                const isVerified = b.status === "VERIFIED" || b.inspectionStatus === "APPROVED";
                return (
                  <div
                    key={b.id}
                    className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-56 bg-gray-100">
                      {img ? (
                        <img src={img} alt={b.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Bike size={44} className="text-gray-400" />
                        </div>
                      )}

                      {isVerified && (
                        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white shadow">
                          <ShieldCheck size={14} />
                          Đã kiểm định
                        </div>
                      )}

                      <button
                        type="button"
                        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow hover:bg-white"
                        title="Yêu thích"
                      >
                        <Heart size={18} />
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="text-base font-semibold text-gray-900 line-clamp-2">
                        {b.title}
                      </div>
                      <div className="mt-2 text-lg font-extrabold text-emerald-700">
                        {Number(b.pricePoints ?? 0).toLocaleString("vi-VN")} VNĐ
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {b.brand ? `${b.brand}` : ""}{b.model ? ` · ${b.model}` : ""}{b.frameSize ? ` · ${b.frameSize}` : ""}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500">{b.location ?? "—"}</div>
                        <button className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(0, page - 1);
                  setPage(next);
                  void load();
                }}
                disabled={page <= 0 || loading}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Trang trước
              </button>
              <div className="text-sm text-gray-500">
                Trang <span className="font-semibold text-gray-800">{(data.number ?? page) + 1}</span>
                {typeof data.totalPages === "number" ? ` / ${data.totalPages}` : ""}
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  void load();
                }}
                disabled={loading || (typeof data.totalPages === "number" ? page + 1 >= data.totalPages : false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

