import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Bike, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmailAPI } from "../../services/authService";

/**
 * Route: /verify?token=xxx
 * BE gửi link này trong email xác thực.
 * Component tự động gọi API verify khi mount.
 */
export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
    const [message, setMessage] = useState("");
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Không tìm thấy token xác thực trong đường dẫn.");
            return;
        }

        verifyEmailAPI(token)
            .then(() => {
                setStatus("success");
                setMessage("Tài khoản của bạn đã được xác thực thành công!");
            })
            .catch((err) => {
                setStatus("error");
                const msg = err.message || "";
                if (msg.toLowerCase().includes("expired")) {
                    setMessage("Link xác thực đã hết hạn. Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.");
                } else if (msg.toLowerCase().includes("invalid")) {
                    setMessage("Link xác thực không hợp lệ. Vui lòng kiểm tra lại email.");
                } else {
                    setMessage(msg || "Xác thực thất bại. Vui lòng thử lại.");
                }
            });
    }, [token]);

    // Đếm ngược 5 giây rồi redirect về login khi success
    useEffect(() => {
        if (status !== "success") return;
        if (countdown <= 0) {
            navigate("/login", { replace: true });
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, countdown, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Bike size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-xl text-gray-900">BikeExchange</span>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">

                    {/* LOADING */}
                    {status === "loading" && (
                        <>
                            <div className="flex justify-center mb-5">
                                <Loader2 size={52} className="text-blue-500 animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xác thực tài khoản...</h2>
                            <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát.</p>
                        </>
                    )}

                    {/* SUCCESS */}
                    {status === "success" && (
                        <>
                            <div className="flex justify-center mb-5">
                                <CheckCircle2 size={56} className="text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác thực thành công! 🎉</h2>
                            <p className="text-sm text-gray-600 mb-6">{message}</p>
                            <div className="mb-5 text-sm text-gray-400">
                                Tự động chuyển về trang đăng nhập sau{" "}
                                <span className="font-bold text-blue-600">{countdown}</span> giây...
                            </div>
                            <button
                                onClick={() => navigate("/login", { replace: true })}
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
                            >
                                Đăng nhập ngay
                            </button>
                        </>
                    )}

                    {/* ERROR */}
                    {status === "error" && (
                        <>
                            <div className="flex justify-center mb-5">
                                <XCircle size={56} className="text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Xác thực thất bại</h2>
                            <p className="text-sm text-red-500 mb-6">{message}</p>
                            <button
                                onClick={() => navigate("/login", { replace: true })}
                                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition"
                            >
                                Quay về đăng nhập
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}