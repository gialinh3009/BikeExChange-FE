import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Unlock,
  Plus,
  ClipboardCheck,
} from "lucide-react";
import {
  getAdminUsersAPI,
  deleteUserAPI,
  lockUserAPI,
  unlockUserAPI,
  createInspectorAPI,
} from "../../../services/adminUserService";


type UserRole = "ADMIN" | "SELLER" | "BUYER" | "INSPECTOR";
type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED" | "LOCKED" | "DELETED" | "UNVERIFIED";


interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: UserRole;
  rating: number;
  totalBikesSold: number;
  createdAt: string;
  isVerified: boolean;
  status: UserStatus;
  shopName: string | null;
  shopDescription: string | null;
}


const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị",
  SELLER: "Người bán",
  BUYER: "Người mua",
  INSPECTOR: "Kiểm định viên",
};


const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SELLER: "bg-blue-100 text-blue-700",
  BUYER: "bg-green-100 text-green-700",
  INSPECTOR: "bg-orange-100 text-orange-700",
};


const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  BANNED: "bg-red-100 text-red-600",
  LOCKED: "bg-yellow-100 text-yellow-700",
  DELETED: "bg-gray-200 text-gray-400",
  UNVERIFIED: "bg-blue-100 text-blue-600",
};


const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
  DELETED : "Đã xóa",
  INACTIVE: "Không hoạt động",
  BANNED: "Bị cấm",
  UNVERIFIED: "Chưa xác thực",
};


function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}


interface DetailModalProps {
  user: User;
  onClose: () => void;
}


function DetailModal({ user, onClose }: DetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Chi tiết người dùng
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg hover:bg-gray-100 p-1"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>


        <div className="space-y-3 text-sm">
          <Row label="ID" value={`#${user.id}`} />
          <Row label="Họ tên" value={user.fullName} />
          <Row label="Email" value={user.email} />
          <Row label="SĐT" value={user.phone} />
          <Row label="Địa chỉ" value={user.address} />
          <Row
            label="Vai trò"
            value={
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            }
          />
          <Row
            label="Trạng thái"
            value={
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-500"}`}
              >
                {STATUS_LABELS[user.status] ?? user.status}
              </span>
            }
          />
          <Row
            label="Xác thực"
            value={user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
          />
          <Row label="Đánh giá" value={`${user.rating} ⭐`} />
          {user.role === "SELLER" && (
            <>
              <Row label="Tên shop" value={user.shopName ?? "—"} />
              <Row label="Bikes đã bán" value={`${user.totalBikesSold}`} />
            </>
          )}
          <Row label="Ngày tham gia" value={fmtDate(user.createdAt)} />
        </div>
      </div>
    </div>
  );
}


function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-32 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}


// ─── Create Inspector Modal ───────────────────────────────────────────────────


interface CreateInspectorForm {
  email: string; password: string; fullName: string; phone: string; address: string;
}


function CreateInspectorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateInspectorForm>({ email: "", password: "", fullName: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  const set = (k: keyof CreateInspectorForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) { setErr("Vui lòng điền đầy đủ thông tin bắt buộc."); return; }
    setSubmitting(true); setErr(null);
    try {
      await createInspectorAPI(form);
      onSuccess();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSubmitting(false); }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-blue-700" /> Tạo tài khoản kiểm định viên
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {[
            { k: "fullName", label: "Họ tên *", placeholder: "Nguyễn Văn A" },
            { k: "email",    label: "Email *",  placeholder: "inspector@gmail.com", type: "email" },
            { k: "password", label: "Mật khẩu *", placeholder: "Password123!", type: "password" },
            { k: "phone",    label: "SĐT",      placeholder: "0987654321" },
            { k: "address",  label: "Địa chỉ",  placeholder: "123 Lê Lợi, Q1, HCM" },
          ].map(({ k, label, placeholder, type }) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type ?? "text"}
                value={form[k as keyof CreateInspectorForm]}
                onChange={set(k as keyof CreateInspectorForm)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ))}
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {submitting ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Lock Modal ───────────────────────────────────────────────────────────────


function LockModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setErr("Vui lòng nhập lý do khóa."); return; }
    setSubmitting(true); setErr(null);
    try {
      await lockUserAPI(user.id, reason.trim());
      onSuccess();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSubmitting(false); }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Lock size={16} className="text-red-500" /> Khóa tài khoản
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">Khóa tài khoản <span className="font-semibold">{user.fullName}</span>?</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lý do khóa *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {submitting ? "Đang khóa..." : "Xác nhận khóa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function ManagerUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);


  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [lockUser, setLockUser] = useState<User | null>(null);
  const [showCreateInspector, setShowCreateInspector] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);


  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsersAPI({
        page,
        size: 10,
        keyword: search,
        role: roleFilter,
        status: statusFilter,
      });
      // Support both paginated and array responses
      if (Array.isArray(data.data)) {
        setUsers(data.data);
        setTotalElements(data.data.length);
        setTotalPages(1);
      } else {
        setUsers(data.data.content ?? data.data);
        setTotalPages(data.data.totalPages ?? 1);
        setTotalElements(data.data.totalElements ?? 0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);


  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, roleFilter, statusFilter]);


  const handleUnlock = async (user: User) => {
    setActionLoading(user.id);
    try {
      await unlockUserAPI(user.id);
      showToast(`Đã mở khóa tài khoản "${user.fullName}".`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };


  const handleDelete = async (user: User) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${user.fullName}"?`)) return;
    setActionLoading(user.id);
    try {
      await deleteUserAPI(user.id);
      showToast("Đã xóa người dùng.");
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };


  const stats = [
    { label: "Tổng người dùng", value: totalElements, icon: Users },
    {
      label: "Đang hoạt động",
      value: users.filter((u) => u.status === "ACTIVE").length,
      icon: UserCheck,
    },
    {
      label: "Đã xác thực",
      value: users.filter((u) => u.isVerified).length,
      icon: ShieldCheck,
    },
  ];


  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}


      {/* Modals */}
      {detailUser && <DetailModal user={detailUser} onClose={() => setDetailUser(null)} />}
      {lockUser && (
        <LockModal
          user={lockUser}
          onClose={() => setLockUser(null)}
          onSuccess={() => { showToast(`Đã khóa tài khoản "${lockUser.fullName}".`); fetchUsers(); }}
        />
      )}
      {showCreateInspector && (
        <CreateInspectorModal
          onClose={() => setShowCreateInspector(false)}
          onSuccess={() => showToast("Tạo tài khoản kiểm định viên thành công!")}
        />
      )}


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách tất cả người dùng trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateInspector(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Plus size={15} /> Tạo kiểm định viên
          </button>
          <button
            type="button"
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-blue-50"
          >
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-3"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Icon size={20} className="text-blue-700" />
            </span>
            <div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 w-full max-w-xs focus-within:border-blue-400 transition">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 outline-none text-sm placeholder:text-gray-400 bg-transparent"
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 transition"
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Quản trị</option>
          <option value="SELLER">Người bán</option>
          <option value="BUYER">Người mua</option>
          <option value="INSPECTOR">Kiểm định viên</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 transition"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="BANNED">Bị cấm</option>
        </select>
      </div>


      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Đang tải...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="text-sm text-gray-600 underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left bg-gray-50">
                <th className="px-5 py-3 font-semibold">Người dùng</th>
                <th className="px-5 py-3 font-semibold">SĐT</th>
                <th className="px-5 py-3 font-semibold">Vai trò</th>
                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                <th className="px-5 py-3 font-semibold">Xác thực</th>
                <th className="px-5 py-3 font-semibold">Ngày tham gia</th>
                <th className="px-5 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-blue-100/40 transition"
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-gray-900 text-sm">{user.fullName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{user.phone}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {STATUS_LABELS[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.isVerified ? (
                      <span className="text-emerald-600 text-xs font-semibold">Đã xác thực</span>
                    ) : (
                      <span className="text-gray-400 text-xs font-semibold">Chưa</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-medium">
                    {fmtDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <div className="inline-flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setDetailUser(user)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus:bg-blue-100 transition outline-none"
                          style={{ borderRight: user.role !== "ADMIN" ? '1px solid #e5e7eb' : undefined }}
                        >
                          <Users size={13} className="mr-1" /> Chi tiết
                        </button>
                        {user.role !== "ADMIN" && (
                          <>
                            {user.status !== "LOCKED" && (
                              <button
                                type="button"
                                disabled={actionLoading === user.id}
                                onClick={() => setLockUser(user)}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 focus:bg-red-100 transition outline-none disabled:opacity-50"
                                style={{ borderRight: user.status === "LOCKED" ? undefined : '1px solid #e5e7eb' }}
                              >
                                <Lock size={13} className="mr-1" /> Khóa
                              </button>
                            )}
                            {user.status === "LOCKED" && (
                              <button
                                type="button"
                                disabled={actionLoading === user.id}
                                onClick={() => handleUnlock(user)}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus:bg-emerald-100 transition outline-none disabled:opacity-50"
                              >
                                <Unlock size={13} className="mr-1" /> Mở khóa
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    Không tìm thấy người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
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
      )}
    </div>
  );
}



