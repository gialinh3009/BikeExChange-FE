import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Bike, MapPin,
  CheckCircle, ShoppingBag, Store, ClipboardCheck, ShieldCheck, Loader2,
} from "lucide-react";
import { registerAPI } from "../../services/authService";

const ROLES = [
  {
    value: "BUYER",
    label: "Người mua",
    desc: "Tìm kiếm & mua xe đạp chất lượng",
    icon: ShoppingBag,
    color: "border-emerald-400 bg-emerald-50 text-emerald-700",
    ring: "ring-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    value: "SELLER",
    label: "Người bán",
    desc: "Đăng tin bán xe, quản lý cửa hàng",
    icon: Store,
    color: "border-blue-400 bg-blue-50 text-blue-700",
    ring: "ring-blue-400",
    dot: "bg-blue-500",
  },
  {
    value: "INSPECTOR",
    label: "Kiểm định viên",
    desc: "Thẩm định chất lượng xe đạp",
    icon: ClipboardCheck,
    color: "border-amber-400 bg-amber-50 text-amber-700",
    ring: "ring-amber-400",
    dot: "bg-amber-500",
  },
  {
    value: "ADMIN",
    label: "Quản trị viên",
    desc: "Quản lý toàn bộ hệ thống",
    icon: ShieldCheck,
    color: "border-purple-400 bg-purple-50 text-purple-700",
    ring: "ring-purple-400",
    dot: "bg-purple-500",
  },
];

const benefits = [
  "Đăng tin mua / bán xe đạp miễn phí",
  "Kiểm định xe bởi chuyên gia uy tín",
  "Thanh toán an toàn, bảo vệ người mua",
  "Hỗ trợ 24/7 qua chat & hotline",
];

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    confirm: "",
    role: "BUYER",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.email || !form.password || !form.confirm) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await registerAPI({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        role: form.role,
      });
      navigate("/login", { state: { registered: true } });
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

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bike size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">BikeExchange</span>
          </div>

          {/* Hero */}
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
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Bike size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">BikeExchange</span>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">Tạo tài khoản</h1>
                <p className="text-sm text-gray-500 mt-1">Miễn phí · Nhanh chóng · An toàn</p>
              </div>

              {error && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bạn là ai?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(({ value, label, desc, icon: Icon, color, ring, dot }) => {
                      const selected = form.role === value;
                      return (
                          <button
                              key={value}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, role: value }))}
                              className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
                                  selected
                                      ? `${color} border-current ring-2 ${ring}`
                                      : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={15} className={selected ? "" : "text-gray-500"} />
                              <span className={`text-xs font-semibold ${selected ? "" : "text-gray-700"}`}>
                            {label}
                          </span>
                            </div>
                            <p className={`text-xs leading-tight ${selected ? "opacity-80" : "text-gray-400"}`}>
                              {desc}
                            </p>
                            {selected && (
                                <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${dot}`} />
                            )}
                          </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={form.fullName}
                        onChange={set("fullName")}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="tel"
                        placeholder="0901 234 567"
                        value={form.phone}
                        onChange={set("phone")}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Địa chỉ <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="123 Lê Lợi, Q1, TP.HCM"
                        value={form.address}
                        onChange={set("address")}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        placeholder="ban@email.com"
                        value={form.email}
                        onChange={set("email")}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type={showPass ? "text" : "password"}
                        placeholder="Tối thiểu 8 ký tự"
                        value={form.password}
                        onChange={set("password")}
                        disabled={loading}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
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

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={form.confirm}
                        onChange={set("confirm")}
                        disabled={loading}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
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

                <p className="text-xs text-gray-400 leading-relaxed">
                  Bằng cách đăng ký, bạn đồng ý với{" "}
                  <span className="text-emerald-600 cursor-pointer hover:underline">Điều khoản dịch vụ</span>{" "}
                  và{" "}
                  <span className="text-emerald-600 cursor-pointer hover:underline">Chính sách bảo mật</span>.
                </p>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold text-sm transition"
                >
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
