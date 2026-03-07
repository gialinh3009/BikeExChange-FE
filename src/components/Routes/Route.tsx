import { Navigate, Outlet } from "react-router-dom";

/**
 * PrivateRoute
 * Bảo vệ các route yêu cầu đăng nhập.
 * Nếu chưa có user trong localStorage → redirect về /login
 *
 * Dùng như nested route:
 *   <Route element={<PrivateRoute />}>
 *     <Route path="/admin" element={<AdminLayout />} />
 *   </Route>
 *
 * Props:
 *  - redirectTo (string): đường dẫn redirect khi chưa login (mặc định "/login")
 *  - roles (string[]): danh sách role được phép, bỏ trống = không kiểm tra role
 */
interface PrivateRouteProps {
  redirectTo?: string;
  roles?: string[];
}

export default function PrivateRoute({ redirectTo = "/login", roles = [] }: PrivateRouteProps) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles.length > 0 && !roles.some((r) => user?.roles?.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
