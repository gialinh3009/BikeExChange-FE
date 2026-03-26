import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wallet,
  BadgePercent,
  Clock3,
  Sparkles,
} from "lucide-react";
import { getOrderRulesAPI, updateOrderRulesAPI } from "../../../services/Admin/orderManagerService";

interface OrderRules {
  commissionRate: number;
  sellerUpgradeFee: number;
  returnWindowDays: number;
}

interface PendingPaymentUpdate {
  commissionRate: number;
  sellerUpgradeFee: number;
  returnWindowDays: number;
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtNumber = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);
const parseNumber = (value: string) => {
  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) return NaN;
  return Number(normalized);
};

export default function ManagerPayment() {
  const currentRole = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.role ?? null;
    } catch {
      return null;
    }
  })();

  const [rules, setRules] = useState<OrderRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [commissionRatePercent, setCommissionRatePercent] = useState("2");
  const [sellerUpgradeFee, setSellerUpgradeFee] = useState("");
  const [returnWindowDays, setReturnWindowDays] = useState("14");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<PendingPaymentUpdate | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setFormError(null);
    try {
      const data = await getOrderRulesAPI();
      setRules({
        commissionRate: Number(data?.commissionRate ?? 0),
        sellerUpgradeFee: Number(data?.sellerUpgradeFee ?? 0),
        returnWindowDays: Number(data?.returnWindowDays ?? 0),
      });
      setCommissionRatePercent(String(((Number(data?.commissionRate ?? 0)) * 100).toFixed(2)));
      setSellerUpgradeFee(fmtNumber(Number(data?.sellerUpgradeFee ?? 0)));
      setReturnWindowDays(String(Number(data?.returnWindowDays ?? 14)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải cấu hình thanh toán.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const commissionPercent = ((rules?.commissionRate ?? 0) * 100).toFixed(2);
  const sellerUpgradeFeeDisplay = fmtVND(Number(rules?.sellerUpgradeFee ?? 0));
  const commissionInputNum = Number(commissionRatePercent);
  const feeInputNum = parseNumber(sellerUpgradeFee);
  const daysInputNum = Number(returnWindowDays);
  const currentCommissionPercent = (rules?.commissionRate ?? 0) * 100;
  const commissionPreview = Number.isFinite(commissionInputNum) ? `${commissionInputNum.toFixed(2)}%` : "—";
  const sellerUpgradeFeePreview = Number.isFinite(feeInputNum) ? fmtVND(feeInputNum) : "—";
  const returnWindowPreview = Number.isFinite(daysInputNum) ? `${daysInputNum} ngày` : "—";
  const hasUnsavedChanges =
    !!rules && (
      (Number.isFinite(commissionInputNum) && Math.abs(commissionInputNum - currentCommissionPercent) > 0.0001) ||
      (Number.isFinite(feeInputNum) && feeInputNum !== Number(rules?.sellerUpgradeFee ?? 0)) ||
      (Number.isFinite(daysInputNum) && daysInputNum !== Number(rules?.returnWindowDays ?? 0))
    );

  const doSave = async (payload: PendingPaymentUpdate) => {
    setSaving(true);
    try {
      const saved = await updateOrderRulesAPI({
        commissionRate: payload.commissionRate / 100,
        sellerUpgradeFee: payload.sellerUpgradeFee,
        returnWindowDays: payload.returnWindowDays,
      });
      setRules({
        commissionRate: Number(saved?.commissionRate ?? 0),
        sellerUpgradeFee: Number(saved?.sellerUpgradeFee ?? payload.sellerUpgradeFee),
        returnWindowDays: Number(saved?.returnWindowDays ?? payload.returnWindowDays),
      });
      setCommissionRatePercent(String(((Number(saved?.commissionRate ?? 0)) * 100).toFixed(2)));
      setSellerUpgradeFee(fmtNumber(Number(saved?.sellerUpgradeFee ?? payload.sellerUpgradeFee)));
      setReturnWindowDays(String(Number(saved?.returnWindowDays ?? payload.returnWindowDays)));
      setFormError(null);
      setMessage("Đã lưu cấu hình thanh toán thành công.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Không thể lưu cấu hình thanh toán.");
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
      setPendingUpdate(null);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setFormError(null);

    const commissionPercentNum = Number(commissionRatePercent);
    const sellerUpgradeFeeNum = parseNumber(sellerUpgradeFee);
    const returnWindowDaysNum = Number(returnWindowDays);

    if (Number.isNaN(commissionPercentNum) || commissionPercentNum < 0 || commissionPercentNum > 100) {
      setFormError("% phí hệ thống phải từ 0% đến 100%.");
      return;
    }

    if (!Number.isFinite(sellerUpgradeFeeNum) || sellerUpgradeFeeNum < 0 || !Number.isInteger(sellerUpgradeFeeNum)) {
      setFormError("Phí update buyer lên seller phải là số nguyên không âm.");
      return;
    }

    if (Number.isNaN(returnWindowDaysNum) || returnWindowDaysNum < 1 || returnWindowDaysNum > 60) {
      setFormError("Số ngày xác nhận/hoàn phải từ 1 đến 60 ngày.");
      return;
    }

    if (!rules) {
      setFormError("Không có dữ liệu hiện tại để đối chiếu trước khi lưu.");
      return;
    }

    setPendingUpdate({
      commissionRate: commissionPercentNum,
      sellerUpgradeFee: sellerUpgradeFeeNum,
      returnWindowDays: returnWindowDaysNum,
    });
    setShowConfirmModal(true);
  };

  if (currentRole !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
        Bạn không có quyền xem nội dung này.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Sparkles size={14} /> Business Settings
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">Quản Lý Cấu Hình Thanh Toán</h1>
            <p className="mt-1 text-sm text-slate-300">
              Quản trị 3 tham số quan trọng: % phí hệ thống, phí update buyer → seller và ngày xác nhận tối đa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchRules()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            <RefreshCw size={15} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400 shadow-sm">
          Đang tải cấu hình...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Không thể tải cấu hình thanh toán</p>
              <p className="mt-1 text-sm">{loadError}</p>
              <button
                type="button"
                onClick={() => void fetchRules()}
                className="mt-3 inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Thử tải lại
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">Phí hệ thống</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <BadgePercent size={20} className="text-blue-700" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-blue-950">{commissionPercent}%</div>
              <p className="mt-1 text-xs text-blue-700">Tỷ lệ thu phí trên mỗi đơn hoàn tất</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-emerald-900">Phí nâng cấp seller</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Wallet size={20} className="text-emerald-700" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-950">{sellerUpgradeFeeDisplay}</div>
              <p className="mt-1 text-xs text-emerald-700">Phí cố định trừ khi buyer nâng cấp role</p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-orange-900">Ngày xác nhận</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Clock3 size={20} className="text-orange-700" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-orange-950">{rules?.returnWindowDays ?? 0} ngày</div>
              <p className="mt-1 text-xs text-orange-700">Mốc thời gian tối đa trước auto-release</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base font-semibold text-amber-900">Ảnh hưởng khi cập nhật</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
              <li>% phí hệ thống ảnh hưởng trực tiếp doanh thu sau mỗi đơn hoàn tất.</li>
              <li>Phí update buyer lên seller bị trừ ngay khi user nâng cấp role.</li>
              <li>Ngày xác nhận tối đa tác động thời điểm auto-release đơn hàng.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa cấu hình</h2>
              <p className="text-sm text-gray-500">Kiểm tra kỹ thông số trước khi lưu để tránh ảnh hưởng nghiệp vụ ngoài ý muốn.</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <label className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <span className="text-sm font-semibold text-gray-800">% phí hệ thống khi bán hàng</span>
                  <p className="mt-1 text-xs text-gray-500">Mức phí áp dụng cho đơn hoàn tất.</p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={commissionRatePercent}
                    onChange={(e) => setCommissionRatePercent(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500">Xem trước: <span className="font-medium text-gray-700">{commissionPreview}</span></p>
              </label>

              <label className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <span className="text-sm font-semibold text-gray-800">Phí update từ buyer lên seller</span>
                  <p className="mt-1 text-xs text-gray-500">Phí cố định khi user nâng cấp role.</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sellerUpgradeFee}
                    onChange={(e) => {
                      const parsed = parseNumber(e.target.value);
                      if (Number.isNaN(parsed)) {
                        setSellerUpgradeFee("");
                        return;
                      }
                      setSellerUpgradeFee(fmtNumber(parsed));
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-14 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-gray-500">VND</span>
                </div>
                <p className="text-xs text-gray-500">Xem trước: <span className="font-medium text-gray-700">{sellerUpgradeFeePreview}</span></p>
              </label>

              <label className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <span className="text-sm font-semibold text-gray-800">Ngày xác nhận tối đa</span>
                  <p className="mt-1 text-xs text-gray-500">Mốc thời gian auto-release đơn hàng.</p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={returnWindowDays}
                    onChange={(e) => setReturnWindowDays(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-14 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-gray-500">ngày</span>
                </div>
                <p className="text-xs text-gray-500">Xem trước: <span className="font-medium text-gray-700">{returnWindowPreview}</span></p>
              </label>
            </div>

            <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${hasUnsavedChanges ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
              {hasUnsavedChanges
                ? "Có thay đổi chưa lưu. Nhấn 'Lưu cấu hình' để mở bước xác nhận chi tiết."
                : "Chưa có thay đổi mới."}
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}
            {message && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> {message}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">Thay đổi có hiệu lực ngay sau khi xác nhận lưu.</p>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !hasUnsavedChanges}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
                {!saving && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </>
      )}

      {showConfirmModal && rules && pendingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Xác nhận thay đổi</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">Duyệt cập nhật cấu hình thanh toán</h3>
                <p className="mt-1 text-sm text-gray-500">Kiểm tra lại toàn bộ thay đổi trước khi ghi nhận vào hệ thống.</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Sparkles size={18} className="text-blue-600" />
              </span>
            </div>

            <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="grid grid-cols-[1.4fr_auto_auto] items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span>Thông số</span>
                <span>Hiện tại</span>
                <span>Mới</span>
              </div>

              <div className="grid grid-cols-[1.4fr_auto_auto] items-center gap-2 px-4 py-3 text-sm">
                <span className="text-gray-700">% phí hệ thống</span>
                <span className="font-medium text-gray-600">{(rules.commissionRate * 100).toFixed(2)}%</span>
                <span className="font-semibold text-gray-900">{pendingUpdate.commissionRate.toFixed(2)}%</span>
              </div>

              <div className="grid grid-cols-[1.4fr_auto_auto] items-center gap-2 px-4 py-3 text-sm">
                <span className="text-gray-700">Phí update buyer lên seller</span>
                <span className="font-medium text-gray-600">{fmtVND(rules.sellerUpgradeFee)}</span>
                <span className="font-semibold text-gray-900">{fmtVND(pendingUpdate.sellerUpgradeFee)}</span>
              </div>

              <div className="grid grid-cols-[1.4fr_auto_auto] items-center gap-2 px-4 py-3 text-sm">
                <span className="text-gray-700">Ngày xác nhận tối đa</span>
                <span className="font-medium text-gray-600">{rules.returnWindowDays} ngày</span>
                <span className="font-semibold text-gray-900">{pendingUpdate.returnWindowDays} ngày</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingUpdate(null);
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => void doSave(pendingUpdate)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {saving ? "Đang lưu..." : "Xác nhận lưu"}
                {!saving && <CheckCircle2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
