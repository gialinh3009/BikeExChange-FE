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

import Login from "../components/home/Login";
import Register from "../components/home/Register";
import GuestLayout from "../components/home/Layout";
import VerifyEmail from "../components/home/VerifyEmail";

import BuyerPage from "../components/Buyer/BuyerPage";

import PaymentSuccess from "../components/Buyer/PaymentSuccess";
import ProfilePage from "../components/Buyer/Profilepage";
import BikedetailPage from "../components/Buyer/BikedetailPage";
import OrderDetailPage from "../components/Buyer/OrderDetailPage";

import InspectorLayout from "../components/Inspector/InspectorLayout";
import InspectorDashboard from "../components/Inspector/InspectorDashboard";
import ManagerInspection from "../components/Inspector/ManagerInspection";
import ManagerInspectionStatus from "../components/Inspector/ManagerInspectionStatus";
import ManagerInspectionReport from "../components/Inspector/ManagerInspectionReport";
import CreateReport from "../components/Inspector/CreateReport";
import ManagerInspected from "../components/Inspector/ManagerInspected";


// ─── PrivateRoute ─────────────────────────────

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
    if (roles.length > 0 && !roles.includes(user.role))
        return <Navigate to="/login" replace />;

    return <Outlet />;
}


// ─── AppRoutes ─────────────────────────────

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
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />

            {/* Bike detail */}
            <Route path="/bikes/:id" element={<BikedetailPage />} />

            {/* Profile */}
            <Route element={<PrivateRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Order detail */}
            <Route element={<PrivateRoute roles={["BUYER", "SELLER"]} />}>
                <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Root */}
            <Route
                path="/"
                element={
                    user ? <Navigate to="/buyer" replace /> : <GuestLayout />
                }
            />

            {/* ADMIN */}
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
                </Route>
            </Route>

            {/* INSPECTOR */}
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

            {/* BUYER */}
            <Route element={<PrivateRoute roles={["BUYER", "SELLER"]} />}>
                <Route path="/buyer" element={<BuyerPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
    );
}