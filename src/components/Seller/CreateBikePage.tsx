import { useState, useEffect } from "react";
import { getWalletAPI } from "../../services/Seller/sellerService";
import CreateBikeTab from "./CreateBikeTab";

type WalletLike = { availablePoints?: number; frozenPoints?: number; data?: { availablePoints?: number; frozenPoints?: number } };

function getToken() {
    return localStorage.getItem("token") || "";
}

export default function CreateBikePage() {
    const token = getToken();
    const [wallet, setWallet] = useState<WalletLike | null>(null);

    const refreshWallet = async () => {
        try {
            const w = await getWalletAPI(token);
            setWallet(w as WalletLike);
        } catch (e) {
            console.error("Error loading wallet:", e);
            setWallet({ availablePoints: 0, frozenPoints: 0 });
        }
    };

    useEffect(() => {
        void refreshWallet();
    }, [token]);

    const handleBikeCreated = () => {
        // Refresh wallet after creating bike
        void refreshWallet();
    };

    return (
        <CreateBikeTab
            token={token}
            wallet={wallet}
            onBikeCreated={handleBikeCreated}
            onWalletRefresh={refreshWallet}
        />
    );
}