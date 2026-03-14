import { Bike, ClipboardList, CheckCircle2, AlertCircle, LogOut } from "lucide-react";

const stats = [
  { label: "Chờ kiểm định", value: "8", icon: AlertCircle, color: "bg-amber-50 text-amber-600" },
  { label: "Đang kiểm định", value: "2", icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
  { label: "Hoàn thành", value: "57", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  { label: "Hôm nay", value: "3", icon: Bike, color: "bg-purple-50 text-purple-600" },
];

const requests = [
  { id: 1, bike: "Trek FX 3 Disc", seller: "Nguyễn Văn A", date: "08/03/2026", status: "Chờ kiểm định", statusColor: "bg-amber-100 text-amber-700" },
  { id: 2, bike: "Giant Escape 3", seller: "Trần Thị B", date: "08/03/2026", status: "Đang kiểm định", statusColor: "bg-blue-100 text-blue-700" },
  { id: 3, bike: "Cannondale Quick 4", seller: "Lê Văn C", date: "07/03/2026", status: "Hoàn thành", statusColor: "bg-emerald-100 text-emerald-700" },
  { id: 4, bike: "Specialized Sirrus", seller: "Phạm Thị D", date: "07/03/2026", status: "Chờ kiểm định", statusColor: "bg-amber-100 text-amber-700" },
];

export default function InspectorPage() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <ClipboardList size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">BikeExchange</span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-500">Kiểm định viên</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email ?? "Kiểm định viên"}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.email ?? "bạn"} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách xe chờ kiểm định hôm nay.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Request list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Danh sách yêu cầu kiểm định</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Xe</th>
                <th className="px-6 py-3 font-medium">Người bán</th>
                <th className="px-6 py-3 font-medium">Ngày yêu cầu</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <td className="px-6 py-3.5 font-medium text-gray-800">{r.bike}</td>
                  <td className="px-6 py-3.5 text-gray-600">{r.seller}</td>
                  <td className="px-6 py-3.5 text-gray-500">{r.date}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.statusColor}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
