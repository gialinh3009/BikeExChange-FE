import { useState, useEffect, useCallback, useMemo } from "react";
import {
    RefreshCw, TrendingUp, FileText, Package, UserCheck,
    ClipboardCheck, Percent, Search, ArrowUpDown, ArrowUp, ArrowDown, X,
} from "lucide-react";
import { getRevenueSummaryAPI } from "../../../services/Admin/revenueService";

const fmtPts = (n: number) =>
    new Intl.NumberFormat("vi-VN").format(Number(n) || 0) + " đ";

const fmtDateTime = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

type Tab = "posting" | "combo" | "upgrade" | "inspection" | "commission";

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
    if (dir === "asc") return <ArrowUp size={12} style={{ marginLeft: 4, flexShrink: 0 }} />;
    if (dir === "desc") return <ArrowDown size={12} style={{ marginLeft: 4, flexShrink: 0 }} />;
    return <ArrowUpDown size={12} style={{ marginLeft: 4, flexShrink: 0, opacity: 0.35 }} />;
}

function useSortable<T>(items: T[]) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

    const toggleSort = (key: keyof T) => {
        if (sortKey === key) {
            if (sortDir === "asc") { setSortDir("desc"); }
            else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
        } else {
            setSortKey(key); setSortDir("asc");
        }
    };

    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return items;
        return [...items].sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            if (av == null) return 1;
            if (bv == null) return -1;
            if (typeof av === "number" && typeof bv === "number")
                return sortDir === "asc" ? av - bv : bv - av;
            return sortDir === "asc"
                ? String(av).localeCompare(String(bv), "vi")
                : String(bv).localeCompare(String(av), "vi");
        });
    }, [items, sortKey, sortDir]);

    const getDir = (key: keyof T): "asc" | "desc" | null => sortKey === key ? sortDir : null;
    return { sorted, toggleSort, getDir };
}

const thStyle: React.CSSProperties = {
    padding: "10px 16px", textAlign: "left", fontSize: 11,
    fontWeight: 700, color: "#64748b", letterSpacing: "0.4px",
    borderBottom: "1px solid #f1f5f9", cursor: "pointer",
    userSelect: "none", whiteSpace: "nowrap",
};
const thNoSort: React.CSSProperties = { ...thStyle, cursor: "default" };
const inputWrap: React.CSSProperties = { position: "relative", flex: "1 1 260px" };
const inputStyle: React.CSSProperties = {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 12px 7px 32px",
    fontSize: 13, color: "#0f172a", background: "white", outline: "none", width: "100%",
};

