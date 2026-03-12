import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Bike, MapPin,
  CheckCircle, Loader2, ShoppingBag,
} from "lucide-react";
import { registerAPI } from "../../services/authService";

const benefits = [
  "Đăng tin mua / bán xe đạp miễn phí",
  "Kiểm định xe bởi chuyên gia uy tín",
  "Thanh toán an toàn, bảo vệ người mua",
  "Hỗ trợ 24/7 qua chat & hotline",
];

export default function Register() {
  const navigate = useNavigate();
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [form, setForm] = useState({
    fullName: "", phone: "", address: "", email: "", password: "", confirm: "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.password || !form.confirm) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc."); return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự."); return;
    }
    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp."); return;
    }
    setLoading(true);
    try {
      // ✅ Luôn đăng ký BUYER — không cho chọn role khác
      await registerAPI({
        fullName: form.fullName,
        email:    form.email,
        password: form.password,
        phone:    form.phone    || undefined,
        address:  form.address  || undefined,
        role:     "BUYER",
      });
      navigate("/login", { state: { verifyEmail: true, email: form.email } });
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10" />
          <div className="absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bike size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">BikeExchange</span>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Tham gia cộng đồng<br />
              <span className="text-emerald-200">xe đạp Việt Nam</span>
            </h2>
            <p className="text-emerald-100 mt-4 text-base leading-relaxed max-w-sm">
              Hàng nghìn xe đạp chất lượng đang chờ bạn. Tạo tài khoản chỉ mất 1 phút!
            </p>
            <div className="mt-8 space-y-3">
              {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-200 shrink-0" />
                    <span className="text-white text-sm">{b}</span>
                  </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-emerald-200 text-xs">
            © {new Date().getFullYear()} BikeExchange. All rights reserved.
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
          <div className="w-full max-w-lg py-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Bike size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">BikeExchange</span>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="mb-5">
                <h1 className="text-2xl font-extrabold text-gray-900">Tạo tài khoản</h1>
                <p className="text-sm text-gray-500 mt-1">Miễn phí · Nhanh chóng · An toàn</p>
              </div>

              {/* Role badge — cố định BUYER, không cho chọn */}
              <div className="mb-5 flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-emerald-800">Người mua</div>
                  <div className="text-xs text-emerald-600">Tìm kiếm & mua xe đạp chất lượng</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              </div>

              {error && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Nguyễn Văn A" value={form.fullName}
                           onChange={set("fullName")} disabled={loading}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
                  </div>
                </div>

                {/* Phone + Address — 2 cột */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Số điện thoại <span className="text-gray-400 font-normal text-xs">(tuỳ chọn)</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" placeholder="0901 234 567" value={form.phone}
                             onChange={set("phone")} disabled={loading}
                             className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Địa chỉ <span className="text-gray-400 font-normal text-xs">(tuỳ chọn)</span>
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="TP.HCM" value={form.address}
                             onChange={set("address")} disabled={loading}
                             className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" placeholder="ban@email.com" value={form.email}
                           onChange={set("email")} disabled={loading}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
                  </div>
                </div>

                {/* Password + Confirm — 2 cột */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={showPass ? "text" : "password"} placeholder="Tối thiểu 8 ký tự"
                             value={form.password} onChange={set("password")} disabled={loading}
                             className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
                      <button type="button" onClick={() => setShowPass((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Xác nhận <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={showConfirm ? "text" : "password"} placeholder="Nhập lại"
                             value={form.confirm} onChange={set("confirm")} disabled={loading}
                             className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  Bằng cách đăng ký, bạn đồng ý với{" "}
                  <span className="text-emerald-600 cursor-pointer hover:underline">Điều khoản dịch vụ</span>{" "}
                  và{" "}
                  <span className="text-emerald-600 cursor-pointer hover:underline">Chính sách bảo mật</span>.
                </p>

                <button type="submit" disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold text-sm transition">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}