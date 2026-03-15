/**
 * WishlistModals.jsx
 * Modal yêu cầu đăng nhập và modal xác nhận thêm vào yêu thích
 */
import { Heart, X, Bike } from "lucide-react";

// ─── Modal: chưa đăng nhập ────────────────────────────────────────────────────
export function WishlistAuthModal({ onClose, onLogin, onRegister }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-80 p-7 flex flex-col items-center gap-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none">
          <X size={16} />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Bike size={30} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-blue-600 tracking-tight">BikeExchange</h2>
        <p className="text-sm text-gray-600 text-center leading-relaxed">
          Vui lòng đăng nhập tài khoản để thêm xe vào danh sách yêu thích.
        </p>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onRegister}
            className="flex-1 py-2.5 text-sm font-semibold border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 transition-colors"
          >
            Đăng ký
          </button>
          <button
            onClick={onLogin}
            className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: xác nhận thêm vào yêu thích ──────────────────────────────────────
export function WishlistConfirmModal({ onClose, onConfirm, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-80 p-7 flex flex-col items-center gap-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Heart size={28} className="text-red-500 fill-red-100" />
        </div>
        <h2 className="text-base font-extrabold text-gray-800">Thêm vào yêu thích</h2>
        <p className="text-sm text-gray-500 text-center">
          Bạn có muốn thêm chiếc xe này vào danh sách yêu thích không?
        </p>
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? "Đang lưu..." : "Có, thêm vào"}
          </button>
        </div>
      </div>
    </div>
  );
}
