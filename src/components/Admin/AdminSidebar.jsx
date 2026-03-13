import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  UserCircle,
  CreditCard,
  BarChart2,
  ShoppingCart,
  ClipboardCheck,
  UserCog,
  Tag,
  Cpu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
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

  const nav = useMemo(
    () => [
      { to: "/admin", label: "Tổng quan", key: "dashboard", icon: LayoutDashboard },
      { to: "/admin/posts", label: "Quản Lý Bài Viết", key: "posts", icon: FileText },
      { to: "/admin/staff", label: "Quản Lý Nhân Viên", key: "staff", icon: Users },
      { to: "/admin/inventory", label: "Quản Lý Tồn Kho", key: "inventory", icon: Package },
      { to: "/admin/customers", label: "Quản Lý Khách Hàng", key: "customers", icon: UserCircle },
      { to: "/admin/buyers", label: "Quản Lý Người Mua", key: "buyers", icon: ShoppingCart },
      { to: "/admin/inspectors", label: "Quản Lý Kiểm Định Viên", key: "inspectors", icon: ClipboardCheck },
      { to: "/admin/payments", label: "Quản Lý Thanh Toán", key: "payments", icon: CreditCard },
      { to: "/admin/reports", label: "Quản Lý Báo Cáo", key: "reports", icon: BarChart2 },
      { to: "/admin/users", label: "Quản Lý Người Dùng", key: "users", icon: UserCog },
      { to: "/admin/categories", label: "Quản Lý Danh Mục", key: "categories", icon: Tag },
      { to: "/admin/brands", label: "Quản Lý Thương Hiệu", key: "brands", icon: Tag },
      { to: "/admin/components", label: "Quản Lý Linh Kiện", key: "components", icon: Cpu },
    ],
    [],
  );

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
          {collapsed
            ? <ChevronRight size={16} className="text-gray-600" />
            : <ChevronLeft size={16} className="text-gray-600" />}
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
        <div className="space-y-1">
          {nav.map((item) => {
            if (item.children) {
              const opened = openGroup === item.key;
              return (
                <div key={item.key} className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroup((cur) =>
                        cur === item.key ? null : item.key,
                      )
                    }
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-gray-800",
                      opened ? "bg-blue-50" : "",
                    )}
                    title={item.label}
                  >
                    <IconWrap icon={item.icon} active={false} />
                    {!collapsed && (
                      <>
                        <span className="font-medium text-sm">
                          {item.label}
                        </span>
                        <span className="ml-auto text-xs text-gray-500">
                          {opened ? "–" : "+"}
                        </span>
                      </>
                    )}
                  </button>

                  {opened && (
                    <div
                      className={clsx(
                        "mt-1 pl-2",
                        collapsed ? "hidden" : "block",
                      )}
                    >
                      {item.children.map((c) => (
                        <NavLink
                          key={c.to}
                          to={c.to}
                          className={({ isActive }) =>
                            clsx(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm",
                              isActive
                                ? "bg-blue-700 text-white"
                                : "text-gray-700 hover:bg-blue-50",
                            )
                          }
                        >
                          <span className="h-2 w-2 rounded-full bg-gray-300" />
                          <span>{c.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
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
            );
          })}
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