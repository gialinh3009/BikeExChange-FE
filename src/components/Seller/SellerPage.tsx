import { Bike, PackageCheck, Clock, TrendingUp, LogOut, Plus } from "lucide-react";

const stats = [
    { label: "Xe đang bán", value: "12", icon: Bike, color: "bg-blue-50 text-blue-600" },
    { label: "Đã bán", value: "34", icon: PackageCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Chờ kiểm định", value: "3", icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Doanh thu", value: "42.5M", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
];

const listings = [
    { id: 1, name: "Trek FX 3 Disc", price: "8.500.000đ", status: "Đang bán", statusColor: "bg-emerald-100 text-emerald-700" },
    { id: 2, name: "Giant Escape 3", price: "6.200.000đ", status: "Chờ kiểm định", statusColor: "bg-amber-100 text-amber-700" },
    { id: 3, name: "Specialized Sirrus", price: "12.000.000đ", status: "Đang bán", statusColor: "bg-emerald-100 text-emerald-700" },
    { id: 4, name: "Cannondale Quick 4", price: "9.800.000đ", status: "Đã bán", statusColor: "bg-gray-100 text-gray-600" },
];

export default function SellerPage() {
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
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Bike size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">BikeExchange</span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="text-sm text-gray-500">Người bán</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user?.email ?? "Người bán"}</span>
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
                    <p className="text-gray-500 text-sm mt-1">Quản lý danh sách xe và đơn hàng của bạn.</p>
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

                {/* Listings */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">Xe đang đăng bán</h2>
                        <button className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
                            <Plus size={15} />
                            Thêm xe
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-gray-400 text-left border-b border-gray-100">
                            <th className="px-6 py-3 font-medium">Tên xe</th>
                            <th className="px-6 py-3 font-medium">Giá</th>
                            <th className="px-6 py-3 font-medium">Trạng thái</th>
                        </tr>
                        </thead>
                        <tbody>
                        {listings.map((item) => (
                            <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                <td className="px-6 py-3.5 font-medium text-gray-800">{item.name}</td>
                                <td className="px-6 py-3.5 text-gray-600">{item.price}</td>
                                <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.statusColor}`}>
                      {item.status}
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
