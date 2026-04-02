import { useCallback, useEffect, useState } from "react";
import {
  Bike,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Eye,
  ImageOff,
  Trash2,
} from "lucide-react";
import { getBikesAPI, getBikeDetailAPI, deleteBikeAPI } from "../../../services/Admin/bikeManagerService";


interface BikeMedia {
  url: string;
  type: string;
  sortOrder: number;
}


interface BikeItem {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  year: number;
  pricePoints: number;
  mileage: number;
  condition: string;
  bikeType: string;
  location: string;
  status: string;
  inspectionStatus: string;
  sellerId: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  media: BikeMedia[];
}


const STATUS_CLS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-green-100 text-green-700",
  SOLD: "bg-indigo-100 text-indigo-700",
  INACTIVE: "bg-rose-100 text-rose-600",
  PENDING: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-zinc-200 text-zinc-600",
  VERIFIED: "bg-teal-100 text-teal-700",
};


const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang bán",
  SOLD: "Đã bán",
  INACTIVE: "Ẩn",
  PENDING: "Chờ duyệt",
  CANCELLED: "Đã hủy",
  VERIFIED: "Đã xác thực",
};


const INSPECT_CLS: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  INSPECTED: "bg-purple-100 text-purple-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};


const INSPECT_LABELS: Record<string, string> = {
  REQUESTED: "Yêu cầu KĐ",
  ASSIGNED: "Đã phân công",
  INSPECTED: "Đã kiểm định",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  NONE: "Chưa KĐ",
};


const CONDITION_LABELS: Record<string, string> = {
  NEW: "Mới",
  LIKE_NEW: "Như mới",
  GOOD: "Tốt",
  FAIR: "Khá",
  POOR: "Kém",
};


const BIKE_TYPE_LABELS: Record<string, string> = {
  HYBRID: "Hybrid",
  ROAD: "Đường trường",
  MOUNTAIN: "Địa hình",
  CITY: "Thành phố",
  BMX: "BMX",
  ELECTRIC: "Điện",
};


const STATUS_FILTER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "DRAFT", label: "Nháp" },
  { key: "ACTIVE", label: "Đang bán" },
  { key: "SOLD", label: "Đã bán" },
  { key: "INACTIVE", label: "Ẩn" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "VERIFIED", label: "Đã xác thực" }
];


function formatDate(val: string) {
  return new Date(val).toLocaleDateString("vi-VN");
}


function formatPoints(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}


