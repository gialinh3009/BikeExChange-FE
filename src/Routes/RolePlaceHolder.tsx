export default function RolePlaceholder({ label }: { label: string }) {
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm">
                <div className="text-4xl mb-3">🚲</div>
                <h1 className="text-xl font-bold text-gray-800">Chào mừng, {label}!</h1>
                <p className="text-gray-500 text-sm mt-2">
                    Trang dành cho <strong>{label}</strong> đang được phát triển.
                </p>
                <button
                    onClick={handleLogout}
                    className="mt-6 px-5 py-2 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}
