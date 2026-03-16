import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Mail, Phone, User } from "lucide-react";
import { getUserProfileAPI } from "../../services/Buyer/Userservice";

type SellerProfile = {
  id: number;
  fullName?: string;
  email?: string;
  phone?: string;
};

export default function SellerProfileView() {
  const navigate = useNavigate();
  const { sellerId } = useParams<{ sellerId: string }>();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
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
        </div>
      </div>
    </div>
  );
}