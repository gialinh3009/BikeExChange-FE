import { Bike, Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const LINKS = {
  "Về chúng tôi": ["Giới thiệu", "Đội ngũ", "Tuyển dụng", "Tin tức"],
  "Dịch vụ": ["Mua xe đạp", "Bán xe đạp", "Định giá xe", "Kiểm định chất lượng"],
  "Hỗ trợ": ["Trung tâm trợ giúp", "Chính sách đổi trả", "Hướng dẫn thanh toán", "Báo cáo sự cố"],
};

// SVG brand icons (inline, not from lucide)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SOCIALS = [
  { icon: FacebookIcon, label: "Facebook", color: "hover:bg-blue-600" },
  { icon: YoutubeIcon, label: "YouTube", color: "hover:bg-red-600" },
  { icon: InstagramIcon, label: "Instagram", color: "hover:bg-pink-600" },
  { icon: XIcon, label: "Twitter / X", color: "hover:bg-sky-500" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                <Bike size={22} />
              </div>
              <span className="text-xl font-bold text-white">
                Bike<span className="text-blue-400">Exchange</span>
              </span>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Sàn giao dịch xe đạp second-hand uy tín hàng đầu Việt Nam. Kết nối người mua và người bán, đảm bảo mọi giao dịch an toàn và minh bạch.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 text-sm">
              <a href="tel:0909123456" className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors">
                <Phone size={15} className="text-blue-400" />
                0909 123 456
              </a>
              <a href="mailto:hello@bikeexchange.vn" className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors">
                <Mail size={15} className="text-blue-400" />
                hello@bikeexchange.vn
              </a>
              <div className="flex items-center gap-2.5 text-gray-400">
                <MapPin size={15} className="text-blue-400 shrink-0" />
                <span>123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2 pt-1">
              {SOCIALS.map(({ icon: Icon, label, color }) => (
                <button
                  key={label}
                  title={label}
                  className={`w-9 h-9 bg-gray-800 ${color} text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-flex items-center gap-1 transition-all"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 bg-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h4 className="text-white font-semibold">Đăng ký nhận tin</h4>
            <p className="text-gray-400 text-sm mt-1">
              Nhận thông báo xe mới, khuyến mãi và bài viết hàng tuần.
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="flex-1 sm:w-64 bg-gray-700 border border-gray-600 focus:border-blue-500 text-white placeholder-gray-400 text-sm px-4 py-2.5 rounded-xl outline-none transition-colors"
            />
            <button className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 BikeExchange. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
