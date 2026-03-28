import { useEffect, useState } from "react";
import { getInspectionDetailAPI } from "../../services/inspectionService";

export default function InspectorInspectionDetail({ inspectionId, token, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    getInspectionDetailAPI(inspectionId, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [inspectionId, token]);

  if (loading) return <div>Đang tải chi tiết kiểm định...</div>;
  if (error) return <div style={{ color: "red" }}>Lỗi: {error}</div>;
  if (!data) return <div>Không có dữ liệu kiểm định.</div>;

  const { inspection, report, history } = data;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <h2>Chi tiết kiểm định #{inspectionId}</h2>
      <button onClick={onClose} style={{ float: "right", marginTop: -32, marginRight: -16, fontSize: 18 }}>✕</button>
      <h3>Thông tin kiểm định</h3>
      <ul>
        <li>Xe: {inspection?.bikeTitle || inspection?.bike?.title}</li>
        <li>Trạng thái: {inspection?.status}</li>
        <li>Ngày tạo: {inspection?.createdAt && new Date(inspection.createdAt).toLocaleString()}</li>
        <li>Người kiểm định: {inspection?.inspectorName || inspection?.inspector?.fullName}</li>
      </ul>
      <h3>Báo cáo kiểm định</h3>
      {report ? (
        <div>
          <div>Điểm tổng thể: <b>{report.overallScore}/10</b></div>
          <div>Nhận xét: {report.comments}</div>
          <div>Hình ảnh:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {report.medias?.filter(m => m.type === "IMAGE").map((m, i) => (
              <img key={i} src={m.url} alt="Ảnh kiểm định" style={{ width: 120, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      ) : <div>Chưa có báo cáo kiểm định.</div>}
      <h3>Lịch sử trạng thái</h3>
      <ul>
        {history?.map((h, i) => (
          <li key={i}>{h.status} - {h.timestamp && new Date(h.timestamp).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}
