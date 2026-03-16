import { useState } from "react";

interface RequestReturnModalProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void | Promise<void>;
}

export default function RequestReturnModal({
    open,
    loading = false,
    onClose,
    onConfirm,
}: RequestReturnModalProps) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    if (!open) return null;

    const submit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError("Vui lòng nhập lý do yêu cầu hoàn hàng.");
            return;
        }
        setError("");
        await onConfirm(trimmed);
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
                    padding: 22,
                }}
            >
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                    Yêu cầu hoàn hàng
                </h3>
                <p style={{ margin: "8px 0 14px", color: "#64748b", fontSize: 14 }}>
                    Mô tả ngắn gọn vấn đề để gửi yêu cầu cho seller/admin xử lý.
                </p>

                <textarea
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="Ví dụ: Xe nhận được bị lỗi phanh, không đúng mô tả..."
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
                    }}
                />

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
                        Quay lại
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
                            background: "#f59e0b",
                            color: "white",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.75 : 1,
                        }}
                    >
                        {loading ? "Đang gửi..." : "Gửi yêu cầu hoàn"}
                    </button>
                </div>
            </div>
        </div>
    );
}
