import { useState, useEffect, useCallback } from "react";
import { getInspectionsByStatusAPI } from "../../services/Admin/inspectorService";

const STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "REQUESTED", label: "Yêu cầu" },
  { key: "ASSIGNED", label: "Đã phân công" },
  { key: "IN_PROGRESS", label: "Đang kiểm định" },
  { key: "INSPECTED", label: "Đã kiểm định" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Từ chối" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:   { label: "Yêu cầu",         color: "#d97706", bg: "#fef3c7" },
  ASSIGNED:    { label: "Đã phân công",     color: "#2563eb", bg: "#dbeafe" },
  IN_PROGRESS: { label: "Đang kiểm định",   color: "#7c3aed", bg: "#ede9fe" },
  INSPECTED:   { label: "Đã kiểm định",     color: "#0891b2", bg: "#cffafe" },
  APPROVED:    { label: "Đã duyệt",         color: "#16a34a", bg: "#dcfce7" },
  REJECTED:    { label: "Từ chối",          color: "#dc2626", bg: "#fee2e2" },
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

const COLUMNS = [
  "ID",
  "Xe đạp",
  "Chủ xe",
  "Kiểm định viên",
  "Ngày ưu tiên",
  "Phí (điểm)",
  "Trạng thái",
  "Ngày tạo",
];

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

export default function ManagerInspectionStatus() {
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await getInspectionsByStatusAPI({ status: activeStatus, page, size: 20 } as any);
      setInspections(res.data.content ?? []);
      setPageInfo({
        totalElements: res.data.totalElements ?? 0,
        totalPages: res.data.totalPages ?? 0,
        number: res.data.number ?? 0,
        size: res.data.size ?? 20,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Có lỗi xảy ra khi tải dữ liệu.");
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

  return (
    <div
      style={{
        padding: "28px 32px",
        fontFamily: "'Segoe UI', sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Quản lý trạng thái kiểm định
          </h1>
          <p
            style={{
              color: "#64748b",
              marginTop: 4,
              fontSize: 14,
              margin: "4px 0 0",
            }}
          >
            Theo dõi và lọc yêu cầu kiểm định theo trạng thái
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: loading ? "#94a3b8" : "#334155",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          Làm mới
        </button>
      </div>

      {/* Status Tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
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
              {isActive && pageInfo.totalElements > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontSize: 11,
                    padding: "1px 7px",
                    borderRadius: 999,
                  }}
                >
                  {pageInfo.totalElements}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo xe, chủ xe, kiểm định viên..."
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "9px 14px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            background: "#fff",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
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
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    style={{
                      textAlign: "center",
                      padding: 48,
                      color: "#94a3b8",
                    }}
                  >
                    Không có yêu cầu kiểm định nào.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
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
                      {item.notes && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            fontStyle: "italic",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                          }}
                        >
                          "{item.notes}"
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#334155" }}>
                      {item.ownerName}
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        color: item.inspectorName ? "#334155" : "#94a3b8",
                      }}
                    >
                      {item.inspectorName ?? "Chưa phân công"}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#334155" }}>
                      {formatDate(item.preferredDate)}
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
                    <td style={{ padding: "11px 16px" }}>
                      <StatusBadge status={item.status} />
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
        {!loading && !error && pageInfo.totalPages > 1 && (
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
              Trang {pageInfo.number + 1} / {pageInfo.totalPages} &middot;{" "}
              {pageInfo.totalElements} yêu cầu
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
                onClick={() =>
                  setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))
                }
                disabled={page >= pageInfo.totalPages - 1}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background:
                    page >= pageInfo.totalPages - 1 ? "#f1f5f9" : "#fff",
                  color:
                    page >= pageInfo.totalPages - 1 ? "#94a3b8" : "#334155",
                  cursor:
                    page >= pageInfo.totalPages - 1
                      ? "not-allowed"
                      : "pointer",
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
