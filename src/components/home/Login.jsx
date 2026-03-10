import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bike,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { loginAPI } from "../../services/authService";

const ROLE_REDIRECT = {
  ADMIN: "/admin",
  // Seller dùng chung dashboard Buyer tại /buyer,
  // còn trang quản lý bài đăng riêng là /seller.
  SELLER: "/buyer",
  INSPECTOR: "/inspector",
  BUYER: "/buyer",
};

const ROLE_LABELS = {
  ADMIN: { label: "Quản trị viên", color: "text-purple-600 bg-purple-50" },
  SELLER: { label: "Người bán", color: "text-blue-600 bg-blue-50" },
  INSPECTOR: { label: "Kiểm định viên", color: "text-amber-600 bg-amber-50" },
  BUYER: { label: "Người mua", color: "text-emerald-600 bg-emerald-50" },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    try {
      const userData = await loginAPI(form);
      localStorage.setItem("token", userData.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      const redirect = ROLE_REDIRECT[userData.role] || "/";
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute bottom-10 -right-16 w-96 h-96 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bike size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">BikeExchange</span>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Mua bán xe đạp
              <br />
              <span className="text-blue-200">uy tín – dễ dàng</span>
            </h2>
            <p className="text-blue-100 mt-4 text-base leading-relaxed max-w-sm">
              Nền tảng kết nối người mua và người bán xe đạp hàng đầu Việt Nam.
              Kiểm định chất lượng – giao dịch an tâm.
            </p>
            <div className="mt-8 flex gap-6">
              {[
                { value: "2.400+", label: "Xe đã bán" },
                { value: "1.800+", label: "Người dùng" },
                { value: "99%", label: "Hài lòng" },
              ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-blue-200 text-xs mt-0.5">{s.label}</div>
                  </div>
              ))}
            </div>
            <div className="mt-8">
              <p className="text-blue-200 text-xs mb-3 uppercase tracking-wider font-medium">
                Dành cho tất cả vai trò
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROLE_LABELS).map(([key, { label }]) => (
                    <span key={key} className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                      {label}
                    </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 text-blue-200 text-xs">
            © {new Date().getFullYear()} BikeExchange. All rights reserved.
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Bike size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">BikeExchange</span>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-gray-900">Đăng nhập</h1>
                <p className="text-sm text-gray-500 mt-1">Chào mừng bạn trở lại!</p>
              </div>

              {justRegistered && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" />
                    Tài khoản đã được tạo thành công! Vui lòng đăng nhập.
                  </div>
              )}

              {error && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email" placeholder="ban@email.com" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <button type="button" className="text-xs text-blue-600 hover:underline">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition mt-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              {/* ĐÃ XÓA: divider "hoặc" và nút "Tiếp tục với Google" */}

              <p className="text-center text-sm text-gray-500 mt-6">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}