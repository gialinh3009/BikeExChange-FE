import { useState } from "react";
import { Search, Plus, Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const MOCK_INVENTORY: {
  id: number; name: string; sku: string; category: string;
  qty: number; price: number; status: StockStatus;
}[] = [
  { id: 1, name: "Trek Marlin 5", sku: "TRK-001", category: "MTB", qty: 12, price: 8500000, status: "in_stock" },
  { id: 2, name: "Giant Escape 3", sku: "GNT-002", category: "Road", qty: 3, price: 6200000, status: "low_stock" },
  { id: 3, name: "Specialized Rockhopper", sku: "SPZ-003", category: "MTB", qty: 0, price: 12000000, status: "out_of_stock" },
  { id: 4, name: "Merida Big Nine", sku: "MRD-004", category: "MTB", qty: 8, price: 9800000, status: "in_stock" },
];

const STATUS_LABEL: Record<StockStatus, { label: string; color: string }> = {
  in_stock: { label: "Còn hàng", color: "bg-green-100 text-green-700" },
  low_stock: { label: "Sắp hết", color: "bg-yellow-100 text-yellow-700" },
  out_of_stock: { label: "Hết hàng", color: "bg-red-100 text-red-600" },
};

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

const STATS = [
  { label: "Tổng sản phẩm", key: "total", icon: Package },
  { label: "Còn hàng", key: "in_stock", icon: CheckCircle },
  { label: "Sắp hết", key: "low_stock", icon: AlertTriangle },
  { label: "Hết hàng", key: "out_of_stock", icon: XCircle },
];

export default function ManagerInventory() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_INVENTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const statValues = {
    total: MOCK_INVENTORY.length,
    in_stock: MOCK_INVENTORY.filter((i) => i.status === "in_stock").length,
    low_stock: MOCK_INVENTORY.filter((i) => i.status === "low_stock").length,
    out_of_stock: MOCK_INVENTORY.filter((i) => i.status === "out_of_stock").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Tồn Kho</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi số lượng và trạng thái hàng hóa</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800"
        >
          <Plus size={15} /> Nhập hàng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ label, key, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Icon size={20} className="text-blue-700" />
            </span>
            <div>
              <div className="text-xl font-bold text-gray-900">{statValues[key as keyof typeof statValues]}</div>
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
          placeholder="Tìm sản phẩm hoặc SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Sản phẩm</th>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Danh mục</th>
              <th className="px-5 py-3 font-medium text-right">Số lượng</th>
              <th className="px-5 py-3 font-medium text-right">Đơn giá</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50">
                <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                <td className="px-5 py-3 text-gray-600">{item.category}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{item.qty}</td>
                <td className="px-5 py-3 text-right text-gray-700">{fmt(item.price)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[item.status].color}`}>
                    {STATUS_LABEL[item.status].label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-blue-600 hover:underline text-xs">Cập nhật</button>
                    <button type="button" className="text-red-500 hover:underline text-xs">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">Không tìm thấy sản phẩm</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}