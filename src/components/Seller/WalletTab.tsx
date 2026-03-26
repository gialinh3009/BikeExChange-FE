import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { getWalletAPI, getWalletTransactionsAPI, getCombosAPI, buyComboAPI } from "../../services/Seller/walletService";
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

interface WalletTabProps {
    token: string;
    userId?: number;
}

const fmtDate = (iso?: string) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function WalletTab({ token, userId }: WalletTabProps) {
    const navigate = useNavigate();
    const [wallet, setWallet] = useState<WalletData>({ availablePoints: 0, frozenPoints: 0, remainingFreePosts: 0 });
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);

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
    }, [refreshWallet, refreshTransactions, refreshCombos]);

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
    const totalPoints = availablePoints + frozenPoints;

    const totalIncome = transactions.filter(t => t.income).reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = transactions.filter(t => !t.income).reduce((s, t) => s + (t.amount || 0), 0);

    const filteredTransactions = transactions.filter(t => {
        if (filter === "income") return t.income;
        if (filter === "expense") return !t.income;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Wallet Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Ví của bạn</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Quản lý số dư và lịch sử giao dịch</p>
                    </div>
                    <button type="button" onClick={() => void refreshWallet()} disabled={walletLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
                        <RefreshCw size={14} className={walletLoading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>
                <div className="p-6">
                    {walletError && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{walletError}</div>}
                    {walletLoading
                        ? <div className="text-sm text-gray-500">Đang tải...</div>
                        : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { label: "Tiền khả dụng", value: availablePoints, color: "emerald" },
                                    { label: "Tiền bị khóa",  value: frozenPoints,    color: "amber"   },
                                    { label: "Tổng tiền",     value: totalPoints,     color: "blue"    },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className={`rounded-2xl border border-gray-200 p-4 bg-gradient-to-br from-${color}-50 to-${color}-100/50`}>
                                        <div className={`text-xs text-${color}-600 font-semibold uppercase tracking-wide mb-1`}>{label}</div>
                                        <div className={`text-3xl font-extrabold text-${color}-900`}>{value.toLocaleString("vi-VN")}</div>
                                        <div className={`text-xs text-${color}-600 mt-1`}>VND</div>
                                    </div>
                                ))}
                                <div className="rounded-2xl border border-gray-200 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50">
                                    <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Lượt đăng còn lại</div>
                                    <div className="text-3xl font-extrabold text-purple-900">{remainingFreePosts}</div>
                                    <div className="text-xs text-purple-600 mt-1">bài đăng</div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="font-bold text-gray-900 text-lg">Tổng hợp</h2>
                </div>
                <div className="p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {([
                            { key: "all"     as const, label: "Tất cả",  value: String(transactions.length), unit: "giao dịch", activeClass: "from-blue-50 to-blue-100/50 border-blue-300",   textClass: "text-blue-600",  numClass: "text-blue-900"  },
                            { key: "income"  as const, label: "Tổng thu", value: `+${totalIncome.toLocaleString("vi-VN")}`,  unit: "VND", activeClass: "from-green-50 to-green-100/50 border-green-300", textClass: "text-green-600", numClass: "text-green-900" },
                            { key: "expense" as const, label: "Tổng chi", value: `-${totalExpense.toLocaleString("vi-VN")}`, unit: "VND", activeClass: "from-red-50 to-red-100/50 border-red-300",     textClass: "text-red-600",   numClass: "text-red-900"   },
                        ] as const).map(item => (
                            <button key={item.key} onClick={() => setFilter(item.key)}
                                className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                                    filter === item.key
                                        ? `bg-gradient-to-br ${item.activeClass}`
                                        : "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:shadow-sm"
                                }`}>
                                <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${filter === item.key ? item.textClass : "text-gray-600"}`}>{item.label}</div>
                                <div className={`text-2xl font-extrabold ${filter === item.key ? item.numClass : "text-gray-900"}`}>{item.value}</div>
                                <div className={`text-xs mt-1 ${filter === item.key ? item.textClass : "text-gray-500"}`}>{item.unit}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Combo Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Gói combo tin đăng</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Mua gói để tiết kiệm phí đăng bài</p>
                    </div>
                    <button type="button" onClick={() => void refreshCombos()} disabled={combosLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
                        <RefreshCw size={14} className={combosLoading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>
                <div className="p-6">
                    {comboSuccess && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">✓ {comboSuccess}</div>}
                    {comboError   && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">✕ {comboError}</div>}
                    {combosLoading
                        ? <div className="flex items-center gap-2 text-sm text-gray-500 py-4"><div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" /> Đang tải...</div>
                        : combos.length === 0
                            ? <div className="py-8 text-center text-sm text-gray-500">Hiện chưa có gói combo nào.</div>
                            : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {combos.map(combo => {
                                        const canAfford = availablePoints >= combo.pointsCost;
                                        const isBuying = buyingComboId === combo.id;
                                        return (
                                            <div key={combo.id} className="rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5 flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-base">🎟 {combo.name}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{combo.postLimit} lượt đăng tin</div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="text-lg font-extrabold text-purple-700">{combo.pointsCost.toLocaleString("vi-VN")}</div>
                                                        <div className="text-xs text-purple-500">VND</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">≈ {Math.round(combo.pointsCost / combo.postLimit).toLocaleString("vi-VN")} VND / bài</div>
                                                <button onClick={() => void handleBuyCombo(combo)} disabled={!canAfford || isBuying}
                                                    className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${canAfford && !isBuying ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
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

            {/* Transactions History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Lịch sử giao dịch</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {filter === "income" ? "Các khoản thu" : filter === "expense" ? "Các khoản chi" : "Tất cả giao dịch"}
                        </p>
                    </div>
                    <button type="button" onClick={() => void refreshTransactions()} disabled={transLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition">
                        <RefreshCw size={14} className={transLoading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>
                <div className="p-6">
                    {transLoading
                        ? <div className="flex items-center gap-2 text-sm text-gray-500 py-4"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" /> Đang tải...</div>
                        : (
                            <div className="divide-y divide-gray-100">
                                {filteredTransactions.length === 0
                                    ? <div className="py-8 text-center text-sm text-gray-500">
                                        {filter === "income" ? "Chưa có khoản thu nào" : filter === "expense" ? "Chưa có khoản chi nào" : "Chưa có giao dịch nào"}
                                      </div>
                                    : filteredTransactions.map((trans, idx) => {
                                        const income = isIncomeType(trans.type);
                                        const isOrderLink = !!trans.resolvedOrderId;
                                        const isPostLink = trans.linkType === "post" && !!trans.resolvedBikeId;
                                        const isInspectionLink = trans.linkType === "inspection" && !!trans.resolvedBikeId;
                                        const isClickable = isOrderLink || isPostLink || isInspectionLink;

                                        const handleClick = () => {
                                            if (isOrderLink) navigate(`/seller/orders/${trans.resolvedOrderId}`);
                                            else if (isPostLink) navigate(`/bikes/${trans.resolvedBikeId}`);
                                            else if (isInspectionLink) navigate(`/seller?tab=inspection`);
                                        };

                                        const linkLabel = isOrderLink ? "→ Xem đơn hàng"
                                            : isPostLink ? "→ Xem bài đăng"
                                            : isInspectionLink ? "→ Xem kiểm định"
                                            : null;

                                        return (
                                            <div key={trans.id || idx}
                                                onClick={isClickable ? handleClick : undefined}
                                                className={`py-4 flex items-center justify-between px-2 rounded-lg transition ${isClickable ? "hover:bg-blue-50 cursor-pointer" : "hover:bg-gray-50"}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${income ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {income ? "↑" : "↓"}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                                            {trans.resolvedLabel || trans.description || trans.type || "Giao dịch"}
                                                            {linkLabel && <span className="text-xs text-blue-500 font-normal">{linkLabel}</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{fmtDate(trans.createdAt)}</div>
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-bold flex-shrink-0 ml-4 ${income ? "text-green-600" : "text-red-600"}`}>
                                                    {income ? "+" : "-"}{Math.abs(trans.amount || 0).toLocaleString("vi-VN")} VND
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}
