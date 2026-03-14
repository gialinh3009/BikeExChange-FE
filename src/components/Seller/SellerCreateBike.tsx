import { useState, useEffect } from "react";
import { Loader, AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { createSellerBikeAPI, listCategoriesAPI, listBrandsAPI } from "../../services/Seller/sellerBikeService";

export default function SellerCreateBike({ token }: { token: string }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; sortOrder: number }[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePoints: "",
    categoryIds: [] as number[],
    brandId: "",
    year: new Date().getFullYear().toString(),
    frameSize: "",
    condition: "Good",
    model: "",
    bikeType: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, brands] = await Promise.all([listCategoriesAPI(token), listBrandsAPI(token)]);
        setCategories(cats);
        setBrands(brands);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "categoryIds") {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, (option) =>
        parseInt(option.value)
      );
      setFormData((prev) => ({ ...prev, categoryIds: selected }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const convertToPNG = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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
                const pngFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".png"), {
                  type: "image/png",
                });
                resolve(pngFile);
              } else {
                reject(new Error("Không thể chuyển đổi ảnh"));
              }
            }, "image/png");
          }
        };
        img.onerror = () => reject(new Error("Không thể tải ảnh"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Không thể đọc file"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const newMedia: { file: File; preview: string; sortOrder: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setError("Vui lòng chọn file ảnh");
          continue;
        }

        const pngFile = await convertToPNG(file);
        const preview = URL.createObjectURL(pngFile);
        newMedia.push({
          file: pngFile,
          preview,
          sortOrder: mediaFiles.length + newMedia.length + 1,
        });
      }

      setMediaFiles((prev) => [...prev, ...newMedia]);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload ảnh");
    }
  };

  const removeImage = (index: number) => {
    setMediaFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.title || !formData.pricePoints || !formData.brandId || formData.categoryIds.length === 0) {
      setError("Vui lòng điền tất cả các trường bắt buộc");
      return;
    }

    if (mediaFiles.length === 0) {
      setError("Vui lòng thêm ít nhất một ảnh");
      return;
    }

    try {
      setSubmitting(true);

      // Tạo FormData để gửi file
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("pricePoints", formData.pricePoints);
      formDataToSend.append("brandId", formData.brandId);
      formDataToSend.append("year", formData.year);
      formDataToSend.append("frameSize", formData.frameSize);
      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("model", formData.model);
      formDataToSend.append("bikeType", formData.bikeType);

      // Thêm categoryIds
      formData.categoryIds.forEach((id) => {
        formDataToSend.append("categoryIds", id.toString());
      });

      // Thêm media files
      mediaFiles.forEach((media) => {
        formDataToSend.append(`media`, media.file);
      });

      await createSellerBikeAPI(formDataToSend, token);
      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        pricePoints: "",
        categoryIds: [],
        brandId: "",
        year: new Date().getFullYear().toString(),
        frameSize: "",
        condition: "Good",
        model: "",
        bikeType: "",
      });
      setMediaFiles([]);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Tạo xe thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tạo Xe Đạp Mới</h2>
          <p className="text-sm text-gray-600 mt-1">Điền thông tin chi tiết về xe của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">Xe được tạo thành công!</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tên Xe <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Giant Escape 3 2024"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Mô Tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về xe..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Giá (Điểm) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="pricePoints"
              value={formData.pricePoints}
              onChange={handleChange}
              placeholder="VD: 5000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Danh Mục <span className="text-red-600">*</span>
            </label>
            <select
              name="categoryIds"
              multiple
              value={formData.categoryIds.map(String)}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">Giữ Ctrl/Cmd để chọn nhiều danh mục</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Thương Hiệu <span className="text-red-600">*</span>
            </label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="VD: Escape 3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Năm Sản Xuất</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1990"
              max={new Date().getFullYear()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Kích Thước Khung</label>
            <input
              type="text"
              name="frameSize"
              value={formData.frameSize}
              onChange={handleChange}
              placeholder="VD: 54cm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Loại Xe</label>
            <input
              type="text"
              name="bikeType"
              value={formData.bikeType}
              onChange={handleChange}
              placeholder="VD: Road, Mountain, Hybrid"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Tình Trạng</label>
            <input
              type="text"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              placeholder="VD: New, Like New, Good, Fair"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Ảnh Xe <span className="text-red-600">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Kéo thả ảnh hoặc click để chọn</p>
                <p className="text-xs text-gray-500 mt-1">Hỗ trợ: JPG, PNG, GIF (sẽ được chuyển sang PNG)</p>
              </label>
            </div>

            {mediaFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 mb-3">Ảnh đã chọn ({mediaFiles.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaFiles.map((media, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={media.preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 text-center">Ảnh {idx + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo Xe"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
