import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/Admin/AdminLayout";
import AdminDashboard from "../components/Admin/AdminDashboard.tsx";
import ManagerPosts from "../components/Admin/Manager/ManagerPosts.tsx";
import ManagerStaff from "../components/Admin/Manager/ManagerStaff.tsx";
import ManagerInventory from "../components/Admin/Manager/ManagerInventory.tsx";
import ManagerCustomer from "../components/Admin/Manager/ManagerCustomer.tsx";
import ManagerPayment from "../components/Admin/Manager/ManagerPayment.tsx";
import ManagerReport from "../components/Admin/Manager/ManagerReport.tsx";
import ManagerBuyer from "../components/Admin/Manager/ManagerBuyer.tsx";
import ManagerInspector from "../components/Admin/Manager/ManagerInspector.tsx";
import Login from "../components/home/Login";
import Register from "../components/home/Register";

import PaymentSuccess from "../components/Buyer/PaymentSuccess";
import SellerPage from "../components/Seller/SellerPage";
import BuyerPage from "../components/Buyer/BuyerPage";
import ProfilePage from "../components/Buyer/Profilepage";
import BikedetailPage from "../components/Buyer/BikedetailPage";
import GuestLayout from "../components/home/Layout";
import InspectorLayout from "../components/Inspector/InspectorLayout";
import InspectorDashboard from "../components/Inspector/InspectorDashboard";
import ManagerInspection from "../components/Inspector/ManagerInspection";
import ManagerInspectionStatus from "../components/Inspector/ManagerInspectionStatus";
import ManagerInspectionReport from "../components/Inspector/ManagerInspectionReport";
import CreateReport from "../components/Inspector/CreateReport";
import ManagerInspected from "../components/Inspector/ManagerInspected";
import OrderDetailPage from "../components/Buyer/OrderDetailPage";

import VerifyEmail from "../components/home/VerifyEmail";
import SellerPage from "../components/Seller/SellerPage.tsx";
import InspectorPage from "../components/Inspector/InspectorPage.tsx";
import BuyerPage from "../components/Buyer/BuyerPage.tsx";
import PaymentSuccess from "../components/Buyer/PaymentSuccess.tsx";
import ProfilePage from "../components/Buyer/Profilepage.tsx";
import BikedetailPage from "../components/Buyer/BikedetailPage.tsx";
import OrderDetailPage from "../components/Buyer/OrderDetailPage.tsx";

// ─── PrivateRoute ────────────────────────────────────────────────────────────

function PrivateRoute({ redirectTo = "/login", roles = [] }: { redirectTo?: string; roles?: string[] }) {
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

// ─── AppRoutes ───────────────────────────────────────────────────────────────
interface AppRoutesProps {
    user: { role: string } | null;
    onLogout: () => void;
}

export default function AppRoutes({ user, onLogout }: AppRoutesProps) {

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/bikes/:id" element={<BikedetailPage />} />

      {/* Profile — protected */}
      <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Root: trang chính — hiển thị cho tất cả, kể cả đã đăng nhập */}
      <Route path="/" element={<GuestLayout />} />

    return (
        <Routes>
            {/* Public */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/verify"          element={<VerifyEmail />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* Bike detail — PUBLIC, không cần đăng nhập */}
            <Route path="/bikes/:id" element={<BikedetailPage />} />

            {/* Order detail — cần đăng nhập */}
            <Route element={<PrivateRoute roles={["BUYER", "SELLER"]} />}>
                <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Root: redirect theo role */}
            <Route
                path="/"
                element={
                    user ? <Navigate to="/buyer" replace /> : <Navigate to="/login" replace />
                }
            />

            {/* Admin — protected */}
            <Route element={<PrivateRoute roles={["ADMIN"]} />}>
                <Route path="/admin" element={<AdminLayout user={user} onLogout={onLogout} />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="posts"      element={<ManagerPosts />} />
                    <Route path="staff"      element={<ManagerStaff />} />
                    <Route path="inventory"  element={<ManagerInventory />} />
                    <Route path="customers"  element={<ManagerCustomer />} />
                    <Route path="buyers"     element={<ManagerBuyer />} />
                    <Route path="inspectors" element={<ManagerInspector />} />
                    <Route path="payments"   element={<ManagerPayment />} />
                    <Route path="reports"    element={<ManagerReport />} />
                </Route>
            </Route>


            {/* Seller — protected */}
            <Route element={<PrivateRoute roles={["SELLER"]} />}>
                <Route path="/seller" element={<SellerPage />} />
            </Route>

            {/* Inspector — protected */}
            <Route element={<PrivateRoute roles={["INSPECTOR"]} />}>
                <Route path="/inspector" element={<InspectorPage />} />
            </Route>


      {/* Inspector — protected */}
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
      {/* Buyer — protected */}
      <Route element={<PrivateRoute roles={["BUYER"]} />}>
        <Route path="/buyer" element={<BuyerPage />} />
        <Route path="/order-detail/:id" element={<OrderDetailPage />} />
      </Route>

            {/* Buyer dashboard — cho cả BUYER và SELLER */}
            <Route element={<PrivateRoute roles={["BUYER", "SELLER"]} />}>
                <Route path="/buyer"   element={<BuyerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Route>


            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}