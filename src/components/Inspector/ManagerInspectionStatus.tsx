import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";
import { getInspectionsByStatusAPI } from "../../services/Admin/inspectorService";

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả", icon: ClipboardCheck, color: "text-gray-600", bg: "bg-gray-100" },
  { key: "REQUESTED", label: "Yêu cầu", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  { key: "ASSIGNED", label: "Đã phân công", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-100" },
  { key: "INSPECTED", label: "Đã kiểm định", icon: ClipboardCheck, color: "text-purple-600", bg: "bg-purple-100" },
  { key: "APPROVED", label: "Đã duyệt", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  { key: "REJECTED", label: "Từ chối", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
];

const STATUS_CLS: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  INSPECTED: "bg-purple-100 text-purple-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Yêu cầu",
  ASSIGNED: "Đã phân công",
  INSPECTED: "Đã kiểm định",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

interface Inspection {
  id: number;
  bikeId: number;
  bikeTitle: string;
  ownerId: number;
  ownerName: string;
  inspectorId: number | null;
  inspectorName: string | null;
  status: string;
  feePoints: number;
  preferredDate: string;
  preferredTimeSlot: string;
  address: string;
  contactPhone: string;
  notes: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface PageInfo {
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export default function ManagerInspectionStatus() {
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ totalElements: 0, totalPages: 0, number: 0, size: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInspectionsByStatusAPI({ status: activeStatus, page, size: 20 } as any);
      setInspections(res.data.content ?? []);
      setPageInfo({
        totalElements: res.data.totalElements ?? 0,
        totalPages: res.data.totalPages ?? 0,
        number: res.data.number ?? 0,
        size: res.data.size ?? 20,
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveStatus(key);
    setPage(0);
    setSearch("");
  };

  const filtered = inspections.filter(
    (item) =>
      item.bikeTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (item.inspectorName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw size={20} className="text-amber-500" />
            Quản lý trạng thái kiểm định
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Theo dõi và lọc yêu cầu kiểm định theo trạng thái
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {isActive && pageInfo.totalElements > 0 && (
                <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pageInfo.totalElements}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo xe, chủ xe, kiểm định viên..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-amber-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Danh sách kiểm định</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? "Đang tải..." : `${pageInfo.totalElements} yêu cầu`}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-amber-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchData}
              className="text-xs text-amber-600 hover:underline mt-1"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <ClipboardCheck size={32} />
            <p className="text-sm">Không có yêu cầu kiểm định nào</p>
          </div>
        )}

        {/* Data */}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">ID</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Xe đạp</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Chủ xe</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Kiểm định viên</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Ngày ưu tiên</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Phí (điểm)</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Trạng thái</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">#{item.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{item.bikeTitle}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 italic truncate max-w-[200px]">
                          "{item.notes}"
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{item.ownerName}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {item.inspectorName ?? (
                        <span className="text-gray-300 italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(item.preferredDate)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{item.feePoints}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          STATUS_CLS[item.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pageInfo.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Trang {pageInfo.number + 1} / {pageInfo.totalPages} · {pageInfo.totalElements} yêu cầu
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))}
                disabled={page >= pageInfo.totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}