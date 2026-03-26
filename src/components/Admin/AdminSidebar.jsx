import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardCheck,
  UserCog,
  Tag,
  Cpu,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  ArrowLeftRight,
  RefreshCw,
  Bike,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
} from "lucide-react";




function clsx(...arr) {
  return arr.filter(Boolean).join(" ");
}




const IconWrap = ({ icon: Icon, active }) => (
  <span
    className={clsx(
      "inline-flex h-9 w-9 items-center justify-center rounded-lg",
      active ? "bg-white/20" : "bg-blue-50",
    )}
  >
    <Icon size={18} className={active ? "text-white" : "text-gray-700"} />
  </span>
);




export default function AdminSidebar({
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
  onLogout,
}) {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);




  const navActive = useMemo(
    () => [
      {
        to: "/admin",
        label: "Tổng quan",
        key: "dashboard",
        icon: LayoutDashboard,
      },
      {
        to: "/admin/users",
        label: "Quản Lý Người Dùng",
        key: "users",
        icon: UserCog,
      },
      {
        to: "/admin/bikes",
        label: "Quản Lý Xe Đạp",
        key: "bikes",
        icon: Bike,
      },
      {
        to: "/admin/orders",
        label: "Quản Lý Đơn Hàng",
        key: "orders",
        icon: ShoppingBag,
      },
      {
        to: "/admin/transactions",
        label: "Quản Lý Giao Dịch",
        key: "transactions",
        icon: ArrowLeftRight,
      },
      {
        to: "/admin/withdrawals",
        label: "Quản Lý Rút Điểm",
        key: "withdrawals",
        icon: Wallet,
      },
      {
        to: "/admin/disputes",
        label: "Quản Lý Khiếu Nại",
        key: "disputes",
        icon: AlertTriangle,
      },
      {
        to: "/admin/inspectors",
        label: "Quản Lý Kiểm Định Viên",
        key: "inspectors",
        icon: ClipboardCheck,
      },
      {
        to: "/admin/inspection-status",
        label: "Trạng Thái Kiểm Định",
        key: "inspection-status",
        icon: RefreshCw,
      },
      {
        to: "/admin/brands",
        label: "Quản Lý Thương Hiệu",
        key: "brands",
        icon: Tag,
      },
      {
        to: "/admin/categories",
        label: "Quản Lý Danh Mục",
        key: "categories",
        icon: Tag,
      },
      {
        to: "/admin/components",
        label: "Quản Lý Linh Kiện",
        key: "components",
        icon: Cpu,
      },
      {
        to: "/admin/order-rules",
        label: "Quản Lý Cấu Hình Đơn",
        key: "order-rules",
        icon: Settings,
      },
      {
        to: "/admin/combos",
        label: "Quản Lý Gói Combo",
        key: "combos",
        icon: Package,
      },
    ],
    [],
  );




  const nav = useMemo(() => [...navActive], [navActive]);




  React.useEffect(() => {
    const matchedGroup = nav.find(
      (i) =>
        i.children &&
        i.children.some((c) => location.pathname.startsWith(c.to)),
    );
    if (matchedGroup) setOpenGroup(matchedGroup.key);
  }, [location.pathname, nav]);




  const SidebarContent = (
    <aside
      className={clsx(
        "h-full bg-white border-r border-gray-200 flex flex-col",
        collapsed ? "w-[88px]" : "w-[280px]",
      )}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shrink-0">
          BX
        </div>




        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 leading-tight">
              BikeExchange
            </div>
            <div className="text-xs text-gray-500 truncate">Admin Console</div>
          </div>
        )}




        <button
          onClick={onToggleCollapsed}
          className={clsx(
            "ml-auto hidden md:inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-blue-50",
            "h-9 w-9 shrink-0",
          )}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          type="button"
        >
          {collapsed ? (
            <ChevronRight size={16} className="text-gray-600" />
          ) : (
            <ChevronLeft size={16} className="text-gray-600" />
          )}
        </button>




        <button
          onClick={onClose}
          className="ml-auto md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-blue-50 h-9 w-9 shrink-0"
          type="button"
          aria-label="Close sidebar"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>




      {/* Nav */}
      <nav className="px-3 py-3 flex-1 overflow-y-auto">
        {/* Active features */}
        <div className="space-y-1">
          {navActive.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-xl",
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-gray-800 hover:bg-blue-50",
                )
              }
              title={item.label}
            >
              {({ isActive }) => (
                <>
                  <IconWrap icon={item.icon} active={isActive} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>




      </nav>




      {/* Footer actions */}
      <div className="p-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 hover:bg-blue-50 text-gray-800"
          title="Đăng xuất"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <LogOut size={18} className="text-blue-700" />
          </span>
          {!collapsed && <span className="font-medium text-sm">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );




  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block h-screen sticky top-0">
        {SidebarContent}
      </div>




      {/* Mobile Drawer */}
      <div className={clsx("md:hidden", isOpen ? "block" : "hidden")}>
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="fixed inset-y-0 left-0 z-50">{SidebarContent}</div>
      </div>
    </>
  );
}









