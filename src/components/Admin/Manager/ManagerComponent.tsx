import { useCallback, useEffect, useState } from "react";
import { Plus, Cpu, X, Trash2, Pencil } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getComponentsAPI, createComponentAPI, updateComponentAPI, deleteComponentAPI } from "../../../services/Admin/componentService";

interface Component {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

type ModalMode = "create" | "edit";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function ManagerComponent() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getComponentsAPI();
      const content = res?.data ?? [];
      setComponents(Array.isArray(content) ? content : []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách linh kiện.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  function openCreateModal() {
    setModalMode("create");
    setEditingComponent(null);
    setForm({ name: "", description: "" });
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(component: Component) {
    setModalMode("edit");
    setEditingComponent(component);
    setForm({ name: component.name, description: component.description ?? "" });
    setFormError(null);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setForm({ name: "", description: "" });
    setFormError(null);
    setEditingComponent(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Tên linh kiện không được để trống.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (modalMode === "edit" && editingComponent) {
        await updateComponentAPI(editingComponent.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Cập nhật linh kiện thành công!");
      } else {
        await createComponentAPI({ name: form.name.trim(), description: form.description.trim() || undefined });
        toast.success("Tạo linh kiện thành công!");
      }
      handleCloseModal();
      fetchComponents();
    } catch (err: any) {
      setFormError(err.message || (modalMode === "edit" ? "Cập nhật thất bại." : "Tạo thất bại."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(component: Component) {
    if (!window.confirm(`Xóa linh kiện "${component.name}"?`)) return;
    setDeletingId(component.id);
    try {
      await deleteComponentAPI(component.id);
      toast.success(`Đã xóa linh kiện "${component.name}".`);
      fetchComponents();
    } catch (err: any) {
      toast.error(err.message || "Xóa linh kiện thất bại.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Linh Kiện</h1>
          <p className="mt-1 text-sm text-gray-500">Danh sách linh kiện xe đạp trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus size={15} /> Thêm linh kiện
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 w-fit">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Cpu size={20} className="text-blue-700" />
        </span>
        <div>
          <div className="text-xl font-bold text-gray-900">{components.length}</div>
          <div className="text-xs text-gray-500">Tổng linh kiện</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
            <p className="text-sm text-red-500">{error}</p>
            <button type="button" onClick={fetchComponents} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Tên linh kiện</th>
                <th className="px-5 py-3 font-medium">Mô tả</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.id} className="border-b border-gray-50 hover:bg-blue-50">
                  <td className="px-5 py-3 text-gray-400">#{component.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{component.name}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-gray-500">{component.description || "-"}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(component.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(component)}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(component)}
                        disabled={deletingId === component.id}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        title="Xóa linh kiện"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {components.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    Chưa có linh kiện nào
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
                {modalMode === "edit" ? "Chỉnh sửa linh kiện" : "Thêm linh kiện"}
              </h2>
              <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tên linh kiện <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                  placeholder="Nhập tên linh kiện"
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
                    : modalMode === "edit" ? "Lưu thay đổi" : "Tạo linh kiện"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
