// ─── ReturnWindowRow ─────────────────────────────────────────────────────────
function ReturnWindowRow({ days, hours, minutes, onSave }: {
  days: number;
  hours: number;
  minutes: number;
  onSave: (days: number, hours: number, minutes: number) => Promise<void>;
}) {
  const [input, setInput] = useState({ days, hours, minutes });
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setInput({ days, hours, minutes });
  }, [days, hours, minutes]);

  const isDirty = input.days !== days || input.hours !== hours || input.minutes !== minutes;
  const isNegative = input.days < 0 || input.hours < 0 || input.minutes < 0;

  const handleRequestSave = () => {
    if (isNegative) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSave(input.days, input.hours, input.minutes);
      setSuccess(true);
      setConfirmOpen(false);
      toast.success("Cập nhật thành công!");
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || "Lỗi cập nhật.");
      toast.error(err.message || "Lỗi cập nhật thời gian hoàn trả");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6 px-6 py-5 border-b border-gray-100 bg-white hover:bg-blue-50/40 transition">
      <Calendar size={20} className="text-blue-700" />
      <div className="flex flex-col flex-1">
        <div className="font-medium text-gray-900 text-sm">Thời gian hoàn trả</div>
        <div className="text-xs text-gray-500">Thời gian cho phép người mua yêu cầu hoàn trả sau khi nhận hàng (ngày, giờ, phút)</div>
      </div>
      <input
        type="number"
        min={0}
        max={99}
        value={input.days}
        onChange={e => setInput(i => ({ ...i, days: Number(e.target.value) }))}
        className="w-16 px-2 py-1 border rounded"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span>ngày</span>
      <input
        type="number"
        min={0}
        max={23}
        value={input.hours}
        onChange={e => setInput(i => ({ ...i, hours: Number(e.target.value) }))}
        className="w-16 px-2 py-1 border rounded ml-2 mr-1"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span>giờ</span>
      <input
        type="number"
        min={0}
        max={59}
        value={input.minutes}
        onChange={e => setInput(i => ({ ...i, minutes: Number(e.target.value) }))}
        className="w-16 px-2 py-1 border rounded ml-2 mr-1"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span>phút</span>
      <button
        type="button"
        className="ml-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-3 py-2 text-xs font-medium text-white hover:from-blue-800 hover:to-indigo-800 disabled:opacity-40"
        onClick={handleRequestSave}
        disabled={!isDirty || saving || isNegative}
      >
        <Save size={13} />
        {saving ? "Đang lưu..." : "Cập nhật"}
      </button>
      {isNegative && <p className="mt-2 text-xs text-red-500">Giá trị không được âm.</p>}
      {!isNegative && error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">Cập nhật thành công.</p>}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Xác nhận cập nhật</h3>
                <p className="mt-1 text-xs text-gray-600">Bạn có chắc muốn thay đổi cấu hình này không?</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5" />
                Hành động này sẽ áp dụng ngay cho toàn hệ thống.
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-gray-50 text-gray-500">
                  <div className="px-3 py-2">Mục</div>
                  <div className="px-3 py-2">Giá trị cũ</div>
                  <div className="px-3 py-2">Giá trị mới</div>
                  <div className="px-3 py-2">Đơn vị</div>
                </div>
                <div className="grid grid-cols-4 border-t border-gray-200">
                  <div className="px-3 py-2 font-medium text-gray-800">Thời gian hoàn trả</div>
                  <div className="px-3 py-2 text-gray-700">{days} ngày {hours} giờ {minutes} phút</div>
                  <div className="px-3 py-2 font-semibold text-blue-700">{input.days} ngày {input.hours} giờ {input.minutes} phút</div>
                  <div className="px-3 py-2">ngày/giờ/phút</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 bg-white">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-2 text-xs font-medium text-white hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50"
              >
                {saving ? "Đang cập nhật..." : "Xác nhận cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useCallback, useEffect, useState } from "react";
import { Percent, Calendar, Coins, Save, AlertTriangle, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getOrderRulesAPI,
  updateSellerUpgradeFeeAPI,
  updateInspectionFeeAPI,
  updateBikePostFeeAPI,
  updateCommissionRateAPI,
  
} from "../../../services/Admin/orderRuleService";


interface OrderRules {
  returnWindowDays: number;
  returnWindowHours?: number;
  returnWindowMinutes?: number;
  inspectionFee: number;
  commissionRate: number;
  bikePostFee: number;
  sellerUpgradeFee: number;
}


function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + " VNĐ";
}


// ─── Inline edit row ──────────────────────────────────────────────────────────


function EditableRow({
  label,
  description,
  currentValue,
  unit = "VNĐ",
  onSave,
}: {
  label: string;
  description: string;
  currentValue: number;
  unit?: string;
  onSave: (value: number) => Promise<void>;
}) {
  const [input, setInput] = useState(String(currentValue));
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);


  useEffect(() => {
    setInput(String(currentValue));
  }, [currentValue]);


  const normalizeInput = (raw: string) => {
    if (unit === "%") {
      const normalized = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
      const parts = normalized.split(".");
      if (parts.length <= 1) return normalized;
      return `${parts[0]}.${parts.slice(1).join("")}`;
    }
    return raw.replace(/\D/g, "");
  };


  const parseInputValue = (raw: string) => {
    const normalized = normalizeInput(raw);
    return normalized === "" ? NaN : parseFloat(normalized);
  };


  const formatInputValue = (raw: string) => {
    const value = parseInputValue(raw);
    if (isNaN(value)) return "";
    if (unit === "%") {
      return Number.isInteger(value)
        ? value.toLocaleString("vi-VN")
        : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
    }
    return Math.round(value).toLocaleString("vi-VN");
  };


  const parsed = parseInputValue(input);
  const isNegative = !isNaN(parsed) && parsed < 0;
  const isDirty = parsed !== currentValue && !isNaN(parsed);


  const handleConfirmSave = async () => {
    const value = parseInputValue(input);
    if (isNaN(value) || value < 0) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSave(value);
      setSuccess(true);
      setConfirmOpen(false);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || "Lỗi cập nhật.");
    } finally {
      setSaving(false);
    }
  };


  const handleRequestSave = () => {
    const value = parseInputValue(input);
    if (isNaN(value) || value < 0) return;
    setConfirmOpen(true);
  };


  const handleBlur = () => {
    setFocused(false);
    const value = parseInputValue(input);
    if (!isNaN(value)) {
      setInput(String(value));
    }
  };


  return (
    <div className="px-6 py-5 border-b border-gray-100 last:border-0 bg-white hover:bg-blue-50/40 transition">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm">{label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1 rounded-xl border bg-white overflow-hidden shadow-sm ${isNegative ? "border-red-400 ring-2 ring-red-100" : "border-gray-200"}`}>
            <input
              type="text"
              inputMode={unit === "%" ? "decimal" : "numeric"}
              value={focused ? input : formatInputValue(input)}
              onFocus={() => setFocused(true)}
              onBlur={handleBlur}
              onChange={(e) => { setInput(normalizeInput(e.target.value)); setError(null); }}
              className="w-36 px-3 py-2 text-sm text-right outline-none"
            />
            <span className="pr-3 text-xs text-gray-400">{unit}</span>
          </div>
          <button
            type="button"
            onClick={handleRequestSave}
            disabled={!isDirty || saving || isNegative}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-3 py-2 text-xs font-medium text-white hover:from-blue-800 hover:to-indigo-800 disabled:opacity-40"
          >
            <Save size={13} />
            {saving ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>
      {isNegative && <p className="mt-2 text-xs text-red-500">Giá trị không được âm.</p>}
      {!isNegative && error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">Cập nhật thành công.</p>}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Xác nhận cập nhật</h3>
                <p className="mt-1 text-xs text-gray-600">Bạn có chắc muốn thay đổi cấu hình này không?</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5" />
                Hành động này sẽ áp dụng ngay cho toàn hệ thống.
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-gray-50 text-gray-500">
                  <div className="px-3 py-2">Mục</div>
                  <div className="px-3 py-2">Giá trị cũ</div>
                  <div className="px-3 py-2">Giá trị mới</div>
                </div>
                <div className="grid grid-cols-3 border-t border-gray-200">
                  <div className="px-3 py-2 font-medium text-gray-800">{label}</div>
                  <div className="px-3 py-2 text-gray-700">{formatInputValue(String(currentValue))} {unit}</div>
                  <div className="px-3 py-2 font-semibold text-blue-700">{formatInputValue(input)} {unit}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 bg-white">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-2 text-xs font-medium text-white hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50"
              >
                {saving ? "Đang cập nhật..." : "Xác nhận cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Main ─────────────────────────────────────────────────────────────────────


export default function AdminOrderRule() {
  const [rules, setRules] = useState<OrderRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderRulesAPI();
      setRules(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải cấu hình.");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchRules();
  }, [fetchRules]);


  const handleUpdate = useCallback(
    (apiFn: (v: number) => Promise<any>, key: keyof OrderRules) =>
      async (value: number) => {
        const updated = await apiFn(value);
        setRules((prev) => (prev ? { ...prev, [key]: updated?.[key] ?? value } : prev));
      },
    []
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Cấu Hình Đơn Hàng</h1>
        <p className="mt-1 text-sm text-gray-600">Các thông số cấu hình đang áp dụng trong hệ thống</p>
      </div>


      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}


      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">
          Đang tải...
        </div>
      ) : rules ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Thời gian hoàn trả",
                value: `${rules.returnWindowDays || 0} ngày${rules.returnWindowHours ? ` ${rules.returnWindowHours} giờ` : ""}${rules.returnWindowMinutes ? ` ${rules.returnWindowMinutes} phút` : ""}`,
                icon: Calendar
              },
              { label: "Tỷ lệ hoa hồng", value: `${rules.commissionRate.toFixed(1)}%`, icon: Percent },
              { label: "Phí kiểm định", value: formatVND(rules.inspectionFee), icon: Coins },
              { label: "Phí đăng xe", value: formatVND(rules.bikePostFee), icon: Coins },
              { label: "Phí nâng cấp tài khoản bán", value: formatVND(rules.sellerUpgradeFee), icon: Coins },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                  <Icon size={20} className="text-blue-700" />
                </span>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-gray-900">{value}</div>
                  <div className="truncate text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Editable fields */}
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-md">
            <div className="border-b border-blue-100 px-6 py-4 bg-gradient-to-r from-white to-blue-50">
              <h2 className="font-semibold text-gray-900">Cập nhật cấu hình</h2>
            </div>
            {/* Thời gian hoàn trả: ngày, giờ, phút */}
            <ReturnWindowRow
              days={rules.returnWindowDays || 0}
              hours={rules.returnWindowHours || 0}
              minutes={rules.returnWindowMinutes || 0}
              onSave={async (days, hours, minutes) => {
                const updated = await import("../../../services/Admin/orderRuleService").then(m => m.updateReturnWindow({ days, hours, minutes }));
                setRules((prev) => prev ? { ...prev, returnWindowDays: updated.returnWindowDays, returnWindowHours: updated.returnWindowHours, returnWindowMinutes: updated.returnWindowMinutes } : prev);
              }}
            />
            <EditableRow
              label="Tỷ lệ hoa hồng"
              description="Phần trăm hoa hồng hệ thống thu từ mỗi giao dịch thành công"
              currentValue={rules.commissionRate}
              unit="%"
              onSave={handleUpdate(updateCommissionRateAPI, "commissionRate")}
            />
            <EditableRow
              label="Phí kiểm định"
              description="Phí kiểm định xe áp dụng cho mỗi đơn hàng"
              currentValue={rules.inspectionFee}
              onSave={handleUpdate(updateInspectionFeeAPI, "inspectionFee")}
            />
            <EditableRow
              label="Phí đăng xe"
              description="Phí người bán phải trả khi đăng bài xe lên hệ thống"
              currentValue={rules.bikePostFee}
              onSave={handleUpdate(updateBikePostFeeAPI, "bikePostFee")}
            />
            <EditableRow
              label="Phí nâng cấp tài khoản bán"
              description="Phí để người dùng nâng cấp tài khoản lên Seller"
              currentValue={rules.sellerUpgradeFee}
              onSave={handleUpdate(updateSellerUpgradeFeeAPI, "sellerUpgradeFee")}
            />
          </div>
        </>
      ) : null}
      <Toaster position="top-right" />
    </div>
  );
}



