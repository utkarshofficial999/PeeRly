'use client'

import { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/ui/SearchBar'
import FilterSidebar from '@/components/ui/FilterSidebar'
import ListingCard from '@/components/cards/ListingCard'
import { Grid3X3, List, ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

// Types for our data
interface DBListing {
    id: string
    title: string
    price: number
    condition: any
    images: string[]
    created_at: string
    views_count: number
    is_active: boolean
    is_sold: boolean
    seller?: {
        full_name: string
        avatar_url: string
    }
    college?: {
        name: string
    }
}

const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
]

function BrowseContent() {
    // FIXED: Memoize Supabase client to prevent re-creation
    const supabase = useMemo(() => createClient(), [])
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const categoryFromUrl = searchParams.get('category') || ''

    // States
    const [listings, setListings] = useState<DBListing[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [colleges, setColleges] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchInput, setSearchInput] = useState('') // User's input
    const [searchQuery, setSearchQuery] = useState('') // Debounced search
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('newest')
    const [hasMore, setHasMore] = useState(true)
    const [offset, setOffset] = useState(0)
    const ITEMS_PER_PAGE = 20

    const [filters, setFilters] = useState({
        category: categoryFromUrl,
        condition: '',
        priceMin: '',
        priceMax: '',
        college: '',
    })

    // FIXED: Use refs to prevent duplicate fetches
    const abortControllerRef = useRef<AbortController | null>(null)
    const isFetchingRef = useRef(false)
    const lastFetchParamsRef = useRef<string>('')

    // Debounce search input to avoid too many queries
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(searchInput)
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchInput])

    // Update filter if URL param changes
    useEffect(() => {
        if (categoryFromUrl) {
            setFilters(prev => ({ ...prev, category: categoryFromUrl }))
        }
    }, [categoryFromUrl])

    // FIXED: Fetch metadata ONCE with stable dependencies
    useEffect(() => {
        let mounted = true

        const fetchMeta = async () => {
            const cachedCategories = sessionStorage.getItem('categories')
            const cachedColleges = sessionStorage.getItem('colleges')

            if (cachedCategories && cachedColleges) {
                if (mounted) {
                    const cats = JSON.parse(cachedCategories)
                    const cols = JSON.parse(cachedColleges)
                    console.log('📦 Using cached metadata:', { categories: cats.length, colleges: cols.length })
                    setCategories(cats)
                    setColleges(cols)
                }
                return
            }

            console.log('🔄 Fetching metadata from Supabase...')
            try {
                const [catRes, colRes] = await Promise.all([
                    supabase.from('categories').select('*'),
                    supabase.from('colleges').select('*')
                ])

                console.log('📊 Metadata response:', {
                    categories: catRes.data?.length || 0,
                    colleges: colRes.data?.length || 0,
                    catError: catRes.error,
                    colError: colRes.error
                })

                if (mounted) {
                    if (catRes.data && catRes.data.length > 0) {
                        setCategories(catRes.data)
                        sessionStorage.setItem('categories', JSON.stringify(catRes.data))
                    } else {
                        console.warn('⚠️ No categories found, using empty array')
                        setCategories([])
                    }

                    if (colRes.data && colRes.data.length > 0) {
                        setColleges(colRes.data)
                        sessionStorage.setItem('colleges', JSON.stringify(colRes.data))
                    } else {
                        console.warn('⚠️ No colleges found, using empty array')
                        setColleges([])
                    }
                }
            } catch (err) {
                console.error('❌ Error fetching metadata:', err)
                if (mounted) {
                    // Set empty arrays to allow page to continue
                    setCategories([])
                    setColleges([])
                }
            }
        }

        fetchMeta()

        return () => {
            mounted = false
        }
    }, [supabase])

    // FIXED: Stable fetchListings with proper abort handling
    const fetchListings = useCallback(async (loadMore = false, currentOffset = 0) => {
        // Create unique signature for this fetch
        const fetchParams = JSON.stringify({
            filters,
            searchQuery,
            sortBy,
            loadMore,
            currentOffset
        })

        console.log('🔍 fetchListings called:', { loadMore, currentOffset, filters, searchQuery, sortBy })

        // Prevent duplicate fetches with same parameters
        if (isFetchingRef.current && lastFetchParamsRef.current === fetchParams) {
            console.log('⏭️ Skipping duplicate fetch')
            return
        }

        // Cancel any ongoing fetch
        if (abortControllerRef.current) {
            console.log('🛑 Aborting previous fetch')
            abortControllerRef.current.abort()
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController()
        isFetchingRef.current = true
        lastFetchParamsRef.current = fetchParams

        if (loadMore) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            let query = supabase
                .from('listings')
                .select(`
                    *,
                    seller:profiles!listings_seller_id_fkey(full_name, avatar_url),
                    college:colleges(name)
                `, { count: 'exact' })
                .eq('is_active', true)
                .eq('is_sold', false)

            // Category Filter
            if (filters.category) {
                const selectedCat = categories.find(c => c.slug === filters.category)
                if (selectedCat) query = query.eq('category_id', selectedCat.id)
            }

            // Condition Filter
            if (filters.condition) {
                query = query.eq('condition', filters.condition)
            }

            // Price Filters
            if (filters.priceMin) query = query.gte('price', parseFloat(filters.priceMin))
            if (filters.priceMax) query = query.lte('price', parseFloat(filters.priceMax))

            // Search Query
            if (searchQuery) {
                query = query.ilike('title', `%${searchQuery}%`)
            }

            // College Filter
            if (filters.college) {
                const selectedCol = colleges.find(c => c.slug === filters.college)
                if (selectedCol) query = query.eq('college_id', selectedCol.id)
            }

            // Sorting
            switch (sortBy) {
                case 'newest': query = query.order('created_at', { ascending: false }); break
                case 'oldest': query = query.order('created_at', { ascending: true }); break
                case 'price_low': query = query.order('price', { ascending: true }); break
                case 'price_high': query = query.order('price', { ascending: false }); break
                case 'popular': query = query.order('views_count', { ascending: false }); break
                default: query = query.order('created_at', { ascending: false })
            }

            // Add pagination
            query = query.range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1)

            const { data, error: fetchError, count } = await query

            console.log('📥 Query response:', {
                dataCount: data?.length || 0,
                totalCount: count,
                error: fetchError,
                aborted: abortControllerRef.current?.signal.aborted
            })

            // Check if request was aborted
            if (abortControllerRef.current?.signal.aborted) {
                console.log('⏹️ Request was aborted')
                return
            }

            if (fetchError) throw fetchError

            if (loadMore) {
                setListings(prev => [...prev, ...(data || [])])
                setOffset(currentOffset + ITEMS_PER_PAGE)
            } else {
                setListings(data || [])
                setOffset(ITEMS_PER_PAGE)
            }

            // Check if there are more items
            setHasMore(count ? count > (loadMore ? currentOffset + ITEMS_PER_PAGE : ITEMS_PER_PAGE) : false)
        } catch (err: any) {
            // Ignore abort errors
            if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                return
            }

            console.error('Error fetching listings:', err)
            setError(err.message)
        } finally {
            isFetchingRef.current = false
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [filters, searchQuery, sortBy, categories, colleges, supabase])

    // FIXED: Trigger fetch only when filters/search/sort change, with metadata ready
    useEffect(() => {
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                console.warn('⏱️ Fetch timeout - forcing load with available data')
                setIsLoading(false)
                setError('Loading took too long. Please check your connection and try again.')
            }
        }, 10000) // 10 second timeout

        // Don't wait for metadata if filters don't need it
        const needsMetadata = filters.category || filters.college

        // If we need metadata but don't have it yet, wait
        if (needsMetadata && categories.length === 0 && colleges.length === 0) {
            console.log('⏳ Waiting for metadata before filtering...')
            return () => clearTimeout(timeoutId)
        }

        console.log('🚀 Triggering fetch with:', {
            filters,
            searchQuery,
            sortBy,
            hasCategories: categories.length > 0,
            hasColleges: colleges.length > 0
        })

        // Reset offset and fetch from beginning
        setOffset(0)
        fetchListings(false, 0)

        // Cleanup on unmount or before next fetch
        return () => {
            clearTimeout(timeoutId)
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
        // FIXED: Remove fetchListings from dependencies to prevent infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchQuery, sortBy, categories.length, colleges.length])

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({
            category: '',
            condition: '',
            priceMin: '',
            priceMax: '',
            college: '',
        })
        setSearchInput('')
        setSearchQuery('')
    }

    const handleLoadMore = () => {
        fetchListings(true, offset)
    }

    return (
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-28 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
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

                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <p className="text-sm text-dark-400">
                            Showing <span className="text-white font-medium">{listings.length}</span> results
                        </p>

                        <div className="flex items-center gap-4">
                            {/* Sort Dropdown */}
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

                            {/* View Mode Toggle */}
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

                    {/* Content */}
                    <div className="flex gap-8">
                        {/* Filter Sidebar */}
                        <FilterSidebar
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClear={clearFilters}
                            categories={categories}
                            colleges={colleges}
                        />

                        {/* Listings Grid */}
                        <div className="flex-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                                    <p className="text-dark-400">Fetching listings...</p>
                                </div>
                            ) : error ? (
                                <div className="glass-card p-12 text-center text-red-400">
                                    <p>Error: {error}</p>
                                    <button onClick={() => fetchListings(false, 0)} className="mt-4 btn-secondary">Retry</button>
                                </div>
                            ) : listings.length > 0 ? (
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

                            {/* Load More */}
                            {!isLoading && hasMore && listings.length > 0 && (
                                <div className="mt-8 text-center">
                                    <button
                                        onClick={handleLoadMore}
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
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default function BrowsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        }>
            <BrowseContent />
        </Suspense>
    )
}
