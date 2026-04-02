import { useEffect, useState } from "react";
import { MapPin, CheckCircle, AlertTriangle, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AddressParts {
    provinceCode: string;
    provinceName: string;
    districtCode: string;
    districtName: string;
    wardCode: string;
    wardName: string;
    detail: string; // số nhà + tên đường
}

export const EMPTY_ADDRESS: AddressParts = {
    provinceCode: "", provinceName: "",
    districtCode: "", districtName: "",
    wardCode: "",    wardName: "",
    detail: "",
};

/** Ghép thành 1 string gửi lên BE: "123 Lê Lợi, Phường 1, Quận 1, TP. Hồ Chí Minh" */
export function buildAddressString(parts: AddressParts): string {
    return [parts.detail, parts.wardName, parts.districtName, parts.provinceName]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
}

/**
 * Parse address string từ BE thành parts (best-effort).
 * Vì BE chỉ lưu string, ta chỉ điền vào `detail` và để các select trống
 * để user chọn lại — tránh mismatch code/name.
 */
export function parseAddressToDetail(address: string): string {
    return address ?? "";
}

// ── HCM validation ────────────────────────────────────────────────────────────

const HCM_ALIASES = [
    "hồ chí minh", "ho chi minh", "hcm", "tp.hcm", "tp hcm",
    "thành phố hồ chí minh", "tphcm", "sài gòn", "sai gon",
];

export function isHCMProvince(name: string): boolean {
    if (!name.trim()) return true; // chưa chọn → chưa validate
    const n = name.trim().toLowerCase();
    return HCM_ALIASES.some((a) => n.includes(a) || a.includes(n));
}

// ── Out-of-area popup ─────────────────────────────────────────────────────────

interface OutOfAreaPopupProps {
    onClose: () => void;
}

export function OutOfAreaPopup({ onClose }: OutOfAreaPopupProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 mb-1">Ngoài khu vực hỗ trợ</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Hiện tại <span className="font-semibold text-orange-600">BikeExChange</span> chỉ hỗ trợ
                            kiểm định trong khu vực{" "}
                            <span className="font-semibold">TP. Hồ Chí Minh</span>.
                            Bạn vui lòng chọn lại địa chỉ trong khu vực TP. HCM hoặc hủy bỏ yêu cầu kiểm định.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition"
                    >
                        <X size={14} /> Chọn lại
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── API types ─────────────────────────────────────────────────────────────────

interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward     { code: number; name: string; }

// ── Main component ────────────────────────────────────────────────────────────

interface AddressFieldsProps {
    value: AddressParts;
    onChange: (parts: AddressParts) => void;
    onOutOfArea?: () => void; // called when non-HCM province selected
    disabled?: boolean;
}

const selectCls =
    "w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm outline-none " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white " +
    "appearance-none disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer";

export default function AddressFields({ value, onChange, onOutOfArea, disabled }: AddressFieldsProps) {
    const [provinces,   setProvinces]   = useState<Province[]>([]);
    const [districts,   setDistricts]   = useState<District[]>([]);
    const [wards,       setWards]       = useState<Ward[]>([]);
    const [addrLoading, setAddrLoading] = useState(false);

    // Load provinces once
    useEffect(() => {
        fetch("https://provinces.open-api.vn/api/?depth=1")
            .then((r) => r.json())
            .then(setProvinces)
            .catch(() => {});
    }, []);

    // Load districts when province changes
    useEffect(() => {
        if (!value.provinceCode) { setDistricts([]); setWards([]); return; }
        setAddrLoading(true);
        fetch(`https://provinces.open-api.vn/api/p/${value.provinceCode}?depth=2`)
            .then((r) => r.json())
            .then((d) => setDistricts(d.districts || []))
            .catch(() => setDistricts([]))
            .finally(() => setAddrLoading(false));
    }, [value.provinceCode]);

    // Load wards when district changes
    useEffect(() => {
        if (!value.districtCode) { setWards([]); return; }
        setAddrLoading(true);
        fetch(`https://provinces.open-api.vn/api/d/${value.districtCode}?depth=2`)
            .then((r) => r.json())
            .then((d) => setWards(d.wards || []))
            .catch(() => setWards([]))
            .finally(() => setAddrLoading(false));
    }, [value.districtCode]);

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const name = provinces.find((p) => String(p.code) === code)?.name ?? "";
        const updated: AddressParts = {
            ...value,
            provinceCode: code, provinceName: name,
            districtCode: "", districtName: "",
            wardCode: "",    wardName: "",
        };
        onChange(updated);
        if (code && !isHCMProvince(name)) onOutOfArea?.();
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const name = districts.find((d) => String(d.code) === code)?.name ?? "";
        onChange({ ...value, districtCode: code, districtName: name, wardCode: "", wardName: "" });
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const name = wards.find((w) => String(w.code) === code)?.name ?? "";
        onChange({ ...value, wardCode: code, wardName: name });
    };

    const preview = buildAddressString(value);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                    Địa chỉ kiểm định
                    <span className="ml-1 text-xs text-orange-500 font-normal">(chỉ hỗ trợ TP. Hồ Chí Minh)</span>
                </span>
            </div>

            {/* Tỉnh / Thành phố */}
            <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Tỉnh / Thành phố <span className="text-red-400">*</span>
                </label>
                <select
                    value={value.provinceCode}
                    onChange={handleProvinceChange}
                    disabled={disabled || provinces.length === 0}
                    className={selectCls}
                >
                    <option value="">-- Chọn Tỉnh / Thành phố --</option>
                    {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 bottom-3 text-gray-400 text-xs">▾</span>
            </div>

            {/* Quận / Huyện */}
            <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Quận / Huyện</label>
                <select
                    value={value.districtCode}
                    onChange={handleDistrictChange}
                    disabled={disabled || !value.provinceCode || addrLoading}
                    className={selectCls}
                >
                    <option value="">-- Chọn Quận / Huyện --</option>
                    {districts.map((d) => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 bottom-3 text-gray-400 text-xs">▾</span>
            </div>

            {/* Phường / Xã */}
            <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Phường / Xã</label>
                <select
                    value={value.wardCode}
                    onChange={handleWardChange}
                    disabled={disabled || !value.districtCode || addrLoading}
                    className={selectCls}
                >
                    <option value="">-- Chọn Phường / Xã --</option>
                    {wards.map((w) => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 bottom-3 text-gray-400 text-xs">▾</span>
            </div>

            {/* Số nhà / Tên đường */}
            <div className="relative">
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Số nhà, tên đường <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={value.wardCode ? "VD: 123 Nguyễn Trãi" : "Chọn phường/xã trước"}
                        value={value.detail}
                        onChange={(e) => onChange({ ...value, detail: e.target.value })}
                        disabled={disabled || !value.wardCode}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    />
                </div>
            </div>

            {/* Preview */}
            {preview && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <CheckCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-blue-700 leading-relaxed font-medium">{preview}</span>
                </div>
            )}
        </div>
    );
}
