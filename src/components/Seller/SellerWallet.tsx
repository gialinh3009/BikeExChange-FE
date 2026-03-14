import { useState, useEffect } from "react";
import { Loader, AlertCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import {
  getWalletAPI,
  getWalletTransactionsAPI,
  requestWithdrawAPI,
} from "../../services/Seller/sellerBikeService";

export default function SellerWallet({ token }: { token: string }) {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [withdrawData, setWithdrawData] = useState({
    amount: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [walletData, transactionsData] = await Promise.all([
          getWalletAPI(token),
          getWalletTransactionsAPI(token),
        ]);
        setWallet(walletData);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải dữ liệu ví");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawData.amount || !withdrawData.bankName || !withdrawData.bankAccountName || !withdrawData.bankAccountNumber) {
      alert("Vui lòng điền tất cả các trường");
      return;
    }

    const amount = parseInt(withdrawData.amount);
    if (amount > (wallet?.availablePoints || 0)) {
      alert("Số tiền rút vượt quá số dư khả dụng");
      return;
    }

    try {
      setSubmitting(true);
      await requestWithdrawAPI(
        {
          amount,
          bankName: withdrawData.bankName,
          bankAccountName: withdrawData.bankAccountName,
          bankAccountNumber: withdrawData.bankAccountNumber,
        },
        token
      );
      alert("Yêu cầu rút tiền thành công! Chờ admin duyệt.");
      setWithdrawData({ amount: "", bankName: "", bankAccountName: "", bankAccountNumber: "" });
      setShowWithdrawForm(false);

      const updated = await getWalletAPI(token);
      setWallet(updated);
    } catch (err: any) {
      alert(err.message || "Yêu cầu rút tiền thất bại");
    } finally {
      setSubmitting(false);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Số Dư Khả Dụng</p>
              <p className="text-3xl font-bold mt-2">{wallet?.availablePoints?.toLocaleString("vi-VN")} đ</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Điểm Bị Khóa</p>
              <p className="text-3xl font-bold mt-2">{wallet?.frozenPoints?.toLocaleString("vi-VN")} đ</p>
            </div>
            <TrendingDown className="w-12 h-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tổng Điểm</p>
              <p className="text-3xl font-bold mt-2">
                {((wallet?.availablePoints || 0) + (wallet?.frozenPoints || 0)).toLocaleString("vi-VN")} đ
              </p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowWithdrawForm(!showWithdrawForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Yêu Cầu Rút Tiền
        </button>
      </div>

      {showWithdrawForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yêu Cầu Rút Tiền</h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Số Tiền (Điểm) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={withdrawData.amount}
                onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                placeholder="VD: 100000"
                max={wallet?.availablePoints}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">
                Số dư khả dụng: {wallet?.availablePoints?.toLocaleString("vi-VN")} đ
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tên Ngân Hàng <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={withdrawData.bankName}
                onChange={(e) => setWithdrawData({ ...withdrawData, bankName: e.target.value })}
                placeholder="VD: Vietcombank, Techcombank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tên Chủ Tài Khoản <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={withdrawData.bankAccountName}
                onChange={(e) => setWithdrawData({ ...withdrawData, bankAccountName: e.target.value })}
                placeholder="Tên chủ tài khoản"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Số Tài Khoản <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={withdrawData.bankAccountNumber}
                onChange={(e) => setWithdrawData({ ...withdrawData, bankAccountNumber: e.target.value })}
                placeholder="Số tài khoản"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Đang gửi..." : "Gửi Yêu Cầu"}
              </button>
              <button
                type="button"
                onClick={() => setShowWithdrawForm(false)}
                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lịch Sử Giao Dịch</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-600">Chưa có giao dịch nào</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.type === "DEPOSIT" || tx.type === "REFUND"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {tx.type === "DEPOSIT" || tx.type === "REFUND" ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.type === "DEPOSIT"
                          ? "Nạp tiền"
                          : tx.type === "WITHDRAWAL"
                            ? "Rút tiền"
                            : tx.type === "COMMISSION"
                              ? "Hoa hồng"
                              : tx.type === "REFUND"
                                ? "Hoàn tiền"
                                : tx.type}
                      </p>
                      <p className="text-sm text-gray-600">{new Date(tx.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === "DEPOSIT" || tx.type === "REFUND"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}
                      {tx.amount?.toLocaleString("vi-VN")} đ
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {tx.status === "COMPLETED"
                        ? "Hoàn thành"
                        : tx.status === "PENDING"
                          ? "Chờ xử lý"
                          : tx.status === "REJECTED"
                            ? "Bị từ chối"
                            : tx.status}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
