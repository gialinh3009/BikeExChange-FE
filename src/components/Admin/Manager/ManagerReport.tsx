import { Banknote, ShoppingBag, Users } from "lucide-react";

const MONTHLY = [
  { month: "T10/2024", revenue: 32000000, orders: 12, customers: 8 },
  { month: "T11/2024", revenue: 45000000, orders: 18, customers: 13 },
  { month: "T12/2024", revenue: 61000000, orders: 24, customers: 19 },
  { month: "T1/2025", revenue: 38000000, orders: 15, customers: 10 },
  { month: "T2/2025", revenue: 52000000, orders: 21, customers: 16 },
  { month: "T3/2025", revenue: 78000000, orders: 30, customers: 22 },
];

const TOP_PRODUCTS = [
  { name: "Trek Marlin 5", sold: 15, revenue: 127500000 },
  { name: "Giant Escape 3", sold: 10, revenue: 62000000 },
  { name: "Merida Big Nine", sold: 8, revenue: 78400000 },
  { name: "Specialized Rockhopper", sold: 5, revenue: 60000000 },
];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

const maxRevenue = Math.max(...MONTHLY.map((m) => m.revenue));

export default function ManagerReport() {
  const totalRevenue = MONTHLY.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = MONTHLY.reduce((s, m) => s + m.orders, 0);
  const totalCustomers = MONTHLY.reduce((s, m) => s + m.customers, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Báo Cáo</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng hợp doanh thu và hiệu suất kinh doanh</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Doanh thu 6 tháng", value: fmt(totalRevenue), icon: Banknote, sub: "Tổng cộng" },
          { label: "Tổng đơn hàng", value: totalOrders, icon: ShoppingBag, sub: "6 tháng gần nhất" },
          { label: "Khách hàng mới", value: totalCustomers, icon: Users, sub: "6 tháng gần nhất" },
        ].map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                <Icon size={18} className="text-gray-700" />
              </span>
              <span className="text-xs text-gray-500">{sub}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart (bar) */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Doanh thu theo tháng</h2>
        <div className="flex items-end gap-3 h-40">
          {MONTHLY.map((m) => {
            const pct = Math.round((m.revenue / maxRevenue) * 100);
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-gray-500 font-medium">{fmt(m.revenue / 1000000)}M</div>
                <div
                  className="w-full rounded-t-lg bg-gray-900 hover:bg-gray-700 transition-all"
                  style={{ height: `${pct}%`, minHeight: "4px" }}
                  title={fmt(m.revenue)}
                />
                <div className="text-[10px] text-gray-400">{m.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly table */}
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Chi tiết theo tháng</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Tháng</th>
                <th className="px-5 py-3 font-medium text-right">Doanh thu</th>
                <th className="px-5 py-3 font-medium text-right">Đơn</th>
                <th className="px-5 py-3 font-medium text-right">KH</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY.map((m) => (
                <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{m.month}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{fmt(m.revenue)}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{m.orders}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{m.customers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Sản phẩm bán chạy</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Sản phẩm</th>
                <th className="px-5 py-3 font-medium text-right">Đã bán</th>
                <th className="px-5 py-3 font-medium text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-bold w-4">{i + 1}</span>
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">{p.sold}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{fmt(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
