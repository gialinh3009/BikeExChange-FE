import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSellerSalesHistoryAPI, acceptOrderAPI, deliverOrderAPI } from "../../services/orderService";
import { Truck, CheckCircle, Clock, ChevronRight } from "lucide-react";

interface Order {
  id: number;
  bikeTitle: string;
  buyerName: string;
  amountPoints: number;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
  shippingCarrier?: string;
  trackingCode?: string;
  shippingNote?: string;
}

interface SellerOrdersTabProps {
  token: string;
}

export default function SellerOrdersTab({ token }: SellerOrdersTabProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [deliveryForm, setDeliveryForm] = useState<Record<number, any>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSellerSalesHistoryAPI(selectedStatus, token);
      setOrders(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      setError((e as Error).message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, token]);

  const handleAcceptOrder = async (orderId: number) => {
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await acceptOrderAPI(orderId, token);
      alert("✅ Đã xác nhận nhận đơn hàng");
      fetchOrders();
    } catch (e) {
      alert("❌ " + (e as Error).message);
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeliverOrder = async (orderId: number) => {
    const data = deliveryForm[orderId];
    if (!data?.shippingCarrier || !data?.trackingCode) {
      alert("⚠️ Vui lòng nhập đơn vị vận chuyển và mã vận đơn");
      return;
    }

    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await deliverOrderAPI(orderId, data, token);
      alert("✅ Đã đánh dấu giao hàng");
      setDeliveryForm(prev => ({ ...prev, [orderId]: {} }));
      fetchOrders();
    } catch (e) {
      alert("❌ " + (e as Error).message);
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const statusOptions = [
    { value: null, label: "Tất cả" },
    { value: "ESCROWED", label: "Chờ xác nhận" },
    { value: "ACCEPTED", label: "Đã xác nhận" },
    { value: "DELIVERED", label: "Đã giao" },
    { value: "COMPLETED", label: "Hoàn thành" },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      ESCROWED: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      ACCEPTED: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle },
      DELIVERED: { bg: "bg-purple-100", text: "text-purple-800", icon: Truck },
      COMPLETED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
    };
    const badge = badges[status] || { bg: "bg-gray-100", text: "text-gray-800", icon: Clock };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(opt => (
          <button
            key={opt.value || "all"}
            onClick={() => setSelectedStatus(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedStatus === opt.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading & Error */}
      {loading && <p className="text-center text-gray-500">Đang tải...</p>}
      {error && <p className="text-center text-red-500">❌ {error}</p>}

      {/* Orders List */}
      {!loading && orders.length === 0 && (
        <p className="text-center text-gray-500 py-8">Không có đơn hàng nào</p>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{order.bikeTitle}</h3>
                <p className="text-sm text-gray-500">Người mua: {order.buyerName}</p>
                <p className="text-sm text-gray-500">Điểm: {order.amountPoints}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Delivery Info */}
            {order.status === "DELIVERED" && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm">
                <p><strong>Đơn vị:</strong> {order.shippingCarrier}</p>
                <p><strong>Mã vận đơn:</strong> {order.trackingCode}</p>
                {order.shippingNote && <p><strong>Ghi chú:</strong> {order.shippingNote}</p>}
              </div>
            )}

            {/* Actions */}
            {order.status === "ESCROWED" && (
              <button
                onClick={() => handleAcceptOrder(order.id)}
                disabled={actionLoading[order.id]}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {actionLoading[order.id] ? "Đang xử lý..." : "✓ Xác nhận nhận đơn"}
              </button>
            )}

            {order.status === "ACCEPTED" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Đơn vị vận chuyển (VD: GHN, GHTK)"
                  value={deliveryForm[order.id]?.shippingCarrier || ""}
                  onChange={(e) =>
                    setDeliveryForm(prev => ({
                      ...prev,
                      [order.id]: { ...prev[order.id], shippingCarrier: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Mã vận đơn"
                  value={deliveryForm[order.id]?.trackingCode || ""}
                  onChange={(e) =>
                    setDeliveryForm(prev => ({
                      ...prev,
                      [order.id]: { ...prev[order.id], trackingCode: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Ghi chú (tuỳ chọn)"
                  value={deliveryForm[order.id]?.shippingNote || ""}
                  onChange={(e) =>
                    setDeliveryForm(prev => ({
                      ...prev,
                      [order.id]: { ...prev[order.id], shippingNote: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleDeliverOrder(order.id)}
                  disabled={actionLoading[order.id]}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {actionLoading[order.id] ? "Đang xử lý..." : "🚚 Đánh dấu đã giao"}
                </button>
              </div>
            )}

            {/* View Detail Button */}
            <button
              onClick={() => navigate(`/seller/orders/${order.id}`)}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              Xem chi tiết <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
