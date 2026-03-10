import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, Mail, Phone, MapPin, ArrowLeft, Edit3, Save,
    X, CheckCircle, AlertCircle, Calendar, Star, ShoppingBag,
    Shield, Clock,
} from "lucide-react";
import { getUserProfileAPI, updateUserProfileAPI } from "../../services/Buyer/Userservice";

interface UserProfile {
    id: number;
    email: string;
    fullName: string | null;
    phone: string | null;
    address: string | null;
    role: string;
    rating: number;
    totalBikesSold: number;
    createdAt: string;
    updatedAt: string;
    isVerified: boolean;
    status: string;
    shopName: string | null;
    shopDescription: string | null;
}

interface EditForm {
    fullName: string;
    phone: string;
    address: string;
}

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function ProfilePage() {
    const navigate  = useNavigate();
    const [profile, setProfile]   = useState<UserProfile | null>(null);
    const [loading, setLoading]   = useState(true);
    const [editing, setEditing]   = useState(false);
    const [saving,  setSaving]    = useState(false);
    const [toast,   setToast]     = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [form,    setForm]      = useState<EditForm>({ fullName: "", phone: "", address: "" });

    const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } })();
    const userId = user?.id ?? user?.userId;

    useEffect(() => {
        if (!userId) { navigate("/login"); return; }
        void fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const data = await getUserProfileAPI(userId);
            setProfile(data);
            setForm({
                fullName: data.fullName ?? "",
                phone:    data.phone    ?? "",
                address:  data.address  ?? "",
            });
        } catch (e: unknown) {
            showToast("error", e instanceof Error ? e.message : "Không thể tải hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userId || !profile) return;
        setSaving(true);
        try {
            // Gửi toàn bộ object, chỉ đổi 3 field được phép
            const payload = {
                ...profile,
                fullName: form.fullName,
                phone:    form.phone,
                address:  form.address,
            };
            const updated = await updateUserProfileAPI(userId, payload);
            setProfile(updated);
            setEditing(false);
            showToast("success", "Cập nhật hồ sơ thành công!");
            // Cập nhật localStorage nếu có fullName
            if (user) {
                localStorage.setItem("user", JSON.stringify({ ...user, fullName: form.fullName }));
            }
        } catch (e: unknown) {
            showToast("error", e instanceof Error ? e.message : "Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const cancelEdit = () => {
        if (profile) {
            setForm({ fullName: profile.fullName ?? "", phone: profile.phone ?? "", address: profile.address ?? "" });
        }
        setEditing(false);
    };

    const roleLabel: Record<string, { label: string; color: string; bg: string }> = {
        BUYER:    { label: "Người mua",    color: "#2563eb", bg: "#eff6ff" },
        SELLER:   { label: "Người bán",    color: "#16a34a", bg: "#f0fdf4" },
        ADMIN:    { label: "Quản trị viên",color: "#7c3aed", bg: "#f5f3ff" },
        INSPECTOR:{ label: "Kiểm định viên",color:"#d97706", bg: "#fffbeb" },
    };
    const roleMeta = roleLabel[profile?.role ?? ""] ?? { label: profile?.role, color: "#64748b", bg: "#f4f6fb" };

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans','Nunito',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
                *{box-sizing:border-box;margin:0;padding:0}
                .field-input{width:100%;border:1.5px solid #e8ecf4;borderRadius:10px;padding:10px 13px;fontSize:13.5px;color:#1e293b;outline:none;fontFamily:inherit;transition:border .15s,box-shadow .15s;background:white}
                .field-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
                .field-input:disabled{background:#f8fafc;color:#94a3b8;cursor:default}
                @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
                .fade-in{animation:fadeIn .3s ease}
                @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
                .slide-down{animation:slideDown .25s ease}
                @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
                .pulse{animation:pulse 1.4s infinite}
            `}</style>

            {/* Toast */}
            {toast && (
                <div className="slide-down" style={{
                    position: "fixed", top: 20, right: 20, zIndex: 9999,
                    display: "flex", alignItems: "center", gap: 9,
                    background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
                    border: `1.5px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
                    borderRadius: 12, padding: "12px 18px",
                    boxShadow: "0 8px 24px rgba(0,0,0,.1)",
                    fontSize: 13.5, fontWeight: 600,
                    color: toast.type === "success" ? "#15803d" : "#e11d48",
                }}>
                    {toast.type === "success"
                        ? <CheckCircle size={16} color="#16a34a"/>
                        : <AlertCircle size={16} color="#e11d48"/>}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <header style={{
                background: "white", borderBottom: "1px solid #e8ecf4",
                padding: "14px 24px", display: "flex", alignItems: "center",
                gap: 12, position: "sticky", top: 0, zIndex: 20,
            }}>
                <button onClick={() => navigate(-1)} style={{
                    width: 36, height: 36, borderRadius: 9, border: "1.5px solid #e8ecf4",
                    background: "white", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f4f6fb"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                    <ArrowLeft size={16} color="#374151"/>
                </button>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Hồ sơ cá nhân</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>Xem và chỉnh sửa thông tin tài khoản</div>
                </div>
            </header>

            <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>

                {/* Loading skeleton */}
                {loading && (
                    <div className="fade-in">
                        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: 28, marginBottom: 16 }}>
                            <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 24 }}>
                                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#f0f0f0" }} className="pulse"/>
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 14, background: "#f0f0f0", borderRadius: 4, marginBottom: 8, width: "40%" }} className="pulse"/>
                                    <div style={{ height: 11, background: "#f0f0f0", borderRadius: 4, width: "60%" }} className="pulse"/>
                                </div>
                            </div>
                            {[1,2,3].map(i => (
                                <div key={i} style={{ height: 44, background: "#f0f0f0", borderRadius: 10, marginBottom: 12 }} className="pulse"/>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && profile && (
                    <div className="fade-in">

                        {/* Avatar + stats card */}
                        <div style={{
                            background: "linear-gradient(120deg,#1e3a5f,#0f172a 55%,#1e1b4b)",
                            borderRadius: 16, padding: "24px 28px", marginBottom: 16,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: 16, position: "relative", overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(99,102,241,.07)" }}/>
                            <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative", zIndex: 1 }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 68, height: 68, borderRadius: "50%",
                                    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 26, fontWeight: 800, color: "white",
                                    border: "3px solid rgba(255,255,255,.2)", flexShrink: 0,
                                }}>
                                    {(profile.fullName?.[0] || profile.email?.[0] || "U").toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                                        {profile.fullName || "Chưa cập nhật tên"}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                        <span style={{
                                            background: roleMeta.bg, color: roleMeta.color,
                                            borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700,
                                        }}>{roleMeta.label}</span>
                                        {profile.isVerified && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#34d399", fontSize: 11, fontWeight: 600 }}>
                                                <Shield size={11}/> Đã xác thực
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Stats */}
                            <div style={{ display: "flex", gap: 24, position: "relative", zIndex: 1 }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 3 }}>
                                        <Star size={13} color="#f59e0b" fill="#f59e0b"/>
                                        <span style={{ color: "white", fontWeight: 800, fontSize: 17 }}>{profile.rating}</span>
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: 10.5 }}>Đánh giá</div>
                                </div>
                                <div style={{ width: 1, background: "rgba(255,255,255,.08)" }}/>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 3 }}>
                                        <ShoppingBag size={12} color="#60a5fa"/>
                                        <span style={{ color: "white", fontWeight: 800, fontSize: 17 }}>{profile.totalBikesSold}</span>
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: 10.5 }}>Xe đã bán</div>
                                </div>
                                <div style={{ width: 1, background: "rgba(255,255,255,.08)" }}/>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 3 }}>
                                        <Calendar size={11} color="#a78bfa"/>
                                        <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>{fmtDate(profile.createdAt)}</span>
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: 10.5 }}>Ngày tham gia</div>
                                </div>
                            </div>
                        </div>

                        {/* Info card */}
                        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", overflow: "hidden", marginBottom: 16 }}>
                            {/* Card header */}
                            <div style={{
                                padding: "16px 22px", borderBottom: "1px solid #f1f5f9",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <User size={15} color="#3b82f6"/>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Thông tin cá nhân</span>
                                </div>
                                {!editing ? (
                                    <button onClick={() => setEditing(true)} style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "7px 14px", background: "#eff6ff", color: "#2563eb",
                                        border: "1.5px solid #bfdbfe", borderRadius: 9,
                                        fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                                    }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                                            onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                                    >
                                        <Edit3 size={13}/> Chỉnh sửa
                                    </button>
                                ) : (
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={cancelEdit} style={{
                                            display: "flex", alignItems: "center", gap: 5,
                                            padding: "7px 13px", background: "white", color: "#64748b",
                                            border: "1.5px solid #e8ecf4", borderRadius: 9,
                                            fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                                        }}>
                                            <X size={13}/> Hủy
                                        </button>
                                        <button onClick={handleSave} disabled={saving} style={{
                                            display: "flex", alignItems: "center", gap: 5,
                                            padding: "7px 14px", background: saving ? "#93c5fd" : "#2563eb",
                                            color: "white", border: "none", borderRadius: 9,
                                            fontSize: 12.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                                            transition: "background .15s",
                                        }}>
                                            <Save size={13}/> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Fields */}
                            <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 18 }}>

                                {/* Email — readonly */}
                                <Field icon={<Mail size={14} color="#94a3b8"/>} label="Email">
                                    <input className="field-input" value={profile.email} disabled/>
                                </Field>

                                {/* Họ tên */}
                                <Field icon={<User size={14} color={editing ? "#3b82f6" : "#94a3b8"}/>} label="Họ và tên">
                                    <input
                                        className="field-input"
                                        value={form.fullName}
                                        disabled={!editing}
                                        placeholder="Nhập họ và tên..."
                                        onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                                    />
                                </Field>

                                {/* Số điện thoại */}
                                <Field icon={<Phone size={14} color={editing ? "#3b82f6" : "#94a3b8"}/>} label="Số điện thoại">
                                    <input
                                        className="field-input"
                                        value={form.phone}
                                        disabled={!editing}
                                        placeholder="Nhập số điện thoại..."
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    />
                                </Field>

                                {/* Địa chỉ */}
                                <Field icon={<MapPin size={14} color={editing ? "#3b82f6" : "#94a3b8"}/>} label="Địa chỉ">
                                    <input
                                        className="field-input"
                                        value={form.address}
                                        disabled={!editing}
                                        placeholder="Nhập địa chỉ..."
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    />
                                </Field>

                                {editing && (
                                    <div style={{
                                        padding: "10px 14px", background: "#fffbeb",
                                        border: "1px solid #fde68a", borderRadius: 9,
                                        fontSize: 12.5, color: "#92400e",
                                        display: "flex", alignItems: "center", gap: 7,
                                    }}>
                                        <AlertCircle size={13} color="#d97706"/>
                                        Chỉ có thể chỉnh sửa: Họ tên, Số điện thoại, Địa chỉ
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Account info card */}
                        <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e8ecf4", padding: "22px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
                                <Clock size={14} color="#3b82f6"/>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Thông tin tài khoản</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                                {[
                                    { label: "Trạng thái", value: profile.status === "ACTIVE" ? "Hoạt động" : profile.status,
                                        color: profile.status === "ACTIVE" ? "#16a34a" : "#e11d48" },
                                    { label: "Xác thực", value: profile.isVerified ? "Đã xác thực" : "Chưa xác thực",
                                        color: profile.isVerified ? "#16a34a" : "#d97706" },
                                    { label: "Ngày tham gia", value: fmtDate(profile.createdAt), color: "#374151" },
                                    { label: "Cập nhật lần cuối", value: fmtDate(profile.updatedAt), color: "#374151" },
                                ].map(item => (
                                    <div key={item.label} style={{
                                        background: "#f8fafc", borderRadius: 10,
                                        padding: "12px 14px", border: "1px solid #f1f5f9",
                                    }}>
                                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 5,
                                            textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            {item.label}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}

// ── Helper component ──────────────────────────────────────────────────────────
function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                {icon}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151",
                    textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
            </div>
            {children}
        </div>
    );
}