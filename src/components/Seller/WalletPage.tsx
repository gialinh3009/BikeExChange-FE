import WalletTab from "./WalletTab";

function getToken() {
    return localStorage.getItem("token") || "";
}

export default function WalletPage() {
    const token = getToken();

    return (
        <div className="space-y-6">
            <WalletTab
                token={token}
            />
        </div>
    );
}