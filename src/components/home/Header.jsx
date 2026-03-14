import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bike, Menu, X, Search, ShoppingCart, User, ChevronDown } from "lucide-react";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  {
    label: "Sản phẩm",
    href: "#products",
    children: [
      { label: "Xe đạp địa hình", href: "#" },
      { label: "Xe đạp đường trường", href: "#" },
      { label: "Xe đạp thành thị", href: "#" },
      { label: "Phụ kiện", href: "#" },
    ],
  },
  { label: "Blog", href: "#blog" },
  { label: "Về chúng tôi", href: "#" },
  { label: "Liên hệ", href: "#" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top bar */}
      <div className="bg-blue-700 text-white text-xs py-1.5 text-center tracking-wide">
        Miễn phí vận chuyển cho đơn hàng trên 2.000.000 ₫ &nbsp;|&nbsp; Hotline:{" "}
        <span className="font-semibold">0909 123 456</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:bg-blue-700 transition-colors">
              <Bike size={22} />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Bike<span className="text-blue-600">Exchange</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Search size={20} />
            </button>

            {/* Cart */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <ShoppingCart size={20} />
              <span className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                3
              </span>
            </button>

            {/* Auth buttons */}
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <User size={15} />
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Đăng ký
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm xe đạp, phụ kiện..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border border-transparent focus:border-blue-300 focus:bg-white rounded-xl text-sm outline-none transition-all"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={() => { navigate("/login"); setMobileOpen(false); }}
              className="flex-1 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => { navigate("/register"); setMobileOpen(false); }}
              className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl"
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
