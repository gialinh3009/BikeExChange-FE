import { useEffect, useState } from "react";

const getUserField = (user, keys) => {
    for (const key of keys) {
        const value = user?.[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
};

const getDefaultContact = () => {
    try {
        const raw = localStorage.getItem("user");
        if (!raw) return { buyerAddress: "", buyerPhone: "", buyerEmail: "" };
        const user = JSON.parse(raw);
        return {
            buyerAddress: getUserField(user, ["address", "buyerAddress", "streetAddress"]),
            buyerPhone: getUserField(user, ["phone", "phoneNumber", "buyerPhone", "mobile"]),
            buyerEmail: getUserField(user, ["email", "buyerEmail"]),
        };
    } catch {
        return { buyerAddress: "", buyerPhone: "", buyerEmail: "" };
    }
};

export default function OpenDisputeModal({
    open,
    loading = false,
    onClose,
    onConfirm,
}) {
    const [reason, setReason] = useState("");
    const [buyerAddress, setBuyerAddress] = useState("");
    const [buyerPhone, setBuyerPhone] = useState("");
    const [buyerEmail, setBuyerEmail] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        const defaults = getDefaultContact();
        setBuyerAddress(defaults.buyerAddress);
        setBuyerPhone(defaults.buyerPhone);
        setBuyerEmail(defaults.buyerEmail);
    }, [open]);

    if (!open) return null;

    const submit = async () => {
        const payload = {
            reason: reason.trim(),
            buyerAddress: buyerAddress.trim(),
            buyerPhone: buyerPhone.trim(),
            buyerEmail: buyerEmail.trim(),
        };

        if (!payload.reason || !payload.buyerAddress || !payload.buyerPhone || !payload.buyerEmail) {
            setError("Vui long nhap day du ly do va thong tin lien he.");
            return;
        }

        setError("");
        await onConfirm(payload);
        setReason("");
    };

    const close = () => {
        if (loading) return;
        setError("");
        setReason("");
        onClose();
    };

    return (
        <div
            onClick={close}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.35)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(620px, 100%)",
                    background: "white",
                    borderRadius: 18,
                    border: "1.5px solid #e8ecf4",
                    boxShadow: "0 20px 48px rgba(15, 23, 42, 0.2)",
                    padding: 22,
                }}
            >
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                    Mo tranh chap
                </h3>
                <p style={{ margin: "8px 0 14px", color: "#64748b", fontSize: 14 }}>
                    Cung cap ly do va thong tin lien he de Admin xu ly nhanh hon.
                </p>

                <div style={{ display: "grid", gap: 10 }}>
                    <textarea
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="Ly do mo tranh chap..."
                        rows={4}
                        style={{
                            width: "100%",
                            resize: "vertical",
                            border: "1.5px solid #dbe3ef",
                            borderRadius: 12,
                            outline: "none",
                            padding: "12px 14px",
                            fontSize: 14,
                            fontFamily: "inherit",
                            color: "#0f172a",
                        }}
                    />

                    <input
                        value={buyerAddress}
                        onChange={(e) => {
                            setBuyerAddress(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="Dia chi lien he"
                        style={{
                            width: "100%",
                            border: "1.5px solid #dbe3ef",
                            borderRadius: 12,
                            outline: "none",
                            padding: "11px 14px",
                            fontSize: 14,
                            color: "#0f172a",
                        }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <input
                            value={buyerPhone}
                            onChange={(e) => {
                                setBuyerPhone(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="So dien thoai"
                            style={{
                                width: "100%",
                                border: "1.5px solid #dbe3ef",
                                borderRadius: 12,
                                outline: "none",
                                padding: "11px 14px",
                                fontSize: 14,
                                color: "#0f172a",
                            }}
                        />
                        <input
                            value={buyerEmail}
                            onChange={(e) => {
                                setBuyerEmail(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="Email"
                            type="email"
                            style={{
                                width: "100%",
                                border: "1.5px solid #dbe3ef",
                                borderRadius: 12,
                                outline: "none",
                                padding: "11px 14px",
                                fontSize: 14,
                                color: "#0f172a",
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <p style={{ margin: "10px 0 0", color: "#e11d48", fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                    <button
                        onClick={close}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 16px",
                            background: "#f1f5f9",
                            color: "#334155",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        Quay lai
                    </button>
                    <button
                        onClick={() => {
                            void submit();
                        }}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 16px",
                            background: "#ef4444",
                            color: "white",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.75 : 1,
                        }}
                    >
                        {loading ? "Dang gui..." : "Gui tranh chap"}
                    </button>
                </div>
            </div>
        </div>
    );
}
