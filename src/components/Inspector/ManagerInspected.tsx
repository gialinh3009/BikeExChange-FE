import { useEffect, useState } from "react";
import { getInspectionsByStatusAPI } from "../../services/Inspector/inspectionServices";

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

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLUMNS = [
  "ID",
  "Xe",
  "Chủ xe",
  "Kiểm định viên",
  "Phí (VNĐ)",
  "Ngày hẹn",
  "Bắt đầu",
  "Hoàn thành",
  "Ngày tạo",
];

export default function ManagerInspected() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getInspectionsByStatusAPI("INSPECTED", page, PAGE_SIZE)
      .then((data) => {
        setInspections(data.data.content);
        setTotalPages(data.data.totalPages);
        setTotalElements(data.data.totalElements);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div
      style={{
        padding: "28px 32px",
        fontFamily: "'Segoe UI', sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          Danh sách đã kiểm định
        </h1>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: 14, margin: "4px 0 0" }}>
          Tổng cộng <strong>{totalElements}</strong> xe đã hoàn thành kiểm định
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
                    Chưa có xe nào hoàn thành kiểm định.
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
                      {formatDateTime(item.startedAt)}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      {item.completedAt ? (
                        <span style={{ color: "#16a34a", fontWeight: 500 }}>
                          {formatDateTime(item.completedAt)}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#334155" }}>
                      {formatDate(item.createdAt)}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
