import {
    Bike,
    Heart,
    ShoppingBag,
    Truck,
    LogOut,
    Search,
    Bell,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";
import Rating from "./Rating";

const stats = [
    {
        label: "Đơn đã mua",
        value: "5",
        icon: ShoppingBag,
        color: "bg-blue-50 text-blue-600",
    },
    {
        label: "Yêu thích",
        value: "12",
        icon: Heart,
        color: "bg-rose-50 text-rose-500",
    },
    {
        label: "Đang vận chuyển",
        value: "1",
        icon: Truck,
        color: "bg-amber-50 text-amber-600",
    },
    {
        label: "Xe đã xem",
        value: "38",
        icon: Bike,
        color: "bg-purple-50 text-purple-600",
    },
];

const bikes = [
    {
        id: 1,
        name: "Trek FX 3 Disc",
        price: "8.500.000đ",
        condition: "95%",
        tag: "Mới nhất",
        rating: 4.9,
        reviews: 121,
    },
    {
        id: 2,
        name: "Giant Escape 3",
        price: "6.200.000đ",
        condition: "88%",
        tag: "Phổ biến",
        rating: 4.7,
        reviews: 98,
    },
    {
        id: 3,
        name: "Specialized Sirrus",
        price: "12.000.000đ",
        condition: "92%",
        tag: "",
        rating: 4.8,
        reviews: 75,
    },
    {
        id: 4,
        name: "Cannondale Quick 4",
        price: "9.800.000đ",
        condition: "85%",
        tag: "Giảm giá",
        rating: 4.6,
        reviews: 64,
    },
    {
        id: 5,
        name: "Scott Sub Cross 40",
        price: "7.400.000đ",
        condition: "90%",
        tag: "",
        rating: 4.5,
        reviews: 52,
    },
    {
        id: 6,
        name: "Merida Crossway 40",
        price: "5.900.000đ",
        condition: "80%",
        tag: "Nổi bật",
        rating: 4.4,
        reviews: 44,
    },
];

export default function BuyerPage() {
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    })();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/85 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md">
                            <Bike size={20} className="text-white" />
                        </div>

                        <div>
                            <div className="text-lg font-bold tracking-tight text-gray-900">
                                BikeExchange
                            </div>
                            <div className="text-xs text-gray-500">Dashboard người mua</div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="hidden w-full max-w-md px-8 lg:block">
                        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-sm">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm xe đạp, thương hiệu, dòng xe..."
                                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
                            <Bell size={18} />
                        </button>

                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-gray-800">
                                {user?.email ?? "Người mua"}
                            </p>
                            <p className="text-xs text-gray-400">Chào mừng quay lại</p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                        >
                            <LogOut size={16} />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Hero */}
                <section className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white shadow-lg">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                        <div className="absolute bottom-0 right-20 h-24 w-24 rounded-full bg-white/10" />

                        <div className="relative z-10 max-w-xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                                <Sparkles size={14} />
                                Gợi ý dành riêng cho bạn
                            </div>

                            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
                                Xin chào, {user?.email ?? "bạn"} 👋
                            </h1>
                            <p className="mt-3 text-sm text-emerald-50 md:text-base">
                                Khám phá những mẫu xe đạp chất lượng, được kiểm định rõ ràng,
                                phù hợp cho nhu cầu di chuyển và thể thao mỗi ngày.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                                    Khám phá ngay
                                </button>
                                <button className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                                    Xem xe yêu thích
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">
                                Đánh giá cửa hàng
                            </h2>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                Uy tín
              </span>
                        </div>

                        {/* Gọi component Rating ở đây */}
                        <Rating value={4.8} total={128} size={18} />

                        <div className="mt-5 space-y-4">
                            <div className="rounded-2xl bg-gray-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                    Cam kết chất lượng
                                </div>
                                <p className="text-sm text-gray-500">
                                    Tất cả xe đều được kiểm tra tình trạng trước khi đăng bán.
                                </p>
                            </div>

                            <button className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                                Xem đánh giá chi tiết
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="mb-8">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {stats.map((s) => (
                            <div
                                key={s.label}
                                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div
                                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${s.color}`}
                                >
                                    <s.icon size={22} />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {s.value}
                                </div>
                                <div className="mt-1 text-sm text-gray-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bike List */}
                <section>
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Xe đề xuất cho bạn
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Chọn nhanh các mẫu xe đang được quan tâm nhiều nhất
                            </p>
                        </div>

                        <button className="hidden items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 md:flex">
                            Xem tất cả
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {bikes.map((bike) => (
                            <div
                                key={bike.id}
                                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                            >
                                {/* Image placeholder */}
                                <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                    <div className="absolute left-4 top-4">
                                        {bike.tag && (
                                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-emerald-600 shadow-sm">
                        {bike.tag}
                      </span>
                                        )}
                                    </div>

                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/70 shadow-inner transition group-hover:scale-105">
                                        <Bike size={42} className="text-gray-400" />
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">
                                                {bike.name}
                                            </h3>
                                            <p className="mt-1 text-xl font-bold text-emerald-600">
                                                {bike.price}
                                            </p>
                                        </div>

                                        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition hover:bg-rose-100">
                                            <Heart size={18} />
                                        </button>
                                    </div>

                                    <div className="mb-3 flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tình trạng</span>
                                        <span className="font-medium text-gray-800">
                      {bike.condition}
                    </span>
                                    </div>

                                    {/* Gọi component Rating trong từng card */}
                                    <div className="mb-4">
                                        <Rating
                                            value={bike.rating}
                                            total={bike.reviews}
                                            size={15}
                                            showText={true}
                                        />
                                    </div>

                                    <button className="w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
