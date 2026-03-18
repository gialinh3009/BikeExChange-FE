import { useEffect, useState } from "react";
import { Plus, X, Wallet, AlertCircle, Bike, CheckCircle2 } from "lucide-react";
import { createBikeWithImagesAPI } from "../../services/Seller/bikeManagementService";
import { getCategoriesAPI, getBrandsAPI } from "../../services/Seller/catalogService";
import { uploadMultipleToCloudinary } from "../../utils/cloudinaryUpload";

type WalletLike = { availablePoints?: number; frozenPoints?: number; data?: { availablePoints?: number; frozenPoints?: number } };
interface CreateBikeTabProps { token: string; wallet: WalletLike | null; onBikeCreated: () => void; onWalletRefresh: () => void }

const POSTING_FEE = 5000;
const BIKE_TYPES = ["Road", "MTB", "Gravel", "Touring", "Hybrid", "Fixie"];
const FRAME_SIZES = ["XS", "S", "M", "L", "XL", "48cm", "50cm", "52cm", "54cm", "56cm", "58cm"];
const CONDITIONS = ["Mới", "Rất tốt", "Tốt", "Bình thường", "Đã qua sử dụng"];

export default function CreateBikeTab({ token, wallet, onBikeCreated, onWalletRefresh }: CreateBikeTabProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [images, setImages] = useState<{ name: string; dataUrl: string; file?: File }[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
    const [form, setForm] = useState({
        title: "", bikeType: "Road", brandId: undefined as number | undefined,
        model: "", frameSize: "M", condition: "Tốt", year: "", priceVnd: "", description: "",
        categoryId: undefined as number | undefined
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const walletAvailable = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const totalFee = POSTING_FEE;
    const hasEnough = walletAvailable >= totalFee;

    useEffect(() => {
        getCategoriesAPI().then((res: any) => {
            const data = Array.isArray(res) ? res : (res?.data || []);
            setCategories(data.map((c: any) => ({ id: c.id, name: c.name })).filter((c: any) => c.id && c.name));
        }).catch(() => {});
        getBrandsAPI().then((res: any) => {
            const data = Array.isArray(res) ? res : (res?.data || []);
            setBrands(data.map((b: any) => ({ id: b.id, name: b.name })).filter((b: any) => b.id && b.name));
        }).catch(() => {});
    }, [onWalletRefresh]);

    const handleSubmit = async () => {
        setError(null); setSuccess(null);
        if (!token) { setError("Bạn cần đăng nhập."); return; }
        if (!form.title || !form.brandId || !form.priceVnd) { setError("Vui lòng nhập: Tiêu đề, Hãng, Giá."); return; }
        if (images.length === 0) { setError("Vui lòng thêm ít nhất một ảnh."); return; }
        
        if (walletAvailable < totalFee) { 
            setError(`Không đủ tiền. Cần ${totalFee} VND, có ${walletAvailable} VND.`); 
            return; 
        }

        try {
            setLoading(true);
            setUploading(true);
            
            // Step 1: Upload images to Cloudinary
            setSuccess("Đang upload ảnh lên Cloudinary...");
            const imageFiles = images.map(img => img.file).filter(Boolean) as File[];
            const cloudinaryUrls = await uploadMultipleToCloudinary(imageFiles);
            
            if (!cloudinaryUrls || cloudinaryUrls.length === 0) {
                throw new Error("Không thể upload ảnh. Vui lòng thử lại.");
            }

            // Step 2: Create FormData for /bikes/with-images API with Cloudinary URLs
            setSuccess("Đang tạo bài đăng...");
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("brand_id", String(form.brandId));
            formData.append("model", form.model);
            formData.append("condition", form.condition);
            formData.append("bike_type", form.bikeType);
            formData.append("frame_size", form.frameSize);
            formData.append("price_points", String(Number(form.priceVnd.replace(/[^\d]/g, ""))));
            formData.append("year", form.year ? String(parseInt(form.year)) : "0");
            
            // Add category IDs
            if (form.categoryId) {
                formData.append("category_ids", String(form.categoryId));
            }
            
            // Add Cloudinary image URLs as files
            // Since backend expects MultipartFile[], we need to convert URLs to files
            for (let i = 0; i < cloudinaryUrls.length; i++) {
                const url = cloudinaryUrls[i];
                const response = await fetch(url);
                const blob = await response.blob();
                const file = new File([blob], `bike-image-${i}.jpg`, { type: "image/jpeg" });
                formData.append("images", file);
            }

            setUploading(false);
            
            const res: any = await createBikeWithImagesAPI(formData, token);
            const bikeId = res?.id ?? res?.data?.id;
            if (!bikeId) throw new Error("Tạo xe thất bại.");

            setShowSuccessModal(true);
            setForm({ title: "", bikeType: "Road", brandId: undefined, model: "", frameSize: "M", condition: "Tốt",
                year: "", priceVnd: "", description: "", categoryId: undefined });
            setImages([]);
            setSuccess(null);
            onBikeCreated(); onWalletRefresh();
        } catch (e: any) {
            console.error("Create bike error:", e);
            setError(e.message || "Không thể đăng bài.");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const handleImages = async (files: FileList | null) => {
        if (!files) return;
        const reads = Array.from(files).map(f => new Promise<{ name: string; dataUrl: string; file: File }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const reader2 = new FileReader();
                                reader2.onload = () => {
                                    resolve({ name: f.name.replace(/\.[^/.]+$/, ".png"), dataUrl: String(reader2.result), file: new File([blob], f.name, { type: "image/png" }) });
                                };
                                reader2.readAsDataURL(blob);
                            } else {
                                reject(new Error("Không thể chuyển đổi ảnh"));
                            }
                        }, "image/png");
                    }
                };
                img.onerror = () => reject(new Error("Không thể tải ảnh"));
                img.src = String(reader.result);
            };
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
                            <div className={`font-bold text-lg ${hasEnough ? "text-emerald-900" : "text-red-900"}`}>
                                Phí đăng tin: {POSTING_FEE} VND
                            </div>
                            <p className={`text-sm ${hasEnough ? "text-emerald-700" : "text-red-700"}`}>
                                {hasEnough ? `Hệ thống sẽ tự động trừ ${totalFee} VND khi đăng.` : `Không đủ tiền. Cần thêm ${totalFee - walletAvailable} VND.`}
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
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 shadow-md disabled:opacity-50" style={{ pointerEvents: uploading || loading ? 'none' : 'auto', opacity: uploading || loading ? 0.6 : 1 }}>
                        <Plus size={18} />{uploading ? "Đang upload..." : loading ? "Đang xử lý..." : "Chọn ảnh"}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImages(e.target.files)} disabled={uploading || loading} />
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
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Giá (VND) <span className="text-red-500">*</span></label>
                            <input value={form.priceVnd} onChange={(e) => setForm(p => ({ ...p, priceVnd: e.target.value }))} placeholder="12500000"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                            <div className="text-xs text-gray-500 mt-1">Nhập số tiền (VD: 12500000)</div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Danh mục</label>
                        <select value={form.categoryId ?? ""} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white">
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="mt-5">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Mô tả chi tiết</label>
                        <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Mô tả tình trạng xe, lịch sử sử dụng..."
                            className="w-full min-h-28 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
                    </div>
                </div>

                
                <div className="flex justify-end gap-3">
                    <button onClick={() => { setError(null); setSuccess(null); }}
                        className="rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Huỷ
                    </button>
                    <button onClick={handleSubmit} disabled={loading || uploading || !hasEnough}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {uploading ? "Đang upload ảnh..." : loading ? "Đang xử lý..." : "Đăng tin"}
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
                                <div className="text-2xl font-bold text-emerald-600">{totalFee} VND</div>
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
