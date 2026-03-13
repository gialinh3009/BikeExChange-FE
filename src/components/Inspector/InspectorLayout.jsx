import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import InspectorSidebar from "./InspectorSidebar";

function clsx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function InspectorLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      if (onLogout) await onLogout();
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/20">
      <div className="flex">
        <InspectorSidebar
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          user={user}
          onLogout={handleLogout}
        />

        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
            <div className="px-4 md:px-6 h-16 flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-amber-50"
              >
                <Menu size={18} className="text-gray-600" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 ml-0">
                <Search size={15} className="text-gray-400 shrink-0" />
                <input
                  className="w-44 md:w-56 outline-none text-sm placeholder:text-gray-400"
                  placeholder="Tìm kiểm định..."
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Notification */}
                <button className="relative h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 hover:bg-amber-50">
                  <Bell size={17} className="text-gray-600" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />
                </button>

                {/* User avatar */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    {user?.email?.[0]?.toUpperCase() ?? "I"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user?.email ?? "Inspector"}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="h-10 inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 text-sm font-semibold"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="px-4 md:px-6 py-6">
            <Outlet />
          </main>

          <footer className="px-4 md:px-6 py-4 text-xs text-gray-400 border-t border-gray-100">
            © {new Date().getFullYear()} BikeExchange — Inspector Portal
          </footer>
        </div>
      </div>
    </div>
  );
}
