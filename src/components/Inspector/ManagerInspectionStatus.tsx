import { useState } from "react";
import { RefreshCw, ChevronDown, CheckCircle2, Clock, AlertCircle, XCircle, Save } from "lucide-react";

const STATUSES = [
  {
    key: "pending",
    label: "Chờ kiểm định",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    count: 8,
  },
  {
    key: "in_progress",
    label: "Đang kiểm định",
    icon: RefreshCw,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    count: 2,
  },
  {
    key: "done",
    label: "Hoàn thành",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    count: 57,
  },
  {
    key: "rejected",
    label: "Từ chối",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-50",
    border: "border-red-200",
    count: 3,
  },
];

const ITEMS = [
  { id: "KD-001", bike: "Trek FX 3 Disc 2023", seller: "Nguyễn Văn A", status: "Chờ kiểm định", note: "" },
  { id: "KD-002", bike: "Giant Escape 3 2022", seller: "Trần Thị B", status: "Đang kiểm định", note: "Đang kiểm tra khung, phanh" },
  { id: "KD-003", bike: "Cannondale Quick 4", seller: "Lê Văn C", status: "Hoàn thành", note: "Đạt tiêu chuẩn" },
  { id: "KD-004", bike: "Specialized Sirrus 3.0", seller: "Phạm Thị D", status: "Chờ kiểm định", note: "" },
  { id: "KD-005", bike: "Scott Speedster 40", seller: "Hoàng Văn E", status: "Hoàn thành", note: "Đạt tiêu chuẩn" },
  { id: "KD-006", bike: "Merida Reacto 400", seller: "Vũ Thị F", status: "Từ chối", note: "Khung bị biến dạng, không đủ tiêu chuẩn" },
  { id: "KD-007", bike: "Cube Attention 27.5", seller: "Đặng Văn G", status: "Đang kiểm định", note: "Đang kiểm tra truyền động" },
];

const STATUS_OPTS = ["Chờ kiểm định", "Đang kiểm định", "Hoàn thành", "Từ chối"];
const STATUS_CLS: Record<string, string> = {
  "Chờ kiểm định": "bg-amber-100 text-amber-700",
  "Đang kiểm định": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Từ chối": "bg-red-100 text-red-600",
};

export default function ManagerInspectionStatus() {
  const [items, setItems] = useState(ITEMS);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ status: string; note: string }>({ status: "", note: "" });
  const [saved, setSaved] = useState<string | null>(null);

  const startEdit = (id: string) => {
    const item = items.find((i) => i.id === id)!;
    setDraft({ status: item.status, note: item.note });
    setEditing(id);
  };

  const saveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: draft.status, note: draft.note } : i))
    );
    setEditing(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw size={20} className="text-amber-500" />
          Trạng thái kiểm định
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Cập nhật tiến độ và trạng thái từng yêu cầu kiểm định</p>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((s) => (
          <div
            key={s.key}
            className={`bg-white rounded-2xl border ${s.border} p-4 shadow-sm flex items-center gap-3`}
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{s.count}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status update table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Cập nhật trạng thái</h2>
          <p className="text-xs text-gray-400 mt-0.5">Nhấn "Sửa" để cập nhật trạng thái và ghi chú tiến độ</p>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="px-5 py-4 hover:bg-amber-50/30 transition-colors">
              {editing === item.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.bike}</p>
                      <p className="text-xs text-gray-400">{item.id} · {item.seller}</p>
                    </div>
                    <AlertCircle size={16} className="text-amber-500" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Trạng thái mới</label>
                      <div className="relative">
                        <select
                          value={draft.status}
                          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                          className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 appearance-none bg-white cursor-pointer"
                        >
                          {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú tiến độ</label>
                      <input
                        type="text"
                        value={draft.note}
                        onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                        placeholder="Nhập ghi chú..."
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(item.id)}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      <Save size={13} />
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{item.bike}</p>
                        <p className="text-xs text-gray-400">{item.id} · {item.seller}</p>
                      </div>
                    </div>
                    {item.note && (
                      <p className="text-xs text-gray-500 mt-1 pl-0 italic">"{item.note}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {saved === item.id && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 size={12} />
                        Đã lưu
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[item.status]}`}>
                      {item.status}
                    </span>
                    <button
                      onClick={() => startEdit(item.id)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Sửa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
