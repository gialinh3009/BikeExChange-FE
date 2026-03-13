import { useEffect, useState } from "react";
import { Plus, X, Wallet, AlertCircle, Bike } from "lucide-react";
import { createSellerBikeAPI } from "../../services/Seller/sellerBikeService";
import { requestInspectionAPI } from "../../services/inspectionService";
import { listCategoriesAPI } from "../../services/categoryService";
import { listBrandsAPI } from "../../services/brandService";

type WalletLike = { availablePoints?: number; frozenPoints?: number; data?: { availablePoints?: number; frozenPoints?: number } };
interface CreateBikeTabProps { token: string; wallet: WalletLike | null; onBikeCreated: () => void; onWalletRefresh: () => void }

const POSTING_FEE = 5;
const BIKE_TYPES = ["Road", "MTB", "Gravel", "Touring", "Hybrid", "Fixie"];
const FRAME_SIZES = ["XS", "S", "M", "L", "XL", "48cm", "50cm", "52cm", "54cm", "56cm", "58cm"];
const CONDITIONS = ["Mới", "Rất tốt", "Tốt", "Bình thường", "Đã qua sử dụng"];

export default function CreateBikeTab({ token, wallet, onBikeCreated, onWalletRefresh }: CreateBikeTabProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [images, setImages] = useState<{ name: string; dataUrl: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
    const [form, setForm] = useState({
        title: "", bikeType: "Road", brandId: undefined as number | undefined,
        model: "", frameSize: "M", condition: "Tốt", year: "", priceVnd: "", description: "",
        categoryIds: [] as number[], preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: ""
    });

    const walletAvailable = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const hasEnough = walletAvailable >= POSTING_FEE;

    useEffect(() => {
        listCategoriesAPI({ page: 0, size: 100 }).then((res: any) => {
            const data = res?.content || res?.data?.content || (Array.isArray(res) ? res : []);
            setCategories(data.map((c: any) => ({ id: c.id, name: c.name })).filter((c: any) => c.id && c.name));
        }).catch(() => {});
        listBrandsAPI(token).then((res: any) => {
            const data = Array.isArray(res) ? res : (res?.data || []);
            setBrands(data.map((b: any) => ({ id: b.id, name: b.name })).filter((b: any) => b.id && b.name));
        }).catch(() => {});
    }, [token]);

    const handleSubmit = async () => {
        setError(null); setSuccess(null);
        if (!token) { setError("Bạn cần đăng nhập."); return; }
        if (!form.title || !form.brandId || !form.priceVnd) { setError("Vui lòng nhập: Tiêu đề, Hãng, Giá."); return; }
        if (walletAvailable < POSTING_FEE) { setError(`Không đủ điểm. Cần ${POSTING_FEE}, có ${walletAvailable}.`); return; }

        try {
            setLoading(true);
            const fileMedias = images.map((img, i) => ({ url: img.dataUrl, type: "IMAGE", sortOrder: i }));
            const media = fileMedias.map((m, i) => ({ ...m, sortOrder: i }));

            const payload = {
                title: form.title, description: form.description, brandId: form.brandId, model: form.model,
                year: form.year ? Number(form.year) : undefined, pricePoints: Number(form.priceVnd.replace(/[^\d]/g, "")),
                condition: form.condition, bikeType: form.bikeType, frameSize: form.frameSize, media, categoryIds: form.categoryIds
            };

            const res: any = await createSellerBikeAPI(payload, token);
            const bikeId = res?.id ?? res?.data?.id;
            if (!bikeId) throw new Error("Tạo xe thất bại.");

            if (form.preferredDate || form.address) {
                await requestInspectionAPI({
                    bikeId, preferredDate: form.preferredDate || null, preferredTimeSlot: form.preferredTimeSlot || null,
                    address: form.address || null, contactPhone: form.contactPhone || null, notes: form.notes || null
                }, token);
            }

            setSuccess(`Đăng bài thành công! Đã trừ ${POSTING_FEE} điểm.`);
            setForm({ title: "", bikeType: "Road", brandId: undefined, model: "", frameSize: "M", condition: "Tốt",
                year: "", priceVnd: "", description: "", categoryIds: [], preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: "" });
            setImages([]);
            onBikeCreated(); onWalletRefresh();
        } catch (e: any) {
            setError(e.message || "Không thể đăng bài.");
        } finally {
            setLoading(false);
        }
    };

    const handleImages = async (files: FileList | null) => {
        if (!files) return;
        const reads = Array.from(files).map(f => new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: f.name, dataUrl: String(reader.result) });
            reader.onerror = () => reject(new Error("Lỗi đọc ảnh"));
            reader.readAsDataURL(f);
        }));
        Promise.all(reads).then(results => setImages(prev => [...prev, ...results])).catch((e: any) => setError(e.message));
    };

    return (
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={24} />Đăng tin bán xe</h2>
                        <p className="text-blue-100 text-sm mt-1">Tạo bài đăng mới để bán xe đạp</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                        <div className="flex items-center gap-2 text-blue-100 text-xs mb-1"><Wallet size={14} />Số dư ví</div>
                        <div className="text-2xl font-extrabold">{walletAvailable.toLocaleString("vi-VN")}</div>
                        <div className="text-xs text-blue-200">điểm</div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className={`rounded-xl border-2 p-4 ${hasEnough ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${hasEnough ? "bg-emerald-100" : "bg-red-100"}`}>
                            {hasEnough ? <Wallet size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-red-600" />}
                        </div>
                        <div>
                            <div className={`font-bold text-lg ${hasEnough ? "text-emerald-900" : "text-red-900"}`}>Phí đăng tin: {POSTING_FEE} điểm</div>
                            <p className={`text-sm ${hasEnough ? "text-emerald-700" : "text-red-700"}`}>
                                {hasEnough ? `Ví đủ điểm. Hệ thống sẽ tự động trừ ${POSTING_FEE} điểm khi đăng.` : `Không đủ điểm. Cần thêm ${POSTING_FEE - walletAvailable} điểm.`}
                            </p>
                        </div>
                    </div>
                </div>

                {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2"><AlertCircle size={18} />{error}</div>}
                {success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">{success}</div>}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Plus size={20} className="text-blue-600" /></div>
                        <div><div className="font-bold text-gray-900">Hình ảnh xe</div><div className="text-sm text-gray-500">Tải lên ảnh thực tế</div></div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 shadow-md">
                        <Plus size={18} />Chọn ảnh
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} />
                    </label>
                    <span className="ml-3 text-sm text-gray-600">Đã chọn: <b className="text-blue-600">{images.length}</b> ảnh</span>
                    {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                            {images.map((img, i) => (
                                <div key={i} className="relative rounded-xl border-2 border-gray-200 overflow-hidden group">
                                    <img src={img.dataUrl} alt={img.name} className="h-28 w-full object-cover" />
                                    <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Bike size={20} className="text-emerald-600" /></div>
                        <div><div className="font-bold text-gray-900">Thông tin xe</div><div className="text-sm text-gray-500">Điền đầy đủ thông tin</div></div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Tiêu đề <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Giant XTC 800 2021"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Loại xe</label>
                            <select value={form.bikeType} onChange={(e) => setForm(p => ({ ...p, bikeType: e.target.value }))}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white">
                                {BIKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Hãng <span className="text-red-500">*</span></label>
                            <select value={form.brandId ?? ""} onChange={(e) => setForm(p => ({ ...p, brandId: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white">
                                <option value="">-- Chọn hãng --</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Model</label>
                            <input value={form.model} onChange={(e) => setForm(p => ({ ...p, model: e.target.value }))} placeholder="Escape 3"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Kích thước khung</label>
                            <select value={form.frameSize} onChange={(e) => setForm(p => ({ ...p, frameSize: e.target.value }))}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white">
                                {FRAME_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Tình trạng</label>
                            <select value={form.condition} onChange={(e) => setForm(p => ({ ...p, condition: e.target.value }))}
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white">
                                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Năm sản xuất</label>
                            <input value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} placeholder="2021"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Giá (điểm) <span className="text-red-500">*</span></label>
                            <input value={form.priceVnd} onChange={(e) => setForm(p => ({ ...p, priceVnd: e.target.value }))} placeholder="12500000"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                            <div className="text-xs text-gray-500 mt-1">Nhập số điểm (VD: 12500000)</div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-gray-200 p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <div><div className="text-sm font-semibold text-gray-900">Danh mục</div><div className="text-xs text-gray-500">Chọn danh mục phù hợp</div></div>
                        </div>
                        {categories.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {categories.map(c => {
                                    const checked = form.categoryIds.includes(c.id);
                                    return (
                                        <label key={c.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                                            <input type="checkbox" checked={checked} onChange={(e) => {
                                                const on = e.target.checked;
                                                setForm(p => ({ ...p, categoryIds: on ? [...p.categoryIds, c.id] : p.categoryIds.filter(id => id !== c.id) }));
                                            }} />
                                            <span className="truncate">{c.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="mt-5">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Mô tả chi tiết</label>
                        <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả tình trạng xe, lịch sử sử dụng..."
                            className="w-full min-h-28 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="font-bold text-gray-900 mb-3">Yêu cầu kiểm định (tuỳ chọn)</div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày ưu tiên</label>
                            <input value={form.preferredDate} onChange={(e) => setForm(p => ({ ...p, preferredDate: e.target.value }))} placeholder="2026-03-15"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Khung giờ</label>
                            <input value={form.preferredTimeSlot} onChange={(e) => setForm(p => ({ ...p, preferredTimeSlot: e.target.value }))} placeholder="Sáng / Chiều"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Địa chỉ</label>
                            <input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Lê Lợi, Q1"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">SĐT liên hệ</label>
                            <input value={form.contactPhone} onChange={(e) => setForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="0901234567"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Ghi chú</label>
                            <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú cho kiểm định viên..."
                                className="w-full min-h-24 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={() => { setError(null); setSuccess(null); }}
                        className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Huỷ
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !hasEnough}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {loading ? "Đang đăng..." : "Đăng tin"}
                    </button>
                </div>
            </div>
        </div>
    );
}
