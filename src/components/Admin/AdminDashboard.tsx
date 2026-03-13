import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  Banknote,
  ShoppingBag,
  Users,
  ClipboardCheck,
  ShoppingCart,
  UserCheck,
  Bike,
} from "lucide-react";

import {
  getUserStatisticsAPI,
  getRevenueStatisticsAPI,
  getOrderStatisticsAPI,
  getInspectionStatisticsAPI,
  getBikeStatisticsAPI,
  getAdminDashboardAPI,
} from "../../services/Admin/dashboardAdminService";

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị viên",
  SELLER: "Người bán",
  BUYER: "Người mua",
  INSPECTOR: "Kiểm định viên",
};

function fmtCurrency(v: number) {
  return v.toLocaleString("vi-VN") + "₫";
}

interface UserStats {
  total: number;
  byRole: Record<string, number>;
}

interface RevenueStats {
  totalCommissionRevenue: number;
  completedOrders: number;
}

interface OrderStats {
  total: number;
  byStatus: Record<string, number>;
}

interface InspectionStats {
  requested: number;
  assigned: number;
  inspected: number;
}

interface BikeStats {
  total: number;
  byStatus: Record<string, number>;
}

interface DashboardStats {
  totalListings: number;
  totalUsers: number;
  pendingDisputes: number;
  totalCommissionRevenue: number;
  totalCompletedOrders: number;
  inspectionStatistics: {
    requested: number;
    assigned: number;
    inspectedWaitApprove: number;
  };
}

export default function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [inspectionStats, setInspectionStats] = useState<InspectionStats | null>(null);
  const [bikeStats, setBikeStats] = useState<BikeStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUserStatisticsAPI(),
      getRevenueStatisticsAPI(),
      getOrderStatisticsAPI(),
      getInspectionStatisticsAPI(),
      getBikeStatisticsAPI(),
      getAdminDashboardAPI(),
    ])
      .then(([users, revenue, orders, inspections, bikes, dashboard]) => {
        setUserStats(users);
        setRevenueStats(revenue);
        setOrderStats(orders);
        setInspectionStats(inspections);
        setBikeStats(bikes);
        setDashboardStats(dashboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topStats = [
    {
      label: "Tổng người dùng",
      value: loading ? "—" : String(dashboardStats?.totalUsers ?? userStats?.total ?? 0),
      icon: Users,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Doanh thu hoa hồng",
      value: loading
        ? "—"
        : fmtCurrency(
            dashboardStats?.totalCommissionRevenue ??
              revenueStats?.totalCommissionRevenue ??
              0
          ),
      icon: Banknote,
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Đơn hàng hoàn thành",
      value: loading
        ? "—"
        : String(
            dashboardStats?.totalCompletedOrders ??
              revenueStats?.completedOrders ??
              0
          ),
      icon: ShoppingBag,
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Tổng đơn hàng",
      value: loading ? "—" : String(orderStats?.total ?? 0),
      icon: ShoppingCart,
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      label: "Tổng xe",
      value: loading ? "—" : String(dashboardStats?.totalListings ?? bikeStats?.total ?? 0),
      icon: Bike,
      bg: "bg-cyan-50",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      label: "Tranh chấp chờ xử lý",
      value: loading ? "—" : String(dashboardStats?.pendingDisputes ?? 0),
      icon: ClipboardCheck,
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  const roleChartData = userStats
    ? Object.entries(userStats.byRole).map(([role, count]) => ({
        name: ROLE_LABEL[role] ?? role,
        value: count,
      }))
    : [];

  const orderStatusData =
    orderStats && Object.keys(orderStats.byStatus).length > 0
      ? Object.entries(orderStats.byStatus).map(([status, count]) => ({
          name: status,
          count,
        }))
      : [];

  const inspectionChartData = dashboardStats
    ? [
        {
          name: "Yêu cầu kiểm định",
          value: dashboardStats.inspectionStatistics.requested,
        },
        {
          name: "Đã phân công",
          value: dashboardStats.inspectionStatistics.assigned,
        },
        {
          name: "Chờ duyệt",
          value: dashboardStats.inspectionStatistics.inspectedWaitApprove,
        },
      ]
    : inspectionStats
    ? [
        { name: "Yêu cầu kiểm định", value: inspectionStats.requested },
        { name: "Đã phân công", value: inspectionStats.assigned },
        { name: "Đã kiểm định", value: inspectionStats.inspected },
      ]
    : [];

  const bikeStatusData =
    bikeStats && Object.keys(bikeStats.byStatus).length > 0
      ? Object.entries(bikeStats.byStatus).map(([status, count]) => ({
          name: status,
          count,
        }))
      : [];

  const roleCards = [
    {
      role: "SELLER",
      label: "Người bán",
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      role: "BUYER",
      label: "Người mua",
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      role: "INSPECTOR",
      label: "Kiểm định viên",
      icon: ClipboardCheck,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng Quan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hiệu suất kinh doanh BikeExchange
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {topStats.map(({ label, value, icon: Icon, bg, iconBg, iconColor }) => (
          <div key={label} className={`rounded-2xl border border-gray-100 p-5 ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon size={20} className={iconColor} />
              </span>
            </div>

            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Users */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Người dùng theo vai trò
          </h2>

          <div className="space-y-3">
            {roleCards.map(({ role, label, icon: Icon, color, bg }) => (
              <div
                key={role}
                className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}
                >
                  <Icon size={18} className={color} />
                </span>

                <span className="flex-1 text-sm font-medium text-gray-700">
                  {label}
                </span>

                <span className="text-lg font-bold text-gray-900">
                  {loading ? "—" : userStats?.byRole[role] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tỷ lệ vai trò</h2>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={roleChartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
              >
                {roleChartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>

              <Tooltip />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Đơn hàng theo trạng thái
        </h2>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={orderStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count">
              {orderStatusData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inspections */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Thống kê kiểm định
        </h2>

        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={inspectionChartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
            >
              {inspectionChartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>

            <Tooltip />
            <Legend iconType="circle" iconSize={10} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bikes */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Xe theo trạng thái
        </h2>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bikeStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count">
              {bikeStatusData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}