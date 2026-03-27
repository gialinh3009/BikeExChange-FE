import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, Truck, Clock, AlertCircle, RefreshCw, RotateCcw, X, Bike, ShoppingCart } from "lucide-react";
import { confirmDeliveryAPI, confirmReturnAPI, getSellerSalesHistoryAPI, sellerCancelOrderAPI } from "../../services/orderService";
import { batchGetBikeImages } from "../../utils/bikeImageCache";
import OrderApprovalModal from "./OrderApprovalModal";
import OrderDeliveryForm from "./OrderDeliveryForm";

type OrderStatus = "ESCROWED" | "ACCEPTED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "RETURN_REQUESTED" | "DISPUTED";

interface SellerOrder {
  id: number;
  bikeId?: number;
  bikeTitle: string;
  buyerName: string;
  amountPoints: number;
  status: OrderStatus;
  createdAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
  shippingCarrier?: string;
  trackingCode?: string;
  daysUntilAutoRelease?: number;
}

const fmtMoney = (p: number) => `${new Intl.NumberFormat("vi-VN").format(Number(p) || 0)} d`;
const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  ESCROWED:         { label: "Chờ xác nhận",       color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: <Clock size={13} /> },
  ACCEPTED:         { label: "Đã xác nhận",         color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: <CheckCircle size={13} /> },
  SHIPPED:          { label: "Đang vận chuyển",     color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", icon: <Truck size={13} /> },
  DELIVERED:        { label: "Đã giao hàng",        color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <Truck size={13} /> },
  COMPLETED:        { label: "Hoàn thành",          color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={13} /> },
  CANCELLED:        { label: "Đã hủy",              color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: <X size={13} /> },
  REFUNDED:         { label: "Đã hoàn tiền",        color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={13} /> },
  RETURN_REQUESTED: { label: "Yêu cầu hoàn hàng",  color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <RotateCcw size={13} /> },
  DISPUTED:         { label: "Đang tranh chấp",     color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: <AlertCircle size={13} /> },
};

type TabKey = "escrowed" | "accepted" | "shipped" | "delivered" | "returnRequested";
interface SellerOrdersTabProps { token: string; }


