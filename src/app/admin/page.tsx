'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Users,
    ShieldCheck,
    ClipboardList,
    XCircle,
    ArrowUpRight,
    TrendingUp,
    Clock,
    UserCheck,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        verifiedUsers: 0,
        pendingIDs: 0,
        pendingListings: 0,
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true)
            try {
                // Fetch stats in parallel
                const [users, verified, ids, listings, logs] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
                    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
                    supabase.from('audit_logs')
                        .select('*, profiles!audit_logs_actor_id_fkey(full_name)')
                        .order('created_at', { ascending: false })
                        .limit(5)
                ])

                setStats({
                    totalUsers: users.count || 0,
                    verifiedUsers: verified.count || 0,
                    pendingIDs: ids.count || 0,
                    pendingListings: listings.count || 0,
                })

                if (logs.data) {
                    setRecentActivity(logs.data)
                }
            } catch (err) {
                console.error('Dashboard fetch failed:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [supabase])

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            color: 'text-blue-600',
            lightColor: 'bg-blue-50',
            href: '/admin/users'
        },
        {
            label: 'Verified Students',
            value: stats.verifiedUsers.toLocaleString(),
            icon: UserCheck,
            color: 'text-emerald-600',
            lightColor: 'bg-emerald-50',
            href: '/admin/users'
        },
        {
            label: 'Pending IDs',
            value: stats.pendingIDs.toLocaleString(),
            icon: ShieldCheck,
            color: 'text-amber-600',
            lightColor: 'bg-amber-50',
            href: '/admin/verifications'
        },
        {
            label: 'Pending Listings',
            value: stats.pendingListings.toLocaleString(),
            icon: ClipboardList,
            color: 'text-indigo-600',
            lightColor: 'bg-indigo-50',
            href: '/admin/listings'
        },
    ]

    const getLogActionIcon = (action: string) => {
        if (action.includes('approve')) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        if (action.includes('reject')) return <XCircle className="w-5 h-5 text-red-600" />
        return <Clock className="w-5 h-5 text-amber-600" />
    }

    const getLogBgColor = (action: string) => {
        if (action.includes('approve')) return 'bg-emerald-50 border-emerald-100'
        if (action.includes('reject')) return 'bg-red-50 border-red-100'
        return 'bg-amber-50 border-amber-100'
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-surface-400 font-bold uppercase tracking-widest text-xs">Aggregating System Intelligence...</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight">System Overview</h1>
                    <p className="text-surface-500 font-bold mt-1">Monitor PeerLY performance and security metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-xs font-black text-surface-600 shadow-sm">
                        <Calendar className="w-4 h-4 text-surface-400" />
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - Today
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <Link key={i} href={stat.href} className="premium-card p-6 group hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.lightColor} ${stat.color} transition-colors group-hover:bg-primary-50 group-hover:text-primary-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-surface-50 text-surface-400 flex items-center gap-1 uppercase tracking-tight">
                                Live Meta
                            </span>
                        </div>
                        <p className="text-sm font-bold text-surface-500">{stat.label}</p>
                        <h3 className="text-3xl font-black text-surface-900 mt-1">{stat.value}</h3>
                        <div className="mt-4 pt-4 border-t border-surface-50 flex items-center justify-between group-hover:border-primary-50 transition-colors">
                            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Process Queue</span>
                            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 premium-card p-8 bg-white overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-surface-900 tracking-tight">Recent Audit Logs</h3>
                            <p className="text-sm font-bold text-surface-400">Chronological list of admin actions</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {recentActivity.length > 0 ? recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${getLogBgColor(activity.action)}`}>
                                    {getLogActionIcon(activity.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-surface-900">
                                        <span className="text-primary-600 uppercase text-[11px] tracking-tight">{activity.profiles?.full_name || 'System Admin'}</span>
                                        <span className="text-surface-400 mx-1.5">•</span>
                                        <span className="capitalize">{activity.action.replace(/_/g, ' ')}</span>
                                    </p>
                                    <p className="text-xs font-bold text-surface-400 mt-0.5">
                                        {activity.details?.listing_title || activity.details?.user_email || 'General modification'}
                                        <span className="mx-2">—</span>
                                        {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="text-[10px] font-black text-surface-300 uppercase tracking-widest">{new Date(activity.created_at).toLocaleDateString()}</div>
                            </div>
                        )) : (
                            <div className="py-10 text-center">
                                <Clock className="w-8 h-8 text-surface-200 mx-auto mb-3" />
                                <p className="text-surface-400 font-bold">No recent audit activity found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Summary */}
                <div className="premium-card p-8 bg-[#0F172A] text-white">
                    <h3 className="text-xl font-black mb-2 tracking-tight">Moderation Desk</h3>
                    <p className="text-surface-400 text-sm font-bold mb-8">System critical tasks for today</p>

                    <div className="space-y-3">
                        <Link href="/admin/verifications" className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-amber-400" />
                                <span className="text-sm font-bold">Verify Pending IDs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {stats.pendingIDs > 0 && (
                                    <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-black">{stats.pendingIDs}</span>
                                )}
                                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </Link>

                        <Link href="/admin/listings" className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-bold">Approve Listings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {stats.pendingListings > 0 && (
                                    <span className="bg-indigo-400/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-black">{stats.pendingListings}</span>
                                )}
                                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </Link>

                        <Link href="/admin/users" className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-blue-400" />
                                <span className="text-sm font-bold">Manage Students</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </Link>

                        <div className="pt-6 mt-6 border-t border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-surface-400 uppercase tracking-widest">Platform Health</span>
                                <span className="text-xs font-black text-white">Optimal</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[100%] rounded-full shadow-lg shadow-emerald-500/20" />
                            </div>
                            <p className="text-[10px] font-bold text-surface-500 mt-4 leading-relaxed">
                                System is stable. All background workers are operational.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
