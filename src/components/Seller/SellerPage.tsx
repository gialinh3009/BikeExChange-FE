import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, ChevronDown, Coins, LogOut } from "lucide-react";
import { listSellerBikesAPI } from "../../services/Seller/bikeManagementService";
import { requestInspectionAPI, getInspectionDetailByBikeIdAPI } from "../../services/Seller/inspectionService";
import { getWalletAPI } from "../../services/Seller/walletService";
import {
    getBikePostFeeAPI,
    getCommissionRateAPI,
    getInspectionFeeAPI,
    getSellerUpgradeFeeAPI,
} from "../../services/settingsService";
import PostsTab from "./PostsTab";
import InspectionTab from "./InspectionTab";
import CreateBikeTab from "./CreateBikeTab";
import WalletTab from "./WalletTab";
import SellerOrdersTab from "./SellerOrdersTab";
import SellerDisputesTab from "./SellerDisputesTab";
import SellerSalesHistoryTab from "./SellerSalesHistoryTab";
import SellerTransactionHistoryTab from "./SellerTransactionHistoryTab";
import BikeDetailModal from "./BikeDetailModal";
import EditBikeModal from "./EditBikeModal";
import DeleteBikeModal from "./DeleteBikeModal";
import InspectionReportModal, { type InspectionDetail } from "./InspectionReportModal";
import RequestInspectionModal from "./RequestInspectionModal";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
    sellerId?: number;
    seller?: { id: number };
    createdAt?: string;
    description?: string;
    bikeType?: string;
    frameSize?: string;
    model?: string;
    year?: string;
    brand?: string;
};

type BikeItem = BikeBrowseItem;

type TabKey = "posts" | "create" | "inspection" | "wallet" | "orders" | "disputes" | "history" | "transactions";

type WalletLike = {
    availablePoints?: number;
    frozenPoints?: number;
    remainingFreePosts?: number;
    data?: {
        availablePoints?: number;
        frozenPoints?: number;
        remainingFreePosts?: number;
    };
};

type FeeRules = {
    bikePostFee: number | null;
    inspectionFee: number | null;
    commissionRate: number | null;
    sellerUpgradeFee: number | null;
};

function getToken() {
    return localStorage.getItem("token") || "";
}

