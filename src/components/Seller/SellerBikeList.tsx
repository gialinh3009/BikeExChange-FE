import { useState, useEffect } from "react";
import { Trash2, Edit2, Loader, AlertCircle } from "lucide-react";
import { listSellerBikesAPI, deleteSellerBikeAPI } from "../../services/Seller/sellerBikeService";

export default function SellerBikeList({ token, userId }: { token: string; userId: number }) {
  const [bikes, setBikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setLoading(true);
        const data = await listSellerBikesAPI({}, token);
        const bikeList = data?.content || data?.data?.content || (Array.isArray(data) ? data : []);
        // Sắp xếp theo thời gian tạo gần nhất (mới nhất trước)
        const sortedBikes = bikeList.sort((a: any, b: any) => {
          if (a.createdAt && b.createdAt) {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          }
          return (b.id || 0) - (a.id || 0);
        });
        setBikes(sortedBikes);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải danh sách xe");
      } finally {
        setLoading(false);
      }
    };
    if (userId && token) fetchBikes();
  }, [userId, token]);

  const handleDelete = async (bikeId: number) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa xe này?")) return;
    try {
      setDeleting(bikeId);
      await deleteSellerBikeAPI(bikeId, token);
      setBikes(bikes.filter((b) => b.id !== bikeId));
    } catch (err: any) {
      alert(err.message || "Xóa xe thất bại");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Lỗi</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Tính thống kê
  const totalBikes = bikes.length;
  const activeBikes = bikes.filter((b) => b.status === "ACTIVE" || b.status === "PENDING").length;
  const soldBikes = bikes.filter((b) => b.status === "RESERVED" || b.status === "SOLD").length;
  const hiddenBikes = bikes.filter((b) => b.status === "CANCELLED" || b.status === "HIDDEN" || b.status === "INACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Tổng xe</p>
          <p className="text-3xl font-bold text-gray-900">{totalBikes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Xe đang bán</p>
          <p className="text-3xl font-bold text-green-600">{activeBikes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Xe đã bán</p>
          <p className="text-3xl font-bold text-blue-600">{soldBikes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Xe bị ẩn</p>
          <p className="text-3xl font-bold text-gray-600">{hiddenBikes}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh Sách Xe Của Tôi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tên Xe</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Giá (Điểm)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Danh Mục</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trạng Thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Năm</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Thời Gian Tạo</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bikes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                    Chưa có xe nào. Hãy tạo xe mới!
                  </td>
                </tr>
              ) : (
                bikes.map((bike) => (
                  <tr key={bike.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {bike.media && bike.media[0] && (
                          <img
                            src={bike.media[0].url || bike.media[0]}
                            alt={bike.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{bike.title || bike.name}</p>
                          <p className="text-xs text-gray-500">ID: {bike.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{(bike.pricePoints || bike.price)?.toLocaleString("vi-VN")} đ</td>
                    <td className="px-6 py-4 text-gray-600">{bike.bikeType || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bike.status === "ACTIVE" || bike.status === "PENDING"
                            ? "bg-green-100 text-green-800"
                            : bike.status === "RESERVED" || bike.status === "SOLD"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {bike.status === "ACTIVE" || bike.status === "PENDING"
                          ? "Đang bán"
                          : bike.status === "RESERVED" || bike.status === "SOLD"
                            ? "Đã bán"
                            : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{bike.year || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {bike.createdAt ? new Date(bike.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(bike.id)}
                          disabled={deleting === bike.id}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          {deleting === bike.id ? (
                            <Loader className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
