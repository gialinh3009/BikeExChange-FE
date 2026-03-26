import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Loader, Wallet } from "lucide-react";
import { getSellerUpgradeFeeAPI, upgradeToSellerAPI } from "../../services/Buyer/Upgradeservice";
import { getWalletAPI } from "../../services/Buyer/walletService";

const fmtVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export interface UpdatedUser {
    shopName?: string;
    shopDescription?: string;
    role?: string;
    [key: string]: unknown;
}

interface UpgradeToSellerModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number | undefined;
    onSuccess: (updatedUser: UpdatedUser) => void;
}

export default function UpgradeToSellerModal({
                                                 isOpen,
                                                 onClose,
                                                 userId,
                                                 onSuccess,
                                             }: UpgradeToSellerModalProps) {
    const [shopName, setShopName] = useState("");
    const [shopDescription, setShopDescription] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [acceptBusinessResponsibility, setAcceptBusinessResponsibility] = useState(false);
    const [confirmPhrase] = useState("XAC NHAN NANG CAP SELLER");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [walletPoints, setWalletPoints] = useState<number | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [upgradeCost, setUpgradeCost] = useState<number | null>(null);

    // Fetch wallet khi modal mở
    useEffect(() => {
        if (!isOpen) return;
        setError("");
        getSellerUpgradeFeeAPI()
            .then((fee) => {
                const parsed = Number(fee);
                if (Number.isFinite(parsed) && parsed >= 0) {
                    setUpgradeCost(parsed);
                } else {
                    setUpgradeCost(null);
                    setError("Không thể tải phí nâng cấp hiện hành.");
                }
            })
            .catch(() => {
                setUpgradeCost(null);
                setError("Không thể tải phí nâng cấp hiện hành.");
            });

        setWalletLoading(true);
        getWalletAPI()
            .then((data) => {
                const points = data?.availablePoints ?? data?.data?.availablePoints ?? 0;
                setWalletPoints(Number(points));
            })
            .catch(() => setWalletPoints(null))
            .finally(() => setWalletLoading(false));
    }, [isOpen]);

    const hasEnoughPoints = walletPoints !== null && upgradeCost !== null && walletPoints >= upgradeCost;

    const handleSubmit = async () => {
        setError("");
        if (!userId) { setError("Lỗi: Không thể lấy ID người dùng"); return; }
        if (!agreeToTerms) { setError("Bạn phải đồng ý với điều khoản"); return; }
        if (!acceptBusinessResponsibility) { setError("Bạn phải cam kết trách nhiệm kinh doanh"); return; }
        if (upgradeCost === null) {
            setError("Không thể tải phí nâng cấp hiện hành. Vui lòng thử lại.");
            return;
        }
        if (walletPoints !== null && walletPoints < upgradeCost) {
            setError(`Ví không đủ số dư. Cần ${fmtVND(upgradeCost)}, hiện có ${fmtVND(walletPoints)}.`);
            return;
        }

        // Soft-check trước khi gọi API (BE bắt buộc ≥ 3 / ≥ 20 ký tự)
        if (shopName.trim().length < 3) {
            setError("Tên shop cần ít nhất 3 ký tự để tiếp tục.");
            return;
        }
        if (shopDescription.trim().length < 20) {
            setError(`Mô tả shop cần ít nhất 20 ký tự (hiện có ${shopDescription.trim().length}).`);
            return;
        }

        setLoading(true);
        try {
            const updatedUser = await upgradeToSellerAPI(userId, {
                shopName,
                shopDescription,
                agreeToTerms: true,
                acceptBusinessResponsibility: true,
                confirmPhrase,
            }) as UpdatedUser;

            // Cập nhật localStorage
            const currentUser = (() => {
                try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
            })();
            localStorage.setItem("user", JSON.stringify({
                ...currentUser,
                role: "SELLER",
                shopName: updatedUser.shopName,
                shopDescription: updatedUser.shopDescription,
            }));

            onSuccess(updatedUser);
            setShopName("");
            setShopDescription("");
            setAgreeToTerms(false);
            setAcceptBusinessResponsibility(false);
            onClose();

            // Redirect sang SellerPage
            window.location.href = "/seller";
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
            const lower = msg.toLowerCase();
            if (lower.includes("insufficient") || lower.includes("balance")) {
                setError("Ví không đủ số dư để nâng cấp. Vui lòng nạp thêm tiền vào ví.");
            } else if (lower.includes("shop name") && (lower.includes("between") || lower.includes("character"))) {
                setError("Tên shop cần ít nhất 3 ký tự.");
            } else if (lower.includes("shop description") && (lower.includes("between") || lower.includes("character"))) {
                setError("Mô tả shop cần ít nhất 20 ký tự.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isFormDisabled = loading || walletLoading;
    const canSubmit =
        !isFormDisabled &&
        agreeToTerms &&
        acceptBusinessResponsibility &&
        hasEnoughPoints;

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, fontFamily: "'DM Sans',sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                .modal-input {
                    width: 100%; border: 1.5px solid #e8ecf4; border-radius: 10px;
                    padding: 11px 14px; font-size: 14px; outline: none;
                    font-family: inherit; color: #1e293b;
                    transition: border .15s, box-shadow .15s; box-sizing: border-box;
                }
                .modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
                .modal-input:disabled { background: #f8fafc; color: #94a3b8; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .modal-content { animation: slideUp .3s ease; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="modal-content" style={{
                background: "white", borderRadius: 20, padding: "32px 28px",
                maxWidth: 520, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.2)",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        📈 Nâng cấp lên Người Bán
                    </h2>
                    <button onClick={onClose} disabled={loading} style={{
                        width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e8ecf4",
                        background: "white", cursor: loading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <X size={18} color="#64748b" />
                    </button>
                </div>

                {/* Wallet Balance */}
                <div style={{
                    background: "linear-gradient(135deg,#1e3a5f,#1e40af)", borderRadius: 12,
                    padding: "14px 16px", marginBottom: 14,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Wallet size={17} color="rgba(255,255,255,.8)" />
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)", fontWeight: 500 }}>Số dư ví</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>
                        {walletLoading ? "..." : fmtVND(walletPoints ?? 0)}
                    </span>
                </div>

                {/* Chi phí nâng cấp — bảng rõ ràng */}
                <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
                    {/* Tiêu đề bảng */}
                    <div style={{ padding: "10px 16px", background: "#f8faff", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.4px" }}>CHI PHÍ NÂNG CẤP</span>
                    </div>
                    {/* Phí nâng cấp */}
                    <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Phí nâng cấp lên Người Bán</span>
                            <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0", lineHeight: 1.5 }}>
                                Khoản phí một lần để kích hoạt tài khoản người bán
                            </p>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", flexShrink: 0, marginLeft: 12 }}>
                            {fmtVND(upgradeCost)}
                        </span>
                    </div>
                    {/* Số dư hiện tại */}
                    <div style={{ padding: "13px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, color: "#64748b" }}>Số dư hiện tại</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: walletLoading ? "#94a3b8" : hasEnoughPoints ? "#10b981" : "#ef4444" }}>
                            {walletLoading ? "Đang tải..." : fmtVND(walletPoints ?? 0)}
                        </span>
                    </div>
                    {/* Số dư sau khi nâng cấp */}
                    <div style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: hasEnoughPoints ? "#f0fdf4" : "#fff7ed" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>Số dư sau khi nâng cấp</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: hasEnoughPoints ? "#16a34a" : "#ef4444" }}>
                            {walletLoading ? "—" : hasEnoughPoints
                                ? fmtVND((walletPoints ?? 0) - upgradeCost)
                                : <span style={{ fontSize: 13 }}>Không đủ số dư</span>
                            }
                        </span>
                    </div>
                    {/* Cảnh báo nếu không đủ tiền */}
                    {!walletLoading && !hasEnoughPoints && (
                        <div style={{ padding: "10px 16px", background: "#fff7ed", borderTop: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: 8 }}>
                            <AlertCircle size={14} color="#ea580c" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.5 }}>
                                Cần thêm <strong>{fmtVND(upgradeCost - (walletPoints ?? 0))}</strong> để nâng cấp. Vui lòng nạp thêm vào ví.
                            </span>
                        </div>
                    )}
                </div>



                {/* Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    {/* Tên shop */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                            TÊN SHOP <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            className="modal-input"
                            placeholder="Nhập tên shop của bạn (tối thiểu 3 ký tự)"
                            value={shopName}
                            maxLength={100}
                            disabled={isFormDisabled}
                            onChange={(e) => { setShopName(e.target.value); if (error) setError(""); }}
                            style={{
                                borderColor: shopName.length > 0
                                    ? shopName.trim().length < 3 ? "#fca5a5" : "#86efac"
                                    : undefined,
                            }}
                        />
                        <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {shopName.length > 0 ? (
                                shopName.trim().length < 3 ? (
                                    <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                                        ✗ Cần thêm {3 - shopName.trim().length} ký tự nữa (tối thiểu 3)
                                    </span>
                                ) : (
                                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ Đạt yêu cầu</span>
                                )
                            ) : (
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>Tối thiểu 3 ký tự</span>
                            )}
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{shopName.length}/100</span>
                        </div>
                    </div>

                    {/* Mô tả shop */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                            MÔ TẢ SHOP <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <textarea
                            className="modal-input"
                            placeholder="Mô tả ngắn về shop của bạn (tối thiểu 20 ký tự)"
                            value={shopDescription}
                            maxLength={500}
                            rows={4}
                            disabled={isFormDisabled}
                            onChange={(e) => { setShopDescription(e.target.value); if (error) setError(""); }}
                            style={{
                                resize: "vertical", padding: "11px 14px",
                                borderColor: shopDescription.length > 0
                                    ? shopDescription.trim().length < 20 ? "#fca5a5" : "#86efac"
                                    : undefined,
                            }}
                        />
                        {/* Progress bar */}
                        <div style={{ marginTop: 6, marginBottom: 2, height: 4, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 4,
                                width: `${Math.min(100, (shopDescription.trim().length / 20) * 100)}%`,
                                background: shopDescription.trim().length >= 20 ? "#10b981" : shopDescription.trim().length >= 10 ? "#f59e0b" : "#ef4444",
                                transition: "width .2s, background .2s",
                            }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {shopDescription.length > 0 ? (
                                shopDescription.trim().length < 20 ? (
                                    <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                                        ✗ Cần thêm {20 - shopDescription.trim().length} ký tự nữa (tối thiểu 20)
                                    </span>
                                ) : (
                                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ Đạt yêu cầu</span>
                                )
                            ) : (
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>Tối thiểu 20 ký tự</span>
                            )}
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{shopDescription.length}/500</span>
                        </div>
                    </div>

                    <div style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "12px 14px", background: "#f8fafc",
                        borderRadius: 10, border: "1px solid #f1f5f9",
                    }}>
                        <input
                            type="checkbox" id="agree-terms"
                            checked={agreeToTerms}
                            onChange={(e) => { setAgreeToTerms(e.target.checked); if (error) setError(""); }}
                            disabled={isFormDisabled}
                            style={{ width: 18, height: 18, cursor: isFormDisabled ? "not-allowed" : "pointer", marginTop: 2 }}
                        />
                        <label htmlFor="agree-terms" style={{
                            fontSize: 13, color: "#475569",
                            cursor: isFormDisabled ? "not-allowed" : "pointer", userSelect: "none", flex: 1,
                        }}>
                            Tôi đồng ý với <strong>điều khoản dịch vụ</strong> và{" "}
                            <strong>chính sách người bán</strong>
                        </label>
                    </div>

                    <div style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "12px 14px", background: "#f8fafc",
                        borderRadius: 10, border: "1px solid #f1f5f9",
                    }}>
                        <input
                            type="checkbox" id="accept-business-responsibility"
                            checked={acceptBusinessResponsibility}
                            onChange={(e) => { setAcceptBusinessResponsibility(e.target.checked); if (error) setError(""); }}
                            disabled={isFormDisabled}
                            style={{ width: 18, height: 18, cursor: isFormDisabled ? "not-allowed" : "pointer", marginTop: 2 }}
                        />
                        <label htmlFor="accept-business-responsibility" style={{
                            fontSize: 13, color: "#475569",
                            cursor: isFormDisabled ? "not-allowed" : "pointer", userSelect: "none", flex: 1,
                        }}>
                            Tôi cam kết chịu trách nhiệm về hoạt động kinh doanh, thông tin sản phẩm và giao dịch của shop.
                        </label>
                    </div>
                </div>

                {/* Checklist điều kiện khi chưa đủ */}
                {!canSubmit && !error && !isFormDisabled && (
                    <div style={{ background: "#f8faff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Cần hoàn thành để nâng cấp:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {[
                                { done: agreeToTerms,                 label: "Đồng ý điều khoản dịch vụ" },
                                { done: acceptBusinessResponsibility, label: "Cam kết trách nhiệm kinh doanh" },
                                { done: hasEnoughPoints,              label: "Số dư ví đủ để nâng cấp" },
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 13, color: item.done ? "#10b981" : "#ef4444" }}>{item.done ? "✓" : "✗"}</span>
                                    <span style={{ fontSize: 12, color: item.done ? "#64748b" : "#ef4444", fontWeight: item.done ? 400 : 500 }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 9,
                        background: "#fff1f2", border: "1.5px solid #fecdd3",
                        borderRadius: 10, padding: "11px 14px", marginBottom: 16,
                    }}>
                        <AlertCircle size={16} color="#e11d48" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#e11d48", fontWeight: 500 }}>{error}</span>
                    </div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            flex: 1, padding: "12px 0", background: "white", color: "#374151",
                            border: "1.5px solid #e8ecf4", borderRadius: 11, fontSize: 14,
                            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        style={{
                            flex: 1, padding: "12px 0",
                            background: canSubmit ? "#16a34a" : "#cbd5e1",
                            color: "white", border: "none", borderRadius: 11,
                            fontSize: 14, fontWeight: 700,
                            cursor: canSubmit ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "background .15s",
                        }}
                        onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = "#15803d"; }}
                        onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = "#16a34a"; }}
                    >
                        {loading ? (
                            <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang xử lý...</>
                        ) : (
                            <><CheckCircle size={16} /> Nâng cấp ngay</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}