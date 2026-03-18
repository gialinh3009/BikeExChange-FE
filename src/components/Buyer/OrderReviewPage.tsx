import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Star } from "lucide-react";
import { getOrderHistoryAPI } from "../../services/Buyer/orderActionService";
import { createReviewAPI } from "../../services/reviewService";

type OrderStatus =
  | "PENDING_PAYMENT" | "ESCROWED" | "ACCEPTED" | "DELIVERED"
  | "COMPLETED" | "CANCELLED" | "REFUNDED"
  | "RETURN_REQUESTED" | "DISPUTED";

interface OrderDetail {
  id: number;
  sellerId: number;
  sellerName: string;
  bikeTitle: string;
  status: OrderStatus;
  bikeId?: number;
  amountPoints?: number;
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  seller?: {
    id?: number;
    userId?: number;
    sellerId?: number;
    name?: string;
    fullName?: string;
  };
  bike?: {
    id?: number;
    title?: string;
  };
}

interface OrderHistoryDetail {
  order: OrderDetail;
  canReview?: boolean;
  isReviewed?: boolean;
  reviewed?: boolean;
  review?: unknown;
}

const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtMoney = (p?: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

export default function OrderReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = Number(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<OrderHistoryDetail | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState("");


  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setError("Đơn hàng không hợp lệ.");
        setLoading(false);
        return;
      }
      try {
        const data = await getOrderHistoryAPI(orderId);
        setDetail(data);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [orderId]);

  const submitReview = async () => {
    if (!detail?.order) return;

    if (rating < 1 || rating > 5) {
      setFormError("Vui lòng chọn số sao từ 1 đến 5.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập để đánh giá.");

      await createReviewAPI(
        {
          orderId,
          rating,
          comment: comment.trim(),
        },
        token,
      );

      setShowSuccess(true);
    } catch (e) {
      setFormError(String(e instanceof Error ? e.message : e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải dữ liệu đánh giá...</p>
      </div>
    );
  }

  if (error || !detail?.order) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, width: "min(92vw, 520px)" }}>
          <p style={{ color: "#dc2626", fontWeight: 700, marginBottom: 8 }}>Không thể mở trang đánh giá</p>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>{error || "Dữ liệu không hợp lệ."}</p>
          <button onClick={() => navigate(-1)} style={{ border: "1px solid #2563eb", color: "#2563eb", background: "#fff", padding: "8px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const canReview = detail?.canReview !== false;
  const isReviewed = Boolean(detail?.isReviewed ?? detail?.reviewed ?? detail?.review);

  if (isReviewed) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f4f6fb",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans',sans-serif"
      }}>
        <div style={{
          background: "white", borderRadius: 16, padding: 32, width: "min(92vw, 460px)",
          boxShadow: "0 4px 24px rgba(0,0,0,.08)", border: "1.5px solid #e2e8f0"
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: 8 }} />
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: "#0f172a" }}>
              Đơn hàng này đã được đánh giá
            </h3>
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Mỗi đơn hàng chỉ được đánh giá một lần. Đánh giá đã được ghi nhận trước đó.
            </p>
          </div>

          {(detail?.review as any) && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#334155" }}>Đánh giá của bạn</p>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18}
                    color={s <= (detail.review as any).rating ? "#f59e0b" : "#cbd5e1"}
                    fill={s <= (detail.review as any).rating ? "#f59e0b" : "transparent"} />
                ))}
              </div>
              {(detail.review as any).comment && (
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{(detail.review as any).comment}</p>
              )}
              {(detail.review as any).createdAt && (
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94a3b8" }}>{fmtDateTime((detail.review as any).createdAt)}</p>
              )}
            </div>
          )}

          <button
            style={{
              width: "100%", padding: "10px 24px", background: "#2563eb", color: "white",
              border: "none", borderRadius: 8, fontWeight: 600,
              cursor: "pointer", fontSize: 15
            }}
            onClick={() => navigate(`/orders/${orderId}`)}
          >
            Quay lại đơn hàng
          </button>
        </div>
      </div>
    );
  }

  if (!canReview || detail.order.status !== "COMPLETED") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, width: "min(92vw, 520px)" }}>
          <p style={{ color: "#0f172a", fontWeight: 700, marginBottom: 8 }}>Đơn hàng chưa thể đánh giá</p>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>Chỉ đơn COMPLETED và chưa đánh giá mới có thể gửi review.</p>
          <button onClick={() => navigate(`/orders/${detail.order.id}`)} style={{ border: "1px solid #2563eb", color: "#2563eb", background: "#fff", padding: "8px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
            Xem đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(92vw, 420px)",
              background: "white",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 16px 48px rgba(15, 23, 42, 0.2)",
              padding: "24px 22px",
              textAlign: "center",
            }}
          >
            <CheckCircle2 size={42} color="#16a34a" style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Đánh giá thành công</p>
            <p style={{ margin: "8px 0 20px", fontSize: 14, color: "#64748b" }}>Xin cảm ơn bạn đã gửi đánh giá.</p>
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate(`/orders/${orderId}`);
              }}
              style={{
                minWidth: 160,
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Xem đơn hàng
            </button>
          </div>
        </div>
      )}
      <div style={{ background: "white", borderBottom: "1px solid #e8ecf4", height: 54, display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#2563eb", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại
        </button>
      </div>

      <div style={{ width: "min(92vw, 680px)", margin: "0 auto", padding: "28px 16px 64px" }}>
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
          {(() => {
            const sellerId = Number(
              detail.order.sellerId
              ?? detail.order.seller?.id
              ?? detail.order.seller?.userId
              ?? detail.order.seller?.sellerId,
            );
            const sellerName = detail.order.sellerName || detail.order.seller?.fullName || detail.order.seller?.name || `Seller #${sellerId}`;
            const bikeId = Number(detail.order.bikeId ?? detail.order.bike?.id);
            const bikeTitle = detail.order.bikeTitle || detail.order.bike?.title || "Không có tên xe";

            return (
              <>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Đánh giá đơn hàng #{detail.order.id}</p>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    Thông tin xe
                  </div>
                  <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
                    <p style={{ margin: 0, color: "#0f172a", fontSize: 15, fontWeight: 700 }}>{bikeTitle}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Mã xe: {Number.isFinite(bikeId) && bikeId > 0 ? `#${bikeId}` : "—"}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Giá trị đơn: {fmtMoney(detail.order.amountPoints)}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Ngày tạo: {fmtDateTime(detail.order.createdAt)}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Ngày giao: {fmtDateTime(detail.order.deliveredAt)}</p>
                  </div>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    Thông tin người bán
                  </div>
                  <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
                    <p style={{ margin: 0, color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{sellerName}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Mã người bán: {Number.isFinite(sellerId) && sellerId > 0 ? `#${sellerId}` : "—"}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Trạng thái đơn: {detail.order.status}</p>
                  </div>
                </div>
              </>
            );
          })()}

          <p style={{ margin: "0 0 8px", color: "#0f172a", fontSize: 14, fontWeight: 700 }}>Chọn số sao</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                aria-label={`Chọn ${s} sao`}
              >
                <Star size={28} color={s <= rating ? "#f59e0b" : "#cbd5e1"} fill={s <= rating ? "#f59e0b" : "transparent"} />
              </button>
            ))}
          </div>

          <p style={{ margin: "0 0 8px", color: "#0f172a", fontSize: 14, fontWeight: 700 }}>Nhận xét (tuỳ chọn)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            placeholder="Chia sẻ trải nghiệm giao dịch của bạn..."
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical", marginBottom: 16 }}
          />

          {formError && (
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{formError}</p>
          )}

          <button
            onClick={() => void submitReview()}
            disabled={submitting}
            style={{ background: submitting ? "#94a3b8" : "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
