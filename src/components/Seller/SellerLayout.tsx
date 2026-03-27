import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Home, ShoppingBag, Store, Search } from "lucide-react";
import SellerSidebar from "./SellerSidebar";

export default function SellerLayout({ user, onLogout }: { user?: any; onLogout?: () => void }) {
  const navigate = useNavigate();
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

  const initials = (user?.fullName || user?.email || "S").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-orange-50/30 flex">
      {/* Sidebar */}
      <SellerSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-orange-100 shadow-sm">
          <div className="px-4 md:px-6 h-16 flex items-center gap-3">
            {/* Role badge */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                <Store size={14} className="text-orange-600" />
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Seller Dashboard</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  className="w-48 outline-none text-sm bg-transparent placeholder:text-gray-400"
                  placeholder="Tìm kiếm..."
                />
              </div>

              {/* Go to Home */}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="hidden sm:inline-flex h-9 items-center gap-2 justify-center rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 px-3 text-sm font-medium text-gray-600 hover:text-orange-700 transition"
              >
                <Home size={15} />
                <span className="hidden md:inline">Trang chủ</span>
              </button>

              {/* Go to Buyer overview */}
              <button
                type="button"
                onClick={() => navigate("/buyer")}
                className="hidden sm:inline-flex h-9 items-center gap-2 justify-center rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 text-sm font-medium text-orange-700 transition"
              >
                <ShoppingBag size={15} />
                <span className="hidden md:inline">Tổng quan Buyer</span>
              </button>

              {/* User avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {initials}
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
                    {user?.fullName || user?.email || "Người bán"}
                  </p>
                  <p className="text-[10px] text-orange-600 font-medium">Người bán</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 md:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
