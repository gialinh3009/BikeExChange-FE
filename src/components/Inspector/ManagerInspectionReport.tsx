import { useEffect, useState } from "react";
import { getInspectionsByStatusAPI } from "../../services/Inspector/inspectionServices";
import CreateReportForm from "./CreateReportForm";

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const COLUMNS = [
  "ID",
  "Xe",
  "Chủ xe",
  "Kiểm định viên",
  "Phí (VNĐ)",
  "Ngày hẹn",
  "Khung giờ",
  "Địa chỉ",
  "SĐT",
  "Ngày tạo",
  "Thao tác",
];

export default function ManagerInspectionReport() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(
    null
  );
  const PAGE_SIZE = 20;

  const fetchData = () => {
    setLoading(true);
    setError(null);
    getInspectionsByStatusAPI("ASSIGNED", page, PAGE_SIZE)
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
  }, [page]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReportSuccess = () => {
    setSelectedInspection(null);
    showToast("Tạo báo cáo kiểm định thành công!", true);
    fetchData();
  };

  return (
    <div
      style={{
        padding: "28px 32px",
        fontFamily: "'Segoe UI', sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 9999,
            background: toast.ok ? "#16a34a" : "#dc2626",
            color: "#fff",
            borderRadius: 8,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          Báo cáo kiểm định đã phân công
        </h1>
        <p
          style={{
            color: "#64748b",
            marginTop: 4,
            fontSize: 14,
            margin: "4px 0 0",
          }}
        >
          Tổng cộng <strong>{totalElements}</strong> yêu cầu đã được phân công
          kiểm định viên
        </p>
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
          {error}
        </div>
      )}

      {/* Table Card */}
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
                    Không có yêu cầu nào đã được phân công.
                  </td>
                </tr>
              ) : (
                inspections.map((item, idx) => (
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
                    <td style={{ padding: "11px 16px" }}>
                      {item.inspectorName ? (
                        <div>
                          <div style={{ color: "#334155", fontWeight: 500 }}>
                            {item.inspectorName}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>
                            ID: {item.inspectorId}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
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
                      {item.preferredTimeSlot || "—"}
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        color: "#334155",
                        maxWidth: 160,
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.address || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", color: "#334155" }}>
                      {item.contactPhone || "—"}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#334155" }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <button
                        onClick={() => setSelectedInspection(item)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 7,
                          border: "none",
                          background: "#2563eb",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#1d4ed8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#2563eb")
                        }
                      >
                        Tạo báo cáo
                      </button>
                    </td>
                  </tr>
                ))
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

      {/* Create Report Modal */}
      {selectedInspection && (
        <CreateReportForm
          inspectionId={selectedInspection.id}
          bikeTitle={selectedInspection.bikeTitle}
          onSuccess={handleReportSuccess}
          onCancel={() => setSelectedInspection(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
