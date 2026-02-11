'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchBar from '@/components/ui/SearchBar'
import FilterSidebar from '@/components/ui/FilterSidebar'
import ListingCard from '@/components/cards/ListingCard'
import { Grid3X3, List, ChevronDown, Loader2, AlertCircle, User as UserIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

interface Listing {
    id: string
    title: string
    price: number
    condition: any
    images: string[]
    created_at: string
    views_count: number
    listing_type: 'sell' | 'rent' | 'barter'
    seller?: { full_name: string; avatar_url: string; is_verified?: boolean }
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
    const { user, profile } = useAuth()
    const [hasMore, setHasMore] = useState(false)
    const [offset, setOffset] = useState(0)

    const [filters, setFilters] = useState({
        category: categoryFromUrl,
        condition: '',
        priceMin: '',
        priceMax: '',
        college: '',
    })

    const router = useRouter()
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

    const initialLoadRef = useRef(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMountedRef = useRef(true)
    const requestCountRef = useRef(0)
    const isLoadingRef = useRef(true)

    // Sync isLoadingRef with state for UI
    useEffect(() => {
        isLoadingRef.current = isLoading
    }, [isLoading])

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
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            controller.abort()
            console.warn('Metadata fetch timed out')
        }, 8000)

        const loadMetadata = async () => {
            try {
                const [catResult, colResult] = await Promise.all([
                    supabase.from('categories').select('*').order('name').abortSignal(controller.signal),
                    supabase.from('colleges').select('*').order('name').abortSignal(controller.signal),
                ])
                if (isMountedRef.current) {
                    setCategories(catResult.data || [])
                    setColleges(colResult.data || [])
                }
            } catch (err) {
                console.error('Failed to load metadata:', err)
            } finally {
                clearTimeout(timeoutId)
            }
        }
        loadMetadata()
        return () => controller.abort()
    }, [supabase])

    // Fetch saved listings for current user
    useEffect(() => {
        if (!user) {
            setSavedIds(new Set())
            return
        }

        const fetchSavedIds = async () => {
            try {
                const { data } = await supabase
                    .from('saved_listings')
                    .select('listing_id')
                    .eq('user_id', user.id)

                if (data && isMountedRef.current) {
                    setSavedIds(new Set(data.map((item: { listing_id: string }) => item.listing_id)))
                }
            } catch (err) {
                console.error('Failed to fetch saved listings:', err)
            }
        }

        fetchSavedIds()
    }, [user, supabase])

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => setSearchQuery(searchInput), 500)
        return () => clearTimeout(timeoutId)
    }, [searchInput])

    // Fetch listings
    const fetchListings = useCallback(async (loadMore = false) => {
        // Increment request ID to track this specific call
        const currentRequestId = ++requestCountRef.current

        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller

        const currentOffset = loadMore ? offset : 0

        if (loadMore) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
            setError(null)
        }

        // ABSOLUTE TIMEOUT: Force stop after 10s
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && requestCountRef.current === currentRequestId) {
                controller.abort()
                setIsLoading(false)
                setIsLoadingMore(false)
                setError('Connection is taking too long. Please refresh.')
                console.error('Fetch timed out after 10s')
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
                    listing_type,
                    seller:profiles!listings_seller_id_fkey(full_name, avatar_url, is_verified),
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

            // Only update if this is still the current request and component is mounted
            if (isMountedRef.current && requestCountRef.current === currentRequestId) {
                if (loadMore) {
                    setListings(prev => [...prev, ...(data || [])])
                    setOffset(currentOffset + 20)
                } else {
                    setListings(data || [])
                    setOffset(20)
                }
                setTotalCount(count || 0)
                setHasMore((count || 0) > currentOffset + 20)
            }

        } catch (err: any) {
            if (isMountedRef.current && requestCountRef.current === currentRequestId) {
                if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
                    console.log('Fetch aborted')
                } else {
                    console.error('Fetch error:', err)
                    setError(err.message || 'Failed to load listings')
                    if (!loadMore) setListings([])
                }
            }
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current && requestCountRef.current === currentRequestId) {
                setIsLoading(false)
                setIsLoadingMore(false)
                if (abortControllerRef.current === controller) {
                    abortControllerRef.current = null
                }
            }
        }
    }, [supabase, filters, searchQuery, sortBy, offset, categories, colleges])

    // Initial load and filter changes
    useEffect(() => {
        // Skip if categories/colleges haven't loaded yet and we have a filter depending on them
        // But always do the first fetch
        if (!initialLoadRef.current) {
            initialLoadRef.current = true
            fetchListings(false)
            return
        }

        setOffset(0)
        fetchListings(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchQuery, sortBy, categories.length, colleges.length])

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({ category: '', condition: '', priceMin: '', priceMax: '', college: '' })
        setSearchInput('')
        setSearchQuery('')
    }

    const handleToggleSave = async (listingId: string) => {
        if (!user) {
            router.push(`/login?next=/browse`)
            return
        }

        const isCurrentlySaved = savedIds.has(listingId)

        // Optimistic update
        setSavedIds(prev => {
            const next = new Set(prev)
            if (isCurrentlySaved) next.delete(listingId)
            else next.add(listingId)
            return next
        })

        try {
            if (isCurrentlySaved) {
                const { error } = await supabase
                    .from('saved_listings')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('listing_id', listingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('saved_listings')
                    .insert({ user_id: user.id, listing_id: listingId })
                if (error) throw error
            }
        } catch (err) {
            console.error('Save error:', err)
            // Rollback on error
            setSavedIds(prev => {
                const next = new Set(prev)
                if (isCurrentlySaved) next.add(listingId)
                else next.delete(listingId)
                return next
            })
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            {/* Sub-Nav Bar: Categories & Profile */}
            <nav className="fixed top-0 left-0 right-0 z-50 soft-glass border-b border-surface-100 animate-in fade-in duration-500">
                <div className="container-custom px-4 md:px-6 py-3 flex items-center justify-between gap-6">
                    {/* Categories Scroller */}
                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearFilters}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${!filters.category
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                    : 'bg-white text-surface-900 border-surface-100 hover:border-primary-200 hover:text-primary-600'
                                    }`}
                            >
                                All Feed
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleFilterChange('category', cat.slug)}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filters.category === cat.slug
                                        ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                        : 'bg-white text-surface-900 border-surface-100 hover:border-primary-200 hover:text-primary-600'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access Actions */}
                    <div className="flex items-center gap-3">
                        <Link href="/create" className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-all">
                            Post Asset
                        </Link>
                        {user ? (
                            <Link href="/dashboard" className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary-500/10 hover:ring-primary-500 transition-all shadow-soft group bg-white flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-black">
                                        {profile?.full_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </Link>
                        ) : (
                            <Link href="/login" className="p-2.5 text-surface-600 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all">
                                <UserIcon className="w-5 h-5" />
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-20 md:pt-24 pb-20 px-4">
                <div className="container-custom">
                    {/* Page Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-surface-900 mb-3 tracking-tight">
                            Campus <span className="gradient-text">Marketplace</span>
                        </h1>
                        <p className="text-surface-900 font-black text-lg uppercase tracking-tight">
                            Curated treasures from students at your campus
                        </p>
                    </div>

                    {/* Search Controls */}
                    <div className="mb-10">
                        <SearchBar
                            value={searchInput}
                            onChange={setSearchInput}
                            onFilterClick={() => setIsFilterOpen(true)}
                        />
                    </div>

                    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                        <p className="text-sm font-black text-surface-900 tracking-wide uppercase">
                            {isLoading ? (
                                'Syncing listings...'
                            ) : (
                                <>
                                    Showing <span className="text-primary-600">{listings.length}</span> / <span className="text-surface-900">{totalCount}</span> artifacts
                                </>
                            )}
                        </p>

                        <div className="flex items-center gap-4">
                            {/* Sort Dropdown */}
                            <div className="relative group">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white border border-surface-100 rounded-2xl px-5 py-2.5 pr-12 text-sm font-black text-surface-900 cursor-pointer hover:border-primary-300 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-soft"
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value} className="bg-white">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                            </div>

                            {/* View Switcher */}
                            <div className="flex items-center bg-white p-1 rounded-2xl border border-surface-100 shadow-soft">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid'
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-surface-700 hover:text-primary-600 hover:bg-primary-50'
                                        }`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'list'
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-surface-700 hover:text-primary-600 hover:bg-primary-50'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-10">
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
                                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-surface-100 shadow-soft">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-surface-600 font-black mt-6 tracking-widest uppercase text-[10px]">Summoning Feed...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-white p-16 rounded-[2.5rem] border border-surface-100 shadow-soft text-center">
                                    <div className="w-20 h-20 bg-peach-50 text-peach-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <AlertCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-black text-surface-900 mb-2">Transmission Lost</h3>
                                    <p className="text-surface-600 font-black mb-8 max-w-sm mx-auto">{error}</p>
                                    <button onClick={() => fetchListings(false)} className="btn-primary px-10">
                                        Try Reconnecting
                                    </button>
                                </div>
                            ) : listings.length > 0 ? (
                                <>
                                    <div className={`grid gap-8 ${viewMode === 'grid'
                                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
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
                                                isVerified={listing.seller?.is_verified}
                                                createdAt={listing.created_at}
                                                listingType={listing.listing_type}
                                                isSaved={savedIds.has(listing.id)}
                                                onSave={() => handleToggleSave(listing.id)}
                                            />
                                        ))}
                                    </div>

                                    {hasMore && (
                                        <div className="mt-16 text-center">
                                            <button
                                                onClick={() => fetchListings(true)}
                                                disabled={isLoadingMore}
                                                className="btn-secondary px-12 py-4 rounded-2xl bg-white shadow-soft hover:shadow-premium hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 transition-all font-black text-surface-900"
                                            >
                                                {isLoadingMore ? (
                                                    <span className="flex items-center gap-3">
                                                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                                        Loading More...
                                                    </span>
                                                ) : (
                                                    'Load More Listings'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white p-20 rounded-[2.5rem] border border-surface-100 shadow-soft text-center">
                                    <div className="text-7xl mb-8 grayscale opacity-50">🧭</div>
                                    <h3 className="text-2xl font-black text-surface-900 mb-3 tracking-tight">Zero Artifacts Found</h3>
                                    <p className="text-surface-600 font-black mb-10 max-w-xs mx-auto">
                                        Your search didn&apos;t match any listings. Try refining your filters.
                                    </p>
                                    <button onClick={clearFilters} className="btn-primary px-10">
                                        Reset All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer was here */}
        </div>
    )
}
