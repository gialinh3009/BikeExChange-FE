import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, Bike, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { resetPasswordAPI } from "../../services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Countdown redirect after success
  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      navigate("/login", { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordAPI({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("expired") || msg.includes("hết hạn")) {
        setError("Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu gửi lại.");
      } else if (msg.includes("invalid") || msg.includes("không hợp lệ")) {
        setError("Link đặt lại mật khẩu không hợp lệ.");
      } else if (msg.includes("match") || msg.includes("khớp")) {
        setError("Mật khẩu xác nhận không khớp.");
      } else {
        setError(err.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 flex flex-col">
        <header className="px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25">
              <Bike size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">BikeExchange</span>
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
            <XCircle size={52} className="mx-auto mb-4 text-red-500" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Liên kết không hợp lệ</h2>
            <p className="mb-6 text-sm text-gray-500">
              Không tìm thấy token trong đường dẫn. Vui lòng sử dụng link trong email.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
            >
              Yêu cầu gửi lại link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 flex flex-col">
      <header className="px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25">
            <Bike size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">BikeExchange</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            {!success ? (
              <>
                <h1 className="mb-2 text-xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
                <p className="mb-6 text-sm text-gray-500">
                  Nhập mật khẩu mới cho tài khoản của bạn.
                </p>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Ít nhất 8 ký tự"
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                        disabled={loading}
                        autoComplete="new-password"
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

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <CheckCircle2 size={52} className="text-emerald-500" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Đặt lại mật khẩu thành công!</h2>
                <p className="mb-6 text-sm text-gray-600">
                  Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.
                </p>
                <button
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
