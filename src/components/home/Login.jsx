import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2,
  Bike, ShieldCheck, BadgeCheck, Handshake,
} from "lucide-react";
import { loginAPI } from "../../services/authService";

const ROLE_REDIRECT = {
  ADMIN:     "/admin",
  SELLER:    "/",
  INSPECTOR: "/inspector",
  BUYER:     "/",
};

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Xe đạp đã qua kiểm định",
    desc: "Mỗi chiếc xe được kiểm tra kỹ lưỡng bởi đội ngũ kiểm định viên chuyên nghiệp trước khi đăng bán.",
  },
  {
    icon: Handshake,
    title: "Giao dịch minh bạch",
    desc: "Thông tin người mua – người bán rõ ràng, quy trình đặt cọc và thanh toán được bảo vệ.",
  },
  {
    icon: BadgeCheck,
    title: "Mua bán dễ dàng",
    desc: "Đăng tin nhanh chóng, tìm kiếm xe theo nhu cầu, liên hệ trực tiếp không qua trung gian.",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const verifyEmail = location.state?.verifyEmail === true;
  const registeredEmail = location.state?.email ?? "";
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
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("disabled") || msg.includes("user is disabled") || msg.includes("not verified") || msg.includes("chưa xác thực")) {
        setError("Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhấn vào link xác thực.");
      } else if (msg.includes("locked") || msg.includes("banned") || msg.includes("bị khóa")) {
        setError("Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
      } else if (msg.includes("bad credentials") || msg.includes("unauthorized") || msg.includes("invalid") || msg.includes("not found") || msg.includes("incorrect")) {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
        setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
      } else {
        setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 flex-shrink-0">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bike size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">BikeExchange</span>
        </Link>
      </header>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl flex gap-16 items-center">

          {/* ── Left: brand messaging ── */}
          <div className="hidden lg:flex flex-col flex-1 gap-8">
            <div>
              <h2 className="text-3xl font-extrabold text-white leading-snug">
                Mua bán xe đạp<br />
                <span className="text-blue-100">chất lượng, đã kiểm định</span>
              </h2>
              <p className="mt-3 text-blue-100 text-base leading-relaxed max-w-sm">
                BikeExchange là nền tảng kết nối người mua và người bán xe đạp,
                với quy trình kiểm định chuyên nghiệp giúp mọi giao dịch an toàn và tin cậy.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{title}</div>
                    <div className="text-blue-100 text-sm mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: login form ── */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
              <p className="text-sm text-gray-500 mb-6">Chào mừng bạn trở lại!</p>

              {verifyEmail && (
                <div className="mb-5 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Đăng ký thành công!</div>
                    <div className="mt-0.5">
                      Email xác thực đã được gửi tới <strong>{registeredEmail || "hộp thư của bạn"}</strong>.
                      Vui lòng xác thực trước khi đăng nhập.
                    </div>
                    <div className="mt-1 text-xs text-blue-500">Không thấy email? Kiểm tra thư mục Spam.</div>
                  </div>
                </div>
              )}

              {justRegistered && !verifyEmail && (
                <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  Tài khoản đã được tạo thành công! Vui lòng đăng nhập.
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                    <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm transition mt-1"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

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
    </div>
  );
}
