import { useState, useEffect, useCallback } from "react";
import {
    Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, CreditCard,
    Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
    Banknote, Shield, Zap, TrendingUp, Copy, ExternalLink,
} from "lucide-react";
import {
    getWalletAPI,
    getTransactionsAPI,
    createVNPayPaymentURL,
    withdrawWalletAPI,
} from "../../services/Buyer/walletService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WalletData {
    availablePoints: number;
    frozenPoints:    number;
    userId:          number;
    updatedAt?:      string;
}

interface Transaction {
    id:          number | string;
    type:        "DEPOSIT" | "WITHDRAW" | "PAYMENT" | string;
    amount:      number;
    status:      "SUCCESS" | "PENDING" | "FAILED" | string;
    createdAt?:  string;
    description?: string;
    referenceId?: string;
}

interface Summary {
    totalAmount?: number;
    totalCount?:  number;
}

type TabType = "overview" | "deposit" | "withdraw" | "history";

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

const fmtPoints = (p: number) =>
    new Intl.NumberFormat("vi-VN").format(p) + " điểm";

const fmtVND = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const fmtDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WalletPage() {
    const [tab,          setTab]         = useState<TabType>("overview");
    const [wallet,       setWallet]      = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary,      setSummary]     = useState<Summary>({});
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [loadingTx,    setLoadingTx]   = useState(false);
    const [txFilter,     setTxFilter]    = useState("");

    // Deposit state
    const [depositAmount,  setDepositAmount]  = useState("");
    const [depositLoading, setDepositLoading] = useState(false);
    const [depositError,   setDepositError]   = useState("");

    // Withdraw state
    const [withdrawAmount,  setWithdrawAmount]  = useState("");
    const [withdrawBank,    setWithdrawBank]    = useState("");
    const [withdrawAccount, setWithdrawAccount] = useState("");
    const [withdrawName,    setWithdrawName]    = useState("");
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawError,   setWithdrawError]   = useState("");
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);

    const fetchWallet = useCallback(async () => {
        setLoadingWallet(true);
        try {
            const data = await getWalletAPI();
            setWallet(data);
        } catch {
            // mock fallback
            setWallet({ availablePoints: 0, frozenPoints: 0, userId: 1 });
        } finally {
            setLoadingWallet(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        setLoadingTx(true);
        try {
            const { list, summary: sum } = await getTransactionsAPI(txFilter);
            setTransactions(list);
            setSummary(sum);
        } catch {
            setTransactions([]);
        } finally {
            setLoadingTx(false);
        }
    }, [txFilter]);

    useEffect(() => { fetchWallet(); }, [fetchWallet]);
    useEffect(() => { if (tab === "history") fetchTransactions(); }, [tab, fetchTransactions]);

    // ── Deposit via VNPay ──────────────────────────────────────────────────────
    const handleDeposit = async () => {
        const amount = Number(depositAmount);
        if (!amount || amount < 10000) {
            setDepositError("Số tiền nạp tối thiểu là 10,000đ");
            return;
        }
        setDepositLoading(true);
        setDepositError("");
        try {
            const payUrl = await createVNPayPaymentURL(amount);
            console.log("[VNPay] Payment URL:", payUrl); // debug — kiểm tra URL có đúng không
            if (payUrl && typeof payUrl === "string" && payUrl.startsWith("http")) {
                // Dùng window.location.replace để redirect ngay, tránh delay
                window.location.replace(payUrl);
            } else {
                setDepositError("Không nhận được link thanh toán hợp lệ từ server.");
            }
        } catch (err: unknown) {
            setDepositError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setDepositLoading(false);
        }
    };

    // ── Withdraw ───────────────────────────────────────────────────────────────
    const handleWithdraw = async () => {
        const amount = Number(withdrawAmount);
        if (!amount || amount < 10000) { setWithdrawError("Tối thiểu 10,000đ"); return; }
        if (!withdrawBank)    { setWithdrawError("Vui lòng nhập tên ngân hàng"); return; }
        if (!withdrawAccount) { setWithdrawError("Vui lòng nhập số tài khoản"); return; }
        if (!withdrawName)    { setWithdrawError("Vui lòng nhập tên chủ tài khoản"); return; }
        if (wallet && amount > wallet.availablePoints) { setWithdrawError("Số dư không đủ"); return; }

        setWithdrawLoading(true);
        setWithdrawError("");
        try {
            await withdrawWalletAPI({ amount, bankName: withdrawBank, bankAccount: withdrawAccount, accountName: withdrawName });
            setWithdrawSuccess(true);
            setWithdrawAmount(""); setWithdrawBank(""); setWithdrawAccount(""); setWithdrawName("");
            fetchWallet();
        } catch (err: unknown) {
            setWithdrawError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setWithdrawLoading(false);
        }
    };

    const available = wallet?.availablePoints ?? 0;
    const frozen    = wallet?.frozenPoints    ?? 0;

    return (
        <div>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        .wl-tab{cursor:pointer;transition:all .15s;border-radius:10px;font-weight:500}
        .wl-tab:hover{background:rgba(59,130,246,.06)}
        .wl-tab.on{background:#eff6ff;color:#2563eb;font-weight:700}
        .amount-chip{cursor:pointer;transition:all .15s;border:1.5px solid #e8ecf4;border-radius:9px;padding:8px 0;text-align:center;font-size:13px;font-weight:600;color:#374151;background:white}
        .amount-chip:hover{border-color:#3b82f6;color:#2563eb;background:#eff6ff}
        .amount-chip.on{border-color:#2563eb;color:#2563eb;background:#eff6ff}
        .wl-input{border:1.5px solid #e8ecf4;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;width:100%;transition:border .15s;font-family:inherit;color:#1e293b}
        .wl-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
        .tx-row{transition:background .12s;border-radius:10px}
        .tx-row:hover{background:#f8fafc}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
        .pulse{animation:pulse 1.4s infinite}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .fade-in{animation:fadeIn .3s ease}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite}
        @keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .count-up{animation:countUp .5s ease}
      `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:"#0f172a", display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Wallet size={19} color="white"/>
                    </div>
                    Ví của tôi
                </h1>
                <p style={{ color:"#94a3b8", fontSize:13, marginTop:5 }}>Quản lý số dư, nạp tiền và rút tiền</p>
            </div>

            {/* ── Balance Cards ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:24 }}>
                {/* Available */}
                <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1e40af)", borderRadius:16, padding:"22px 24px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", right:-20, top:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.06)" }}/>
                    <div style={{ position:"absolute", right:30, bottom:-30, width:70, height:70, borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                        <Zap size={14} color="#93c5fd"/>
                        <span style={{ color:"#93c5fd", fontSize:12, fontWeight:600 }}>Số dư khả dụng</span>
                    </div>
                    {loadingWallet
                        ? <div style={{ height:32, background:"rgba(255,255,255,.1)", borderRadius:6, width:"70%" }} className="pulse"/>
                        : <div className="count-up" style={{ fontSize:28, fontWeight:800, color:"white", lineHeight:1 }}>{fmtPoints(available)}</div>
                    }
                    <div style={{ color:"#60a5fa", fontSize:12, marginTop:8 }}>≈ {fmtVND(available)}</div>
                </div>

                {/* Frozen */}
                <div style={{ background:"white", borderRadius:16, padding:"22px 24px", border:"1.5px solid #e8ecf4" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                        <Shield size={14} color="#94a3b8"/>
                        <span style={{ color:"#94a3b8", fontSize:12, fontWeight:600 }}>Đang giữ</span>
                    </div>
                    {loadingWallet
                        ? <div style={{ height:28, background:"#f4f6fb", borderRadius:6, width:"60%" }} className="pulse"/>
                        : <div style={{ fontSize:24, fontWeight:800, color:"#475569" }}>{fmtPoints(frozen)}</div>
                    }
                    <div style={{ color:"#94a3b8", fontSize:12, marginTop:8 }}>Chờ xác nhận giao dịch</div>
                </div>

                {/* Total */}
                <div style={{ background:"white", borderRadius:16, padding:"22px 24px", border:"1.5px solid #e8ecf4" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                        <TrendingUp size={14} color="#16a34a"/>
                        <span style={{ color:"#16a34a", fontSize:12, fontWeight:600 }}>Tổng ví</span>
                    </div>
                    {loadingWallet
                        ? <div style={{ height:28, background:"#f4f6fb", borderRadius:6, width:"65%" }} className="pulse"/>
                        : <div style={{ fontSize:24, fontWeight:800, color:"#0f172a" }}>{fmtPoints(available + frozen)}</div>
                    }
                    <div style={{ color:"#94a3b8", fontSize:12, marginTop:8 }}>Khả dụng + Đang giữ</div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
                {[
                    { id:"deposit",  icon:ArrowDownLeft, label:"Nạp tiền",  color:"#2563eb", bg:"#eff6ff" },
                    { id:"withdraw", icon:ArrowUpRight,  label:"Rút tiền",  color:"#16a34a", bg:"#f0fdf4" },
                    { id:"history",  icon:Clock,         label:"Lịch sử",   color:"#7c3aed", bg:"#f5f3ff" },
                ].map(a => (
                    <button key={a.id} onClick={() => setTab(a.id as TabType)}
                            style={{ background:tab===a.id?a.bg:"white", border:`1.5px solid ${tab===a.id?a.color:"#e8ecf4"}`, borderRadius:13, padding:"16px 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all .15s" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=a.color;e.currentTarget.style.background=a.bg}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=tab===a.id?a.color:"#e8ecf4";e.currentTarget.style.background=tab===a.id?a.bg:"white"}}
                    >
                        <div style={{ width:40, height:40, borderRadius:11, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <a.icon size={20} color={a.color}/>
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:tab===a.id?a.color:"#374151" }}>{a.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div style={{ background:"white", borderRadius:16, border:"1.5px solid #e8ecf4", overflow:"hidden" }}>

                {/* Tab nav */}
                <div style={{ display:"flex", gap:4, padding:"14px 18px", borderBottom:"1px solid #f1f5f9" }}>
                    {[
                        { id:"overview", label:"Tổng quan" },
                        { id:"deposit",  label:"Nạp tiền"  },
                        { id:"withdraw", label:"Rút tiền"  },
                        { id:"history",  label:"Lịch sử"   },
                    ].map(t => (
                        <button key={t.id} className={`wl-tab${tab===t.id?" on":""}`}
                                onClick={() => setTab(t.id as TabType)}
                                style={{ padding:"7px 16px", border:"none", background:"transparent", fontSize:13, color:tab===t.id?"#2563eb":"#64748b", cursor:"pointer" }}>
                            {t.label}
                        </button>
                    ))}
                    <button onClick={fetchWallet} style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"6px 12px", border:"1.5px solid #e8ecf4", borderRadius:8, background:"white", fontSize:12, color:"#64748b", cursor:"pointer" }}>
                        <RefreshCw size={12} className={loadingWallet?"spin":""}/> Làm mới
                    </button>
                </div>

                <div style={{ padding:"24px" }}>

                    {/* ── OVERVIEW ── */}
                    {tab==="overview" && (
                        <div className="fade-in">
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                                <div style={{ background:"#f8fafc", borderRadius:12, padding:"18px" }}>
                                    <div style={{ fontSize:12, color:"#94a3b8", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Nạp tiền qua VNPay</div>
                                    <p style={{ fontSize:13, color:"#475569", lineHeight:1.7 }}>
                                        Nạp tiền vào ví bằng thẻ ATM, Internet Banking hoặc thẻ quốc tế qua cổng thanh toán VNPay an toàn.
                                    </p>
                                    <button onClick={() => setTab("deposit")} style={{ marginTop:12, display:"flex", alignItems:"center", gap:5, padding:"8px 14px", background:"#2563eb", color:"white", border:"none", borderRadius:8, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
                                        Nạp ngay <ChevronRight size={13}/>
                                    </button>
                                </div>
                                <div style={{ background:"#f8fafc", borderRadius:12, padding:"18px" }}>
                                    <div style={{ fontSize:12, color:"#94a3b8", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Rút tiền về ngân hàng</div>
                                    <p style={{ fontSize:13, color:"#475569", lineHeight:1.7 }}>
                                        Yêu cầu rút tiền về tài khoản ngân hàng. Admin sẽ xét duyệt trong 1–3 ngày làm việc.
                                    </p>
                                    <button onClick={() => setTab("withdraw")} style={{ marginTop:12, display:"flex", alignItems:"center", gap:5, padding:"8px 14px", background:"#0f172a", color:"white", border:"none", borderRadius:8, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
                                        Rút tiền <ChevronRight size={13}/>
                                    </button>
                                </div>
                            </div>

                            {/* Info boxes */}
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                                {[
                                    { icon:Shield,   color:"#2563eb", bg:"#eff6ff", title:"Bảo mật",       desc:"Giao dịch mã hóa SSL, bảo vệ toàn diện" },
                                    { icon:Zap,      color:"#d97706", bg:"#fffbeb", title:"Tức thì",        desc:"Nạp tiền thành công trong vòng vài giây" },
                                    { icon:Banknote, color:"#16a34a", bg:"#f0fdf4", title:"Miễn phí",       desc:"Không thu phí giao dịch nạp/rút tiền"   },
                                ].map(info => (
                                    <div key={info.title} style={{ borderRadius:11, padding:"14px", border:"1.5px solid #e8ecf4", display:"flex", gap:10 }}>
                                        <div style={{ width:36, height:36, borderRadius:9, background:info.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                            <info.icon size={17} color={info.color}/>
                                        </div>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:3 }}>{info.title}</div>
                                            <div style={{ fontSize:11.5, color:"#64748b", lineHeight:1.5 }}>{info.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── DEPOSIT ── */}
                    {tab==="deposit" && (
                        <div className="fade-in" style={{ maxWidth:480 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:9, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    <ArrowDownLeft size={17} color="#2563eb"/>
                                </div>
                                <div>
                                    <div style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>Nạp tiền qua VNPay</div>
                                    <div style={{ fontSize:12, color:"#94a3b8" }}>Hỗ trợ ATM, Internet Banking, thẻ quốc tế</div>
                                </div>
                            </div>

                            {/* Quick amounts */}
                            <div style={{ marginBottom:16 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>Chọn nhanh</div>
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                                    {QUICK_AMOUNTS.map(a => (
                                        <button key={a} className={`amount-chip${depositAmount===String(a)?" on":""}`}
                                                onClick={() => setDepositAmount(String(a))}>
                                            {fmtVND(a)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom amount */}
                            <div style={{ marginBottom:20 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.5px" }}>Hoặc nhập số tiền</div>
                                <div style={{ position:"relative" }}>
                                    <input className="wl-input" type="number" placeholder="Nhập số tiền (đ)" value={depositAmount}
                                           onChange={e => { setDepositAmount(e.target.value); setDepositError(""); }}
                                           style={{ paddingRight:60 }}/>
                                    <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94a3b8", fontWeight:600 }}>VNĐ</span>
                                </div>
                                {depositAmount && Number(depositAmount) >= 10000 && (
                                    <div style={{ fontSize:12, color:"#16a34a", marginTop:5, fontWeight:500 }}>
                                        ≈ {fmtPoints(Number(depositAmount))} sẽ được cộng vào ví
                                    </div>
                                )}
                            </div>

                            {depositError && (
                                <div style={{ marginBottom:16, padding:"10px 13px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:9, color:"#e11d48", fontSize:13, display:"flex", alignItems:"center", gap:7 }}>
                                    <AlertCircle size={14}/> {depositError}
                                </div>
                            )}

                            {/* VNPay info */}
                            <div style={{ background:"#f8fafc", borderRadius:11, padding:"13px 15px", marginBottom:18, display:"flex", gap:10, alignItems:"flex-start" }}>
                                <CreditCard size={16} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
                                <div style={{ fontSize:12.5, color:"#475569", lineHeight:1.6 }}>
                                    Bạn sẽ được chuyển sang trang thanh toán <strong>VNPay Sandbox</strong> để hoàn tất giao dịch. Sau khi thanh toán thành công, số dư sẽ được cộng tự động.
                                </div>
                            </div>

                            <button onClick={handleDeposit} disabled={depositLoading || !depositAmount || Number(depositAmount) < 10000}
                                    style={{ width:"100%", padding:"13px 0", background: depositLoading||!depositAmount||Number(depositAmount)<10000?"#e2e8f0":"#2563eb", color:depositLoading||!depositAmount||Number(depositAmount)<10000?"#94a3b8":"white", border:"none", borderRadius:11, fontSize:14, fontWeight:700, cursor: depositLoading||!depositAmount||Number(depositAmount)<10000?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background .15s" }}>
                                {depositLoading ? <><RefreshCw size={16} className="spin"/> Đang xử lý...</> : <><ExternalLink size={15}/> Thanh toán qua VNPay</>}
                            </button>
                        </div>
                    )}

                    {/* ── WITHDRAW ── */}
                    {tab==="withdraw" && (
                        <div className="fade-in" style={{ maxWidth:480 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                                <div style={{ width:34, height:34, borderRadius:9, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    <ArrowUpRight size={17} color="#16a34a"/>
                                </div>
                                <div>
                                    <div style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>Yêu cầu rút tiền</div>
                                    <div style={{ fontSize:12, color:"#94a3b8" }}>Xét duyệt trong 1–3 ngày làm việc</div>
                                </div>
                            </div>

                            {/* Balance notice */}
                            <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:11, padding:"12px 15px", marginBottom:18, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                <span style={{ fontSize:13, color:"#15803d", fontWeight:500 }}>Số dư khả dụng</span>
                                <span style={{ fontSize:16, fontWeight:800, color:"#15803d" }}>{fmtPoints(available)}</span>
                            </div>

                            {withdrawSuccess && (
                                <div style={{ marginBottom:16, padding:"12px 15px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, color:"#15803d", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
                                    <CheckCircle size={16}/> Yêu cầu rút tiền đã được gửi! Admin sẽ xử lý trong 1–3 ngày.
                                </div>
                            )}

                            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                                {/* Amount */}
                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Số tiền rút</label>
                                    <div style={{ position:"relative" }}>
                                        <input className="wl-input" type="number" placeholder="Nhập số tiền muốn rút" value={withdrawAmount}
                                               onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(""); setWithdrawSuccess(false); }}
                                               style={{ paddingRight:60 }}/>
                                        <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94a3b8", fontWeight:600 }}>VNĐ</span>
                                    </div>
                                </div>

                                {/* Bank name */}
                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Tên ngân hàng</label>
                                    <input className="wl-input" placeholder="VD: Vietcombank, Techcombank..." value={withdrawBank}
                                           onChange={e => { setWithdrawBank(e.target.value); setWithdrawError(""); }}/>
                                </div>

                                {/* Account number */}
                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Số tài khoản</label>
                                    <div style={{ position:"relative" }}>
                                        <input className="wl-input" placeholder="Nhập số tài khoản" value={withdrawAccount}
                                               onChange={e => { setWithdrawAccount(e.target.value); setWithdrawError(""); }}/>
                                        {withdrawAccount && (
                                            <button onClick={() => { navigator.clipboard.writeText(withdrawAccount); }}
                                                    style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", border:"none", background:"none", cursor:"pointer", color:"#94a3b8" }}>
                                                <Copy size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Account name */}
                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>Tên chủ tài khoản</label>
                                    <input className="wl-input" placeholder="Nhập tên chủ tài khoản (IN HOA)" value={withdrawName}
                                           onChange={e => { setWithdrawName(e.target.value.toUpperCase()); setWithdrawError(""); }}/>
                                </div>
                            </div>

                            {withdrawError && (
                                <div style={{ marginTop:14, padding:"10px 13px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:9, color:"#e11d48", fontSize:13, display:"flex", alignItems:"center", gap:7 }}>
                                    <AlertCircle size={14}/> {withdrawError}
                                </div>
                            )}

                            <button onClick={handleWithdraw} disabled={withdrawLoading}
                                    style={{ width:"100%", marginTop:18, padding:"13px 0", background:withdrawLoading?"#e2e8f0":"#0f172a", color:withdrawLoading?"#94a3b8":"white", border:"none", borderRadius:11, fontSize:14, fontWeight:700, cursor:withdrawLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background .15s" }}
                                    onMouseEnter={e=>{ if(!withdrawLoading) e.currentTarget.style.background="#2563eb" }}
                                    onMouseLeave={e=>{ if(!withdrawLoading) e.currentTarget.style.background="#0f172a" }}>
                                {withdrawLoading ? <><RefreshCw size={16} className="spin"/> Đang gửi...</> : <><ArrowUpRight size={16}/> Gửi yêu cầu rút tiền</>}
                            </button>
                        </div>
                    )}

                    {/* ── HISTORY ── */}
                    {tab==="history" && (
                        <div className="fade-in">
                            {/* Filter tabs */}
                            <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                                {[
                                    { value:"",        label:"Tất cả"   },
                                    { value:"DEPOSIT", label:"Nạp tiền" },
                                    { value:"WITHDRAW",label:"Rút tiền" },
                                    { value:"PAYMENT", label:"Thanh toán"},
                                ].map(f => (
                                    <button key={f.value}
                                            onClick={() => setTxFilter(f.value)}
                                            style={{ padding:"6px 14px", borderRadius:18, border:`1.5px solid ${txFilter===f.value?"#3b82f6":"#e8ecf4"}`, background:txFilter===f.value?"#eff6ff":"white", color:txFilter===f.value?"#2563eb":"#64748b", fontSize:12.5, fontWeight:txFilter===f.value?700:500, cursor:"pointer", transition:"all .13s" }}>
                                        {f.label}
                                    </button>
                                ))}

                                {/* Summary */}
                                {summary.totalCount != null && summary.totalCount > 0 && (
                                    <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
                                        <span style={{ fontSize:12, color:"#94a3b8" }}>{summary.totalCount} giao dịch</span>
                                        {summary.totalAmount != null && (
                                            <span style={{ fontSize:12, fontWeight:700, color:"#2563eb" }}>{fmtVND(summary.totalAmount)}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Transaction list */}
                            {loadingTx ? (
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                    {[1,2,3,4].map(i => (
                                        <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0" }}>
                                            <div style={{ width:40, height:40, borderRadius:10, background:"#f4f6fb" }} className="pulse"/>
                                            <div style={{ flex:1 }}>
                                                <div style={{ height:13, background:"#f4f6fb", borderRadius:4, marginBottom:6, width:"55%" }} className="pulse"/>
                                                <div style={{ height:11, background:"#f4f6fb", borderRadius:4, width:"35%" }} className="pulse"/>
                                            </div>
                                            <div style={{ height:18, background:"#f4f6fb", borderRadius:4, width:80 }} className="pulse"/>
                                        </div>
                                    ))}
                                </div>
                            ) : transactions.length === 0 ? (
                                <div style={{ textAlign:"center", padding:"40px 0" }}>
                                    <Clock size={40} color="#e2e8f0" style={{ marginBottom:12 }}/>
                                    <p style={{ color:"#94a3b8", fontSize:13 }}>Chưa có giao dịch nào.</p>
                                </div>
                            ) : (
                                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                    {transactions.map((tx, idx) => {
                                        const isDeposit  = tx.type === "DEPOSIT";
                                        const isWithdraw = tx.type === "WITHDRAW";
                                        const icon  = isDeposit ? ArrowDownLeft : isWithdraw ? ArrowUpRight : CreditCard;
                                        const color = isDeposit ? "#16a34a" : isWithdraw ? "#e11d48" : "#7c3aed";
                                        const bg    = isDeposit ? "#f0fdf4"  : isWithdraw ? "#fff1f2"  : "#f5f3ff";
                                        const statusIcon = tx.status==="SUCCESS" ? CheckCircle : tx.status==="FAILED" ? XCircle : Clock;
                                        const statusColor = tx.status==="SUCCESS" ? "#16a34a" : tx.status==="FAILED" ? "#e11d48" : "#d97706";

                                        return (
                                            <div key={tx.id ?? idx} className="tx-row" style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 10px" }}>
                                                <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                                    {(() => { const Icon = icon; return <Icon size={18} color={color}/>; })()}
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>
                                                        {isDeposit ? "Nạp tiền" : isWithdraw ? "Rút tiền" : "Thanh toán"}
                                                        {tx.description && <span style={{ fontWeight:400, color:"#64748b" }}> · {tx.description}</span>}
                                                    </div>
                                                    <div style={{ fontSize:11.5, color:"#94a3b8", marginTop:2 }}>{fmtDate(tx.createdAt)}</div>
                                                </div>
                                                <div style={{ textAlign:"right", flexShrink:0 }}>
                                                    <div style={{ fontSize:14, fontWeight:800, color }}>
                                                        {isDeposit ? "+" : "−"}{fmtVND(tx.amount)}
                                                    </div>
                                                    <div style={{ display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end", marginTop:3 }}>
                                                        {(() => { const Icon = statusIcon; return <Icon size={11} color={statusColor}/>; })()}
                                                        <span style={{ fontSize:11, color:statusColor, fontWeight:500 }}>
                              {tx.status==="SUCCESS"?"Thành công":tx.status==="FAILED"?"Thất bại":"Đang xử lý"}
                            </span>
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