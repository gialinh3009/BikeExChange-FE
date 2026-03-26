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
    const [confirmPhrase, setConfirmPhrase] = useState("");
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
        if (!shopName.trim()) { setError("Tên shop là bắt buộc"); return; }
        if (shopName.trim().length < 3) { setError("Tên shop phải tối thiểu 3 ký tự"); return; }
        if (!shopDescription.trim()) { setError("Mô tả shop là bắt buộc"); return; }
        if (shopDescription.trim().length < 20) { setError("Mô tả shop phải tối thiểu 20 ký tự"); return; }
        if (!agreeToTerms) { setError("Bạn phải đồng ý với điều khoản"); return; }
        if (!acceptBusinessResponsibility) { setError("Bạn phải cam kết trách nhiệm kinh doanh"); return; }
        if (confirmPhrase.trim().toUpperCase() !== "XAC NHAN NANG CAP SELLER") {
            setError("Bạn cần nhập chính xác: XAC NHAN NANG CAP SELLER");
            return;
        }
        if (upgradeCost === null) {
            setError("Không thể tải phí nâng cấp hiện hành. Vui lòng thử lại.");
            return;
        }
        if (walletPoints !== null && walletPoints < upgradeCost) {
            setError(`Ví không đủ số dư. Cần ${fmtVND(upgradeCost)}, hiện có ${fmtVND(walletPoints)}.`);
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
            setConfirmPhrase("");
            onClose();

            // Redirect sang SellerPage
            window.location.href = "/seller";
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
            if (msg.toLowerCase().includes("insufficient") || msg.toLowerCase().includes("balance")) {
                setError(`Ví không đủ số dư để nâng cấp. Vui lòng nạp thêm tiền vào ví.`);
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
        shopName.trim().length >= 3 &&
        shopDescription.trim().length >= 20 &&
        agreeToTerms &&
        acceptBusinessResponsibility &&
        confirmPhrase.trim().toUpperCase() === "XAC NHAN NANG CAP SELLER" &&
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

                {/* Cost Info */}
                <div style={{
                    background: walletLoading ? "#f8fafc" : hasEnoughPoints ? "#f0fdf4" : "#fff7ed",
                    border: `1.5px solid ${walletLoading ? "#e8ecf4" : hasEnoughPoints ? "#bbf7d0" : "#fed7aa"}`,
                    borderRadius: 12, padding: "12px 16px", marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <AlertCircle size={15} color={walletLoading ? "#94a3b8" : hasEnoughPoints ? "#16a34a" : "#ea580c"} style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: walletLoading ? "#64748b" : hasEnoughPoints ? "#15803d" : "#9a3412", lineHeight: 1.5 }}>
                        {walletLoading ? "Đang kiểm tra số dư..." : upgradeCost === null ? (
                            <>Đang tải phí nâng cấp hiện hành...</>
                        ) : hasEnoughPoints ? (
                            <><strong>{fmtVND(upgradeCost)}</strong> sẽ được trừ · Còn lại: <strong>{fmtVND((walletPoints ?? 0) - upgradeCost)}</strong></>
                        ) : (
                            <>Không đủ số dư. Cần <strong>{fmtVND(upgradeCost)}</strong>, hiện có <strong>{fmtVND(walletPoints ?? 0)}</strong>.</>
                        )}
                    </div>
                </div>

                <div style={{
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 16,
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                        Lưu ý trước khi nâng cấp
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", fontSize: 12.5, lineHeight: 1.6 }}>
                        <li>Phí nâng cấp sẽ bị trừ trực tiếp từ ví ngay khi xác nhận thành công.</li>
                        <li>Cần nhập đúng câu: <strong>XAC NHAN NANG CAP SELLER</strong>.</li>
                        <li>Bạn phải đồng ý điều khoản và cam kết trách nhiệm kinh doanh.</li>
                    </ul>
                </div>



                {/* Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                            TÊN SHOP
                        </label>
                        <input
                            className="modal-input"
                            placeholder="Nhập tên shop của bạn"
                            value={shopName}
                            maxLength={100}
                            disabled={isFormDisabled}
                            onChange={(e) => { setShopName(e.target.value); if (error) setError(""); }}
                        />
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{shopName.length}/100</div>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                            MÔ TẢ SHOP
                        </label>
                        <textarea
                            className="modal-input"
                            placeholder="Mô tả ngắn về shop của bạn"
                            value={shopDescription}
                            maxLength={500}
                            rows={4}
                            disabled={isFormDisabled}
                            onChange={(e) => { setShopDescription(e.target.value); if (error) setError(""); }}
                            style={{ resize: "vertical", padding: "11px 14px" }}
                        />
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{shopDescription.length}/500</div>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                            NHẬP CÂU XÁC NHẬN
                        </label>
                        <input
                            className="modal-input"
                            placeholder="XAC NHAN NANG CAP SELLER"
                            value={confirmPhrase}
                            maxLength={50}
                            disabled={isFormDisabled}
                            onChange={(e) => { setConfirmPhrase(e.target.value); if (error) setError(""); }}
                        />
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                            Bắt buộc nhập đúng: <strong>XAC NHAN NANG CAP SELLER</strong>
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