export default function SellerPage() {
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const token = getToken();
    const feeRef = useRef<HTMLDivElement | null>(null);

    const [tab, setTab] = useState<TabKey>("posts");
    const [bikeDetail, setBikeDetail] = useState<BikeBrowseItem | null>(null);
    const [editBike, setEditBike] = useState<BikeBrowseItem | null>(null);
    const [deleteBike, setDeleteBike] = useState<BikeBrowseItem | null>(null);

    // Seller bikes
    const [bikesLoading, setBikesLoading] = useState(false);
    const [bikesError, setBikesError] = useState<string | null>(null);
    const [bikes, setBikes] = useState<BikeItem[]>([]);

    // Inspection tab filter
    const [inspectionFilter, setInspectionFilter] = useState<"all" | "approved" | "pending">("all");

    // Inspection sticker modal (xem báo cáo đã có)
    const [inspectionOpen, setInspectionOpen] = useState(false);
    const [inspectionLoading, setInspectionLoading] = useState(false);
    const [inspectionError, setInspectionError] = useState<string | null>(null);
    const [inspectionDetail, setInspectionDetail] = useState<InspectionDetail | null>(null);

    // Request inspection for existing bikes
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestBike, setRequestBike] = useState<BikeBrowseItem | null>(null);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
    const [requestForm, setRequestForm] = useState({
        preferredDate: "",
        preferredTimeSlot: "",
        address: "",
        contactPhone: "",
        notes: "",
    });

    // Wallet
    const [wallet, setWallet] = useState<WalletLike | null>(null);
    const [inspectionFee, setInspectionFee] = useState<number | null>(null);
    const [feeOpen, setFeeOpen] = useState(false);
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);
    const [feeRules, setFeeRules] = useState<FeeRules>({
        bikePostFee: null,
        inspectionFee: null,
        commissionRate: null,
        sellerUpgradeFee: null,
    });

    const refreshWallet = async () => {
        try {
            const w = await getWalletAPI(token);
            setWallet(w as WalletLike);
        } catch (e) {
            console.error("Error loading wallet:", e);
            setWallet({ availablePoints: 0, frozenPoints: 0 });
        }
    };

    const refreshInspectionFee = async () => {
        try {
            const fee = await getInspectionFeeAPI();
            setInspectionFee(Number.isFinite(Number(fee)) ? Number(fee) : null);
        } catch {
            setInspectionFee(null);
        }
    };

    const refreshFeeRules = async () => {
        try {
            setFeeLoading(true);
            setFeeError(null);
            const [bikePostFeeValue, inspectionFeeValue, commissionRateValue, sellerUpgradeFeeValue] = await Promise.all([
                getBikePostFeeAPI(),
                getInspectionFeeAPI(),
                getCommissionRateAPI(),
                getSellerUpgradeFeeAPI(),
            ]);
            setFeeRules({
                bikePostFee: Number.isFinite(Number(bikePostFeeValue)) ? Number(bikePostFeeValue) : null,
                inspectionFee: Number.isFinite(Number(inspectionFeeValue)) ? Number(inspectionFeeValue) : null,
                commissionRate: Number.isFinite(Number(commissionRateValue)) ? Number(commissionRateValue) : null,
                sellerUpgradeFee: Number.isFinite(Number(sellerUpgradeFeeValue)) ? Number(sellerUpgradeFeeValue) : null,
            });
        } catch {
            setFeeError("Không thể tải biểu lệ phí. Vui lòng thử lại.");
        } finally {
            setFeeLoading(false);
        }
    };

    const formatVND = (value: number | null) =>
        value !== null ? `${value.toLocaleString("vi-VN")} VND` : "Chưa cấu hình";

    const toggleFeeOpen = () => {
        const next = !feeOpen;
        setFeeOpen(next);
        const notLoadedYet =
            feeRules.bikePostFee === null &&
            feeRules.inspectionFee === null &&
            feeRules.commissionRate === null &&
            feeRules.sellerUpgradeFee === null;
        if (next && notLoadedYet && !feeLoading) {
            void refreshFeeRules();
        }
    };

    const refreshBikes = async () => {
        try {
            setBikesLoading(true);
            setBikesError(null);
            
            const response = await listSellerBikesAPI({ page: 0, size: 100 }, token);
            
            let content = [];
            if (response?.data) {
                content = Array.isArray(response.data) ? response.data : [];
            } else if (Array.isArray(response)) {
                content = response;
            }
            
            console.log("🚲 API Response:", response);
            console.log("📦 Parsed content:", content);
            
            const userId = user?.id;
            const sellerBikes = content
                .filter((b: BikeBrowseItem) => {
                    const sellerId = b.sellerId || b.seller?.id;
                    return sellerId === userId;
                })
                .map((b: BikeBrowseItem) => ({
                    id: b.id || 0,
                    title: b.title || "",
                    pricePoints: b.pricePoints || 0,
                    condition: b.condition || null,
                    status: b.status || "ACTIVE",
                    inspectionStatus: b.inspectionStatus || "NONE",
                    media: b.media || [],
                    sellerId: b.sellerId || b.seller?.id || 0,
                    createdAt: b.createdAt,
                    description: b.description,
                    bikeType: b.bikeType,
                    frameSize: b.frameSize,
                    model: b.model,
                    year: b.year,
                    brand: b.brand,
                }));
            
            console.log(`✅ Filtered ${sellerBikes.length} bikes for seller #${userId}`);
            setBikes(sellerBikes as BikeItem[]);
        } catch (e) {
            console.error("❌ Error loading bikes:", e);
            setBikesError((e as Error).message || "Không thể tải danh sách xe.");
            setBikes([]);
        } finally {
            setBikesLoading(false);
        }
    };

    useEffect(() => {
        void refreshBikes();
        void refreshWallet();
        void refreshInspectionFee();
    }, [token]);

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (feeRef.current && !feeRef.current.contains(event.target as Node)) {
                setFeeOpen(false);
            }
        };
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const openInspectionForBike = async (bikeId: number) => {
        try {
            setInspectionOpen(true);
            setInspectionLoading(true);
            setInspectionError(null);
            setInspectionDetail(null);

            const detail = await getInspectionDetailByBikeIdAPI(bikeId, token);
            setInspectionDetail(detail as InspectionDetail);
        } catch (e) {
            setInspectionError((e as Error).message || "Không thể tải thông tin kiểm định.");
        } finally {
            setInspectionLoading(false);
        }
    };

    const canRequestInspection = (bike?: BikeBrowseItem | null) => {
        if (!bike) return false;
        const status = (bike.inspectionStatus ?? "").toUpperCase();
        return status === "" || status === "NONE" || status === "REJECTED";
    };

    const openRequestForBike = (bike: BikeBrowseItem) => {
        setRequestBike(bike);
        setRequestForm({
            preferredDate: "",
            preferredTimeSlot: "",
            address: "",
            contactPhone: "",
            notes: "",
        });
        setRequestError(null);
        setRequestSuccess(null);
        setRequestOpen(true);
    };

    const handleSubmitInspectionRequest = async () => {
        if (!requestBike) return;
        try {
            setRequestLoading(true);
            setRequestError(null);
            setRequestSuccess(null);
            await requestInspectionAPI(
                {
                    bikeId: requestBike.id,
                    preferredDate: requestForm.preferredDate || null,
                    preferredTimeSlot: requestForm.preferredTimeSlot || null,
                    address: requestForm.address || null,
                    contactPhone: requestForm.contactPhone || null,
                    notes: requestForm.notes || null,
                },
                token
            );
            setRequestSuccess(
                inspectionFee !== null
                    ? `Đã gửi yêu cầu kiểm định. Hệ thống sẽ trừ ${inspectionFee.toLocaleString("vi-VN")} VND từ ví của bạn.`
                    : "Đã gửi yêu cầu kiểm định. Hệ thống sẽ trừ phí kiểm định hiện hành từ ví của bạn."
            );
            void refreshBikes();
            void refreshWallet();
        } catch (e) {
            setRequestError((e as Error).message || "Không thể gửi yêu cầu kiểm định.");
        } finally {
            setRequestLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/buyer" className="flex items-center gap-3 group">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:shadow-lg transition">
                            <Bike size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-base">BikeExchange</div>
                            <div className="text-xs text-gray-500">Người bán</div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-6">
                        <div className="relative" ref={feeRef}>
                            <button
                                onClick={toggleFeeOpen}
                                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    feeOpen ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                                }`}
                            >
                                <Coins size={14} />
                                Quy định phí
                                <ChevronDown size={14} className={`transition-transform ${feeOpen ? "rotate-180" : ""}`} />
                            </button>

                            {feeOpen && (
                                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900">Quy định các khoản thu</p>
                                        <p className="mt-0.5 text-xs text-gray-500">Áp dụng theo cấu hình hiện hành của hệ thống</p>
                                    </div>

                                    <div className="px-4 py-3">
                                        {feeLoading ? (
                                            <p className="text-xs text-gray-400">Đang tải dữ liệu...</p>
                                        ) : feeError ? (
                                            <div className="space-y-2">
                                                <p className="text-xs text-red-500">{feeError}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => void refreshFeeRules()}
                                                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                >
                                                    Thử lại
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5 text-xs">
                                                <FeeRow label="Phí đăng 1 bài" value={formatVND(feeRules.bikePostFee)} />
                                                <FeeRow label="Phí kiểm định" value={formatVND(feeRules.inspectionFee)} />
                                                <FeeRow label="Phí nâng cấp Seller" value={formatVND(feeRules.sellerUpgradeFee)} />
                                                <FeeRow
                                                    label="Hoa hồng giao dịch"
                                                    value={
                                                        feeRules.commissionRate !== null
                                                            ? `${Number(feeRules.commissionRate || 0).toFixed(0)}%`
                                                            : "Chưa cấu hình"
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{user?.email ?? "Người bán"}</div>
                            <div className="text-xs text-gray-500">Tài khoản bán hàng</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                        >
                            <LogOut size={16} />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Xin chào Seller của BikeExChange, {user?.email?.split("@")[0] ?? "bạn"} 👋</h1>
                    <p className="text-gray-600 text-sm mt-2">Quản lý bài đăng, đơn hàng và ví của bạn</p>
                </div>

                {/* Tabs Navigation */}
                <div className="mb-8 border-b border-gray-200">
                    <div className="flex gap-1 overflow-x-auto">
                        {[
                            { key: "posts", label: "Bài đăng của tôi", icon: "📝" },
                            { key: "create", label: "Đăng tin bán xe", icon: "➕" },
                            { key: "inspection", label: "Kiểm định", icon: "✓" },
                            { key: "orders", label: "Đơn hàng", icon: "📦" },
                            { key: "history", label: "Lịch sử bán hàng", icon: "📊" },
                            { key: "transactions", label: "Giao dịch", icon: "💳" },
                            { key: "disputes", label: "Tranh chấp", icon: "⚠️" },
                            { key: "wallet", label: "Ví", icon: "💰" },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => {
                                    const k = t.key as TabKey;
                                    setTab(k);
                                    if (k === "posts") void refreshBikes();
                                    if (k === "inspection") void refreshBikes();
                                    if (k === "wallet") void refreshWallet();
                                }}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    tab === (t.key as TabKey)
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <span className="mr-1">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* POSTS TAB */}
                {tab === "posts" && (
                    <PostsTab
                        bikes={bikes}
                        bikesLoading={bikesLoading}
                        bikesError={bikesError}
                        onCreateClick={() => setTab("create")}
                        onViewInspection={openInspectionForBike}
                        onRequestInspection={openRequestForBike}
                        onViewDetails={setBikeDetail}
                        onEditBike={setEditBike}
                        onDeleteBike={setDeleteBike}
                        canRequestInspection={canRequestInspection}
                    />
                )}

                {/* ORDERS TAB */}
                {tab === "orders" && (
                    <SellerOrdersTab token={token} />
                )}

                {/* DISPUTES TAB */}
                {tab === "disputes" && (
                    <SellerDisputesTab token={token} />
                )}

                {/* CREATE TAB */}
                {tab === "create" && (
                    <CreateBikeTab
                        token={token}
                        wallet={wallet}
                        onBikeCreated={refreshBikes}
                        onWalletRefresh={refreshWallet}
                    />
                )}

                {/* INSPECTION TAB */}
                {tab === "inspection" && (
                    <InspectionTab
                        bikes={bikes}
                        bikesLoading={bikesLoading}
                        bikesError={bikesError}
                        inspectionFilter={inspectionFilter}
                        onFilterChange={setInspectionFilter}
                        onRefresh={refreshBikes}
                        onViewInspection={openInspectionForBike}
                        onRequestInspection={openRequestForBike}
                        onViewBikeDetail={setBikeDetail}
                        canRequestInspection={canRequestInspection}
                    />
                )}

                {/* HISTORY TAB */}
                {tab === "history" && (
                    <SellerSalesHistoryTab token={token} />
                )}

                {/* TRANSACTIONS TAB */}
                {tab === "transactions" && (
                    <SellerTransactionHistoryTab token={token} userId={user?.id} />
                )}

                {/* WALLET TAB */}
                {tab === "wallet" && <WalletTab token={token} userId={user?.id} />}
            </main>

            {/* Bike detail modal */}
            <BikeDetailModal
                bike={bikeDetail}
                onClose={() => setBikeDetail(null)}
                onEdit={setEditBike}
                onDelete={setDeleteBike}
            />

            {/* Edit bike modal */}
            <EditBikeModal
                bike={editBike}
                token={token}
                onClose={() => setEditBike(null)}
                onSuccess={refreshBikes}
            />

            {/* Delete bike modal */}
            <DeleteBikeModal
                bike={deleteBike}
                token={token}
                onClose={() => setDeleteBike(null)}
                onSuccess={refreshBikes}
            />

            {/* Inspection report modal */}
            <InspectionReportModal
                isOpen={inspectionOpen}
                isLoading={inspectionLoading}
                error={inspectionError}
                detail={inspectionDetail}
                onClose={() => {
                    setInspectionOpen(false);
                    setInspectionDetail(null);
                }}
            />

            {/* Request inspection modal */}
            <RequestInspectionModal
                isOpen={requestOpen}
                bike={requestBike}
                isLoading={requestLoading}
                error={requestError}
                success={requestSuccess}
                form={requestForm}
                onFormChange={(field, value) => setRequestForm((p) => ({ ...p, [field]: value }))}
                onSubmit={() => void handleSubmitInspectionRequest()}
                onClose={() => {
                    setRequestOpen(false);
                    setRequestBike(null);
                }}
            />
        </div>
    );
}

function FeeRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
        </div>
    );
}
