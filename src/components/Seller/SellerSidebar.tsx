import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bike,
  Plus,
  ClipboardCheck,
  Wallet,
  Package,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  ShoppingBag,
  Store,
  History,
  CreditCard,
} from "lucide-react";

function clsx(...arr: (string | boolean | undefined | null)[]): string {
  return arr.filter(Boolean).join(" ");
}

const IconWrap = ({ icon: Icon, active }: { icon: React.ComponentType<any>; active: boolean }) => (
  <span
    className={clsx(
      "inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all",
      active ? "bg-white/20 shadow-sm" : "bg-orange-50 group-hover:bg-orange-100",
    )}
  >
    <Icon size={18} className={active ? "text-white" : "text-orange-600"} />
  </span>
);

export default function SellerSidebar({
  collapsed = false,
  onToggleCollapsed,
  user,
  onLogout,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  user?: any;
  onLogout?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/seller",             label: "Bài đăng của tôi",  key: "posts",        icon: Bike },
    { to: "/seller/orders",      label: "Đơn hàng",          key: "orders",       icon: Package },
    { to: "/seller/disputes",    label: "Tranh chấp",        key: "disputes",     icon: AlertTriangle },
    { to: "/seller/create",      label: "Đăng tin bán xe",   key: "create",       icon: Plus },
    { to: "/seller/inspection",  label: "Kiểm định",         key: "inspection",   icon: ClipboardCheck },
    { to: "/seller/wallet",      label: "Ví",                key: "wallet",       icon: Wallet },
  ];

  const initials = (user?.fullName || user?.email || "S").slice(0, 1).toUpperCase();

  return (
    <aside
      className={clsx(
        "h-screen sticky top-0 flex flex-col transition-all duration-300",
        "bg-gradient-to-b from-orange-600 via-orange-500 to-amber-500",
        collapsed ? "w-[80px]" : "w-[260px]",
      )}
    >
      {/* Logo / Brand */}
      <div className={clsx("flex items-center border-b border-white/20", collapsed ? "justify-center p-4" : "gap-3 px-5 py-5")}>
        {!collapsed && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Store size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-base leading-tight truncate">BikeExchange</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Store size={9} />
                  SELLER
                </span>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Store size={20} className="text-white" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition"
          aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-white" />
          ) : (
            <ChevronLeft size={14} className="text-white" />
          )}
        </button>
      </div>

      {/* User card */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 p-3 rounded-2xl bg-white/15 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/30 flex items-center justify-center text-white font-bold text-base shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || user?.email || "Người bán"}
              </p>
              <p className="text-xs text-orange-100 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center mt-4 mb-2">
          <div className="h-10 w-10 rounded-xl bg-white/30 flex items-center justify-center text-white font-bold text-base">
            {initials}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-orange-200 uppercase tracking-widest px-2 mb-2">
            Quản lý bán hàng
          </p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive: linkActive }) =>
                    clsx(
                      "group flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                      linkActive || isActive
                        ? "bg-white/25 text-white shadow-sm"
                        : "text-orange-100 hover:bg-white/15 hover:text-white",
                      collapsed && "justify-center",
                    )
                  }
                >
                  <IconWrap icon={item.icon} active={isActive} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-3 border-t border-white/20" />

        {/* Quick links */}
        {!collapsed && (
          <p className="text-[10px] font-semibold text-orange-200 uppercase tracking-widest px-2 mb-2">
            Điều hướng nhanh
          </p>
        )}
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => navigate("/")}
              title={collapsed ? "Trang chủ" : undefined}
              className={clsx(
                "group w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                "text-orange-100 hover:bg-white/15 hover:text-white",
                collapsed && "justify-center",
              )}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/20 transition-all shrink-0">
                <Home size={18} className="text-orange-100 group-hover:text-white" />
              </span>
              {!collapsed && <span>Trang chủ</span>}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => navigate("/buyer")}
              title={collapsed ? "Tổng quan Buyer" : undefined}
              className={clsx(
                "group w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                "text-orange-100 hover:bg-white/15 hover:text-white",
                collapsed && "justify-center",
              )}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 group-hover:bg-white/20 transition-all shrink-0">
                <ShoppingBag size={18} className="text-orange-100 group-hover:text-white" />
              </span>
              {!collapsed && <span>Tổng quan Buyer</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/20">
        <button
          type="button"
          onClick={onLogout}
          className={clsx(
            "w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-all",
            "text-orange-100 hover:bg-red-500/30 hover:text-white",
            collapsed && "justify-center",
          )}
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 shrink-0">
            <LogOut size={18} className="text-orange-100" />
          </span>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
