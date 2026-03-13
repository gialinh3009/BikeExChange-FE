import { useState } from "react";
import { FilePlus, CheckCircle2, AlertTriangle, Plus, Trash2, ChevronDown, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const INSPECTION_IDS = [
  { id: "KD-001", bike: "Trek FX 3 Disc 2023", seller: "Nguyễn Văn A" },
  { id: "KD-002", bike: "Giant Escape 3 2022", seller: "Trần Thị B" },
  { id: "KD-004", bike: "Specialized Sirrus 3.0", seller: "Phạm Thị D" },
  { id: "KD-007", bike: "Cube Attention 27.5", seller: "Đặng Văn G" },
];

const CHECKLIST_ITEMS = [
  "Khung xe (frame)",
  "Bánh trước",
  "Bánh sau",
  "Hệ thống phanh",
  "Hệ thống truyền động",
  "Giỏ đề / líp",
  "Tay lái & cổ phuộc",
  "Yên xe & cọc yên",
  "Đèn & phụ kiện",
];

interface CheckItem {
  name: string;
  status: "ok" | "issue" | "na";
  note: string;
}

interface FormState {
  inspectionId: string;
  result: string;
  score: string;
  note: string;
  issues: string[];
}

export default function CreateReport() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<FormState>({
    inspectionId: "",
    result: "Đạt",
    score: "",
    note: "",
    issues: [],
  });

  const [checklist, setChecklist] = useState<CheckItem[]>(
    CHECKLIST_ITEMS.map((name) => ({ name, status: "ok", note: "" }))
  );

  const [newIssue, setNewIssue] = useState("");

  const addIssue = () => {
    if (newIssue.trim()) {
      setForm((f) => ({ ...f, issues: [...f.issues, newIssue.trim()] }));
      setNewIssue("");
    }
  };

  const removeIssue = (idx: number) => {
    setForm((f) => ({ ...f, issues: f.issues.filter((_, i) => i !== idx) }));
  };

  const setCheckStatus = (i: number, status: CheckItem["status"]) => {
    setChecklist((prev) => prev.map((c, idx) => idx === i ? { ...c, status } : c));
  };

  const setCheckNote = (i: number, note: string) => {
    setChecklist((prev) => prev.map((c, idx) => idx === i ? { ...c, note } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Báo cáo đã được tạo!</h2>
        <p className="text-gray-500">
          Báo cáo kiểm định cho <span className="font-semibold text-gray-700">{form.inspectionId}</span> đã được lưu thành công.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/inspector/reports")}
            className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Xem danh sách báo cáo
          </button>
          <button
            onClick={() => { setSubmitted(false); setForm({ inspectionId: "", result: "Đạt", score: "", note: "", issues: [] }); }}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Tạo báo cáo khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FilePlus size={20} className="text-amber-500" />
          Tạo báo cáo kiểm định
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Điền đầy đủ thông tin để lập báo cáo kiểm định xe đạp</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">
            1. Thông tin kiểm định
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Inspection ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Mã yêu cầu kiểm định <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={form.inspectionId}
                  onChange={(e) => setForm((f) => ({ ...f, inspectionId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400 appearance-none bg-white cursor-pointer"
                >
                  <option value="">-- Chọn yêu cầu kiểm định --</option>
                  {INSPECTION_IDS.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.id} – {i.bike}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {form.inspectionId && (
                <p className="text-xs text-gray-400 mt-1">
                  Người bán: {INSPECTION_IDS.find(i => i.id === form.inspectionId)?.seller}
                </p>
              )}
            </div>

            {/* Result */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Kết quả kiểm định <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {["Đạt", "Không đạt"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, result: r }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.result === r
                        ? r === "Đạt"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {r === "Đạt" ? "✅ Đạt" : "❌ Không đạt"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Score */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Điểm đánh giá (0–100) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min={0}
                max={100}
                value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                placeholder="Nhập điểm..."
                className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
              />
              {form.score && (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        Number(form.score) >= 80 ? "bg-emerald-500" :
                        Number(form.score) >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${form.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{form.score}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">
            2. Danh sách kiểm tra chi tiết
          </h2>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={item.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  {item.status === "issue" && (
                    <input
                      type="text"
                      placeholder="Mô tả vấn đề..."
                      value={item.note}
                      onChange={(e) => setCheckNote(i, e.target.value)}
                      className="mt-1.5 w-full border border-amber-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-400 bg-white"
                    />
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {(["ok", "issue", "na"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCheckStatus(i, s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        item.status === s
                          ? s === "ok" ? "bg-emerald-500 text-white"
                            : s === "issue" ? "bg-amber-500 text-white"
                            : "bg-gray-400 text-white"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {s === "ok" ? "✓ Tốt" : s === "issue" ? "⚠ Lỗi" : "N/A"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Issues */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            3. Vấn đề phát hiện
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newIssue}
              onChange={(e) => setNewIssue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIssue(); } }}
              placeholder="Nhập vấn đề phát hiện (Enter để thêm)..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={addIssue}
              className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus size={15} />
              Thêm
            </button>
          </div>

          {form.issues.length === 0 ? (
            <p className="text-xs text-gray-400 italic flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Chưa có vấn đề nào được ghi nhận
            </p>
          ) : (
            <ul className="space-y-2">
              {form.issues.map((issue, idx) => (
                <li key={idx} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <span className="text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={13} />
                    {issue}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeIssue(idx)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 4: Note */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-3">
            4. Ghi chú kết luận
          </h2>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Nhập nhận xét tổng quát về tình trạng xe, khuyến nghị cho người mua/bán..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none transition-colors"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate("/inspector/reports")}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl text-sm transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Send size={15} />
            Gửi báo cáo
          </button>
        </div>
      </form>
    </div>
  );
}
