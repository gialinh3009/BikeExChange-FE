import { useEffect, useState } from "react";
import { getWalletAPI } from "../../services/walletService";

type WalletLike = {
    availablePoints?: number;
    frozenPoints?: number;
    data?: {
        availablePoints?: number;
        frozenPoints?: number;
    };
};

interface WalletTabProps {
    token: string;
}

export default function WalletTab({ token }: WalletTabProps) {
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [wallet, setWallet] = useState<WalletLike | null>(null);

    // Get user from localStorage
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const refreshWallet = async () => {
        try {
            setWalletLoading(true);
            setWalletError(null);
            
            // Always send both token and userId for best compatibility
            const params: any = {};
            if (token) {
                params.token = token;
            }
            if (user?.id) {
                params.userId = user.id;
            }
            
            const w = await getWalletAPI(params);
            setWallet(w as WalletLike);
        } catch (e) {
            console.error("Wallet API error:", e);
            setWalletError((e as Error).message || "Không thể tải ví.");
            // Fallback to 0 points
            setWallet({ availablePoints: 0, frozenPoints: 0 });
        } finally {
            setWalletLoading(false);
        }
    };

    useEffect(() => {
        void refreshWallet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Ví</h2>
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
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Available points</div>
                        <div className="text-2xl font-extrabold text-gray-900">
                            {(wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0).toLocaleString("vi-VN")}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Frozen points</div>
                        <div className="text-2xl font-extrabold text-gray-900">
                            {(wallet?.frozenPoints ?? wallet?.data?.frozenPoints ?? 0).toLocaleString("vi-VN")}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
