import { useEffect, useState } from "react";
import { Plus, X, Wallet, AlertCircle, Bike, CheckCircle2, Info, Package, Sparkles, ShieldCheck, Ticket } from "lucide-react";
import { createBikeAPI } from "../../services/Seller/bikeManagementService";
import { getCategoriesAPI, getBrandsAPI } from "../../services/Seller/catalogService";
import { uploadMultipleToCloudinary } from "../../services/cloudinaryService";
import { getBikePostFeeAPI, getCommissionRateAPI, getInspectionFeeAPI } from "../../services/settingsService";
import { getCombosAPI, buyComboAPI } from "../../services/Seller/walletService";

type WalletLike = {
    availablePoints?: number;
    frozenPoints?: number;
    remainingFreePosts?: number;
    data?: { availablePoints?: number; frozenPoints?: number; remainingFreePosts?: number };
};
type Category = { id: number; name: string };
type Brand = { id: number; name: string };
type Combo = { id: number; name: string; pointsCost: number; postLimit: number; isActive: boolean };
type ApiDataWrapper<T> = { data?: T };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isCategory = (v: unknown): v is Category => isObject(v) && typeof v.id === "number" && typeof v.name === "string";
const isBrand = (v: unknown): v is Brand => isObject(v) && typeof v.id === "number" && typeof v.name === "string";
const toCombo = (v: unknown): Combo | null => {
    if (!isObject(v)) return null;
    if (typeof v.id !== "number" || typeof v.name !== "string" || typeof v.pointsCost !== "number" || typeof v.postLimit !== "number") {
        return null;
    }
    const rawActive = typeof v.isActive === "boolean"
        ? v.isActive
        : (typeof v.active === "boolean" ? v.active : true);
    return {
        id: v.id,
        name: v.name,
        pointsCost: v.pointsCost,
        postLimit: v.postLimit,
        isActive: rawActive,
    };
};

interface CreateBikeTabProps {
    token: string;
    wallet: WalletLike | null;
    onBikeCreated: () => void;
    onWalletRefresh: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];
const CONDITION_LABELS: Record<string, string> = { NEW: "Mới", LIKE_NEW: "Như mới", GOOD: "Tốt", FAIR: "Khá", POOR: "Cũ" };

type ConfirmMode = "single" | "combo";

