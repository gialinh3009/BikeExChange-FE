import { useCallback, useEffect, useState } from "react";
import { Search, Plus, ClipboardCheck, CheckCircle, Star } from "lucide-react";
import { getAdminInspectorsAPI } from "../../../services/adminUserService";

type ApiInspectorStatus = "ACTIVE" | "INACTIVE" | "BANNED" | "PENDING";
type FilterStatus = "all" | Lowercase<ApiInspectorStatus>;

interface Inspector {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: string;
  rating: number | null;
  totalBikesSold: number;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  status: ApiInspectorStatus;
  deletedAt: string | null;
  shopName: string | null;
  shopDescription: string | null;
  upgradedToSellerAt: string | null;
}

const STATUS_LABEL: Record<ApiInspectorStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Dang hoat dong", color: "bg-green-100 text-green-700" },
  INACTIVE: { label: "Tam dung", color: "bg-yellow-100 text-yellow-700" },
  BANNED: { label: "Da khoa", color: "bg-red-100 text-red-700" },
  PENDING: { label: "Cho duyet", color: "bg-blue-100 text-blue-700" },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function ManagerInspector() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const fetchInspectors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminInspectorsAPI({ page: 0, size: 10 });
      const content = response?.data?.content ?? response?.content ?? [];
      setInspectors(Array.isArray(content) ? content : []);
    } catch (err: any) {
      setError(err.message || "Khong the tai danh sach kiem dinh vien.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspectors();
  }, [fetchInspectors]);

  const filtered = inspectors.filter((inspector) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      inspector.fullName?.toLowerCase().includes(keyword) ||
      inspector.email?.toLowerCase().includes(keyword) ||
      inspector.phone?.toLowerCase().includes(keyword) ||
      inspector.address?.toLowerCase().includes(keyword);
    const matchStatus =
      filterStatus === "all" || inspector.status.toLowerCase() === filterStatus;

    return matchSearch && matchStatus;
  });

  const totalVerified = inspectors.filter((inspector) => inspector.isVerified).length;
  const averageRating = inspectors.length
    ? (
        inspectors.reduce((sum, inspector) => sum + (inspector.rating ?? 0), 0) / inspectors.length
      ).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quan Ly Kiem Dinh Vien</h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sach kiem dinh vien xe dap trong he thong
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Plus size={15} /> Them kiem dinh vien
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Tong kiem dinh vien", value: inspectors.length, icon: ClipboardCheck },
          { label: "Da xac minh", value: totalVerified, icon: CheckCircle },
          { label: "Danh gia trung binh", value: averageRating, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Tim ten, email, so dien thoai..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
        >
          <option value="all">Tat ca trang thai</option>
          <option value="active">Dang hoat dong</option>
          <option value="inactive">Tam dung</option>
          <option value="pending">Cho duyet</option>
          <option value="banned">Da khoa</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Dang tai...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchInspectors} className="text-sm text-gray-600 underline">
              Thu lai
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Kiem dinh vien</th>
                <th className="px-5 py-3 font-medium">SDT</th>
                <th className="px-5 py-3 font-medium">Dia chi</th>
                <th className="px-5 py-3 font-medium text-right">Danh gia</th>
                <th className="px-5 py-3 font-medium text-center">Xac minh</th>
                <th className="px-5 py-3 font-medium">Ngay tao</th>
                <th className="px-5 py-3 font-medium">Trang thai</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inspector) => (
                <tr key={inspector.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{inspector.fullName}</div>
                    <div className="text-xs text-gray-400">{inspector.email}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{inspector.phone || "-"}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-gray-600">
                    {inspector.address || "-"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {inspector.rating ?? 0}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        inspector.isVerified
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inspector.isVerified ? "Da xac minh" : "Chua xac minh"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(inspector.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_LABEL[inspector.status].color}`}
                    >
                      {STATUS_LABEL[inspector.status].label}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    Khong tim thay kiem dinh vien
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}