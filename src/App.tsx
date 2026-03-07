import { useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/Admin/AdminLayout";
import ManagerPosts from "./components/Admin/Manager/ManagerPosts";
import ManagerStaff from "./components/Admin/Manager/ManagerStaff";
import ManagerInventory from "./components/Admin/Manager/ManagerInventory";
import ManagerCustomer from "./components/Admin/Manager/ManagerCustomer";
import ManagerPayment from "./components/Admin/Manager/ManagerPayment";
import ManagerReport from "./components/Admin/Manager/ManagerReport";
import ManagerBuyer from "./components/Admin/Manager/ManagerBuyer";
import ManagerInspector from "./components/Admin/Manager/ManagerInspector";
import AdminDashboard from "./components/Admin/AdminDashboard";
import Login from "./components/home/Login";
import Register from "./components/home/Register";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(getUser);

  // Đồng bộ user khi localStorage thay đổi (ví dụ: login/logout từ tab khác)
  useEffect(() => {
    const handleStorage = () => setUser(getUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Routes>
      {/* Redirect mặc định vào admin */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin routes — bỏ PrivateRoute để luôn hiển thị */}
      <Route
        path="/admin"
        element={<AdminLayout user={user} onLogout={handleLogout} />}
      >
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
