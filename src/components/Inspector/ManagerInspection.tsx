import { useEffect, useState } from "react";
import InspectorInspectionDetail from "./InspectorInspectionDetail";
import {
  getInspectionsAPI,
  updateInspectionStatusAPI,
  rejectInspectionAPI,
} from "../../services/Inspector/inspectionServices";

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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  REQUESTED: { label: "Chờ duyệt", color: "#d97706", bg: "#fef3c7" },
  APPROVED: { label: "Đã duyệt", color: "#16a34a", bg: "#dcfce7" },
  ASSIGNED: { label: "Đã phân công", color: "#2563eb", bg: "#dbeafe" },
  IN_PROGRESS: { label: "Đang kiểm định", color: "#7c3aed", bg: "#ede9fe" },
  INSPECTED: { label: "Đã kiểm định", color: "#2563eb", bg: "#dbeafe" },
  COMPLETED: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  REJECTED: { label: "Từ chối", color: "#dc2626", bg: "#fee2e2" },
  CANCELLED: { label: "Đã hủy", color: "#6b7280", bg: "#f3f4f6" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };
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
  // State for detail modal (number | null)
  const [detailId, setDetailId] = useState<number | null>(null);
  // Get token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>("REQUESTED");
  const [loadingStatus, setLoadingStatus] = useState<Record<number, string>>(
    {},
  );
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [confirmAssignId, setConfirmAssignId] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  const fetchData = () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInspectionsAPI(page, PAGE_SIZE, statusFilter as any)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;

    setRejecting(true);
    try {
      await rejectInspectionAPI(rejectTarget, rejectReason.trim());
      showToast("Từ chối kiểm định thành công!", true);
      setRejectTarget(null);
      setRejectReason("");
      fetchData();
    } catch (err) {
      showToast((err as Error).message || "Từ chối thất bại.", false);
    } finally {
      setRejecting(false);
    }
  };
  const handleAssignConfirmed = async () => {
    if (confirmAssignId === null) return;
    const id = confirmAssignId;
    setConfirmAssignId(null);
    setLoadingStatus((prev) => ({ ...prev, [id]: "ASSIGNED" }));
    try {
      await updateInspectionStatusAPI(id, "ASSIGNED");
      showToast("Phân công thành công!", true);
      fetchData();
    } catch (err) {
      showToast((err as Error).message || "Phân công thất bại.", false);
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
        minHeight: "100vh",
      }}
    >
      {/* Confirm Assign Modal */}
      {confirmAssignId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              padding: "24px",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Xác nhận phân công
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#475569" }}>
              Bạn có chắc chắn muốn phân công kiểm định{" "}
              <strong>#{confirmAssignId}</strong> không?
            </p>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setConfirmAssignId(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleAssignConfirmed}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                padding: "20px 24px 0",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: 16,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Từ chối kiểm định #{rejectTarget}
              </h3>
            </div>
            <div style={{ padding: "16px 24px" }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Lý do từ chối <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div
              style={{
                padding: "0 24px 20px",
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                disabled={rejecting}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    rejecting || !rejectReason.trim() ? "#fca5a5" : "#dc2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    rejecting || !rejectReason.trim()
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {rejecting && (
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                      display: "inline-block",
                    }}
                  />
                )}
                {rejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ position: "relative", width: "100%", maxWidth: 650 }}>
            <InspectorInspectionDetail
              inspectionId={detailId}
              token={token}
              onClose={() => setDetailId(null)}
            />
          </div>
        </div>
      )}

      {/* Toast */}
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
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          Quản lý kiểm định xe
        </h1>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>
          Tổng cộng <strong>{totalElements}</strong> yêu cầu kiểm định
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        {[
          { value: "REQUESTED", label: "Chờ duyệt" },
          { value: "ASSIGNED", label: "Đã phân công" },
          { value: "REJECTED", label: "Từ chối" },
        ].map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value ?? "ALL"}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(0);
              }}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                border: isActive ? "none" : "1px solid #e2e8f0",
                background: isActive ? "#0f172a" : "#fff",
                color: isActive ? "#fff" : "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr
                style={{
                  background: "#f1f5f9",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "11px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: 12,
                      letterSpacing: 0.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{
                      textAlign: "center",
                      padding: 48,
                      color: "#94a3b8",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          border: "3px solid #e2e8f0",
                          borderTopColor: "#3b82f6",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{
                      textAlign: "center",
                      padding: 48,
                      color: "#94a3b8",
                    }}
                  >
                    Không có dữ liệu kiểm định.
                  </td>
                </tr>
              ) : (
                inspections.map((item, idx) => {
                  const isProcessing = item.id in loadingStatus;
                  const isAssigning = loadingStatus[item.id] === "ASSIGNED";
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "#fff" : "#fafafa",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f0f7ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          idx % 2 === 0 ? "#fff" : "#fafafa")
                      }
                    >
                      <td
                        style={{
                          padding: "11px 16px",
                          color: "#94a3b8",
                          fontWeight: 500,
                        }}
                      >
                        #{item.id}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {item.bikeTitle}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          ID: {item.bikeId}
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ color: "#334155" }}>{item.ownerName}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          ID: {item.ownerId}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          color: item.inspectorName ? "#334155" : "#94a3b8",
                        }}
                      >
                        {item.inspectorName ?? "Chưa phân công"}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <StatusBadge status={item.status} />
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {item.feePoints.toLocaleString()}
                      </td>
                      <td style={{ padding: "11px 16px", color: "#334155" }}>
                        {formatDate(item.preferredDate)}
                      </td>
                      <td style={{ padding: "11px 16px", color: "#334155" }}>
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "11px 16px" }}>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {/* Chi tiết */}
                          <button
                            onClick={() => setDetailId(item.id)}
                            style={{
                              padding: "5px 11px",
                              borderRadius: 6,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                              background: "#f1f5f9",
                              color: "#334155",
                              transition: "background 0.15s",
                            }}
                          >
                            Chi tiết
                          </button>

                          {/* Phân công */}
                          <button
                            disabled={
                              item.status === "ASSIGNED" || isProcessing
                            }
                            onClick={() => setConfirmAssignId(item.id)}
                            style={{
                              padding: "5px 11px",
                              borderRadius: 6,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              cursor:
                                item.status === "ASSIGNED" || isProcessing
                                  ? "not-allowed"
                                  : "pointer",
                              background:
                                item.status === "ASSIGNED"
                                  ? "#e2e8f0"
                                  : "#2563eb",
                              color:
                                item.status === "ASSIGNED" ? "#94a3b8" : "#fff",
                              opacity: isProcessing && !isAssigning ? 0.5 : 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              transition: "opacity 0.15s, background 0.15s",
                            }}
                          >
                            {isAssigning && (
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  border: "2px solid rgba(255,255,255,0.4)",
                                  borderTopColor: "#fff",
                                  borderRadius: "50%",
                                  animation: "spin 0.6s linear infinite",
                                  display: "inline-block",
                                }}
                              />
                            )}
                            Phân công
                          </button>

                          {/* Từ chối */}
                          <button
                            disabled={
                              item.status === "REJECTED" || isProcessing
                            }
                            onClick={() => {
                              setRejectTarget(item.id);
                              setRejectReason("");
                            }}
                            style={{
                              padding: "5px 11px",
                              borderRadius: 6,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              cursor:
                                item.status === "REJECTED" || isProcessing
                                  ? "not-allowed"
                                  : "pointer",
                              background:
                                item.status === "REJECTED"
                                  ? "#e2e8f0"
                                  : "#dc2626",
                              color:
                                item.status === "REJECTED" ? "#94a3b8" : "#fff",
                              opacity: isProcessing ? 0.5 : 1,
                              transition: "opacity 0.15s, background 0.15s",
                            }}
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Trang {page + 1} / {totalPages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: page === 0 ? "#f1f5f9" : "#fff",
                  color: page === 0 ? "#94a3b8" : "#334155",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: page >= totalPages - 1 ? "#f1f5f9" : "#fff",
                  color: page >= totalPages - 1 ? "#94a3b8" : "#334155",
                  cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
