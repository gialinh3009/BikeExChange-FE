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
  ShieldCheck,
  Handshake,
  BadgeCheck,
} from "lucide-react";
import { loginAPI } from "../../services/authService";

const BENEFITS = [
  { icon: BadgeCheck, text: "Đăng tin mua / bán xe đạp miễn phí" },
  { icon: ShieldCheck, text: "Kiểm định xe bởi chuyên gia uy tín" },
  { icon: Handshake, text: "Thanh toán an toàn, bảo vệ người mua" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const verifyEmail    = location.state?.verifyEmail === true;
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
      const role = (userData.role || "").toUpperCase();
      if (role === "ADMIN") navigate("/admin", { replace: true });
      else if (role === "INSPECTOR") navigate("/inspector", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("disabled") || msg.toLowerCase().includes("user is disabled")) {
        setError("Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhấn vào link xác thực.");
      } else if (msg.toLowerCase().includes("bad credentials") || msg.toLowerCase().includes("unauthorized")) {
        setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      } else {
        setError(msg || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600">
      <header className="px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25">
            <Bike size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">BikeExchange</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-5xl items-start gap-16">
          <div className="hidden flex-1 flex-col gap-8 pt-6 lg:flex">
            <div>
              <h2 className="text-3xl font-extrabold leading-snug text-white">
                Chào mừng trở lại với<br />
                <span className="text-blue-100">BikeExchange Việt Nam</span>
              </h2>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-blue-50">
                Đăng nhập để tiếp tục mua bán xe đạp, theo dõi đơn hàng và quản lý giao dịch an toàn trên cùng một nền tảng.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4 rounded-2xl bg-white/15 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/25">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{text}</span>
                </div>
              ))}
            </div>

            <div className="max-w-sm rounded-2xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="flex items-start gap-2 text-blue-50">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Hệ thống lưu token và vai trò tài khoản theo phiên bảo mật, đảm bảo an toàn khi đăng nhập.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full flex-shrink-0 lg:w-[460px]">
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              <h1 className="mb-6 text-xl font-bold text-gray-900">Đăng nhập</h1>

              {verifyEmail && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Đăng ký thành công! 🎉</div>
                    <div className="mt-0.5">
                      Chúng tôi đã gửi email xác thực tới <strong>{registeredEmail || "hộp thư của bạn"}</strong>.
                      Vui lòng kiểm tra email và nhấn vào link xác thực trước khi đăng nhập.
                    </div>
                    <div className="mt-1 text-xs text-blue-500">Không thấy email? Kiểm tra thư mục Spam / Junk.</div>
                  </div>
                </div>
              )}

              {justRegistered && !verifyEmail && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={16} className="shrink-0" />
                  Tài khoản đã được tạo thành công! Vui lòng đăng nhập.
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <button type="button" className="text-xs text-blue-600 hover:underline">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                      disabled={loading}
                      autoComplete="current-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="font-semibold text-blue-600 hover:underline">
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