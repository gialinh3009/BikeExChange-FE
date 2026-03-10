import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import {
  approveInspectionAPI,
  getInspectionDetailAPI,
  listInspectionsAPI,
  submitInspectionReportAPI,
  updateInspectionStatusAPI,
} from "../../services/inspectionService";

type RequestStatus = "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "INSPECTED" | "APPROVED" | "REJECTED";

type InspectionItem = {
  id: number;
  bikeId: number;
  bikeTitle: string;
  ownerId: number;
  ownerName: string;
  inspectorId?: number;
  inspectorName?: string;
  status: RequestStatus;
  feePoints: number;
  preferredDate?: string | null;
  preferredTimeSlot?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

type InspectionReportDetail = {
  id: number;
  requestId: number;
  frameCondition?: string | null;
  groupsetCondition?: string | null;
  wheelCondition?: string | null;
  overallScore?: number | null;
  adminDecision?: RequestStatus | null;
  comments?: string | null;
  createdAt?: string | null;
  medias?: { url: string; type: string; sortOrder: number }[];
};

type HistoryItem = {
  id: number;
  action: string;
  description?: string;
  actorName?: string;
  timestamp: string;
};

type InspectionDetailResponse = {
  inspection: InspectionItem;
  report?: InspectionReportDetail | null;
  history?: HistoryItem[];
};

type SectionCheck = {
  ok: boolean;
  note: string;
};

type InspectionFormState = {
  paperwork: SectionCheck;
  frame: SectionCheck;
  brakes: SectionCheck;
  drivetrain: SectionCheck;
  wheels: SectionCheck;
  cockpit: SectionCheck;
  saddle: SectionCheck;
  suspension: SectionCheck;
  tech: SectionCheck;
  testRide: SectionCheck;
  overallScore: number;
  overallComment: string;
};

const emptySection: SectionCheck = { ok: true, note: "" };

const initialFormState: InspectionFormState = {
  paperwork: { ...emptySection },
  frame: { ...emptySection },
  brakes: { ...emptySection },
  drivetrain: { ...emptySection },
  wheels: { ...emptySection },
  cockpit: { ...emptySection },
  saddle: { ...emptySection },
  suspension: { ...emptySection },
  tech: { ...emptySection },
  testRide: { ...emptySection },
  overallScore: 90,
  overallComment: "",
};

const STATUS_LABEL: Record<RequestStatus, { label: string; color: string }> = {
  REQUESTED: { label: "Chờ kiểm định", color: "bg-amber-100 text-amber-700" },
  ASSIGNED: { label: "Đã nhận việc", color: "bg-sky-100 text-sky-700" },
  IN_PROGRESS: { label: "Đang kiểm định", color: "bg-blue-100 text-blue-700" },
  INSPECTED: { label: "Đã kiểm tra", color: "bg-violet-100 text-violet-700" },
  APPROVED: { label: "Đã phê duyệt", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-100 text-red-700" },
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function isToday(dateStr?: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export default function InspectorPage() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);

  const [selected, setSelected] = useState<InspectionDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<InspectionFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const loadInspections = async (opts?: { resetPage?: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      const targetPage = opts?.resetPage ? 0 : page;
      const res = await listInspectionsAPI(
        {
          inspector_id: user?.id,
          page: targetPage,
          size: 20,
        },
        token,
      );
      const content = (res.content ?? res) as InspectionItem[];
      setInspections(content);
      setTotalPages(res.totalPages);
      if (opts?.resetPage) setPage(0);
    } catch (e) {
      setError((e as Error).message || "Không thể tải danh sách kiểm định.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInspections({ resetPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const waiting = inspections.filter((i) => i.status === "REQUESTED" || i.status === "ASSIGNED").length;
    const inProgress = inspections.filter((i) => i.status === "IN_PROGRESS").length;
    const completed = inspections.filter((i) => i.status === "APPROVED" || i.status === "INSPECTED").length;
    const today = inspections.filter((i) => isToday(i.createdAt)).length;
    return [
      { label: "Chờ kiểm định", value: waiting, icon: AlertCircle, color: "bg-amber-50 text-amber-600" },
      { label: "Đang kiểm định", value: inProgress, icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
      { label: "Hoàn thành", value: completed, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
      { label: "Hôm nay", value: today, icon: Bike, color: "bg-purple-50 text-purple-600" },
    ];
  }, [inspections]);

  const handleOpenDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      const res = (await getInspectionDetailAPI(id, token)) as InspectionDetailResponse;
      setSelected(res);
      setForm(initialFormState);
    } catch (e) {
      setError((e as Error).message || "Không thể tải chi tiết kiểm định.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleChangeSection = (key: keyof InspectionFormState, patch: Partial<SectionCheck>) => {
    if (key === "overallScore" || key === "overallComment") return;
    setForm((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as SectionCheck), ...patch },
    }));
  };

  const buildPayload = () => {
    const s = form;
    const yesNo = (sec: SectionCheck) => (sec.ok ? "Đạt" : "Không đạt");

    const frameCondition = [
      `Khung & giấy tờ: ${yesNo(s.paperwork)}. ${s.paperwork.note}`,
      `Khung sườn, mối hàn, nước sơn: ${yesNo(s.frame)}. ${s.frame.note}`,
      `Cockpit & tay lái: ${yesNo(s.cockpit)}. ${s.cockpit.note}`,
      `Yên & cọc yên: ${yesNo(s.saddle)}. ${s.saddle.note}`,
      `Hệ thống treo/phuộc: ${yesNo(s.suspension)}. ${s.suspension.note}`,
    ].join("\n");

    const groupsetCondition = [
      `Hệ thống phanh: ${yesNo(s.brakes)}. ${s.brakes.note}`,
      `Bộ truyền động (sên, líp, đĩa, đề): ${yesNo(s.drivetrain)}. ${s.drivetrain.note}`,
      `Cảm nhận khi chạy thử: ${yesNo(s.testRide)}. ${s.testRide.note}`,
    ].join("\n");

    const wheelCondition = [
      `Bánh xe & lốp: ${yesNo(s.wheels)}. ${s.wheels.note}`,
      `Công nghệ & cảm biến, QR/tem chống giả: ${yesNo(s.tech)}. ${s.tech.note}`,
    ].join("\n");

    const comments = s.overallComment;

    return {
      frameCondition,
      groupsetCondition,
      wheelCondition,
      overallScore: s.overallScore,
      comments,
      medias: [],
    };
  };

  const handleSubmitReport = async () => {
    if (!selected?.inspection) return;
    try {
      setSubmitting(true);
      const payload = buildPayload();
      await submitInspectionReportAPI(selected.inspection.id, payload, token);
      await updateInspectionStatusAPI(selected.inspection.id, "INSPECTED", token);
      await loadInspections();
      const refreshed = (await getInspectionDetailAPI(selected.inspection.id, token)) as InspectionDetailResponse;
      setSelected(refreshed);
    } catch (e) {
      setError((e as Error).message || "Gửi báo cáo kiểm định thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: RequestStatus) => {
    try {
      await updateInspectionStatusAPI(id, status, token);
      await loadInspections();
      if (selected?.inspection.id === id) {
        const refreshed = (await getInspectionDetailAPI(id, token)) as InspectionDetailResponse;
        setSelected(refreshed);
      }
    } catch (e) {
      setError((e as Error).message || "Cập nhật trạng thái kiểm định thất bại.");
    }
  };

  const handleAdminApprove = async (id: number) => {
    try {
      await approveInspectionAPI(id, token);
      await loadInspections();
      if (selected?.inspection.id === id) {
        const refreshed = (await getInspectionDetailAPI(id, token)) as InspectionDetailResponse;
        setSelected(refreshed);
      }
    } catch (e) {
      setError((e as Error).message || "Phê duyệt kiểm định thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <ClipboardList size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">BikeExchange</span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-500">Kiểm định viên</span>
          {stats[0]?.value ? (
            <span className="ml-3 inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
              {stats[0].value} yêu cầu mới
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email ?? "Kiểm định viên"}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.email ?? "bạn"} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Danh sách xe chờ kiểm định và lịch sử của bạn.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadInspections({ resetPage: true })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Request list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Danh sách yêu cầu kiểm định</h2>
            <span className="text-xs text-gray-400">Tổng cộng {inspections.length} yêu cầu trong trang hiện tại</span>
          </div>
          {loading ? (
            <div className="px-6 py-6 text-sm text-gray-500">Đang tải danh sách...</div>
          ) : inspections.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-500">Không có yêu cầu kiểm định nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-100">
                  <th className="px-6 py-3 font-medium">Xe</th>
                  <th className="px-6 py-3 font-medium">Người bán</th>
                  <th className="px-6 py-3 font-medium">Ngày yêu cầu</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => void handleOpenDetail(i.id)}
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-800">{i.bikeTitle}</td>
                    <td className="px-6 py-3.5 text-gray-600">{i.ownerName}</td>
                    <td className="px-6 py-3.5 text-gray-500">{formatDate(i.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_LABEL[i.status]?.color ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABEL[i.status]?.label ?? i.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleOpenDetail(i.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <ClipboardCheck size={14} />
                        Đánh giá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
            <button
              type="button"
              disabled={page <= 0 || loading}
              onClick={() => {
                const next = Math.max(0, page - 1);
                setPage(next);
                void loadInspections();
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-50"
            >
              Trang trước
            </button>
            <span>
              Trang <span className="font-semibold text-gray-800">{page + 1}</span>
              {typeof totalPages === "number" ? ` / ${totalPages}` : ""}
            </span>
            <button
              type="button"
              disabled={loading || (typeof totalPages === "number" ? page + 1 >= totalPages : false)}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                void loadInspections();
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-semibold disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>

        {/* Detail drawer */}
        {selected && (
          <div className="fixed inset-0 z-40 flex items-start justify-end bg-black/30">
            <div className="h-full w-full max-w-3xl bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Báo cáo kiểm định – {selected.inspection.bikeTitle}
                    </h2>
                    {(selected.inspection.status === "APPROVED" || selected.inspection.status === "INSPECTED") && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                        <ShieldCheck size={14} />
                        Đã kiểm định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Người bán: {selected.inspection.ownerName} · Phí kiểm định:{" "}
                    {Number(selected.inspection.feePoints ?? 0).toLocaleString("vi-VN")} điểm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>

              {detailLoading ? (
                <div className="px-6 py-6 text-sm text-gray-500">Đang tải chi tiết...</div>
              ) : (
                <div className="px-6 py-6 space-y-6">
                  {/* Basic info */}
                  <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 md:grid-cols-2">
                    <div>
                      <div className="font-semibold text-gray-800 mb-1.5">Thông tin yêu cầu</div>
                      <p>Ngày tạo: {formatDate(selected.inspection.createdAt)}</p>
                      <p>Ngày mong muốn: {formatDate(selected.inspection.preferredDate ?? undefined)}</p>
                      <p>Khung giờ: {selected.inspection.preferredTimeSlot ?? "—"}</p>
                      <p>Địa điểm: {selected.inspection.address ?? "—"}</p>
                      <p>SĐT liên hệ: {selected.inspection.contactPhone ?? "—"}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 mb-1.5">Trạng thái</div>
                      <p className="mb-1">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_LABEL[selected.inspection.status]?.color ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {STATUS_LABEL[selected.inspection.status]?.label ?? selected.inspection.status}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selected.inspection.status === "REQUESTED" && (
                          <button
                            type="button"
                            onClick={() => void handleUpdateStatus(selected.inspection.id, "ASSIGNED")}
                            className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                          >
                            Nhận kiểm định
                          </button>
                        )}
                        {["REQUESTED", "ASSIGNED"].includes(selected.inspection.status) && (
                          <button
                            type="button"
                            onClick={() => void handleUpdateStatus(selected.inspection.id, "IN_PROGRESS")}
                            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Bắt đầu kiểm định
                          </button>
                        )}
                        {["IN_PROGRESS", "INSPECTED"].includes(selected.inspection.status) && selected.report && (
                          <button
                            type="button"
                            onClick={() => void handleAdminApprove(selected.inspection.id)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Gửi admin phê duyệt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Existing report (if any) */}
                  {selected.report && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">Báo cáo đã gửi</span>
                      </div>
                      <p className="text-gray-700 mb-1">
                        Điểm tổng thể:{" "}
                        <span className="font-semibold">
                          {selected.report.overallScore != null ? selected.report.overallScore : "—"} / 100
                        </span>
                      </p>
                      <p className="text-gray-700 mb-1">
                        Quyết định admin:{" "}
                        <span className="font-semibold">
                          {selected.report.adminDecision
                            ? STATUS_LABEL[selected.report.adminDecision]?.label ?? selected.report.adminDecision
                            : "Chưa duyệt"}
                        </span>
                      </p>
                      {selected.report.comments && (
                        <p className="mt-1 text-gray-700 whitespace-pre-line">{selected.report.comments}</p>
                      )}
                    </div>
                  )}

                  {/* Inspection form */}
                  <div className="rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Biểu mẫu kiểm định chi tiết</h3>
                      <span className="text-xs text-gray-400">
                        Dựa trên checklist: giấy tờ, khung, phanh, truyền động, bánh, yên, chạy thử...
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {(
                        [
                          ["paperwork", "Nguồn gốc & giấy tờ (hóa đơn, bảo hành, serial, tem)"],
                          ["frame", "Khung sườn, mối hàn, nước sơn, tem chống giả"],
                          ["brakes", "Hệ thống phanh (má phanh, cần phanh, dầu phanh)"],
                          ["drivetrain", "Bộ truyền động (sên, líp, đĩa, đề, chuyển số)"],
                          ["wheels", "Bánh xe & lốp (áp suất, nứt, mòn, trục tháo nhanh)"],
                          ["cockpit", "Ghi đông, cổ lái, tay nắm – độ chắc chắn, rơ lắc"],
                          ["saddle", "Yên & cọc yên – chiều cao, độ chắc chắn"],
                          ["suspension", "Phuộc/giảm xóc – độ nhún, khóa, rò rỉ dầu"],
                          ["tech", "Mã QR, cảm biến, tính năng công nghệ đi kèm"],
                          ["testRide", "Chạy thử – tiếng động lạ, phanh, sang số"],
                        ] as [keyof InspectionFormState, string][]
                      ).map(([key, label]) => {
                        if (key === "overallScore" || key === "overallComment") return null;
                        const sec = form[key] as SectionCheck;
                        return (
                          <div key={key} className="rounded-xl border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-800">{label}</span>
                              <div className="flex items-center gap-2 text-[11px]">
                                <label className="inline-flex items-center gap-1">
                                  <input
                                    type="radio"
                                    checked={sec.ok}
                                    onChange={() => handleChangeSection(key, { ok: true })}
                                  />
                                  Đạt
                                </label>
                                <label className="inline-flex items-center gap-1">
                                  <input
                                    type="radio"
                                    checked={!sec.ok}
                                    onChange={() => handleChangeSection(key, { ok: false })}
                                  />
                                  Không đạt
                                </label>
                              </div>
                            </div>
                            <textarea
                              className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                              rows={3}
                              placeholder="Ghi chú chi tiết: vết nứt, mòn, rò rỉ, đề xuất thay thế..."
                              value={sec.note}
                              onChange={(e) => handleChangeSection(key, { note: e.target.value })}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[120px,1fr] items-start">
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">Điểm tổng thể (0–100)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                          value={form.overallScore}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              overallScore: Number(e.target.value || 0),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">
                          Nhận xét tổng quát & khuyến nghị
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                          rows={3}
                          placeholder="Tổng kết: xe phù hợp nhu cầu nào, rủi ro tiềm ẩn, linh kiện nên thay thế..."
                          value={form.overallComment}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              overallComment: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(initialFormState)}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        disabled={submitting}
                      >
                        Xóa biểu mẫu
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSubmitReport()}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={14} />
                        {submitting ? "Đang gửi..." : "Gửi báo cáo & hoàn tất"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

