import { useCallback, useEffect, useState } from "react";
import { Percent, Calendar, Coins, Save } from "lucide-react";
import {
  getOrderRulesAPI,
  updateSellerUpgradeFeeAPI,
  updateInspectionFeeAPI,
  updateBikePostFeeAPI,
  updateCommissionRateAPI,
  updateReturnWindowDaysAPI,
} from "../../../services/Admin/orderRuleService";


interface OrderRules {
  returnWindowDays: number;
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    setInput(String(currentValue));
  }, [currentValue]);


  const parsed = parseFloat(input);
  const isNegative = !isNaN(parsed) && parsed < 0;
  const isDirty = parsed !== currentValue && !isNaN(parsed);


  const handleSave = async () => {
    const value = parseFloat(input);
    if (isNaN(value) || value < 0) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await onSave(value);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || "Lỗi cập nhật.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="px-6 py-4 border-b border-gray-50 last:border-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm">{label}</div>
          <div className="text-xs text-gray-400 mt-0.5">{description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1 rounded-xl border bg-white overflow-hidden ${isNegative ? "border-red-400 ring-2 ring-red-100" : "border-gray-200"}`}>
            <input
              type="number"
              min={0}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              className="w-36 px-3 py-2 text-sm text-right outline-none"
            />
            <span className="pr-3 text-xs text-gray-400">{unit}</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving || isNegative}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-40"
          >
            <Save size={13} />
            {saving ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>
      {isNegative && <p className="mt-2 text-xs text-red-500">Giá trị không được âm.</p>}
      {!isNegative && error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">Cập nhật thành công.</p>}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu Hình Đơn Hàng</h1>
          <p className="mt-1 text-sm text-gray-500">Các thông số cấu hình đang áp dụng trong hệ thống</p>
        </div>
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
              { label: "Thời gian hoàn trả", value: `${rules.returnWindowDays} ngày`, icon: Calendar },
              { label: "Tỷ lệ hoa hồng", value: `${(rules.commissionRate * 100).toFixed(1)}%`, icon: Percent },
              { label: "Phí kiểm định", value: formatVND(rules.inspectionFee), icon: Coins },
              { label: "Phí đăng xe", value: formatVND(rules.bikePostFee), icon: Coins },
              { label: "Phí nâng cấp tài khoản bán", value: formatVND(rules.sellerUpgradeFee), icon: Coins },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
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
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Cập nhật cấu hình</h2>
            </div>
            <EditableRow
              label="Thời gian hoàn trả"
              description="Số ngày người mua được phép yêu cầu hoàn trả sau khi nhận hàng"
              currentValue={rules.returnWindowDays}
              unit="ngày"
              onSave={handleUpdate(updateReturnWindowDaysAPI, "returnWindowDays")}
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
    </div>
  );
}



