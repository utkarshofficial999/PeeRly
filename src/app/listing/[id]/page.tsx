'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Heart, MessageSquare, Share2, Shield, MapPin, Calendar, Eye, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, formatRelativeTime, CONDITIONS } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default function ListingDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user, profile } = useAuth()
    const supabase = createClient()

    const [listing, setListing] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeImage, setActiveImage] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchListing = useCallback(async () => {
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
                )
            } else {
                promises.push(Promise.resolve({ seller: null }))
            }

            if (data.college_id) {
                promises.push(
                    supabase.from('colleges').select('*').eq('id', data.college_id).single()
                        .then((res: any) => ({ college: res.data }))
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
            try {
                await supabase.rpc('increment_views', { listing_id: id })
            } catch (viewErr) {
                // Silently ignore if function doesn't exist
                console.debug('View count not incremented:', viewErr)
            }

        } catch (err: any) {
            console.error('❌ Error fetching listing:', err)
            setError(err.message || 'Failed to load listing')
        } finally {
            setIsLoading(false)
        }
    }, [id, supabase])

    const checkIfSaved = useCallback(async () => {
        if (!user || !id) return
        const { data } = await supabase
            .from('saved_listings')
            .select('*')
            .eq('user_id', user.id)
            .eq('listing_id', id)
            .single()

        if (data) setIsSaved(true)
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

        if (isSaved) {
            await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', id)
            setIsSaved(false)
        } else {
            await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: id })
            setIsSaved(true)
        }
    }

    const handleChat = async () => {
        console.log('💬 Chat button clicked')

        if (!user) {
            console.log('❌ No user, redirecting to login')
            router.push('/login')
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

        // Logic to create/find conversation and redirect to /messages
        try {
            // First, try to find existing conversation
            const { data: existingConv, error: findError } = await supabase
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
                // If RLS policy issue, redirect to messages list
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

    if (isLoading) return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
    )

    if (error || !listing) return (
        <div className="min-h-screen bg-dark-950 flex flex-col pt-32 items-center px-4">
            <div className="glass-card p-12 text-center max-w-md">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">Listing Not Found</h2>
                <p className="text-dark-400 mb-8">This listing might have been removed or is no longer available.</p>
                <Link href="/browse" className="btn-primary w-full justify-center">Back to Browse</Link>
            </div>
        </div>
    )

    const conditionInfo = CONDITIONS[listing.condition as keyof typeof CONDITIONS] || CONDITIONS.good
    const sellerFullName = listing.seller?.full_name || 'Anonymous'
    const sellerInitials = sellerFullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-28 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-dark-500 mb-8">
                        <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
                        <span>/</span>
                        <span className="text-dark-300 truncate">{listing.title}</span>
                    </nav>

                    <div className="grid lg:grid-cols-12 gap-12">
                        {/* Images Section (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-dark-800 glass-card">
                                <Image
                                    src={listing.images[activeImage] || '/placeholder-product.jpg'}
                                    alt={listing.title}
                                    fill
                                    className="object-contain"
                                    priority
                                />

                                {listing.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setActiveImage(prev => (prev === 0 ? listing.images.length - 1 : prev - 1))}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary-500 transition-all"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => setActiveImage(prev => (prev === listing.images.length - 1 ? 0 : prev + 1))}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary-500 transition-all"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {listing.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 transition-all ${activeImage === idx ? 'ring-2 ring-primary-500 scale-95' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info Section (5 cols) */}
                        <div className="lg:col-span-5 space-y-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${conditionInfo.bg} ${conditionInfo.color}`}>
                                        {conditionInfo.label}
                                    </span>
                                    <span className="text-dark-500 text-sm flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatRelativeTime(listing.created_at)}
                                    </span>
                                    <span className="text-dark-500 text-sm flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {listing.views_count} views
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                                    {listing.title}
                                </h1>
                                <div className="text-4xl font-bold gradient-text">
                                    {formatPrice(listing.price)}
                                </div>
                            </div>

                            {/* Actions */}
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
                                    className={`w-16 rounded-2xl border-2 flex items-center justify-center transition-all ${isSaved ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/10 text-dark-400 hover:border-white/30 hover:text-white'}`}
                                >
                                    <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                                </button>
                                <button className="w-16 rounded-2xl border-2 border-white/10 flex items-center justify-center text-dark-400 hover:border-white/30 hover:text-white transition-all">
                                    <Share2 className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Details Card */}
                            <div className="glass-card p-6 space-y-6">
                                <h3 className="text-white font-bold text-lg">Description</h3>
                                <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">
                                    {listing.description || 'No description provided.'}
                                </p>

                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                    <div className="space-y-1">
                                        <span className="text-xs text-dark-500 uppercase font-bold tracking-wider">Location</span>
                                        <p className="text-white flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary-400" />
                                            {listing.location || 'Campus'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-dark-500 uppercase font-bold tracking-wider">Campus</span>
                                        <p className="text-white truncate">{listing.college?.name || 'Campus Member'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Seller Card */}
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {listing.seller?.avatar_url ? (
                                                <Image src={listing.seller.avatar_url} alt={listing.seller.full_name || 'Seller'} width={56} height={56} className="rounded-2xl" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl font-bold text-white shadow-lg overflow-hidden capitalize">
                                                    {sellerInitials}
                                                </div>
                                            )}
                                            {listing.seller?.is_verified && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-dark-900 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white">{listing.seller?.full_name || 'Anonymous'}</h4>
                                            <p className="text-sm text-dark-400">Student at {listing.college?.name || 'Campus'}</p>
                                        </div>
                                    </div>
                                    <Link href={`/profile/${listing.seller_id}`} className="text-sm font-bold text-primary-400 hover:text-primary-300">View Profile</Link>
                                </div>
                                <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-primary-400 shrink-0" />
                                    <p className="text-xs text-dark-300 leading-relaxed">
                                        <span className="text-primary-400 font-bold">Safety Tip:</span> For your safety, always meet in public areas of the campus during daylight hours. Never pay in advance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

function Check({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
    )
}
