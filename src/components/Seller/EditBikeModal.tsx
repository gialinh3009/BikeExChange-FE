import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { updateBikeAPI } from "../../services/Seller/bikeManagementService";
import { getCategoriesAPI, getBrandsAPI } from "../../services/Seller/catalogService";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
    description?: string;
    bikeType?: string;
    frameSize?: string;
    model?: string;
    year?: string;
    brand?: string;
};

interface EditBikeModalProps {
    bike: BikeBrowseItem | null;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

const BIKE_TYPES = ["Road", "MTB", "Gravel", "Touring", "Hybrid", "Fixie"];
const FRAME_SIZES = ["XS", "S", "M", "L", "XL", "48cm", "50cm", "52cm", "54cm", "56cm", "58cm"];
const CONDITIONS = ["Mới", "Rất tốt", "Tốt", "Bình thường", "Đã qua sử dụng"];

export default function EditBikeModal({ bike, token, onClose, onSuccess }: EditBikeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
    const [images, setImages] = useState<{ name: string; dataUrl: string; file?: File; isNew?: boolean }[]>([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        brandId: undefined as number | undefined,
        model: "",
        year: "",
        pricePoints: "",
        condition: "Tốt",
        bikeType: "Road",
        frameSize: "M",
        categoryIds: [] as number[],
    });

    useEffect(() => {
        if (!bike) return;
        
        setForm({
            title: bike.title || "",
            description: bike.description || "",
            brandId: undefined,
            model: bike.model || "",
            year: bike.year?.toString() || "",
            pricePoints: bike.pricePoints?.toString() || "",
            condition: bike.condition || "Tốt",
            bikeType: bike.bikeType || "Road",
            frameSize: bike.frameSize || "M",
            categoryIds: [],
        });

        // Load existing images
        if (bike.media && bike.media.length > 0) {
            setImages(bike.media.map((m) => ({
                name: `image-${m.sortOrder}`,
                dataUrl: m.url,
                isNew: false,
            })));
        }

        getCategoriesAPI()
            .then(() => {
                // Categories API called but not used in edit form
            })
            .catch(() => {});

        getBrandsAPI()
            .then((res: any) => {
                const data = Array.isArray(res) ? res : (res?.data || []);
                setBrands(data.map((b: any) => ({ id: b.id, name: b.name })).filter((b: any) => b.id && b.name));
            })
            .catch(() => {});
    }, [bike]);

    const handleAddImages = async (files: FileList | null) => {
        if (!files) return;
        
        const reads = Array.from(files).map(f => new Promise<{ name: string; dataUrl: string; file: File; isNew: boolean }>((resolve, reject) => {
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
                                    resolve({ 
                                        name: f.name.replace(/\.[^/.]+$/, ".png"), 
                                        dataUrl: String(reader2.result), 
                                        file: new File([blob], f.name, { type: "image/png" }),
                                        isNew: true
                                    });
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
        
        Promise.all(reads)
            .then(results => setImages(prev => [...prev, ...results]))
            .catch((e: any) => setError(e.message));
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleSubmit = async () => {
        if (!bike) return;
        
        setError(null);
        setSuccess(null);

        if (!form.title || !form.brandId || !form.pricePoints) {
            setError("Vui lòng nhập: Tiêu đề, Hãng, Giá.");
            return;
        }

        if (images.length === 0) {
            setError("Vui lòng giữ lại ít nhất một ảnh.");
            return;
        }

        try {
            setLoading(true);
            
            // Prepare media array with existing and new images
            const media = images.map((img, idx) => ({
                url: img.dataUrl,
                type: "IMAGE",
                sortOrder: idx + 1,
            }));

            const payload = {
                title: form.title,
                description: form.description,
                brandId: form.brandId,
                model: form.model,
                condition: form.condition,
                bikeType: form.bikeType,
                frameSize: form.frameSize,
                pricePoints: Number(form.pricePoints.replace(/[^\d]/g, "")),
                year: form.year ? Number(form.year) : null,
                categoryIds: form.categoryIds.length > 0 ? form.categoryIds : [],
                media: media,
            };

            await updateBikeAPI(bike.id, payload, token);
            setSuccess("Cập nhật xe thành công!");
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (e) {
            setError((e as Error).message || "Cập nhật xe thất bại.");
        } finally {
            setLoading(false);
        }
    };

    if (!bike) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Chỉnh sửa thông tin xe</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                            {success}
                        </div>
                    )}

                    {/* Images Section */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-semibold text-gray-900">Hình ảnh xe</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {images.length} ảnh
                            </span>
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                {images.map((img, i) => (
                                    <div key={i} className="relative rounded-lg border-2 border-gray-200 overflow-hidden group">
                                        <img src={img.dataUrl} alt={img.name} className="h-24 w-full object-cover" />
                                        {img.isNew && (
                                            <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                                                Mới
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleRemoveImage(i)}
                                            className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition">
                            <Plus size={16} />
                            Thêm ảnh
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleAddImages(e.target.files)}
                            />
                        </label>
                    </div>

                    {/* Bike Info Section */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Thông tin xe</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tiêu đề xe"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hãng</label>
                                <select
                                    value={form.brandId || ""}
                                    onChange={(e) => setForm({ ...form, brandId: Number(e.target.value) || undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Chọn hãng</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                <input
                                    type="text"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Model"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Năm sản xuất</label>
                                <input
                                    type="number"
                                    value={form.year}
                                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="2022"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                                <input
                                    type="text"
                                    value={form.pricePoints}
                                    onChange={(e) => setForm({ ...form, pricePoints: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe</label>
                                <select
                                    value={form.bikeType}
                                    onChange={(e) => setForm({ ...form, bikeType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {BIKE_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng</label>
                                <select
                                    value={form.condition}
                                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {CONDITIONS.map((cond) => (
                                        <option key={cond} value={cond}>
                                            {cond}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước khung</label>
                            <select
                                value={form.frameSize}
                                onChange={(e) => setForm({ ...form, frameSize: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {FRAME_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mô tả chi tiết về xe"
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 text-white px-6 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Đang cập nhật..." : "Cập nhật"}
                    </button>
                </div>
            </div>
        </div>
    );
}
