import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  RefreshCw,
  FileBarChart2,
  FilePlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Bike,
} from "lucide-react";

function clsx(...arr) {
  return arr.filter(Boolean).join(" ");
}

const NAV = [
  // { to: "/inspector", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/inspector/inspections", label: "Quản lý kiểm định", icon: ClipboardList },
  { to: "/inspector/status", label: "Trạng thái kiểm định", icon: RefreshCw },
  { to: "/inspector/reports", label: "Quản lý báo cáo", icon: FileBarChart2 },
  // { to: "/inspector/create-report", label: "Tạo báo cáo", icon: FilePlus },
  { to: "/inspector/reports-list", label: "Danh sách báo cáo", icon: FilePlus },
];

function IconWrap({ icon: Icon, active }) {
  return (
    <span
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
        active ? "bg-white/20" : "bg-amber-50"
      )}
    >
      <Icon size={18} className={active ? "text-white" : "text-amber-700"} />
    </span>
  );
}

export default function InspectorSidebar({
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
  user,
  onLogout,
}) {
  const SidebarContent = (
    <aside
      className={clsx(
        "h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        collapsed ? "w-[88px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
          <Bike size={20} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 leading-tight">BikeExchange</div>
            <div className="text-xs text-amber-600 font-medium">Kiểm định viên</div>
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapsed}
          className="ml-auto hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-amber-50 shrink-0"
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed
            ? <ChevronRight size={15} className="text-gray-500" />
            : <ChevronLeft size={15} className="text-gray-500" />}
        </button>

        {/* Mobile close */}
        <button
          onClick={onClose}
          className="ml-auto md:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 hover:bg-amber-50"
        >
          <X size={15} className="text-gray-500" />
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-3 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? "I"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {user?.email ?? "Kiểm định viên"}
              </p>
              <p className="text-[10px] text-amber-600">Inspector</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-gray-700 hover:bg-amber-50 hover:text-amber-700"
              )
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <IconWrap icon={item.icon} active={isActive} />
                {!collapsed && (
                  <span className="font-medium text-sm leading-none">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-700 hover:text-red-600 transition-all"
          title="Đăng xuất"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 shrink-0">
            <LogOut size={17} className="text-gray-500" />
          </span>
          {!collapsed && <span className="font-medium text-sm">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block h-screen sticky top-0">{SidebarContent}</div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50">{SidebarContent}</div>
        </div>
      )}
    </>
  );
}
