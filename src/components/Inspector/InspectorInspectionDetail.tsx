import { useEffect, useState } from "react";
import { getInspectionDetailAPI } from "../../services/inspectionService";
import { X, Bike, MapPin, Phone, Calendar, FileText, History, AlertCircle, Loader2 } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:   { label: "Chờ duyệt",       color: "#d97706", bg: "#fef3c7" },
  APPROVED:    { label: "Đã duyệt",         color: "#16a34a", bg: "#dcfce7" },
  ASSIGNED:    { label: "Đã phân công",     color: "#2563eb", bg: "#dbeafe" },
  IN_PROGRESS: { label: "Đang kiểm định",   color: "#7c3aed", bg: "#ede9fe" },
  INSPECTED:   { label: "Đã kiểm định",     color: "#2563eb", bg: "#dbeafe" },
  COMPLETED:   { label: "Hoàn thành",       color: "#16a34a", bg: "#dcfce7" },
  REJECTED:    { label: "Từ chối",          color: "#dc2626", bg: "#fee2e2" },
  CANCELLED:   { label: "Đã hủy",           color: "#6b7280", bg: "#f3f4f6" },
};

const ACTION_LABELS: Record<string, string> = {
  requested:   "Yêu cầu kiểm định",
  approved:    "Đã duyệt",
  assigned:    "Phân công kiểm định viên",
  started:     "Bắt đầu kiểm định",
  inspected:   "Hoàn thành kiểm định",
  completed:   "Hoàn tất",
  rejected:    "Từ chối",
  cancelled:   "Đã hủy",
};

function formatDate(val: string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(val: string | null) {
  if (!val) return "—";
  return new Date(val).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ minWidth: 150, fontSize: 13, color: "#64748b", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, flex: 1 }}>{value}</span>
    </div>
  );
}

interface Props {
  inspectionId: number;
  token: string | null;
  onClose: () => void;
}

export default function InspectorInspectionDetail({ inspectionId, token, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getInspectionDetailAPI(inspectionId, token)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [inspectionId, token]);

  const { inspection, report, history } = data ?? {};
  const statusCfg = STATUS_CONFIG[inspection?.status] ?? { label: inspection?.status, color: "#6b7280", bg: "#f3f4f6" };

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={18} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Chi tiết kiểm định #{inspectionId}</div>
            {inspection && (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>{inspection.bikeTitle}</div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4, borderRadius: 8 }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: "#2563eb" }}>
            <Loader2 size={22} style={{ animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 14 }}>Đang tải...</span>
          </div>
        )}

        {error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 0", color: "#dc2626" }}>
            <AlertCircle size={28} />
            <span style={{ fontSize: 14 }}>{error}</span>
          </div>
        )}

        {!loading && !error && inspection && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Trạng thái */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                padding: "4px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                backgroundColor: statusCfg.bg, color: statusCfg.color,
              }}>
                {statusCfg.label}
              </span>
            </div>

            {/* Thông tin xe & chủ xe */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Bike size={14} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Thông tin xe & chủ xe</span>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "4px 16px" }}>
                <InfoRow label="Tên xe" value={inspection.bikeTitle} />
                <InfoRow label="ID xe" value={`#${inspection.bikeId}`} />
                <InfoRow label="Chủ xe" value={inspection.ownerName} />
                <InfoRow label="ID chủ xe" value={`#${inspection.ownerId}`} />
              </div>
            </div>

            {/* Thông tin kiểm định */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Calendar size={14} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Thông tin kiểm định</span>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "4px 16px" }}>
                <InfoRow label="Kiểm định viên" value={inspection.inspectorName ?? <span style={{ color: "#94a3b8" }}>Chưa phân công</span>} />
                <InfoRow label="Phí (điểm)" value={inspection.feePoints.toLocaleString("vi-VN") + " đ"} />
                <InfoRow label="Ngày hẹn" value={formatDate(inspection.preferredDate)} />
                <InfoRow label="Khung giờ" value={inspection.preferredTimeSlot ?? "—"} />
                <InfoRow label="Ngày tạo" value={formatDateTime(inspection.createdAt)} />
                <InfoRow label="Bắt đầu" value={formatDateTime(inspection.startedAt)} />
                <InfoRow label="Hoàn thành" value={formatDateTime(inspection.completedAt)} />
              </div>
            </div>

            {/* Địa chỉ & liên hệ */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <MapPin size={14} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Địa chỉ & liên hệ</span>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "4px 16px" }}>
                <InfoRow label="Địa chỉ" value={inspection.address} />
                <InfoRow
                  label="Số điện thoại"
                  value={
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone size={12} color="#64748b" />
                      {inspection.contactPhone}
                    </span>
                  }
                />
                <InfoRow label="Ghi chú" value={inspection.notes || <span style={{ color: "#94a3b8" }}>Không có</span>} />
              </div>
            </div>

            {/* Báo cáo */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <FileText size={14} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Báo cáo kiểm định</span>
              </div>
              {report ? (
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "4px 16px" }}>
                  <InfoRow label="Điểm tổng thể" value={`${report.overallScore}/10`} />
                  <InfoRow label="Nhận xét" value={report.comments} />
                  {report.medias?.filter((m: any) => m.type === "IMAGE").length > 0 && (
                    <div style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Hình ảnh</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {report.medias.filter((m: any) => m.type === "IMAGE").map((m: any, i: number) => (
                          <img key={i} src={m.url} alt="Ảnh kiểm định" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>
                  Chưa có báo cáo kiểm định.
                </div>
              )}
            </div>

            {/* Lịch sử */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <History size={14} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Lịch sử hoạt động</span>
              </div>
              {history?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {history.map((h: any, i: number) => (
                    <div key={h.id} style={{ display: "flex", gap: 12, paddingBottom: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb", marginTop: 3, flexShrink: 0 }} />
                        {i < history.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                          {ACTION_LABELS[h.action] ?? h.action}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{formatDateTime(h.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Chưa có lịch sử.</div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9" }}>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "9px", borderRadius: 10, border: "1px solid #e2e8f0",
            background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Đóng
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