export default function SellerOrdersTab({ token }: SellerOrdersTabProps) {
  const [tab, setTab] = useState<TabKey>("escrowed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [bikeImages, setBikeImages] = useState<Map<number, string>>(new Map());
  const [actionOrderId, setActionOrderId] = useState<number | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });
  const [shippingNotice, setShippingNotice] = useState<{ open: boolean; order: SellerOrder | null }>({ open: false, order: null });
  const [confirmPopup, setConfirmPopup] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await getSellerSalesHistoryAPI(undefined, token);
      let allOrders: SellerOrder[] = [];
      if (Array.isArray(data)) {
        allOrders = data.length > 0 && data[0]?.order ? data.map((i: { order: SellerOrder }) => i.order) : data;
      } else if (data?.data) {
        if (Array.isArray(data.data)) {
          allOrders = data.data.length > 0 && data.data[0]?.order ? data.data.map((i: { order: SellerOrder }) => i.order) : data.data;
        } else if (data.data?.content) {
          allOrders = data.data.content.length > 0 && data.data.content[0]?.order ? data.data.content.map((i: { order: SellerOrder }) => i.order) : data.data.content;
        } else if (data.data?.orders) allOrders = data.data.orders;
      } else if (data?.content) {
        allOrders = data.content.length > 0 && data.content[0]?.order ? data.content.map((i: { order: SellerOrder }) => i.order) : data.content;
      } else if (data?.orders) allOrders = data.orders;
      setOrders(allOrders);
      const bikeIds = allOrders.map((o: SellerOrder) => o.bikeId).filter((id): id is number => !!id);
      if (bikeIds.length > 0) batchGetBikeImages(bikeIds, token).then(setBikeImages).catch(() => {});
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e)); setOrders([]);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) void fetchOrders(); }, [fetchOrders, token]);

  const getFiltered = () => {
    const map: Record<TabKey, OrderStatus[]> = {
      escrowed: ["ESCROWED"], accepted: ["ACCEPTED"], shipped: ["SHIPPED"],
      delivered: ["DELIVERED"], returnRequested: ["RETURN_REQUESTED"],
    };
    return orders.filter(o => map[tab].includes(o.status));
  };

  const handleConfirmReturn = (id: number) => {
    setConfirmPopup({
      open: true,
      title: "Xác nhận nhận hàng trả",
      message: "Bạn xác nhận đã nhận lại hàng từ người mua?",
      onConfirm: async () => {
        setConfirmPopup(null);
        setActionOrderId(id);
        setActionError(null);
        try { await confirmReturnAPI(id, token); await fetchOrders(); }
        catch (e) { setActionError(String(e instanceof Error ? e.message : e)); }
        finally { setActionOrderId(null); }
      },
    });
  };
  const handleSellerCancel = (id: number) => {
    setConfirmPopup({
      open: true,
      title: "Hủy đơn hàng",
      message: "Bạn chắc chắn muốn hủy đơn hàng này?",
      onConfirm: async () => {
        setConfirmPopup(null);
        setActionOrderId(id);
        setActionError(null);
        try { await sellerCancelOrderAPI(id, token); await fetchOrders(); }
        catch (e) { setActionError(String(e instanceof Error ? e.message : e)); }
        finally { setActionOrderId(null); }
      },
    });
  };
  const handleConfirmDelivery = async (id: number) => {
    setActionOrderId(id);
    setActionError(null);
    try { await confirmDeliveryAPI(id, token); await fetchOrders(); }
    catch (e) { setActionError(String(e instanceof Error ? e.message : e)); }
    finally { setActionOrderId(null); }
  };

  const filtered = getFiltered();
  const tabConfig = [
    { key: "escrowed"        as TabKey, label: "Chờ xác nhận",    count: orders.filter(o => o.status === "ESCROWED").length },
    { key: "accepted"        as TabKey, label: "Chuẩn bị giao",   count: orders.filter(o => o.status === "ACCEPTED").length },
    { key: "shipped"         as TabKey, label: "Đang vận chuyển", count: orders.filter(o => o.status === "SHIPPED").length },
    { key: "delivered"       as TabKey, label: "Đã giao",         count: orders.filter(o => o.status === "DELIVERED").length },
    { key: "returnRequested" as TabKey, label: "Hoàn hàng",       count: orders.filter(o => o.status === "RETURN_REQUESTED").length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Xe chờ xác nhận bán</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Danh sách các xe đang chờ bạn xác nhận hoặc hủy - Hãy xử lý kịp thời để không làm người mua đợi lâu
          </p>
        </div>
        <button onClick={() => void fetchOrders()} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {tabConfig.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${
              tab === t.key
                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100"
                : "bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600"
            }`}>
            {t.label}
            {t.count > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-xs font-bold ${
                tab === t.key ? "bg-white/30 text-white" : "bg-orange-100 text-orange-700"
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-sm">Đang tải đơn hàng...</span>
        </div>
      )}
      {error && !loading && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2 mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
            <ShoppingCart size={36} className="text-orange-300" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Không có đơn hàng</p>
          <p className="text-gray-400 text-sm">
            {tab === "escrowed"        ? "Chưa có xe nào đang chờ bạn xác nhận" :
             tab === "accepted"        ? "Chưa có xe nào đang chuẩn bị giao" :
             tab === "shipped"         ? "Chưa có xe nào đang vận chuyển" :
             tab === "delivered"       ? "Chưa có xe nào đã giao" :
                                        "Chưa có đơn hoàn hàng nào"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(order => {
            const cfg = STATUS_CONFIG[order.status];
            const imgUrl = order.bikeId ? bikeImages.get(order.bikeId) : undefined;
            const busy = actionOrderId === order.id;
            return (
              <div key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all overflow-hidden">
                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                      {imgUrl ? (
                        <img src={imgUrl} alt={order.bikeTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Bike size={28} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 truncate">{order.bikeTitle}</p>
                        <span className="text-base font-extrabold text-orange-600 whitespace-nowrap">{fmtMoney(order.amountPoints)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Người mua: <span className="font-semibold text-gray-700">{order.buyerName}</span>
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400">{fmtDateTime(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {order.status === "DELIVERED" && order.shippingCarrier && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs">
                      <p className="text-blue-600 font-semibold mb-1">Thông tin vận chuyển</p>
                      <p className="text-blue-800 font-bold">{order.shippingCarrier} — {order.trackingCode}</p>
                      {order.daysUntilAutoRelease && (
                        <p className="text-amber-600 mt-1">⏱️ Tự động giải phóng trong {order.daysUntilAutoRelease} ngày</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100 flex-wrap">
                  {order.status === "ESCROWED" && (
                    <>
                      <button onClick={() => setApprovalModal({ open: true, order })}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-blue-200">
                        <CheckCircle size={13} /> Xác nhận
                      </button>
                      <button onClick={() => handleSellerCancel(order.id)} disabled={busy}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50">
                        <X size={13} /> {busy ? "Đang xử lý..." : "Hủy đơn"}
                      </button>
                    </>
                  )}
                  {order.status === "ACCEPTED" && (
                    <button onClick={() => setShippingNotice({ open: true, order })}
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-200">
                      <Truck size={13} /> Giao hàng
                    </button>
                  )}
                  {order.status === "SHIPPED" && (
                    <button onClick={() => void handleConfirmDelivery(order.id)} disabled={busy}
                      className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm shadow-sky-200">
                      <CheckCircle size={13} /> {busy ? "Đang xử lý..." : "Xác nhận đã giao"}
                    </button>
                  )}
                  {order.status === "DELIVERED" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <Clock size={12} /> Chờ người mua xác nhận
                    </span>
                  )}
                  {order.status === "RETURN_REQUESTED" && (
                    <button onClick={() => handleConfirmReturn(order.id)} disabled={busy}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm shadow-amber-200">
                      <RotateCcw size={13} /> {busy ? "Đang xử lý..." : "Xác nhận nhận hàng trả"}
                    </button>
                  )}
                  <button onClick={() => window.location.href = `/seller/orders/${order.id}`}
                    className="ml-auto flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold transition">
                    <Package size={13} /> Chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderApprovalModal isOpen={approvalModal.open} order={approvalModal.order} token={token}
        onClose={() => setApprovalModal({ open: false, order: null })}
        onSuccess={() => { setApprovalModal({ open: false, order: null }); void fetchOrders(); }} />
      <OrderDeliveryForm isOpen={deliveryModal.open} order={deliveryModal.order} token={token}
        onClose={() => setDeliveryModal({ open: false, order: null })}
        onSuccess={() => { setDeliveryModal({ open: false, order: null }); void fetchOrders(); }} />

      {shippingNotice.open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"white", borderRadius:16, maxWidth:480, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #e5e7eb" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>📦</span>
                <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:"#0f172a" }}>Lưu ý về phí vận chuyển</h3>
              </div>
            </div>
            <div style={{ padding:"20px 24px" }}>
              <p style={{ fontSize:14, color:"#374151", lineHeight:1.7, marginBottom:16 }}>
                Người bán và người mua vui lòng <strong>chủ động thương lượng phí vận chuyển</strong> trước khi tiến hành giao dịch.
              </p>
              <div style={{ marginTop:16, padding:"12px 14px", background:"#fef3c7", borderRadius:10, border:"1px solid #fcd34d" }}>
                <p style={{ margin:0, fontSize:13, color:"#92400e", lineHeight:1.6 }}>
                  👉 Hãy thống nhất rõ ràng chi phí vận chuyển giữa hai bên để tránh phát sinh vấn đề không mong muốn.
                </p>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, padding:"16px 24px 20px", borderTop:"1px solid #e5e7eb" }}>
              <button onClick={() => setShippingNotice({ open:false, order:null })}
                style={{ flex:1, padding:"11px 16px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Đã hiểu
              </button>
              <button onClick={() => { const o = shippingNotice.order; setShippingNotice({ open:false, order:null }); setDeliveryModal({ open:true, order:o }); }}
                style={{ flex:1, padding:"11px 16px", background:"#10b981", color:"white", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                🚚 Đã xác nhận với người mua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline error popup */}
      {actionError && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100 }}>
          <div style={{ background:"white", borderRadius:16, maxWidth:400, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #fecaca", background:"#fef2f2" }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#dc2626" }}>⚠️ Có lỗi xảy ra</h3>
            </div>
            <div style={{ padding:"16px 24px" }}>
              <p style={{ fontSize:14, color:"#374151", margin:0 }}>{actionError}</p>
            </div>
            <div style={{ padding:"12px 24px 20px" }}>
              <button onClick={() => setActionError(null)}
                style={{ width:"100%", padding:"10px 0", background:"#dc2626", color:"white", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline confirm popup */}
      {confirmPopup?.open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100 }}>
          <div style={{ background:"white", borderRadius:16, maxWidth:400, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" }}>
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #e5e7eb" }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:"#0f172a" }}>{confirmPopup.title}</h3>
            </div>
            <div style={{ padding:"16px 24px" }}>
              <p style={{ fontSize:14, color:"#374151", margin:0 }}>{confirmPopup.message}</p>
            </div>
            <div style={{ display:"flex", gap:10, padding:"12px 24px 20px" }}>
              <button onClick={() => setConfirmPopup(null)}
                style={{ flex:1, padding:"10px 0", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Hủy
              </button>
              <button onClick={() => confirmPopup.onConfirm()}
                style={{ flex:1, padding:"10px 0", background:"#f97316", color:"white", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
