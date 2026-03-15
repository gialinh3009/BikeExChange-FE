/**
 * WalletPage.tsx
 *
 * API calls:
 *   GET /wallet                                → { availablePoints, frozenPoints }
 *   GET /orders/my-purchases?status=ESCROWED   → tính heldPoints thực tế từ orders
 *   GET /wallet/transactions                   → lịch sử giao dịch
 *   GET /vnpay/create-payment?amount=&returnUrl → VNPay payment URL
 *
 * "Đang giữ" = tổng amountPoints của tất cả đơn ESCROWED (chính xác hơn frozenPoints DB)
 */
import { useState, useEffect, useCallback } from "react";
import {
    Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle,
    XCircle, Plus, History, RefreshCw, AlertTriangle, Package,
} from "lucide-react";
import { getWalletAPI, getTransactionsAPI, createVNPayPaymentURL,withdrawWalletAPI } from "../../services/Buyer/walletService";
// Danh sách ngân hàng Việt Nam
const BANKS = [
    { code: "VCB", name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)" },
    { code: "TCB", name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)" },
    { code: "VPB", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" },
    { code: "MBB", name: "Ngân hàng TMCP Quân đội (MB Bank)" },
    { code: "BID", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)" },
    { code: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)" },
    { code: "CTG", name: "Ngân hàng TMCP Công thương Việt Nam (VietinBank)" },
    { code: "ACB", name: "Ngân hàng TMCP Á Châu (ACB)" },
    { code: "HDB", name: "Ngân hàng TMCP Phát triển TP.HCM (HDBank)" },
    { code: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)" },
    { code: "SAC", name: "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)" },
    { code: "EIB", name: "Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam (Eximbank)" },
    { code: "MSB", name: "Ngân hàng TMCP Hàng Hải Việt Nam (MSB)" },
    { code: "LPB", name: "Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)" },
    { code: "TPB", name: "Ngân hàng TMCP Tiên Phong (TPBank)" },
    { code: "ABB", name: "Ngân hàng TMCP An Bình (ABBANK)" },
    { code: "BAB", name: "Ngân hàng TMCP Bắc Á (Bac A Bank)" },
    { code: "BVB", name: "Ngân hàng TMCP Bảo Việt (BaoViet Bank)" },
    { code: "BVB", name: "Ngân hàng TMCP Bản Việt (Viet Capital Bank)" },
    { code: "CBB", name: "Ngân hàng TMCP Xây dựng (CB Bank)" },
    { code: "DAB", name: "Ngân hàng TMCP Đông Á (DongA Bank)" },
    { code: "GPB", name: "Ngân hàng TMCP Dầu khí Toàn cầu (GPBank)" },
    { code: "HBB", name: "Ngân hàng TMCP Hà Nội (Hanoi Bank)" },
    { code: "KLB", name: "Ngân hàng TMCP Kiên Long (Kienlongbank)" },
    { code: "NAB", name: "Ngân hàng TMCP Nam Á (Nam A Bank)" },
    { code: "NCB", name: "Ngân hàng TMCP Quốc Dân (NCB)" },
    { code: "NVB", name: "Ngân hàng TMCP Quốc Tế (VietNam International Bank)" },
    { code: "OCB", name: "Ngân hàng TMCP Phương Đông (OCB)" },
    { code: "PGB", name: "Ngân hàng TMCP Xăng dầu Petrolimex (PG Bank)" },
    { code: "PVB", name: "Ngân hàng TMCP Đại Chúng Việt Nam (PVcomBank)" },
    { code: "SCB", name: "Ngân hàng TMCP Sài Gòn (SCB)" },
    { code: "SEB", name: "Ngân hàng TMCP Đông Nam Á (SeABank)" },
    { code: "SSB", name: "Ngân hàng TMCP Đông Nam Á (SeABank)" },
    { code: "STB", name: "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)" },
    { code: "TCB", name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)" },
    { code: "UOB", name: "Ngân hàng TNHH MTV United Overseas Bank (UOB)" },
    { code: "VCB", name: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)" },
    { code: "VIB", name: "Ngân hàng TMCP Quốc tế Việt Nam (VIB)" },
    { code: "VPB", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" },
    { code: "VTB", name: "Ngân hàng TMCP Việt Thái (VietThai Bank)" },
    { code: "WOO", name: "Ngân hàng TNHH MTV Woori Việt Nam (Woori Bank)" }
];

const BASE = import.meta.env.VITE_API_BASE_URL as string;

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface WalletData {
    userId: number;
    availablePoints: number;
    frozenPoints: number; // từ DB — có thể không sync với orders thực tế
}

interface EscrowedOrder {
    id: number;
    bikeTitle: string;
    amountPoints: number;
}

interface Transaction {
    id: number;
    type: string;
    amount: number;
    status: "SUCCESS" | "PENDING" | "FAILED";
    createdAt: string;
    referenceId?: string;
    remarks?: string;
}

type TabType = "overview" | "deposit" | "history";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtVnd  = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
const fmtPts  = fmtVnd; // balances stored as VND — display in VND
const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("vi-VN") + " " + dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const TX_LABEL: Record<string, { label: string; sub?: string }> = {
    // Nạp / rút
    DEPOSIT:         { label: "Nạp tiền",              sub: "Nạp điểm vào ví" },
    WITHDRAW:        { label: "Rút tiền",               sub: "Rút điểm về ngân hàng" },
    WITHDRAW_REQUEST:{ label: "Yêu cầu rút tiền",       sub: "Chờ admin xét duyệt" },

    // Mua xe
    ESCROW_HOLD:     { label: "Tạm giữ điểm",          sub: "Khóa điểm khi đặt mua xe" },
    ESCROW_RELEASE:  { label: "Hoàn điểm tạm giữ",     sub: "Đơn hủy — điểm trả về ví" },
    ESCROW:          { label: "Tạm giữ điểm",          sub: "Khóa điểm khi đặt mua xe" },

    // Bán xe
    EARN:            { label: "Nhận điểm bán xe",      sub: "Giao dịch hoàn tất" },
    EARN_ESCROW:     { label: "Nhận điểm bán xe",      sub: "Giao dịch hoàn tất" },

    // Hoàn / tranh chấp
    REFUND:          { label: "Hoàn điểm",             sub: "Điểm được hoàn về ví" },
    REFUND_BUYER:    { label: "Hoàn điểm mua",         sub: "Yêu cầu hoàn hàng được duyệt" },
    DISPUTE_REFUND:  { label: "Hoàn điểm tranh chấp",  sub: "Admin đã giải quyết tranh chấp" },

    // Khác
    SPEND:           { label: "Chi điểm",              sub: undefined },
    ADMIN_ADJUST:    { label: "Điều chỉnh bởi Admin",  sub: undefined },
};

const getTxInfo = (tx: Transaction): { label: string; sub: string } => {
    const meta = TX_LABEL[tx.type];
    return {
        label: meta?.label ?? tx.type,
        sub:   tx.remarks || meta?.sub || "",
    };
};

const isIncome = (type: string) => ["DEPOSIT", "EARN", "EARN_ESCROW", "REFUND", "REFUND_BUYER", "DISPUTE_REFUND", "ESCROW_RELEASE"].includes(type);

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function WalletPage({ initialTab = "overview" }: { initialTab?: TabType }) {
    const [tab, setTab]                       = useState<TabType | "withdraw">(initialTab as TabType);
    const [wallet, setWallet]                 = useState<WalletData | null>(null);
    const [escrowedOrders, setEscrowedOrders] = useState<EscrowedOrder[]>([]);
    const [transactions, setTransactions]     = useState<Transaction[]>([]);
    const [loading, setLoading]               = useState(true);
    const [txLoading, setTxLoading]           = useState(false);
    const [depositAmt, setDepositAmt]         = useState("100000");
    const [depositing, setDepositing]         = useState(false);
    const [depositErr, setDepositErr]         = useState("");
    // Withdraw states
    const [withdrawAmt, setWithdrawAmt]       = useState("");
    const [withdrawBank, setWithdrawBank]     = useState("");
    const [withdrawAccount, setWithdrawAccount] = useState("");
    const [withdrawName, setWithdrawName]     = useState("");
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawErr, setWithdrawErr]       = useState("");
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    // Không cần banks state nữa
    // Load banks
    // Đã khai báo BANKS trực tiếp, không cần fetch
    // Withdraw handler
    const handleWithdraw = async () => {
        setWithdrawErr("");
        if (!withdrawAmt || Number(withdrawAmt) < 10000) { setWithdrawErr("Số tiền tối thiểu là 10.000đ"); return; }
        if (!withdrawBank) { setWithdrawErr("Vui lòng chọn ngân hàng"); return; }
        if (!withdrawAccount) { setWithdrawErr("Vui lòng nhập số tài khoản"); return; }
        if (!withdrawName) { setWithdrawErr("Vui lòng nhập tên chủ tài khoản"); return; }
        setWithdrawLoading(true);
        try {
            await withdrawWalletAPI({
                amount: Number(withdrawAmt),
                bankName: withdrawBank,
                bankAccount: withdrawAccount,
                accountName: withdrawName,
            });
            setWithdrawSuccess(true);
            setWithdrawAmt("");
            setWithdrawBank("");
            setWithdrawAccount("");
            setWithdrawName("");
        } catch (e) {
            setWithdrawErr(e instanceof Error ? e.message : "Có lỗi xảy ra");
        } finally {
            setWithdrawLoading(false);
        }
    };

    const token = localStorage.getItem("token") ?? "";
    const authHeader = `Bearer ${token}`;

    /* ── Fetch wallet + ESCROWED orders song song ── */
    const fetchWallet = useCallback(async () => {
        setLoading(true);
        try {
            const [walletData, ordersRes] = await Promise.all([
                getWalletAPI(),
                fetch(`${BASE}/orders/my-purchases?status=ESCROWED`, {
                    headers: { Authorization: authHeader, "Content-Type": "application/json" },
                }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
            ]);

            setWallet(walletData);

            // BuyerPurchaseHistoryResponse: mỗi item { order: { id, bikeTitle, amountPoints, ... } }
            if (ordersRes.success && Array.isArray(ordersRes.data)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setEscrowedOrders(ordersRes.data.map((p: any) => ({
                    id:           p.order.id,
                    bikeTitle:    p.order.bikeTitle,
                    amountPoints: p.order.amountPoints,
                })));
            } else {
                setEscrowedOrders([]);
            }
        } catch (e) {
            console.error("fetchWallet:", e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { void fetchWallet(); }, [fetchWallet]);

    /* ── Fetch transactions khi vào tab history ── */
    useEffect(() => {
        if (tab !== "history") return;
        setTxLoading(true);
        getTransactionsAPI()
            .then(({ list }) => setTransactions(Array.isArray(list) ? list : []))
            .catch(() => setTransactions([]))
            .finally(() => setTxLoading(false));
    }, [tab]);

    /* ── Deposit ── */
    const handleDeposit = async () => {
        const amount = parseInt(depositAmt);
        if (!amount || amount < 10_000) { setDepositErr("Số tiền tối thiểu là 10.000đ"); return; }
        setDepositing(true);
        setDepositErr("");
        try {
            const payUrl = await createVNPayPaymentURL(amount);
            if (payUrl && typeof payUrl === "string" && payUrl.startsWith("http")) {
                window.location.replace(payUrl);
            } else {
                setDepositErr("Không nhận được link thanh toán. Vui lòng thử lại.");
            }
        } catch (e) {
            setDepositErr(e instanceof Error ? e.message : "Có lỗi xảy ra");
        } finally {
            setDepositing(false);
        }
    };

    /* ── Computed ── */
    // realHeld = tổng amountPoints đơn ESCROWED — chính xác, real-time từ orders API
    const realHeld    = escrowedOrders.reduce((s, o) => s + o.amountPoints, 0);
    const dbFrozen    = wallet?.frozenPoints ?? 0;
    const outOfSync   = !loading && realHeld !== dbFrozen;
    const displayAvail = wallet?.availablePoints ?? 0;
    const displayTotal = displayAvail + realHeld;

    /* ── Status helpers ── */
    const statusIcon  = (s: string) => s === "SUCCESS" ? CheckCircle : s === "FAILED" ? XCircle : Clock;
    const statusColor = (s: string) => s === "SUCCESS" ? "#16a34a" : s === "FAILED" ? "#e11d48" : "#d97706";
    const statusLabel = (s: string) => s === "SUCCESS" ? "Thành công" : s === "FAILED" ? "Thất bại" : "Chờ";

    /* ── Shared button disabled state ── */
    const depositDisabled = depositing || !depositAmt || Number(depositAmt) < 10_000;

    return (
        <div style={{ fontFamily: "'DM Sans',sans-serif", padding: "24px", background: "#f4f6fb", minHeight: "100vh" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                .fade-in { animation: fadeIn .25s ease; }
                @keyframes spin { to{transform:rotate(360deg)} }
                .spin { animation: spin .8s linear infinite; }
                .tab-btn { border:none;background:transparent;padding:12px 16px;font-size:13px;font-weight:600;color:#94a3b8;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;font-family:inherit; }
                .tab-btn.active { color:#2563eb;border-bottom-color:#2563eb; }
                .tab-btn:hover:not(.active) { color:#475569; }
                .chip { cursor:pointer;border:1.5px solid #e8ecf4;border-radius:9px;padding:10px 14px;text-align:center;font-size:13px;font-weight:600;color:#374151;background:white;transition:all .15s;font-family:inherit; }
                .chip:hover,.chip.on { border-color:#2563eb;color:#2563eb;background:#eff6ff; }
                .wl-input { border:1.5px solid #e8ecf4;border-radius:10px;padding:11px 14px;font-size:14px;outline:none;width:100%;box-sizing:border-box;transition:border .15s;font-family:inherit;color:#1e293b; }
                .wl-input:focus { border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1); }
                .escrow-row:hover { background:#f8faff !important; }
                .tx-row:hover { background:#f1f5f9 !important; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 9, margin: 0 }}>
                        <Wallet size={22} /> Ví của tôi
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: 13, margin: "5px 0 0" }}>Quản lý số dư, nạp tiền và rút tiền</p>
                </div>
                <button onClick={() => { void fetchWallet(); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "white", border: "1.5px solid #e8ecf4", borderRadius: 9, fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    <RefreshCw size={13} /> Làm mới
                </button>
            </div>

            {/* ── Balance Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>

                {/* Số dư khả dụng */}
                <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)", borderRadius: 18, padding: 24, color: "white" }}>
                    <p style={{ fontSize: 12, opacity: .8, marginBottom: 8, fontWeight: 600, margin: "0 0 8px" }}>💰 Số dư khả dụng</p>
                    <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
                        {loading ? "..." : fmtPts(displayAvail)}
                    </h2>
                </div>

                {/* Đang giữ — realHeld từ ESCROWED orders */}
                <div style={{ background: "white", borderRadius: 18, padding: 24, border: "1.5px solid #e8ecf4" }}>
                    <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, margin: "0 0 8px" }}>⏸ Đang tạm giữ</p>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#475569", margin: 0 }}>
                        {loading ? "..." : fmtPts(realHeld)}
                    </h2>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0" }}>
                        {loading ? "..." : escrowedOrders.length > 0
                            ? `${escrowedOrders.length} đơn chờ seller xác nhận`
                            : "Không có đơn ký quỹ"}
                    </p>
                    {/* Cảnh báo nếu DB frozenPoints lệch với thực tế */}
                    {outOfSync && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 10, color: "#f59e0b", fontWeight: 600 }}>
                            <AlertTriangle size={10} />
                            DB: {fmtPts(dbFrozen)} (đang sync)
                        </div>
                    )}
                </div>

                {/* Tổng ví */}
                <div style={{ background: "white", borderRadius: 18, padding: 24, border: "1.5px solid #e8ecf4" }}>
                    <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: "0 0 8px" }}>📊 Tổng ví</p>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {loading ? "..." : fmtPts(displayTotal)}
                    </h2>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0" }}>Khả dụng + Đang giữ</p>
                </div>
            </div>

            {/* ── Escrow Breakdown — chỉ hiện khi có đơn đang giữ ── */}
            {!loading && escrowedOrders.length > 0 && (
                <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #fde68a", marginBottom: 20, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Clock size={14} color="#f59e0b" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Chi tiết tiền đang tạm giữ</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>{fmtPts(realHeld)}</span>
                    </div>
                    {escrowedOrders.map((o, i) => (
                        <div key={o.id} className="escrow-row" style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "11px 18px",
                            background: "white",
                            borderBottom: i < escrowedOrders.length - 1 ? "1px solid #f8fafc" : "none",
                            transition: "background .15s",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Package size={14} color="#f59e0b" />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {o.bikeTitle}
                                    </p>
                                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Đơn #{o.id} · Chờ seller xác nhận</p>
                                </div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", flexShrink: 0, marginLeft: 12 }}>
                                −{fmtPts(o.amountPoints)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {/* ── Tab Navigation ── */}
            <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 16px" }}>
                    {([
                        { id: "overview", label: "Tổng quan", icon: "📋" },
                        { id: "deposit",  label: "Nạp tiền",  icon: "⬇️" },
                        { id: "withdraw", label: "Rút tiền",  icon: "🏦" },
                        { id: "history",  label: "Lịch sử",   icon: "📜" },
                    ] as { id: TabType | "withdraw"; label: string; icon: string }[]).map((t) => (
                        <button
                            key={t.id}
                            className={`tab-btn${tab === t.id ? " active" : ""}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div style={{ padding: 24 }}>

                    {/* Withdraw */}
                    {tab === "withdraw" && (
                        <div className="fade-in" style={{ maxWidth: 480 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Rút tiền về ngân hàng</h3>
                            {withdrawSuccess && (
                                <div style={{ marginBottom: 14, padding: "10px 13px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, color: "#16a34a", fontSize: 13 }}>
                                    ✅ Yêu cầu rút đã được tạo. Admin sẽ xét duyệt trong 1-3 ngày.
                                </div>
                            )}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>Số tiền muốn rút</label>
                                <input className="wl-input" type="number" placeholder="Nhập số tiền"
                                       value={withdrawAmt}
                                       onChange={e => { setWithdrawAmt(e.target.value); setWithdrawErr(""); setWithdrawSuccess(false); }}
                                       style={{ paddingRight: 50 }} />
                                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>VNĐ</span>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>Ngân hàng</label>
                                <select
                                    className="wl-input"
                                    value={withdrawBank}
                                    onChange={e => {
                                        setWithdrawBank(e.target.value);
                                        setWithdrawErr("");
                                        setWithdrawSuccess(false);
                                    }}
                                >
                                    <option value="">Chọn ngân hàng</option>

                                    {BANKS.map((b, i) => (
                                        <option key={`${b.code}-${i}`} value={b.name}>
                                            {b.name}
                                        </option>
                                    ))}

                                </select>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>Số tài khoản</label>
                                <input className="wl-input" type="text" placeholder="Nhập số tài khoản"
                                       value={withdrawAccount}
                                       onChange={e => { setWithdrawAccount(e.target.value); setWithdrawErr(""); setWithdrawSuccess(false); }} />
                            </div>
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, display: "block" }}>Tên chủ tài khoản</label>
                                <input className="wl-input" type="text" placeholder="Nhập tên chủ tài khoản"
                                       value={withdrawName}
                                       onChange={e => { setWithdrawName(e.target.value); setWithdrawErr(""); setWithdrawSuccess(false); }} />
                            </div>
                            {withdrawErr && (
                                <div style={{ marginBottom: 14, padding: "10px 13px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 9, color: "#e11d48", fontSize: 13 }}>
                                    ⚠️ {withdrawErr}
                                </div>
                            )}
                            <button onClick={() => { void handleWithdraw(); }}
                                    disabled={withdrawLoading || !withdrawAmt || Number(withdrawAmt) < 10000 || !withdrawBank || !withdrawAccount || !withdrawName}
                                    style={{ width: "100%", padding: "13px 0", background: withdrawLoading ? "#e2e8f0" : "#0f172a", color: withdrawLoading ? "#94a3b8" : "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: withdrawLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                                {withdrawLoading
                                    ? <><RefreshCw size={15} className="spin" /> Đang xử lý...</>
                                    : <>🏦 Rút tiền</>}
                            </button>
                        </div>
                    )}

                    {/* Overview */}
                    {tab === "overview" && (
                        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 18 }}>
                                <p style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, margin: "0 0 8px" }}>💳 Nạp tiền qua VNPay</p>
                                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 12px" }}>
                                    Nạp tiền bằng thẻ ATM, Internet Banking hoặc thẻ quốc tế.
                                </p>
                                <button onClick={() => setTab("deposit")}
                                        style={{ padding: "8px 14px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                    Nạp ngay →
                                </button>
                            </div>
                            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 18 }}>
                                <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, margin: "0 0 8px" }}>🏦 Rút tiền về ngân hàng</p>
                                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 12px" }}>
                                    Yêu cầu rút tiền. Admin xét duyệt trong 1-3 ngày.
                                </p>
                                <button style={{ padding: "8px 14px", background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                    Rút tiền →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Deposit */}
                    {tab === "deposit" && (
                        <div className="fade-in" style={{ maxWidth: 480 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Nạp tiền qua VNPay</h3>

                            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 10px" }}>CHỌN NHANH</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
                                {QUICK_AMOUNTS.map(a => (
                                    <button key={a} className={`chip${depositAmt === String(a) ? " on" : ""}`}
                                            onClick={() => setDepositAmt(String(a))}>
                                        {fmtVnd(a)}
                                    </button>
                                ))}
                            </div>

                            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>HOẶC NHẬP SỐ TIỀN</p>
                            <div style={{ position: "relative", marginBottom: 6 }}>
                                <input className="wl-input" type="number" placeholder="Nhập số tiền"
                                       value={depositAmt}
                                       onChange={e => { setDepositAmt(e.target.value); setDepositErr(""); }}
                                       style={{ paddingRight: 50 }} />
                                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>VNĐ</span>
                            </div>
                            {Number(depositAmt) >= 10_000 && (
                                <p style={{ fontSize: 12, color: "#16a34a", margin: "0 0 16px", fontWeight: 500 }}>
                                    {fmtVnd(Number(depositAmt))} sẽ được cộng vào ví
                                </p>
                            )}

                            {depositErr && (
                                <div style={{ marginBottom: 14, padding: "10px 13px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 9, color: "#e11d48", fontSize: 13 }}>
                                    ⚠️ {depositErr}
                                </div>
                            )}

                            <button onClick={() => { void handleDeposit(); }} disabled={depositDisabled}
                                    style={{ width: "100%", padding: "13px 0", background: depositDisabled ? "#e2e8f0" : "#2563eb", color: depositDisabled ? "#94a3b8" : "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: depositDisabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                                {depositing
                                    ? <><RefreshCw size={15} className="spin" /> Đang xử lý...</>
                                    : <><Plus size={15} /> Thanh toán qua VNPay</>}
                            </button>
                        </div>
                    )}

                    {/* History */}
                    {tab === "history" && (
                        <div className="fade-in">
                            {txLoading ? (
                                <div style={{ textAlign: "center", padding: "40px 0" }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e8ecf4", borderTopColor: "#2563eb", animation: "spin .8s linear infinite", margin: "0 auto" }} />
                                </div>
                            ) : transactions.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0" }}>
                                    <History size={40} color="#e2e8f0" style={{ display: "block", margin: "0 auto 12px" }} />
                                    <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có giao dịch nào.</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {transactions.map(tx => {
                                        const income = isIncome(tx.type);
                                        const Icon   = statusIcon(tx.status);
                                        return (
                                            <div key={tx.id} className="tx-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e8ecf4", transition: "background .15s" }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: income ? "#f0fdf4" : "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    {income ? <ArrowDownLeft size={18} color="#16a34a" /> : <ArrowUpRight size={18} color="#e11d48" />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" }}>{getTxInfo(tx).label}</p>
                                                    {getTxInfo(tx).sub && <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px" }}>{getTxInfo(tx).sub}</p>}
                                                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{fmtDate(tx.createdAt)}</p>
                                                </div>
                                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                    <p style={{ fontSize: 14, fontWeight: 800, color: income ? "#16a34a" : "#e11d48", margin: "0 0 4px" }}>
                                                        {income ? "+" : "−"}{fmtPts(tx.amount)}
                                                    </p>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", fontSize: 11, color: statusColor(tx.status), fontWeight: 600 }}>
                                                        <Icon size={11} /> {statusLabel(tx.status)}
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