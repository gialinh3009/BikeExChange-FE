import { useState } from "react";
import { Star, Heart, MapPin, Eye, SlidersHorizontal, ChevronDown } from "lucide-react";

const PRODUCTS = [
  {
    id: 1,
    name: "Giant ATX 810",
    brand: "Giant",
    category: "Địa hình",
    price: 4200000,
    originalPrice: 6500000,
    condition: "Tốt",
    conditionColor: "green",
    rating: 4.8,
    reviews: 24,
    location: "TP. Hồ Chí Minh",
    year: 2022,
    image: null,
    emoji: "🚵",
    badge: "Bán chạy",
    badgeColor: "orange",
  },
  {
    id: 2,
    name: "Trek FX 3 Disc",
    brand: "Trek",
    category: "Đường trường",
    price: 7800000,
    originalPrice: 12000000,
    condition: "Như mới",
    conditionColor: "blue",
    rating: 5.0,
    reviews: 11,
    location: "Hà Nội",
    year: 2023,
    image: null,
    emoji: "🚴",
    badge: "Mới nhất",
    badgeColor: "blue",
  },
  {
    id: 3,
    name: "Specialized Allez",
    brand: "Specialized",
    category: "Đường trường",
    price: 9500000,
    originalPrice: 15000000,
    condition: "Khá",
    conditionColor: "yellow",
    rating: 4.5,
    reviews: 8,
    location: "Đà Nẵng",
    year: 2021,
    image: null,
    emoji: "🏎️",
    badge: null,
    badgeColor: null,
  },
  {
    id: 4,
    name: "Cannondale Trail 6",
    brand: "Cannondale",
    category: "Địa hình",
    price: 5600000,
    originalPrice: 8200000,
    condition: "Tốt",
    conditionColor: "green",
    rating: 4.7,
    reviews: 19,
    location: "TP. Hồ Chí Minh",
    year: 2022,
    image: null,
    emoji: "⛰️",
    badge: "Yêu thích",
    badgeColor: "pink",
  },
  {
    id: 5,
    name: "Brompton M6L",
    brand: "Brompton",
    category: "Thành thị",
    price: 18500000,
    originalPrice: 28000000,
    condition: "Như mới",
    conditionColor: "blue",
    rating: 4.9,
    reviews: 36,
    location: "Hà Nội",
    year: 2023,
    image: null,
    emoji: "🏙️",
    badge: "Premium",
    badgeColor: "purple",
  },
  {
    id: 6,
    name: "Scott Aspect 950",
    brand: "Scott",
    category: "Địa hình",
    price: 3800000,
    originalPrice: 5500000,
    condition: "Tốt",
    conditionColor: "green",
    rating: 4.4,
    reviews: 14,
    location: "Cần Thơ",
    year: 2021,
    image: null,
    emoji: "🌲",
    badge: null,
    badgeColor: null,
  },
  {
    id: 7,
    name: "Merida Crossway 100",
    brand: "Merida",
    category: "Thành thị",
    price: 3200000,
    originalPrice: 4800000,
    condition: "Khá",
    conditionColor: "yellow",
    rating: 4.3,
    reviews: 7,
    location: "Biên Hòa",
    year: 2020,
    image: null,
    emoji: "🛤️",
    badge: null,
    badgeColor: null,
  },
  {
    id: 8,
    name: "Cube Attention 27.5",
    brand: "Cube",
    category: "Địa hình",
    price: 6200000,
    originalPrice: 9000000,
    condition: "Tốt",
    conditionColor: "green",
    rating: 4.6,
    reviews: 22,
    location: "TP. Hồ Chí Minh",
    year: 2022,
    image: null,
    emoji: "🚵",
    badge: "Giảm giá",
    badgeColor: "red",
  },
];

const CATEGORIES = ["Tất cả", "Địa hình", "Đường trường", "Thành thị"];
const SORTS = ["Mới nhất", "Giá thấp nhất", "Giá cao nhất", "Đánh giá cao nhất"];

const conditionStyles = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

const badgeStyles = {
  orange: "bg-orange-500",
  blue: "bg-blue-600",
  pink: "bg-pink-500",
  purple: "bg-purple-600",
  red: "bg-red-500",
};

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function discount(original, price) {
  return Math.round(((original - price) / original) * 100);
}

export default function ListProduct() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("Mới nhất");
  const [liked, setLiked] = useState({});

  const filtered = PRODUCTS.filter(
    (p) => activeCategory === "Tất cả" || p.category === activeCategory
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "Giá thấp nhất") return a.price - b.price;
    if (sortBy === "Giá cao nhất") return b.price - a.price;
    if (sortBy === "Đánh giá cao nhất") return b.rating - a.rating;
    return b.id - a.id;
  });

  return (
    <section id="products" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Sản phẩm nổi bật
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Xe đạp đang được{" "}
            <span className="text-blue-600">yêu thích</span>
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Hàng nghìn xe đạp chất lượng cao được kiểm định, sẵn sàng tìm chủ mới.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-sm text-gray-700 pl-3 pr-8 py-2 rounded-xl focus:outline-none focus:border-blue-400 cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sorted.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Image area */}
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 h-44 flex items-center justify-center overflow-hidden">
                <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                  {product.emoji}
                </span>

                {/* Badge */}
                {product.badge && (
                  <span
                    className={`absolute top-3 left-3 ${badgeStyles[product.badgeColor]} text-white text-xs font-semibold px-2.5 py-1 rounded-lg`}
                  >
                    {product.badge}
                  </span>
                )}

                {/* Discount badge */}
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                  -{discount(product.originalPrice, product.price)}%
                </span>

                {/* Like button */}
                <button
                  onClick={() => setLiked((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                  className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow hover:bg-white transition-colors"
                >
                  <Heart
                    size={16}
                    className={liked[product.id] ? "text-red-500 fill-red-500" : "text-gray-400"}
                  />
                </button>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-blue-600 font-medium">{product.brand}</p>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-lg ${conditionStyles[product.conditionColor]}`}
                  >
                    {product.condition}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i < Math.floor(product.rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                {/* Location & year */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {product.location}
                  </span>
                  <span>Năm {product.year}</span>
                </div>

                {/* Price */}
                <div>
                  <div className="text-blue-600 font-bold text-base">{formatPrice(product.price)}</div>
                  <div className="text-gray-400 text-xs line-through">{formatPrice(product.originalPrice)}</div>
                </div>

                {/* CTA */}
                <button className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-colors">
                  <Eye size={14} />
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load more */}
        <div className="text-center mt-10">
          <button className="inline-flex items-center gap-2 border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium px-8 py-3 rounded-xl transition-colors">
            Xem thêm sản phẩm
          </button>
        </div>
      </div>
    </section>
  );
}
