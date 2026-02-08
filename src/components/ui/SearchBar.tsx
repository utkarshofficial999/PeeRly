'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onFilterClick?: () => void
    showFilters?: boolean
}

export default function SearchBar({
    value,
    onChange,
    placeholder = 'Search for textbooks, electronics, cycles...',
    onFilterClick,
    showFilters = true,
}: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <div
            className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 overflow-hidden ${isFocused
                ? 'bg-white border-primary-500 ring-4 ring-primary-500/10 shadow-premium -translate-y-1'
                : 'bg-white border-surface-100 hover:border-primary-200 shadow-soft'
                } border`}
        >
            <Search className={`w-5 h-5 transition-colors duration-500 ${isFocused ? 'text-primary-600' : 'text-surface-600'}`} />

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 bg-transparent text-surface-900 placeholder-surface-500 outline-none font-bold"
            />

            {value && (
                <button
                    onClick={() => onChange('')}
                    className="p-1.5 text-surface-500 hover:text-peach-500 rounded-xl hover:bg-peach-50 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {showFilters && onFilterClick && (
                <button
                    onClick={onFilterClick}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-black text-surface-900 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all border border-surface-100"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline tracking-tighter uppercase">Filters</span>
                </button>
            )}
        </div>
    )
}
