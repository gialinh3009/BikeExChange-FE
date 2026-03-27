import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, ShoppingCart, ArrowDownLeft, ClipboardCheck, Lock, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { getSystemWalletSummaryAPI } from "../../../services/Admin/systemWalletService";

const fmtPts = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Number(n) || 0) + " đ";

const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const ESCROW_STATUS_LABEL: Record<string, string> = {
    ESCROWED: "Chờ seller xác nhận",
    ACCEPTED: "Seller đã xác nhận",
    SHIPPED: "Đang vận chuyển",
    DELIVERED: "Đã giao hàng",
    RETURN_REQUESTED: "Yêu cầu hoàn hàng",
    DISPUTED: "Đang tranh chấp",
};

const INSPECTION_STATUS_LABEL: Record<string, string> = {
    REQUESTED: "Yêu cầu",
    ASSIGNED: "Đã phân công",
    IN_PROGRESS: "Đang kiểm định",
    INSPECTED: "Đã kiểm định",
};

const INSPECTION_STATUS_COLOR: Record<string, string> = {
    REQUESTED: "#f59e0b",
    ASSIGNED: "#3b82f6",
    IN_PROGRESS: "#8b5cf6",
    INSPECTED: "#10b981",
};

const ESCROW_STATUS_COLOR: Record<string, string> = {
    ESCROWED: "#3b82f6",
    ACCEPTED: "#8b5cf6",
    SHIPPED: "#0ea5e9",
    DELIVERED: "#f59e0b",
    RETURN_REQUESTED: "#f59e0b",
    DISPUTED: "#ef4444",
};

type Tab = "escrow" | "withdrawals" | "inspections";
type SortDir = "asc" | "desc" | null;

function SortIcon({ dir }: { dir: SortDir }) {
    if (dir === "asc") return <ArrowUp size={12} style={{ marginLeft: 4, flexShrink: 0 }} />;
    if (dir === "desc") return <ArrowDown size={12} style={{ marginLeft: 4, flexShrink: 0 }} />;
    return <ArrowUpDown size={12} style={{ marginLeft: 4, flexShrink: 0, opacity: 0.35 }} />;
}

function useSortable<T>(items: T[]) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const toggleSort = (key: keyof T) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
            if (sortDir === "desc") setSortKey(null);
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return items;
        return [...items].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (av == null) return 1;
            if (bv == null) return -1;
            if (typeof av === "number" && typeof bv === "number")
                return sortDir === "asc" ? av - bv : bv - av;
            return sortDir === "asc"
                ? String(av).localeCompare(String(bv), "vi")
                : String(bv).localeCompare(String(av), "vi");
        });
    }, [items, sortKey, sortDir]);

    const getSortDir = (key: keyof T): SortDir => sortKey === key ? sortDir : null;

    return { sorted, toggleSort, getSortDir };
}

const thStyle: React.CSSProperties = {
    padding: "10px 16px", textAlign: "left", fontSize: 11,
    fontWeight: 700, color: "#64748b", letterSpacing: "0.4px",
    borderBottom: "1px solid #f1f5f9", cursor: "pointer",
    userSelect: "none", whiteSpace: "nowrap",
};

const filterInputStyle: React.CSSProperties = {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px 7px 32px",
    fontSize: 13, color: "#0f172a", background: "white", outline: "none", width: "100%",
};

const selectStyle: React.CSSProperties = {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px",
    fontSize: 13, color: "#0f172a", background: "white", outline: "none", cursor: "pointer",
};

