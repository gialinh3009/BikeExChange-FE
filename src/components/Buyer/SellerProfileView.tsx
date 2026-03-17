import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Mail, Phone, Star, User } from "lucide-react";
import { getUserProfileAPI } from "../../services/Buyer/Userservice";
import { listReviewsBySellerAPI } from "../../services/reviewService";

type SellerProfile = {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
};

type SellerReview = {
  id: number;
  rating: number;
  comment?: string;
  createdAt?: string;
  reviewer?: {
    id?: number;
    fullName?: string;
    email?: string;
  };
};

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getReviewerName = (review: SellerReview) => {
  if (review.reviewer?.fullName?.trim()) return review.reviewer.fullName.trim();
  if (review.reviewer?.email?.trim()) return review.reviewer.email.trim();
  return "Người mua";
};

export default function SellerProfileView() {
  const navigate = useNavigate();
  const { sellerId } = useParams<{ sellerId: string }>();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [ratingFilter, setRatingFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1" | "comment">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sellerInitial = seller?.fullName?.trim()?.[0]?.toUpperCase() || "S";

  useEffect(() => {
    if (!sellerId) {
      setError("Không tìm thấy người bán.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getUserProfileAPI(Number(sellerId));
        const data = res?.data ?? res;
        setSeller({
          id: data?.id,
          fullName: data?.fullName,
          email: data?.email,
          phone: data?.phone,
        });

        const reviewRes = await listReviewsBySellerAPI(Number(sellerId));
        const reviewData = Array.isArray(reviewRes) ? reviewRes : reviewRes?.data ?? [];
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải thông tin người bán...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, width: "min(92vw, 520px)" }}>
          <p style={{ color: "#dc2626", fontWeight: 700, marginBottom: 8 }}>Không thể tải hồ sơ người bán</p>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>{error || "Dữ liệu không hợp lệ."}</p>
          <button
            onClick={() => navigate(-1)}
            style={{ border: "1px solid #2563eb", color: "#2563eb", background: "#fff", padding: "8px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / reviews.length
    : 0;

  const reviewCountByStar = [5, 4, 3, 2, 1].reduce<Record<number, number>>((acc, star) => {
    acc[star] = reviews.filter((item) => Number(item.rating) === star).length;
    return acc;
  }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  const reviewWithCommentCount = reviews.filter((item) => item.comment?.trim()).length;

  const displayedReviews = reviews
    .filter((item) => {
      if (ratingFilter === "all") return true;
      if (ratingFilter === "comment") return !!item.comment?.trim();
      return Number(item.rating) === Number(ratingFilter);
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const filterOptions: Array<{ key: "all" | "5" | "4" | "3" | "2" | "1" | "comment"; label: string }> = [
    { key: "all", label: `Tất cả (${reviews.length})` },
    { key: "5", label: `5 Sao (${reviewCountByStar[5]})` },
    { key: "4", label: `4 Sao (${reviewCountByStar[4]})` },
    { key: "3", label: `3 Sao (${reviewCountByStar[3]})` },
    { key: "2", label: `2 Sao (${reviewCountByStar[2]})` },
    { key: "1", label: `1 Sao (${reviewCountByStar[1]})` },
    { key: "comment", label: `Có bình luận (${reviewWithCommentCount})` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { box-sizing: border-box; }
        .spv-info-card:hover { box-shadow: 0 8px 24px rgba(37,99,235,.08); border-color: #bfdbfe !important; }
        .spv-back:hover { background: #eff6ff !important; }
      `}</style>

      <div style={{
        background: "white",
        borderBottom: "1px solid #e8ecf4",
        padding: "0 32px",
        height: 54,
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 8px rgba(0,0,0,.04)",
      }}>
        <button
          className="spv-back"
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#2563eb", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "6px 10px", borderRadius: 8, transition: "background .15s" }}
        >
          <ChevronLeft size={17} strokeWidth={2.5} /> Quay lại trang xe
        </button>
      </div>

      <div style={{ width: "min(92vw, 760px)", margin: "0 auto", padding: "36px 16px 72px" }}>
        <div style={{ background: "linear-gradient(135deg,#eff6ff,#f8fafc)", border: "1.5px solid #dbeafe", borderRadius: 20, padding: 24, boxShadow: "0 8px 24px rgba(37,99,235,.08)", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 28, boxShadow: "0 6px 20px rgba(37,99,235,.22)" }}>
              {sellerInitial}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ background: "#dbeafe", color: "#2563eb", borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 700 }}>Người bán</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, color: "#0f172a", fontWeight: 800 }}>{seller.fullName || "Người bán"}</h1>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div className="spv-info-card" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 18px", transition: "all .18s" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Họ tên</p>
            <p style={{ margin: "8px 0 0", color: "#0f172a", display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16 }}>
              <User size={16} color="#2563eb" /> {seller.fullName || "Chưa cập nhật"}
            </p>
          </div>

          <div className="spv-info-card" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 18px", transition: "all .18s" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Số điện thoại</p>
            <p style={{ margin: "8px 0 0", color: "#0f172a", display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16 }}>
              <Phone size={16} color="#2563eb" /> {seller.phone || "Chưa cập nhật"}
            </p>
          </div>

          <div className="spv-info-card" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "16px 18px", transition: "all .18s" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Email</p>
            <p style={{ margin: "8px 0 0", color: "#0f172a", display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16 }}>
              <Mail size={16} color="#2563eb" /> {seller.email || "Chưa cập nhật"}
            </p>
          </div>

          <div className="spv-info-card" style={{ background: "#fff", border: "1.5px solid #ffd7c2", borderRadius: 16, padding: "16px 18px", transition: "all .18s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Đánh giá từ người mua</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f59e0b", fontWeight: 800 }}>
                <Star size={16} fill="#f59e0b" />
                <span style={{ fontSize: 15, color: "#0f172a" }}>{reviews.length ? avgRating.toFixed(1) : "0.0"}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>({reviews.length} đánh giá)</span>
              </div>
            </div>

            <div style={{ background: "#fff8f4", border: "1px solid #ffe7db", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, color: "#ee4d2d", marginBottom: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 800 }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>trên 5</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {filterOptions.map((opt) => {
                  const active = ratingFilter === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setRatingFilter(opt.key)}
                      style={{
                        border: "1px solid",
                        borderColor: active ? "#ee4d2d" : "#ffd9c9",
                        background: active ? "#fff1eb" : "white",
                        color: active ? "#ee4d2d" : "#9a3412",
                        borderRadius: 4,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {displayedReviews.slice(0, 8).map((item) => (
              <div key={item.id} style={{ border: "1px solid #edf2f7", borderRadius: 12, padding: "10px 12px", background: "#fcfdff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{getReviewerName(item)}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>
                      <Star size={13} fill="#f59e0b" /> {item.rating}/5
                    </span>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{fmtDate(item.createdAt)}</span>
                  </div>
                </div>
                {item.comment?.trim() ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{item.comment}</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Không có nhận xét chi tiết.</p>
                )}
              </div>
              ))}
            </div>

            {displayedReviews.length === 0 && (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>
                {reviews.length === 0 ? "Seller chưa có đánh giá nào." : "Không có đánh giá ở bộ lọc này."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}