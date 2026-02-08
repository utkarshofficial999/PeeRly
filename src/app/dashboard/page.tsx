'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import { Plus, Package, Heart, MessageSquare, Settings, ChevronRight, TrendingUp, Eye, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
    activeListings: number
    totalViews: number
    savedItems: number
    messages: number
}

export default function DashboardPage() {
    const { user, profile, isLoading } = useAuth()
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
        }
    }, [user, fetchDashboardData])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
        )
    }

    const quickActions = [
        { label: 'Sell Item', icon: Plus, href: '/create', color: 'primary' },
        { label: 'My Listings', icon: Package, href: '/my-listings', color: 'accent' },
        { label: 'Saved', icon: Heart, href: '/saved', color: 'rose' },
        { label: 'Messages', icon: MessageSquare, href: '/messages', color: 'blue', badge: stats.messages },
        { label: 'Settings', icon: Settings, href: '/settings', color: 'gray' },
    ]

    const statsCards = [
        { label: 'Active Listings', value: stats.activeListings, icon: Package, color: 'primary' },
        { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'accent' },
        { label: 'Saved Items', value: stats.savedItems, icon: Heart, color: 'rose' },
        { label: 'Unread Messages', value: stats.messages, icon: MessageSquare, color: 'blue' },
    ]

    return (
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-24 md:pt-32 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                        </h1>
                        <p className="text-dark-400">
                            Here&apos;s what&apos;s happening with your listings
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {statsCards.map((stat, index) => (
                            <div key={index} className="glass-card p-5">
                                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${stat.color === 'primary' ? 'bg-primary-500/20 text-primary-400' :
                                    stat.color === 'accent' ? 'bg-accent-500/20 text-accent-400' :
                                        stat.color === 'rose' ? 'bg-rose-500/20 text-rose-400' :
                                            'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-dark-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {quickActions.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className="relative flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${action.color === 'primary' ? 'bg-primary-500/20 text-primary-400' :
                                        action.color === 'accent' ? 'bg-accent-500/20 text-accent-400' :
                                            action.color === 'rose' ? 'bg-rose-500/20 text-rose-400' :
                                                action.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-dark-700 text-dark-300'
                                        }`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm text-dark-300 group-hover:text-white transition-colors">
                                        {action.label}
                                    </span>
                                    {action.badge && action.badge > 0 && (
                                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                            {action.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Listings */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Your Recent Listings</h2>
                            <Link href="/my-listings" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {recentListings.length > 0 ? (
                            <div className="space-y-3">
                                {recentListings.map((listing) => (
                                    <Link
                                        key={listing.id}
                                        href={`/listing/${listing.id}`}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                        <div className="w-16 h-16 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
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
                                            <h3 className="text-white font-medium truncate">{listing.title}</h3>
                                            <p className="text-primary-400 font-semibold">₹{listing.price}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-dark-400">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {listing.views_count || 0}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${listing.is_sold ? 'bg-emerald-500/20 text-emerald-400' :
                                                listing.is_active ? 'bg-primary-500/20 text-primary-400' :
                                                    'bg-dark-700 text-dark-400'
                                                }`}>
                                                {listing.is_sold ? 'Sold' : listing.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">No listings yet</h3>
                                <p className="text-dark-400 mb-4">Start selling to see your listings here</p>
                                <Link href="/create" className="btn-primary inline-flex">
                                    <Plus className="w-4 h-4" />
                                    Create Your First Listing
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
