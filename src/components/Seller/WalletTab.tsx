import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Clock, Package, ArrowDownLeft, ArrowUpRight, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getWalletAPI, getWalletTransactionsAPI, getCombosAPI, buyComboAPI } from "../../services/Seller/walletService";
import { getSellerSalesHistoryAPI } from "../../services/orderService";
import { enrichTransactions, isIncomeType, type EnrichedTransaction } from "../../utils/transactionUtils";

type WalletData = {
    availablePoints: number;
    frozenPoints: number;
    remainingFreePosts: number;
};

type Combo = {
    id: number;
    name: string;
    pointsCost: number;
    postLimit: number;
    isActive: boolean;
};

type EscrowedOrder = {
    id: number;
    bikeTitle: string;
    amountPoints: number;
    status: string;
};

interface WalletTabProps {
    token: string;
    userId?: number;
    onViewBike?: (bikeId: number) => void;
    onViewInspection?: (bikeId: number) => void;
    onViewPostFeeNoId?: (createdAt?: string) => void;
}

const HOLDING_STATUSES = ["ESCROWED", "ACCEPTED", "SHIPPED", "DELIVERED", "RETURN_REQUESTED", "DISPUTED"];

const HOLDING_STATUS_LABEL: Record<string, string> = {
    ESCROWED: "Chờ seller xác nhận",
    ACCEPTED: "Seller đã xác nhận",
    SHIPPED: "Đang vận chuyển",
    DELIVERED: "Đã giao hàng, chờ xác nhận",
    RETURN_REQUESTED: "Đang yêu cầu hoàn hàng",
    DISPUTED: "Đang tranh chấp",
};

