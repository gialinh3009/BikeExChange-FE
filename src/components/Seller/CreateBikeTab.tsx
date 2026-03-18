import { useEffect, useState } from "react";
import { Plus, X, Wallet, AlertCircle, Bike, Upload, CheckCircle2 } from "lucide-react";
import { createBikeAPI, getCategoriesAPI, getBrandsAPI, requestInspectionAPI } from "../../services/Seller/sellerService";
import { uploadImageToCloudinary } from "../../services/firebaseService";

type WalletLike = {
    availablePoints?: number;
    frozenPoints?: number;
    data?: {
        availablePoints?: number;
        frozenPoints?: number;
    };
};

type Category = { id: number; name: string };

type ApiDataWrapper<T> = { data?: T };

type CreateBikeResponse = { id?: number; data?: { id?: number } };

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isCategory = (value: unknown): value is Category => {
    if (!isObject(value)) return false;
    return typeof value.id === "number" && typeof value.name === "string";
};

interface CreateBikeTabProps {
    token: string;
    wallet: WalletLike | null;
    onBikeCreated: () => void;
    onWalletRefresh: () => void;
}

const POSTING_FEE = 5;

export default function CreateBikeTab({ token, wallet, onBikeCreated, onWalletRefresh }: CreateBikeTabProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [images, setImages] = useState<{ name: string; dataUrl: string; file: File }[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [mediaPreview, setMediaPreview] = useState<string[]>([]);
    const [form, setForm] = useState({
        title: "", bikeType: "Road", brandId: undefined as number | undefined,
        model: "", frameSize: "M", condition: "Tốt", year: "", priceVnd: "", description: "",
        categoryIds: [] as number[], preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: ""
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const walletAvailable = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const hasEnough = walletAvailable >= POSTING_FEE;

    useEffect(() => {
        const loadData = async () => {
            try {
                const resCats = await getCategoriesAPI();
                const rawCats = Array.isArray(resCats) ? resCats : (isObject(resCats) && "data" in resCats ? (resCats as ApiDataWrapper<unknown>).data : []);
                const listCats = Array.isArray(rawCats) ? rawCats : [];
                setCategories(listCats.filter(isCategory));

                // Load brands but don't use them for now
            } catch (e: unknown) {
                console.error("Error loading categories/brands:", e);
            }
        };
        void loadData();
    }, []);

    useEffect(() => {
        if (!success) return;
        const timeout = window.setTimeout(() => setSuccess(null), 5000);
        return () => window.clearTimeout(timeout);
    }, [success]);

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setMediaPreview((p) => [...p, dataUrl]);
                // ✅ IMPORTANT: Cập nhật images state với File object để upload
                setImages((prev) => [...prev, { 
                    name: file.name, 
                    dataUrl: dataUrl, 
                    file: file 
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (idx: number) => {
        setMediaPreview((p) => p.filter((_, i) => i !== idx));
        // ✅ Cũng xóa từ images state
        setImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            
            // ✅ Validate required fields
            if (!form.title.trim()) {
                setError("Vui lòng nhập tiêu đề xe");
                setLoading(false);
                return;
            }
            if (!form.brandId) {
                setError("Vui lòng chọn thương hiệu");
                setLoading(false);
                return;
            }
            if (!form.priceVnd) {
                setError("Vui lòng nhập giá bán");
                setLoading(false);
                return;
            }
            if (images.length < 2) {
                setError("Vui lòng tải lên ít nhất 2 ảnh xe");
                setLoading(false);
                return;
            }
            
            // ✅ Upload images to Cloudinary
            setUploading(true);
            const uploadedUrls = await Promise.all(
                images.map(async (img, idx) => {
                    if (!img.file) {
                        throw new Error("File ảnh không hợp lệ");
                    }
                    const url = await uploadImageToCloudinary(img.file);
                    console.log(`✅ Ảnh ${idx + 1} uploaded to Cloudinary:`, url);
                    return { url, type: "IMAGE", sortOrder: idx + 1 };
                })
            );

            setUploading(false);
            
            const payload = {
                title: form.title,
                description: form.description,
                brandId: form.brandId,
                model: form.model,
                condition: form.condition,
                bikeType: form.bikeType,
                frameSize: form.frameSize,
                pricePoints: Number(form.priceVnd.replace(/[^\d]/g, "")),
                year: form.year ? Number(form.year) : null,
                categoryIds: form.categoryIds && form.categoryIds.length > 0 ? form.categoryIds : [],
                media: uploadedUrls  // ✅ Cloudinary URLs
            };

            const res = (await createBikeAPI(payload, token)) as CreateBikeResponse;
            const bikeId = res?.id ?? (isObject(res) ? (res as ApiDataWrapper<{ id?: number }>).data?.id : undefined);
            if (!bikeId) throw new Error("Tạo xe thất bại.");

            if (form.preferredDate || form.address) {
                await requestInspectionAPI({
                    bikeId, preferredDate: form.preferredDate || null, preferredTimeSlot: form.preferredTimeSlot || null,
                    address: form.address || null, contactPhone: form.contactPhone || null, notes: form.notes || null
                }, token);
            }

            setSuccess(`Đăng bài thành công! Đã upload ${uploadedUrls.length} ảnh từ Cloudinary. Đã trừ ${POSTING_FEE} VND.`);
            setForm({ title: "", bikeType: "Road", brandId: undefined, model: "", frameSize: "M", condition: "Tốt",
                year: "", priceVnd: "", description: "", categoryIds: [], preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: "" });
            setImages([]);
            setMediaPreview([]);
            onBikeCreated(); onWalletRefresh();
        } catch (e: any) {
            console.error("Create bike error:", e);
            const errObj = isObject(e) ? e : {};
            const message = typeof errObj.message === "string" ? errObj.message : "Không thể tạo xe.";
            setError(message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
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
                        <div className="text-xs text-blue-200">VND</div>
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
                            <div className={`font-bold text-lg ${hasEnough ? "text-emerald-900" : "text-red-900"}`}>Phí đăng tin: {POSTING_FEE} VND</div>
                            <p className={`text-sm ${hasEnough ? "text-emerald-700" : "text-red-700"}`}>
                                {hasEnough ? `Ví đủ tiền. Hệ thống sẽ tự động trừ ${POSTING_FEE} VND khi đăng.` : `Không đủ tiền. Cần thêm ${POSTING_FEE - walletAvailable} VND.`}
                            </p>
                        </div>
                    </div>
                </div>

                {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex gap-2"><AlertCircle size={18} />{error}</div>}

                {/* Success modal centered on screen */}
                {success && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <div className="flex items-start justify-between">
                                <div className="text-lg font-bold text-emerald-700">Đăng tin thành công</div>
                                <button onClick={() => setSuccess(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="mt-4 text-sm text-gray-700">
                                {success}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={() => setSuccess(null)}
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800">
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Mô tả tình trạng, tính năng, lý do bán..."
                        className="mt-1 w-full min-h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
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

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Ảnh xe</label>
                        <span className={`text-xs font-semibold ${
                            images.length >= 2
                                ? "text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"
                                : "text-orange-600 bg-orange-50 px-2 py-1 rounded-full"
                        }`}>
                            {images.length}/2 ảnh tối thiểu
                        </span>
                    </div>
                    <div className="mt-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 transition">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleMediaChange}
                            className="hidden"
                            id="media-input"
                        />
                        <label htmlFor="media-input" className="cursor-pointer">
                            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600">
                                Kéo thả ảnh hoặc <span className="text-blue-600 font-semibold">chọn từ máy</span>
                            </div>
                        </label>
                    </div>

                    {mediaPreview.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {mediaPreview.map((preview, idx) => (
                                <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                        src={preview}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-full h-24 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(idx)}
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="reset"
                        className="rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Xóa
                    </button>
                    <button onClick={handleSubmit} disabled={loading || uploading || !hasEnough || images.length < 2}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {uploading ? "Đang upload ảnh..." : loading ? "Đang đăng..." : images.length < 2 ? "Cần thêm ảnh" : "Đăng tin"}
                    </button>
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                                <CheckCircle2 size={32} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Đăng bài thành công!</h2>
                            <p className="text-emerald-700 text-sm mb-4">Bài đăng của bạn đã được tạo thành công</p>
                            <div className="bg-white rounded-xl p-4 mb-4">
                                <div className="text-xs text-gray-600 mb-1">Phí đã trừ</div>
                                <div className="text-2xl font-bold text-emerald-600">{POSTING_FEE} VND</div>
                            </div>
                            <p className="text-xs text-gray-600 mb-6">Xe của bạn sẽ hiển thị trong danh sách bài đăng</p>
                        </div>
                        <div className="px-6 py-4 flex justify-center">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-8 py-2.5 text-sm font-semibold text-white transition"
                            >
                                Hoàn tất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
