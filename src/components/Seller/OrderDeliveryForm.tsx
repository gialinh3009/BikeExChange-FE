import { useState, useEffect } from "react";
import { X, Truck, AlertCircle } from "lucide-react";
import { BASE_URL } from "../../config/apiConfig";

interface SellerOrder {
  id: number;
  bikeTitle: string;
  buyerName: string;
  amountPoints: number;
  status: string;
  createdAt: string;
}

interface OrderDeliveryFormProps {
  isOpen: boolean;
  order: SellerOrder | null;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const SHIPPING_CARRIERS = [
  { value: "GHN", label: "Giao Hàng Nhanh (GHN)" },
  { value: "GHTK", label: "Giao Hàng Tiết Kiệm (GHTK)" },
  { value: "VTP", label: "Viettel Post (VTP)" },
  { value: "J&T", label: "J&T Express" },
  { value: "OTHER", label: "Khác" },
];

export default function OrderDeliveryForm({ isOpen, order, token, onClose, onSuccess }: OrderDeliveryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ shippingCarrier: "", trackingCode: "", shippingNote: "" });

  useEffect(() => {
    if (isOpen) {
      setForm({ shippingCarrier: "", trackingCode: "", shippingNote: "" });
      setError("");
    }
  }, [isOpen]);

  const handleDeliver = async () => {
    if (!order) return;
    if (!form.shippingCarrier.trim()) { setError("Vui lòng chọn đơn vị vận chuyển"); return; }
    if (!form.trackingCode.trim()) { setError("Vui lòng nhập mã vận đơn"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/orders/${order.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shippingCarrier: form.shippingCarrier, trackingCode: form.trackingCode, shippingNote: form.shippingNote || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đánh dấu giao hàng thất bại");
      onSuccess();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #e8ecf4", padding: 28, maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}><Truck size={20} /></div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>Đánh dấu đã giao hàng</h2>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: "none", border: "none", color: "#94a3b8", cursor: loading ? "not-allowed" : "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.5 : 1 }}><X size={20} /></button>
        </div>

        <div style={{ background: "#f8faff", borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
            <div><p style={{ color: "#94a3b8", marginBottom: 4 }}>Xe đạp</p><p style={{ fontWeight: 700, color: "#0f172a" }}>{order.bikeTitle}</p></div>
            <div><p style={{ color: "#94a3b8", marginBottom: 4 }}>Người mua</p><p style={{ fontWeight: 700, color: "#0f172a" }}>{order.buyerName}</p></div>
            <div><p style={{ color: "#94a3b8", marginBottom: 4 }}>Số tiền</p><p style={{ fontWeight: 700, color: "#2563eb" }}>{fmtMoney(order.amountPoints)}</p></div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Đơn vị vận chuyển <span style={{ color: "#ef4444" }}>*</span></label>
            <select value={form.shippingCarrier} onChange={(e) => setForm(p => ({ ...p, shippingCarrier: e.target.value }))} disabled={loading} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e8ecf4", borderRadius: 8, background: "white", color: "#0f172a", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", fontSize: 13 }}>
              <option value="">-- Chọn đơn vị vận chuyển --</option>
              {SHIPPING_CARRIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Mã vận đơn <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" placeholder="VD: 123456789" value={form.trackingCode} onChange={(e) => setForm(p => ({ ...p, trackingCode: e.target.value }))} disabled={loading} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e8ecf4", borderRadius: 8, background: "white", color: "#0f172a", opacity: loading ? 0.6 : 1, fontFamily: "inherit", fontSize: 13 }} />
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Mã vận đơn để buyer theo dõi hàng</p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Ghi chú (tuỳ chọn)</label>
            <textarea placeholder="VD: Giao vào buổi sáng, để trước cửa..." value={form.shippingNote} onChange={(e) => setForm(p => ({ ...p, shippingNote: e.target.value }))} disabled={loading} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e8ecf4", borderRadius: 8, background: "white", color: "#0f172a", fontFamily: "inherit", fontSize: 13, minHeight: 80, resize: "vertical", opacity: loading ? 0.6 : 1 }} />
          </div>
        </div>

        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: 12, marginBottom: 20, display: "flex", gap: 10 }}>
          <AlertCircle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.5 }}>Sau khi giao hàng, buyer sẽ có 14 ngày để xác nhận nhận hàng. Tiền sẽ được giải phóng tự động nếu buyer không xác nhận.</p>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, marginBottom: 20 }}><p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p></div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: "12px 16px", background: "#f1f5f9", color: "#0f172a", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>Hủy</button>
          <button onClick={() => void handleDeliver()} disabled={loading} style={{ flex: 1, padding: "12px 16px", background: loading ? "#cbd5e1" : "#10b981", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .8s linear infinite" }} />
              Đang xử lý...
            </> : <>
              <Truck size={16} />
              Đánh dấu đã giao
            </>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
