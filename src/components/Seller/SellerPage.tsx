import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bike,
    LogOut,
    Plus,
    CreditCard,
    ShieldCheck,
    X,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { createBikeAPI } from "../../services/bikeService";
import { listSellerPostsAPI, createSellerPostAPI } from "../../services/sellerPostService";
import { createVnPayPaymentURLAPI } from "../../services/vnpayService";
import { requestInspectionAPI, listInspectionsAPI, getInspectionDetailAPI } from "../../services/inspectionService";
import { getWalletAPI } from "../../services/walletService";
import { listCategoriesAPI } from "../../services/categoryService";

type BikeBrowseItem = {
    id: number;
    title: string;
    pricePoints: number;
    condition: string | null;
    status?: string;
    inspectionStatus?: string;
    media?: { url: string; type: string; sortOrder: number }[];
};

type PostItem = {
    id: number;
    caption: string | null;
    postType?: string;
    status?: string;
    bike?: BikeBrowseItem;
    bikeId?: number;
};

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

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getToken() {
    return localStorage.getItem("token") || "";
}

function getPostCredits() {
    const raw = localStorage.getItem("seller_post_credits");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function setPostCredits(n: number) {
    localStorage.setItem("seller_post_credits", String(Math.max(0, Math.floor(n))));
}

export default function SellerPage() {
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const token = useMemo(() => getToken(), []);

    const [tab, setTab] = useState<TabKey>("posts");
    const [bikeDetail, setBikeDetail] = useState<BikeBrowseItem | null>(null);

    // Seller posts
    const [postsLoading, setPostsLoading] = useState(false);
    const [postsError, setPostsError] = useState<string | null>(null);
    const [posts, setPosts] = useState<PostItem[]>([]);

    // Create post modal/form
    const [credits, setCredits] = useState<number>(getPostCredits());
    const [paymentMode, setPaymentMode] = useState<"wallet" | "credits">("wallet");
    const [packageChoice, setPackageChoice] = useState<"single" | "pack10">("single");
    const [paymentPending, setPaymentPending] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);
    const [selectedImages, setSelectedImages] = useState<{ name: string; dataUrl: string }[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [form, setForm] = useState({
        mediaUrls: "",
        title: "",
        bikeType: "Road",
        brand: "Giant",
        model: "",
        frameSize: "M",
        condition: "Tốt",
        year: "",
        priceVnd: "",
        description: "",
        categoryIds: [] as number[],
        listingType: "STANDARD" as "STANDARD" | "VERIFIED",
        caption: "",
        preferredDate: "",
        preferredTimeSlot: "",
        address: "",
        contactPhone: "",
        notes: "",
    });

    // Inspection sticker modal
    const [inspectionOpen, setInspectionOpen] = useState(false);
    const [inspectionLoading, setInspectionLoading] = useState(false);
    const [inspectionError, setInspectionError] = useState<string | null>(null);
    const [inspectionDetail, setInspectionDetail] = useState<InspectionDetail | null>(null);

    // Wallet
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [wallet, setWallet] = useState<WalletLike | null>(null);

    // Detail carousel
    const [detailIdx, setDetailIdx] = useState(0);

    const postPriceVnd = packageChoice === "pack10" ? 450000 : 50000;
    const postCreditsToAdd = packageChoice === "pack10" ? 10 : 1;

    const BIKE_TYPES = ["Road", "MTB", "Gravel", "Touring", "Hybrid", "Fixie"] as const;
    const BRANDS = [
        "Giant",
        "Trek",
        "Cannondale",
        "Specialized",
        "Merida",
        "Bianchi",
        "Pinarello",
        "Scott",
        "Marin",
        "Fuji",
        "Trinx",
        "Nakamura",
        "Twitter",
        "Asama",
    ] as const;
    const FRAME_SIZES = ["XS", "S", "M", "L", "XL", "48cm", "50cm", "52cm", "54cm", "56cm", "58cm"] as const;
    const CONDITIONS = ["Mới", "Rất tốt", "Tốt", "Bình thường", "Đã qua sử dụng"] as const;

    const refreshCategories = async () => {
        try {
            setCategoriesLoading(true);
            setCategoriesError(null);
            const page = await listCategoriesAPI({ page: 0, size: 100 });
            const content =
                (page as PageResponse<{ id: number; name: string }>)?.content ??
                (page as PageResponse<{ id: number; name: string }>)?.data?.content ??
                (Array.isArray(page) ? page : []);
            if (Array.isArray(content)) {
                setCategories(
                    content.map((c) => {
                        const obj = asRecord(c);
                        return { id: Number(obj.id ?? 0), name: String(obj.name ?? "") };
                    }).filter((c) => c.id && c.name)
                );
            } else {
                setCategories([]);
            }
        } catch (e) {
            setCategoriesError((e as Error).message || "Không thể tải danh mục.");
        } finally {
            setCategoriesLoading(false);
        }
    };

    const refreshWallet = async () => {
        try {
            setWalletLoading(true);
            setWalletError(null);
            const w = await getWalletAPI({ token });
            setWallet(w as WalletLike);
        } catch (e) {
            setWalletError((e as Error).message || "Không thể tải ví.");
        } finally {
            setWalletLoading(false);
        }
    };

    const refreshPosts = async () => {
        try {
            setPostsLoading(true);
            setPostsError(null);
            const page = (await listSellerPostsAPI({ page: 0, size: 20 }, token)) as PageResponse<PostItem> | PostItem[];
            const content =
                (page as PageResponse<PostItem>)?.content ??
                (page as PageResponse<PostItem>)?.data?.content ??
                (Array.isArray(page) ? page : []);
            if (Array.isArray(content)) {
                setPosts(
                    (content as unknown[]).map((p) => {
                        const obj = asRecord(p);
                        return {
                            id: Number(obj.id ?? 0),
                            caption: (obj.caption as string | undefined) ?? null,
                            postType: obj.postType as string | undefined,
                            status: obj.status as string | undefined,
                            bikeId: obj.bikeId as number | undefined,
                            bike: obj.bike as BikeBrowseItem | undefined,
                        };
                    })
                );
            } else {
                setPosts([]);
            }
        } catch (e) {
            setPostsError((e as Error).message || "Không thể tải bài đăng.");
        } finally {
            setPostsLoading(false);
        }
    };

    // Browse-like-buyer tab removed by request.

    useEffect(() => {
        void refreshPosts();
        void refreshWallet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    // product detail modal is currently opened from elsewhere (future)

    const handlePayPackage = async () => {
        try {
            setPaymentPending(true);
            const url = await createVnPayPaymentURLAPI(postPriceVnd, token);
            window.open(url, "_blank");
        } catch (e) {
            setCreateError((e as Error).message || "Không thể tạo thanh toán VNPay.");
            setPaymentPending(false);
        }
    };

    const handleConfirmPaid = () => {
        const next = credits + postCreditsToAdd;
        setCredits(next);
        setPostCredits(next);
        setPaymentPending(false);
        setCreateSuccess(`Đã cộng ${postCreditsToAdd} lượt đăng tin (tạm thời). Bạn có thể đăng bài ngay.`);
    };

    const handleSubmitCreate = async () => {
        setCreateError(null);
        setCreateSuccess(null);

        if (!token) {
            setCreateError("Bạn cần đăng nhập để đăng bài.");
            return;
        }
        if (paymentMode === "credits" && credits <= 0) {
            setCreateError("Bạn chưa có lượt đăng tin. Vui lòng mua gói và thanh toán.");
            return;
        }
        if (!form.title.trim() || !form.brand.trim() || !form.bikeType.trim() || !form.priceVnd.trim()) {
            setCreateError("Vui lòng nhập tối thiểu: Tiêu đề, Loại xe, Hãng, Giá.");
            return;
        }

        // Kiểm tra ví có đủ điểm trước khi gọi BE để tránh lỗi 500
        const walletAvailable =
            wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0;
        const requiredPoints = form.listingType === "VERIFIED" ? 30 : 10;
        if (walletAvailable < requiredPoints) {
            setCreateError(
                `Ví của bạn không đủ điểm để đăng bài này. Cần khoảng ${requiredPoints} points, hiện có ${walletAvailable} points. Vui lòng nạp thêm điểm trước khi đăng.`
            );
            return;
        }

        try {
            setCreateLoading(true);

            const urlMedias =
                form.mediaUrls
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((url, idx) => ({ url, type: "IMAGE", sortOrder: idx })) ?? [];

            const fileMedias =
                selectedImages.map((img, idx) => ({
                    url: img.dataUrl,
                    type: "IMAGE",
                    sortOrder: idx,
                })) ?? [];

            const media = [...fileMedias, ...urlMedias].map((m, idx) => ({
                ...m,
                sortOrder: idx,
            }));

            const bikePayload = {
                title: form.title.trim(),
                description: form.description.trim(),
                brand: form.brand.trim(),
                model: form.model.trim(),
                year: form.year ? Number(form.year) : undefined,
                pricePoints: Number(form.priceVnd.replace(/[^\d]/g, "")),
                condition: form.condition.trim(),
                bikeType: form.bikeType.trim(),
                frameSize: form.frameSize.trim(),
                media,
                categoryIds: form.categoryIds,
            };

            const bikeRes = await createBikeAPI(bikePayload, token);
            const maybeObj = bikeRes as unknown as { id?: number; data?: { id?: number } };
            const bikeId = maybeObj?.id ?? maybeObj?.data?.id;
            if (!bikeId) {
                throw new Error("Tạo xe thất bại (không nhận được bikeId).");
            }

            const postPayload = {
                bikeId,
                caption: form.caption?.trim() || "",
                listingType: form.listingType,
            };
            const postRes = await createSellerPostAPI(postPayload, token);

            // nếu seller muốn request kiểm định thủ công (hoặc đã VERIFIED thì backend tự tạo request)
            if (form.listingType === "STANDARD" && (form.preferredDate || form.preferredTimeSlot || form.address || form.contactPhone || form.notes)) {
                await requestInspectionAPI(
                    {
                        bikeId,
                        preferredDate: form.preferredDate || null,
                        preferredTimeSlot: form.preferredTimeSlot || null,
                        address: form.address || null,
                        contactPhone: form.contactPhone || null,
                        notes: form.notes || null,
                    },
                    token
                );
            }

            if (paymentMode === "credits") {
                const nextCredits = credits - 1;
                setCredits(nextCredits);
                setPostCredits(nextCredits);
            }

            setCreateSuccess("Đăng bài thành công. Hệ thống sẽ trừ thêm điểm theo quy định backend.");
            setForm((prev) => ({
                ...prev,
                mediaUrls: "",
                title: "",
                bikeType: "Road",
                brand: "Giant",
                model: "",
                frameSize: "M",
                condition: "Tốt",
                year: "",
                priceVnd: "",
                description: "",
                categoryIds: [],
                caption: "",
                preferredDate: "",
                preferredTimeSlot: "",
                address: "",
                contactPhone: "",
                notes: "",
                listingType: "STANDARD",
            }));
            setSelectedImages([]);

            void refreshPosts();
            void refreshWallet();
            void postRes;
        } catch (e) {
            setCreateError((e as Error).message || "Không thể đăng bài.");
        } finally {
            setCreateLoading(false);
        }
    };

    const openInspectionForBike = async (bikeId: number) => {
        try {
            setInspectionOpen(true);
            setInspectionLoading(true);
            setInspectionError(null);
            setInspectionDetail(null);

            const page = await listInspectionsAPI({ bike_id: bikeId, page: 0, size: 10 }, token);
            const p = page as unknown as PageResponse<{ id?: number }> | { id?: number }[];
            const content =
                (p as PageResponse<{ id?: number }>)?.content ??
                (p as PageResponse<{ id?: number }>)?.data?.content ??
                (Array.isArray(p) ? p : []);
            if (!Array.isArray(content) || content.length === 0) {
                throw new Error("Chưa có yêu cầu kiểm định cho xe này.");
            }

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

    const handlePickImages = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const list = Array.from(files);

        const readOne = (file: File) =>
            new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result || "") });
                reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
                reader.readAsDataURL(file);
            });

        try {
            const results = await Promise.all(list.map(readOne));
            setSelectedImages((prev) => [...prev, ...results]);
        } catch (e) {
            setCreateError((e as Error).message || "Không thể đọc ảnh.");
        }
    };

    const detailMedias = (bikeDetail?.media ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const detailImages = detailMedias.filter((m) => (m.type ?? "").toUpperCase() === "IMAGE" && m.url);
    const detailCurrent = detailImages[detailIdx]?.url;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <Link to="/home" className="flex items-center gap-3 group">
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
                        { key: "wallet", label: "Ví & điểm" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => {
                                const k = t.key as TabKey;
                                setTab(k);
                                if (k === "posts") void refreshPosts();
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800">Bài đăng của tôi</h2>
                            <button
                                onClick={() => {
                                    setTab("create");
                                }}
                                className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition"
                            >
                                <Plus size={15} />
                                Đăng tin
                            </button>
                        </div>

                        {postsError && (
                            <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
                                {postsError}
                            </div>
                        )}
                        {postsLoading && <div className="px-6 py-6 text-sm text-gray-500">Đang tải...</div>}

                        {!postsLoading && (
                            <div className="divide-y divide-gray-100">
                                {posts.length === 0 && (
                                    <div className="px-6 py-10 text-sm text-gray-500">
                                        Bạn chưa có bài đăng nào.
                                    </div>
                                )}
                                {posts.map((p) => {
                                    const bike = p.bike;
                                    const isVerified =
                                        bike?.status === "VERIFIED" || bike?.inspectionStatus === "APPROVED";
                                    return (
                                        <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-gray-900 truncate">
                                                        {bike?.title ?? `Bài #${p.id}`}
                                                    </div>
                                                    {isVerified && (
                                                        <button
                                                            type="button"
                                                            onClick={() => bike?.id && void openInspectionForBike(bike.id)}
                                                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                            title="Xem báo cáo kiểm định"
                                                        >
                                                            <ShieldCheck size={14} />
                                                            Đã kiểm định
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {p.caption || "—"}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-emerald-700">
                                                    {bike?.pricePoints?.toLocaleString("vi-VN")} điểm
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {p.postType ?? "STANDARD"} · {p.status ?? "ACTIVE"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* CREATE TAB */}
                {tab === "create" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Đăng tin bán xe</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Bạn có thể trừ trực tiếp phí đăng tin từ ví điểm, hoặc dùng gói VNPay (credits tạm thời).
                                </p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-xs text-gray-500">Điểm khả dụng trong ví</div>
                                <div className="text-xl font-extrabold text-gray-900">
                                    {(wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0).toLocaleString("vi-VN")}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                    Credits (gói VNPay tạm thời): <span className="font-semibold text-gray-700">{credits}</span>
                                </div>
                            </div>
                        </div>

                        {createError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>}
                        {createSuccess && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{createSuccess}</div>}

                        <div className="mb-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-800">
                            <div className="font-semibold text-blue-900 text-sm mb-1">Phí đăng tin</div>
                            <p>
                                Backend thu phí trực tiếp từ <strong>điểm (points) trong ví</strong> khi tạo bài đăng:
                                <br />- STANDARD: khoảng <strong>10 points</strong>
                                <br />- VERIFIED: khoảng <strong>30 points</strong>
                            </p>
                            <p className="mt-2">
                                Nếu chọn <strong>Thanh toán bằng ví</strong>, hệ thống sẽ kiểm tra và trừ điểm tự động (cần đủ points trước khi đăng).
                                Nếu chọn <strong>Gói VNPay</strong>, bạn nạp points qua VNPay và dùng credits để kiểm soát lượt đăng.
                            </p>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-3 text-sm">
                            <label className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-50 px-3 py-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paymentMode"
                                    value="wallet"
                                    checked={paymentMode === "wallet"}
                                    onChange={() => setPaymentMode("wallet")}
                                />
                                <span>Thanh toán bằng ví (trừ điểm trực tiếp)</span>
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paymentMode"
                                    value="credits"
                                    checked={paymentMode === "credits"}
                                    onChange={() => setPaymentMode("credits")}
                                />
                                <span>Dùng gói VNPay (credits)</span>
                            </label>
                        </div>

                        {/* Package (chỉ dùng khi chọn VNPay) */}
                        <div className="grid gap-3 md:grid-cols-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setPackageChoice("single")}
                                className={`rounded-2xl border p-4 text-left transition ${
                                    packageChoice === "single"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <div className="font-semibold text-gray-900">Gói lẻ</div>
                                <div className="text-sm text-gray-600 mt-1">50.000 VNĐ / 1 bài đăng</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPackageChoice("pack10")}
                                className={`rounded-2xl border p-4 text-left transition ${
                                    packageChoice === "pack10"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <div className="font-semibold text-gray-900">Gói 10 bài</div>
                                <div className="text-sm text-gray-600 mt-1">450.000 VNĐ / 10 bài đăng</div>
                            </button>
                        </div>

                        {paymentMode === "credits" && (
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <button
                                    type="button"
                                    onClick={handlePayPackage}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    <CreditCard size={16} />
                                    Thanh toán VNPay ({postPriceVnd.toLocaleString("vi-VN")} VNĐ)
                                </button>
                                <button
                                    type="button"
                                    disabled={!paymentPending}
                                    onClick={handleConfirmPaid}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                        paymentPending
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    <CheckCircle2 size={16} />
                                    Tôi đã thanh toán
                                </button>
                                <div className="text-xs text-gray-500">
                                    Credits chỉ là lớp tạm thời phía frontend. Phí thực tế vẫn trừ từ ví khi tạo bài đăng.
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <div className="grid gap-6">
                            <div className="rounded-2xl border border-gray-200 p-5">
                                <div className="font-semibold text-gray-900 mb-2">Hình ảnh</div>
                                <div className="text-sm text-gray-500 mb-4">
                                    Bạn có thể chọn nhiều ảnh từ máy để đăng (khuyến nghị), hoặc nhập URL ảnh (tuỳ chọn).
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                        <Plus size={16} />
                                        Chọn ảnh từ máy
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => void handlePickImages(e.target.files)}
                                        />
                                    </label>
                                    <div className="text-xs text-gray-500">
                                        Đã chọn: <span className="font-semibold text-gray-800">{selectedImages.length}</span> ảnh
                                    </div>
                                </div>

                                {selectedImages.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                        {selectedImages.map((img, idx) => (
                                            <div key={`${img.name}-${idx}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                                <img
                                                    src={img.dataUrl}
                                                    alt={img.name}
                                                    className="h-24 w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
                                                    }
                                                    className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/75 group-hover:flex"
                                                    title="Xoá ảnh"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-5">
                                    <div className="text-sm font-medium text-gray-700 mb-2">URL ảnh (tuỳ chọn)</div>
                                    <input
                                        value={form.mediaUrls}
                                        onChange={(e) => setForm((p) => ({ ...p, mediaUrls: e.target.value }))}
                                        placeholder="https://.../1.jpg, https://.../2.jpg"
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 p-5">
                                <div className="font-semibold text-gray-900 mb-4">Thông tin xe</div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                            placeholder="VD: Giant XTC 800 2021"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Loại xe</label>
                                        <select
                                            value={form.bikeType}
                                            onChange={(e) => setForm((p) => ({ ...p, bikeType: e.target.value }))}
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
                                        >
                                            {BIKE_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Hãng</label>
                                        <select
                                            value={form.brand}
                                            onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
                                        >
                                            {BRANDS.map((b) => (
                                                <option key={b} value={b}>
                                                    {b}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Model</label>
                                        <input
                                            value={form.model}
                                            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                                            placeholder="Escape 3"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Kích thước khung</label>
                                        <select
                                            value={form.frameSize}
                                            onChange={(e) => setForm((p) => ({ ...p, frameSize: e.target.value }))}
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
                                        >
                                            {FRAME_SIZES.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Tình trạng</label>
                                        <select
                                            value={form.condition}
                                            onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
                                        >
                                            {CONDITIONS.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Năm sản xuất</label>
                                        <input
                                            value={form.year}
                                            onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                                            placeholder="2021"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Giá (VNĐ)</label>
                                        <input
                                            value={form.priceVnd}
                                            onChange={(e) => setForm((p) => ({ ...p, priceVnd: e.target.value }))}
                                            placeholder="12.500.000"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                        <div className="mt-1 text-xs text-gray-500">
                                            Backend dùng điểm (points). Hệ thống đang quy đổi 1 VNĐ = 1 điểm.
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-gray-200 p-4 bg-gray-50">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">Danh mục</div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                Chọn để xe xuất hiện đúng bộ lọc (backend: `categoryIds`).
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => void refreshCategories()}
                                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            Tải danh mục
                                        </button>
                                    </div>

                                    {categoriesError && (
                                        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                            {categoriesError}
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        {categoriesLoading && <div className="text-sm text-gray-500">Đang tải...</div>}
                                        {!categoriesLoading && categories.length === 0 && (
                                            <div className="text-sm text-gray-500">Chưa có danh mục.</div>
                                        )}
                                        {!categoriesLoading && categories.length > 0 && (
                                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                {categories.map((c) => {
                                                    const checked = form.categoryIds.includes(c.id);
                                                    return (
                                                        <label
                                                            key={c.id}
                                                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition ${
                                                                checked
                                                                    ? "border-blue-500 bg-blue-50"
                                                                    : "border-gray-200 bg-white hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(e) => {
                                                                    const on = e.target.checked;
                                                                    setForm((p) => ({
                                                                        ...p,
                                                                        categoryIds: on
                                                                            ? Array.from(new Set([...p.categoryIds, c.id]))
                                                                            : p.categoryIds.filter((id) => id !== c.id),
                                                                    }));
                                                                }}
                                                            />
                                                            <span className="truncate">{c.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Mô tả tình trạng xe, lịch sử sử dụng..."
                                        className="mt-1 w-full min-h-28 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 p-5">
                                <div className="font-semibold text-gray-900 mb-3">Đăng tin & kiểm định</div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Gói bài đăng (backend)</label>
                                        <select
                                            value={form.listingType}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    listingType: e.target.value as "STANDARD" | "VERIFIED",
                                                }))
                                            }
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        >
                                            <option value="STANDARD">STANDARD (phí ít điểm)</option>
                                            <option value="VERIFIED">VERIFIED (tự tạo yêu cầu kiểm định)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Caption bài đăng</label>
                                        <input
                                            value={form.caption}
                                            onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
                                            placeholder="Xe mới 95%, bao test..."
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 text-sm text-gray-600">
                                    Nếu chọn STANDARD, bạn có thể gửi yêu cầu kiểm định thủ công (tuỳ chọn):
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 mt-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Ngày ưu tiên</label>
                                        <input
                                            value={form.preferredDate}
                                            onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                                            placeholder="2026-03-15"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Khung giờ</label>
                                        <input
                                            value={form.preferredTimeSlot}
                                            onChange={(e) => setForm((p) => ({ ...p, preferredTimeSlot: e.target.value }))}
                                            placeholder="Sáng / Chiều / Tối"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                                        <input
                                            value={form.address}
                                            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                                            placeholder="123 Lê Lợi, Q1"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">SĐT liên hệ</label>
                                        <input
                                            value={form.contactPhone}
                                            onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                                            placeholder="0901 234 567"
                                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                                            placeholder="Ghi chú cho kiểm định viên..."
                                            className="mt-1 w-full min-h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreateError(null);
                                            setCreateSuccess(null);
                                        }}
                                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Huỷ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmitCreate}
                                        disabled={createLoading}
                                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {createLoading ? "Đang đăng..." : "Đăng tin"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Browse tab removed */}

                {/* INSPECTION TAB */}
                {tab === "inspection" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="font-semibold text-gray-800 mb-2">Kiểm định</h2>
                        <p className="text-sm text-gray-500">
                            Bạn có thể mở bài đăng và bấm sticker “Đã kiểm định” để xem báo cáo. Với bài STANDARD, bạn có thể nhập thông tin và gửi yêu cầu khi đăng tin.
                        </p>
                    </div>
                )}

                {/* WALLET TAB */}
                {tab === "wallet" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800">Ví & điểm</h2>
                            <button
                                type="button"
                                onClick={() => void refreshWallet()}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Làm mới
                            </button>
                        </div>
                        {walletError && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{walletError}</div>}
                        {walletLoading && <div className="text-sm text-gray-500">Đang tải...</div>}
                        {!walletLoading && wallet && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-gray-200 p-4">
                                    <div className="text-xs text-gray-500">Available points</div>
                                    <div className="text-2xl font-extrabold text-gray-900">
                                        {(wallet?.availablePoints ?? wallet?.data?.availablePoints ?? 0).toLocaleString("vi-VN")}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-gray-200 p-4">
                                    <div className="text-xs text-gray-500">Frozen points</div>
                                    <div className="text-2xl font-extrabold text-gray-900">
                                        {(wallet?.frozenPoints ?? wallet?.data?.frozenPoints ?? 0).toLocaleString("vi-VN")}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bike detail modal */}
            {bikeDetail && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="font-semibold text-gray-900">Chi tiết xe</div>
                            <button
                                type="button"
                                onClick={() => setBikeDetail(null)}
                                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Carousel */}
                            {detailImages.length > 0 && (
                                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                                    <div className="relative">
                                        <img
                                            src={detailCurrent}
                                            alt="Ảnh xe"
                                            className="h-64 w-full object-cover"
                                        />
                                        {detailImages.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDetailIdx((i) =>
                                                            i <= 0 ? detailImages.length - 1 : i - 1
                                                        )
                                                    }
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
                                                    title="Ảnh trước"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDetailIdx((i) =>
                                                            i >= detailImages.length - 1 ? 0 : i + 1
                                                        )
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow"
                                                    title="Ảnh tiếp"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                                                    {detailIdx + 1}/{detailImages.length}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {detailImages.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto p-3">
                                            {detailImages.map((m, idx) => (
                                                <button
                                                    key={`${m.url}-${idx}`}
                                                    type="button"
                                                    onClick={() => setDetailIdx(idx)}
                                                    className={`shrink-0 overflow-hidden rounded-xl border ${
                                                        idx === detailIdx ? "border-blue-500" : "border-gray-200"
                                                    }`}
                                                    title={`Ảnh ${idx + 1}`}
                                                >
                                                    <img
                                                        src={m.url}
                                                        alt={`Thumb ${idx + 1}`}
                                                        className="h-14 w-20 object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-lg font-bold text-gray-900">{bikeDetail.title}</div>
                            <div className="text-sm text-emerald-700 font-semibold">
                                {bikeDetail.pricePoints?.toLocaleString("vi-VN")} điểm
                            </div>
                            <div className="text-sm text-gray-600">{bikeDetail.condition ?? "—"}</div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {(bikeDetail as unknown as { description?: string })?.description ?? ""}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspection report modal */}
            {inspectionOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="font-semibold text-gray-900">Báo cáo kiểm định</div>
                            <button
                                type="button"
                                onClick={() => {
                                    setInspectionOpen(false);
                                    setInspectionDetail(null);
                                }}
                                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-gray-50"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            {inspectionLoading && <div className="text-sm text-gray-500">Đang tải...</div>}
                            {inspectionError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{inspectionError}</div>}
                            {!inspectionLoading && inspectionDetail && (
                                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-[60vh]">
{JSON.stringify(inspectionDetail, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
