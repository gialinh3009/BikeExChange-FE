import { useState, useEffect } from "react";
import { getUserProfileAPI } from "../../services/Buyer/Userservice";

export default function OpenDisputeModal({
    open,
    loading = false,
    onClose,
    onConfirm,
}) {
    const [reason,  setReason]  = useState("");
    const [error,   setError]   = useState("");
    const [profile, setProfile] = useState(null);

    // Lấy thông tin profile người dùng khi modal mở (để gửi ngầm lên BE)
    useEffect(() => {
        if (!open) return;
        try {
            const raw = localStorage.getItem("user");
            if (!raw) return;
            const stored = JSON.parse(raw);
            const userId = stored?.id ?? stored?.userId;
            if (!userId) return;
            getUserProfileAPI(userId)
                .then(data => setProfile(data?.data ?? data))
                .catch(() => {});
        } catch { /* silent */ }
    }, [open]);

    if (!open) return null;

    const submit = async () => {
        if (!reason.trim()) {
            setError("Vui lòng nhập lý do mở tranh chấp.");
            return;
        }
        setError("");

        // BE yêu cầu bắt buộc 3 field liên hệ — lấy từ profile API, fallback chuỗi rỗng an toàn
        const buyerAddress = profile?.address ?? profile?.buyerAddress ?? "";
        const buyerPhone   = profile?.phone   ?? profile?.phoneNumber  ?? "";
        const buyerEmail   = profile?.email   ?? profile?.buyerEmail   ?? "";

        if (!buyerAddress || !buyerPhone || !buyerEmail) {
            setError("Không lấy được thông tin liên hệ của bạn. Vui lòng cập nhật hồ sơ trước.");
            return;
        }

        await onConfirm({ reason: reason.trim(), buyerAddress, buyerPhone, buyerEmail });
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
                    width: "min(560px, 100%)",
                    background: "white",
                    borderRadius: 18,
                    border: "1.5px solid #e8ecf4",
                    boxShadow: "0 20px 48px rgba(15, 23, 42, 0.2)",
                    padding: 28,
                }}
            >
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                    Mở tranh chấp
                </h3>
                <p style={{ margin: "8px 0 18px", color: "#64748b", fontSize: 14 }}>
                    Mô tả chi tiết vấn đề để Admin xem xét và xử lý.
                </p>

                <textarea
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="Lý do mở tranh chấp..."
                    rows={5}
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
                        boxSizing: "border-box",
                    }}
                />

                {error && (
                    <p style={{ margin: "8px 0 0", color: "#e11d48", fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </p>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                    <button
                        onClick={close}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 18px",
                            background: "#f1f5f9",
                            color: "#334155",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        Quay lại
                    </button>
                    <button
                        onClick={() => { void submit(); }}
                        disabled={loading}
                        style={{
                            border: "none",
                            borderRadius: 10,
                            padding: "10px 18px",
                            background: "#ef4444",
                            color: "white",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.75 : 1,
                        }}
                    >
                        {loading ? "Đang gửi..." : "Gửi tranh chấp"}
                    </button>
                </div>
            </div>
        </div>
    );
}
