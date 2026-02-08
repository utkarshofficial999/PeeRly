'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/ui/SearchBar'
import FilterSidebar from '@/components/ui/FilterSidebar'
import ListingCard from '@/components/cards/ListingCard'
import { Grid3X3, List, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
]

export default function BrowseContent() {
    const searchParams = useSearchParams()
    const categoryFromUrl = searchParams?.get('category') || ''

    const supabase = useMemo(() => createClient(), [])

    const [listings, setListings] = useState<Listing[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [colleges, setColleges] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('newest')
    const [hasMore, setHasMore] = useState(false)
    const [offset, setOffset] = useState(0)

    const [filters, setFilters] = useState({
        category: categoryFromUrl,
        condition: '',
        priceMin: '',
        priceMax: '',
        college: '',
    })

    const initialLoadRef = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMountedRef = useRef(true)

    // Handle mount/unmount
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // Load categories and colleges once on mount
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [catResult, colResult] = await Promise.all([
                    supabase.from('categories').select('*').order('name'),
                    supabase.from('colleges').select('*').order('name'),
                ])
                setCategories(catResult.data || [])
                setColleges(colResult.data || [])
            } catch (err) {
                console.error('Failed to load metadata:', err)
            }
        }
        loadMetadata()
    }, [supabase])

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => setSearchQuery(searchInput), 500)
        return () => clearTimeout(timeoutId)
    }, [searchInput])

    // Fetch listings
    const fetchListings = useCallback(async (loadMore = false) => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new AbortController
        const controller = new AbortController()
        abortControllerRef.current = controller

        const currentOffset = loadMore ? offset : 0

        if (loadMore) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
            setError(null)
        }

        // Hard timeout: 10 seconds
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && (isLoading || isLoadingMore)) {
                controller.abort()
                setError('Request timed out. Please try again.')
                setIsLoading(false)
                setIsLoadingMore(false)
                console.log('Fetch timed out after 10s')
            }
        }, 10000)

        try {
            let query = supabase
                .from('listings')
                .select(`
                    id,
                    title,
                    price,
                    condition,
                    images,
                    created_at,
                    views_count,
                    seller:profiles!listings_seller_id_fkey(full_name, avatar_url),
                    college:colleges(name)
                `, { count: 'exact' })
                .eq('is_active', true)
                .eq('is_sold', false)
                .abortSignal(controller.signal)

            // Apply filters
            if (filters.category) {
                const cat = categories.find(c => c.slug === filters.category || c.name === filters.category)
                if (cat) query = query.eq('category_id', cat.id)
            }
            if (filters.condition) query = query.eq('condition', filters.condition)
            if (filters.priceMin) query = query.gte('price', parseFloat(filters.priceMin))
            if (filters.priceMax) query = query.lte('price', parseFloat(filters.priceMax))
            if (filters.college) {
                const col = colleges.find(c => c.name === filters.college)
                if (col) query = query.eq('college_id', col.id)
            }
            if (searchQuery) query = query.ilike('title', `%${searchQuery}%`)

            // Apply sorting
            if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
            else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true })
            else if (sortBy === 'price_low') query = query.order('price', { ascending: true })
            else if (sortBy === 'price_high') query = query.order('price', { ascending: false })
            else if (sortBy === 'popular') query = query.order('views_count', { ascending: false })

            query = query.range(currentOffset, currentOffset + 19)

            const { data, error: fetchError, count } = await query

            if (fetchError) throw fetchError

            if (!isMountedRef.current) return

            if (loadMore) {
                setListings(prev => [...prev, ...(data || [])])
                setOffset(currentOffset + 20)
            } else {
                setListings(data || [])
                setOffset(20)
            }

            setTotalCount(count || 0)
            setHasMore((count || 0) > currentOffset + 20)

        } catch (err: any) {
            if (!isMountedRef.current) return

            // Ignore abort errors (normal in React Strict Mode or on new request)
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
                console.log('Fetch aborted')
                return
            }
            console.error('Fetch error:', err)
            setError(err.message || 'Failed to load listings')
            if (!loadMore) setListings([])
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current) {
                setIsLoading(false)
                setIsLoadingMore(false)
                if (abortControllerRef.current === controller) {
                    abortControllerRef.current = null
                }
            }
        }
    }, [supabase, filters, searchQuery, sortBy, offset, categories, colleges, isLoading, isLoadingMore])

    // Initial load and filter changes
    useEffect(() => {
        // Skip if categories/colleges haven't loaded yet (except first load)
        if (!initialLoadRef.current) {
            initialLoadRef.current = true
            fetchListings(false)
            return
        }

        setOffset(0)
        fetchListings(false)
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
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                                    <p className="text-dark-400">Fetching listings...</p>
                                </div>
                            ) : error ? (
                                <div className="glass-card p-12 text-center">
                                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
                                    <p className="text-red-400 mb-6">{error}</p>
                                    <button onClick={() => fetchListings(false)} className="btn-primary">
                                        Try Again
                                    </button>
                                </div>
                            ) : listings.length > 0 ? (
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
