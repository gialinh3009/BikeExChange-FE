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