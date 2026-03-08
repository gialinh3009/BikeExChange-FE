import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "../Admin/AdminLayout";
import AdminDashboard from "../Admin/AdminDashboard";
import ManagerPosts from "../Admin/Manager/ManagerPosts";
import ManagerStaff from "../Admin/Manager/ManagerStaff";
import ManagerInventory from "../Admin/Manager/ManagerInventory";
import ManagerCustomer from "../Admin/Manager/ManagerCustomer";
import ManagerPayment from "../Admin/Manager/ManagerPayment";
import ManagerReport from "../Admin/Manager/ManagerReport";
import ManagerBuyer from "../Admin/Manager/ManagerBuyer";
import ManagerInspector from "../Admin/Manager/ManagerInspector";
import Login from "../home/Login";
import Register from "../home/Register";
import SellerPage from "../Seller/SellerPage";
import InspectorPage from "../Inspector/InspectorPage";
import BuyerPage from "../Buyer/BuyerPage";

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

// ─── Route map ───────────────────────────────────────────────────────────────
const ROLE_ROUTES: Record<string, string> = {
    ADMIN: "/admin",
    SELLER: "/seller",
    INSPECTOR: "/inspector",
    BUYER: "/buyer",
};

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

            {/* Root: redirect theo role */}
            <Route
                path="/"
                element={
                    user ? (
                        <Navigate to={ROLE_ROUTES[user.role] ?? "/login"} replace />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            {/* Admin — protected */}
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

            {/* Seller — protected */}
            <Route element={<PrivateRoute roles={["SELLER"]} />}>
                <Route path="/seller" element={<SellerPage />} />
            </Route>

            {/* Inspector — protected */}
            <Route element={<PrivateRoute roles={["INSPECTOR"]} />}>
                <Route path="/inspector" element={<InspectorPage />} />
            </Route>

            {/* Buyer — protected */}
            <Route element={<PrivateRoute roles={["BUYER"]} />}>
                <Route path="/buyer" element={<BuyerPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