const fmtVnd = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} đ`;

const fmtDate = (iso?: string) => {
    if (!iso) return "N/A";
    const dt = new Date(iso);
    return dt.toLocaleDateString("vi-VN") + " " + dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const TX_LABEL: Record<string, { label: string; sub?: string }> = {
    DEPOSIT:          { label: "Nạp tiền",              sub: "Nạp tiền vào ví" },
    WITHDRAW:         { label: "Rút tiền",               sub: "Rút tiền về ngân hàng" },
    WITHDRAW_REQUEST: { label: "Yêu cầu rút tiền",       sub: "Chờ admin xét duyệt" },
    ESCROW_HOLD:      { label: "Tạm giữ tiền",           sub: "Khóa tiền khi đặt mua xe" },
    ESCROW_RELEASE:   { label: "Hoàn tiền tạm giữ",      sub: "Đơn hủy — tiền trả về ví" },
    ESCROW:           { label: "Tạm giữ tiền",           sub: "Khóa tiền khi đặt mua xe" },
    EARN:             { label: "Nhận tiền bán xe",       sub: "Giao dịch hoàn tất" },
    EARN_ESCROW:      { label: "Nhận tiền bán xe",       sub: "Giao dịch hoàn tất" },
    REFUND:           { label: "Hoàn tiền",              sub: "Tiền được hoàn về ví" },
    REFUND_BUYER:     { label: "Hoàn tiền mua",          sub: "Yêu cầu hoàn hàng được duyệt" },
    DISPUTE_REFUND:   { label: "Hoàn tiền tranh chấp",   sub: "Admin đã giải quyết tranh chấp" },
    SPEND:            { label: "Chi tiền",               sub: undefined },
    ADMIN_ADJUST:     { label: "Điều chỉnh bởi Admin",   sub: undefined },
};

const getTxInfo = (trans: EnrichedTransaction): { label: string; sub: string } => {
    const meta = TX_LABEL[String(trans.type || "").toUpperCase()];
    return {
        label: trans.resolvedLabel || meta?.label || trans.type || "Giao dịch",
        sub: trans.remarks || meta?.sub || "",
    };
};

const statusIcon  = (s?: string) => s === "SUCCESS" ? CheckCircle : s === "FAILED" ? XCircle : Clock;
const statusColor = (s?: string) => s === "SUCCESS" ? "#16a34a" : s === "FAILED" ? "#e11d48" : "#d97706";
const statusLabel = (s?: string) => s === "SUCCESS" ? "Thành công" : s === "FAILED" ? "Thất bại" : "Chờ";

export default function WalletTab({ token, userId, onViewBike, onViewInspection, onViewPostFeeNoId }: WalletTabProps) {
    const navigate = useNavigate();
    const [wallet, setWallet] = useState<WalletData>({ availablePoints: 0, frozenPoints: 0, remainingFreePosts: 0 });
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);

    const [escrowedOrders, setEscrowedOrders] = useState<EscrowedOrder[]>([]);
    const [escrowLoading, setEscrowLoading] = useState(false);

    const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
    const [transLoading, setTransLoading] = useState(false);
    const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

    const [combos, setCombos] = useState<Combo[]>([]);
    const [combosLoading, setCombosLoading] = useState(false);
    const [buyingComboId, setBuyingComboId] = useState<number | null>(null);
    const [comboError, setComboError] = useState<string | null>(null);
    const [comboSuccess, setComboSuccess] = useState<string | null>(null);

    const refreshWallet = useCallback(async () => {
        setWalletLoading(true);
        setWalletError(null);
        try {
            const w = await getWalletAPI(token);
            const d = w?.data ?? w;
            setWallet({
                availablePoints: d?.availablePoints ?? 0,
                frozenPoints: d?.frozenPoints ?? 0,
                remainingFreePosts: d?.remainingFreePosts ?? 0,
            });
        } catch (e) {
            setWalletError((e as Error).message || "Không thể tải ví.");
        } finally {
            setWalletLoading(false);
        }
    }, [token]);

    const refreshEscrowedOrders = useCallback(async () => {
        setEscrowLoading(true);
        try {
            const data = await getSellerSalesHistoryAPI(undefined, token);
            const allOrders: any[] = [];
            if (Array.isArray(data)) allOrders.push(...data);
            else if (data?.data && Array.isArray(data.data)) allOrders.push(...data.data);
            else if (data?.content && Array.isArray(data.content)) allOrders.push(...data.content);

            const dedup = new Map<number, EscrowedOrder>();
            allOrders.forEach((item: any) => {
                const o = item?.order ?? item;
                if (!o?.id || !HOLDING_STATUSES.includes(o.status)) return;
                if (dedup.has(o.id)) return;
                dedup.set(o.id, {
                    id: o.id,
                    bikeTitle: o.bikeTitle || o.bike?.title || `Đơn #${o.id}`,
                    amountPoints: o.amountPoints || 0,
                    status: o.status,
                });
            });
            setEscrowedOrders(Array.from(dedup.values()));
        } catch {
            setEscrowedOrders([]);
        } finally {
            setEscrowLoading(false);
        }
    }, [token]);

    const refreshCombos = useCallback(async () => {
        setCombosLoading(true);
        try {
            const data = await getCombosAPI(token);
            setCombos(Array.isArray(data) ? data : []);
        } catch {
            setCombos([]);
        } finally {
            setCombosLoading(false);
        }
    }, [token]);

    const refreshTransactions = useCallback(async () => {
        setTransLoading(true);
        try {
            const res = await getWalletTransactionsAPI(token, userId);
            const raw = Array.isArray(res) ? res : (res?.data ?? []);
            setTransactions(await enrichTransactions(raw, token));
        } catch {
            setTransactions([]);
        } finally {
            setTransLoading(false);
        }
    }, [token, userId]);

    useEffect(() => {
        void refreshWallet();
        void refreshTransactions();
        void refreshCombos();
        void refreshEscrowedOrders();
    }, [refreshWallet, refreshTransactions, refreshCombos, refreshEscrowedOrders]);

    const handleBuyCombo = async (combo: Combo) => {
        setComboError(null);
        setComboSuccess(null);
        setBuyingComboId(combo.id);
        try {
            await buyComboAPI(combo.id, token);
            setComboSuccess(`Mua thành công gói "${combo.name}"! Đã thêm ${combo.postLimit} lượt đăng.`);
            await refreshWallet();
            await refreshCombos();
        } catch (e) {
            setComboError((e as Error).message || "Mua combo thất bại.");
        } finally {
            setBuyingComboId(null);
        }
    };

    const { availablePoints, frozenPoints, remainingFreePosts } = wallet;
    const realHeld = escrowedOrders.reduce((s, o) => s + (o.amountPoints || 0), 0);
    const totalPoints = availablePoints + frozenPoints;

    const totalIncome  = transactions.filter(t =>  t.income).reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = transactions.filter(t => !t.income).reduce((s, t) => s + (t.amount || 0), 0);

    const filteredTransactions = transactions.filter(t => {
        if (filter === "income")  return t.income;
        if (filter === "expense") return !t.income;
        return true;
    });

    return (
        <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
            <style>{`
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                .wt-fade { animation: fadeIn .25s ease; }
                .escrow-row:hover { background:#f8faff !important; }
                .tx-row:hover { background:#f1f5f9 !important; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div>
                    <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>Ví của bạn</h2>
                    <p style={{ color:"#94a3b8", fontSize:13, margin:"4px 0 0" }}>Quản lý số dư và lịch sử giao dịch</p>
                </div>
                <button onClick={() => { void refreshWallet(); void refreshEscrowedOrders(); }} disabled={walletLoading}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"white", border:"1.5px solid #e8ecf4", borderRadius:9, fontSize:13, color:"#64748b", cursor:"pointer", fontWeight:600 }}>
                    <RefreshCw size={13} style={walletLoading ? { animation:"spin .8s linear infinite" } : {}} /> Làm mới
                </button>
            </div>

            {walletError && (
                <div style={{ marginBottom:16, padding:"10px 14px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:10, color:"#e11d48", fontSize:13 }}>
                    {walletError}
                </div>
            )}

            {/* ── Balance Cards ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1e40af)", borderRadius:16, padding:20, color:"white" }}>
                    <p style={{ fontSize:11, opacity:.8, fontWeight:600, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:".05em" }}>Tiền khả dụng</p>
                    <h3 style={{ fontSize:22, fontWeight:800, margin:0 }}>{walletLoading ? "..." : fmtVnd(availablePoints)}</h3>
                    <p style={{ fontSize:11, opacity:.6, margin:"4px 0 0" }}>VND</p>
                </div>
                <div style={{ background:"white", borderRadius:16, padding:20, border:"1.5px solid #fde68a" }}>
                    <p style={{ fontSize:11, color:"#d97706", fontWeight:600, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:".05em" }}>Tiền bị khóa</p>
                    <h3 style={{ fontSize:22, fontWeight:800, color:"#92400e", margin:0 }}>{walletLoading ? "..." : fmtVnd(frozenPoints)}</h3>
                    <p style={{ fontSize:11, color:"#d97706", margin:"4px 0 0" }}>VND</p>
                </div>
                <div style={{ background:"white", borderRadius:16, padding:20, border:"1.5px solid #e8ecf4" }}>
                    <p style={{ fontSize:11, color:"#16a34a", fontWeight:600, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:".05em" }}>Tổng tiền</p>
                    <h3 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>{walletLoading ? "..." : fmtVnd(totalPoints)}</h3>
                    <p style={{ fontSize:11, color:"#94a3b8", margin:"4px 0 0" }}>Khả dụng + Đang giữ</p>
                </div>
                <div style={{ background:"white", borderRadius:16, padding:20, border:"1.5px solid #e8ecf4" }}>
                    <p style={{ fontSize:11, color:"#7c3aed", fontWeight:600, margin:"0 0 8px", textTransform:"uppercase", letterSpacing:".05em" }}>Lượt đăng còn lại</p>
                    <h3 style={{ fontSize:22, fontWeight:800, color:"#5b21b6", margin:0 }}>{walletLoading ? "..." : remainingFreePosts}</h3>
                    <p style={{ fontSize:11, color:"#7c3aed", margin:"4px 0 0" }}>bài đăng</p>
                </div>
            </div>

            {/* ── Chi tiết tiền đang tạm giữ ── */}
            {!escrowLoading && escrowedOrders.length > 0 && (
                <div style={{ background:"white", borderRadius:14, border:"1.5px solid #fde68a", marginBottom:16, overflow:"hidden" }} className="wt-fade">
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", background:"#fffbeb", borderBottom:"1px solid #fde68a" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <Clock size={14} color="#f59e0b" />
                            <span style={{ fontSize:13, fontWeight:700, color:"#92400e" }}>Chi tiết tiền đang tạm giữ</span>
                        </div>
                        <span style={{ fontSize:14, fontWeight:800, color:"#f59e0b" }}>{fmtVnd(realHeld)}</span>
                    </div>
                    {escrowedOrders.map((o, i) => (
                        <div key={o.id} className="escrow-row" style={{
                            display:"flex", alignItems:"center", justifyContent:"space-between",
                            padding:"11px 18px", background:"white",
                            borderBottom: i < escrowedOrders.length - 1 ? "1px solid #f8fafc" : "none",
                            transition:"background .15s",
                        }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                                <div style={{ width:32, height:32, borderRadius:8, background:"#fffbeb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    <Package size={14} color="#f59e0b" />
                                </div>
                                <div style={{ minWidth:0 }}>
                                    <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                        {o.bikeTitle}
                                    </p>
                                    <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>
                                        Đơn #{o.id} · {HOLDING_STATUS_LABEL[o.status] || "Đang tạm giữ"}
                                    </p>
                                </div>
                            </div>
                            <span style={{ fontSize:13, fontWeight:700, color:"#f59e0b", flexShrink:0, marginLeft:12 }}>
                                +{fmtVnd(o.amountPoints)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tổng hợp ── */}
            <div style={{ background:"white", borderRadius:16, border:"1.5px solid #e8ecf4", marginBottom:16, overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9" }}>
                    <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Tổng hợp</h3>
                </div>
                <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                    {([
                        { key:"all"     as const, label:"Tất cả",   value:String(transactions.length), unit:"giao dịch", activeStyle:{ background:"#eff6ff", border:"1.5px solid #bfdbfe" }, textColor:"#2563eb" },
                        { key:"income"  as const, label:"Tổng thu",  value:`+${totalIncome.toLocaleString("vi-VN")}`,  unit:"VND", activeStyle:{ background:"#f0fdf4", border:"1.5px solid #bbf7d0" }, textColor:"#16a34a" },
                        { key:"expense" as const, label:"Tổng chi",  value:`-${totalExpense.toLocaleString("vi-VN")}`, unit:"VND", activeStyle:{ background:"#fff1f2", border:"1.5px solid #fecdd3" }, textColor:"#e11d48" },
                    ] as const).map(item => (
                        <button key={item.key} onClick={() => setFilter(item.key)}
                            style={{
                                borderRadius:12, padding:"14px 16px", textAlign:"left", cursor:"pointer", transition:"all .15s", fontFamily:"inherit",
                                ...(filter === item.key ? item.activeStyle : { background:"#f8fafc", border:"1.5px solid #e8ecf4" }),
                            }}>
                            <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", margin:"0 0 6px", color: filter === item.key ? item.textColor : "#64748b" }}>{item.label}</p>
                            <p style={{ fontSize:20, fontWeight:800, margin:"0 0 4px", color: filter === item.key ? item.textColor : "#0f172a" }}>{item.value}</p>
                            <p style={{ fontSize:11, margin:0, color: filter === item.key ? item.textColor : "#94a3b8" }}>{item.unit}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Gói combo ── */}
            <div style={{ background:"white", borderRadius:16, border:"1.5px solid #e8ecf4", marginBottom:16, overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #f1f5f9" }}>
                    <div>
                        <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Gói combo tin đăng</h3>
                        <p style={{ fontSize:12, color:"#94a3b8", margin:"3px 0 0" }}>Mua gói để tiết kiệm phí đăng bài</p>
                    </div>
                    <button onClick={() => void refreshCombos()} disabled={combosLoading}
                        style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"white", border:"1.5px solid #e8ecf4", borderRadius:9, fontSize:13, color:"#64748b", cursor:"pointer", fontWeight:600 }}>
                        <RefreshCw size={13} /> Làm mới
                    </button>
                </div>
                <div style={{ padding:"16px 20px" }}>
                    {comboSuccess && <div style={{ marginBottom:12, padding:"10px 13px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9, color:"#16a34a", fontSize:13 }}>✓ {comboSuccess}</div>}
                    {comboError   && <div style={{ marginBottom:12, padding:"10px 13px", background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:9, color:"#e11d48", fontSize:13 }}>✕ {comboError}</div>}
                    {combosLoading
                        ? <p style={{ fontSize:13, color:"#94a3b8", padding:"16px 0" }}>Đang tải...</p>
                        : combos.length === 0
                            ? <p style={{ fontSize:13, color:"#94a3b8", textAlign:"center", padding:"24px 0" }}>Hiện chưa có gói combo nào.</p>
                            : (
                                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
                                    {combos.map(combo => {
                                        const canAfford = availablePoints >= combo.pointsCost;
                                        const isBuying  = buyingComboId === combo.id;
                                        return (
                                            <div key={combo.id} style={{ borderRadius:14, border:"2px solid #ede9fe", background:"linear-gradient(135deg,#faf5ff,white)", padding:18, display:"flex", flexDirection:"column", gap:10 }}>
                                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                                                    <div>
                                                        <p style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:"0 0 3px" }}>🎟 {combo.name}</p>
                                                        <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>{combo.postLimit} lượt đăng tin</p>
                                                    </div>
                                                    <div style={{ textAlign:"right", flexShrink:0 }}>
                                                        <p style={{ fontSize:16, fontWeight:800, color:"#7c3aed", margin:0 }}>{combo.pointsCost.toLocaleString("vi-VN")}</p>
                                                        <p style={{ fontSize:11, color:"#a78bfa", margin:0 }}>VND</p>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>≈ {Math.round(combo.pointsCost / combo.postLimit).toLocaleString("vi-VN")} VND / bài</p>
                                                <button onClick={() => void handleBuyCombo(combo)} disabled={!canAfford || isBuying}
                                                    style={{ width:"100%", padding:"10px 0", borderRadius:10, border:"none", fontSize:13, fontWeight:700, cursor: canAfford && !isBuying ? "pointer" : "not-allowed", fontFamily:"inherit",
                                                        background: canAfford && !isBuying ? "#7c3aed" : "#e2e8f0",
                                                        color: canAfford && !isBuying ? "white" : "#94a3b8" }}>
                                                    {isBuying ? "Đang xử lý..." : canAfford ? "Mua ngay" : "Không đủ tiền"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                    }
                </div>
            </div>

            {/* ── Lịch sử giao dịch ── */}
            <div style={{ background:"white", borderRadius:16, border:"1.5px solid #e8ecf4", overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #f1f5f9" }}>
                    <div>
                        <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Lịch sử giao dịch</h3>
                        <p style={{ fontSize:12, color:"#94a3b8", margin:"3px 0 0" }}>
                            {filter === "income" ? "Các khoản thu" : filter === "expense" ? "Các khoản chi" : "Tất cả giao dịch"}
                        </p>
                    </div>
                    <button onClick={() => void refreshTransactions()} disabled={transLoading}
                        style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"white", border:"1.5px solid #e8ecf4", borderRadius:9, fontSize:13, color:"#64748b", cursor:"pointer", fontWeight:600 }}>
                        <RefreshCw size={13} style={transLoading ? { animation:"spin .8s linear infinite" } : {}} /> Làm mới
                    </button>
                </div>

                <div style={{ padding:"16px 20px" }}>
                    {transLoading ? (
                        <div style={{ textAlign:"center", padding:"40px 0" }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", border:"3px solid #e8ecf4", borderTopColor:"#f97316", animation:"spin .8s linear infinite", margin:"0 auto" }} />
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div style={{ textAlign:"center", padding:"40px 0" }}>
                            <p style={{ color:"#94a3b8", fontSize:13 }}>
                                {filter === "income" ? "Chưa có khoản thu nào" : filter === "expense" ? "Chưa có khoản chi nào" : "Chưa có giao dịch nào."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }} className="wt-fade">
                            {filteredTransactions.map((trans, idx) => {
                                const income = isIncomeType(trans.type);
                                const info   = getTxInfo(trans);
                                const StatusIcon = statusIcon((trans as any).status);

                                const isOrderLink      = !!trans.resolvedOrderId;
                                const isPostLink       = trans.linkType === "post"       && !!trans.resolvedBikeId;
                                const isPostFeeNoId    = !!trans.isPostFee && !trans.resolvedBikeId;
                                const isInspectionLink = trans.linkType === "inspection" && !!trans.resolvedBikeId;
                                const isClickable      = isOrderLink || isPostLink || isPostFeeNoId || isInspectionLink;

                                const handleClick = () => {
                                    if (isOrderLink)           navigate(`/seller/orders/${trans.resolvedOrderId}`);
                                    else if (isPostLink)       onViewBike ? onViewBike(trans.resolvedBikeId!) : navigate(`/bikes/${trans.resolvedBikeId}`);
                                    else if (isPostFeeNoId)    onViewPostFeeNoId ? onViewPostFeeNoId(trans.createdAt) : navigate(`/seller?tab=posts`);
                                    else if (isInspectionLink) onViewInspection ? onViewInspection(trans.resolvedBikeId!) : navigate(`/seller?tab=inspection`);
                                };

                                return (
                                    <div key={trans.id || idx} className="tx-row"
                                        onClick={isClickable ? handleClick : undefined}
                                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e8ecf4", transition:"background .15s", cursor: isClickable ? "pointer" : "default" }}>
                                        <div style={{ width:40, height:40, borderRadius:10, background: income ? "#f0fdf4" : "#fff1f2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                            {income
                                                ? <ArrowDownLeft size={18} color="#16a34a" />
                                                : <ArrowUpRight  size={18} color="#e11d48" />}
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:"0 0 2px" }}>
                                                {info.label}
                                                {isOrderLink      && <span style={{ fontSize:11, color:"#3b82f6", fontWeight:400, marginLeft:6 }}>→ Xem đơn hàng</span>}
                                                {(isPostLink || isPostFeeNoId) && <span style={{ fontSize:11, color:"#3b82f6", fontWeight:400, marginLeft:6 }}>→ Xem bài đăng</span>}
                                                {isInspectionLink && <span style={{ fontSize:11, color:"#3b82f6", fontWeight:400, marginLeft:6 }}>→ Xem kiểm định</span>}
                                            </p>
                                            {info.sub && <p style={{ fontSize:11, color:"#64748b", margin:"0 0 2px" }}>{info.sub}</p>}
                                            <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{fmtDate(trans.createdAt)}</p>
                                        </div>
                                        <div style={{ textAlign:"right", flexShrink:0 }}>
                                            <p style={{ fontSize:14, fontWeight:800, color: income ? "#16a34a" : "#e11d48", margin:"0 0 4px" }}>
                                                {income ? "+" : "−"}{fmtVnd(Math.abs(trans.amount || 0))}
                                            </p>
                                            <div style={{ display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end", fontSize:11, color: statusColor((trans as any).status), fontWeight:600 }}>
                                                <StatusIcon size={11} /> {statusLabel((trans as any).status)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
