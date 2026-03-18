import { useEffect, useState } from "react";
import { listBikesAPI } from "../../services/Seller/bikeManagementService";
import InspectionTab from "./InspectionTab";

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

function getToken() {
    return localStorage.getItem("token") || "";
}

export default function InspectionPage() {
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const token = getToken();

    const [bikesLoading, setBikesLoading] = useState(false);
    const [bikesError, setBikesError] = useState<string | null>(null);
    const [bikes, setBikes] = useState<BikeItem[]>([]);

    const [inspectionFilter, setInspectionFilter] = useState<"all" | "approved" | "pending">("all");

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

            setBikes(sellerBikes as BikeItem[]);
        } catch (e) {
            console.error("Error loading bikes:", e);
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
        console.log("Open inspection for bike:", bikeId);
    };

    const canRequestInspection = (bike?: BikeBrowseItem | null) => {
        if (!bike) return false;
        const status = (bike.inspectionStatus ?? "").toUpperCase();
        return status === "" || status === "NONE" || status === "REJECTED";
    };

    const openRequestForBike = (bike: BikeBrowseItem) => {
        console.log("Request inspection for bike:", bike);
    };

    return (
        <div className="space-y-6">
            <InspectionTab
                bikes={bikes}
                bikesLoading={bikesLoading}
                bikesError={bikesError}
                inspectionFilter={inspectionFilter}
                onFilterChange={setInspectionFilter}
                onRefresh={refreshBikes}
                onViewInspection={openInspectionForBike}
                onRequestInspection={openRequestForBike}
                onViewBikeDetail={(bike: BikeBrowseItem) => console.log("View bike detail:", bike)}
                canRequestInspection={canRequestInspection}
            />
        </div>
    );
}