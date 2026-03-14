import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, User, Phone, Bike,
  CheckCircle, Loader2, ShieldCheck, Handshake, BadgeCheck, MapPin,
} from "lucide-react";
import { registerAPI } from "../../services/authService";

const BENEFITS = [
  { icon: BadgeCheck,  text: "Đăng tin mua / bán xe đạp miễn phí" },
  { icon: ShieldCheck, text: "Kiểm định xe bởi chuyên gia uy tín" },
  { icon: Handshake,   text: "Thanh toán an toàn, bảo vệ người mua" },
];

const VN_PHONE_RE = /^(0)(3[2-9]|5[6-9]|7[06-9]|8[0-689]|9[0-9])\d{7}$/;

export default function Register() {
  const navigate = useNavigate();

  /* ── form ── */
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", confirm: "" });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  /* ── address cascade ── */
  const [provinces,   setProvinces]   = useState([]);
  const [districts,   setDistricts]   = useState([]);
  const [wards,       setWards]       = useState([]);
  const [province,    setProvince]    = useState("");
  const [district,    setDistrict]    = useState("");
  const [ward,        setWard]        = useState("");
  const [detail,      setDetail]      = useState("");   // số nhà + tên đường
  const [addrLoading, setAddrLoading] = useState(false);

  /* fetch provinces */
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then((r) => r.json()).then(setProvinces).catch(() => {});
  }, []);

  /* fetch districts */
  useEffect(() => {
    if (!province) { setDistricts([]); setDistrict(""); setWards([]); setWard(""); return; }
    setAddrLoading(true);
    fetch(`https://provinces.open-api.vn/api/p/${province}?depth=2`)
      .then((r) => r.json())
      .then((d) => { setDistricts(d.districts || []); setDistrict(""); setWards([]); setWard(""); })
      .catch(() => {}).finally(() => setAddrLoading(false));
  }, [province]);

  /* fetch wards */
  useEffect(() => {
    if (!district) { setWards([]); setWard(""); return; }
    setAddrLoading(true);
    fetch(`https://provinces.open-api.vn/api/d/${district}?depth=2`)
      .then((r) => r.json())
      .then((d) => { setWards(d.wards || []); setWard(""); })
      .catch(() => {}).finally(() => setAddrLoading(false));
  }, [district]);

  /* helpers */
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const buildAddress = () => {
    const pName = provinces.find((p) => String(p.code) === province)?.name || "";
    const dName = districts.find((d) => String(d.code) === district)?.name || "";
    const wName = wards.find((w) => String(w.code) === ward)?.name || "";
    return [detail, wName, dName, pName].filter(Boolean).join(", ");
  };

  const validate = () => {
    if (!form.fullName.trim())  return "Vui lòng nhập họ và tên.";
    if (!form.email.trim())     return "Vui lòng nhập email.";
    if (!form.phone.trim())     return "Vui lòng nhập số điện thoại.";
    if (!VN_PHONE_RE.test(form.phone.replace(/\s/g, "")))
      return "Số điện thoại không hợp lệ (VD: 0901 234 567).";
    if (!province || !district || !ward || !detail.trim())
      return "Vui lòng nhập đầy đủ địa chỉ.";
    if (form.password.length < 8)         return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (form.password !== form.confirm)   return "Mật khẩu xác nhận không khớp.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await registerAPI({
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        password: form.password,
        phone:    form.phone.replace(/\s/g, ""),
        address:  buildAddress(),
        role:     "BUYER",
      });
      navigate("/login", { state: { verifyEmail: true, email: form.email.trim() } });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("email") && (msg.includes("exist") || msg.includes("already") || msg.includes("duplicate") || msg.includes("registered") || msg.includes("tồn tại") || msg.includes("đã được sử dụng"))) {
        setError("Email này đã được sử dụng. Vui lòng nhập email khác.");
      } else if (msg.includes("phone") || msg.includes("số điện thoại")) {
        setError("Số điện thoại không hợp lệ hoặc đã được sử dụng.");
      } else if (msg.includes("password") || msg.includes("mật khẩu")) {
        setError("Mật khẩu không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
        setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
      } else {
        setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls  = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white disabled:bg-gray-50";
  const selectCls = "w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white appearance-none disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 flex-shrink-0">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/25 flex items-center justify-center">
            <Bike size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">BikeExchange</span>
        </Link>
      </header>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl flex gap-16 items-start">

          {/* Left */}
          <div className="hidden lg:flex flex-col flex-1 gap-8 pt-6">
            <div>
              <h2 className="text-3xl font-extrabold text-white leading-snug">
                Tham gia cộng đồng<br />
                <span className="text-emerald-100">xe đạp Việt Nam</span>
              </h2>
              <p className="mt-3 text-emerald-50 text-base leading-relaxed max-w-sm">
                Tạo tài khoản miễn phí và bắt đầu mua bán xe đạp chất lượng
                đã qua kiểm định, giao dịch an toàn mọi nơi.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4 bg-white/15 rounded-2xl px-4 py-3">
                  <div className="h-9 w-9 rounded-xl bg-white/25 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="w-full lg:w-[460px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Tạo tài khoản</h1>
              <p className="text-sm text-gray-500 mb-6">Miễn phí · Nhanh chóng · An toàn</p>

              {error && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Nguyễn Văn A" value={form.fullName}
                      onChange={set("fullName")} disabled={loading} className={inputCls} autoComplete="name" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="email" placeholder="example@email.com" value={form.email}
                      onChange={set("email")} disabled={loading} className={inputCls} autoComplete="email" />
                  </div>
                </div>

                {/* SĐT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input type="tel" placeholder="0901 234 567" value={form.phone}
                      onChange={set("phone")} disabled={loading} className={inputCls} maxLength={11} />
                  </div>
                  {form.phone && !VN_PHONE_RE.test(form.phone.replace(/\s/g, "")) && (
                    <p className="mt-1 text-xs text-red-500">Đầu số không hợp lệ (VD: 032, 056, 070, 089, 090...)</p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2.5">

                    {/* Tỉnh / Thành phố */}
                    <div className="relative">
                      <select value={province} onChange={(e) => setProvince(e.target.value)}
                        disabled={loading || provinces.length === 0} className={selectCls}>
                        <option value="">Tỉnh / Thành phố</option>
                        {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                    </div>

                    {/* Quận / Huyện */}
                    <div className="relative">
                      <select value={district} onChange={(e) => setDistrict(e.target.value)}
                        disabled={loading || !province || addrLoading} className={selectCls}>
                        <option value="">Quận / Huyện</option>
                        {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                    </div>

                    {/* Phường / Xã */}
                    <div className="relative">
                      <select value={ward} onChange={(e) => setWard(e.target.value)}
                        disabled={loading || !district || addrLoading} className={selectCls}>
                        <option value="">Phường / Xã</option>
                        {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                    </div>

                    {/* Địa chỉ chi tiết */}
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={ward ? "Số nhà, tên đường (VD: 123 Lê Lợi)" : "Chọn phường/xã trước"}
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        disabled={loading || !ward}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>

                    {/* Preview */}
                    {buildAddress() && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-emerald-700 leading-relaxed font-medium">{buildAddress()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mật khẩu + Xác nhận */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="Tối thiểu 8 ký tự"
                        value={form.password} onChange={set("password")} disabled={loading}
                        autoComplete="new-password"
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white" />
                      <button type="button" onClick={() => setShowPass((v) => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.password && form.password.length < 8 && (
                      <p className="mt-1 text-xs text-red-500">Ít nhất 8 ký tự</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Xác nhận <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} placeholder="Nhập lại"
                        value={form.confirm} onChange={set("confirm")} disabled={loading}
                        autoComplete="new-password"
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white" />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.confirm && form.confirm !== form.password && (
                      <p className="mt-1 text-xs text-red-500">Không khớp</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  Bằng cách đăng ký, bạn đồng ý với{" "}
                  <span className="text-emerald-600 cursor-pointer hover:underline">Điều khoản dịch vụ</span>{" "}
                  và{" "}
                  <span className="text-emerald-600 cursor-pointer hover:underline">Chính sách bảo mật</span>.
                </p>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition">
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
    </div>
  );
}
