import { useEffect, useMemo, useState } from "react";
import {
  
  PackagePlus,
  RefreshCw,
  Power,
  Pencil,
  Trash2,
  Search,
  Layers,
  Activity,
  CircleDollarSign,
  Archive,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  ShieldAlert,
} from "lucide-react";import { getBikePostFeeAPI } from "../../../services/settingsService";
import {
  createAdminComboAPI,
  deleteAdminComboAPI,
  deactivateAdminComboAPI,
  getAdminCombosAPI,
  updateAdminComboAPI,
} from "../../../services/Admin/comboService";

type Combo = {
  id: number;
  name: string;
  pointsCost: number;
  postLimit: number;
  active: boolean;
};

type ComboForm = {
  name: string;
  pointsCost: string;
  postLimit: string;
  active: boolean;
};

const defaultForm: ComboForm = {
  name: "",
  pointsCost: "",
  postLimit: "",
  active: true,
};

type FilterMode = "all" | "active" | "inactive";

type ChangeRow = {
  label: string;
  before: string;
  after: string;
};

type ConfirmAction = {
  kind: "create" | "update" | "deactivate" | "delete";
  comboId?: number;
  payload?: { name: string; pointsCost: number; postLimit: number; active: boolean };
  title: string;
  description: string;
  changes: ChangeRow[];
};

