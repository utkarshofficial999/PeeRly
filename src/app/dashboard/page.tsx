'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import { Plus, Package, Heart, MessageSquare, Settings, ChevronRight, TrendingUp, Eye, DollarSign, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

interface DashboardStats {
    activeListings: number
    totalViews: number
    savedItems: number
    messages: number
}

export default function DashboardPage() {
    const { user, profile, isLoading, refreshProfile } = useAuth()
    const router = useRouter() // Use router for redirection
    const [stats, setStats] = useState<DashboardStats>({
        activeListings: 0,
        totalViews: 0,
        savedItems: 0,
        messages: 0,
    })

    // Redirect if not logged in after loading
    useEffect(() => {
        if (!isLoading && !user) {
            console.log('🔐 Dashboard: No user session, redirecting to login')
            window.location.href = '/login?redirectTo=/dashboard'
        }
    }, [user, isLoading])
    const [recentListings, setRecentListings] = useState<any[]>([])
    const supabase = createClient()

    const fetchDashboardData = useCallback(async () => {
        if (!user) return

        // Fetch user's listings
        const { data: listings, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

        if (listings) {
            setRecentListings(listings)
            const totalViews = listings.reduce((sum: number, l: any) => sum + (l.views_count || 0), 0)
            setStats(prev => ({
                ...prev,
                activeListings: listings.filter((l: any) => l.is_active && !l.is_sold).length,
                totalViews,
            }))
        }

        // Fetch saved items count
        const { count: savedCount } = await supabase
            .from('saved_listings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (savedCount !== null) {
            setStats(prev => ({ ...prev, savedItems: savedCount }))
        }

        // Fetch unread messages count
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

        if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map((c: any) => c.id)
            const { count: messageCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversationIds)
                .eq('is_read', false)
                .neq('sender_id', user.id)

            if (messageCount !== null) {
                setStats(prev => ({ ...prev, messages: messageCount }))
            }
        }
    }, [user, supabase])

    useEffect(() => {
        if (user) {
            fetchDashboardData()
            refreshProfile() // Refresh profile to get updated verification status
        }
    }, [user, fetchDashboardData, refreshProfile])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
            </div>
        )
    }

    const quickActions = [
        { label: 'Sell Item', icon: Plus, href: '/create', color: 'primary' },
        { label: 'My Listings', icon: Package, href: '/my-listings', color: 'accent' },
        ...(user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? [
            { label: 'Admin Console', icon: ShieldCheck, href: '/admin', color: 'sapphire' }
        ] : []),
        { label: 'Saved', icon: Heart, href: '/saved', color: 'rose' },
        { label: 'Messages', icon: MessageSquare, href: '/messages', color: 'blue', badge: stats.messages },
        { label: 'Settings', icon: Settings, href: '/settings', color: 'gray' },
    ]


    return (
        <div className="min-h-screen">
            <Header />

            <main className="pt-20 md:pt-28 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Section */}
                    <div className="mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-4xl font-black text-surface-900 mb-1 md:text-left text-center">
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                        </h1>
                        {/* Verification Banner */}
                        {profile?.verification_status === 'pending' && (
                            <div className="mb-8 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-amber-50 border-2 border-amber-100 flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                                    <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg md:text-xl font-black text-amber-900 mb-0.5 md:mb-1">Verification Pending</h3>
                                    <p className="text-amber-700 font-bold text-xs md:text-base">
                                        Your ID is currently being reviewed by our team. You'll get a verification badge once approved!
                                    </p>
                                </div>
                                <div className="px-5 py-1.5 bg-white rounded-xl text-amber-600 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-sm">
                                    Processing
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="premium-card bg-white/40 backdrop-blur-sm p-4 md:p-6 mb-6 md:mb-8">
                        <h2 className="text-base md:text-lg font-black text-surface-900 mb-3 md:mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                            {quickActions.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className="relative flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl bg-surface-50 hover:bg-white border border-surface-200 hover:border-primary-300 hover:shadow-soft transition-all group"
                                >
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 ${action.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                                        action.color === 'accent' ? 'bg-accent-50 text-accent-600' :
                                            action.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                                                action.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                                    action.color === 'sapphire' ? 'bg-indigo-50 text-indigo-600' :
                                                        'bg-surface-200 text-surface-600'
                                        }`}>
                                        <action.icon className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <span className="text-xs md:text-sm text-surface-900 font-black group-hover:text-primary-600 transition-colors">
                                        {action.label}
                                    </span>
                                    {action.badge && action.badge > 0 && (
                                        <span className="absolute top-1.5 md:top-2 right-1.5 md:right-2 min-w-[18px] h-[18px] md:w-5 md:h-5 rounded-full bg-red-500 text-white text-[10px] md:text-xs flex items-center justify-center font-bold">
                                            {action.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Listings */}
                    <div className="premium-card bg-white/40 backdrop-blur-sm p-4 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base md:text-lg font-black text-surface-900">Recent Listings</h2>
                            <Link href="/my-listings" className="text-primary-600 hover:text-primary-700 text-xs md:text-sm font-black flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {recentListings.length > 0 ? (
                            <div className="space-y-2 md:space-y-3">
                                {recentListings.map((listing) => (
                                    <Link
                                        key={listing.id}
                                        href={`/listing/${listing.id}`}
                                        className="flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-xl bg-surface-50 hover:bg-white border border-surface-100 hover:border-surface-200 hover:shadow-soft transition-all"
                                    >
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-surface-200 overflow-hidden shrink-0 relative">
                                            {listing.images?.[0] && (
                                                <Image
                                                    src={listing.images[0]}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs md:text-sm font-black text-surface-900 truncate uppercase tracking-tight">{listing.title}</h3>
                                            <p className="text-primary-600 text-xs md:text-sm font-black">₹{listing.price}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-wider border shadow-sm ${listing.is_sold ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                listing.approval_status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    listing.approval_status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        listing.is_active ? 'bg-primary-50 text-primary-600 border-primary-100' :
                                                            'bg-surface-200 text-surface-600 border-surface-200'
                                                }`}>
                                                {listing.is_sold ? 'Sold' :
                                                    listing.approval_status === 'pending' ? 'Pending' :
                                                        listing.approval_status === 'rejected' ? 'Rejected' :
                                                            listing.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] text-surface-400 font-bold">
                                                <Eye className="w-3 h-3" />
                                                {listing.views_count || 0}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 md:py-12">
                                <Package className="w-10 h-10 md:w-12 md:h-12 text-surface-200 mx-auto mb-3 md:mb-4" />
                                <h3 className="text-base md:text-lg font-black text-surface-900 mb-1 md:mb-2">No listings yet</h3>
                                <p className="text-xs md:text-sm text-surface-600 font-bold mb-4">Start selling to see your listings here</p>
                                <Link href="/create" className="btn-primary inline-flex text-xs px-6 py-2.5">
                                    <Plus className="w-4 h-4" />
                                    Post Your First
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
