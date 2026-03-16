import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, LogOut } from "lucide-react";
import { listBikesAPI, requestInspectionAPI, listInspectionsAPI, getInspectionDetailAPI, getWalletAPI } from "../../services/Seller/sellerService";
import PostsTab from "./PostsTab";
import InspectionTab from "./InspectionTab";
import CreateBikeTab from "./CreateBikeTab";
import WalletTab from "./WalletTab";
import BikeDetailModal from "./BikeDetailModal";
import InspectionReportModal from "./InspectionReportModal";
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
};

type BikeItem = BikeBrowseItem;

type TabKey = "posts" | "create" | "inspection" | "wallet";

type InspectionDetail = {
    inspection?: unknown;
    report?: unknown;
    history?: unknown;
};

type PageResponse<T> = {
    content?: T[];
    data?: { content?: T[] };
};

type WalletLike = {
    availablePoints?: number;
    frozenPoints?: number;
    data?: {
        availablePoints?: number;
        frozenPoints?: number;
    };
};

function getToken() {
    return localStorage.getItem("token") || "";
}

export default function SellerPage() {
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const token = getToken();

    const [tab, setTab] = useState<TabKey>("posts");
    const [bikeDetail, setBikeDetail] = useState<BikeBrowseItem | null>(null);

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

    const refreshWallet = async () => {
        try {
            const w = await getWalletAPI(token);
            setWallet(w as WalletLike);
        } catch (e) {
            console.error("Error loading wallet:", e);
            setWallet({ availablePoints: 0, frozenPoints: 0 });
        }
    };

    const refreshBikes = async () => {
        try {
            setBikesLoading(true);
            setBikesError(null);
            
            const response = await listBikesAPI({ page: 0, size: 100 }, token);
            
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
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const openInspectionForBike = async (bikeId: number) => {
        try {
            void bikeId; // Used in filtering/logging
            setInspectionOpen(true);
            setInspectionLoading(true);
            setInspectionError(null);
            setInspectionDetail(null);

            const page = await listInspectionsAPI({ page: 0, size: 10 } as Record<string, number>, token);
            const p = page as unknown as PageResponse<{ id?: number }> | { id?: number }[];
            const content =
                (p as PageResponse<{ id?: number }>)?.content ??
                (p as PageResponse<{ id?: number }>)?.data?.content ??
                (Array.isArray(p) ? p : []);
            if (!Array.isArray(content) || content.length === 0) {
                throw new Error("Chưa có yêu cầu kiểm định cho xe này.");
            }

            const asRecord = (value: unknown): Record<string, unknown> => {
                return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
            };
            const inspectionId = Number(asRecord(content[0]).id ?? 0) || undefined;
            if (!inspectionId) {
                throw new Error("Không tìm thấy inspectionId.");
            }

            const detail = await getInspectionDetailAPI(inspectionId, token);
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
            setRequestSuccess("Đã gửi yêu cầu kiểm định. Hệ thống sẽ trừ điểm từ ví của bạn.");
            void refreshBikes();
        } catch (e) {
            setRequestError((e as Error).message || "Không thể gửi yêu cầu kiểm định.");
        } finally {
            setRequestLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <Link to="/buyer" className="flex items-center gap-3 group">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition">
                        <Bike size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition">
                        BikeExchange
                    </span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="text-sm text-gray-500">Người bán</span>
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user?.email ?? "Người bán"}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
                    >
                        <LogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.email ?? "bạn"} 👋</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý danh sách xe và đơn hàng của bạn.</p>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {[
                        { key: "posts", label: "Bài đăng của tôi" },
                        { key: "create", label: "Đăng tin bán xe" },
                        { key: "inspection", label: "Kiểm định" },
                        { key: "wallet", label: "Ví" },
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
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                                tab === (t.key as TabKey)
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
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
                        canRequestInspection={canRequestInspection}
                    />
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

                {/* WALLET TAB */}
                {tab === "wallet" && <WalletTab token={token} />}
            </main>

            {/* Bike detail modal */}
            <BikeDetailModal bike={bikeDetail} onClose={() => setBikeDetail(null)} />

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