export default function ManagerCombo() {

  // Giá đăng lẻ lấy động từ API
  const [singlePostPrice, setSinglePostPrice] = useState<number>(0);
  useEffect(() => {
    getBikePostFeeAPI().then(setSinglePostPrice).catch(() => setSinglePostPrice(0));
  }, []);

  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ComboForm>(defaultForm);
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusPrice, setFocusPrice] = useState(false);
  const [focusPostLimit, setFocusPostLimit] = useState(false);

  const activeCount = useMemo(() => combos.filter((c) => c.active).length, [combos]);
  const inactiveCount = Math.max(combos.length - activeCount, 0);
  const avgCostPerPost = useMemo(() => {
    if (combos.length === 0) return 0;
    const valid = combos.filter((c) => c.postLimit > 0);
    if (valid.length === 0) return 0;
    const total = valid.reduce((sum, c) => sum + c.pointsCost / c.postLimit, 0);
    return Math.round(total / valid.length);
  }, [combos]);

  const filteredCombos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return combos.filter((combo) => {
      const matchMode =
        filterMode === "all" ? true : filterMode === "active" ? combo.active : !combo.active;
      const matchText = !normalized || combo.name.toLowerCase().includes(normalized);
      return matchMode && matchText;
    });
  }, [combos, query, filterMode]);

  const parsedName = form.name.trim();
  const parsedPointsCost = Number(form.pointsCost);
  const parsedPostLimit = Number(form.postLimit);
  const formValid =
    parsedName.length > 0 &&
    Number.isFinite(parsedPointsCost) &&
    parsedPointsCost >= 0 &&
    Number.isInteger(parsedPostLimit) &&
    parsedPostLimit > 0 &&
    singlePostPrice > 0 &&
    parsedPointsCost < singlePostPrice * parsedPostLimit;

  // Thông báo lỗi riêng cho rule combo phải rẻ hơn lẻ
  let comboPriceError: string | null = null;
  if (
    parsedName.length > 0 &&
    Number.isFinite(parsedPointsCost) &&
    parsedPointsCost >= 0 &&
    Number.isInteger(parsedPostLimit) &&
    parsedPostLimit > 0 &&
    singlePostPrice > 0
  ) {
    const totalSingle = singlePostPrice * parsedPostLimit;
    if (parsedPointsCost >= totalSingle) {
      comboPriceError = `Giá combo phải rẻ hơn mua lẻ từng bài (${totalSingle.toLocaleString('vi-VN')} VND)`;
    }
  }

  const editingCombo = useMemo(
    () => (editingId == null ? null : combos.find((c) => c.id === editingId) ?? null),
    [editingId, combos]
  );

  const hasEditChanges = useMemo(() => {
    if (!editingCombo) return false;
    return (
      editingCombo.name !== parsedName ||
      editingCombo.pointsCost !== parsedPointsCost ||
      editingCombo.postLimit !== parsedPostLimit ||
      editingCombo.active !== form.active
    );
  }, [editingCombo, parsedName, parsedPointsCost, parsedPostLimit, form.active]);

  const canSubmit = editingId == null ? formValid : formValid && hasEditChanges;

  const loadCombos = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await getAdminCombosAPI();
      setCombos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message || "Không thể tải combo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCombos();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFocusPrice(false);
    setFocusPostLimit(false);
  };

  const normalizeDigits = (value: string) => value.replace(/\D/g, "");
  const formatDigitString = (value: string) => {
    if (!value) return "";
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value;
    return numeric.toLocaleString("vi-VN");
  };

  const formatActive = (value: boolean) => (value ? "Active" : "Inactive");

  const toPayload = () => {
    const name = form.name.trim();
    const pointsCost = Number(form.pointsCost);
    const postLimit = Number(form.postLimit);
    return { name, pointsCost, postLimit, active: form.active };
  };

  const submitForm = async () => {
    const { name, pointsCost, postLimit, active } = toPayload();

    if (!name) {
      setError("Tên combo là bắt buộc.");
      return;
    }
    if (!Number.isFinite(pointsCost) || pointsCost < 0) {
      setError("Giá combo phải là số >= 0.");
      return;
    }
    if (!Number.isInteger(postLimit) || postLimit <= 0) {
      setError("Số lượt đăng phải là số nguyên > 0.");
      return;
    }

    setError(null);
    setNotice(null);
    if (editingId == null) {
      setConfirmAction({
        kind: "create",
        payload: { name, pointsCost, postLimit, active },
        title: "Xác nhận tạo combo",
        description: "Vui lòng kiểm tra thông tin combo mới trước khi tạo.",
        changes: [
          { label: "Tên gói", before: "(mới)", after: name },
          { label: "Giá", before: "(mới)", after: `${pointsCost.toLocaleString("vi-VN")} VND` },
          { label: "Lượt đăng", before: "(mới)", after: String(postLimit) },
          { label: "Trạng thái", before: "(mới)", after: formatActive(active) },
        ],
      });
      return;
    }

    const current = combos.find((c) => c.id === editingId);
    if (!current) {
      setError("Không tìm thấy combo đang chỉnh sửa.");
      return;
    }

    const changes: ChangeRow[] = [];
    if (current.name !== name) changes.push({ label: "Tên gói", before: current.name, after: name });
    if (current.pointsCost !== pointsCost) {
      changes.push({
        label: "Giá",
        before: `${current.pointsCost.toLocaleString("vi-VN")} VND`,
        after: `${pointsCost.toLocaleString("vi-VN")} VND`,
      });
    }
    if (current.postLimit !== postLimit) {
      changes.push({ label: "Lượt đăng", before: String(current.postLimit), after: String(postLimit) });
    }
    if (current.active !== active) {
      changes.push({ label: "Trạng thái", before: formatActive(current.active), after: formatActive(active) });
    }
    if (changes.length === 0) {
      setError("Chưa có thay đổi để cập nhật.");
      return;
    }

    setConfirmAction({
      kind: "update",
      comboId: editingId,
      payload: { name, pointsCost, postLimit, active },
      title: "Xác nhận cập nhật combo",
      description: `Bạn đang cập nhật combo #${editingId}. Vui lòng xác nhận các thay đổi bên dưới.`,
      changes,
    });
  };

  const startEdit = (combo: Combo) => {
    setEditingId(combo.id);
    setForm({
      name: combo.name,
      pointsCost: String(combo.pointsCost),
      postLimit: String(combo.postLimit),
      active: combo.active,
    });
  };

  const requestDeactivate = (combo: Combo) => {
    setConfirmAction({
      kind: "deactivate",
      comboId: combo.id,
      title: "Xác nhận ngừng kích hoạt",
      description: `Combo ${combo.name} sẽ không còn hiển thị cho người mua gói.`,
      changes: [{ label: "Trạng thái", before: "Active", after: "Inactive" }],
    });
  };

  const requestDelete = (combo: Combo) => {
    setConfirmAction({
      kind: "delete",
      comboId: combo.id,
      title: "Xác nhận xóa vĩnh viễn",
      description: `Combo ${combo.name} sẽ bị xóa khỏi hệ thống và không thể hoàn tác.`,
      changes: [
        { label: "Tên gói", before: combo.name, after: "(đã xóa)" },
        { label: "Giá", before: `${combo.pointsCost.toLocaleString("vi-VN")} VND`, after: "(đã xóa)" },
        { label: "Lượt đăng", before: String(combo.postLimit), after: "(đã xóa)" },
        { label: "Trạng thái", before: formatActive(combo.active), after: "(đã xóa)" },
      ],
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setError(null);
    setActionSubmitting(true);
    try {
      if (confirmAction.kind === "create" && confirmAction.payload) {
        const created = await createAdminComboAPI(confirmAction.payload);
        setCombos((prev) => [created, ...prev]);
        resetForm();
        setNotice("Đã tạo combo thành công.");
      }

      if (confirmAction.kind === "update" && confirmAction.payload && confirmAction.comboId != null) {
        const updated = await updateAdminComboAPI(confirmAction.comboId, confirmAction.payload);
        setCombos((prev) => prev.map((c) => (c.id === confirmAction.comboId ? updated : c)));
        resetForm();
        setNotice("Đã cập nhật combo thành công.");
      }

      if (confirmAction.kind === "deactivate" && confirmAction.comboId != null) {
        const updated = await deactivateAdminComboAPI(confirmAction.comboId);
        setCombos((prev) => prev.map((c) => (c.id === confirmAction.comboId ? updated : c)));
        if (editingId === confirmAction.comboId) resetForm();
        setNotice("Đã ngừng kích hoạt combo.");
      }

      if (confirmAction.kind === "delete" && confirmAction.comboId != null) {
        await deleteAdminComboAPI(confirmAction.comboId);
        setCombos((prev) => prev.filter((c) => c.id !== confirmAction.comboId));
        if (editingId === confirmAction.comboId) resetForm();
        setNotice("Đã xóa vĩnh viễn combo.");
      }

      setConfirmAction(null);
    } catch (e) {
      setError((e as Error).message || "Không thể thực hiện thao tác.");
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-sky-50/40 to-emerald-50/40 p-1">
      <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-sky-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-7 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/20" />
        <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_35%)]" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur">
              <Sparkles size={13} /> Combo Control Center
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Admin Combo Management</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-200">Quản lý listing package/combo cho Seller với xác nhận thay đổi trước khi áp dụng và luồng thao tác an toàn.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadCombos()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <RefreshCw size={15} /> Làm mới dữ liệu
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng Gói"
          value={String(combos.length)}
          icon={Layers}
          tint="bg-sky-50 text-sky-700 border-sky-100"
        />
        <StatCard
          label="Đang Hoạt Động"
          value={String(activeCount)}
          icon={Activity}
          tint="bg-emerald-50 text-emerald-700 border-emerald-100"
        />
        <StatCard
          label="Đang Tắt"
          value={String(inactiveCount)}
          icon={Archive}
          tint="bg-amber-50 text-amber-700 border-amber-100"
        />
        <StatCard
          label="TB Giá/Bài"
          value={`${avgCostPerPost.toLocaleString("vi-VN")} VND`}
          icon={CircleDollarSign}
          tint="bg-indigo-50 text-indigo-700 border-indigo-100"
        />
      </section>

      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {notice}
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {editingId == null ? "Tạo Gói Mới" : `Đang Sửa Gói #${editingId}`}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Nhập thông tin gói combo, giá sẽ tự định dạng theo VND.</p>
            </div>
            {editingId != null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Hủy chế độ chỉnh sửa
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Tên gói</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ví dụ: Combo 10 Bài"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Giá (VND)</label>
              <input
                value={focusPrice ? form.pointsCost : formatDigitString(form.pointsCost)}
                onFocus={() => setFocusPrice(true)}
                onBlur={() => setFocusPrice(false)}
                onChange={(e) => setForm((p) => ({ ...p, pointsCost: normalizeDigits(e.target.value) }))}
                placeholder="0"
                type="text"
                inputMode="numeric"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              {comboPriceError && (
                <div className="mt-1 text-xs text-red-600 font-medium">{comboPriceError}</div>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Số lượt đăng</label>
              <input
                value={focusPostLimit ? form.postLimit : formatDigitString(form.postLimit)}
                onFocus={() => setFocusPostLimit(true)}
                onBlur={() => setFocusPostLimit(false)}
                onChange={(e) => setForm((p) => ({ ...p, postLimit: normalizeDigits(e.target.value) }))}
                placeholder="0"
                type="text"
                inputMode="numeric"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Trạng thái</label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, active: true }))}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${form.active ? "bg-emerald-100 text-emerald-700" : "text-slate-600 hover:bg-white"}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, active: false }))}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${!form.active ? "bg-slate-200 text-slate-800" : "text-slate-600 hover:bg-white"}`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void submitForm()}
              disabled={actionSubmitting || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-slate-800 hover:to-slate-700 disabled:opacity-50"
            >
              <PackagePlus size={15} /> {editingId == null ? "Tạo combo mới" : "Lưu cập nhật"}
            </button>
            {comboPriceError && (
              <span className="text-xs text-red-600 font-medium">{comboPriceError}</span>
            )}
            {editingId != null && !hasEditChanges && formValid && (
              <span className="text-xs text-slate-500">Chưa có thay đổi để lưu.</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Preview</h3>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
            <p className="text-lg font-bold text-slate-900">{form.name.trim() || "Tên gói combo"}</p>
            <p className="mt-1 text-sm text-slate-600">{Number(form.postLimit) > 0 ? `${Number(form.postLimit)} lượt đăng` : "Nhập số lượt đăng"}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-xs text-slate-500">Giá gói</div>
                <div className="text-xl font-black text-slate-900">
                  {Number.isFinite(Number(form.pointsCost)) && Number(form.pointsCost) >= 0
                    ? `${Number(form.pointsCost).toLocaleString("vi-VN")} VND`
                    : "0 VND"}
                </div>
                <div className="mt-1 text-xs font-medium text-indigo-700">
                  {Number(form.postLimit) > 0 && Number.isFinite(Number(form.pointsCost)) && Number(form.pointsCost) >= 0
                    ? `~ ${Math.round(Number(form.pointsCost) / Number(form.postLimit)).toLocaleString("vi-VN")} VND / bài`
                    : "Nhập giá và số lượt để tính VND / bài"}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${form.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                {formatActive(form.active)}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Mọi thao tác đều yêu cầu xác nhận thay đổi trước khi áp dụng.
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm combo theo tên..."
              className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="inline-flex rounded-xl border border-gray-300 p-1">
            <FilterButton active={filterMode === "all"} onClick={() => setFilterMode("all")}>
              Tất cả
            </FilterButton>
            <FilterButton active={filterMode === "active"} onClick={() => setFilterMode("active")}>
              Active
            </FilterButton>
            <FilterButton active={filterMode === "inactive"} onClick={() => setFilterMode("inactive")}>
              Inactive
            </FilterButton>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Tên gói</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Giá</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Lượt đăng</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Giá/Bài</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan={6}>Đang tải danh sách combo...</td>
              </tr>
            ) : filteredCombos.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>Không có combo phù hợp với bộ lọc hiện tại.</td>
              </tr>
            ) : (
              filteredCombos.map((combo) => (
                <tr key={combo.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-gray-900">{combo.name}</td>
                  <td className="px-4 py-3 text-gray-700">{combo.pointsCost.toLocaleString("vi-VN")} VND</td>
                  <td className="px-4 py-3 text-gray-700">{combo.postLimit}</td>
                  <td className="px-4 py-3 text-gray-700">{Math.round(combo.pointsCost / combo.postLimit).toLocaleString("vi-VN")} VND</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${combo.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                      {combo.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(combo)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={13} /> Sửa
                      </button>
                      {combo.active && (
                        <button
                          type="button"
                          onClick={() => requestDeactivate(combo)}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          <Power size={13} /> Ngừng kích hoạt
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => requestDelete(combo)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full ${confirmAction.kind === "delete" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                {confirmAction.kind === "delete" ? <ShieldAlert size={18} /> : <BadgeCheck size={18} />}
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{confirmAction.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{confirmAction.description}</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Trường</th>
                    <th className="px-3 py-2 text-left font-semibold">Trước</th>
                    <th className="px-3 py-2 text-left font-semibold">Sau</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmAction.changes.map((row) => (
                    <tr key={`${row.label}-${row.before}-${row.after}`} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800">{row.label}</td>
                      <td className="px-3 py-2 text-gray-600">{row.before}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-2 text-gray-900">
                          <ArrowRight size={13} className="text-gray-400" />
                          {row.after}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={actionSubmitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void executeConfirmedAction()}
                disabled={actionSubmitting}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirmAction.kind === "delete" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                {actionSubmitting ? "Đang xử lý..." : "Xác nhận thực hiện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${tint}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
          <div className="truncate text-lg font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-slate-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}
