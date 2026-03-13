import { AlertCircle, ClipboardList, CheckCircle2, Bike, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { label: "Chờ kiểm định", value: "8", icon: AlertCircle, bg: "bg-amber-50", iconColor: "text-amber-500", border: "border-amber-100" },
  { label: "Đang kiểm định", value: "2", icon: ClipboardList, bg: "bg-blue-50", iconColor: "text-blue-500", border: "border-blue-100" },
  { label: "Hoàn thành", value: "57", icon: CheckCircle2, bg: "bg-emerald-50", iconColor: "text-emerald-500", border: "border-emerald-100" },
  { label: "Hôm nay", value: "3", icon: Bike, bg: "bg-purple-50", iconColor: "text-purple-500", border: "border-purple-100" },
];

const RECENT = [
  { id: "KD-001", bike: "Trek FX 3 Disc", seller: "Nguyễn Văn A", date: "10/03/2026", status: "Chờ kiểm định", statusCls: "bg-amber-100 text-amber-700" },
  { id: "KD-002", bike: "Giant Escape 3", seller: "Trần Thị B", date: "10/03/2026", status: "Đang kiểm định", statusCls: "bg-blue-100 text-blue-700" },
  { id: "KD-003", bike: "Cannondale Quick 4", seller: "Lê Văn C", date: "09/03/2026", status: "Hoàn thành", statusCls: "bg-emerald-100 text-emerald-700" },
  { id: "KD-004", bike: "Specialized Sirrus", seller: "Phạm Thị D", date: "09/03/2026", status: "Chờ kiểm định", statusCls: "bg-amber-100 text-amber-700" },
  { id: "KD-005", bike: "Scott Speedster 40", seller: "Hoàng Văn E", date: "08/03/2026", status: "Hoàn thành", statusCls: "bg-emerald-100 text-emerald-700" },
];

const SHORTCUTS = [
  { label: "Kiểm định mới", desc: "Xem danh sách yêu cầu", to: "/inspector/inspections", color: "bg-amber-500" },
  { label: "Cập nhật trạng thái", desc: "Thay đổi tiến độ kiểm định", to: "/inspector/status", color: "bg-blue-500" },
  { label: "Tạo báo cáo", desc: "Lập báo cáo kiểm định mới", to: "/inspector/create-report", color: "bg-emerald-500" },
];

export default function InspectorDashboard() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-2xl p-6 text-white">
        <p className="text-amber-100 text-sm">Chào mừng trở lại 👋</p>
        <h1 className="text-2xl font-bold mt-1">{user?.email ?? "Kiểm định viên"}</h1>
        <p className="text-amber-100 text-sm mt-1">
          Hôm nay bạn có <span className="font-semibold text-white">8 yêu cầu</span> đang chờ kiểm định.
        </p>
        <div className="flex gap-3 mt-4">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl p-3 transition-all group"
            >
              <p className="text-xs font-semibold text-white">{s.label}</p>
              <p className="text-[11px] text-amber-100 mt-0.5">{s.desc}</p>
              <ArrowRight size={13} className="text-white/60 mt-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-2xl border ${s.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.iconColor} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent inspections */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-500" />
              Yêu cầu kiểm định gần đây
            </h2>
            <Link to="/inspector/inspections" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Bike size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.bike}</p>
                  <p className="text-xs text-gray-400">{r.seller} · {r.date}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${r.statusCls}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-500" />
            Tiến độ tháng 3
          </h2>

          {[
            { label: "Hoàn thành", value: 57, total: 67, color: "bg-emerald-500" },
            { label: "Đang xử lý", value: 2, total: 67, color: "bg-blue-500" },
            { label: "Chờ kiểm định", value: 8, total: 67, color: "bg-amber-500" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 font-medium">{item.label}</span>
                <span className="text-gray-400">{item.value}/{item.total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full`}
                  style={{ width: `${Math.round((item.value / item.total) * 100)}%` }}
                />
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-amber-500" />
              Cập nhật lúc 08:30 hôm nay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
