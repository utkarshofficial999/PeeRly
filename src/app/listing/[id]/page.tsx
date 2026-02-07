'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { MessageSquare, Heart, Share2, MapPin, Clock, Eye, User } from 'lucide-react'
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

        // Guard: Already fetched THIS ID successfully
        if (lastFetchedIdRef.current === id && listing !== null) {
            console.log('✅ Already have data for this ID, skipping fetch')
            return
        }

        // Guard: Currently loading (prevent double-fetch from Strict Mode)
        if (status === 'loading') {
            console.log('⏳ Already loading, skipping')
            return
        }

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

    // Render based on status
    if (status === 'idle' || status === 'loading') {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-dark-400">Loading listing...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (status === 'error' || !listing) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center glass-card p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Listing Not Found</h1>
                        <p className="text-dark-400 mb-2">{errorMsg || 'This listing might have been removed.'}</p>
                        <p className="text-dark-500 text-sm mb-6">ID: {id}</p>
                        <Link href="/browse" className="btn-primary inline-block">
                            Back to Browse
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
        <div className="min-h-screen bg-dark-950 flex flex-col">
            <Header />
            <main className="flex-1 container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-square rounded-3xl overflow-hidden bg-dark-900">
                            {images.length > 0 ? (
                                <Image
                                    src={images[activeImage]}
                                    alt={listing.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <p className="text-dark-500">No image available</p>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative aspect-square rounded-xl overflow-hidden transition-all ${activeImage === idx ? 'ring-2 ring-primary-500 scale-95' : 'hover:opacity-80'
                                            }`}
                                    >
                                        <Image src={img} alt={`${listing.title} ${idx + 1}`} fill className="object-cover" sizes="150px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <h1 className="text-3xl font-bold text-white">{listing.title}</h1>
                                <span className="text-3xl font-bold text-primary-500">{formatPrice(listing.price)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-dark-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatRelativeTime(listing.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {listing.views_count || 0} views
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-dark-400">Condition:</span>
                            <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-sm font-medium">
                                {CONDITIONS[listing.condition as keyof typeof CONDITIONS]?.label || listing.condition}
                            </span>
                        </div>

                        {listing.seller && (
                            <div className="glass-card p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                                    {listing.seller.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{listing.seller.full_name || 'Unknown Seller'}</p>
                                    {listing.college && (
                                        <p className="text-sm text-dark-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {listing.college.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="glass-card p-6">
                            <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                            <p className="text-dark-300 whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        {!isOwnListing && (
                            <div className="flex gap-4">
                                <button onClick={handleChat} className="flex-1 btn-primary py-4 text-lg justify-center gap-3">
                                    <MessageSquare className="w-6 h-6" />
                                    Chat with Seller
                                </button>
                                <button
                                    onClick={toggleSave}
                                    className={`w-16 rounded-2xl border-2 flex items-center justify-center transition-all ${isSaved ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/10 text-dark-400 hover:border-white/30 hover:text-white'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                                </button>
                                <button className="w-16 rounded-2xl border-2 border-white/10 flex items-center justify-center text-dark-400 hover:border-white/30 hover:text-white transition-all">
                                    <Share2 className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        {isOwnListing && (
                            <div className="glass-card p-6 text-center">
                                <User className="w-12 h-12 mx-auto mb-3 text-primary-500" />
                                <p className="text-white font-medium mb-1">This is your listing</p>
                                <p className="text-dark-400 text-sm">You can manage it from your dashboard</p>
                                <Link href="/dashboard" className="btn-secondary mt-4 inline-block">
                                    Go to Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
