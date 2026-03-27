import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown, Coins, LogOut, Home, ShoppingBag, Store,
    Package, ClipboardCheck, Plus, Wallet, AlertTriangle, History,
    CreditCard, FileText,
} from "lucide-react";
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
    data?: { availablePoints?: number; frozenPoints?: number; remainingFreePosts?: number };
};

type FeeRules = {
    bikePostFee: number | null;
    inspectionFee: number | null;
    commissionRate: number | null;
    sellerUpgradeFee: number | null;
};

function getToken() { return localStorage.getItem("token") || ""; }

function clsx(...arr: (string | boolean | undefined | null)[]): string {
    return arr.filter(Boolean).join(" ");
}

export default function SellerPage() {
    const navigate = useNavigate();
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const token = getToken();
    const feeRef = useRef<HTMLDivElement | null>(null);

    const [tab, setTab] = useState<TabKey>("posts");
    const [bikeDetail, setBikeDetail] = useState<BikeBrowseItem | null>(null);
    const [editBike, setEditBike] = useState<BikeBrowseItem | null>(null);
    const [deleteBike, setDeleteBike] = useState<BikeBrowseItem | null>(null);

    const [bikesLoading, setBikesLoading] = useState(false);
    const [bikesError, setBikesError] = useState<string | null>(null);
    const [bikes, setBikes] = useState<BikeItem[]>([]);

    const [inspectionFilter, setInspectionFilter] = useState<"all" | "approved" | "pending">("all");
    const [inspectionOpen, setInspectionOpen] = useState(false);
    const [inspectionLoading, setInspectionLoading] = useState(false);
    const [inspectionError, setInspectionError] = useState<string | null>(null);
    const [inspectionDetail, setInspectionDetail] = useState<InspectionDetail | null>(null);

    const [requestOpen, setRequestOpen] = useState(false);
    const [requestBike, setRequestBike] = useState<BikeBrowseItem | null>(null);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
    const [requestForm, setRequestForm] = useState({
        preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: "",
    });

    const [wallet, setWallet] = useState<WalletLike | null>(null);
    const [inspectionFee, setInspectionFee] = useState<number | null>(null);
    const [feeOpen, setFeeOpen] = useState(false);
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeError, setFeeError] = useState<string | null>(null);
    const [feeRules, setFeeRules] = useState<FeeRules>({
        bikePostFee: null, inspectionFee: null, commissionRate: null, sellerUpgradeFee: null,
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
        } catch { setInspectionFee(null); }
    };

    const refreshFeeRules = async () => {
        try {
            setFeeLoading(true);
            setFeeError(null);
            const [bikePostFeeValue, inspectionFeeValue, commissionRateValue, sellerUpgradeFeeValue] = await Promise.all([
                getBikePostFeeAPI(), getInspectionFeeAPI(), getCommissionRateAPI(), getSellerUpgradeFeeAPI(),
            ]);
            setFeeRules({
                bikePostFee: Number.isFinite(Number(bikePostFeeValue)) ? Number(bikePostFeeValue) : null,
                inspectionFee: Number.isFinite(Number(inspectionFeeValue)) ? Number(inspectionFeeValue) : null,
                commissionRate: Number.isFinite(Number(commissionRateValue)) ? Number(commissionRateValue) : null,
                sellerUpgradeFee: Number.isFinite(Number(sellerUpgradeFeeValue)) ? Number(sellerUpgradeFeeValue) : null,
            });
        } catch { setFeeError("Không thể tải biểu lệ phí. Vui lòng thử lại."); }
        finally { setFeeLoading(false); }
    };

    const formatVND = (value: number | null) =>
        value !== null ? `${value.toLocaleString("vi-VN")} VND` : "Chưa cấu hình";

    const toggleFeeOpen = () => {
        const next = !feeOpen;
        setFeeOpen(next);
        const notLoadedYet = feeRules.bikePostFee === null && feeRules.inspectionFee === null &&
            feeRules.commissionRate === null && feeRules.sellerUpgradeFee === null;
        if (next && notLoadedYet && !feeLoading) void refreshFeeRules();
    };

    const refreshBikes = async () => {
        try {
            setBikesLoading(true);
            setBikesError(null);
            const response = await listSellerBikesAPI({ page: 0, size: 200 }, token);
            // BE already filters by seller_id — just normalize the array
            let content: BikeBrowseItem[] = [];
            if (Array.isArray(response)) content = response;
            else if (Array.isArray(response?.data)) content = response.data;
            else if (Array.isArray(response?.content)) content = response.content;

            const sellerBikes = content.map((b: BikeBrowseItem) => ({
                id: b.id || 0, title: b.title || "", pricePoints: b.pricePoints || 0,
                condition: b.condition || null, status: b.status || "ACTIVE",
                inspectionStatus: b.inspectionStatus || "NONE", media: b.media || [],
                sellerId: b.sellerId || b.seller?.id || 0, createdAt: b.createdAt,
                description: b.description, bikeType: b.bikeType, frameSize: b.frameSize,
                model: b.model, year: b.year, brand: b.brand,
            }));
            setBikes(sellerBikes as BikeItem[]);
        } catch (e) {
            setBikesError((e as Error).message || "Không thể tải danh sách xe.");
            setBikes([]);
        } finally { setBikesLoading(false); }
    };

    useEffect(() => {
        void refreshBikes();
        void refreshWallet();
        void refreshInspectionFee();
    }, [token]);

    useEffect(() => {
        const onMouseDown = (event: MouseEvent) => {
            if (feeRef.current && !feeRef.current.contains(event.target as Node)) setFeeOpen(false);
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
        } finally { setInspectionLoading(false); }
    };

    const canRequestInspection = (bike?: BikeBrowseItem | null) => {
        if (!bike) return false;
        const status = (bike.inspectionStatus ?? "").toUpperCase();
        return status === "" || status === "NONE" || status === "REJECTED";
    };

    const openRequestForBike = (bike: BikeBrowseItem) => {
        setRequestBike(bike);
        setRequestForm({ preferredDate: "", preferredTimeSlot: "", address: "", contactPhone: "", notes: "" });
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
            await requestInspectionAPI({
                bikeId: requestBike.id,
                preferredDate: requestForm.preferredDate || null,
                preferredTimeSlot: requestForm.preferredTimeSlot || null,
                address: requestForm.address || null,
                contactPhone: requestForm.contactPhone || null,
                notes: requestForm.notes || null,
            }, token);
            setRequestSuccess(
                inspectionFee !== null
                    ? `Đã gửi yêu cầu kiểm định. Hệ thống sẽ trừ ${inspectionFee.toLocaleString("vi-VN")} VND từ ví của bạn.`
                    : "Đã gửi yêu cầu kiểm định. Hệ thống sẽ trừ phí kiểm định hiện hành từ ví của bạn."
            );
            void refreshBikes();
            void refreshWallet();
        } catch (e) {
            setRequestError((e as Error).message || "Không thể gửi yêu cầu kiểm định.");
        } finally { setRequestLoading(false); }
    };

    const walletPoints =
        wallet?.availablePoints ??
        wallet?.data?.availablePoints ??
        0;

    const initials = (user?.fullName || user?.email || "S").slice(0, 1).toUpperCase();

    const tabs: { key: TabKey; label: string; icon: React.ComponentType<any> }[] = [
        { key: "posts",        label: "Bài đăng",       icon: FileText },
        { key: "create",       label: "Đăng tin",        icon: Plus },
        { key: "inspection",   label: "Kiểm định",       icon: ClipboardCheck },
        { key: "orders",       label: "Xe chờ xác nhận", icon: Package },
        { key: "history",      label: "Lịch sử bán",     icon: History },
        { key: "transactions", label: "Giao dịch",       icon: CreditCard },
        { key: "disputes",     label: "Tranh chấp",      icon: AlertTriangle },
        { key: "wallet",       label: "Ví",              icon: Wallet },
    ];

    return (
        <div className="min-h-screen bg-orange-50/20">
            {/* ── Page Header ── */}
            <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-6 py-6 rounded-2xl mb-6 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left: identity */}
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl shadow-inner shrink-0">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center gap-1.5 bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                    <Store size={11} />
                                    SELLER
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">
                                Xin chào, {user?.fullName || user?.email?.split("@")[0] || "Người bán"} 👋
                            </h1>
                            <p className="text-orange-100 text-sm mt-0.5">Quản lý bài đăng, đơn hàng và ví của bạn</p>
                        </div>
                    </div>

                    {/* Right: quick actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Wallet balance chip */}
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-3 py-2">
                            <Coins size={15} className="text-amber-200" />
                            <span className="text-white text-sm font-semibold">
                                {walletPoints.toLocaleString("vi-VN")} VND
                            </span>
                        </div>

                        {/* Fee rules */}
                        <div className="relative" ref={feeRef}>
                            <button
                                onClick={toggleFeeOpen}
                                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl px-3 py-2 text-white text-sm font-medium transition"
                            >
                                <Coins size={14} />
                                Quy định phí
                                <ChevronDown size={13} className={`transition-transform ${feeOpen ? "rotate-180" : ""}`} />
                            </button>
                            {feeOpen && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900">Quy định các khoản thu</p>
                                        <p className="mt-0.5 text-xs text-gray-500">Áp dụng theo cấu hình hiện hành</p>
                                    </div>
                                    <div className="px-4 py-3">
                                        {feeLoading ? (
                                            <p className="text-xs text-gray-400">Đang tải dữ liệu...</p>
                                        ) : feeError ? (
                                            <div className="space-y-2">
                                                <p className="text-xs text-red-500">{feeError}</p>
                                                <button type="button" onClick={() => void refreshFeeRules()}
                                                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50">
                                                    Thử lại
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5 text-xs">
                                                <FeeRow label="Phí đăng 1 bài" value={formatVND(feeRules.bikePostFee)} />
                                                <FeeRow label="Phí kiểm định" value={formatVND(feeRules.inspectionFee)} />
                                                <FeeRow label="Phí nâng cấp Seller" value={formatVND(feeRules.sellerUpgradeFee)} />
                                                <FeeRow label="Hoa hồng giao dịch"
                                                    value={feeRules.commissionRate !== null
                                                        ? `${Number(feeRules.commissionRate || 0).toFixed(0)}%`
                                                        : "Chưa cấu hình"} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Home */}
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl px-3 py-2 text-white text-sm font-medium transition"
                        >
                            <Home size={14} />
                            <span className="hidden sm:inline">Trang chủ</span>
                        </button>

                        {/* Buyer overview */}
                        <button
                            onClick={() => navigate("/buyer")}
                            className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition shadow-sm"
                        >
                            <ShoppingBag size={14} />
                            <span className="hidden sm:inline">Tổng quan Buyer</span>
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 bg-white/10 hover:bg-red-500/30 backdrop-blur rounded-xl px-3 py-2 text-white text-sm font-medium transition"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="mb-6">
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const isActive = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => {
                                    setTab(t.key);
                                    if (t.key === "posts") void refreshBikes();
                                    if (t.key === "inspection") void refreshBikes();
                                    if (t.key === "wallet") void refreshWallet();
                                }}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                                    isActive
                                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50",
                                )}
                            >
                                <Icon size={15} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm min-h-[400px] p-6">
                {tab === "posts" && (
                    <PostsTab
                        bikes={bikes} bikesLoading={bikesLoading} bikesError={bikesError}
                        onCreateClick={() => setTab("create")}
                        onViewInspection={openInspectionForBike}
                        onRequestInspection={openRequestForBike}
                        onViewDetails={setBikeDetail}
                        onEditBike={setEditBike}
                        onDeleteBike={setDeleteBike}
                        canRequestInspection={canRequestInspection}
                    />
                )}
                {tab === "orders" && <SellerOrdersTab token={token} />}
                {tab === "disputes" && <SellerDisputesTab token={token} />}
                {tab === "create" && (
                    <CreateBikeTab
                        token={token} wallet={wallet}
                        onBikeCreated={refreshBikes}
                        onWalletRefresh={refreshWallet}
                    />
                )}
                {tab === "inspection" && (
                    <InspectionTab
                        bikes={bikes} bikesLoading={bikesLoading} bikesError={bikesError}
                        inspectionFilter={inspectionFilter}
                        onFilterChange={setInspectionFilter}
                        onRefresh={refreshBikes}
                        onViewInspection={openInspectionForBike}
                        onRequestInspection={openRequestForBike}
                        onViewBikeDetail={setBikeDetail}
                        canRequestInspection={canRequestInspection}
                    />
                )}
                {tab === "history" && <SellerSalesHistoryTab token={token} />}
                {tab === "transactions" && <SellerTransactionHistoryTab token={token} userId={user?.id} />}
                {tab === "wallet" && <WalletTab token={token} userId={user?.id} />}
            </div>

            {/* ── Modals (unchanged) ── */}
            <BikeDetailModal bike={bikeDetail} onClose={() => setBikeDetail(null)} onEdit={setEditBike} onDelete={setDeleteBike} />
            <EditBikeModal bike={editBike} token={token} onClose={() => setEditBike(null)} onSuccess={refreshBikes} />
            <DeleteBikeModal bike={deleteBike} token={token} onClose={() => setDeleteBike(null)} onSuccess={refreshBikes} />
            <InspectionReportModal
                isOpen={inspectionOpen} isLoading={inspectionLoading}
                error={inspectionError} detail={inspectionDetail}
                onClose={() => { setInspectionOpen(false); setInspectionDetail(null); }}
            />
            <RequestInspectionModal
                isOpen={requestOpen} bike={requestBike}
                isLoading={requestLoading} error={requestError} success={requestSuccess}
                form={requestForm}
                onFormChange={(field, value) => setRequestForm((p) => ({ ...p, [field]: value }))}
                onSubmit={() => void handleSubmitInspectionRequest()}
                onClose={() => { setRequestOpen(false); setRequestBike(null); }}
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