export default function ManagerBike() {
  const [bikes, setBikes] = useState<BikeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);


  const [detail, setDetail] = useState<BikeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirmBike, setConfirmBike] = useState<BikeItem | null>(null);


  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };


  const handleDeleteConfirmed = async () => {
    if (!confirmBike) return;
    const bike = confirmBike;
    setConfirmBike(null);
    setDeleteLoading(bike.id);
    try {
      await deleteBikeAPI(bike.id);
      showToast("success", `Đã xóa xe "${bike.title}".`);
      fetchBikes();
    } catch (err: any) {
      showToast("error", err.message || "Xóa xe thất bại.");
    } finally {
      setDeleteLoading(null);
    }
  };


  const fetchBikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBikesAPI({ page, size: 20 });
      const content = res?.data;
      if (Array.isArray(content)) {
        setBikes(content);
        setTotalElements(content.length);
        setTotalPages(1);
      } else {
        setBikes(content?.content ?? []);
        setTotalPages(content?.totalPages ?? 0);
        setTotalElements(content?.totalElements ?? 0);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [page]);


  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);


  async function openDetail(id: number) {
    setShowDetail(true);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await getBikeDetailAPI(id);
      setDetail(res.data);
    } catch (err: any) {
      setDetailError(err.message || "Không thể tải chi tiết xe đạp.");
    } finally {
      setDetailLoading(false);
    }
  }


  const filtered = bikes.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.brand.toLowerCase().includes(search.toLowerCase()) ||
      b.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });


  const firstImage = (media: BikeMedia[]) =>
    media?.find((m) => m.type === "IMAGE")?.url ?? null;


  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bike size={22} className="text-blue-700" />
            Quản Lý Xe Đạp
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách xe đạp đăng bán trong hệ thống</p>
        </div>
        <button
          onClick={() => fetchBikes()}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>


      {/* Summary card */}
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 w-fit">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Bike size={20} className="text-blue-700" />
        </span>
        <div>
          <div className="text-xl font-bold text-gray-900">{totalElements}</div>
          <div className="text-xs text-gray-500">Tổng xe đạp</div>
        </div>
      </div>


      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                statusFilter === tab.key
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {/* Search */}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, hãng, model..."
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-white w-64"
          />
        </div>
      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-blue-600">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Đang tải dữ liệu...</span>
          </div>
        )}


        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchBikes} className="text-xs text-blue-600 hover:underline mt-1">Thử lại</button>
          </div>
        )}


        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <Bike size={32} />
            <p className="text-sm">Không có xe đạp nào</p>
          </div>
        )}


        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 bg-gray-50">
                  <th className="px-5 py-3 font-medium">Xe đạp</th>
                  <th className="px-5 py-3 font-medium">Thương hiệu</th>
                  <th className="px-5 py-3 font-medium">Loại / Năm</th>
                  <th className="px-5 py-3 font-medium">Giá (VNĐ)</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Kiểm định</th>
                  <th className="px-5 py-3 font-medium">Ngày tạo</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((bike) => {
                  const img = firstImage(bike.media);
                  return (
                    <tr key={bike.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={bike.title}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <ImageOff size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{bike.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">#{bike.id} · {bike.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{bike.brand}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <div>{BIKE_TYPE_LABELS[bike.bikeType] ?? bike.bikeType}</div>
                        <div className="text-xs text-gray-400">{bike.year}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{formatPoints(bike.pricePoints)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[bike.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABELS[bike.status] ?? bike.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {bike.inspectionStatus ? (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${INSPECT_CLS[bike.inspectionStatus] ?? "bg-gray-100 text-gray-500"}`}>
                            {INSPECT_LABELS[bike.inspectionStatus] ?? bike.inspectionStatus}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(bike.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetail(bike.id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={12} />
                            Chi tiết
                          </button>
                          <button
                            onClick={() => setConfirmBike(bike)}
                            disabled={deleteLoading === bike.id}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Trang {page + 1} / {totalPages} · {totalElements} xe đạp
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Confirm Delete Modal */}
      {confirmBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Trash2 size={20} className="text-red-600" />
              </span>
              <div>
                <p className="text-base font-bold text-gray-900">Xác nhận xóa xe</p>
                <p className="text-xs text-gray-500 mt-0.5">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Bạn có chắc chắn muốn xóa xe{" "}
              <span className="font-semibold text-gray-900">"{confirmBike.title}"</span> không?
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmBike(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-medium text-white transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bike size={18} className="text-blue-700" />
                Chi tiết xe đạp
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>


            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {detailLoading && (
                <div className="flex items-center justify-center py-16 gap-2 text-blue-600">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              )}


              {detailError && (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
                  <AlertCircle size={28} />
                  <p className="text-sm">{detailError}</p>
                </div>
              )}


              {!detailLoading && !detailError && detail && (
                <div className="space-y-5">
                  {/* Images */}
                  {detail.media?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {detail.media.map((m, i) => (
                        <img
                          key={i}
                          src={m.url}
                          alt={detail.title}
                          className="h-40 w-60 object-cover rounded-xl border border-gray-100 shrink-0"
                        />
                      ))}
                    </div>
                  )}


                  {/* Title + badges */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{detail.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[detail.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[detail.status] ?? detail.status}
                      </span>
                      {detail.inspectionStatus && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${INSPECT_CLS[detail.inspectionStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {INSPECT_LABELS[detail.inspectionStatus] ?? detail.inspectionStatus}
                        </span>
                      )}
                    </div>
                  </div>


                  {/* Description */}
                  {detail.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{detail.description}</p>
                  )}


                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Thương hiệu", value: detail.brand },
                      { label: "Model", value: detail.model },
                      { label: "Năm sản xuất", value: detail.year },
                      { label: "Loại xe", value: BIKE_TYPE_LABELS[detail.bikeType] ?? detail.bikeType },
                      { label: "Tình trạng", value: CONDITION_LABELS[detail.condition] ?? detail.condition },
                      { label: "Số km đã đi", value: `${detail.mileage} km` },
                      { label: "Giá (VNĐ)", value: formatPoints(detail.pricePoints) },
                      { label: "Lượt xem", value: detail.views },
                      { label: "Vị trí", value: detail.location },
                      { label: "Người bán (ID)", value: `#${detail.sellerId}` },
                      { label: "Ngày tạo", value: formatDate(detail.createdAt) },
                      { label: "Cập nhật", value: formatDate(detail.updatedAt) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


