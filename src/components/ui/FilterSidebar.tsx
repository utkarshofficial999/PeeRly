'use client'

import { X } from 'lucide-react'
import { CONDITIONS } from '@/lib/utils'

interface FilterSidebarProps {
    isOpen: boolean
    onClose: () => void
    filters: {
        category: string
        condition: string
        priceMin: string
        priceMax: string
        college: string
    }
    onFilterChange: (key: string, value: string) => void
    onClear: () => void
    categories: { id: number; name: string; slug: string }[]
    colleges: { id: string; name: string; slug: string }[]
}

export default function FilterSidebar({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClear,
    categories,
    colleges,
}: FilterSidebarProps) {
    const hasActiveFilters = Object.values(filters).some(v => v !== '')

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-500"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 right-0 lg:right-auto h-screen lg:h-auto w-80 lg:w-72 
          bg-white lg:bg-transparent border-l lg:border-0 border-surface-100 
          p-8 lg:p-0 z-50 lg:z-auto transform transition-all duration-500 ease-out
          ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full lg:translate-x-0'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-display font-black text-surface-900 tracking-tight">Refine <span className="text-primary-600">Feed</span></h2>
                    <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                            <button
                                onClick={onClear}
                                className="text-xs font-black text-primary-500 hover:text-primary-700 uppercase tracking-widest transition-all"
                            >
                                Reset
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 text-surface-400 hover:text-surface-900 rounded-xl hover:bg-surface-50 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Category Filter */}
                    <div>
                        <label className="block text-xs font-black text-surface-400 uppercase tracking-[0.2em] mb-4">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => onFilterChange('category', e.target.value)}
                            className="w-full bg-white border border-surface-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-surface-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-soft"
                        >
                            <option value="" className="text-surface-400">All Catalogues</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Condition Filter */}
                    <div>
                        <label className="block text-xs font-black text-surface-400 uppercase tracking-[0.2em] mb-4">Quality State</label>
                        <div className="space-y-3">
                            {Object.entries(CONDITIONS).map(([key, { label }]) => (
                                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="radio"
                                            name="condition"
                                            value={key}
                                            checked={filters.condition === key}
                                            onChange={(e) => onFilterChange('condition', e.target.value)}
                                            className="peer appearance-none w-5 h-5 rounded-lg border-2 border-surface-200 checked:border-primary-500 checked:bg-primary-500 transition-all cursor-pointer"
                                        />
                                        <div className="absolute w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-sm font-bold text-surface-600 group-hover:text-primary-600 transition-colors">
                                        {label}
                                    </span>
                                </label>
                            ))}
                            {filters.condition && (
                                <button
                                    onClick={() => onFilterChange('condition', '')}
                                    className="text-[10px] font-black text-peach-500 hover:text-peach-700 uppercase tracking-widest mt-2"
                                >
                                    Clear quality
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-xs font-black text-surface-400 uppercase tracking-[0.2em] mb-4">Price Spectrum</label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.priceMin}
                                    onChange={(e) => onFilterChange('priceMin', e.target.value)}
                                    className="w-full bg-white border border-surface-100 pl-8 pr-4 py-3 rounded-2xl text-sm font-bold text-surface-900 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-soft"
                                    min="0"
                                />
                            </div>
                            <div className="w-2 h-0.5 bg-surface-100 rounded-full" />
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.priceMax}
                                    onChange={(e) => onFilterChange('priceMax', e.target.value)}
                                    className="w-full bg-white border border-surface-100 pl-8 pr-4 py-3 rounded-2xl text-sm font-bold text-surface-900 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-soft"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* College Filter */}
                    {colleges.length > 1 && (
                        <div>
                            <label className="block text-xs font-black text-surface-400 uppercase tracking-[0.2em] mb-4">Territory</label>
                            <select
                                value={filters.college}
                                onChange={(e) => onFilterChange('college', e.target.value)}
                                className="w-full bg-white border border-surface-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-surface-900 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-soft"
                            >
                                <option value="" className="text-surface-400">Regional Overview</option>
                                {colleges.map((college) => (
                                    <option key={college.id} value={college.slug}>{college.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Apply Button (Mobile) */}
                <div className="lg:hidden mt-12 pb-10">
                    <button onClick={onClose} className="btn-primary w-full py-4 rounded-2xl shadow-button">
                        Apply Adjustments
                    </button>
                </div>
            </aside>
        </>
    )
}
