import { useState, useEffect } from "react";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";
import {
  listInspectionsAPI,
  getInspectionDetailAPI,
} from "../../services/Seller/sellerBikeService";

export default function SellerInspections({ token, userId }: { token: string; userId: number }) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        const data = await listInspectionsAPI(userId, token);
        setInspections(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải danh sách kiểm định");
      } finally {
        setLoading(false);
      }
    };
    if (userId && token) fetchInspections();
  }, [userId, token]);

  const handleViewReport = async (inspectionId: number) => {
    try {
      setReportLoading(true);
      const report = await getInspectionDetailAPI(inspectionId, token);
      setSelectedInspection(report);
    } catch (err: any) {
      alert(err.message || "Lỗi khi tải báo cáo");
    } finally {
      setReportLoading(false);
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
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedInspection ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => setSelectedInspection(null)}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Quay lại
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi Tiết Kiểm Định</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Trạng thái</p>
              <p className="font-medium text-gray-900">{selectedInspection.status || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày kiểm định</p>
              <p className="font-medium text-gray-900">
                {selectedInspection.inspectionDate
                  ? new Date(selectedInspection.inspectionDate).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ghi chú</p>
              <p className="font-medium text-gray-900">{selectedInspection.notes || "Không có"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Chưa có yêu cầu kiểm định nào</p>
            </div>
          ) : (
            inspections.map((inspection) => (
              <div key={inspection.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Kiểm Định #{inspection.id}</h3>
                    <p className="text-sm text-gray-600">Xe: {inspection.bikeName}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      inspection.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : inspection.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : inspection.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {inspection.status === "APPROVED"
                      ? "Đã duyệt"
                      : inspection.status === "PENDING"
                        ? "Chờ xử lý"
                        : inspection.status === "REJECTED"
                          ? "Bị từ chối"
                          : inspection.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Ngày yêu cầu</p>
                    <p className="font-medium text-gray-900">
                      {inspection.requestDate
                        ? new Date(inspection.requestDate).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Ngày kiểm định</p>
                    <p className="font-medium text-gray-900">
                      {inspection.inspectionDate
                        ? new Date(inspection.inspectionDate).toLocaleDateString("vi-VN")
                        : "Chưa xác định"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewReport(inspection.id)}
                  disabled={reportLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {reportLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Xem Chi Tiết
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
