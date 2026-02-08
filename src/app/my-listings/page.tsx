'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Plus, Package, Edit2, Trash2, Eye, LayoutGrid, List } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function MyListingsPage() {
    const { user, isLoading: authLoading } = useAuth()
    const [listings, setListings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMountedRef = useRef(true)
    const requestCountRef = useRef(0)

    // Handle mount/unmount
    useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
        }
    }, [])

    const fetchMyListings = useCallback(async () => {
        if (!user) return
        const currentReqId = ++requestCountRef.current

        if (abortControllerRef.current) abortControllerRef.current.abort()

        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsLoading(true)
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && requestCountRef.current === currentReqId) {
                controller.abort()
                setIsLoading(false)
                console.warn('My listings fetch timed out')
            }
        }, 10000)

        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false })
                .abortSignal(controller.signal)

            if (error) throw error
            if (!isMountedRef.current || requestCountRef.current !== currentReqId) return

            if (data) setListings(data)
        } catch (err: any) {
            if (!isMountedRef.current || requestCountRef.current !== currentReqId) return
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
            console.error('Error fetching my listings:', err)
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current && requestCountRef.current === currentReqId) {
                setIsLoading(false)
            }
        }
    }, [user, supabase])

    useEffect(() => {
        if (user) {
            fetchMyListings()
        }
    }, [user, fetchMyListings])

    return (
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white mb-2">My Listings</h1>
                            <p className="text-dark-400">Manage items you&apos;ve posted for sale or rent.</p>
                        </div>
                        <Link href="/create" className="btn-primary px-6 py-3">
                            <Plus className="w-5 h-5" />
                            Create New Listing
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass-card h-64 animate-pulse bg-white/5" />
                            ))}
                        </div>
                    ) : listings.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((item) => (
                                <div key={item.id} className="glass-card overflow-hidden group">
                                    <div className="aspect-video bg-dark-800 relative">
                                        {item.images?.[0] && (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button className="p-2 rounded-lg bg-dark-900/80 text-white backdrop-blur-md hover:bg-primary-500 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-dark-900/80 text-red-400 backdrop-blur-md hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-white truncate">{item.title}</h3>
                                            <span className="text-primary-400 font-bold">₹{item.price}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-dark-400 mb-6">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {item.views_count || 0} views
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                                                {item.is_active ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                        <Link href={`/listing/${item.id}`} className="text-center block w-full py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">
                                            View Stats
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass-card">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                <Package className="w-10 h-10 text-dark-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">No listings yet</h2>
                            <p className="text-dark-400 mb-8 max-w-sm mx-auto">
                                You haven&apos;t posted any items yet. Start selling to see your listings here.
                            </p>
                            <Link href="/create" className="btn-primary px-8 py-3 mx-auto flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Post Your First Item
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