export default function SystemWalletPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<Tab>("escrow");

    // Escrow filters
    const [escrowSearch, setEscrowSearch] = useState("");
    const [escrowStatus, setEscrowStatus] = useState("ALL");

    // Withdrawal filters
    const [wdSearch, setWdSearch] = useState("");

    // Inspection filters
    const [insSearch, setInsSearch] = useState("");
    const [insStatus, setInsStatus] = useState("ALL");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getSystemWalletSummaryAPI();
            setData(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Filtered lists ──────────────────────────────────────────────
    const filteredEscrow = useMemo(() => {
        if (!data) return [];
        let list = data.escrowOrders ?? [];
        if (escrowStatus !== "ALL") list = list.filter((o: any) => o.status === escrowStatus);
        if (escrowSearch.trim()) {
            const q = escrowSearch.trim().toLowerCase();
            list = list.filter((o: any) =>
                String(o.id).includes(q) ||
                (o.bikeTitle ?? "").toLowerCase().includes(q) ||
                (o.buyerName ?? "").toLowerCase().includes(q) ||
                (o.sellerName ?? "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [data, escrowSearch, escrowStatus]);

    const filteredWithdrawals = useMemo(() => {
        if (!data) return [];
        let list = data.pendingWithdrawals ?? [];
        if (wdSearch.trim()) {
            const q = wdSearch.trim().toLowerCase();
            list = list.filter((w: any) =>
                String(w.id).includes(q) ||
                (w.userFullName ?? "").toLowerCase().includes(q) ||
                (w.userEmail ?? "").toLowerCase().includes(q) ||
                (w.referenceId ?? "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [data, wdSearch]);

    const filteredInspections = useMemo(() => {
        if (!data) return [];
        let list = data.activeInspections ?? [];
        if (insStatus !== "ALL") list = list.filter((i: any) => i.status === insStatus);
        if (insSearch.trim()) {
            const q = insSearch.trim().toLowerCase();
            list = list.filter((i: any) =>
                String(i.id).includes(q) ||
                (i.bike?.title ?? "").toLowerCase().includes(q) ||
                (i.inspector?.fullName ?? "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [data, insSearch, insStatus]);

    // ── Sortable hooks ──────────────────────────────────────────────
    const escrowSort = useSortable(filteredEscrow);
    const wdSort = useSortable(filteredWithdrawals);
    const insSort = useSortable(filteredInspections);

    // ── Summary cards ───────────────────────────────────────────────
    const TABS = data ? [
        { id: "escrow" as Tab, label: "Đơn mua xe (Escrow)", count: data.escrowOrdersCount ?? 0, amount: data.totalEscrowPoints ?? 0, icon: <ShoppingCart size={16} />, color: "#3b82f6" },
        { id: "withdrawals" as Tab, label: "Yêu cầu rút tiền", count: data.pendingWithdrawalsCount ?? 0, amount: data.totalPendingWithdrawalPoints ?? 0, icon: <ArrowDownLeft size={16} />, color: "#f59e0b" },
        { id: "inspections" as Tab, label: "Phí kiểm định", count: data.activeInspectionsCount ?? 0, amount: data.totalInspectionFeePoints ?? 0, icon: <ClipboardCheck size={16} />, color: "#8b5cf6" },
    ] : [];

    const totalFrozen = data
        ? (data.totalEscrowPoints ?? 0) + (data.totalPendingWithdrawalPoints ?? 0) + (data.totalInspectionFeePoints ?? 0)
        : 0;

    const currentFilteredCount = tab === "escrow" ? filteredEscrow.length : tab === "withdrawals" ? filteredWithdrawals.length : filteredInspections.length;
    const currentTotalCount = TABS.find(t => t.id === tab)?.count ?? 0;

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Inter', sans-serif", padding: "28px 24px 64px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <Lock size={20} color="#6366f1" />
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Ví hệ thống</h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Tổng tiền đang bị đóng băng trong hệ thống theo từng loại</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                        background: "white", border: "1.5px solid #e2e8f0", borderRadius: 10,
                        fontSize: 13, fontWeight: 600, color: "#475569", cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
                    Làm mới
                </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Error */}
            {error && (
                <div style={{ background: "#fef2f2", border: "1.5px solid #fecdd3", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#ef4444", fontWeight: 600, fontSize: 14 }}>
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && !data && (
                <div style={{ background: "white", borderRadius: 16, padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    Đang tải dữ liệu...
                </div>
            )}

            {data && (
                <>
                    {/* Total frozen card */}
                    <div style={{
                        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                        borderRadius: 18, padding: "24px 28px", marginBottom: 20,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        boxShadow: "0 4px 24px rgba(99,102,241,.3)",
                    }}>
                        <div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                                Tổng tiền đang đóng băng
                            </p>
                            <p style={{ fontSize: 32, fontWeight: 800, color: "white", margin: 0 }}>
                                {fmtPts(totalFrozen)}
                            </p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 6 }}>
                                Escrow + Rút tiền chờ duyệt + Phí kiểm định
                            </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <Lock size={40} color="rgba(255,255,255,.15)" />
                        </div>
                    </div>

                    {/* 3 summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    background: "white", borderRadius: 14,
                                    border: `1.5px solid ${tab === t.id ? t.color : "#e2e8f0"}`,
                                    padding: "16px 18px", textAlign: "left", cursor: "pointer",
                                    boxShadow: tab === t.id ? `0 0 0 3px ${t.color}22` : "none",
                                    transition: "all .15s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: t.color }}>
                                        {t.icon}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{t.label}</span>
                                </div>
                                <p style={{ fontSize: 20, fontWeight: 800, color: t.color, margin: "0 0 4px" }}>{fmtPts(t.amount)}</p>
                                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{t.count} đơn đang giữ</p>
                            </button>
                        ))}
                    </div>

                    {/* Detail table */}
                    <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
                        {/* Table header + filter bar */}
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                                    Chi tiết — {TABS.find(t => t.id === tab)?.label}
                                </span>
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                    ({currentFilteredCount === currentTotalCount
                                        ? `${currentTotalCount} mục`
                                        : `${currentFilteredCount} / ${currentTotalCount} mục`})
                                </span>
                            </div>

                            {/* Filter bar – Escrow */}
                            {tab === "escrow" && (
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ position: "relative", flex: "1 1 220px" }}>
                                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                        <input
                                            value={escrowSearch}
                                            onChange={e => setEscrowSearch(e.target.value)}
                                            placeholder="Tìm mã đơn, tên xe, buyer, seller..."
                                            style={filterInputStyle}
                                        />
                                        {escrowSearch && (
                                            <button onClick={() => setEscrowSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <select value={escrowStatus} onChange={e => setEscrowStatus(e.target.value)} style={selectStyle}>
                                        <option value="ALL">Tất cả trạng thái</option>
                                        {Object.entries(ESCROW_STATUS_LABEL).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                    {(escrowSearch || escrowStatus !== "ALL") && (
                                        <button onClick={() => { setEscrowSearch(""); setEscrowStatus("ALL"); }} style={{ ...selectStyle, color: "#ef4444", borderColor: "#fecdd3", background: "#fef2f2" }}>
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Filter bar – Withdrawals */}
                            {tab === "withdrawals" && (
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ position: "relative", flex: "1 1 280px" }}>
                                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                        <input
                                            value={wdSearch}
                                            onChange={e => setWdSearch(e.target.value)}
                                            placeholder="Tìm mã GD, tên người dùng, email, mã tham chiếu..."
                                            style={filterInputStyle}
                                        />
                                        {wdSearch && (
                                            <button onClick={() => setWdSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Filter bar – Inspections */}
                            {tab === "inspections" && (
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ position: "relative", flex: "1 1 220px" }}>
                                        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                                        <input
                                            value={insSearch}
                                            onChange={e => setInsSearch(e.target.value)}
                                            placeholder="Tìm mã YC, tên xe, kiểm định viên..."
                                            style={filterInputStyle}
                                        />
                                        {insSearch && (
                                            <button onClick={() => setInsSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <select value={insStatus} onChange={e => setInsStatus(e.target.value)} style={selectStyle}>
                                        <option value="ALL">Tất cả trạng thái</option>
                                        {Object.entries(INSPECTION_STATUS_LABEL).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                    {(insSearch || insStatus !== "ALL") && (
                                        <button onClick={() => { setInsSearch(""); setInsStatus("ALL"); }} style={{ ...selectStyle, color: "#ef4444", borderColor: "#fecdd3", background: "#fef2f2" }}>
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ESCROW ORDERS TABLE */}
                        {tab === "escrow" && (
                            <div style={{ overflowX: "auto" }}>
                                {escrowSort.sorted.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Không có đơn nào phù hợp</div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                                <th style={thStyle} onClick={() => escrowSort.toggleSort("id")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Mã đơn <SortIcon dir={escrowSort.getSortDir("id")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => escrowSort.toggleSort("bikeTitle")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Xe đạp <SortIcon dir={escrowSort.getSortDir("bikeTitle")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => escrowSort.toggleSort("buyerName")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Người mua <SortIcon dir={escrowSort.getSortDir("buyerName")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => escrowSort.toggleSort("sellerName")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Người bán <SortIcon dir={escrowSort.getSortDir("sellerName")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => escrowSort.toggleSort("amountPoints")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Số tiền giữ <SortIcon dir={escrowSort.getSortDir("amountPoints")} /></span>
                                                </th>
                                                <th style={{ ...thStyle, cursor: "default" }}>Trạng thái</th>
                                                <th style={thStyle} onClick={() => escrowSort.toggleSort("createdAt")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Ngày tạo <SortIcon dir={escrowSort.getSortDir("createdAt")} /></span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {escrowSort.sorted.map((o: any) => (
                                                <tr key={o.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>#{o.id}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{o.bikeTitle}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{o.buyerName}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{o.sellerName}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>{fmtPts(o.amountPoints)}</td>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                                            background: `${ESCROW_STATUS_COLOR[o.status] ?? "#64748b"}18`,
                                                            color: ESCROW_STATUS_COLOR[o.status] ?? "#64748b",
                                                        }}>
                                                            {ESCROW_STATUS_LABEL[o.status] ?? o.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{fmtDateTime(o.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* PENDING WITHDRAWALS TABLE */}
                        {tab === "withdrawals" && (
                            <div style={{ overflowX: "auto" }}>
                                {wdSort.sorted.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Không có yêu cầu rút tiền nào phù hợp</div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                                <th style={thStyle} onClick={() => wdSort.toggleSort("id")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Mã GD <SortIcon dir={wdSort.getSortDir("id")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => wdSort.toggleSort("userFullName")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Người dùng <SortIcon dir={wdSort.getSortDir("userFullName")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => wdSort.toggleSort("userEmail")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Email <SortIcon dir={wdSort.getSortDir("userEmail")} /></span>
                                                </th>
                                                <th style={thStyle} onClick={() => wdSort.toggleSort("amount")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Số tiền <SortIcon dir={wdSort.getSortDir("amount")} /></span>
                                                </th>
                                                <th style={{ ...thStyle, cursor: "default" }}>Mã tham chiếu</th>
                                                <th style={thStyle} onClick={() => wdSort.toggleSort("createdAt")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Ngày yêu cầu <SortIcon dir={wdSort.getSortDir("createdAt")} /></span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wdSort.sorted.map((w: any) => (
                                                <tr key={w.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>#{w.id}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{w.userFullName ?? "—"}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{w.userEmail ?? "—"}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{fmtPts(w.amount)}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{w.referenceId ?? "—"}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{fmtDateTime(w.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* ACTIVE INSPECTIONS TABLE */}
                        {tab === "inspections" && (
                            <div style={{ overflowX: "auto" }}>
                                {insSort.sorted.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Không có yêu cầu kiểm định nào phù hợp</div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                                <th style={thStyle} onClick={() => insSort.toggleSort("id")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Mã YC <SortIcon dir={insSort.getSortDir("id")} /></span>
                                                </th>
                                                <th style={{ ...thStyle, cursor: "default" }}>Xe đạp</th>
                                                <th style={{ ...thStyle, cursor: "default" }}>Kiểm định viên</th>
                                                <th style={thStyle} onClick={() => insSort.toggleSort("feePoints")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Phí giữ <SortIcon dir={insSort.getSortDir("feePoints")} /></span>
                                                </th>
                                                <th style={{ ...thStyle, cursor: "default" }}>Trạng thái</th>
                                                <th style={thStyle} onClick={() => insSort.toggleSort("createdAt")}>
                                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Ngày tạo <SortIcon dir={insSort.getSortDir("createdAt")} /></span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {insSort.sorted.map((ins: any) => (
                                                <tr key={ins.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>#{ins.id}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{ins.bike?.title ?? "—"}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{ins.inspector?.fullName ?? "Chưa phân công"}</td>
                                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#8b5cf6" }}>{fmtPts(ins.feePoints)}</td>
                                                    <td style={{ padding: "12px 16px" }}>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                                            background: `${INSPECTION_STATUS_COLOR[ins.status] ?? "#64748b"}18`,
                                                            color: INSPECTION_STATUS_COLOR[ins.status] ?? "#64748b",
                                                        }}>
                                                            {INSPECTION_STATUS_LABEL[ins.status] ?? ins.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{fmtDateTime(ins.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
