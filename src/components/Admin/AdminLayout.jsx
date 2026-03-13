import React, { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

/**
 * AdminLayout
 * - Wrap routes under /admin
 * - Provides sidebar + topbar
 *
 * Optional:
 * - Pass user via props or from your auth store/context
 * - Implement logout handler
 */

function clsx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function AdminLayout({ user, onLogout }) {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const title = useMemo(() => "Admin", []);

  const handleLogout = async () => {
    try {
      if (onLogout) await onLogout();
    } finally {
      // fallback: xóa token localStorage nếu bạn đang dùng
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/20">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-blue-100 shadow-sm">
            <div className="px-4 md:px-6 h-16 flex items-center gap-3">
              <button
                type="button"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-blue-50"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={18} className="text-gray-600" />
              </button>

              <div className="min-w-0">
                <div className="font-semibold text-gray-900 leading-tight">
                  {title}
                </div>
                <div className="text-xs text-gray-500">
                  Quản trị hệ thống BikeExchange
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                  <Search size={15} className="text-gray-400 shrink-0" />
                  <input
                    className="w-44 md:w-64 outline-none text-sm placeholder:text-gray-400"
                    placeholder="Tìm nhanh…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // bạn nối search tại đây (optional)
                        // console.log("Search:", e.currentTarget.value);
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-blue-50 px-4 text-sm font-medium"
                >
                  Về trang chủ
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-700 text-white hover:bg-blue-800 px-4 text-sm font-semibold"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className={clsx("px-4 md:px-6 py-6")}>
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="px-4 md:px-6 py-6 text-xs text-gray-500">
            © {new Date().getFullYear()} BikeExchange Admin
          </footer>
        </div>
      </div>
    </div>
  );
}