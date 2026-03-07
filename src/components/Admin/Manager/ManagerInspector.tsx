import { useState } from "react";
import { Search, Plus, ClipboardCheck, CheckCircle, Clock } from "lucide-react";

type InspectorStatus = "active" | "inactive";

const MOCK_INSPECTORS: {
  id: number; name: string; email: string; phone: string;
  specialty: string; certified: number; pending: number;
  status: InspectorStatus; joined: string;
}[] = [
  { id: 1, name: "Nguyễn Hữu Phúc", email: "phuc@bike.vn", phone: "0901234001", specialty: "MTB", certified: 34, pending: 2, status: "active", joined: "2023-05-10" },
  { id: 2, name: "Trần Quang Khải", email: "khai@bike.vn", phone: "0912345002", specialty: "Road", certified: 27, pending: 5, status: "active", joined: "2023-08-22" },
  { id: 3, name: "Lê Thị Ngọc", email: "ngoc@bike.vn", phone: "0923456003", specialty: "City", certified: 18, pending: 0, status: "inactive", joined: "2024-01-15" },
  { id: 4, name: "Phạm Anh Đức", email: "duc@bike.vn", phone: "0934567004", specialty: "MTB / Road", certified: 52, pending: 3, status: "active", joined: "2022-11-30" },
  { id: 5, name: "Bùi Thanh Hà", email: "ha@bike.vn", phone: "0945678005", specialty: "City", certified: 9, pending: 1, status: "active", joined: "2024-06-01" },
];

const STATUS_LABEL: Record<InspectorStatus, { label: string; color: string }> = {
  active: { label: "Đang làm", color: "bg-green-100 text-green-700" },
  inactive: { label: "Tạm nghỉ", color: "bg-yellow-100 text-yellow-700" },
};

export default function ManagerInspector() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = MOCK_INSPECTORS.filter((ins) => {
    const matchSearch =
      ins.name.toLowerCase().includes(search.toLowerCase()) ||
      ins.email.toLowerCase().includes(search.toLowerCase()) ||
      ins.specialty.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || ins.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCertified = MOCK_INSPECTORS.reduce((s, i) => s + i.certified, 0);
  const totalPending = MOCK_INSPECTORS.reduce((s, i) => s + i.pending, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Kiểm Định Viên</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách kiểm định viên xe đạp trong hệ thống</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800"
        >
          <Plus size={15} /> Thêm kiểm định viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Tổng kiểm định viên", value: MOCK_INSPECTORS.length, icon: ClipboardCheck },
          { label: "Xe đã kiểm định", value: totalCertified, icon: CheckCircle },
          { label: "Đang chờ kiểm định", value: totalPending, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Icon size={20} className="text-gray-700" />
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
            placeholder="Tìm kiểm định viên hoặc chuyên môn..."
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
          <option value="active">Đang làm</option>
          <option value="inactive">Tạm nghỉ</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Kiểm định viên</th>
              <th className="px-5 py-3 font-medium">SĐT</th>
              <th className="px-5 py-3 font-medium">Chuyên môn</th>
              <th className="px-5 py-3 font-medium text-right">Đã KĐ</th>
              <th className="px-5 py-3 font-medium text-right">Chờ KĐ</th>
              <th className="px-5 py-3 font-medium">Ngày vào</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ins) => (
              <tr key={ins.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900">{ins.name}</div>
                  <div className="text-xs text-gray-400">{ins.email}</div>
                </td>
                <td className="px-5 py-3 text-gray-600">{ins.phone}</td>
                <td className="px-5 py-3 text-gray-600">{ins.specialty}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">{ins.certified}</td>
                <td className="px-5 py-3 text-right">
                  {ins.pending > 0
                    ? <span className="font-semibold text-yellow-600">{ins.pending}</span>
                    : <span className="text-gray-400">0</span>}
                </td>
                <td className="px-5 py-3 text-gray-500">{ins.joined}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[ins.status].color}`}>
                    {STATUS_LABEL[ins.status].label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-blue-600 hover:underline text-xs">Sửa</button>
                    <button type="button" className="text-red-500 hover:underline text-xs">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-400">Không tìm thấy kiểm định viên</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
