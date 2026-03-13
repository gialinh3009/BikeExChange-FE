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
} from "lucide-react";
import {
  getAdminUsersAPI,
  updateUserStatusAPI,
  deleteUserAPI,
} from "../../../services/adminUserService";

type UserRole = "ADMIN" | "SELLER" | "BUYER" | "INSPECTOR";
type UserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

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
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Không hoạt động",
  BANNED: "Bị cấm",
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

  const handleToggleStatus = async (user: User) => {
    const next: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(user.id);
    try {
      await updateUserStatusAPI(user.id, next);
      showToast(
        `Đã ${next === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} người dùng.`,
      );
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

      {/* Detail modal */}
      {detailUser && (
        <DetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản Lý Người Dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách tất cả người dùng trong hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-blue-50"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
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
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 w-full max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 outline-none text-sm placeholder:text-gray-400"
            placeholder="Tìm tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
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
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="BANNED">Bị cấm</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
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
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">Người dùng</th>
                <th className="px-5 py-3 font-medium">SĐT</th>
                <th className="px-5 py-3 font-medium">Vai trò</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Xác thực</th>
                <th className="px-5 py-3 font-medium">Ngày tham gia</th>
                <th className="px-5 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-blue-50"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">
                      {user.fullName}
                    </div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{user.phone}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {STATUS_LABELS[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.isVerified ? (
                      <span className="text-emerald-600 text-xs font-medium">
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Chưa</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {fmtDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailUser(user)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Chi tiết
                      </button>
                      {user.role !== "ADMIN" && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === user.id}
                            onClick={() => handleToggleStatus(user)}
                            className={`text-xs hover:underline ${user.status === "ACTIVE" ? "text-amber-600" : "text-emerald-600"} disabled:opacity-50`}
                          >
                            {user.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === user.id}
                            onClick={() => handleDelete(user)}
                            className="text-red-500 hover:underline text-xs disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </>
                      )}
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