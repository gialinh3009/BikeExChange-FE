import { useState } from "react";
import { Search, Plus, Users, UserCheck, UserX } from "lucide-react";

type StaffStatus = "active" | "inactive";

const MOCK_STAFF: { id: number; name: string; email: string; role: string; phone: string; status: StaffStatus }[] = [
  { id: 1, name: "Nguyễn Văn An", email: "an@bike.vn", role: "Kho", phone: "0901234567", status: "active" },
  { id: 2, name: "Trần Thị Bình", email: "binh@bike.vn", role: "Kế toán", phone: "0912345678", status: "active" },
  { id: 3, name: "Lê Minh Cường", email: "cuong@bike.vn", role: "Bán hàng", phone: "0923456789", status: "inactive" },
];

const STATUS_LABEL: Record<StaffStatus, { label: string; color: string }> = {
  active: { label: "Đang làm", color: "bg-green-100 text-green-700" },
  inactive: { label: "Đã nghỉ", color: "bg-red-100 text-red-600" },
};

const STATS = [
  { label: "Tổng nhân viên", key: "total", icon: Users },
  { label: "Đang làm việc", key: "active", icon: UserCheck },
  { label: "Đã nghỉ", key: "inactive", icon: UserX },
];

export default function ManagerStaff() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_STAFF.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const statValues = {
    total: MOCK_STAFF.length,
    active: MOCK_STAFF.filter((s) => s.status === "active").length,
    inactive: MOCK_STAFF.filter((s) => s.status === "inactive").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Nhân Viên</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách nhân viên trong hệ thống</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800"
        >
          <Plus size={15} /> Thêm nhân viên
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STATS.map(({ label, key, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Icon size={20} className="text-gray-700" />
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
          placeholder="Tìm nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Họ tên</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Chức vụ</th>
              <th className="px-5 py-3 font-medium">SĐT</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((staff) => (
              <tr key={staff.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{staff.name}</td>
                <td className="px-5 py-3 text-gray-600">{staff.email}</td>
                <td className="px-5 py-3 text-gray-600">{staff.role}</td>
                <td className="px-5 py-3 text-gray-600">{staff.phone}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[staff.status].color}`}>
                    {STATUS_LABEL[staff.status].label}
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
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">Không tìm thấy nhân viên</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
