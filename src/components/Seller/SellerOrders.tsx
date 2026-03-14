import { useState, useEffect } from "react";
import { Loader, AlertCircle, CheckCircle, RotateCcw, Truck } from "lucide-react";
import {
  getPendingConfirmationsAPI,
  getSellerSalesAPI,
  acceptOrderAPI,
  deliverOrderAPI,
  confirmReturnAPI,
  cancelOrderAPI,
} from "../../services/Seller/sellerBikeService";

export default function SellerOrders({ token }: { token: string }) {
  const [activeTab, setActiveTab] = useState<"pending" | "sales">("pending");
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeliverForm, setShowDeliverForm] = useState<number | null>(null);
  const [deliveryData, setDeliveryData] = useState({ shippingCarrier: "", trackingNumber: "", notes: "" });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const [pending, sales] = await Promise.all([
          getPendingConfirmationsAPI(token),
          getSellerSalesAPI(undefined, token),
        ]);
        setPendingOrders(Array.isArray(pending) ? pending : []);
        setSalesOrders(Array.isArray(sales) ? sales : []);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  const handleAccept = async (orderId: number) => {
    try {
      setActionLoading(`accept-${orderId}`);
      await acceptOrderAPI(orderId, token);
      setPendingOrders(pendingOrders.filter((o) => o.id !== orderId));
      alert("Xác nhận nhận đơn thành công!");
    } catch (err: any) {
      alert(err.message || "Xác nhận thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (orderId: number) => {
    if (!deliveryData.shippingCarrier || !deliveryData.trackingNumber) {
      alert("Vui lòng điền đầy đủ thông tin vận chuyển");
      return;
    }
    try {
      setActionLoading(`deliver-${orderId}`);
      await deliverOrderAPI(orderId, deliveryData, token);
      setShowDeliverForm(null);
      setDeliveryData({ shippingCarrier: "", trackingNumber: "", notes: "" });
      alert("Đánh dấu giao hàng thành công!");
    } catch (err: any) {
      alert(err.message || "Giao hàng thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReturn = async (orderId: number) => {
    if (!window.confirm("Xác nhận bạn đã nhận lại hàng trả?")) return;
    try {
      setActionLoading(`return-${orderId}`);
      await confirmReturnAPI(orderId, token);
      alert("Xác nhận nhận hàng trả thành công!");
    } catch (err: any) {
      alert(err.message || "Xác nhận thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn này?")) return;
    try {
      setActionLoading(`cancel-${orderId}`);
      await cancelOrderAPI(orderId, token);
      setPendingOrders(pendingOrders.filter((o) => o.id !== orderId));
      alert("Hủy đơn thành công!");
    } catch (err: any) {
      alert(err.message || "Hủy thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Đơn Chờ Xác Nhận ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "sales"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Lịch Sử Bán Hàng ({salesOrders.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Không có đơn chờ xác nhận</p>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Đơn #{order.id}</h3>
                    <p className="text-sm text-gray-600">Từ: {order.buyerName}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                    Chờ xác nhận
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Xe</p>
                    <p className="font-medium text-gray-900">{order.bikeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Giá</p>
                    <p className="font-medium text-gray-900">{order.amountPoints?.toLocaleString("vi-VN")} đ</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={actionLoading === `accept-${order.id}`}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === `accept-${order.id}` ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Xác Nhận Nhận Đơn
                  </button>
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={actionLoading === `cancel-${order.id}`}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === `cancel-${order.id}` ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Hủy Đơn
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "sales" && (
        <div className="space-y-4">
          {salesOrders.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Chưa có lịch sử bán hàng</p>
            </div>
          ) : (
            salesOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Đơn #{order.id}</h3>
                    <p className="text-sm text-gray-600">Từ: {order.buyerName}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "DELIVERED"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "ACCEPTED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status === "COMPLETED"
                      ? "Hoàn thành"
                      : order.status === "DELIVERED"
                        ? "Đã giao"
                        : order.status === "ACCEPTED"
                          ? "Đã xác nhận"
                          : order.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Xe</p>
                    <p className="font-medium text-gray-900">{order.bikeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Giá</p>
                    <p className="font-medium text-gray-900">{order.amountPoints?.toLocaleString("vi-VN")} đ</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Đánh giá</p>
                    <p className="font-medium text-gray-900">{order.isReviewed ? "✓ Đã đánh giá" : "Chưa"}</p>
                  </div>
                </div>

                {order.status === "ACCEPTED" && (
                  <div className="space-y-3">
                    {showDeliverForm === order.id ? (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Đơn vị vận chuyển (VD: GHN, GHTK)"
                          value={deliveryData.shippingCarrier}
                          onChange={(e) => setDeliveryData({ ...deliveryData, shippingCarrier: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Mã vận đơn"
                          value={deliveryData.trackingNumber}
                          onChange={(e) => setDeliveryData({ ...deliveryData, trackingNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <textarea
                          placeholder="Ghi chú (tuỳ chọn)"
                          value={deliveryData.notes}
                          onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeliver(order.id)}
                            disabled={actionLoading === `deliver-${order.id}`}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actionLoading === `deliver-${order.id}` ? "Đang gửi..." : "Xác Nhận Giao"}
                          </button>
                          <button
                            onClick={() => setShowDeliverForm(null)}
                            className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg text-sm font-medium hover:bg-gray-400"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeliverForm(order.id)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Đánh Dấu Giao Hàng
                      </button>
                    )}
                  </div>
                )}

                {order.status === "DELIVERED" && (
                  <button
                    onClick={() => handleConfirmReturn(order.id)}
                    disabled={actionLoading === `return-${order.id}`}
                    className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === `return-${order.id}` ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Xác Nhận Nhận Hàng Trả
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
