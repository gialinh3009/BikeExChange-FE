import { useEffect, useState } from "react";
import { getWalletAPI, getWalletTransactionsAPI } from "../../services/Seller/sellerService";

type WalletLike = {
    availablePoints?: number;
    frozenPoints?: number;
    data?: {
        availablePoints?: number;
        frozenPoints?: number;
    };
};

type Transaction = {
    id?: number;
    type?: string;
    amount?: number;
    description?: string;
    createdAt?: string;
};

interface WalletTabProps {
    token: string;
}

export default function WalletTab({ token }: WalletTabProps) {
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [wallet, setWallet] = useState<WalletLike | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transLoading, setTransLoading] = useState(false);

    const refreshWallet = async () => {
        try {
            setWalletLoading(true);
            setWalletError(null);
            const w = await getWalletAPI(token);
            setWallet(w as WalletLike);
        } catch (e) {
            console.error("Wallet API error:", e);
            setWalletError((e as Error).message || "Không thể tải ví.");
            setWallet({ availablePoints: 0, frozenPoints: 0 });
        } finally {
            setWalletLoading(false);
        }
    };

    const refreshTransactions = async () => {
        try {
            setTransLoading(true);
            const res = await getWalletTransactionsAPI(token);
            const data = Array.isArray(res) ? res : (res?.data || []);
            setTransactions(data);
        } catch (e) {
            console.error("Transactions API error:", e);
            setTransactions([]);
        } finally {
            setTransLoading(false);
        }
    };

    useEffect(() => {
        void refreshWallet();
        void refreshTransactions();
    }, [token]);

    const availablePoints = wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
    const frozenPoints = wallet?.frozenPoints ?? wallet?.data?.frozenPoints ?? 0;
    const totalPoints = availablePoints + frozenPoints;

    return (
        <div className="space-y-6">
            {/* Wallet Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800">Ví của bạn</h2>
                    <button
                        type="button"
                        onClick={() => void refreshWallet()}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Làm mới
                    </button>
                </div>
                {walletError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{walletError}</div>}
                {walletLoading && <div className="text-sm text-gray-500">Đang tải...</div>}
                {!walletLoading && wallet && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                            <div className="text-xs text-emerald-600 font-medium mb-1">Tiền khả dụng</div>
                            <div className="text-3xl font-extrabold text-emerald-900">
                                {availablePoints.toLocaleString("vi-VN")}
                            </div>
                            <div className="text-xs text-emerald-600 mt-1">VND</div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50">
                            <div className="text-xs text-amber-600 font-medium mb-1">Tiền bị khóa</div>
                            <div className="text-3xl font-extrabold text-amber-900">
                                {frozenPoints.toLocaleString("vi-VN")}
                            </div>
                            <div className="text-xs text-amber-600 mt-1">VND</div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <div className="text-xs text-blue-600 font-medium mb-1">Tổng tiền</div>
                            <div className="text-3xl font-extrabold text-blue-900">
                                {totalPoints.toLocaleString("vi-VN")}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">VND</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transactions History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800">Lịch sử giao dịch</h2>
                    <button
                        type="button"
                        onClick={() => void refreshTransactions()}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Làm mới
                    </button>
                </div>
                {transLoading && <div className="text-sm text-gray-500">Đang tải...</div>}
                {!transLoading && (
                    <div className="divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500">
                                Chưa có giao dịch nào
                            </div>
                        ) : (
                            transactions.map((trans, idx) => (
                                <div key={trans.id || idx} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {trans.description || trans.type || "Giao dịch"}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {trans.createdAt ? new Date(trans.createdAt).toLocaleDateString("vi-VN", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            }) : "N/A"}
                                        </div>
                                    </div>
                                    <div className={`text-sm font-semibold ${
                                        (trans.type === "DEPOSIT" || trans.type === "REFUND") ? "text-emerald-600" : "text-red-600"
                                    }`}>
                                        {(trans.type === "DEPOSIT" || trans.type === "REFUND") ? "+" : "-"}
                                        {Math.abs(trans.amount || 0).toLocaleString("vi-VN")} VND
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
