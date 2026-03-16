import { useCallback, useEffect, useState } from "react";
import { Plus, Tag, X, Trash2, Pencil } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getBrandsAPI, createBrandAPI, updateBrandAPI, deleteBrandAPI } from "../../../services/Admin/brandService";

interface Brand {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

type ModalMode = "create" | "edit";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function ManagerBrand() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBrandsAPI();
      const content = res?.data ?? [];
      setBrands(Array.isArray(content) ? content : []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách thương hiệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  function openCreateModal() {
    setModalMode("create");
    setEditingBrand(null);
    setForm({ name: "", description: "" });
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(brand: Brand) {
    setModalMode("edit");
    setEditingBrand(brand);
    setForm({ name: brand.name, description: brand.description ?? "" });
    setFormError(null);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setForm({ name: "", description: "" });
    setFormError(null);
    setEditingBrand(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Tên thương hiệu không được để trống.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === "edit" && editingBrand) {
        await updateBrandAPI(editingBrand.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Cập nhật thương hiệu thành công!");
      } else {
        await createBrandAPI({ name: form.name.trim(), description: form.description.trim() || undefined });
        toast.success("Tạo thương hiệu thành công!");
      }
      handleCloseModal();
      fetchBrands();
    } catch (err: any) {
      setFormError(err.message || (modalMode === "edit" ? "Cập nhật thất bại." : "Tạo thất bại."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(brand: Brand) {
    if (!window.confirm(`Xóa thương hiệu "${brand.name}"?`)) return;
    setDeletingId(brand.id);
    try {
      await deleteBrandAPI(brand.id);
      toast.success(`Đã xóa thương hiệu "${brand.name}".`);
      fetchBrands();
    } catch (err: any) {
      toast.error(err.message || "Xóa thương hiệu thất bại.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Thương Hiệu</h1>
          <p className="mt-1 text-sm text-gray-500">Danh sách thương hiệu xe đạp trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus size={15} /> Thêm thương hiệu
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 w-fit">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Tag size={20} className="text-blue-700" />
        </span>
        <div>
          <div className="text-xl font-bold text-gray-900">{brands.length}</div>
          <div className="text-xs text-gray-500">Tổng thương hiệu</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchBrands} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Tên thương hiệu</th>
                <th className="px-5 py-3 font-medium">Mô tả</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-b border-gray-50 hover:bg-blue-50">
                  <td className="px-5 py-3 text-gray-400">#{brand.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{brand.name}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-gray-500">{brand.description || "-"}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(brand.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(brand)}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(brand)}
                        disabled={deletingId === brand.id}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        title="Xóa thương hiệu"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    Chưa có thương hiệu nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === "edit" ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu"}
              </h2>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tên thương hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  placeholder="Nhập tên thương hiệu"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  placeholder="Nhập mô tả (tùy chọn)"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting
                    ? modalMode === "edit" ? "Đang lưu..." : "Đang tạo..."
                    : modalMode === "edit" ? "Lưu thay đổi" : "Tạo thương hiệu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
