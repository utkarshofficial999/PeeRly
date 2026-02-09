'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Search, Plus, User, Bell, MessageSquare, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const router = useRouter()
    const { user, profile, isLoading, signOut } = useAuth()
    const supabase = useMemo(() => createClient(), [])

    // DEBUG: Log auth state
    useEffect(() => {
        console.log('🔍 Header Auth State:', {
            isLoading,
            hasUser: !!user,
            userId: user?.id,
            hasProfile: !!profile,
            profileName: profile?.full_name
        })
    }, [isLoading, user, profile])

    // Fetch and subscribe to unread messages count
    useEffect(() => {
        if (!user) {
            setUnreadCount(0)
            return
        }

        let isMounted = true
        let channel: ReturnType<typeof supabase.channel> | null = null

        const fetchUnreadCount = async () => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            try {
                // Get all conversations where user is participant
                const { data: conversations, error: convError } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                    .abortSignal(controller.signal)

                if (convError || !isMounted) return

                if (!conversations || conversations.length === 0) {
                    if (isMounted) setUnreadCount(0)
                    return
                }

                const convIds = conversations.map((c: { id: string }) => c.id)

                // Count unread messages not sent by current user
                const { count, error: msgError } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', convIds)
                    .neq('sender_id', user.id)
                    .eq('is_read', false)
                    .abortSignal(controller.signal)

                if (msgError || !isMounted) return

                setUnreadCount(count || 0)
            } catch (err: any) {
                // Ignore abort errors - these happen during normal cleanup or timeout
                if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
                    return
                }
                console.error('Error fetching unread count:', err)
            } finally {
                clearTimeout(timeoutId)
            }
        }

        // Small delay to prevent race conditions with auth
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                fetchUnreadCount()

                // Subscribe to new messages for real-time updates
                channel = supabase
                    .channel(`unread-messages-${user.id}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'messages'
                    }, () => {
                        if (isMounted) fetchUnreadCount()
                    })
                    .subscribe()
            }
        }, 500)

        return () => {
            isMounted = false
            clearTimeout(timeoutId)
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [user, supabase])

    const handleSignOut = async () => {
        setIsProfileOpen(false)
        setIsMenuOpen(false) // Also close mobile menu
        await signOut()
        router.refresh()
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="mx-0 md:mx-4 md:mt-4 mt-0">
                <nav className="soft-glass px-4 md:px-6 py-3 md:py-3 max-w-7xl mx-auto rounded-none md:rounded-3xl shadow-soft md:border-white/40">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group">
                            <Logo className="transition-transform duration-300 group-hover:scale-105" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            <Link href="/browse" className="nav-link">
                                Browse
                            </Link>
                            <Link href="/browse?category=textbooks" className="nav-link">
                                Textbooks
                            </Link>
                            <Link href="/browse?category=electronics" className="nav-link">
                                Electronics
                            </Link>
                            <Link href="/how-it-works" className="nav-link">
                                How It Works
                            </Link>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Search */}
                            <button className="p-2.5 text-surface-600 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all">
                                <Search className="w-5 h-5" />
                            </button>

                            {isLoading ? (
                                <div className="w-10 h-10 rounded-xl bg-surface-100 animate-pulse" />
                            ) : user ? (
                                <>
                                    {/* Notifications */}
                                    <button className="p-2.5 text-surface-600 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all relative">
                                        <Bell className="w-5 h-5" />
                                    </button>
                                    {/* Messages */}
                                    <Link href="/messages" className="p-2.5 text-surface-600 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all relative">
                                        <MessageSquare className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-peach-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-peach-400/30">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                    {/* Sell Button */}
                                    <Link href="/create" className="btn-primary py-2.5 px-6 rounded-2xl">
                                        <Plus className="w-4 h-4" />
                                        Post
                                    </Link>
                                    {/* Admin Link (Desktop) */}
                                    {user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                                        <Link href="/admin" className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Admin Panel">
                                            <ShieldCheck className="w-5 h-5" />
                                        </Link>
                                    )}
                                    {/* Profile Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="w-11 h-11 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity ring-2 ring-primary-500/10 hover:ring-primary-500 shadow-soft"
                                        >
                                            {profile?.avatar_url ? (
                                                <NextImage
                                                    src={profile.avatar_url}
                                                    alt="Profile"
                                                    width={44}
                                                    height={44}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                                                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                                                </div>
                                            )}
                                        </button>
                                        {/* Dropdown Menu */}
                                        {isProfileOpen && (
                                            <>
                                                {/* Backdrop to close dropdown when clicking outside */}
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsProfileOpen(false)}
                                                />
                                                <div className="absolute right-0 top-full mt-3 w-56 p-2 bg-white rounded-3xl shadow-premium z-50 animate-in fade-in slide-in-from-top-1">
                                                    <div className="px-4 py-3 border-b border-surface-100 mb-1">
                                                        <p className="text-sm font-black text-surface-900 truncate">{profile?.full_name}</p>
                                                        <p className="text-xs font-bold text-surface-600 truncate mt-0.5">{user.email}</p>
                                                    </div>
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-surface-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                    >
                                                        <User className="w-4 h-4 text-primary-500" />
                                                        Dashboard
                                                    </Link>
                                                    {user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                                                        <Link
                                                            href="/admin"
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                            Admin Panel
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href="/settings"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-surface-700 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                    >
                                                        <Plus className="w-4 h-4 text-primary-500" />
                                                        Account Settings
                                                    </Link>
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="w-full mt-1 flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-peach-500 hover:bg-peach-50 rounded-xl transition-all"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link href="/login" className="btn-secondary py-2.5 px-6 border-none hover:bg-primary-50 hover:text-primary-600">
                                        Log In
                                    </Link>
                                    <Link href="/signup" className="btn-primary py-2.5 px-6">
                                        Join PeerLY
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 text-surface-700 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="lg:hidden pt-4 mt-4 border-t border-surface-100 animate-slide-down">
                            <div className="flex flex-col gap-2 p-2">
                                <Link href="/browse" className="nav-link !flex items-center py-3">
                                    Browse All
                                </Link>
                                <Link href="/browse?category=textbooks" className="nav-link !flex items-center py-3">
                                    Textbooks
                                </Link>
                                <Link href="/browse?category=electronics" className="nav-link !flex items-center py-3">
                                    Electronics
                                </Link>
                                <Link href="/how-it-works" className="nav-link !flex items-center py-3">
                                    How It Works
                                </Link>
                                <hr className="border-surface-100 my-2" />
                                {user ? (
                                    <>
                                        <Link href="/create" className="btn-primary justify-center">
                                            <Plus className="w-4 h-4" />
                                            Post Listing
                                        </Link>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <Link href="/messages" className="btn-secondary justify-center py-3 text-sm px-4">
                                                Messages
                                                {unreadCount > 0 && (
                                                    <span className="ml-1 bg-peach-400 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Link>
                                            <Link href="/dashboard" className="btn-secondary justify-center py-3 text-sm px-4">
                                                Dashboard
                                            </Link>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="btn-secondary mt-2 justify-center text-peach-500 border-peach-100 hover:bg-peach-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Link href="/login" className="btn-secondary justify-center">
                                            Log In
                                        </Link>
                                        <Link href="/signup" className="btn-primary justify-center">
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    )
}
