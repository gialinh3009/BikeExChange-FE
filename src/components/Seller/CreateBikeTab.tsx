import { useEffect, useState } from "react";
import { Plus, X, Wallet, AlertCircle, Bike } from "lucide-react";
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

interface CreateBikeTabProps {
    token: string;
    wallet: WalletLike | null;
    onBikeCreated: () => void;
    onWalletRefresh: () => void;
}

const POSTING_FEE = 5;
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
        categoryIds: [] as number[], preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: ""
    });

    const walletAvailable = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const hasEnough = walletAvailable >= POSTING_FEE;

    useEffect(() => {
        const loadData = async () => {
            try {
                setCategoriesLoading(true);
                const [catsData, brandsData] = await Promise.all([
                    getCategoriesAPI(),
                    getBrandsAPI(),
                ]);
                setCategories(Array.isArray(catsData) ? catsData : catsData?.data ?? []);
                setBrands(Array.isArray(brandsData) ? brandsData : brandsData?.data ?? []);
            } catch (e) {
                console.error("Error loading categories/brands:", e);
            } finally {
                setCategoriesLoading(false);
            }
        };
        void loadData();
    }, []);

    const availableMoney = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const canAfford = availableMoney >= CREATION_FEE;

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setMediaPreview((p) => [...p, event.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (idx: number) => {
        setMediaPreview((p) => p.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setUploading(true);
            
            const uploadedUrls = await Promise.all(
                images.map(async (img, idx) => {
                    if (!img.file) {
                        throw new Error("File ảnh không hợp lệ");
                    }
                    const url = await uploadImageToCloudinary(img.file);
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
                pricePoints: parseInt(form.pricePoints),
            };

            await createBikeAPI(payload, token);

            setSuccess("Đã đăng tin bán xe thành công! Hệ thống sẽ trừ 5000 VND từ ví của bạn.");
            setForm({
                title: "",
                description: "",
                categoryId: "",
                brandId: "",
                condition: "LIKE_NEW",
                pricePoints: "",
            });
            setMediaPreview([]);

            onBikeCreated();
            onWalletRefresh();
        } catch (e) {
            setError((e as Error).message || "Không thể tạo xe.");
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

                <div>
                    <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Mô tả tình trạng, tính năng, lý do bán..."
                        className="mt-1 w-full min-h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700">Ảnh xe (tùy chọn)</label>
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
                    <button onClick={handleSubmit} disabled={loading || uploading || !hasEnough}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                        {uploading ? "Đang upload ảnh..." : loading ? "Đang đăng..." : "Đăng tin"}
                    </button>
                </div>
            </div>
        </div>
    );
}
