import { useState, useEffect } from "react";
import AppRoutes from "./components/Routes/AppRoutes";

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

export default function App() {
    const [user, setUser] = useState(getUser);

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

    return <AppRoutes user={user} onLogout={handleLogout} />;
}
