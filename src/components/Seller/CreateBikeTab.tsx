import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { getCategoriesAPI, getBrandsAPI, createBikeAPI } from "../../services/Seller/sellerService";

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

const CREATION_FEE = 5000;

export default function CreateBikeTab({
    token,
    wallet,
    onBikeCreated,
    onWalletRefresh,
}: CreateBikeTabProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [categories, setCategories] = useState<Array<{ id: number; name?: string; categoryName?: string }>>([]);
    const [brands, setBrands] = useState<Array<{ id: number; name?: string; brandName?: string }>>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [form, setForm] = useState({
        title: "",
        description: "",
        categoryId: "",
        brandId: "",
        condition: "LIKE_NEW",
        pricePoints: "",
    });
    const [mediaPreview, setMediaPreview] = useState<string[]>([]);

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
            setError(null);
            setSuccess(null);

            if (!form.title.trim()) {
                throw new Error("Vui lòng nhập tên xe.");
            }
            if (!form.categoryId) {
                throw new Error("Vui lòng chọn danh mục.");
            }
            if (!form.pricePoints) {
                throw new Error("Vui lòng nhập giá bán.");
            }
            if (!canAfford) {
                throw new Error(`Bạn cần ít nhất ${CREATION_FEE.toLocaleString("vi-VN")} VND để đăng tin.`);
            }

            const payload = {
                title: form.title,
                description: form.description,
                categoryId: parseInt(form.categoryId),
                brandId: form.brandId ? parseInt(form.brandId) : null,
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
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Đăng tin bán xe</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Phí đăng tin: {CREATION_FEE.toLocaleString("vi-VN")} VND (sẽ được trừ từ ví)
                </p>
            </div>

            {!canAfford && (
                <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-sm text-red-700">
                    Bạn không đủ tiền để đăng tin. Cần ít nhất {CREATION_FEE.toLocaleString("vi-VN")} VND.
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {success}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Tên xe *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            placeholder="VD: Xe đạp Trek FX 3"
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Giá bán (VND) *</label>
                        <input
                            type="number"
                            value={form.pricePoints}
                            onChange={(e) => setForm((p) => ({ ...p, pricePoints: e.target.value }))}
                            placeholder="5000000"
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Danh mục *</label>
                        <select
                            value={form.categoryId}
                            onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {categoriesLoading ? (
                                <option disabled>Đang tải...</option>
                            ) : (
                                categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name || cat.categoryName}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Hãng xe</label>
                        <select
                            value={form.brandId}
                            onChange={(e) => setForm((p) => ({ ...p, brandId: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="">-- Chọn hãng xe --</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name || brand.brandName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Tình trạng</label>
                        <select
                            value={form.condition}
                            onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="LIKE_NEW">Như mới</option>
                            <option value="EXCELLENT">Tuyệt vời</option>
                            <option value="GOOD">Tốt</option>
                            <option value="FAIR">Bình thường</option>
                            <option value="POOR">Kém</option>
                        </select>
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
                    <button
                        type="submit"
                        disabled={loading || !canAfford}
                        className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? "Đang đăng..." : "Đăng tin bán xe"}
                    </button>
                </div>
            </form>
        </div>
    );
}
