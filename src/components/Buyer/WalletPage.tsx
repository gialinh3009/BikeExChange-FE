import { useState, useEffect } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Plus, History, RefreshCw, Banknote } from "lucide-react";
import { getWalletAPI, getTransactionsAPI, createVNPayPaymentURL, withdrawWalletAPI } from "../../services/Buyer/walletService";

interface WalletData {
    userId: number;
    availablePoints: number;
    frozenPoints: number;
}

interface Transaction {
    id: number;
    type: "DEPOSIT" | "WITHDRAW" | "ESCROW";
    amount: number;
    status: "SUCCESS" | "PENDING" | "FAILED";
    createdAt: string;
    referenceId?: string;
}

type TabType = "overview" | "deposit" | "withdraw" | "history";

const fmtPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function WalletPage({ initialTab = "overview" }: { initialTab?: TabType }) {
    const [tab, setTab] = useState<TabType>(initialTab as TabType);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [depositAmount, setDepositAmount] = useState("100000");
    const [depositing, setDepositing] = useState(false);
    const [depositError, setDepositError] = useState("");
    const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankName: "", bankAccount: "", accountName: "" });
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawError, setWithdrawError] = useState("");
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);

    // Fetch wallet
    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const data = await getWalletAPI();
                setWallet(data);
            } catch (e) {
                console.error("Error fetching wallet:", e);
            } finally {
                setLoading(false);
            }
        };
        void fetchWallet();
    }, []);

    // Fetch transactions when switching to history tab
    useEffect(() => {
        if (tab === "history") {
            const fetchTx = async () => {
                try {
                    const { list } = await getTransactionsAPI();
                    setTransactions(Array.isArray(list) ? list : []);
                } catch (e) {
                    console.error("Error fetching transactions:", e);
                    setTransactions([]);
                }
            };
            void fetchTx();
        }
    }, [tab]);

    const handleDeposit = async () => {
        const amount = parseInt(depositAmount);
        if (!amount || amount < 10000) {
            setDepositError("Số tiền tối thiểu là 10.000đ");
            return;
        }
        setDepositing(true);
        setDepositError("");
        try {
            const payUrl = await createVNPayPaymentURL(amount);
            if (payUrl && typeof payUrl === "string" && payUrl.startsWith("http")) {
                window.location.replace(payUrl);
            } else {
                setDepositError("Không nhận được link thanh toán. Vui lòng thử lại.");
            }
        } catch (e) {
            setDepositError(e instanceof Error ? e.message : "Có lỗi xảy ra");
        } finally {
            setDepositing(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawForm.amount);
        if (!amount || amount <= 0) { setWithdrawError("Vui lòng nhập số tiền hợp lệ"); return; }
        if (!withdrawForm.bankName.trim()) { setWithdrawError("Vui lòng nhập tên ngân hàng"); return; }
        if (!withdrawForm.bankAccount.trim()) { setWithdrawError("Vui lòng nhập số tài khoản"); return; }
        if (!withdrawForm.accountName.trim()) { setWithdrawError("Vui lòng nhập tên chủ tài khoản"); return; }
        if (amount > (wallet?.availablePoints ?? 0)) { setWithdrawError("Số dư không đủ"); return; }
        setWithdrawing(true);
        setWithdrawError("");
        try {
            await withdrawWalletAPI({ amount, bankName: withdrawForm.bankName, bankAccount: withdrawForm.bankAccount, accountName: withdrawForm.accountName });
            setWithdrawSuccess(true);
            setWithdrawForm({ amount: "", bankName: "", bankAccount: "", accountName: "" });
            // Refresh wallet balance
            const data = await getWalletAPI();
            setWallet(data);
        } catch (e) {
            setWithdrawError(e instanceof Error ? e.message : "Có lỗi xảy ra");
        } finally {
            setWithdrawing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === "SUCCESS") return CheckCircle;
        if (status === "FAILED") return XCircle;
        return Clock;
    };

    const getStatusColor = (status: string) => {
        if (status === "SUCCESS") return "#16a34a";
        if (status === "FAILED") return "#e11d48";
        return "#d97706";
    };

    return (
        <div style={{ fontFamily: "'DM Sans',sans-serif", padding: "24px", background: "#f4f6fb", minHeight: "100vh" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        .tab-btn { border: none; background: transparent; padding: 12px 16px; font-size: 13px; fontWeight: 600; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
        .amount-chip { cursor: pointer; border: 1.5px solid #e8ecf4; border-radius: 9px; padding: 10px 14px; text-align: center; font-size: 13px; font-weight: 600; color: #374151; background: white; transition: all 0.15s; }
        .amount-chip:hover, .amount-chip.on { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }
        .wl-input { border: 1.5px solid #e8ecf4; border-radius: 10px; padding: 11px 14px; font-size: 14px; outline: none; width: 100%; transition: border 0.15s; font-family: inherit; color: #1e293b; }
        .wl-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
      `}</style>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 9 }}>
                    <Wallet size={22} /> Ví của tôi
                </h1>
                <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 5 }}>Quản lý số dư, nạp tiền và rút tiền</p>
            </div>

            {/* Balance Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                {/* Khả dụng */}
                <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)", borderRadius: 16, padding: "24px", color: "white" }}>
                    <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>💰 Số dư khả dụng</p>
                    <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
                        {loading ? "..." : (wallet?.availablePoints ?? 0).toLocaleString()} điểm
                    </h2>
                    <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>≈ {loading ? "..." : fmtPrice(wallet?.availablePoints ?? 0)}</p>
                </div>

                {/* Đang giữ */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1.5px solid #e8ecf4" }}>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>⏸ Đang giữ</p>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#475569", margin: 0 }}>
                        {loading ? "..." : (wallet?.frozenPoints ?? 0).toLocaleString()} điểm
                    </h2>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Chờ xác nhận giao dịch</p>
                </div>

                {/* Tổng */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1.5px solid #e8ecf4" }}>
                    <p style={{ fontSize: 12, color: "#16a34a", marginBottom: 8 }}>📊 Tổng ví</p>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {loading ? "..." : ((wallet?.availablePoints ?? 0) + (wallet?.frozenPoints ?? 0)).toLocaleString()} điểm
                    </h2>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Khả dụng + Đang giữ</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f1f5f9", padding: "0 16px" }}>
                    {[
                        { id: "overview", label: "Tổng quan", icon: "📋" },
                        { id: "deposit", label: "Nạp tiền", icon: "⬇️" },
                        { id: "withdraw", label: "Rút tiền", icon: "⬆️" },
                        { id: "history", label: "Lịch sử", icon: "📜" },
                    ].map(t => (
                        <button
                            key={t.id}
                            className={`tab-btn${tab === t.id ? " active" : ""}`}
                            onClick={() => setTab(t.id as TabType)}
                            style={{ borderBottom: tab === t.id ? "2px solid #3b82f6" : "none", color: tab === t.id ? "#3b82f6" : "#94a3b8" }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: "24px" }}>
                    {/* Overview Tab */}
                    {tab === "overview" && (
                        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div style={{ background: "#eff6ff", borderRadius: 12, padding: "18px" }}>
                                <div style={{ fontSize: 12, color: "#2563eb", marginBottom: 8, fontWeight: 600 }}>💳 Nạp tiền qua VNPay</div>
                                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>Nạp tiền bằng thẻ ATM, Internet Banking hoặc thẻ quốc tế.</p>
                                <button onClick={() => setTab("deposit")} style={{ marginTop: 12, padding: "8px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                                    Nạp ngay →
                                </button>
                            </div>
                            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "18px" }}>
                                <div style={{ fontSize: 12, color: "#16a34a", marginBottom: 8, fontWeight: 600 }}>🏦 Rút tiền về ngân hàng</div>
                                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>Yêu cầu rút tiền. Admin xét duyệt trong 1-3 ngày.</p>
                                <button onClick={() => setTab("withdraw")} style={{ marginTop: 12, padding: "8px 14px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                                    Rút tiền →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Deposit Tab */}
                    {tab === "deposit" && (
                        <div className="fade-in" style={{ maxWidth: 480 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Nạp tiền qua VNPay</h3>

                            {/* Quick amounts */}
                            <div style={{ marginBottom: 16 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>CHỌN NHANH</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                                    {QUICK_AMOUNTS.map(a => (
                                        <button
                                            key={a}
                                            className={`amount-chip${depositAmount === String(a) ? " on" : ""}`}
                                            onClick={() => setDepositAmount(String(a))}
                                        >
                                            {fmtPrice(a)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom amount */}
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>HOẶC NHẬP SỐ TIỀN</p>
                                <div style={{ position: "relative" }}>
                                    <input
                                        className="wl-input"
                                        type="number"
                                        placeholder="Nhập số tiền"
                                        value={depositAmount}
                                        onChange={e => { setDepositAmount(e.target.value); setDepositError(""); }}
                                        style={{ paddingRight: 50 }}
                                    />
                                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>VNĐ</span>
                                </div>
                                {depositAmount && Number(depositAmount) >= 10000 && (
                                    <p style={{ fontSize: 12, color: "#16a34a", marginTop: 6, fontWeight: 500 }}>
                                        ≈ {Number(depositAmount).toLocaleString()} điểm sẽ được cộng vào ví
                                    </p>
                                )}
                            </div>

                            {depositError && (
                                <div style={{ marginBottom: 16, padding: "10px 13px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 9, color: "#e11d48", fontSize: 13 }}>
                                    ⚠️ {depositError}
                                </div>
                            )}

                            <button
                                onClick={handleDeposit}
                                disabled={depositing || !depositAmount || Number(depositAmount) < 10000}
                                style={{
                                    width: "100%",
                                    padding: "12px 0",
                                    background: depositing || !depositAmount || Number(depositAmount) < 10000 ? "#e2e8f0" : "#2563eb",
                                    color: depositing || !depositAmount || Number(depositAmount) < 10000 ? "#94a3b8" : "white",
                                    border: "none",
                                    borderRadius: 10,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: depositing || !depositAmount || Number(depositAmount) < 10000 ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                }}
                            >
                                {depositing ? (
                                    <>
                                        <RefreshCw size={16} className="spin" /> Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} /> Thanh toán qua VNPay
                                    </>
                                )}
                            </button>
                        </div>
                    )}


                    {/* Withdraw Tab */}
                    {tab === "withdraw" && (
                        <div className="fade-in" style={{ maxWidth: 480 }}>
                            {withdrawSuccess ? (
                                <div style={{ textAlign: "center", padding: "32px 0" }}>
                                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(34,197,94,.25)" }}>
                                        <CheckCircle size={36} color="white" />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Yêu cầu đã gửi!</h3>
                                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Admin sẽ xét duyệt trong 1-3 ngày làm việc.</p>
                                    <button onClick={() => { setWithdrawSuccess(false); setTab("overview"); }} style={{ padding: "10px 24px", background: "#0f172a", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                        Về tổng quan
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                                        <Banknote size={18} color="#0f172a" />
                                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Rút tiền về ngân hàng</h3>
                                    </div>
                                    <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
                                        Số dư khả dụng: <strong style={{ color: "#0f172a" }}>{fmtPrice(wallet?.availablePoints ?? 0)}</strong>
                                    </p>

                                    {[
                                        { label: "SỐ TIỀN RÚT (VNĐ)", key: "amount", type: "number", placeholder: "Nhập số tiền muốn rút" },
                                        { label: "TÊN NGÂN HÀNG", key: "bankName", type: "text", placeholder: "VD: Vietcombank, Techcombank..." },
                                        { label: "SỐ TÀI KHOẢN", key: "bankAccount", type: "text", placeholder: "Nhập số tài khoản" },
                                        { label: "TÊN CHỦ TÀI KHOẢN", key: "accountName", type: "text", placeholder: "Nhập đúng tên chủ tài khoản" },
                                    ].map(field => (
                                        <div key={field.key} style={{ marginBottom: 16 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{field.label}</p>
                                            <input
                                                className="wl-input"
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                value={withdrawForm[field.key as keyof typeof withdrawForm]}
                                                onChange={e => { setWithdrawForm(f => ({ ...f, [field.key]: e.target.value })); setWithdrawError(""); }}
                                            />
                                        </div>
                                    ))}

                                    {withdrawForm.amount && Number(withdrawForm.amount) > 0 && (
                                        <p style={{ fontSize: 12, color: "#e11d48", marginBottom: 16, fontWeight: 500 }}>
                                            Bạn sẽ rút <strong>{fmtPrice(Number(withdrawForm.amount))}</strong> ra khỏi ví
                                        </p>
                                    )}

                                    {withdrawError && (
                                        <div style={{ marginBottom: 16, padding: "10px 13px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 9, color: "#e11d48", fontSize: 13 }}>
                                            ⚠️ {withdrawError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleWithdraw}
                                        disabled={withdrawing}
                                        style={{ width: "100%", padding: "12px 0", background: withdrawing ? "#e2e8f0" : "#0f172a", color: withdrawing ? "#94a3b8" : "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: withdrawing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                                    >
                                        {withdrawing ? <><RefreshCw size={16} className="spin" /> Đang xử lý...</> : <><Banknote size={16} /> Gửi yêu cầu rút tiền</>}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {tab === "history" && (
                        <div className="fade-in">
                            {transactions.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0" }}>
                                    <History size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
                                    <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có giao dịch nào.</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {transactions.map(tx => {
                                        const Icon = getStatusIcon(tx.status);
                                        const isDeposit = tx.type === "DEPOSIT";
                                        return (
                                            <div
                                                key={tx.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 12,
                                                    padding: "12px 14px",
                                                    background: "#f8fafc",
                                                    borderRadius: 10,
                                                    border: "1px solid #e8ecf4",
                                                }}
                                            >
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    background: isDeposit ? "#f0fdf4" : "#fff1f2",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}>
                                                    {isDeposit ? (
                                                        <ArrowDownLeft size={18} color="#16a34a" />
                                                    ) : (
                                                        <ArrowUpRight size={18} color="#e11d48" />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                                                        {isDeposit ? "Nạp tiền" : "Rút tiền"}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                                        {fmtDate(tx.createdAt)}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: isDeposit ? "#16a34a" : "#e11d48" }}>
                                                        {isDeposit ? "+" : "−"}{fmtPrice(tx.amount)}
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 4, fontSize: 11, color: getStatusColor(tx.status), fontWeight: 600 }}>
                                                        <Icon size={11} />
                                                        {tx.status === "SUCCESS" ? "Thành công" : tx.status === "FAILED" ? "Thất bại" : "Chờ"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}