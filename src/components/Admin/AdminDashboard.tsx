import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Banknote, ShoppingBag, Users, ClipboardCheck, ShoppingCart, UserCheck } from "lucide-react";
import {
  getUserStatisticsAPI,
  getRevenueStatisticsAPI,
  getOrderStatisticsAPI,
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


export default function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    Promise.all([
      getUserStatisticsAPI(),
      getRevenueStatisticsAPI(),
      getOrderStatisticsAPI(),
    ])
      .then(([users, revenue, orders]) => {
        setUserStats(users);
        setRevenueStats(revenue);
        setOrderStats(orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);


  const topStats = [
    {
      label: "Tổng người dùng",
      value: loading ? "—" : String(userStats?.total ?? 0),
      icon: Users,
      bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600",
    },
    {
      label: "Doanh thu hoa hồng",
      value: loading ? "—" : fmtCurrency(revenueStats?.totalCommissionRevenue ?? 0),
      icon: Banknote,
      bg: "bg-green-50", iconBg: "bg-green-100", iconColor: "text-green-600",
    },
    {
      label: "Đơn hàng hoàn thành",
      value: loading ? "—" : String(revenueStats?.completedOrders ?? 0),
      icon: ShoppingBag,
      bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600",
    },
    {
      label: "Tổng đơn hàng",
      value: loading ? "—" : String(orderStats?.total ?? 0),
      icon: ShoppingCart,
      bg: "bg-orange-50", iconBg: "bg-orange-100", iconColor: "text-orange-600",
    },
  ];


  const roleChartData = userStats
    ? Object.entries(userStats.byRole ?? {}).map(([role, count]) => ({
        name: ROLE_LABEL[role] ?? role,
        value: count,
      }))
    : [];


  const orderStatusData = orderStats && Object.keys(orderStats.byStatus ?? {}).length > 0
    ? Object.entries(orderStats.byStatus ?? {}).map(([status, count]) => ({
        name: status,
        count,
      }))
    : [];


  const roleCards = [
    { role: "SELLER", label: "Người bán", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { role: "BUYER", label: "Người mua", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
    { role: "INSPECTOR", label: "Kiểm định viên", icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-100" },
  ];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng Quan</h1>
        <p className="text-sm text-gray-500 mt-1">Hiệu suất kinh doanh BikeExchange</p>
      </div>


      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map(({ label, value, icon: Icon, bg, iconBg, iconColor }) => (
          <div key={label} className={`rounded-2xl border border-gray-100 p-5 ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon size={20} className={iconColor} />
              </span>
            </div>
            <div className="text-xl font-bold text-gray-900 leading-tight">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>


      {/* Users by role */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Role breakdown cards */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Người dùng theo vai trò</h2>
          <div className="space-y-3">
            {roleCards.map(({ role, label, icon: Icon, color, bg }) => (
              <div key={role} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={18} className={color} />
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                <span className="text-lg font-bold text-gray-900">
                  {loading ? "—" : (userStats?.byRole?.[role] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>


        {/* Role pie chart */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tỷ lệ vai trò</h2>
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">Đang tải...</div>
          ) : roleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {roleChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [Number(val ?? 0), "Người dùng"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: 13 }}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">Không có dữ liệu</div>
          )}
        </div>
      </div>


      {/* Orders by status */}
      <div className="rounded-2xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Đơn hàng theo trạng thái</h2>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Đang tải...</div>
        ) : orderStatusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orderStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => [Number(val ?? 0), "Đơn hàng"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {orderStatusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
            Chưa có đơn hàng nào
          </div>
        )}
      </div>
    </div>
  );
}


