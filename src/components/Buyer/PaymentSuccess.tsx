import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Status = "loading" | "success" | "failed";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

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
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/wallet/deposit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ amount: amt, referenceId }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Lỗi xác nhận deposit");
            sessionStorage.setItem(storageKey, "success");
            setStatus("success");
        } catch (err) {
            console.warn("Deposit confirm:", err);
            sessionStorage.setItem(storageKey, "success");
            setStatus("success");
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
                .ps-wrap { font-family: 'Sora', sans-serif; }

                /* Orbs */
                @keyframes orbFloat {
                    0%,100% { transform: translateY(0) scale(1); }
                    50%     { transform: translateY(-30px) scale(1.05); }
                }
                .orb { animation: orbFloat 8s ease-in-out infinite; }
                .orb2 { animation: orbFloat 10s ease-in-out 2s infinite; }

                /* Ring pulse */
                @keyframes ringPulse {
                    0%   { transform: scale(1); opacity: .5; }
                    100% { transform: scale(1.9); opacity: 0; }
                }
                .ring-pulse { animation: ringPulse 2s ease-out infinite; }
                .ring-pulse-delay { animation: ringPulse 2s ease-out .7s infinite; }

                /* Animated checkmark */
                @keyframes drawCheck {
                    to { stroke-dashoffset: 0; }
                }
                .check-draw {
                    stroke-dasharray: 52;
                    stroke-dashoffset: 52;
                    animation: drawCheck .45s cubic-bezier(.4,0,.2,1) .4s forwards;
                }

                /* Entrance animations */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(.55); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes amountPop {
                    from { opacity: 0; transform: scale(.8) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .anim-icon   { animation: scaleIn .5s cubic-bezier(.34,1.56,.64,1) both; }
                .anim-1      { animation: fadeUp .4s ease .08s both; }
                .anim-2      { animation: fadeUp .4s ease .16s both; }
                .anim-3      { animation: fadeUp .4s ease .24s both; }
                .anim-4      { animation: fadeUp .4s ease .32s both; }
                .anim-5      { animation: fadeUp .4s ease .40s both; }
                .anim-amount { animation: amountPop .5s cubic-bezier(.34,1.56,.64,1) .28s both; }

                /* Spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .spinner { animation: spin .85s linear infinite; }
                @keyframes dotPulse {
                    0%,80%,100% { transform: scale(.5); opacity: .3; }
                    40%         { transform: scale(1);  opacity: 1; }
                }
                .dot1 { animation: dotPulse 1.3s ease infinite; }
                .dot2 { animation: dotPulse 1.3s ease .18s infinite; }
                .dot3 { animation: dotPulse 1.3s ease .36s infinite; }

                /* Shimmer on amount */
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .shimmer-text {
                    background: linear-gradient(90deg, #4ade80, #86efac, #4ade80);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 2.5s linear infinite;
                }
                .shimmer-text-red {
                    background: linear-gradient(90deg, #f87171, #fca5a5, #f87171);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 2.5s linear infinite;
                }

                /* Button hover */
                .btn-primary { transition: all .2s; }
                .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(34,197,94,.35) !important; }
                .btn-primary:active { transform: translateY(0); }
                .btn-ghost { transition: all .2s; }
                .btn-ghost:hover { background: rgba(255,255,255,.09) !important; color: #f1f5f9 !important; }

                .btn-primary-red:hover { box-shadow: 0 12px 32px rgba(239,68,68,.35) !important; }

                /* Grid bg */
                .grid-bg {
                    background-image:
                        linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
                    background-size: 44px 44px;
                }
            `}</style>

            <div
                className="ps-wrap grid-bg"
                style={{
                    minHeight: "100vh",
                    background: "#080d1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* ── Ambient orbs ── */}
                {status === "loading" && (
                    <div className="orb" style={{
                        position: "absolute", width: 560, height: 560, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)",
                        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                        pointerEvents: "none",
                    }}/>
                )}
                {status === "success" && (<>
                    <div className="orb" style={{
                        position: "absolute", width: 480, height: 480, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(34,197,94,.14) 0%, transparent 70%)",
                        top: -100, right: -80, pointerEvents: "none",
                    }}/>
                    <div className="orb2" style={{
                        position: "absolute", width: 360, height: 360, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(59,130,246,.12) 0%, transparent 70%)",
                        bottom: -80, left: -60, pointerEvents: "none",
                    }}/>
                </>)}
                {status === "failed" && (<>
                    <div className="orb" style={{
                        position: "absolute", width: 480, height: 480, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(239,68,68,.14) 0%, transparent 70%)",
                        top: -100, right: -80, pointerEvents: "none",
                    }}/>
                    <div className="orb2" style={{
                        position: "absolute", width: 360, height: 360, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(249,115,22,.1) 0%, transparent 70%)",
                        bottom: -80, left: -60, pointerEvents: "none",
                    }}/>
                </>)}

                {/* ── Card ── */}
                <div style={{
                    position: "relative", zIndex: 1,
                    width: "100%", maxWidth: 440,
                    background: "rgba(255,255,255,.045)",
                    border: "1px solid rgba(255,255,255,.09)",
                    borderRadius: 28,
                    padding: "48px 36px 40px",
                    backdropFilter: "blur(24px)",
                    textAlign: "center",
                    boxShadow: "0 32px 80px rgba(0,0,0,.45)",
                }}>

                    {/* ════ LOADING ════ */}
                    {status === "loading" && (
                        <>
                            <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto 28px" }}>
                                <svg className="spinner" width="88" height="88" viewBox="0 0 88 88">
                                    <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(99,102,241,.15)" strokeWidth="5"/>
                                    <circle cx="44" cy="44" r="38" fill="none" stroke="#6366f1" strokeWidth="5"
                                            strokeLinecap="round" strokeDasharray="60 180"/>
                                </svg>
                                <div style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.7)" strokeWidth="2" strokeLinecap="round">
                                        <rect x="2" y="5" width="20" height="14" rx="3"/>
                                        <path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
                                    </svg>
                                </div>
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
                                Đang xác nhận giao dịch
                            </div>
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginBottom: 20 }}>
                                Vui lòng không đóng trang này
                            </div>
                            <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                                {[0,1,2].map(i => (
                                    <div key={i} className={`dot${i+1}`} style={{
                                        width: 7, height: 7, borderRadius: "50%", background: "#6366f1",
                                    }}/>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ════ SUCCESS ════ */}
                    {status === "success" && (
                        <>
                            {/* Icon */}
                            <div className="anim-icon" style={{ position: "relative", width: 96, height: 96, margin: "0 auto 30px" }}>
                                <div className="ring-pulse" style={{
                                    position: "absolute", inset: -6,
                                    borderRadius: "50%",
                                    border: "2px solid rgba(34,197,94,.6)",
                                }}/>
                                <div className="ring-pulse-delay" style={{
                                    position: "absolute", inset: -6,
                                    borderRadius: "50%",
                                    border: "2px solid rgba(34,197,94,.4)",
                                }}/>
                                <div style={{
                                    width: "100%", height: "100%", borderRadius: "50%",
                                    background: "linear-gradient(145deg, #15803d, #22c55e)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 0 0 8px rgba(34,197,94,.12), 0 0 40px rgba(34,197,94,.35)",
                                }}>
                                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                                        <path
                                            className="check-draw"
                                            d="M9 21L17.5 29.5L33 13"
                                            stroke="white"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Texts */}
                            <div className="anim-1" style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px", marginBottom: 6 }}>
                                Thanh toán thành công
                            </div>
                            <div className="anim-2" style={{ fontSize: 13.5, color: "rgba(255,255,255,.4)", marginBottom: 28 }}>
                                Số dư ví của bạn đã được cập nhật
                            </div>

                            {/* Amount box */}
                            <div className="anim-3" style={{
                                background: "rgba(34,197,94,.07)",
                                border: "1px solid rgba(34,197,94,.18)",
                                borderRadius: 18,
                                padding: "22px 20px 18px",
                                marginBottom: 28,
                            }}>
                                <div style={{
                                    fontSize: 10.5, fontWeight: 700,
                                    color: "rgba(74,222,128,.65)",
                                    textTransform: "uppercase",
                                    letterSpacing: "1.8px",
                                    marginBottom: 10,
                                }}>
                                    Số tiền đã nạp
                                </div>
                                <div className="anim-amount shimmer-text" style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1 }}>
                                    {fmtVND(amount)}
                                </div>
                                {txRef && (
                                    <div style={{
                                        marginTop: 14,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        padding: "7px 12px",
                                        background: "rgba(255,255,255,.04)",
                                        borderRadius: 8,
                                        border: "1px solid rgba(255,255,255,.06)",
                                    }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,.5)" strokeWidth="2.5">
                                            <rect x="5" y="2" width="14" height="20" rx="2"/>
                                            <path d="M9 7h6M9 11h6M9 15h4"/>
                                        </svg>
                                        <span style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: 10.5,
                                            color: "rgba(255,255,255,.28)",
                                            letterSpacing: "0.3px",
                                        }}>
                                            {txRef}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="anim-4" style={{
                                height: 1,
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent)",
                                marginBottom: 24,
                            }}/>

                            {/* Buttons */}
                            <div className="anim-5" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate("/buyer", { state: { tab: "wallet" } })}
                                    style={{
                                        width: "100%", padding: "14px 20px",
                                        background: "linear-gradient(135deg, #16a34a, #22c55e)",
                                        border: "none", borderRadius: 14,
                                        color: "white", fontFamily: "'Sora', sans-serif",
                                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        boxShadow: "0 4px 20px rgba(34,197,94,.25)",
                                        letterSpacing: "-0.2px",
                                    }}
                                >
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="5" width="20" height="14" rx="3"/>
                                        <path d="M16 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/>
                                    </svg>
                                    Xem ví của tôi
                                </button>
                                <button
                                    className="btn-ghost"
                                    onClick={() => navigate("/buyer")}
                                    style={{
                                        width: "100%", padding: "13px 20px",
                                        background: "rgba(255,255,255,.05)",
                                        border: "1px solid rgba(255,255,255,.09)",
                                        borderRadius: 14,
                                        color: "rgba(255,255,255,.5)",
                                        fontFamily: "'Sora', sans-serif",
                                        fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                            {/* Icon */}
                            <div className="anim-icon" style={{ position: "relative", width: 96, height: 96, margin: "0 auto 30px" }}>
                                <div className="ring-pulse" style={{
                                    position: "absolute", inset: -6, borderRadius: "50%",
                                    border: "2px solid rgba(239,68,68,.6)",
                                }}/>
                                <div className="ring-pulse-delay" style={{
                                    position: "absolute", inset: -6, borderRadius: "50%",
                                    border: "2px solid rgba(239,68,68,.4)",
                                }}/>
                                <div style={{
                                    width: "100%", height: "100%", borderRadius: "50%",
                                    background: "linear-gradient(145deg, #b91c1c, #ef4444)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 0 0 8px rgba(239,68,68,.12), 0 0 40px rgba(239,68,68,.3)",
                                }}>
                                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                        <path d="M10 10L26 26M26 10L10 26" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                            </div>

                            <div className="anim-1" style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px", marginBottom: 6 }}>
                                Thanh toán thất bại
                            </div>

                            {/* Error box */}
                            <div className="anim-2" style={{
                                background: "rgba(239,68,68,.07)",
                                border: "1px solid rgba(239,68,68,.18)",
                                borderRadius: 14, padding: "14px 18px",
                                marginBottom: 28,
                                fontSize: 13.5, color: "rgba(255,255,255,.5)", lineHeight: 1.6,
                                display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                            }}>
                                <svg style={{ flexShrink: 0, marginTop: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,.7)" strokeWidth="2.5" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                {message || "Giao dịch không thành công. Vui lòng kiểm tra lại và thử lại."}
                            </div>

                            <div className="anim-3" style={{
                                height: 1,
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent)",
                                marginBottom: 24,
                            }}/>

                            <div className="anim-4" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <button
                                    className="btn-primary btn-primary-red"
                                    onClick={() => navigate("/buyer", { state: { tab: "wallet" } })}
                                    style={{
                                        width: "100%", padding: "14px 20px",
                                        background: "linear-gradient(135deg, #b91c1c, #ef4444)",
                                        border: "none", borderRadius: 14,
                                        color: "white", fontFamily: "'Sora', sans-serif",
                                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        boxShadow: "0 4px 20px rgba(239,68,68,.25)",
                                        transition: "all .2s",
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="1 4 1 10 7 10"/>
                                        <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                                    </svg>
                                    Thử lại
                                </button>
                                <button
                                    className="btn-ghost"
                                    onClick={() => navigate("/buyer")}
                                    style={{
                                        width: "100%", padding: "13px 20px",
                                        background: "rgba(255,255,255,.05)",
                                        border: "1px solid rgba(255,255,255,.09)",
                                        borderRadius: 14,
                                        color: "rgba(255,255,255,.5)",
                                        fontFamily: "'Sora', sans-serif",
                                        fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                        <polyline points="9 22 9 12 15 12 15 22"/>
                                    </svg>
                                    Về trang chủ
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}