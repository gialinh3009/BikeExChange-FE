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
  SELLER: "/seller",
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

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bike size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">BikeExchange</span>
          </div>

          {/* Hero text */}
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

            {/* Stats */}
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

            {/* Role badges */}
            <div className="mt-8">
              <p className="text-blue-200 text-xs mb-3 uppercase tracking-wider font-medium">
                Dành cho tất cả vai trò
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROLE_LABELS).map(([key, { label }]) => (
                    <span
                        key={key}
                        className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
                    >
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
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Bike size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">
              BikeExchange
            </span>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  Đăng nhập
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Chào mừng bạn trở lại!
                </p>
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
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="email"
                        placeholder="ban@email.com"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      Mật khẩu
                    </label>
                    <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition mt-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">hoặc</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google (placeholder) */}
              <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path
                      fill="#EA4335"
                      d="M24 9.5c3.1 0 5.8 1.1 8 2.9l6-6C34.4 3.1 29.5 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.4 13.5 17.7 9.5 24 9.5z"
                  />
                  <path
                      fill="#4285F4"
                      d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.3-9.9 7.3-16.9z"
                  />
                  <path
                      fill="#FBBC05"
                      d="M10.7 28.4A14.6 14.6 0 0 1 9.5 24c0-1.5.3-3 .8-4.4l-7-5.4A23.9 23.9 0 0 0 .1 24c0 3.9.9 7.5 2.6 10.8l8-6.4z"
                  />
                  <path
                      fill="#34A853"
                      d="M24 47c5.5 0 10.1-1.8 13.4-4.9l-7.4-5.7c-1.8 1.2-4.2 2-6 2-6.3 0-11.6-4-13.3-9.5l-8 6.4C7 41.3 14.8 47 24 47z"
                  />
                </svg>
                Tiếp tục với Google
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Chưa có tài khoản?{" "}
                <Link
                    to="/register"
                    className="text-blue-600 font-semibold hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
