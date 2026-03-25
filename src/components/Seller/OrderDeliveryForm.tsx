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
  { value: "GHN", label: "GHN (Giao Hàng Nhanh)" },
  { value: "GHTK", label: "GHTK (Giao Hàng Tiết Kiệm)" },
  { value: "VTP", label: "Viettel Post" },
  { value: "VNPOST", label: "VNPost (Bưu điện Việt Nam)" },
  { value: "JT", label: "J&T Express" },
  { value: "SPX", label: "Shopee Express (SPX)" },
  { value: "NV", label: "Ninja Van" },
  { value: "AHAMOVE", label: "AhaMove" },
  { value: "LALAMOVE", label: "Lalamove" },
  { value: "GRAB", label: "GrabExpress" },
  { value: "OTHER", label: "Khác" },
];

const TRACKING_HINTS: Record<string, string> = {
  GHN: "GHN + 8-13 ký tự số (VD: GHN12345678)",
  GHTK: "S + 8-20 ký tự số hoặc chuỗi phức tạp (VD: S12345678 hoặc S.MB.A.123456)",
  VTP: "VTP + 9-12 ký tự số (VD: VTP123456789)",
  VNPOST: "E/R + 9 ký tự số + VN (VD: E123456789VN)",
  JT: "JT + 8-12 ký tự số (VD: JT12345678)",
  SPX: "SPX + 8-15 ký tự chữ/số (VD: SPXVN123456)",
  NV: "NV + 8-13 ký tự số (VD: NV12345678)",
  AHAMOVE: "10-13 ký tự chữ/số (VD: AHA123456789)",
  LALAMOVE: "10-13 ký tự chữ/số (VD: LALA123456789)",
  GRAB: "10-13 ký tự chữ/số (VD: GRAB123456789)",
};

function validateTrackingCodeByCarrier(carrier: string, trackingCode: string): string | null {
  const normalizedCarrier = String(carrier || "").trim().toUpperCase();
  const normalizedCode = String(trackingCode || "").trim().toUpperCase();

  if (!normalizedCarrier || normalizedCarrier === "OTHER") {
    return null;
  }

  if (!normalizedCode) {
    return `Vui lòng nhập mã vận đơn cho ${normalizedCarrier}`;
  }

  const patterns: Record<string, RegExp> = {
    GHN: /^GHN[0-9]{8,13}$/,
    GHTK: /^[A-Z0-9\.]{8,25}$/,
    VTP: /^(VTP|VT)?[0-9]{9,12}$/,
    VNPOST: /^[A-Z]{1}[0-9]{9}VN$/,
    JT: /^(JT)?[0-9]{8,12}$/,
    SPX: /^SPX[A-Z0-9]{8,15}$/,
    NV: /^[A-Z]{2}[0-9]{8,13}$/,
    AHAMOVE: /^[A-Z0-9]{10,13}$/,
    LALAMOVE: /^[A-Z0-9]{10,13}$/,
    GRAB: /^[A-Z0-9]{10,13}$/,
  };

  const pattern = patterns[normalizedCarrier];
  if (!pattern) return null;

  if (!pattern.test(normalizedCode)) {
    return `Mã vận đơn không đúng định dạng của ${normalizedCarrier}. ${TRACKING_HINTS[normalizedCarrier] || ""}`;
  }

  return null;
}

export default function OrderDeliveryForm({
  isOpen,
  order,
  token,
  onClose,
  onSuccess,
}: OrderDeliveryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shippingCarrier: "",
    trackingCode: "",
    shippingNote: "",
  });

  useEffect(() => {
    if (isOpen) {
      setForm({ shippingCarrier: "", trackingCode: "", shippingNote: "" });
      setError("");
    }
  }, [isOpen]);

  const handleDeliver = async () => {
    if (!order) return;

    if (!form.shippingCarrier.trim()) {
      setError("Vui lòng chọn đơn vị vận chuyển");
      return;
    }

    const trackingError = validateTrackingCodeByCarrier(form.shippingCarrier, form.trackingCode);
    if (trackingError) {
      setError(trackingError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/orders/${order.id}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingCarrier: form.shippingCarrier,
          trackingCode: form.trackingCode || null,
          shippingNote: form.shippingNote || null,
        }),
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
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        maxWidth: 500,
        width: "90%",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16a34a",
            }}>
              <Truck size={20} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", margin: 0 }}>
              Đánh dấu đã giao hàng
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: loading ? "not-allowed" : "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Info */}
        <div style={{
          padding: "20px 24px",
          background: "#eff6ff",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
            <div>
              <p style={{ color: "#6b7280", marginBottom: 4, fontSize: 12 }}>Xe đạp</p>
              <p style={{ fontWeight: 600, color: "#1f2937" }}>{order.bikeTitle}</p>
            </div>
            <div>
              <p style={{ color: "#6b7280", marginBottom: 4, fontSize: 12 }}>Người mua</p>
              <p style={{ fontWeight: 600, color: "#1f2937" }}>{order.buyerName}</p>
            </div>
            <div>
              <p style={{ color: "#6b7280", marginBottom: 4, fontSize: 12 }}>Số tiền</p>
              <p style={{ fontWeight: 700, color: "#2563eb" }}>{fmtMoney(order.amountPoints)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "24px" }}>
          {/* Shipping Carrier */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: 8,
            }}>
              Đơn vị vận chuyển <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={form.shippingCarrier}
              onChange={(e) => setForm(p => ({ ...p, shippingCarrier: e.target.value }))}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "white",
                color: "#1f2937",
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              <option value="">-- Chọn đơn vị vận chuyển --</option>
              {SHIPPING_CARRIERS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Tracking Code */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: 8,
            }}>
              Mã vận đơn {form.shippingCarrier && form.shippingCarrier !== "OTHER" ? <span style={{ color: "#dc2626" }}>*</span> : <span style={{ color: "#9ca3af", fontWeight: 400 }}>(tuỳ chọn)</span>}
            </label>
            <input
              type="text"
              placeholder="VD: GHN12345678"
              value={form.trackingCode}
              onChange={(e) => setForm(p => ({ ...p, trackingCode: e.target.value }))}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "white",
                color: "#1f2937",
                fontSize: 14,
                opacity: loading ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
              {TRACKING_HINTS[form.shippingCarrier] || "Mã vận đơn để buyer theo dõi hàng"}
            </p>
          </div>

          {/* Shipping Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: 8,
            }}>
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              placeholder="VD: Giao vào buổi sáng, để trước cửa..."
              value={form.shippingNote}
              onChange={(e) => setForm(p => ({ ...p, shippingNote: e.target.value }))}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "white",
                color: "#1f2937",
                fontSize: 14,
                minHeight: 80,
                resize: "vertical",
                opacity: loading ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Info Message */}
          <div style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            display: "flex",
            gap: 10,
          }}>
            <AlertCircle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Sau khi giao hàng, buyer sẽ có 14 ngày để xác nhận nhận hàng. Tiền sẽ được giải phóng tự động nếu buyer không xác nhận.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          gap: 12,
          padding: "20px 24px",
          borderTop: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: "#e5e7eb",
              color: "#1f2937",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#d1d5db")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#e5e7eb")}
          >
            Hủy
          </button>
          <button
            onClick={() => void handleDeliver()}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              background: loading ? "#cbd5e1" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#15803d")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#16a34a")}
          >
            {loading ? (
              <>
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  animation: "spin 0.8s linear infinite",
                }} />
                Đang xử lý...
              </>
            ) : (
              <>
                <Truck size={16} />
                Đánh dấu đã giao
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
