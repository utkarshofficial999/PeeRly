'use client'

import React from 'react'
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
    Calendar
} from 'lucide-react'

const stats = [
    {
        label: 'Total Users',
        value: '1,284',
        change: '+12%',
        trend: 'up',
        icon: Users,
        color: 'bg-blue-500',
        lightColor: 'bg-blue-50',
        textColor: 'text-blue-600'
    },
    {
        label: 'Verified Students',
        value: '842',
        change: '+18%',
        trend: 'up',
        icon: UserCheck,
        color: 'bg-emerald-500',
        lightColor: 'bg-emerald-50',
        textColor: 'text-emerald-600'
    },
    {
        label: 'Pending IDs',
        value: '42',
        change: '-5%',
        trend: 'down',
        icon: ShieldCheck,
        color: 'bg-amber-500',
        lightColor: 'bg-amber-50',
        textColor: 'text-amber-600'
    },
    {
        label: 'Pending Listings',
        value: '156',
        change: '+24%',
        trend: 'up',
        icon: ClipboardList,
        color: 'bg-indigo-500',
        lightColor: 'bg-indigo-50',
        textColor: 'text-indigo-600'
    },
]

const recentActivity = [
    { id: 1, user: 'Aryan Singh', action: 'Approved ID Verification', time: '2 mins ago', type: 'success' },
    { id: 2, user: 'Rahul Kumar', action: 'Rejected Listing: MacBook Pro', time: '15 mins ago', type: 'error' },
    { id: 3, user: 'Ishita Goyal', action: 'Submitted ID for Review', time: '45 mins ago', type: 'pending' },
    { id: 4, user: 'Priya Sharma', action: 'Approved Listing: Books Set', time: '1 hour ago', type: 'success' },
]

export default function AdminPage() {
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
                        Feb 9, 2026 - Today
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="premium-card p-6 group hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.lightColor} ${stat.textColor} transition-colors group-hover:bg-primary-50 group-hover:text-primary-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} flex items-center gap-1`}>
                                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-surface-500">{stat.label}</p>
                        <h3 className="text-3xl font-black text-surface-900 mt-1">{stat.value}</h3>
                        <div className="mt-4 pt-4 border-t border-surface-50 flex items-center justify-between group-hover:border-primary-50 transition-colors">
                            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">View details</span>
                            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 premium-card p-8 bg-white overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-surface-900 tracking-tight">Audit Heatmap</h3>
                            <p className="text-sm font-bold text-surface-400">Chronological list of admin actions</p>
                        </div>
                        <button className="text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest">See all logs</button>
                    </div>

                    <div className="space-y-6">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 group">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${activity.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                    activity.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                                        'bg-amber-50 border-amber-100 text-amber-600'
                                    }`}>
                                    {activity.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                        activity.type === 'error' ? <XCircle className="w-5 h-5" /> :
                                            <Clock className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-surface-900">
                                        <span className="text-primary-600 hover:underline cursor-pointer">{activity.user}</span>
                                        <span className="text-surface-400 mx-1.5">•</span>
                                        {activity.action}
                                    </p>
                                    <p className="text-xs font-bold text-surface-400 mt-0.5">{activity.time}</p>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-surface-50 rounded-xl transition-all">
                                    <ArrowUpRight className="w-4 h-4 text-surface-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions / Summary */}
                <div className="premium-card p-8 bg-[#0F172A] text-white">
                    <h3 className="text-xl font-black mb-2 tracking-tight">Quick Actions</h3>
                    <p className="text-surface-400 text-sm font-bold mb-8">System critical tasks for today</p>

                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-amber-400" />
                                <span className="text-sm font-bold">Verify Pending IDs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-amber-400/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-black">42</span>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-bold">Approve Listings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-400/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-black">156</span>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                            </div>
                        </button>

                        <div className="pt-6 mt-6 border-t border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-surface-400 uppercase tracking-widest">Monthly Goal</span>
                                <span className="text-xs font-black text-white">84%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-primary w-[84%] rounded-full shadow-lg shadow-primary-500/20" />
                            </div>
                            <p className="text-[10px] font-bold text-surface-500 mt-4 leading-relaxed">
                                You are doing great, Utkarsh! 156 more listings to reach 1,000 active items.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ChevronRight({ className }: { className?: string }) {
    return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
}
