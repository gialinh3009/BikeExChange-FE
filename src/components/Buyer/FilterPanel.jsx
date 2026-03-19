/**
 * FilterPanel.jsx
 * Bộ lọc xe: tìm kiếm, loại xe, thương hiệu, giá, năm sản xuất, sắp xếp
 */
import React, { useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, Search, ShieldCheck, X } from "lucide-react";

export const SORTS = [
  { label: "Mới nhất",         value: "newest"    },
  { label: "Cũ nhất",          value: "oldest"    },
  { label: "Giá thấp đến cao", value: "price_asc" },
  { label: "Giá cao đến thấp", value: "price_desc"},
];

// ─── FilterChip — active filter badge with remove button ─────────────────────
export function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-xl text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900">
        <X size={11} />
      </button>
    </span>
  );
}

// ─── FilterPanel — main filter UI ────────────────────────────────────────────
export default function FilterPanel({
  filterForm, setFilterForm,
  categories, brands,
  sortBy, setSortBy,
  onApply, onClear,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-8">

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm xe đạp, thương hiệu..."
            value={filterForm.keyword}
            onChange={e => setFilterForm(f => ({ ...f, keyword: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && onApply()}
            className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
          />
          {filterForm.keyword && (
            <button
              onClick={() => setFilterForm(f => ({ ...f, keyword: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Loại xe</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterForm(f => ({ ...f, categoryId: "" }))}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              !filterForm.categoryId
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => setFilterForm(f => ({ ...f, categoryId: String(cat.id) }))}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filterForm.categoryId === String(cat.id)
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => setFilterForm(f => ({ ...f, inspectedOnly: !f.inspectedOnly }))}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
              filterForm.inspectedOnly
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200 ring-2 ring-emerald-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
            }`}
          >
            <ShieldCheck size={14} />
            Xe đã kiểm định chất lượng
          </button>
        </div>
      </div>

      {/* Brand + Price + Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Thương hiệu</label>
          <div className="relative">
            <select
              value={filterForm.brandId}
              onChange={e => setFilterForm(f => ({ ...f, brandId: e.target.value }))}
              className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer pr-8"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Giá từ (VND)</label>
          <input
            type="number" min="0" placeholder="0"
            value={filterForm.priceMin}
            onChange={e => setFilterForm(f => ({ ...f, priceMin: e.target.value }))}
            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Giá đến (VND)</label>
          <input
            type="number" min="0" placeholder="Không giới hạn"
            value={filterForm.priceMax}
            onChange={e => setFilterForm(f => ({ ...f, priceMax: e.target.value }))}
            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Năm sản xuất (từ)</label>
          <input
            type="number" min="2000" max={new Date().getFullYear()} placeholder="Ví dụ: 2020"
            value={filterForm.minYear}
            onChange={e => setFilterForm(f => ({ ...f, minYear: e.target.value }))}
            className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <X size={14} /> Xóa bộ lọc
        </button>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none border border-gray-200 bg-gray-50 rounded-xl pl-3 pr-8 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-all cursor-pointer"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Search size={14} /> Áp dụng bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}
