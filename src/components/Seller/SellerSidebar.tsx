import React from "react";
import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";

function clsx(...arr: (string | boolean | undefined | null)[]): string {
  return arr.filter(Boolean).join(" ");
}

const IconWrap = ({ icon: Icon, active }: { icon: React.ComponentType<any>; active: boolean }) => (
  <span
    className={clsx(
      "inline-flex h-9 w-9 items-center justify-center rounded-lg",
      active ? "bg-white/20" : "bg-blue-50",
    )}
  >
    <Icon size={18} className={active ? "text-white" : "text-gray-700"} />
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

  const navItems = [
    {
      to: "/seller",
      label: "Bài đăng của tôi",
      key: "posts",
      icon: Bike,
    },
    {
      to: "/seller/orders",
      label: "Đơn hàng",
      key: "orders",
      icon: Package,
    },
    {
      to: "/seller/disputes",
      label: "Tranh chấp",
      key: "disputes",
      icon: AlertTriangle,
    },
    {
      to: "/seller/create",
      label: "Đăng tin bán xe",
      key: "create",
      icon: Plus,
    },
    {
      to: "/seller/inspection",
      label: "Kiểm định",
      key: "inspection",
      icon: ClipboardCheck,
    },
    {
      to: "/seller/wallet",
      label: "Ví",
      key: "wallet",
      icon: Wallet,
    },
  ];

  return (
    <aside
      className={clsx(
        "h-full bg-white border-r border-gray-200 flex flex-col",
        collapsed ? "w-[88px]" : "w-[280px]",
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Bike size={18} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">BikeExchange</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="h-8 w-8 rounded-lg border border-gray-200 hover:bg-blue-50 flex items-center justify-center"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={16} className="text-gray-600" />
            ) : (
              <ChevronLeft size={16} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  className={({ isActive: linkActive }) =>
                    clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                      linkActive || isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700",
                    )
                  }
                >
                  <IconWrap icon={item.icon} active={isActive} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "S"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.fullName || user?.email || "Người bán"}
              </p>
              <p className="text-xs text-gray-500">Người bán</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full mt-3 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}