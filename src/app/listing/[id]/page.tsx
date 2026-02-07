'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { MessageSquare, Heart, Share2, MapPin, Clock, Eye, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, formatRelativeTime, CONDITIONS } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

// CRITICAL: Force dynamic rendering - prevents build-time static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ListingDetailPage() {
    const params = useParams()
    const id = params?.id as string
    const router = useRouter()
    const { user, profile } = useAuth()
    const supabase = createClient()

    const [listing, setListing] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeImage, setActiveImage] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchListing = useCallback(async () => {
        // Validate ID before fetching
        if (!id || typeof id !== 'string') {
            setError('Invalid listing ID')
            setIsLoading(false)
            return
        }

        console.log('📄 Fetching listing:', id)
        setIsLoading(true)
        setError(null)

        try {
            // Fetch listing without joins for speed
            const { data, error: fetchError } = await supabase
                .from('listings')
                .select('*')
                .eq('id', id)
                .single()

            console.log('📄 Listing fetch result:', { data, error: fetchError })

            if (fetchError) {
                console.error('❌ Fetch error:', fetchError)
                throw fetchError
            }

            if (!data) {
                console.error('❌ No listing data returned')
                throw new Error('Listing not found')
            }

            console.log('✅ Listing loaded:', data.title)

            // Fetch seller and college separately in parallel (only if IDs exist)
            const promises = []

            if (data.seller_id) {
                promises.push(
                    supabase.from('profiles').select('*').eq('id', data.seller_id).single()
                        .then((res: any) => ({ seller: res.data }))
                        .catch(() => ({ seller: null }))
                )
            } else {
                promises.push(Promise.resolve({ seller: null }))
            }

            if (data.college_id) {
                promises.push(
                    supabase.from('colleges').select('*').eq('id', data.college_id).single()
                        .then((res: any) => ({ college: res.data }))
                        .catch(() => ({ college: null }))
                )
            } else {
                promises.push(Promise.resolve({ college: null }))
            }

            const [sellerResult, collegeResult] = await Promise.all(promises)

            // Combine data
            const fullListing = {
                ...data,
                seller: sellerResult.seller,
                college: collegeResult.college
            }

            setListing(fullListing)

            // Increment view count (optional, skip if function doesn't exist)
            supabase.rpc('increment_views', { listing_id: id }).catch(() => {
                console.debug('View count not incremented')
            })

        } catch (err: any) {
            console.error('❌ Error fetching listing:', err)
            setError(err.message || 'Failed to load listing')
        } finally {
            setIsLoading(false)
        }
    }, [id, supabase])

    const checkIfSaved = useCallback(async () => {
        if (!user || !id) return
        try {
            const { data } = await supabase
                .from('saved_listings')
                .select('*')
                .eq('user_id', user.id)
                .eq('listing_id', id)
                .maybeSingle()

            if (data) setIsSaved(true)
        } catch (err) {
            console.debug('Could not check saved status:', err)
        }
    }, [user, id, supabase])

    useEffect(() => {
        if (id) {
            fetchListing()
            checkIfSaved()
        }
    }, [id, fetchListing, checkIfSaved])

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
        console.log('💬 Chat button clicked')

        if (!user) {
            console.log('❌ No user, redirecting to login')
            router.push('/login')
            return
        }

        if (!listing) {
            console.error('❌ No listing data available')
            return
        }

        if (user.id === listing.seller_id) {
            alert("This is your own listing!")
            return
        }

        console.log('🔍 Creating/finding conversation:', {
            listingId: id,
            buyerId: user.id,
            sellerId: listing.seller_id
        })

        try {
            // First, try to find existing conversation
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .eq('listing_id', id)
                .eq('buyer_id', user.id)
                .eq('seller_id', listing.seller_id)
                .maybeSingle()

            if (existingConv) {
                console.log('✅ Found existing conversation:', existingConv.id)
                router.push(`/messages?conv=${existingConv.id}`)
                return
            }

            // Create new conversation
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    listing_id: id,
                    buyer_id: user.id,
                    seller_id: listing.seller_id
                })
                .select()
                .single()

            if (createError) {
                console.error('❌ Error creating conversation:', createError)
                if (createError.message?.includes('row-level security')) {
                    alert('Unable to start conversation. Please check permissions.')
                }
                throw createError
            }

            console.log('✅ Created new conversation:', newConv.id)
            router.push(`/messages?conv=${newConv.id}`)
        } catch (err: any) {
            console.error('Chat error:', err)
            alert(`Failed to start chat: ${err.message || 'Unknown error'}`)
        }
    }

    // Loading state
    if (isLoading) {
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

    // Error state
    if (error || !listing) {
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
                        <p className="text-dark-400 mb-6">
                            This listing might have been removed or is no longer available.
                        </p>
                        <Link href="/browse" className="btn-primary inline-block">
                            Back to Browse
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    const images = listing.images || []
    const isOwnListing = user?.id === listing.seller_id

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col">
            <Header />
            <main className="flex-1 container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
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

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative aspect-square rounded-xl overflow-hidden transition-all ${activeImage === idx
                                                ? 'ring-2 ring-primary-500 scale-95'
                                                : 'hover:opacity-80'
                                            }`}
                                    >
                                        <Image
                                            src={img}
                                            alt={`${listing.title} ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="150px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-6">
                        {/* Price & Title */}
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

                        {/* Condition */}
                        <div className="flex items-center gap-2">
                            <span className="text-dark-400">Condition:</span>
                            <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-sm font-medium">
                                {CONDITIONS[listing.condition as keyof typeof CONDITIONS] || listing.condition}
                            </span>
                        </div>

                        {/* Seller Info */}
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

                        {/* Description */}
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                            <p className="text-dark-300 whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        {/* Actions */}
                        {!isOwnListing && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleChat}
                                    className="flex-1 btn-primary py-4 text-lg justify-center gap-3"
                                >
                                    <MessageSquare className="w-6 h-6" />
                                    Chat with Seller
                                </button>
                                <button
                                    onClick={toggleSave}
                                    className={`w-16 rounded-2xl border-2 flex items-center justify-center transition-all ${isSaved
                                            ? 'bg-rose-500 border-rose-500 text-white'
                                            : 'border-white/10 text-dark-400 hover:border-white/30 hover:text-white'
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
