'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/ui/SearchBar'
import FilterSidebar from '@/components/ui/FilterSidebar'
import ListingCard from '@/components/cards/ListingCard'
import { Grid3X3, List, ChevronDown, Loader2, AlertCircle } from 'lucide-react'

interface Listing {
    id: string
    title: string
    price: number
    condition: any
    images: string[]
    created_at: string
    views_count: number
    seller?: { full_name: string; avatar_url: string }
    college?: { name: string }
}

interface Props {
    initialListings: Listing[]
    categories: any[]
    colleges: any[]
    totalCount: number
    categoryFromUrl: string
    serverError: string | null
}

const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
]

export default function BrowseClient({
    initialListings,
    categories,
    colleges,
    totalCount: initialTotal,
    categoryFromUrl,
    serverError
}: Props) {
    // State initialized with SERVER data - never empty on first render
    const [listings, setListings] = useState<Listing[]>(initialListings)
    const [totalCount, setTotalCount] = useState(initialTotal)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(serverError)
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('newest')
    const [hasMore, setHasMore] = useState(initialTotal > 20)
    const [offset, setOffset] = useState(20)

    const [filters, setFilters] = useState({
        category: categoryFromUrl,
        condition: '',
        priceMin: '',
        priceMax: '',
        college: '',
    })

    const abortControllerRef = useRef<AbortController | null>(null)
    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => setSearchQuery(searchInput), 500)
        return () => clearTimeout(timeoutId)
    }, [searchInput])

    // GUARANTEED fetch with timeout protection
    const fetchListings = useCallback(async (loadMore = false) => {
        // Cancel previous
        if (abortControllerRef.current) abortControllerRef.current.abort()
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)

        const controller = new AbortController()
        abortControllerRef.current = controller

        const currentOffset = loadMore ? offset : 0

        if (loadMore) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
            setError(null)
        }

        // HARD TIMEOUT - guarantees loading state resolves
        const timeoutId = setTimeout(() => {
            controller.abort()
            setError('Request timed out after 10 seconds. Please check your connection.')
            setIsLoading(false)
            setIsLoadingMore(false)
        }, 10000)

        fetchTimeoutRef.current = timeoutId

        try {
            const params = new URLSearchParams()
            if (filters.category) params.set('category', filters.category)
            if (filters.condition) params.set('condition', filters.condition)
            if (filters.priceMin) params.set('priceMin', filters.priceMin)
            if (filters.priceMax) params.set('priceMax', filters.priceMax)
            if (filters.college) params.set('college', filters.college)
            if (searchQuery) params.set('search', searchQuery)
            params.set('sortBy', sortBy)
            params.set('offset', currentOffset.toString())
            params.set('limit', '20')

            const response = await fetch(`/api/listings?${params.toString()}`, {
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const result = await response.json()

            if (result.error) {
                throw new Error(result.error)
            }

            if (loadMore) {
                setListings(prev => [...prev, ...(result.data || [])])
                setOffset(currentOffset + 20)
            } else {
                setListings(result.data || [])
                setOffset(20)
            }

            setTotalCount(result.count || 0)
            setHasMore(result.hasMore || false)

        } catch (err: any) {
            if (err.name === 'AbortError') return
            setError(err.message || 'Failed to load listings')
            if (!loadMore) setListings([])
        } finally {
            clearTimeout(timeoutId)
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [filters, searchQuery, sortBy, offset])

    // Trigger fetch ONLY when filters change
    useEffect(() => {
        setOffset(0)
        fetchListings(false)

        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort()
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchQuery, sortBy])

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({ category: '', condition: '', priceMin: '', priceMax: '', college: '' })
        setSearchInput('')
        setSearchQuery('')
    }

    return (
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-28 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-display font-bold text-white mb-2">
                            Browse Listings
                        </h1>
                        <p className="text-dark-400">
                            Discover great deals from students at your campus
                        </p>
                    </div>

                    <div className="mb-6">
                        <SearchBar
                            value={searchInput}
                            onChange={setSearchInput}
                            onFilterClick={() => setIsFilterOpen(true)}
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <p className="text-sm text-dark-400">
                            {isLoading ? (
                                'Loading...'
                            ) : (
                                <>
                                    Showing <span className="text-white font-medium">{listings.length}</span> of{' '}
                                    <span className="text-white font-medium">{totalCount}</span> results
                                </>
                            )}
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm text-white cursor-pointer hover:border-white/20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value} className="bg-dark-800">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
                            </div>

                            <div className="flex items-center rounded-xl overflow-hidden border border-white/10">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 transition-colors ${viewMode === 'grid'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white/5 text-dark-400 hover:text-white'
                                        }`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 transition-colors ${viewMode === 'list'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white/5 text-dark-400 hover:text-white'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        <FilterSidebar
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClear={clearFilters}
                            categories={categories}
                            colleges={colleges}
                        />

                        <div className="flex-1">
                            {/* LOADING: Only shown during filter changes, not initial load */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                                    <p className="text-dark-400">Fetching listings...</p>
                                </div>
                            ) : error ? (
                                /* ERROR: Always resolves after timeout */
                                <div className="glass-card p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
                                    <p className="text-red-400 mb-6">{error}</p>
                                    <button onClick={() => fetchListings(false)} className="btn-primary">
                                        Try Again
                                    </button>
                                </div>
                            ) : listings.length > 0 ? (
                                /* DATA: Server-rendered on first load, filtered data after */
                                <>
                                    <div className={`grid gap-4 ${viewMode === 'grid'
                                        ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                        : 'grid-cols-1'
                                        }`}>
                                        {listings.map((listing) => (
                                            <ListingCard
                                                key={listing.id}
                                                id={listing.id}
                                                title={listing.title}
                                                price={listing.price}
                                                condition={listing.condition}
                                                images={listing.images}
                                                sellerName={listing.seller?.full_name || 'Student'}
                                                sellerAvatar={listing.seller?.avatar_url}
                                                collegeName={listing.college?.name}
                                                viewsCount={listing.views_count}
                                                createdAt={listing.created_at}
                                                onSave={() => console.log('Save', listing.id)}
                                            />
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="mt-8 text-center">
                                            <button
                                                onClick={() => fetchListings(true)}
                                                disabled={isLoadingMore}
                                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoadingMore ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Loading...
                                                    </span>
                                                ) : (
                                                    'Load More Listings'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* EMPTY: Only shown after loading completes with 0 results */
                                <div className="glass-card p-12 text-center">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
                                    <p className="text-dark-400 mb-6">
                                        Try adjusting your filters or search query
                                    </p>
                                    <button onClick={clearFilters} className="btn-secondary">
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
