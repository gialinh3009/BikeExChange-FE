import { useEffect, useState } from "react";
import { getInspectionsAPI, updateInspectionStatusAPI } from "../../services/Inspector/inspectionServices";

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

type InspectionStatus = "ASSIGNED" | "REQUESTED" | "REJECTED";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED: { label: "Chờ duyệt", color: "#d97706", bg: "#fef3c7" },
  ASSIGNED: { label: "Đã phân công", color: "#2563eb", bg: "#dbeafe" },
  IN_PROGRESS: { label: "Đang kiểm định", color: "#7c3aed", bg: "#ede9fe" },
  COMPLETED: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  APPROVED: { label: "Đã duyệt", color: "#16a34a", bg: "#dcfce7" },
  REJECTED: { label: "Từ chối", color: "#dc2626", bg: "#fee2e2" },
  CANCELLED: { label: "Đã hủy", color: "#6b7280", bg: "#f3f4f6" },
};

const ACTION_BUTTONS: { status: InspectionStatus; label: string; color: string; bg: string }[] = [
  { status: "ASSIGNED", label: "Phân công", color: "#fff", bg: "#2563eb" },
  { status: "REQUESTED", label: "Chờ duyệt", color: "#fff", bg: "#d97706" },
  { status: "REJECTED", label: "Từ chối", color: "#fff", bg: "#dc2626" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6" };

  return (
    <span
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ManagerInspection() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const PAGE_SIZE = 20;

  const fetchData = () => {
    setLoading(true);
    setError(null);

    getInspectionsAPI(page, PAGE_SIZE)
      .then((data) => {
        setInspections(data.data.content);
        setTotalPages(data.data.totalPages);
        setTotalElements(data.data.totalElements);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id: number, status: InspectionStatus) => {
    const inspection = inspections.find((i) => i.id === id);
    if (!inspection) return;

    const isFinalized = inspection.status === "APPROVED" || inspection.status === "REJECTED";

    if (isFinalized) {
      showToast("Inspection đã được admin chốt trạng thái.", false);
      return;
    }

    setLoadingStatus((prev) => ({ ...prev, [id]: status }));

    try {
      await updateInspectionStatusAPI(id, status);
      showToast("Cập nhật trạng thái thành công!", true);
      fetchData();
    } catch (err) {
      const error = err as Error;
      showToast(error.message || "Cập nhật thất bại.", false);
    } finally {
      setLoadingStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const COLUMNS = [
    "ID",
    "Xe",
    "Chủ xe",
    "Kiểm định viên",
    "Trạng thái",
    "Phí (điểm)",
    "Ngày hẹn",
    "Ngày tạo",
    "Thao tác",
  ];

  return (
    <div
      style={{
        padding: "28px 32px",
        fontFamily: "'Segoe UI', sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 9999,
            background: toast.ok ? "#dcfce7" : "#fee2e2",
            color: toast.ok ? "#16a34a" : "#dc2626",
            borderRadius: 8,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Quản lý kiểm định xe</h1>
        <p style={{ color: "#64748b" }}>
          Tổng cộng <strong>{totalElements}</strong> yêu cầu kiểm định
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {COLUMNS.map((col) => (
                <th key={col} style={{ padding: "12px 16px", textAlign: "left" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {inspections.map((item, idx) => {
              const isProcessing = item.id in loadingStatus;
              const isFinalized = item.status === "APPROVED" || item.status === "REJECTED";

              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>#{item.id}</td>

                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{item.bikeTitle}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>ID: {item.bikeId}</div>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <div>{item.ownerName}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>ID: {item.ownerId}</div>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {item.inspectorName ?? "Chưa phân công"}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={item.status} />
                  </td>

                  <td style={{ padding: "12px 16px" }}>{item.feePoints}</td>

                  <td style={{ padding: "12px 16px" }}>
                    {formatDate(item.preferredDate)}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {formatDate(item.createdAt)}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {ACTION_BUTTONS.map((btn) => {
                        const isActive = item.status === btn.status;

                        return (
                          <button
                            key={btn.status}
                            disabled={isActive || isProcessing || isFinalized}
                            onClick={() => handleStatusChange(item.id, btn.status)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor:
                                isActive || isProcessing || isFinalized
                                  ? "not-allowed"
                                  : "pointer",
                              background: isActive ? "#e2e8f0" : btn.bg,
                              color: isActive ? "#94a3b8" : btn.color,
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}