'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { MessageSquare, Heart, Share2, MapPin, Clock, Eye, User, AlertCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, formatRelativeTime, CONDITIONS } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

// Note: This is a client component that fetches data dynamically
// No server-side exports needed for static export

// State machine to prevent loading loop
type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ListingDetailPage() {
    const params = useParams()
    const id = params?.id as string
    const router = useRouter()
    const { user } = useAuth()

    // Stable Supabase client - created once and memoized
    const supabase = useMemo(() => createClient(), [])

    // State
    const [listing, setListing] = useState<any>(null)
    const [status, setStatus] = useState<FetchStatus>('idle')
    const [activeImage, setActiveImage] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // CRITICAL: Track last successfully fetched ID to prevent refetch
    const lastFetchedIdRef = useRef<string | null>(null)

    // Single effect for fetching - NO dependencies except id and supabase
    useEffect(() => {
        // Guard: No ID
        if (!id || typeof id !== 'string') {
            console.log('❌ Invalid listing ID')
            setStatus('error')
            setErrorMsg('Invalid listing ID')
            return
        }

        // Guard: Currently loading
        if (status === 'loading') {
            console.log('⏳ Already loading, skipping')
            return
        }

        // We removed the lastFetchedIdRef guard to ensure that every time a user 
        // lands on this page, the view count increments and profile data is fresh.

        let cancelled = false

        const fetchData = async () => {
            console.log('📄 Starting fetch for listing:', id)
            setStatus('loading')
            setErrorMsg(null)

            try {
                // Direct fetch - no abort signal complexity
                const { data: listingData, error: listingError } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', id)
                    .single()

                // Check if this effect was cancelled
                if (cancelled) {
                    console.log('🚫 Fetch cancelled (cleanup)')
                    return
                }

                console.log('� Listing response:', { listingData, listingError })

                if (listingError) {
                    console.error('❌ Supabase error:', listingError.message)
                    setStatus('error')
                    setErrorMsg(listingError.message)
                    return
                }

                if (!listingData) {
                    console.error('❌ No data returned')
                    setStatus('error')
                    setErrorMsg('Listing not found')
                    return
                }

                console.log('✅ Got listing:', listingData.title)

                // Fetch seller and college in parallel
                let seller = null
                let college = null

                const fetches: Promise<void>[] = []

                if (listingData.seller_id) {
                    fetches.push(
                        supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', listingData.seller_id)
                            .single()
                            .then(({ data }: { data: any }) => { seller = data })
                            .catch(() => { seller = null })
                    )
                }

                if (listingData.college_id) {
                    fetches.push(
                        supabase
                            .from('colleges')
                            .select('*')
                            .eq('id', listingData.college_id)
                            .single()
                            .then(({ data }: { data: any }) => { college = data })
                            .catch(() => { college = null })
                    )
                }

                await Promise.all(fetches)

                // Final cancelled check
                if (cancelled) {
                    console.log('🚫 Fetch cancelled after sub-fetches')
                    return
                }

                // Build full listing
                const fullListing = {
                    ...listingData,
                    seller,
                    college,
                }

                console.log('✅ Setting listing data, marking success')

                // CRITICAL: Set ref BEFORE setting state
                lastFetchedIdRef.current = id
                setListing(fullListing)
                setStatus('success')

                // Fire and forget: increment views (wrapped in try-catch)
                try {
                    await supabase.rpc('increment_views', { listing_id: id })
                } catch {
                    // Silently ignore - view count is not critical
                }

            } catch (err: any) {
                if (cancelled) return

                console.error('❌ Unexpected error:', err)
                setStatus('error')
                setErrorMsg(err.message || 'Failed to load listing')
            }
        }

        fetchData()

        // Cleanup function
        return () => {
            cancelled = true
            console.log('🧹 Effect cleanup for ID:', id)
        }
    }, [id, supabase]) // Only stable deps - listing and status intentionally omitted

    // Separate effect for checking saved status
    useEffect(() => {
        if (!user || !id || status !== 'success') return

        const checkSaved = async () => {
            const { data } = await supabase
                .from('saved_listings')
                .select('id')
                .eq('user_id', user.id)
                .eq('listing_id', id)
                .maybeSingle()

            if (data) setIsSaved(true)
        }

        checkSaved()
    }, [user, id, status, supabase])

    const toggleSave = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        try {
            if (isSaved) {
                await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', id)
                setIsSaved(false)
            } else {
                await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: id })
                setIsSaved(true)
            }
        } catch (err) {
            console.error('Save error:', err)
        }
    }

    const handleChat = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (!listing) return

        if (user.id === listing.seller_id) {
            alert('This is your own listing!')
            return
        }

        try {
            // Find existing conversation
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('listing_id', id)
                .eq('buyer_id', user.id)
                .eq('seller_id', listing.seller_id)
                .maybeSingle()

            if (existing) {
                router.push(`/messages?conv=${existing.id}`)
                return
            }

            // Create new
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    listing_id: id,
                    buyer_id: user.id,
                    seller_id: listing.seller_id,
                })
                .select('id')
                .single()

            if (error) throw error
            router.push(`/messages?conv=${newConv.id}`)
        } catch (err: any) {
            console.error('Chat error:', err)
            alert(`Failed to start chat: ${err.message}`)
        }
    }

    const handleMarkAsSold = async () => {
        if (!user || user.id !== listing?.seller_id) return

        const confirmSold = window.confirm('Are you sure you want to mark this item as sold? It will be hidden from the browse feed.')
        if (!confirmSold) return

        try {
            const { error } = await supabase
                .from('listings')
                .update({ is_sold: true })
                .eq('id', id)

            if (error) throw error

            setListing((prev: any) => ({ ...prev, is_sold: true }))
            alert('Item marked as sold! It will no longer appear in the browse feed.')
        } catch (err: any) {
            console.error('Error marking as sold:', err)
            alert(`Failed to mark as sold: ${err.message}`)
        }
    }

    // Render based on status
    if (status === 'idle' || status === 'loading') {
        return (
            <div className="min-h-screen bg-surface-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mx-auto" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                            </div>
                        </div>
                        <p className="text-surface-600 font-black tracking-widest uppercase text-xs">Summoning Details...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (status === 'error' || !listing) {
        return (
            <div className="min-h-screen bg-surface-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center bg-white p-12 rounded-[2.5rem] shadow-premium border border-surface-100">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-peach-50 text-peach-500 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-black text-surface-900 mb-2">Artifact Missing</h1>
                        <p className="text-surface-600 font-bold mb-8 leading-relaxed">
                            {errorMsg || 'This listing might have been moved to the campus archives.'}
                        </p>
                        <Link href="/browse" className="btn-primary w-full py-4 rounded-2xl">
                            Return to Feed
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    // Success - render listing
    const images = listing.images || []
    const isOwnListing = user?.id === listing.seller_id

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <Header />
            <main className="flex-1 container-custom pt-24 md:pt-32 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Images */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-white shadow-premium border border-surface-100 group">
                            {images.length > 0 ? (
                                <Image
                                    src={images[activeImage]}
                                    alt={listing.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-surface-50">
                                    <div className="text-6xl mb-4">📸</div>
                                    <p className="text-surface-600 font-black uppercase tracking-widest text-xs">No Visual Evidence</p>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative aspect-square rounded-2xl overflow-hidden transition-all shadow-soft border-2 ${activeImage === idx
                                            ? 'border-primary-500 scale-95 shadow-lg shadow-primary-500/20'
                                            : 'border-transparent hover:border-primary-200'
                                            }`}
                                    >
                                        <Image src={img} alt={`${listing.title} ${idx + 1}`} fill className="object-cover" sizes="150px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="px-4 py-1.5 rounded-2xl bg-mint-50 text-mint-600 border border-mint-100 text-xs font-black uppercase tracking-wider">
                                    {CONDITIONS[listing.condition as keyof typeof CONDITIONS]?.label || listing.condition}
                                </span>
                                {listing.is_sold && (
                                    <span className="px-4 py-1.5 rounded-2xl bg-amber-500 text-white border border-amber-400 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20">
                                        Sold Out
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-xs font-bold text-surface-400 uppercase tracking-widest">
                                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                                    {listing.college?.name || 'CAMPUS'}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-4 tracking-tight leading-tight">
                                {listing.title}
                            </h1>

                            <div className="flex items-center gap-6">
                                <span className="text-4xl font-black gradient-text">
                                    {formatPrice(listing.price)}
                                </span>
                                <div className="h-8 w-px bg-surface-100" />
                                <div className="flex items-center gap-4 text-xs font-bold text-surface-500 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatRelativeTime(listing.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5" />
                                        {listing.views_count || 0} Scouts
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Seller Card */}
                        {listing.seller && (
                            <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-surface-100 flex items-center justify-between group hover:shadow-premium hover:-translate-y-1 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-soft shrink-0 border border-surface-50">
                                        {listing.seller.avatar_url ? (
                                            <Image
                                                src={listing.seller.avatar_url}
                                                alt={listing.seller.full_name || 'Seller'}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-black text-xl">
                                                {listing.seller.full_name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-surface-900 font-bold text-lg">{listing.seller.full_name || 'Sophomore Seller'}</p>
                                            {listing.seller.is_verified && (
                                                <div className="flex items-center gap-1 text-primary-500">
                                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-mint-600 uppercase tracking-widest">Master Student</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 text-surface-200 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        )}

                        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-surface-100">
                            <h2 className="text-xs font-black text-primary-600 uppercase tracking-[0.2em] mb-4">Original Memo</h2>
                            <p className="text-surface-800 font-bold leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        {!isOwnListing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleChat}
                                    disabled={listing.is_sold}
                                    className={`flex-1 btn-primary py-5 text-lg font-black justify-center gap-3 rounded-[1.5rem] shadow-button ${listing.is_sold ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                >
                                    <MessageSquare className="w-6 h-6" />
                                    {listing.is_sold ? 'Item Sold' : 'Initiate Connection'}
                                </button>
                                <button
                                    onClick={toggleSave}
                                    disabled={listing.is_sold}
                                    className={`w-20 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${listing.is_sold ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${isSaved
                                        ? 'bg-peach-50 border-peach-200 text-peach-500 shadow-lg shadow-peach-500/10'
                                        : 'bg-white border-surface-100 text-surface-400 hover:border-peach-200 hover:bg-peach-50 hover:text-peach-400'
                                        }`}
                                >
                                    <Heart className={`w-7 h-7 ${isSaved ? 'fill-current' : ''}`} />
                                </button>
                                <button className="w-20 h-16 rounded-2xl border-2 border-surface-100 bg-white text-surface-400 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-500 transition-all">
                                    <Share2 className="w-7 h-7" />
                                </button>
                            </div>
                        )}

                        {isOwnListing && (
                            <div className="bg-primary-50 p-8 rounded-[2rem] border border-primary-100 text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
                                    <User className="w-8 h-8 text-primary-500" />
                                </div>
                                <p className="text-primary-900 font-black text-xl mb-1">Your Portfolio Piece</p>
                                <p className="text-primary-600 font-medium text-sm mb-6">This listing is under your stewardship.</p>
                                <Link href="/dashboard" className="btn-primary py-3 px-8 text-sm">
                                    Manage from Dashboard
                                </Link>
                                {!listing.is_sold && (
                                    <button
                                        onClick={handleMarkAsSold}
                                        className="mt-4 w-full py-4 rounded-xl bg-amber-500 text-white font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Mark as Sold
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
