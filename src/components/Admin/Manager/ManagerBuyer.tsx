import { useState } from "react";
import { Search, Plus, ShoppingCart, ShoppingBag, Banknote } from "lucide-react";

type BuyerStatus = "active" | "blocked";

const MOCK_BUYERS: {
  id: number; name: string; email: string; phone: string;
  location: string; purchases: number; totalSpent: number;
  status: BuyerStatus; joined: string;
}[] = [
  { id: 1, name: "Nguyễn Minh Tuấn", email: "tuan@gmail.com", phone: "0901122334", location: "Hà Nội", purchases: 3, totalSpent: 26500000, status: "active", joined: "2024-09-15" },
  { id: 2, name: "Trần Thị Mai", email: "mai@gmail.com", phone: "0912233445", location: "TP.HCM", purchases: 1, totalSpent: 8500000, status: "active", joined: "2024-11-02" },
  { id: 3, name: "Lê Văn Bình", email: "binh@gmail.com", phone: "0923344556", location: "Đà Nẵng", purchases: 5, totalSpent: 47200000, status: "active", joined: "2024-07-20" },
  { id: 4, name: "Phạm Thu Hương", email: "huong@gmail.com", phone: "0934455667", location: "Cần Thơ", purchases: 0, totalSpent: 0, status: "blocked", joined: "2025-01-10" },
  { id: 5, name: "Hoàng Đức Nam", email: "nam@gmail.com", phone: "0945566778", location: "Hải Phòng", purchases: 2, totalSpent: 18700000, status: "active", joined: "2024-12-05" },
];

const STATUS_LABEL: Record<BuyerStatus, { label: string; color: string }> = {
  active: { label: "Hoạt động", color: "bg-green-100 text-green-700" },
  blocked: { label: "Bị khóa", color: "bg-red-100 text-red-600" },
};

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

export default function ManagerBuyer() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = MOCK_BUYERS.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search);
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPurchases = MOCK_BUYERS.reduce((s, b) => s + b.purchases, 0);
  const totalSpent = MOCK_BUYERS.reduce((s, b) => s + b.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Mua</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách người mua xe đăng ký trên hệ thống</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800"
        >
          <Plus size={15} /> Thêm người mua
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Tổng người mua", value: MOCK_BUYERS.length, icon: ShoppingCart },
          { label: "Tổng lượt mua", value: totalPurchases, icon: ShoppingBag },
          { label: "Tổng chi tiêu", value: fmt(totalSpent), icon: Banknote },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 flex-1 min-w-0 max-w-sm">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 outline-none text-sm placeholder:text-gray-400"
            placeholder="Tìm người mua..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="blocked">Bị khóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Người mua</th>
              <th className="px-5 py-3 font-medium">SĐT</th>
              <th className="px-5 py-3 font-medium">Địa điểm</th>
              <th className="px-5 py-3 font-medium text-right">Lượt mua</th>
              <th className="px-5 py-3 font-medium text-right">Tổng chi tiêu</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((buyer) => (
              <tr key={buyer.id} className="border-b border-gray-50 hover:bg-blue-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{buyer.name}</div>
                  <div className="text-xs text-gray-400">{buyer.email}</div>
                </td>
                <td className="px-5 py-3 text-gray-600">{buyer.phone}</td>
                <td className="px-5 py-3 text-gray-600">{buyer.location}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{buyer.purchases}</td>
                <td className="px-5 py-3 text-right text-gray-700">{fmt(buyer.totalSpent)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[buyer.status].color}`}>
                    {STATUS_LABEL[buyer.status].label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-blue-600 hover:underline text-xs">Chi tiết</button>
                    <button type="button" className="text-red-500 hover:underline text-xs">
                      {buyer.status === "active" ? "Khóa" : "Mở khóa"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">Không tìm thấy người mua</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}