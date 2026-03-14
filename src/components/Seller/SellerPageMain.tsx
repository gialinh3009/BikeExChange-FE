import { useState, useMemo } from "react";
import { LogOut } from "lucide-react";
import SellerBikeList from "./SellerBikeList";
import SellerCreateBike from "./SellerCreateBike";
import SellerOrders from "./SellerOrders";
import SellerInspections from "./SellerInspections";
import SellerWallet from "./SellerWallet";

type TabKey = "bikes" | "create" | "orders" | "inspections" | "wallet" | "reviews";

function getToken() {
  return localStorage.getItem("token") || "";
}

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || 0;
  } catch {
    return 0;
  }
}

export default function SellerPageMain() {
  const token = useMemo(() => getToken(), []);
  const userId = useMemo(() => getUserId(), []);
  const [activeTab, setActiveTab] = useState<TabKey>("bikes");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "bikes", label: "Xe Của Tôi" },
    { key: "create", label: "Tạo Xe Mới" },
    { key: "orders", label: "Đơn Hàng" },
    { key: "inspections", label: "Kiểm Định" },
    { key: "wallet", label: "Ví Điểm" },
    { key: "reviews", label: "Đánh Giá" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển Seller</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Đăng Xuất
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "bikes" && <SellerBikeList token={token} userId={userId} />}
        {activeTab === "create" && <SellerCreateBike token={token} />}
        {activeTab === "orders" && <SellerOrders token={token} />}
        {activeTab === "inspections" && <SellerInspections token={token} userId={userId} />}
        {activeTab === "wallet" && <SellerWallet token={token} />}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Chức năng đánh giá sẽ được cập nhật sớm</p>
          </div>
        )}
      </div>
    </div>
  );
}