// ── Generic PointTransaction table ──────────────────────────────────────────
function TxTable({ items, accentColor }: { items: any[]; accentColor: string }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const q = search.trim().toLowerCase();
        return items.filter((w: any) =>
            String(w.id).includes(q) ||
            (w.userFullName ?? "").toLowerCase().includes(q) ||
            (w.userEmail ?? "").toLowerCase().includes(q) ||
            (w.referenceId ?? "").toLowerCase().includes(q) ||
            (w.remarks ?? "").toLowerCase().includes(q)
        );
    }, [items, search]);

    const { sorted, toggleSort, getDir } = useSortable(filtered);

    if (items.length === 0)
        return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Chưa có dữ liệu</div>;

    return (
        <div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={inputWrap}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã GD, tên, email, ghi chú..." style={inputStyle} />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
                {search && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, marginBottom: 0 }}>{filtered.length} / {items.length} kết quả</p>}
            </div>
            {sorted.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Không tìm thấy kết quả</div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={thStyle} onClick={() => toggleSort("id")}><span style={{ display: "inline-flex", alignItems: "center" }}>Mã GD <SortIcon dir={getDir("id")} /></span></th>
                                <th style={thStyle} onClick={() => toggleSort("userFullName")}><span style={{ display: "inline-flex", alignItems: "center" }}>Người dùng <SortIcon dir={getDir("userFullName")} /></span></th>
                                <th style={thStyle} onClick={() => toggleSort("userEmail")}><span style={{ display: "inline-flex", alignItems: "center" }}>Email <SortIcon dir={getDir("userEmail")} /></span></th>
                                <th style={thStyle} onClick={() => toggleSort("amount")}><span style={{ display: "inline-flex", alignItems: "center" }}>Số tiền <SortIcon dir={getDir("amount")} /></span></th>
                                <th style={thNoSort}>Ghi chú</th>
                                <th style={thStyle} onClick={() => toggleSort("createdAt")}><span style={{ display: "inline-flex", alignItems: "center" }}>Thời gian <SortIcon dir={getDir("createdAt")} /></span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((w: any) => (
                                <tr key={w.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>#{w.id}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{w.userFullName ?? "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{w.userEmail ?? "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: accentColor }}>{fmtPts(w.amount)}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{w.remarks ?? "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{fmtDateTime(w.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Inspection table ─────────────────────────────────────────────────────────
const INS_STATUS_LABEL: Record<string, string> = {
    APPROVED: "Đã duyệt", REJECTED: "Từ chối",
    INSPECTED: "Đã kiểm định", IN_PROGRESS: "Đang kiểm định",
    ASSIGNED: "Đã phân công", REQUESTED: "Yêu cầu",
};
const INS_STATUS_COLOR: Record<string, string> = {
    APPROVED: "#10b981", REJECTED: "#ef4444",
    INSPECTED: "#10b981", IN_PROGRESS: "#8b5cf6",
    ASSIGNED: "#3b82f6", REQUESTED: "#f59e0b",
};

function InspectionTable({ items }: { items: any[] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const q = search.trim().toLowerCase();
        return items.filter((i: any) =>
            String(i.id).includes(q) ||
            (i.bikeTitle ?? "").toLowerCase().includes(q) ||
            (i.ownerName ?? "").toLowerCase().includes(q) ||
            (i.inspectorName ?? "").toLowerCase().includes(q)
        );
    }, [items, search]);

    const { sorted, toggleSort, getDir } = useSortable(filtered);

    if (items.length === 0)
        return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Chưa có dữ liệu</div>;

    return (
        <div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={inputWrap}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã YC, tên xe, chủ xe, kiểm định viên..." style={inputStyle} />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
                {search && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, marginBottom: 0 }}>{filtered.length} / {items.length} kết quả</p>}
            </div>
            {sorted.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Không tìm thấy kết quả</div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={thStyle} onClick={() => toggleSort("id")}><span style={{ display: "inline-flex", alignItems: "center" }}>Mã YC <SortIcon dir={getDir("id")} /></span></th>
                                <th style={thNoSort}>Xe đạp</th>
                                <th style={thStyle} onClick={() => toggleSort("ownerName")}><span style={{ display: "inline-flex", alignItems: "center" }}>Chủ xe <SortIcon dir={getDir("ownerName")} /></span></th>
                                <th style={thStyle} onClick={() => toggleSort("inspectorName")}><span style={{ display: "inline-flex", alignItems: "center" }}>Kiểm định viên <SortIcon dir={getDir("inspectorName")} /></span></th>
                                <th style={thStyle} onClick={() => toggleSort("feePoints")}><span style={{ display: "inline-flex", alignItems: "center" }}>Phí thu <SortIcon dir={getDir("feePoints")} /></span></th>
                                <th style={thNoSort}>Trạng thái</th>
                                <th style={thStyle} onClick={() => toggleSort("completedAt")}><span style={{ display: "inline-flex", alignItems: "center" }}>Hoàn thành <SortIcon dir={getDir("completedAt")} /></span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((ins: any) => (
                                <tr key={ins.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>#{ins.id}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{ins.bikeTitle ?? "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{ins.ownerName ?? "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{ins.inspectorName ?? "Chưa phân công"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#8b5cf6" }}>{fmtPts(ins.feePoints)}</td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                            background: `${INS_STATUS_COLOR[ins.status] ?? "#64748b"}18`,
                                            color: INS_STATUS_COLOR[ins.status] ?? "#64748b",
                                        }}>
                                            {INS_STATUS_LABEL[ins.status] ?? ins.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{fmtDateTime(ins.completedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Commission table (parse remarks) ─────────────────────────────────────────
function parseCommissionRemarks(remarks?: string) {
    if (!remarks) return { orderId: null, bikeName: null };
    const orderMatch = remarks.match(/#(\d+)/);
    const bikeMatch = remarks.match(/\(([^)]+)\)/);
    return {
        orderId: orderMatch ? orderMatch[1] : null,
        bikeName: bikeMatch ? bikeMatch[1] : null,
    };
}

function CommissionTable({ items }: { items: any[] }) {
    const [search, setSearch] = useState("");

    const enriched = useMemo(() =>
        items.map((w: any, idx: number) => {
            const { orderId, bikeName } = parseCommissionRemarks(w.remarks);
            return { ...w, _key: w.id ?? `comm-${idx}`, _orderId: orderId, _bikeName: bikeName };
        }), [items]);

    const filtered = useMemo(() => {
        if (!search.trim()) return enriched;
        const q = search.trim().toLowerCase();
        return enriched.filter((w: any) =>
            (w._orderId ?? "").includes(q) ||
            (w._bikeName ?? "").toLowerCase().includes(q) ||
            (w.remarks ?? "").toLowerCase().includes(q)
        );
    }, [enriched, search]);

    const { sorted, toggleSort, getDir } = useSortable(filtered);

    if (items.length === 0)
        return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Chưa có dữ liệu</div>;

    return (
        <div>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={inputWrap}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã đơn, tên xe..." style={inputStyle} />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
                {search && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, marginBottom: 0 }}>{filtered.length} / {items.length} kết quả</p>}
            </div>
            {sorted.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Không tìm thấy kết quả</div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={thStyle} onClick={() => toggleSort("_orderId")}>
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Mã đơn <SortIcon dir={getDir("_orderId")} /></span>
                                </th>
                                <th style={thStyle} onClick={() => toggleSort("_bikeName")}>
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Tên xe <SortIcon dir={getDir("_bikeName")} /></span>
                                </th>
                                <th style={thStyle} onClick={() => toggleSort("amount")}>
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Hoa hồng thu <SortIcon dir={getDir("amount")} /></span>
                                </th>
                                <th style={thStyle} onClick={() => toggleSort("createdAt")}>
                                    <span style={{ display: "inline-flex", alignItems: "center" }}>Thời gian <SortIcon dir={getDir("createdAt")} /></span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((w: any) => (
                                <tr key={w._key} style={{ borderBottom: "1px solid #f8fafc" }}>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>
                                        {w._orderId ? `#${w._orderId}` : "—"}
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                                        {w._bikeName ?? "—"}
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
                                        {fmtPts(w.amount)}
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                                        {fmtDateTime(w.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RevenueSystemPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<Tab>("posting");

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setData(await getRevenueSummaryAPI());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const TABS: { id: Tab; label: string; total: number; count: number; icon: React.ReactNode; color: string; bg: string }[] = data ? [
        { id: "posting",    label: "Phí đăng tin lẻ",       total: data.postingFeesTotal ?? 0,      count: data.postingFeesCount ?? 0,     icon: <FileText size={16} />,      color: "#3b82f6", bg: "#eff6ff" },
        { id: "combo",      label: "Phí mua gói Combo",      total: data.comboFeesTotal ?? 0,        count: data.comboFeesCount ?? 0,       icon: <Package size={16} />,       color: "#0ea5e9", bg: "#f0f9ff" },
        { id: "upgrade",    label: "Phí nâng cấp tài khoản", total: data.upgradeFeesTotal ?? 0,      count: data.upgradeFeesCount ?? 0,     icon: <UserCheck size={16} />,     color: "#10b981", bg: "#f0fdf4" },
        { id: "inspection", label: "Phí kiểm định xe",       total: data.inspectionFeesTotal ?? 0,   count: data.inspectionFeesCount ?? 0,  icon: <ClipboardCheck size={16} />, color: "#8b5cf6", bg: "#f5f3ff" },
        { id: "commission", label: "Hoa hồng bán xe",        total: data.orderCommissionTotal ?? 0,  count: data.orderCommissionCount ?? 0, icon: <Percent size={16} />,        color: "#f59e0b", bg: "#fffbeb" },
    ] : [];

    const activeTab = TABS.find(t => t.id === tab);

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Inter', sans-serif", padding: "28px 24px 64px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <TrendingUp size={20} color="#10b981" />
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Doanh thu hệ thống</h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Tổng tiền hệ thống đã thu được từ người dùng theo từng loại</p>
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
                    {/* Total revenue card */}
                    <div style={{
                        background: "linear-gradient(135deg, #059669, #10b981)",
                        borderRadius: 18, padding: "24px 28px", marginBottom: 20,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        boxShadow: "0 4px 24px rgba(16,185,129,.3)",
                    }}>
                        <div>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
                                Tổng doanh thu hệ thống
                            </p>
                            <p style={{ fontSize: 32, fontWeight: 800, color: "white", margin: 0 }}>
                                {fmtPts(data.totalRevenue ?? 0)}
                            </p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 6 }}>
                                Đăng tin + Combo + Nâng cấp + Kiểm định + Hoa hồng
                            </p>
                        </div>
                        <TrendingUp size={48} color="rgba(255,255,255,.2)" />
                    </div>

                    {/* 5 summary cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                style={{
                                    background: tab === t.id ? t.bg : "white",
                                    borderRadius: 14,
                                    border: `1.5px solid ${tab === t.id ? t.color : "#e2e8f0"}`,
                                    padding: "14px 16px", textAlign: "left", cursor: "pointer",
                                    boxShadow: tab === t.id ? `0 0 0 3px ${t.color}22` : "none",
                                    transition: "all .15s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: t.color }}>
                                        {t.icon}
                                    </div>
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 6px", lineHeight: 1.4 }}>{t.label}</p>
                                <p style={{ fontSize: 17, fontWeight: 800, color: t.color, margin: "0 0 2px" }}>{fmtPts(t.total)}</p>
                                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{t.count} giao dịch</p>
                            </button>
                        ))}
                    </div>

                    {/* Detail table */}
                    <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${activeTab?.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: activeTab?.color }}>
                                {activeTab?.icon}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                                Chi tiết — {activeTab?.label}
                            </span>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                ({activeTab?.count} giao dịch · {fmtPts(activeTab?.total ?? 0)})
                            </span>
                        </div>

                        {tab === "posting"    && <TxTable items={data.postingFeeDetails ?? []}    accentColor="#3b82f6" />}
                        {tab === "combo"      && <TxTable items={data.comboFeeDetails ?? []}      accentColor="#0ea5e9" />}
                        {tab === "upgrade"    && <TxTable items={data.upgradeFeeDetails ?? []}    accentColor="#10b981" />}
                        {tab === "inspection" && <InspectionTable items={data.inspectionFeeDetails ?? []} />}
                        {tab === "commission" && <CommissionTable items={data.commissionDetails ?? []} />}
                    </div>
                </>
            )}
        </div>
    );
}
