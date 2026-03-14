import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Tag,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  listCategoriesAPI as getCategoriesAPI,
  createCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI,
} from "../../../services/categoryService";

interface Category {
  id: number;
  name: string;
  description: string;
  imgUrl: string;
  createdAt: string;
}

type FormData = Omit<Category, "id" | "createdAt">;

const EMPTY_FORM: FormData = { name: "", description: "", imgUrl: "" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

interface CategoryModalProps {
  initial?: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

function CategoryTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="border-b border-gray-100 px-5 py-3">
        <div className="grid grid-cols-[80px_110px_minmax(180px,1.5fr)_minmax(220px,2fr)_140px_140px] gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-gray-200" />
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[80px_110px_minmax(180px,1.5fr)_minmax(220px,2fr)_140px_140px] items-center gap-4 px-5 py-3"
          >
            <div className="h-4 w-12 rounded bg-gray-100" />
            <div className="h-10 w-10 rounded-lg bg-gray-100" />
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="flex gap-2">
              <div className="h-4 w-10 rounded bg-gray-100" />
              <div className="h-4 w-10 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryModal({ initial, onClose, onSaved }: CategoryModalProps) {
  const [form, setForm] = useState<FormData>(
    initial ? { name: initial.name, description: initial.description, imgUrl: initial.imgUrl }
            : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Tên danh mục không được để trống."); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, createdAt: new Date().toISOString() };
      if (initial) {
        await updateCategoryAPI(initial.id, payload);
      } else {
        await createCategoryAPI(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {initial ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg hover:bg-blue-50 p-1">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="Nhập tên danh mục"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
              placeholder="Nhập mô tả"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              placeholder="https://..."
              value={form.imgUrl}
              onChange={(e) => setForm((f) => ({ ...f, imgUrl: e.target.value }))}
            />
            {form.imgUrl && (
              <img
                src={form.imgUrl}
                alt="preview"
                className="mt-2 h-20 w-20 rounded-xl object-cover border border-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-blue-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-700 text-white px-4 py-2 text-sm hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : initial ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategoriesAPI({ page, size: pageSize });
      const content = data?.data?.content ?? data?.content ?? data?.data ?? [];
      setCategories(Array.isArray(content) ? content : []);
      setTotalPages(data?.data?.totalPages ?? data?.totalPages ?? 1);
      setTotalElements(data?.data?.totalElements ?? data?.totalElements ?? content.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setPage(0); }, [search, pageSize]);

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
    setActionLoading(cat.id);
    try {
      await deleteCategoryAPI(cat.id);
      toast.success("Đã xóa danh mục.");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setModalOpen(true); };

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  return (
    <div className="space-y-6">
      {/* Modal */}
      {modalOpen && (
        <CategoryModal
          initial={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => { fetchCategories(); toast.success(editTarget ? "Đã cập nhật danh mục." : "Đã thêm danh mục mới."); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Danh Mục</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách tất cả danh mục xe trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-blue-50"
          >
            <RefreshCw size={14} /> Làm mới
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 text-sm font-medium hover:bg-blue-800"
          >
            <Plus size={14} /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Tag size={20} className="text-blue-700" />
          </span>
          <div>
            {loading ? (
              <>
                <div className="h-6 w-14 rounded bg-gray-200 animate-pulse" />
                <div className="mt-2 h-3 w-24 rounded bg-gray-100 animate-pulse" />
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-gray-900">{totalElements}</div>
                <div className="text-xs text-gray-500">Tổng danh mục</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 w-full max-w-xs">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          className="flex-1 outline-none text-sm placeholder:text-gray-400"
          placeholder="Tìm tên, mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        {loading ? (
          <CategoryTableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-red-500 text-sm">{error}</p>
            <button type="button" onClick={fetchCategories} className="text-sm text-gray-600 underline">
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium w-14">ID</th>
                <th className="px-5 py-3 font-medium">Hình ảnh</th>
                <th className="px-5 py-3 font-medium">Tên danh mục</th>
                <th className="px-5 py-3 font-medium">Mô tả</th>
                <th className="px-5 py-3 font-medium">Ngày tạo</th>
                <th className="px-5 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-50 hover:bg-blue-50">
                  <td className="px-5 py-3 text-gray-400">#{cat.id}</td>
                  <td className="px-5 py-3">
                    {cat.imgUrl ? (
                      <img
                        src={cat.imgUrl}
                        alt={cat.name}
                        className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Tag size={16} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                    {cat.description || "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{fmtDate(cat.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                      >
                        <Pencil size={12} /> Sửa
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === cat.id}
                        onClick={() => handleDelete(cat)}
                        className="inline-flex items-center gap-1 text-red-500 hover:underline text-xs disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    Không tìm thấy danh mục nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>/ {totalElements} danh mục</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Trang {page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-blue-50 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Trước
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-blue-50 disabled:opacity-40"
          >
            Sau <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