export default function CreateBikeTab({ token, wallet, onBikeCreated, onWalletRefresh }: CreateBikeTabProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<{ name: string; dataUrl: string; file: File }[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [form, setForm] = useState({
        title: "", bikeType: "", brandId: undefined as number | undefined,
        model: "", frameSize: "", condition: "GOOD", year: "", priceVnd: "", description: "",
        categoryId: undefined as number | undefined,
    });

    // Fees from API
    const [postingFee, setPostingFee] = useState<number | null>(null);
    const [commissionRate, setCommissionRate] = useState<number | null>(null);
    const [inspectionFee, setInspectionFee] = useState<number | null>(null);
    const [feesLoading, setFeesLoading] = useState(true);

    // Combos
    const [combos, setCombos] = useState<Combo[]>([]);
    const [combosLoading, setCombosLoading] = useState(false);
    const [showComboPicker, setShowComboPicker] = useState(false);

    // Confirm modal state
    const [confirmMode, setConfirmMode] = useState<ConfirmMode | null>(null);
    const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    // Success modal
    const [successInfo, setSuccessInfo] = useState<{ usedFreePost: boolean; fee?: number; comboName?: string } | null>(null);

    const walletAvailable = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const remainingFreePosts = wallet?.remainingFreePosts ?? wallet?.data?.remainingFreePosts ?? 0;
    const willUseFreePost = remainingFreePosts > 0;
    const hasEnoughForSingle = willUseFreePost || (postingFee !== null && walletAvailable >= postingFee);

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const [resCats, resBrands] = await Promise.all([getCategoriesAPI(), getBrandsAPI()]);
                const rawCats = Array.isArray(resCats) ? resCats : (isObject(resCats) && "data" in resCats ? (resCats as ApiDataWrapper<unknown>).data : []);
                setCategories((Array.isArray(rawCats) ? rawCats : []).filter(isCategory));
                const rawBrands = Array.isArray(resBrands) ? resBrands : (isObject(resBrands) && "data" in resBrands ? (resBrands as ApiDataWrapper<unknown>).data : []);
                setBrands((Array.isArray(rawBrands) ? rawBrands : []).filter(isBrand));
            } catch (e) { console.error("Error loading catalog:", e); }
        };

        const loadFees = async () => {
            try {
                setFeesLoading(true);
                const [fee, rate, insFee] = await Promise.all([
                    getBikePostFeeAPI(),
                    getCommissionRateAPI(),
                    getInspectionFeeAPI(),
                ]);
                setPostingFee(fee);
                setCommissionRate(rate);
                setInspectionFee(insFee);
            } catch {
                setPostingFee(null);
                setCommissionRate(null);
                setInspectionFee(null);
            } finally {
                setFeesLoading(false);
            }
        };

        const loadCombos = async () => {
            try {
                setCombosLoading(true);
                const data = await getCombosAPI(token);
                const normalized = (Array.isArray(data) ? data : [])
                    .map(toCombo)
                    .filter((c): c is Combo => c !== null);
                setCombos(normalized);
            } catch { setCombos([]); }
            finally { setCombosLoading(false); }
        };

        void loadCatalog();
        void loadFees();
        void loadCombos();
    }, [token]);

    const handleImages = (files: FileList | null) => {
        if (!files) return;
        const reads = Array.from(files).map(f =>
            new Promise<{ name: string; dataUrl: string; file: File }>((resolve, reject) => {
                if (!f.type.startsWith("image/")) { reject(new Error(`File ${f.name} không phải ảnh hợp lệ.`)); return; }
                if (f.size > 5 * 1024 * 1024) { reject(new Error(`File ${f.name} vượt quá 5MB.`)); return; }
                const reader = new FileReader();
                reader.onload = () => resolve({ name: f.name, dataUrl: String(reader.result), file: f });
                reader.onerror = () => reject(new Error("Lỗi đọc ảnh"));
                reader.readAsDataURL(f);
            })
        );
        Promise.all(reads)
            .then(results => setImages(prev => [...prev, ...results]))
            .catch((e: Error) => setError(e.message));
    };

    // Validate form fields before opening confirm modal
    const validateForm = (): boolean => {
        setError(null);
        if (!token) { setError("Bạn cần đăng nhập."); return false; }
        if (!form.title || !form.brandId || !form.priceVnd) { setError("Vui lòng nhập: Tiêu đề, Hãng, Giá."); return false; }
        if (images.length === 0) { setError("Vui lòng thêm ít nhất một ảnh."); return false; }
        if (form.year && !/^\d+$/.test(form.year)) { setError("Năm sản xuất chỉ được nhập số."); return false; }
        if (form.year) {
            const y = parseInt(form.year);
            if (y < MIN_YEAR) { setError(`Năm sản xuất phải từ ${MIN_YEAR} trở lên.`); return false; }
            if (y > CURRENT_YEAR) { setError(`Năm sản xuất không thể vượt quá ${CURRENT_YEAR}.`); return false; }
        }
        return true;
    };

    const openSingleConfirm = () => {
        if (!validateForm()) return;
        setConfirmMode("single");
        setConfirmError(null);
    };

    const openComboConfirm = (combo: Combo) => {
        setSelectedCombo(combo);
        setShowComboPicker(false);
        setConfirmMode("combo");
        setConfirmError(null);
    };

    const closeConfirm = () => {
        setConfirmMode(null);
        setSelectedCombo(null);
        setConfirmError(null);
    };

    // Confirm: buy combo (no bike posting yet, just buy the combo pack)
    const handleConfirmBuyCombo = async () => {
        if (!selectedCombo) return;
        setConfirmLoading(true);
        setConfirmError(null);
        try {
            await buyComboAPI(selectedCombo.id, token);
            closeConfirm();
            onWalletRefresh();
        } catch (e) {
            setConfirmError((e as Error).message || "Mua combo thất bại.");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Confirm: post single bike (uses free post or deducts fee)
    const handleConfirmPost = async () => {
        setConfirmLoading(true);
        setConfirmError(null);
        try {
            setUploading(true);
            const imageFiles = images.map(img => img.file);
            const uploadResults = await uploadMultipleToCloudinary(imageFiles, "bikes");
            setUploading(false);

            const media = uploadResults.map((r: { url: string }, i: number) => ({ url: r.url, type: "IMAGE", sortOrder: i }));
            const payload = {
                title: form.title,
                description: form.description,
                brandId: form.brandId,
                model: form.model,
                year: form.year ? parseInt(form.year) : 0,
                pricePoints: Number(form.priceVnd.replace(/[^\d]/g, "")),
                condition: form.condition,
                bikeType: form.bikeType,
                frameSize: "",
                categoryIds: form.categoryId ? [form.categoryId] : [],
                media,
            };

            setLoading(true);
            const res: { id?: number; data?: { id?: number } } = await createBikeAPI(payload, token);
            const bikeId = res?.id ?? res?.data?.id;
            if (!bikeId) throw new Error("Tạo xe thất bại.");

            closeConfirm();
            setSuccessInfo({ usedFreePost: willUseFreePost, fee: postingFee ?? undefined });
            setForm({ title: "", bikeType: "", brandId: undefined, model: "", frameSize: "", condition: "GOOD", year: "", priceVnd: "", description: "", categoryId: undefined });
            setImages([]);
            onBikeCreated();
            onWalletRefresh();
        } catch (e) {
            setConfirmError((e as Error).message || "Không thể tạo bài đăng.");
        } finally {
            setLoading(false);
            setUploading(false);
            setConfirmLoading(false);
        }
    };

    const systemCombos = combos;
    const activeCombos = combos.filter(c => c.isActive);

    return (
        <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/50 rounded-3xl border border-blue-100/70 shadow-2xl overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-fuchsia-200/20 blur-3xl" />
            <div className="pointer-events-none absolute top-44 -left-20 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-6 text-white overflow-hidden">
                <div className="absolute -top-16 -left-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-20 right-20 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Plus size={24} />Đăng tin bán xe</h2>
                        <p className="text-blue-100/95 text-sm mt-1">Tạo bài đăng mới để bán xe đạp nhanh, rõ và chuyên nghiệp</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
                            <Sparkles size={12} /> Tối ưu hiển thị cho người mua
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 border border-white/25 text-right shadow-lg">
                        <div className="flex items-center gap-2 text-blue-100 text-xs mb-1"><Wallet size={14} />Số dư ví</div>
                        <div className="text-3xl leading-none font-extrabold">{walletAvailable.toLocaleString("vi-VN")}</div>
                        <div className="text-xs text-blue-200">VND</div>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-semibold">
                            <Ticket size={12} /> {remainingFreePosts} lượt đăng còn lại
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Posting options: single or combo */}
                <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-lg transition duration-300 hover:shadow-xl overflow-hidden">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Package size={18} className="text-blue-600" />
                            <span className="font-bold text-gray-900">Chọn hình thức đăng tin</span>
                        </div>
                        <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            <ShieldCheck size={12} /> An toàn thanh toán
                        </div>
                    </div>

                    {feesLoading ? (
                        <div className="text-sm text-gray-400 animate-pulse py-2">Đang tải thông tin phí...</div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Single post option */}
                            <div className={`min-h-[170px] rounded-2xl border p-4 flex flex-col gap-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${hasEnoughForSingle ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : "border-gray-200 bg-gray-50"}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900 text-sm">Đăng 1 bài</span>
                                    {willUseFreePost
                                        ? <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">Miễn phí</span>
                                        : <span className="text-xs font-bold text-blue-700 rounded-full bg-blue-100 px-2 py-0.5">{postingFee?.toLocaleString("vi-VN")} VND</span>
                                    }
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {willUseFreePost
                                        ? `Dùng 1 trong ${remainingFreePosts} lượt còn lại từ combo`
                                        : `Trừ trực tiếp từ ví khi đăng`}
                                </p>
                                <button
                                    onClick={openSingleConfirm}
                                    disabled={!hasEnoughForSingle || feesLoading}
                                    className="mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    Đăng ngay
                                </button>
                                {!hasEnoughForSingle && (
                                    <p className="text-xs text-red-500 text-center">Không đủ số dư hoặc lượt đăng</p>
                                )}
                            </div>

                            {/* Combo options */}
                            <div className="min-h-[170px] rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 flex flex-col gap-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900 text-sm">Mua gói combo</span>
                                    <span className="text-xs font-bold text-purple-700 rounded-full bg-purple-100 px-2 py-0.5">Tiết kiệm hơn</span>
                                </div>
                                {combosLoading ? (
                                    <div className="text-xs text-gray-400 animate-pulse">Đang tải gói combo...</div>
                                ) : (
                                    <>
                                        {activeCombos.length === 0 && (
                                            <p className="text-xs text-gray-600 leading-relaxed">Hiện chưa có gói combo đang mở bán. Bạn vẫn có thể xem tất cả gói trong hệ thống.</p>
                                        )}
                                        <button
                                            onClick={() => setShowComboPicker(true)}
                                            className="mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-sm"
                                        >
                                            Mua ngay
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No posts left notice */}
                    {!feesLoading && remainingFreePosts === 0 && !hasEnoughForSingle && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                            <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                Bạn chưa có lượt đăng nào. Hãy nạp thêm tiền vào ví để đăng 1 bài, hoặc mua gói combo để tiết kiệm hơn với nhiều bài đăng.
                            </p>
                        </div>
                    )}
                </div>

                {/* Commission note */}
                {commissionRate !== null && (
                    <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 flex items-start gap-3 shadow-sm">
                        <Info size={18} className="text-cyan-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1.5 text-sm text-blue-900 leading-relaxed">
                            <p>
                                Sau khi bán được xe, BikeExchange sẽ tự động thu{" "}
                                <span className="font-bold text-blue-700">{commissionRate.toFixed(0)}% phí hoa hồng</span>{" "}
                                trên giá trị giao dịch. Số tiền còn lại sẽ được chuyển vào ví của bạn.
                            </p>
                            {inspectionFee !== null && (
                                <p>
                                    Khi yêu cầu kiểm định bởi Inspector, phí kiểm định hiện tại là{" "}
                                    <span className="font-bold text-blue-700">{inspectionFee.toLocaleString("vi-VN")} VND</span>{" "}
                                    cho mỗi lần kiểm định.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2 items-start">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />{error}
                    </div>
                )}

                {/* Image upload */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 p-6 shadow-lg transition duration-300 hover:shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-11 w-11 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                            <Plus size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-lg">Ảnh xe</div>
                            <div className="text-sm text-gray-600">Tối đa 5MB mỗi ảnh, ưu tiên ảnh rõ 4 góc xe</div>
                        </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white hover:from-indigo-700 hover:to-blue-700 shadow-md"
                        style={{ pointerEvents: uploading || loading ? "none" : "auto", opacity: uploading || loading ? 0.6 : 1 }}>
                        <Plus size={18} />
                        {uploading ? "Đang upload..." : loading ? "Đang xử lý..." : "Chọn ảnh"}
                        <input type="file" accept="image/*" multiple className="hidden"
                            onChange={e => handleImages(e.target.files)} disabled={uploading || loading} />
                    </label>
                    <span className="ml-3 text-sm text-gray-700">Đã chọn: <b className="text-indigo-700">{images.length}</b> ảnh</span>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-indigo-100 bg-white/80 px-3 py-2 text-xs text-gray-600">1. Chụp rõ tổng thể xe từ 2 bên.</div>
                        <div className="rounded-lg border border-indigo-100 bg-white/80 px-3 py-2 text-xs text-gray-600">2. Chụp cận cảnh bộ truyền động, phanh, lốp.</div>
                        <div className="rounded-lg border border-indigo-100 bg-white/80 px-3 py-2 text-xs text-gray-600">3. Tránh ảnh mờ để tăng tỷ lệ duyệt.</div>
                    </div>
                    {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                            {images.map((img, i) => (
                                <div key={i} className="relative rounded-xl border border-indigo-200 overflow-hidden bg-white shadow-sm">
                                    <img src={img.dataUrl} alt={img.name} className="h-28 w-full object-cover" />
                                    <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bike info form */}
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 p-6 shadow-lg transition duration-300 hover:shadow-xl">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <Bike size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-lg">Thông tin xe</div>
                            <div className="text-sm text-gray-600">Điền đầy đủ để bài đăng dễ được duyệt và tăng tỷ lệ chốt đơn</div>
                        </div>
                    </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Trường có dấu * là bắt buộc
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Tiêu đề <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="VD: Giant XTC 800 2021"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition" />
                            <p className="text-[11px] text-gray-500">Nên ghi rõ hãng + model + năm để người mua dễ tìm.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Loại xe</label>
                            <input
                                value={form.bikeType}
                                onChange={e => setForm(p => ({ ...p, bikeType: e.target.value }))}
                                placeholder="Tự động điền khi chọn danh mục"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition"
                            />
                            <p className="text-[11px] text-gray-500">Tự điền khi chọn danh mục, hoặc nhập thủ công.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Hãng <span className="text-red-500">*</span></label>
                            <select value={form.brandId ?? ""} onChange={e => setForm(p => ({ ...p, brandId: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition">
                                <option value="">-- Chọn hãng --</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Model</label>
                            <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                                placeholder="Escape 3"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Tình trạng</label>
                            <select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition">
                                {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Năm sản xuất</label>
                            <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.year}
                                onChange={e => setForm(p => ({ ...p, year: e.target.value.replace(/\D/g, "") }))}
                                placeholder={`${CURRENT_YEAR}`} maxLength={4}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition" />
                            <div className="text-xs text-gray-500">Tối đa: {CURRENT_YEAR}</div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">Giá (VND) <span className="text-red-500">*</span></label>
                            <input value={form.priceVnd} onChange={e => setForm(p => ({ ...p, priceVnd: e.target.value }))}
                                placeholder="12500000"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition" />
                            <div className="text-xs text-gray-500">Nhập số tiền (VD: 12500000)</div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-emerald-100 bg-white/80 p-4">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Danh mục</label>
                        <select
                            value={form.categoryId ?? ""}
                            onChange={e => {
                                const id = e.target.value ? Number(e.target.value) : undefined;
                                const catName = id ? (categories.find(c => c.id === id)?.name ?? "") : "";
                                setForm(p => ({ ...p, categoryId: id, bikeType: catName || p.bikeType }));
                            }}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition">
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <p className="text-[11px] text-gray-500 mt-1">Chọn danh mục sẽ tự động điền vào ô Loại xe.</p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 p-4">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Mô tả chi tiết</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả tình trạng xe, lịch sử sử dụng..."
                            className="w-full min-h-32 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 bg-gray-50 focus:bg-white transition" />
                        <p className="mt-2 text-[11px] text-gray-500">Mô tả càng cụ thể về phụ tùng, bảo dưỡng, lỗi nhỏ (nếu có) thì người mua càng tin tưởng.</p>
                    </div>
                </div>

                {/* Persistent action bar */}
                <div className="sticky bottom-3 z-20 rounded-2xl border border-blue-200/80 bg-white/95 backdrop-blur p-3 shadow-2xl">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-gray-700">
                            Bấm <span className="font-semibold text-blue-700">Đăng ngay</span> để mở xác nhận và hoàn tất đăng bài.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowComboPicker(true)}
                                disabled={combosLoading}
                                className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-fuchsia-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:from-purple-100 hover:to-fuchsia-100 disabled:opacity-50"
                            >
                                {combosLoading ? "Đang tải combo..." : "Mua combo"}
                            </button>
                            <button
                                onClick={openSingleConfirm}
                                disabled={!hasEnoughForSingle || feesLoading}
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                                Đăng ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading overlay */}
            {(loading || uploading) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
                        <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                        <div className="text-sm font-semibold text-gray-700">
                            {uploading ? "Đang tải ảnh lên..." : "Đang tạo bài đăng..."}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm: single post */}
            {confirmMode === "single" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-blue-100">
                        <div className="px-6 py-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="font-bold text-gray-900 text-lg">Xác nhận đăng tin</h3>
                            <p className="text-sm text-gray-600 mt-1">Kiểm tra thông tin lần cuối trước khi đăng</p>
                        </div>
                        <div className="px-6 py-5 space-y-3">
                            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tiêu đề</span>
                                    <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{form.title}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Giá bán</span>
                                    <span className="font-semibold text-gray-900">{Number(form.priceVnd.replace(/[^\d]/g, "")).toLocaleString("vi-VN")} VND</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Phí đăng tin</span>
                                    {willUseFreePost
                                        ? <span className="font-bold text-emerald-600">Miễn phí (dùng 1 lượt combo)</span>
                                        : <span className="font-bold text-blue-700">{postingFee?.toLocaleString("vi-VN")} VND</span>
                                    }
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Số ảnh</span>
                                    <span className="font-semibold text-gray-900">{images.length} ảnh</span>
                                </div>
                            </div>
                            {confirmError && (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{confirmError}</div>
                            )}
                        </div>
                        <div className="px-6 pb-5 flex gap-3">
                            <button onClick={closeConfirm} disabled={confirmLoading}
                                className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Huỷ
                            </button>
                            <button onClick={() => void handleConfirmPost()} disabled={confirmLoading}
                                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">
                                {confirmLoading
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>
                                    : "Xác nhận đăng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Combo catalog modal */}
            {showComboPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-purple-100">
                        <div className="px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Chọn gói combo</h3>
                                <p className="text-sm text-gray-600 mt-1">So sánh chi tiết và chọn gói phù hợp với ngân sách của bạn</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-white border border-purple-200 px-3 py-2 text-xs">
                                    <div className="text-gray-500">Số dư hiện tại</div>
                                    <div className="font-bold text-purple-700">{walletAvailable.toLocaleString("vi-VN")} VND</div>
                                </div>
                                <div className="rounded-xl bg-white border border-purple-200 px-3 py-2 text-xs">
                                    <div className="text-gray-500">Tổng gói</div>
                                    <div className="font-bold text-indigo-700">{systemCombos.length}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowComboPicker(false)}
                                className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-purple-50"
                            >
                                Đóng
                            </button>
                        </div>

                        <div className="px-6 py-5 max-h-[64vh] overflow-auto grid gap-4 sm:grid-cols-2">
                            {combosLoading ? (
                                <div className="text-sm text-gray-400 animate-pulse">Đang tải danh sách combo...</div>
                            ) : systemCombos.length === 0 ? (
                                <div className="text-sm text-gray-500">Hiện chưa có gói combo nào.</div>
                            ) : (
                                systemCombos
                                    .slice()
                                    .sort((a, b) => a.pointsCost - b.pointsCost)
                                    .map((combo) => {
                                        const canAfford = walletAvailable >= combo.pointsCost;
                                        const canBuy = combo.isActive && canAfford;
                                        const perPost = Math.round(combo.pointsCost / combo.postLimit);
                                        const baselineSingleCost = postingFee ? postingFee * combo.postLimit : null;
                                        const savings = baselineSingleCost ? Math.max(0, baselineSingleCost - combo.pointsCost) : 0;
                                        const savingPercent = baselineSingleCost && baselineSingleCost > 0
                                            ? Math.round((savings / baselineSingleCost) * 100)
                                            : 0;
                                        return (
                                            <div
                                                key={combo.id}
                                                className={`rounded-2xl border p-4 shadow-sm transition ${combo.isActive ? "border-purple-200 bg-gradient-to-br from-white to-purple-50" : "border-gray-200 bg-gray-50"}`}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <div className="text-base font-bold text-gray-900">🎟 {combo.name}</div>
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            <span>{combo.postLimit} lượt đăng</span>
                                                            <span>•</span>
                                                            <span>≈ {perPost.toLocaleString("vi-VN")} VND/lượt</span>
                                                        </div>
                                                        <div className="text-xs mt-2">
                                                            {combo.isActive
                                                                ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-semibold">Đang mở bán</span>
                                                                : <span className="text-gray-400 font-semibold">Đã ngừng bán</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-extrabold text-purple-700">{combo.pointsCost.toLocaleString("vi-VN")} VND</div>
                                                        {savingPercent > 0 && (
                                                            <div className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                                                                Tiết kiệm {savingPercent}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-purple-100 bg-white/80 p-3 space-y-1.5 text-xs mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Giá combo</span>
                                                        <span className="font-semibold text-gray-900">{combo.pointsCost.toLocaleString("vi-VN")} VND</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Giá mỗi lượt</span>
                                                        <span className="font-semibold text-gray-900">{perPost.toLocaleString("vi-VN")} VND</span>
                                                    </div>
                                                    {baselineSingleCost !== null && (
                                                        <>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Mua lẻ tương đương</span>
                                                                <span className="font-semibold text-gray-700">{baselineSingleCost.toLocaleString("vi-VN")} VND</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Tiết kiệm</span>
                                                                <span className={`font-bold ${savings > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                                                                    {savings > 0 ? `${savings.toLocaleString("vi-VN")} VND` : "-"}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="pt-1 border-t border-purple-100 flex justify-between">
                                                        <span className="text-gray-500">Số dư sau mua</span>
                                                        <span className={`font-bold ${walletAvailable - combo.pointsCost >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                                            {(walletAvailable - combo.pointsCost).toLocaleString("vi-VN")} VND
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <button
                                                        onClick={() => openComboConfirm(combo)}
                                                        disabled={!canBuy}
                                                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${canBuy
                                                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                                                    >
                                                        {combo.isActive ? (canAfford ? "Mua gói này" : "Không đủ tiền") : "Không khả dụng"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm: buy combo */}
            {confirmMode === "combo" && selectedCombo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-purple-100">
                        <div className="px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50">
                            <h3 className="font-bold text-gray-900 text-lg">Xác nhận mua combo</h3>
                            <p className="text-sm text-gray-600 mt-1">Gói lượt đăng tin ưu đãi</p>
                        </div>
                        <div className="px-6 py-5 space-y-3">
                            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Gói combo</span>
                                    <span className="font-bold text-purple-800">🎟 {selectedCombo.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Số lượt đăng</span>
                                    <span className="font-bold text-gray-900">{selectedCombo.postLimit} lượt</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Giá combo</span>
                                    <span className="font-bold text-purple-700">{selectedCombo.pointsCost.toLocaleString("vi-VN")} VND</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Giá mỗi lượt</span>
                                    <span className="font-semibold text-gray-700">≈ {Math.round(selectedCombo.pointsCost / selectedCombo.postLimit).toLocaleString("vi-VN")} VND</span>
                                </div>
                                <div className="border-t border-purple-200 pt-2 flex justify-between text-sm">
                                    <span className="text-gray-600">Số dư sau khi mua</span>
                                    <span className={`font-bold ${walletAvailable - selectedCombo.pointsCost >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                        {(walletAvailable - selectedCombo.pointsCost).toLocaleString("vi-VN")} VND
                                    </span>
                                </div>
                            </div>
                            {confirmError && (
                                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{confirmError}</div>
                            )}
                        </div>
                        <div className="px-6 pb-5 flex gap-3">
                            <button onClick={closeConfirm} disabled={confirmLoading}
                                className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                                Huỷ
                            </button>
                            <button onClick={() => void handleConfirmBuyCombo()} disabled={confirmLoading}
                                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">
                                {confirmLoading
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>
                                    : "Xác nhận mua"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success modal */}
            {successInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-100 px-6 py-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-emerald-200 mb-4 shadow-sm">
                                <CheckCircle2 size={32} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Đăng bài thành công!</h2>
                            <p className="text-emerald-700 text-sm mb-4">Bài đăng của bạn đã được tạo và đang chờ duyệt</p>
                            <div className="bg-white rounded-xl p-4 mb-4 space-y-2 border border-emerald-100 shadow-sm">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Phí đã trừ</span>
                                    <span className="font-bold text-emerald-700">
                                        {successInfo.usedFreePost ? "Miễn phí (1 lượt combo)" : `${successInfo.fee?.toLocaleString("vi-VN")} VND`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Lượt đăng còn lại</span>
                                    <span className="font-bold text-purple-700">{remainingFreePosts} lượt</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">Xe của bạn sẽ hiển thị trong danh sách bài đăng sau khi được duyệt</p>
                        </div>
                        <div className="px-6 py-4 flex justify-center">
                            <button onClick={() => setSuccessInfo(null)}
                                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-8 py-2.5 text-sm font-semibold text-white transition">
                                Hoàn tất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
