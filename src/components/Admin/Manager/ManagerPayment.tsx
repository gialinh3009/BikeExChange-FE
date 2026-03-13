import { useState } from "react";
import { Search, CreditCard, CheckCircle, Clock, Banknote } from "lucide-react";

type PayStatus = "success" | "pending" | "failed";

const MOCK_PAYMENTS: {
  id: string; customer: string; amount: number;
  method: string; status: PayStatus; date: string;
}[] = [
  { id: "PAY-001", customer: "Phạm Quốc Hùng", amount: 8500000, method: "Chuyển khoản", status: "success", date: "2025-03-01" },
  { id: "PAY-002", customer: "Lê Thị Hoa", amount: 6200000, method: "Tiền mặt", status: "success", date: "2025-03-02" },
  { id: "PAY-003", customer: "Trần Đức Minh", amount: 12000000, method: "Ví MoMo", status: "pending", date: "2025-03-03" },
  { id: "PAY-004", customer: "Nguyễn Thị Lan", amount: 9800000, method: "Thẻ ngân hàng", status: "failed", date: "2025-03-04" },
  { id: "PAY-005", customer: "Bùi Văn Tâm", amount: 15200000, method: "Chuyển khoản", status: "success", date: "2025-03-05" },
];

const STATUS_LABEL: Record<PayStatus, { label: string; color: string }> = {
  success: { label: "Thành công", color: "bg-green-100 text-green-700" },
  pending: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700" },
  failed: { label: "Thất bại", color: "bg-red-100 text-red-600" },
};

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

export default function ManagerPayment() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = MOCK_PAYMENTS.filter((p) => {
    const matchSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalSuccess = MOCK_PAYMENTS.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Thanh Toán</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi tất cả giao dịch thanh toán</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng giao dịch", value: MOCK_PAYMENTS.length, icon: CreditCard },
          { label: "Thành công", value: MOCK_PAYMENTS.filter((p) => p.status === "success").length, icon: CheckCircle },
          { label: "Đang xử lý", value: MOCK_PAYMENTS.filter((p) => p.status === "pending").length, icon: Clock },
          { label: "Doanh thu", value: fmt(totalSuccess), icon: Banknote },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Icon size={20} className="text-blue-700" />
            </span>
            <div>
              <div className="text-lg font-bold text-gray-900 leading-tight">{value}</div>
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
            placeholder="Tìm mã giao dịch hoặc khách hàng..."
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
          <option value="success">Thành công</option>
          <option value="pending">Đang xử lý</option>
          <option value="failed">Thất bại</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Mã GD</th>
              <th className="px-5 py-3 font-medium">Khách hàng</th>
              <th className="px-5 py-3 font-medium text-right">Số tiền</th>
              <th className="px-5 py-3 font-medium">Phương thức</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Ngày</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-50 hover:bg-blue-50">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{payment.id}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{payment.customer}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(payment.amount)}</td>
                <td className="px-5 py-3 text-gray-600">{payment.method}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[payment.status].color}`}>
                    {STATUS_LABEL[payment.status].label}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{payment.date}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">Không tìm thấy giao dịch</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}