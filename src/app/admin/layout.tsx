'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShieldCheck,
    ClipboardList,
    Users,
    History,
    LogOut,
    Bell,
    Search,
    UserCircle,
    Menu,
    X,
    ChevronRight,
    ExternalLink
} from 'lucide-react'
import Logo from '@/components/ui/Logo'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import AdminGuard from '@/components/auth/AdminGuard'

const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'ID Verifications', href: '/admin/verifications', icon: ShieldCheck, type: 'id_verification' },
    { name: 'Listing Approvals', href: '/admin/listings', icon: ClipboardList, type: 'listing_approval' },
    { name: 'User Management', href: '/admin/users', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { signOut } = useAuth()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const [stats, setStats] = useState({ pendingIDs: 0, pendingListings: 0 })
    const supabase = createClient()

    useEffect(() => {
        const fetchCounts = async () => {
            const [ids, listings] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending').not('id_card_url', 'is', null),
                supabase.from('listings').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending')
            ])
            setStats({
                pendingIDs: ids.count || 0,
                pendingListings: listings.count || 0
            })
        }
        fetchCounts()

        // Realtime subscription for updates
        const channel = supabase.channel('admin_counts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCounts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchCounts)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    return (
        <AdminGuard>
            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-surface-200 z-50 transition-transform duration-300 transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="h-full flex flex-col p-6">
                        {/* Logo */}
                        <div className="mb-10 px-2 flex items-center justify-between">
                            <Link href="/">
                                <Logo className="scale-90 origin-left" />
                            </Link>
                            <button className="lg:hidden text-surface-400 p-1" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1.5">
                            <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-3 mb-4">
                                Main Menu
                            </p>
                            {sidebarLinks.map((link) => {
                                const isActive = pathname === link.href
                                const badgeCount = link.type === 'id_verification' ? stats.pendingIDs : link.type === 'listing_approval' ? stats.pendingListings : 0
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                            : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-surface-400 group-hover:text-primary-500'}`} />
                                            <span className="text-sm font-bold">{link.name}</span>
                                        </div>
                                        {badgeCount > 0 && (
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-600'
                                                }`}>
                                                {badgeCount}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* bottom profile */}
                        <div className="mt-auto pt-6 border-t border-surface-100">
                            <div className="bg-surface-50 rounded-2xl p-4 mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                        U
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-black text-surface-900 truncate">Utkarsh</p>
                                        <p className="text-[10px] font-bold text-surface-500 truncate uppercase tracking-tight">Super Admin</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout Session
                                </button>
                            </div>
                            <Link
                                href="/"
                                className="flex items-center justify-center gap-2 text-[10px] font-black text-surface-400 uppercase tracking-widest hover:text-primary-500 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Visit Live Site
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`lg:pl-72 min-h-screen transition-all duration-300`}>
                    {/* Header */}
                    <header className="h-20 bg-white border-b border-surface-200 sticky top-0 z-30 px-6 md:px-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="lg:hidden p-2 text-surface-600 hover:bg-surface-50 rounded-xl" onClick={() => setIsSidebarOpen(true)}>
                                <Menu className="w-6 h-6" />
                            </button>
                            <h2 className="text-lg font-black text-surface-900 hidden md:block">
                                {sidebarLinks.find(l => l.href === pathname)?.name || 'Admin Panel'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Search bar */}
                            <div className="hidden sm:flex items-center relative mr-2">
                                <Search className="absolute left-3 w-4 h-4 text-surface-400" />
                                <input
                                    type="text"
                                    placeholder="Search everything..."
                                    className="pl-10 pr-4 py-2 bg-surface-50 border-none rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                />
                            </div>

                            {/* Notifications */}
                            <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface-50 hover:bg-surface-100 text-surface-600 transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>

                            <div className="h-8 w-px bg-surface-200 mx-1 hidden sm:block" />

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-black text-surface-900 leading-none">Super Admin</p>
                                    <p className="text-[10px] font-bold text-surface-400 mt-1">{SUPER_ADMIN_EMAIL}</p>
                                </div>
                                <div className="w-10 h-10 rounded-[14px] bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-soft">
                                    <UserCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AdminGuard>
    )
}
