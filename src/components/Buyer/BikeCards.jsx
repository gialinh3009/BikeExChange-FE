/**
 * BikeCards.jsx
 * Các card hiển thị xe: VerifiedCard, RegularCard, Skeleton
 */
import { Star, Heart, MapPin, Eye, ShieldCheck, ImageIcon } from "lucide-react";

function safeStr(v, fallback = "—") {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.name ?? v.label ?? fallback;
  return String(v);
}

export const CONDITION_META = {
  LIKE_NEW: { label: "Như mới", cls: "bg-blue-100 text-blue-700" },
  GOOD:     { label: "Tốt",     cls: "bg-green-100 text-green-700" },
  FAIR:     { label: "Khá",     cls: "bg-yellow-100 text-yellow-700" },
  POOR:     { label: "Cũ",      cls: "bg-gray-100 text-gray-600" },
  NEW:      { label: "Mới",     cls: "bg-purple-100 text-purple-700" },
};

export function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);
}

// ─── Verified Bike Card ───────────────────────────────────────────────────────
export function VerifiedCard({ bike, onNavigate, onHeartClick, wishedIds }) {
  const img = bike.media?.find(m => m.type === "IMAGE" && !m.url?.includes("example.com"))?.url;
  const condKey = safeStr(bike.condition, "");
  const cond = CONDITION_META[condKey] ?? { label: condKey || "—", cls: "bg-gray-100 text-gray-600" };
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
        <p className="text-xs text-blue-600 font-medium truncate">{safeStr(bike.brand)}</p>
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
          {safeStr(bike.location, "") && safeStr(bike.location, "") !== "Not specified" ? safeStr(bike.location, "") : "Việt Nam"}
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

// ─── Regular Bike Card ────────────────────────────────────────────────────────
export function RegularCard({ bike, onNavigate, onHeartClick, wishedIds }) {
  const img = bike.media?.find(m => m.type === "IMAGE" && !m.url?.includes("example.com"))?.url;
  const condKey2 = safeStr(bike.condition, "");
  const cond = CONDITION_META[condKey2] ?? { label: condKey2 || "—", cls: "bg-gray-100 text-gray-600" };
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
            <p className="text-xs text-blue-600 font-medium truncate">{safeStr(bike.brand)}</p>
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
            {safeStr(bike.location, "") && safeStr(bike.location, "") !== "Not specified" ? safeStr(bike.location, "") : "Việt Nam"}
          </span>
          {bike.year && <span>Năm {bike.year}</span>}
        </div>

        <div className="mt-auto pt-1">
          <div className="text-blue-600 font-bold text-base">{fmtVND(bike.pricePoints)}</div>
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

// ─── Skeleton Card ────────────────────────────────────────────────────────────
export function Skeleton() {
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
