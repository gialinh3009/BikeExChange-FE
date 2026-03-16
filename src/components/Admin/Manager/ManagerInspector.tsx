import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ClipboardCheck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";
import {
  getAdminInspectionReportsAPI,
  approveInspectionAPI,
} from "../../../services/Admin/inspectorService";

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "IN_PROGRESS";
type AdminDecision = "APPROVED" | "REJECTED" | null;

interface BikeInfo {
  id: number;
  title: string;
  brand?: { name: string } | string;
  model?: string;
  year?: number;
  location?: string;
  media?: { id: number; url: string; type: string; sortOrder: number }[];
}

interface InspectorUser {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  rating?: number | null;
}

interface InspectionRequest {
  id: number;
  bike: BikeInfo;
  inspector: InspectorUser;
  address: string;
  contactPhone: string;
  feePoints: number;
  notes?: string | null;
  preferredDate: string;
  preferredTimeSlot?: string | null;
  status: RequestStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface InspectionMedia {
  id: number;
  url: string;
  type: string;
  sortOrder: number;
}

interface InspectionReport {
  id: number;
  request: InspectionRequest;
  frameCondition?: string | null;
  wheelCondition?: string | null;
  groupsetCondition?: string | null;
  overallScore?: number | null;
  comments?: string | null;
  adminDecision?: AdminDecision;
  medias?: InspectionMedia[];
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Chờ xử lý",      color: "bg-yellow-100 text-yellow-700" },
  IN_PROGRESS: { label: "Đang tiến hành", color: "bg-blue-100 text-blue-700" },
  APPROVED:    { label: "Đã duyệt",       color: "bg-green-100 text-green-700" },
  COMPLETED:   { label: "Hoàn thành",     color: "bg-green-100 text-green-700" },
  REJECTED:    { label: "Từ chối",        color: "bg-red-100 text-red-700" },
  INSPECTED:   { label: "Đã kiểm định",   color: "bg-purple-100 text-purple-700" },
};

const DECISION_CONFIG: Record<string, { label: string; color: string }> = {
  APPROVED: { label: "Đạt",     color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Không đạt", color: "bg-red-100 text-red-700" },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function getBikeBrand(bike: BikeInfo) {
  if (!bike.brand) return "";
  return typeof bike.brand === "string" ? bike.brand : bike.brand.name;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  report: InspectionReport;
  onClose: () => void;
  onApprove: (requestId: number, result: boolean) => void;
  approveLoadingId: number | null;
}

function DetailModal({ report, onClose, onApprove, approveLoadingId }: DetailModalProps) {
  const { request } = report;
  const reqStatus = REQUEST_STATUS_CONFIG[request.status] ?? { label: request.status, color: "bg-gray-100 text-gray-600" };
  const decisionCfg = report.adminDecision ? DECISION_CONFIG[report.adminDecision] : null;
  const canApprove = !report.adminDecision;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Báo cáo kiểm định #{report.id}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">

          {/* Bike */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Xe đạp</p>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{request.bike.title}</p>
              {(getBikeBrand(request.bike) || request.bike.model || request.bike.year) && (
                <p className="text-sm text-gray-500">
                  {[getBikeBrand(request.bike), request.bike.model, request.bike.year].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </section>

          {/* Inspector */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Kiểm định viên</p>
            <div className="rounded-xl border border-gray-100 p-4 space-y-1">
              <p className="font-medium text-gray-900">{request.inspector.fullName}</p>
              <p className="text-sm text-gray-500">{request.inspector.email}</p>
              {request.inspector.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone size={12} /> {request.inspector.phone}
                </p>
              )}
              {request.inspector.rating != null && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" /> {request.inspector.rating}
                </p>
              )}
            </div>
          </section>

          {/* Request info */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Thông tin yêu cầu</p>
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
              <Row label="Trạng thái yêu cầu"
                value={<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${reqStatus.color}`}>{reqStatus.label}</span>} />
              <Row label="Địa chỉ kiểm định"
                value={<span className="flex items-center gap-1"><MapPin size={12} />{request.address}</span>} />
              <Row label="SĐT liên hệ"
                value={<span className="flex items-center gap-1"><Phone size={12} />{request.contactPhone}</span>} />
              <Row label="Ngày ưu tiên"
                value={<span className="flex items-center gap-1"><Calendar size={12} />{request.preferredDate}</span>} />
              {request.preferredTimeSlot && (
                <Row label="Khung giờ" value={request.preferredTimeSlot} />
              )}
              <Row label="Phí kiểm định" value={`${request.feePoints.toLocaleString("vi-VN")} pts`} />
              {request.notes && <Row label="Ghi chú" value={request.notes} />}
              <Row label="Ngày tạo yêu cầu" value={formatDate(request.createdAt)} />
              {request.completedAt && <Row label="Hoàn thành lúc" value={formatDate(request.completedAt)} />}
            </div>
          </section>

          {/* Report details */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Kết quả kiểm định</p>
            <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
              {report.frameCondition && <Row label="Khung xe" value={report.frameCondition} />}
              {report.wheelCondition && <Row label="Bánh xe" value={report.wheelCondition} />}
              {report.groupsetCondition && <Row label="Groupset" value={report.groupsetCondition} />}
              {report.overallScore != null && (
                <Row label="Điểm tổng" value={
                  <span className="font-bold text-blue-700">{report.overallScore} / 100</span>
                } />
              )}
              {report.comments && <Row label="Nhận xét" value={report.comments} />}
              <Row label="Ngày báo cáo" value={formatDate(report.createdAt)} />
            </div>
          </section>

          {/* Admin decision */}
          {decisionCfg && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Quyết định admin</p>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${decisionCfg.color}`}>
                {decisionCfg.label}
              </span>
            </section>
          )}

          {/* Media */}
          {report.medias && report.medias.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Hình ảnh ({report.medias.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {report.medias.map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={m.url}
                      alt={`media-${m.id}`}
                      className="h-20 w-20 rounded-lg object-cover border border-gray-200 hover:opacity-80"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div className="flex gap-2">
            {canApprove && (
              <>
                <button
                  type="button"
                  disabled={approveLoadingId === request.id}
                  onClick={() => onApprove(request.id, true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={14} /> Đạt
                </button>
                <button
                  type="button"
                  disabled={approveLoadingId === request.id}
                  onClick={() => onApprove(request.id, false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle size={14} /> Không đạt
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-40 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ManagerInspector() {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDecision, setFilterDecision] = useState("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selected, setSelected] = useState<InspectionReport | null>(null);
  const [approveLoadingId, setApproveLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const PAGE_SIZE = 20;


  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminInspectionReportsAPI({ page, size: PAGE_SIZE });
      const raw = response?.data;
      if (Array.isArray(raw)) {
        setReports(raw);
        setTotalPages(1);
        setTotalElements(raw.length);
      } else {
        setReports(raw?.content ?? []);
        setTotalPages(raw?.totalPages ?? 1);
        setTotalElements(raw?.totalElements ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách báo cáo kiểm định.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(0);
  }, [search, filterDecision]);

  const handleApprove = async (requestId: number, result: boolean) => {
    setApproveLoadingId(requestId);
    try {
      await approveInspectionAPI(requestId, result);
      showToast("success", result ? "Kiểm định đạt yêu cầu." : "Kiểm định không đạt.");
      setSelected(null);
      fetchReports();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Xử lý thất bại.");
    } finally {
      setApproveLoadingId(null);
    }
  };

  const filtered = reports.filter((r) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      r.request.bike.title.toLowerCase().includes(keyword) ||
      r.request.inspector.fullName.toLowerCase().includes(keyword) ||
      r.request.inspector.email.toLowerCase().includes(keyword) ||
      String(r.id).includes(keyword);
    const matchDecision =
      filterDecision === "all" ||
      (filterDecision === "none" && !r.adminDecision) ||
      r.adminDecision === filterDecision;
    return matchSearch && matchDecision;
  });

  const pendingDecision = reports.filter((r) => !r.adminDecision).length;
  const approvedCount = reports.filter((r) => r.adminDecision === "APPROVED").length;
  const rejectedCount = reports.filter((r) => r.adminDecision === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          approveLoadingId={approveLoadingId}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Kiểm Định Viên</h1>
          <p className="mt-1 text-sm text-gray-500">Danh sách báo cáo kiểm định xe đạp</p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Tổng báo cáo",      value: totalElements,   icon: ClipboardCheck, color: "bg-blue-100 text-blue-700" },
          { label: "Chưa quyết định",   value: pendingDecision, icon: Clock,          color: "bg-yellow-100 text-yellow-700" },
          { label: "Đạt",               value: approvedCount,   icon: CheckCircle,    color: "bg-green-100 text-green-700" },
          { label: "Không đạt",         value: rejectedCount,   icon: XCircle,        color: "bg-red-100 text-red-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon size={20} />
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
        <div className="flex min-w-0 max-w-sm flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-gray-400" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Tìm tên xe, kiểm định viên, mã báo cáo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
          value={filterDecision}
          onChange={(e) => setFilterDecision(e.target.value)}
        >
          <option value="all">Tất cả quyết định</option>
          <option value="none">Chưa quyết định</option>
          <option value="APPROVED">Đạt</option>
          <option value="REJECTED">Không đạt</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchReports} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Xe đạp</th>
                <th className="px-5 py-3 font-medium">Kiểm định viên</th>
                <th className="px-5 py-3 font-medium">Ngày ưu tiên</th>
                <th className="px-5 py-3 font-medium text-right">Điểm</th>
                <th className="px-5 py-3 font-medium">Trạng thái yêu cầu</th>
                <th className="px-5 py-3 font-medium">Quyết định</th>
                <th className="px-5 py-3 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const reqStatus = REQUEST_STATUS_CONFIG[r.request.status] ?? {
                  label: r.request.status,
                  color: "bg-gray-100 text-gray-600",
                };
                const decisionCfg = r.adminDecision ? DECISION_CONFIG[r.adminDecision] : null;

                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50">
                    <td className="px-5 py-3 font-medium text-gray-500">#{r.id}</td>
                    <td className="px-5 py-3">
                      <div className="max-w-[180px] truncate font-medium text-gray-900">
                        {r.request.bike.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {getBikeBrand(r.request.bike)}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{r.request.inspector.fullName}</div>
                      <div className="text-xs text-gray-400">{r.request.inspector.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{r.request.preferredDate}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {r.overallScore ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${reqStatus.color}`}>
                        {reqStatus.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {decisionCfg ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${decisionCfg.color}`}>
                          {decisionCfg.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Chưa duyệt</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          disabled={approveLoadingId === r.request.id}
                          onClick={() => handleApprove(r.request.id, true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle size={12} /> Đạt
                        </button>
                        <button
                          type="button"
                          disabled={approveLoadingId === r.request.id}
                          onClick={() => handleApprove(r.request.id, false)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle size={12} /> Không đạt
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Không tìm thấy báo cáo kiểm định
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Trang {page + 1} / {totalPages} · {totalElements} báo cáo
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-blue-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-blue-50 disabled:opacity-40"
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}