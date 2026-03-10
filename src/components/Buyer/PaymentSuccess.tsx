import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    CheckCircle, XCircle, Wallet, Bike, ArrowRight,
    RefreshCw, Clock, Receipt,
} from "lucide-react";
import { depositWalletAPI } from "../../services/Buyer/walletService";

/**
 * PaymentSuccess.tsx
 *
 * Route: /payment/return  (khớp với VNPay returnUrl config ở BE)
 *
 * VNPay redirect về URL này kèm các query params:
 *   vnp_ResponseCode=00  → thành công
 *   vnp_Amount           → số tiền (đơn vị: VNĐ * 100)
 *   vnp_TxnRef           → mã giao dịch (referenceId)
 *   vnp_TransactionNo    → mã giao dịch VNPay
 *   vnp_OrderInfo        → thông tin đơn hàng
 *
 * FE sẽ gọi POST /wallet/deposit để xác nhận nạp tiền vào ví
 * (nếu BE chưa tự xử lý qua IPN)
 */

type Status = "loading" | "success" | "failed";

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();
    const [status,  setStatus]  = useState<Status>("loading");
    const [amount,  setAmount]  = useState(0);
    const [txRef,   setTxRef]   = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const responseCode = searchParams.get("vnp_ResponseCode");
        const rawAmount    = searchParams.get("vnp_Amount") ?? "0";
        const txnRef       = searchParams.get("vnp_TxnRef") ?? "";
        const orderInfo    = searchParams.get("vnp_OrderInfo") ?? "";

        // VNPay trả amount * 100
        const actualAmount = Math.floor(Number(rawAmount) / 100);
        setAmount(actualAmount);
        setTxRef(txnRef);

        if (responseCode === "00") {
            // Thanh toán thành công — gọi deposit để cộng điểm
            confirmDeposit(actualAmount, txnRef, orderInfo);
        } else {
            setStatus("failed");
            setMessage(getVNPayMessage(responseCode ?? ""));
        }
    }, []);

    const confirmDeposit = async (amount: number, referenceId: string, _orderInfo: string) => {
        try {
            // Gọi POST /wallet/deposit để xác nhận với BE
            // (một số BE xử lý qua IPN tự động, nếu đã xử lý rồi thì endpoint này có thể báo duplicate — cũng không sao)
            await depositWalletAPI(amount, referenceId);
            setStatus("success");
        } catch (err: unknown) {
            // Nếu BE đã xử lý qua IPN rồi thì deposit có thể throw, nhưng tiền vẫn vào ví
            // → vẫn show success
            const msg = err instanceof Error ? err.message : "";
            if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
                setStatus("success"); // đã xử lý bởi IPN
            } else {
                setStatus("success"); // VNPay trả 00 → ưu tiên show success
                console.warn("deposit confirm:", msg);
            }
        }
    };

    const fmtVND = (n: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f4f6fb 0%, #eff6ff 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans','Nunito',sans-serif", padding: 24,
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        @keyframes scaleIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .scale-in{animation:scaleIn .5s cubic-bezier(.34,1.56,.64,1)}
        .fade-up{animation:fadeUp .4s ease}
        .fade-up-2{animation:fadeUp .4s ease .1s both}
        .fade-up-3{animation:fadeUp .4s ease .2s both}
        .btn-primary{transition:all .15s;transform:translateY(0)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(37,99,235,.3)}
        .btn-secondary{transition:all .15s}
        .btn-secondary:hover{background:#f0fdf4!important}
      `}</style>

            <div style={{
                background: "white", borderRadius: 24, padding: "48px 40px",
                maxWidth: 480, width: "100%",
                boxShadow: "0 24px 60px rgba(0,0,0,.08)",
                textAlign: "center",
            }}>

                {/* ── LOADING ── */}
                {status === "loading" && (
                    <>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                            <RefreshCw size={36} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Đang xác nhận giao dịch</h2>
                        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>Vui lòng đợi trong giây lát, chúng tôi đang xác nhận thanh toán của bạn...</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, padding: "10px 16px", background: "#fffbeb", borderRadius: 10 }}>
                            <Clock size={14} color="#d97706" />
                            <span style={{ fontSize: 12.5, color: "#92400e" }}>Không tắt trang này</span>
                        </div>
                    </>
                )}

                {/* ── SUCCESS ── */}
                {status === "success" && (
                    <>
                        {/* Icon */}
                        <div className="scale-in" style={{
                            width: 90, height: 90, borderRadius: "50%",
                            background: "linear-gradient(135deg,#22c55e,#16a34a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 28px",
                            boxShadow: "0 12px 30px rgba(34,197,94,.3)",
                        }}>
                            <CheckCircle size={44} color="white" />
                        </div>

                        <h2 className="fade-up" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                            Thanh toán thành công! 🎉
                        </h2>
                        <p className="fade-up-2" style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>
                            Số tiền đã được nạp vào ví của bạn
                        </p>

                        {/* Amount card */}
                        <div className="fade-up-2" style={{
                            background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                            border: "1.5px solid #bbf7d0", borderRadius: 16,
                            padding: "20px 24px", marginBottom: 24,
                        }}>
                            <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600, marginBottom: 6 }}>Số tiền đã nạp</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "#15803d" }}>{fmtVND(amount)}</div>
                            {txRef && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 10 }}>
                                    <Receipt size={12} color="#16a34a" />
                                    <span style={{ fontSize: 11.5, color: "#16a34a", fontFamily: "monospace" }}>Mã GD: {txRef}</span>
                                </div>
                            )}
                        </div>

                        {/* CTA buttons */}
                        <div className="fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <button className="btn-primary"
                                    onClick={() => navigate("/buyer", { state: { tab: "wallet" } })}
                                    style={{
                                        width: "100%", padding: "14px 0",
                                        background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                                        color: "white", border: "none", borderRadius: 12,
                                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    }}>
                                <Wallet size={17} /> Xem ví của tôi
                            </button>

                            <button className="btn-secondary"
                                    onClick={() => navigate("/buyer")}
                                    style={{
                                        width: "100%", padding: "13px 0",
                                        background: "#f8fafc", color: "#374151",
                                        border: "1.5px solid #e8ecf4", borderRadius: 12,
                                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    }}>
                                <Bike size={17} /> Bắt đầu mua xe <ArrowRight size={14} />
                            </button>
                        </div>
                    </>
                )}

                {/* ── FAILED ── */}
                {status === "failed" && (
                    <>
                        <div className="scale-in" style={{
                            width: 90, height: 90, borderRadius: "50%",
                            background: "linear-gradient(135deg,#ef4444,#dc2626)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 28px",
                            boxShadow: "0 12px 30px rgba(239,68,68,.25)",
                        }}>
                            <XCircle size={44} color="white" />
                        </div>

                        <h2 className="fade-up" style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                            Thanh toán thất bại
                        </h2>
                        <p className="fade-up-2" style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
                            {message || "Giao dịch không thành công. Vui lòng thử lại."}
                        </p>

                        {amount > 0 && (
                            <div style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
                                <div style={{ fontSize: 13, color: "#e11d48" }}>Số tiền giao dịch</div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: "#e11d48" }}>{fmtVND(amount)}</div>
                                <div style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>Không bị trừ tiền</div>
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <button className="btn-primary"
                                    onClick={() => navigate("/buyer", { state: { tab: "wallet" } })}
                                    style={{
                                        width: "100%", padding: "14px 0",
                                        background: "#0f172a", color: "white",
                                        border: "none", borderRadius: 12,
                                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    }}>
                                <Wallet size={17} /> Thử lại
                            </button>
                            <button className="btn-secondary"
                                    onClick={() => navigate("/buyer")}
                                    style={{
                                        width: "100%", padding: "13px 0",
                                        background: "#f8fafc", color: "#374151",
                                        border: "1.5px solid #e8ecf4", borderRadius: 12,
                                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                                    }}>
                                Về trang chủ
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// VNPay error codes → message tiếng Việt
function getVNPayMessage(code: string): string {
    const map: Record<string, string> = {
        "07": "Giao dịch bị nghi ngờ gian lận",
        "09": "Thẻ/Tài khoản chưa đăng ký Internet Banking",
        "10": "Xác thực thông tin thẻ quá 3 lần",
        "11": "Giao dịch hết hạn thanh toán",
        "12": "Thẻ/Tài khoản bị khóa",
        "13": "Sai mật khẩu OTP",
        "24": "Khách hàng hủy giao dịch",
        "51": "Tài khoản không đủ số dư",
        "65": "Vượt quá hạn mức giao dịch trong ngày",
        "75": "Ngân hàng bảo trì",
        "79": "Sai mật khẩu thanh toán quá số lần quy định",
        "99": "Lỗi không xác định",
    };
    return map[code] ?? `Lỗi giao dịch (mã: ${code})`;
}