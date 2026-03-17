import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/Admin/AdminLayout";
import AdminDashboard from "../components/Admin/AdminDashboard";
import ManagerPosts from "../components/Admin/Manager/ManagerPosts";
import ManagerStaff from "../components/Admin/Manager/ManagerStaff";
import ManagerInventory from "../components/Admin/Manager/ManagerInventory";
import ManagerCustomer from "../components/Admin/Manager/ManagerCustomer";
import ManagerPayment from "../components/Admin/Manager/ManagerPayment";
import ManagerReport from "../components/Admin/Manager/ManagerReport";
import ManagerBuyer from "../components/Admin/Manager/ManagerBuyer";
import ManagerInspector from "../components/Admin/Manager/ManagerInspector";
import ManagerUsers from "../components/Admin/Manager/ManagerUsers";
import ManagerCategories from "../components/Admin/Manager/ManagerCategories";
import ManagerBrand from "../components/Admin/Manager/ManagerBrand";
import ManagerComponent from "../components/Admin/Manager/ManagerComponent";
import ManagementDisputes from "../components/Admin/Manager/ManagementDisputes";
import ManagementWithdrawal from "../components/Admin/Manager/ManagementWithdrawal";
import ManagerOrder from "../components/Admin/Manager/ManagerOrder";
import ManagerTransactions from "../components/Admin/Manager/ManagerTransactions";
import ManagerBike from "../components/Admin/Manager/ManagerBike";
import Login from "../components/home/Login";
import Register from "../components/home/Register";
import GuestLayout from "../components/home/Layout";
import VerifyEmail from "../components/home/VerifyEmail";
import ResetPassword from "../components/home/ResetPassword";
import SellerPage from "../components/Seller/SellerPage";
import BuyerPage from "../components/Buyer/BuyerPage";
import PaymentSuccess from "../components/Buyer/PaymentSuccess";
import ProfilePage from "../components/Buyer/Profilepage";
import BikedetailPage from "../components/Buyer/BikedetailPage";
import SellerProfileView from "../components/Buyer/SellerProfileView";
import OrderDetailPage from "../components/Buyer/OrderDetailPage";
import RolePlaceholder from "./RolePlaceHolder";
import InspectorLayout from "../components/Inspector/InspectorLayout";
import InspectorDashboard from "../components/Inspector/InspectorDashboard";
import ManagerInspection from "../components/Inspector/ManagerInspection";
import ManagerInspectionStatus from "../components/Inspector/ManagerInspectionStatus";
import ManagerInspectionReport from "../components/Inspector/ManagerInspectionReport";
import CreateReport from "../components/Inspector/CreateReport";
import ManagerInspected from "../components/Inspector/ManagerInspected";

function PrivateRoute({
  redirectTo = "/login",
  roles = [],
}: {
  redirectTo?: string;
  roles?: string[];
}) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  if (!user) return <Navigate to={redirectTo} replace />;
  if (roles.length > 0 && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  SELLER: "/seller",
  INSPECTOR: "/inspector",
  BUYER: "/buyer",
};

const getRoleHome = (role?: string | null) => {
  if (!role) return "/";
  return ROLE_HOME[role] ?? "/buyer";
};

interface AppRoutesProps {
  user: { role: string } | null;
  onLogout: () => void;
}

export default function AppRoutes({ user, onLogout }: AppRoutesProps) {
  const defaultHome = getRoleHome(user?.role);
  const roleUpper = String(user?.role || "").toUpperCase();
  const canBrowseMarketplace = roleUpper === "BUYER" || roleUpper === "SELLER";

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/bikes/:id" element={<BikedetailPage />} />
      <Route path="/sellers/:sellerId" element={<SellerProfileView />} />

      {/* Profile */}
      <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Order detail */}
      <Route element={<PrivateRoute roles={["BUYER", "SELLER"]} />}>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/order-detail/:id" element={<OrderDetailPage />} />
        <Route path="/orders/:id/review" element={<RolePlaceholder label="Đánh giá giao dịch" />} />
      </Route>

      {/* Root */}
      <Route
        path="/"
        element={
          !user || canBrowseMarketplace
            ? <GuestLayout />
            : <Navigate to={defaultHome} replace />
        }
      />

      {/* Admin */}
      <Route element={<PrivateRoute roles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="posts" element={<ManagerPosts />} />
          <Route path="staff" element={<ManagerStaff />} />
          <Route path="inventory" element={<ManagerInventory />} />
          <Route path="customers" element={<ManagerCustomer />} />
          <Route path="buyers" element={<ManagerBuyer />} />
          <Route path="inspectors" element={<ManagerInspector />} />
          <Route path="payments" element={<ManagerPayment />} />
          <Route path="reports" element={<ManagerReport />} />
          <Route path="users" element={<ManagerUsers />} />
          <Route path="categories" element={<ManagerCategories />} />
          <Route path="brands" element={<ManagerBrand />} />
          <Route path="components" element={<ManagerComponent />} />
          <Route path="disputes" element={<ManagementDisputes />} />
          <Route path="bikes" element={<ManagerBike />} />
          <Route path="orders" element={<ManagerOrder />} />
          <Route path="transactions" element={<ManagerTransactions />} />
          <Route path="withdrawals" element={<ManagementWithdrawal />} />
          <Route path="inspection-status" element={<ManagerInspectionStatus />} />
        </Route>
      </Route>

      {/* Seller */}
      <Route element={<PrivateRoute roles={["SELLER"]} />}>
        <Route path="/seller" element={<SellerPage />} />
      </Route>

      {/* Inspector */}
      <Route element={<PrivateRoute roles={["INSPECTOR"]} />}>
        <Route path="/inspector" element={<InspectorLayout user={user} onLogout={onLogout} />}>
          <Route index element={<InspectorDashboard />} />
          <Route path="inspections" element={<ManagerInspection />} />
          <Route path="status" element={<ManagerInspectionStatus />} />
          <Route path="reports" element={<ManagerInspectionReport />} />
          <Route path="create-report" element={<CreateReport />} />
          <Route path="reports-list" element={<ManagerInspected />} />
        </Route>
      </Route>

      {/* Buyer — BUYER and SELLER can access */}
      <Route element={<PrivateRoute roles={["BUYER", "SELLER"]} />}>
        <Route path="/buyer" element={<BuyerPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? defaultHome : "/login"} replace />} />
    </Routes>
  );
}
