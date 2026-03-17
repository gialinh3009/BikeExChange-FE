import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { depositWalletAPI } from "../../services/Buyer/walletService";

type Status = "loading" | "success" | "failed";

const fmtVND = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(n) + " ₫";

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
        "75": "Ngân hàng đang bảo trì",
        "79": "Sai mật khẩu thanh toán quá số lần quy định",
        "99": "Lỗi không xác định",
    };
    return map[code] ?? `Giao dịch thất bại (mã lỗi: ${code})`;
}

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<Status>("loading");
    const [amount, setAmount] = useState(0);
    const [txRef, setTxRef] = useState("");
    const [message, setMessage] = useState("");
    const calledRef = useRef(false);

    useEffect(() => {
        const responseCode = searchParams.get("vnp_ResponseCode");
        const rawAmount    = searchParams.get("vnp_Amount") ?? "0";
        const txnRef       = searchParams.get("vnp_TxnRef") ?? "";

        const actualAmount = Math.floor(Number(rawAmount) / 100);
        setAmount(actualAmount);
        setTxRef(txnRef);

        if (!responseCode) { navigate("/buyer"); return; }

        const storageKey = `deposit_done_${txnRef}`;
        const saved = sessionStorage.getItem(storageKey);
        if (saved === "success") { setStatus("success"); return; }
        if (saved === "failed")  { setStatus("failed");  return; }
        if (calledRef.current) return;
        calledRef.current = true;

        if (responseCode === "00") {
            void confirmDeposit(actualAmount, txnRef, storageKey);
        } else {
            sessionStorage.setItem(storageKey, "failed");
            setStatus("failed");
            setMessage(getVNPayMessage(responseCode));
        }
    }, [searchParams, navigate]);

    const confirmDeposit = async (amt: number, referenceId: string, storageKey: string) => {
        try {
            await depositWalletAPI(amt, referenceId);
            sessionStorage.setItem(storageKey, "success");
            setStatus("success");
        } catch (err) {
            console.warn("Deposit confirm:", err);
            sessionStorage.setItem(storageKey, "failed");
            setStatus("failed");
            setMessage("Không thể xác nhận giao dịch nạp tiền. Vui lòng kiểm tra lại lịch sử giao dịch ví.");
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500&display=swap');

                .ps-root { font-family: 'DM Sans', sans-serif; }

                /* ── Background animated blobs ── */
                @keyframes blobMove1 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33%     { transform: translate(30px,-20px) scale(1.05); }
                    66%     { transform: translate(-20px,15px) scale(.97); }
                }
                @keyframes blobMove2 {
                    0%,100% { transform: translate(0,0) scale(1); }
                    33%     { transform: translate(-25px,20px) scale(1.04); }
                    66%     { transform: translate(20px,-10px) scale(.98); }
                }
                .blob1 { animation: blobMove1 12s ease-in-out infinite; }
                .blob2 { animation: blobMove2 14s ease-in-out 2s infinite; }
                .blob3 { animation: blobMove1 16s ease-in-out 4s infinite; }

                /* ── Icon animations ── */
                @keyframes iconEntry {
                    0%   { opacity: 0; transform: scale(.4) rotate(-10deg); }
                    60%  { transform: scale(1.12) rotate(2deg); }
                    100% { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes ringExpand {
                    0%   { transform: scale(1); opacity: .6; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes checkDraw {
                    to { stroke-dashoffset: 0; }
                }
                .icon-entry   { animation: iconEntry .55s cubic-bezier(.34,1.56,.64,1) both; }
                .ring-expand  { animation: ringExpand 2.2s ease-out infinite; }
                .ring-expand2 { animation: ringExpand 2.2s ease-out .75s infinite; }
                .check-line {
                    stroke-dasharray: 52;
                    stroke-dashoffset: 52;
                    animation: checkDraw .4s ease .45s forwards;
                }

                /* ── Staggered fade-up ── */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes amountIn {
                    from { opacity: 0; transform: scale(.75); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .a1 { animation: fadeUp .4s ease .05s both; }
                .a2 { animation: fadeUp .4s ease .12s both; }
                .a3 { animation: fadeUp .4s ease .19s both; }
                .a4 { animation: fadeUp .4s ease .26s both; }
                .a5 { animation: fadeUp .4s ease .33s both; }
                .a-amt { animation: amountIn .5s cubic-bezier(.34,1.56,.64,1) .3s both; }

                /* ── Spinner ── */
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes dotB  {
                    0%,80%,100% { transform: scaleY(.4); opacity: .3; }
                    40%         { transform: scaleY(1);  opacity: 1; }
                }
                .spin { animation: spin .9s linear infinite; }
                .db1  { animation: dotB 1.2s ease infinite; }
                .db2  { animation: dotB 1.2s ease .15s infinite; }
                .db3  { animation: dotB 1.2s ease .3s infinite; }

                /* ── Card shadow / hover ── */
                .ps-card {
                    box-shadow:
                        0 0 0 1px rgba(99,102,241,.08),
                        0 20px 60px rgba(99,102,241,.1),
                        0 4px 16px rgba(0,0,0,.06);
                }

                /* ── Buttons ── */
                .btn-blue {
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                    transition: all .2s ease;
                    box-shadow: 0 4px 18px rgba(79,70,229,.3);
                }
                .btn-blue:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(79,70,229,.4);
                    filter: brightness(1.08);
                }
                .btn-blue:active { transform: translateY(0); }

                .btn-outline {
                    transition: all .2s ease;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    color: #475569;
                }
                .btn-outline:hover {
                    border-color: #c7d2fe;
                    color: #4338ca;
                    background: #eef2ff;
                }

                .btn-red {
                    background: linear-gradient(135deg, #dc2626, #e11d48);
                    transition: all .2s ease;
                    box-shadow: 0 4px 18px rgba(220,38,38,.28);
                }
                .btn-red:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(220,38,38,.38);
                }

                /* ── Amount number glow ── */
                .amount-glow {
                    color: #1d4ed8;
                    text-shadow: 0 0 40px rgba(37,99,235,.25);
                }

                /* ── Steps bar (success) ── */
                @keyframes barFill {
                    from { width: 0%; }
                    to   { width: 100%; }
                }
                .bar-fill { animation: barFill 1.8s cubic-bezier(.4,0,.2,1) .5s both; }
            `}</style>

            {/* ════ ROOT ════ */}
            <div
                className="ps-root"
                style={{
                    minHeight: "100vh",
                    background: "#f8faff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative blobs matching homepage blue/indigo */}
                <div className="blob1" style={{
                    position: "absolute", top: -160, right: -160,
                    width: 520, height: 520, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(79,70,229,.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}/>
                <div className="blob2" style={{
                    position: "absolute", bottom: -120, left: -120,
                    width: 440, height: 440, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(37,99,235,.1) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}/>
                <div className="blob3" style={{
                    position: "absolute", top: "40%", left: "15%",
                    width: 280, height: 280, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,.07) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}/>

                {/* Subtle dot-grid */}
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    backgroundImage: "radial-gradient(circle, rgba(99,102,241,.12) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
                }}/>

                {/* ════ CARD ════ */}
                <div
                    className="ps-card"
                    style={{
                        position: "relative", zIndex: 1,
                        width: "100%", maxWidth: 460,
                        background: "white",
                        borderRadius: 24,
                        padding: "0",
                        overflow: "hidden",
                    }}
                >
                    {/* ── Top stripe matching homepage gradient ── */}
                    <div style={{
                        height: 5,
                        background: status === "failed"
                            ? "linear-gradient(90deg, #dc2626, #f87171)"
                            : "linear-gradient(90deg, #2563eb, #6366f1, #818cf8)",
                    }}/>

                    <div style={{ padding: "40px 36px 36px" }}>

                        {/* ════ LOADING ════ */}
                        {status === "loading" && (
                            <div style={{ textAlign: "center" }}>
                                {/* Spinner */}
                                <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
                                    <svg className="spin" width="80" height="80" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="34" fill="none" stroke="#e0e7ff" strokeWidth="5"/>
                                        <circle cx="40" cy="40" r="34" fill="none"
                                                stroke="url(#loadGrad)" strokeWidth="5"
                                                strokeLinecap="round" strokeDasharray="55 160"/>
                                        <defs>
                                            <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#2563eb"/>
                                                <stop offset="100%" stopColor="#6366f1"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round">
                                            <rect x="2" y="5" width="20" height="14" rx="3"/>
                                            <path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
                                        </svg>
                                    </div>
                                </div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                                    Đang xác nhận giao dịch
                                </div>
                                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
                                    Vui lòng không đóng trang này...
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", gap: 5, alignItems: "flex-end", height: 20 }}>
                                    {[0,1,2].map(i => (
                                        <div key={i} className={`db${i+1}`} style={{
                                            width: 5, height: 18, borderRadius: 3,
                                            background: "linear-gradient(180deg, #2563eb, #6366f1)",
                                        }}/>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ════ SUCCESS ════ */}
                        {status === "success" && (
                            <>
                                {/* ── Icon ── */}
                                <div style={{ textAlign: "center", marginBottom: 28 }}>
                                    <div className="icon-entry" style={{
                                        position: "relative",
                                        width: 88, height: 88,
                                        margin: "0 auto",
                                    }}>
                                        {/* Rings */}
                                        <div className="ring-expand" style={{
                                            position: "absolute", inset: 0,
                                            borderRadius: "50%",
                                            border: "2px solid #2563eb",
                                            opacity: 0,
                                        }}/>
                                        <div className="ring-expand2" style={{
                                            position: "absolute", inset: 0,
                                            borderRadius: "50%",
                                            border: "2px solid #6366f1",
                                            opacity: 0,
                                        }}/>
                                        {/* Circle */}
                                        <div style={{
                                            width: "100%", height: "100%",
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #6366f1 100%)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            boxShadow: "0 8px 32px rgba(79,70,229,.35), 0 0 0 10px rgba(79,70,229,.08)",
                                        }}>
                                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                                <path
                                                    className="check-line"
                                                    d="M9 20L16.5 27.5L31 12"
                                                    stroke="white" strokeWidth="3.2"
                                                    strokeLinecap="round" strokeLinejoin="round"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Heading ── */}
                                <div className="a1" style={{ textAlign: "center", marginBottom: 28 }}>
                                    <h1 style={{
                                        fontSize: 22, fontWeight: 800,
                                        color: "#0f172a", marginBottom: 6,
                                        letterSpacing: "-0.4px",
                                    }}>
                                        Thanh toán thành công
                                    </h1>
                                    <p style={{ fontSize: 13.5, color: "#64748b" }}>
                                        Số dư ví của bạn đã được cập nhật
                                    </p>
                                </div>

                                {/* ── Amount card ── */}
                                <div className="a2" style={{
                                    background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
                                    border: "1.5px solid #c7d2fe",
                                    borderRadius: 16,
                                    padding: "20px 22px",
                                    marginBottom: 20,
                                    position: "relative",
                                    overflow: "hidden",
                                }}>
                                    {/* Decorative corner */}
                                    <div style={{
                                        position: "absolute", top: -20, right: -20,
                                        width: 80, height: 80, borderRadius: "50%",
                                        background: "rgba(99,102,241,.07)",
                                    }}/>
                                    <div style={{
                                        fontSize: 10.5, fontWeight: 700,
                                        color: "#6366f1",
                                        textTransform: "uppercase",
                                        letterSpacing: "1.5px",
                                        marginBottom: 8,
                                        display: "flex", alignItems: "center", gap: 6,
                                    }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round">
                                            <rect x="2" y="5" width="20" height="14" rx="3"/>
                                            <path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
                                        </svg>
                                        Số tiền đã nạp
                                    </div>
                                    <div className="a-amt amount-glow" style={{
                                        fontSize: 36, fontWeight: 800,
                                        letterSpacing: "-1.5px", lineHeight: 1.1,
                                        marginBottom: 12,
                                    }}>
                                        {fmtVND(amount)}
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{
                                        height: 3, background: "rgba(99,102,241,.15)",
                                        borderRadius: 99, overflow: "hidden", marginBottom: 12,
                                    }}>
                                        <div className="bar-fill" style={{
                                            height: "100%",
                                            background: "linear-gradient(90deg, #2563eb, #6366f1)",
                                            borderRadius: 99,
                                        }}/>
                                    </div>
                                    {/* TxRef */}
                                    {txRef && (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            padding: "6px 10px",
                                            background: "rgba(255,255,255,.7)",
                                            borderRadius: 8,
                                            border: "1px solid rgba(99,102,241,.15)",
                                            width: "fit-content",
                                        }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round">
                                                <rect x="5" y="2" width="14" height="20" rx="2"/>
                                                <path d="M9 7h6M9 11h6M9 15h4"/>
                                            </svg>
                                            <span style={{
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: 10, color: "#94a3b8",
                                                letterSpacing: "0.3px",
                                            }}>
                                            {txRef}
                                        </span>
                                        </div>
                                    )}
                                </div>

                                {/* ── Info row ── */}
                                <div className="a3" style={{
                                    display: "grid", gridTemplateColumns: "1fr 1fr",
                                    gap: 10, marginBottom: 24,
                                }}>
                                    {[
                                        { label: "Trạng thái", value: "Thành công", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                                        { label: "Phương thức", value: "VNPay", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            padding: "12px 14px",
                                            background: item.bg,
                                            border: `1px solid ${item.border}`,
                                            borderRadius: 12,
                                        }}>
                                            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                                                {item.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Divider ── */}
                                <div className="a4" style={{
                                    height: 1, background: "#f1f5f9",
                                    marginBottom: 20,
                                }}/>

                                {/* ── Buttons ── */}
                                <div className="a5" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <button
                                        className="btn-blue"
                                        onClick={() => navigate("/buyer", { state: { tab: "wallet" } })}
                                        style={{
                                            width: "100%", padding: "13px 20px",
                                            border: "none", borderRadius: 13,
                                            color: "white",
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 14, fontWeight: 700, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="5" width="20" height="14" rx="3"/>
                                            <path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
                                        </svg>
                                        Xem ví của tôi
                                    </button>
                                    <button
                                        className="btn-outline"
                                        onClick={() => navigate("/buyer")}
                                        style={{
                                            width: "100%", padding: "12px 20px",
                                            borderRadius: 13,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9 22 9 12 15 12 15 22"/>
                                        </svg>
                                        Về trang chủ
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ════ FAILED ════ */}
                        {status === "failed" && (
                            <>
                                {/* ── Icon ── */}
                                <div style={{ textAlign: "center", marginBottom: 28 }}>
                                    <div className="icon-entry" style={{
                                        position: "relative", width: 88, height: 88, margin: "0 auto",
                                    }}>
                                        <div className="ring-expand" style={{
                                            position: "absolute", inset: 0, borderRadius: "50%",
                                            border: "2px solid #ef4444", opacity: 0,
                                        }}/>
                                        <div className="ring-expand2" style={{
                                            position: "absolute", inset: 0, borderRadius: "50%",
                                            border: "2px solid #f87171", opacity: 0,
                                        }}/>
                                        <div style={{
                                            width: "100%", height: "100%", borderRadius: "50%",
                                            background: "linear-gradient(135deg, #dc2626, #f87171)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            boxShadow: "0 8px 32px rgba(220,38,38,.3), 0 0 0 10px rgba(220,38,38,.08)",
                                        }}>
                                            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                                                <path d="M9 9L25 25M25 9L9 25" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="a1" style={{ textAlign: "center", marginBottom: 20 }}>
                                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.4px" }}>
                                        Thanh toán thất bại
                                    </h1>
                                </div>

                                {/* Error box */}
                                <div className="a2" style={{
                                    background: "#fff1f2",
                                    border: "1.5px solid #fecdd3",
                                    borderRadius: 14,
                                    padding: "14px 16px",
                                    marginBottom: 20,
                                    display: "flex", alignItems: "flex-start", gap: 10,
                                    textAlign: "left",
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                        background: "#fee2e2",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            Lỗi giao dịch
                                        </div>
                                        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55 }}>
                                            {message || "Giao dịch không thành công. Vui lòng thử lại."}
                                        </div>
                                    </div>
                                </div>

                                <div className="a3" style={{
                                    display: "grid", gridTemplateColumns: "1fr 1fr",
                                    gap: 10, marginBottom: 24,
                                }}>
                                    {[
                                        { label: "Trạng thái", value: "Thất bại", color: "#dc2626", bg: "#fff1f2", border: "#fecdd3" },
                                        { label: "Phương thức", value: "VNPay", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            padding: "12px 14px",
                                            background: item.bg,
                                            border: `1px solid ${item.border}`,
                                            borderRadius: 12,
                                        }}>
                                            <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                                                {item.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="a4" style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }}/>

                                <div className="a5" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <button
                                        className="btn-red"
                                        onClick={() => navigate("/buyer", { state: { tab: "wallet" } })}
                                        style={{
                                            width: "100%", padding: "13px 20px",
                                            border: "none", borderRadius: 13,
                                            color: "white",
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 14, fontWeight: 700, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        }}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1 4 1 10 7 10"/>
                                            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                                        </svg>
                                        Thử lại
                                    </button>
                                    <button
                                        className="btn-outline"
                                        onClick={() => navigate("/buyer")}
                                        style={{
                                            width: "100%", padding: "12px 20px",
                                            borderRadius: 13,
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9 22 9 12 15 12 15 22"/>
                                        </svg>
                                        Về trang chủ
                                    </button>
                                </div>
                            </>
                        )}

                    </div>{/* end padding wrapper */}

                    {/* ── Footer strip ── */}
                    <div style={{
                        padding: "12px 36px",
                        borderTop: "1px solid #f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                            Giao dịch được bảo mật bởi <strong style={{ color: "#6366f1" }}>BikeExchange</strong>
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}