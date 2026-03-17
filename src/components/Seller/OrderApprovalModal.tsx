/**
 * OrderApprovalModal.tsx
 * 
 * Modal for seller to approve/accept an ESCROWED order
 * Calls: POST /orders/{id}/accept
 */

import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { BASE_URL } from "../../config/apiConfig";

interface SellerOrder {
  id: number;
  bikeTitle: string;
  buyerName: string;
  amountPoints: number;
  status: string;
  createdAt: string;
}

interface OrderApprovalModalProps {
  isOpen: boolean;
  order: SellerOrder | null;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function OrderApprovalModal({
  isOpen,
  order,
  token,
  onClose,
  onSuccess,
}: OrderApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!order) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/orders/${order.id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xác nhận đơn thất bại");
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
      background: "rgba(0,0,0,.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .modal-content { animation: slideUp .3s ease; }
      `}</style>

      <div
        className="modal-content"
        style={{
          background: "white",
          borderRadius: 18,
          border: "1.5px solid #e8ecf4",
          padding: 28,
          maxWidth: 420,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <CheckCircle size={20} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>Xác nhận nhận đơn</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
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

        {/* Order info */}
        <div style={{ background: "#f8faff", borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
            <div>
              <p style={{ color: "#94a3b8", marginBottom: 4 }}>Xe đạp</p>
              <p style={{ fontWeight: 700, color: "#0f172a" }}>{order.bikeTitle}</p>
            </div>
            <div>
              <p style={{ color: "#94a3b8", marginBottom: 4 }}>Người mua</p>
              <p style={{ fontWeight: 700, color: "#0f172a" }}>{order.buyerName}</p>
            </div>
            <div>
              <p style={{ color: "#94a3b8", marginBottom: 4 }}>Số tiền</p>
              <p style={{ fontWeight: 700, color: "#2563eb" }}>{fmtMoney(order.amountPoints)}</p>
            </div>
            <div>
              <p style={{ color: "#94a3b8", marginBottom: 4 }}>Ngày tạo</p>
              <p style={{ fontWeight: 600, color: "#0f172a" }}>{fmtDateTime(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Info message */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12, marginBottom: 20, display: "flex", gap: 10 }}>
          <AlertCircle size={16} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#047857", margin: 0, lineHeight: 1.5 }}>
            Khi xác nhận, bạn cam kết sẽ giao hàng cho buyer. Tiền sẽ được giữ trong tài khoản cho đến khi buyer xác nhận nhận hàng.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#f1f5f9",
              color: "#0f172a",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all .2s",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#f1f5f9")}
          >
            Hủy
          </button>
          <button
            onClick={() => void handleApprove()}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: loading ? "#cbd5e1" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all .2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "#2563eb")}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", animation: "spin .8s linear infinite" }} />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Xác nhận
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
