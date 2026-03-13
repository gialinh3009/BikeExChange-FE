import { useState } from "react";
import { Search, Plus, Users, ShoppingBag, Banknote } from "lucide-react";

const MOCK_CUSTOMERS = [
  { id: 1, name: "Phạm Quốc Hùng", email: "hung@gmail.com", phone: "0901111222", orders: 5, spent: 42000000, joined: "2024-10-01" },
  { id: 2, name: "Lê Thị Hoa", email: "hoa@gmail.com", phone: "0912223333", orders: 2, spent: 15800000, joined: "2024-11-15" },
  { id: 3, name: "Trần Đức Minh", email: "minh@gmail.com", phone: "0923334444", orders: 8, spent: 78000000, joined: "2024-08-20" },
  { id: 4, name: "Nguyễn Thị Lan", email: "lan@gmail.com", phone: "0934445555", orders: 1, spent: 8500000, joined: "2025-01-05" },
];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

export default function ManagerCustomer() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const totalOrders = MOCK_CUSTOMERS.reduce((s, c) => s + c.orders, 0);
  const totalSpent = MOCK_CUSTOMERS.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Khách Hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách khách hàng và lịch sử mua hàng</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800"
        >
          <Plus size={15} /> Thêm khách hàng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Tổng khách hàng", value: MOCK_CUSTOMERS.length, icon: Users },
          { label: "Tổng đơn hàng", value: totalOrders, icon: ShoppingBag },
          { label: "Doanh thu từ KH", value: fmt(totalSpent), icon: Banknote },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Icon size={20} className="text-blue-700" />
            </span>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 w-full max-w-sm">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          className="flex-1 outline-none text-sm placeholder:text-gray-400"
          placeholder="Tìm khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Khách hàng</th>
              <th className="px-5 py-3 font-medium">SĐT</th>
              <th className="px-5 py-3 font-medium text-right">Đơn hàng</th>
              <th className="px-5 py-3 font-medium text-right">Tổng chi tiêu</th>
              <th className="px-5 py-3 font-medium">Ngày tham gia</th>
              <th className="px-5 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-50 hover:bg-blue-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-400">{customer.email}</div>
                </td>
                <td className="px-5 py-3 text-gray-600">{customer.phone}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{customer.orders}</td>
                <td className="px-5 py-3 text-right text-gray-700">{fmt(customer.spent)}</td>
                <td className="px-5 py-3 text-gray-500">{customer.joined}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-blue-600 hover:underline text-xs">Chi tiết</button>
                    <button type="button" className="text-red-500 hover:underline text-xs">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">Không tìm thấy khách hàng</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}