import { useState, type ChangeEvent } from "react";
import { createInspectionReportAPI } from "../../services/Inspector/inspectionServices";
import { uploadImageToCloudinary } from "../../services/firebaseService";

interface MediaItem {
  url: string;
  type: "IMAGE" | "VIDEO";
  sortOrder: number;
}

interface ReportFormData {
  frameCondition: string;
  groupsetCondition: string;
  wheelCondition: string;
  overallScore: number;
  comments: string;
  medias: MediaItem[];
}

interface Props {
  inspectionId: number;
  bikeTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const INITIAL_FORM: ReportFormData = {
  frameCondition: "",
  groupsetCondition: "",
  wheelCondition: "",
  overallScore: 5,
  comments: "",
  medias: [],
};

const FIELD_LABELS: Record<string, string> = {
  frameCondition: "Tình trạng khung",
  groupsetCondition: "Tình trạng bộ truyền động",
  wheelCondition: "Tình trạng bánh xe",
};

function ScoreButton({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  const getColor = (v: number) => {
    if (v <= 3) return { active: "#dc2626", activeBg: "#fee2e2", hover: "#fecaca" };
    if (v <= 6) return { active: "#d97706", activeBg: "#fef3c7", hover: "#fde68a" };
    if (v <= 8) return { active: "#2563eb", activeBg: "#dbeafe", hover: "#bfdbfe" };
    return { active: "#16a34a", activeBg: "#dcfce7", hover: "#bbf7d0" };
  };
  const c = getColor(value);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: selected ? `2px solid ${c.active}` : "2px solid #e2e8f0",
        background: selected ? c.activeBg : "#fff",
        color: selected ? c.active : "#64748b",
        fontWeight: selected ? 700 : 500,
        fontSize: 14, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {value}
    </button>
  );
}

export default function CreateReportForm({ inspectionId, bikeTitle, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<ReportFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  const handleChange = (field: keyof ReportFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMedia = () => {
    if (!newMediaUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      medias: [
        ...prev.medias,
        { url: newMediaUrl.trim(), type: newMediaType, sortOrder: prev.medias.length },
      ],
    }));
    setNewMediaUrl("");
  };

  const removeMedia = (index: number) => {
    setForm((prev) => ({
      ...prev,
      medias: prev.medias.filter((_, i) => i !== index).map((m, i) => ({ ...m, sortOrder: i })),
    }));
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      e.target.value = "";
      return;
    }

    setError(null);
    setSelectedImageFiles((prev) => [...prev, ...validFiles]);
    setNewMediaType("IMAGE");
    e.target.value = "";
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.frameCondition.trim() || !form.groupsetCondition.trim() || !form.wheelCondition.trim()) {
      setError("Vui lòng điền đầy đủ tình trạng các bộ phận.");
      return;
    }
    if (!form.comments.trim()) {
      setError("Vui lòng nhập nhận xét tổng quan.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const mediasToSubmit = [...form.medias];

      if (selectedImageFiles.length > 0) {
        const uploadedImageUrls = await Promise.all(
          selectedImageFiles.map((file) => uploadImageToCloudinary(file))
        );
        const existingMediaCount = mediasToSubmit.length;

        uploadedImageUrls.forEach((url, index) => {
          mediasToSubmit.push({
            url,
            type: "IMAGE",
            sortOrder: existingMediaCount + index,
          });
        });
      }

      await createInspectionReportAPI(inspectionId, {
        ...form,
        medias: mediasToSubmit,
      });
      onSuccess();
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Tạo báo cáo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const scoreLabel = (s: number) => {
    if (s <= 3) return { text: "Kém", color: "#dc2626" };
    if (s <= 6) return { text: "Trung bình", color: "#d97706" };
    if (s <= 8) return { text: "Khá", color: "#2563eb" };
    return { text: "Tốt", color: "#16a34a" };
  };
  const sl = scoreLabel(form.overallScore);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        width: "100%", maxWidth: 580,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
          borderRadius: "16px 16px 0 0",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              Tạo báo cáo kiểm định
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              🚲 {bikeTitle} — Inspection #{inspectionId}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#f8fafc", cursor: "pointer", fontSize: 16, color: "#64748b",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Error */}
          {error && (
            <div style={{
              background: "#fee2e2", color: "#dc2626", borderRadius: 8,
              padding: "10px 14px", marginBottom: 16, fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Condition fields */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Tình trạng bộ phận
            </div>
            {(["frameCondition", "groupsetCondition", "wheelCondition"] as const).map((field) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 5 }}>
                  {FIELD_LABELS[field]} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={`Nhập tình trạng...`}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            ))}
          </div>

          {/* Overall Score */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Điểm tổng thể
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                  <ScoreButton
                    key={v}
                    value={v}
                    selected={form.overallScore === v}
                    onClick={() => handleChange("overallScore", v)}
                  />
                ))}
              </div>
              <span style={{
                fontSize: 13, fontWeight: 700, color: sl.color,
                background: sl.color + "15",
                padding: "4px 12px", borderRadius: 999,
              }}>
                {form.overallScore}/10 — {sl.text}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Nhận xét tổng quan <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <textarea
              value={form.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              placeholder="Nhập nhận xét chi tiết về tình trạng xe..."
              rows={4}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a",
                outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Media */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Hình ảnh / Video
            </div>

            {/* Add media row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <select
                value={newMediaType}
                onChange={(e) => setNewMediaType(e.target.value as "IMAGE" | "VIDEO")}
                style={{
                  padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
                  fontSize: 13, color: "#374151", background: "#f8fafc", cursor: "pointer",
                }}
              >
                <option value="IMAGE">🖼 IMAGE</option>
                <option value="VIDEO">🎬 VIDEO</option>
              </select>
              <label
                style={{
                  padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                  fontSize: 13, color: submitting ? "#94a3b8" : "#374151", background: "#f8fafc",
                  cursor: submitting ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                }}
              >
                {submitting ? "Đang xử lý..." : "Chọn ảnh (submit mới upload)"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFileChange}
                  disabled={submitting}
                  style={{ display: "none" }}
                />
              </label>
              <input
                type="text"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder="Nhập URL hoặc tải ảnh lên..."
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8,
                  border: "1px solid #e2e8f0", fontSize: 14, outline: "none",
                }}
                onKeyDown={(e) => e.key === "Enter" && addMedia()}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="button"
                onClick={addMedia}
                disabled={!newMediaUrl.trim() || submitting}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: newMediaUrl.trim() && !submitting ? "#2563eb" : "#e2e8f0",
                  color: newMediaUrl.trim() && !submitting ? "#fff" : "#94a3b8",
                  fontWeight: 600, fontSize: 13, cursor: newMediaUrl.trim() && !submitting ? "pointer" : "not-allowed",
                }}
              >+ Thêm</button>
            </div>

            {selectedImageFiles.length > 0 && (
              <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedImageFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, minWidth: 48 }}>
                      IMAGE
                    </span>
                    <span style={{
                      flex: 1, fontSize: 13, color: "#475569",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                      (upload khi submit)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      disabled={submitting}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: "none",
                        background: "#fee2e2", color: "#dc2626", cursor: submitting ? "not-allowed" : "pointer",
                        fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Media list */}
            {form.medias.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {form.medias.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, minWidth: 48 }}>
                      {m.type}
                    </span>
                    <span style={{
                      flex: 1, fontSize: 13, color: "#475569",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {m.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMedia(i)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: "none",
                        background: "#fee2e2", color: "#dc2626", cursor: "pointer",
                        fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            {form.medias.length === 0 && (
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Chưa có media nào được thêm.</p>
            )}
          </div>

          {/* Footer buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", color: "#64748b", fontWeight: 600,
                fontSize: 14, cursor: "pointer",
              }}
            >Hủy</button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: submitting ? "#93c5fd" : "#2563eb",
                color: "#fff", fontWeight: 600, fontSize: 14,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {submitting && (
                <span style={{
                  width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.6s linear infinite", display: "inline-block",
                }} />
              )}
              {submitting ? "Đang gửi..." : "Tạo báo cáo"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}