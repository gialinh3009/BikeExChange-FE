import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBikesAPI } from "../../services/Seller/bikeManagementService";
import { requestInspectionAPI, listInspectionsAPI, getInspectionDetailAPI } from "../../services/Seller/inspectionService";
import PostsTab from "./PostsTab";
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

type InspectionDetail = {
    inspection?: unknown;
    report?: unknown;
    history?: unknown;
};

type PageResponse<T> = {
    content?: T[];
    data?: { content?: T[] };
};

function getToken() {
    return localStorage.getItem("token") || "";
}

export default function SellerDashboard() {
    const navigate = useNavigate();
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const token = getToken();

    const [bikeDetail, setBikeDetail] = useState<BikeBrowseItem | null>(null);

    // Seller bikes
    const [bikesLoading, setBikesLoading] = useState(false);
    const [bikesError, setBikesError] = useState<string | null>(null);
    const [bikes, setBikes] = useState<BikeItem[]>([]);

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
    }, [token]);

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

    const handleFormChange = (field: string, value: string) => {
        setRequestForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.email ?? "bạn"} 👋</h1>
                <p className="text-gray-500 text-sm mt-1">Quản lý danh sách xe và đơn hàng của bạn.</p>
            </div>

            {/* Posts Tab Content */}
            <PostsTab
                bikes={bikes}
                bikesLoading={bikesLoading}
                bikesError={bikesError}
                onCreateClick={() => navigate("/seller/create")}
                onRequestInspection={openRequestForBike}
                onViewInspection={openInspectionForBike}
                onViewDetails={setBikeDetail}
                onEditBike={() => {}}
                onDeleteBike={() => {}}
                canRequestInspection={canRequestInspection}
            />

            {/* Modals */}
            {bikeDetail && (
                <BikeDetailModal
                    bike={bikeDetail}
                    onClose={() => setBikeDetail(null)}
                />
            )}

            {inspectionOpen && (
                <InspectionReportModal
                    isOpen={inspectionOpen}
                    isLoading={inspectionLoading}
                    error={inspectionError}
                    detail={inspectionDetail}
                    onClose={() => setInspectionOpen(false)}
                />
            )}

            {requestOpen && requestBike && (
                <RequestInspectionModal
                    isOpen={requestOpen}
                    bike={requestBike}
                    isLoading={requestLoading}
                    error={requestError}
                    success={requestSuccess}
                    form={requestForm}
                    onFormChange={handleFormChange}
                    onSubmit={handleSubmitInspectionRequest}
                    onClose={() => setRequestOpen(false)}
                />
            )}
        </div>
    );
}