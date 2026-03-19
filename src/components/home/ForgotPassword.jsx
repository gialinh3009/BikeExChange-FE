import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Bike, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPasswordAPI } from "../../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordAPI(email.trim());
      setSent(true);
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("không tìm thấy")) {
        setError("Email này chưa được đăng ký trong hệ thống.");
      } else {
        setError(err.message || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

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
            {!sent ? (
              <>
                <Link
                  to="/login"
                  className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition"
                >
                  <ArrowLeft size={14} />
                  Quay lại đăng nhập
                </Link>

                <h1 className="mb-2 text-xl font-bold text-gray-900">Quên mật khẩu</h1>
                <p className="mb-6 text-sm text-gray-500">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu qua email cho bạn.
                </p>

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
                      <Mail
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <CheckCircle2 size={52} className="text-emerald-500" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Đã gửi email!</h2>
                <p className="mb-2 text-sm text-gray-600">
                  Chúng tôi đã gửi link đặt lại mật khẩu tới <strong>{email}</strong>.
                </p>
                <p className="mb-6 text-xs text-gray-400">
                  Vui lòng kiểm tra hộp thư (bao gồm Spam / Junk). Link sẽ hết hạn sau 24 giờ.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <ArrowLeft size={14} />
                  Quay lại đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
