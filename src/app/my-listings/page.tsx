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
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-24 md:pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-surface-900 mb-2">My Listings</h1>
                            <p className="text-surface-700 font-bold">Manage items you&apos;ve posted for sale or rent.</p>
                        </div>
                        <Link href="/create" className="btn-primary px-6 py-3">
                            <Plus className="w-5 h-5" />
                            Create New Listing
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="premium-card h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : listings.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((item) => (
                                <div key={item.id} className="premium-card overflow-hidden group hover:shadow-premium hover:-translate-y-1 transition-all">
                                    <div className="aspect-video bg-surface-200 relative">
                                        {item.images?.[0] && (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button className="p-2 rounded-lg bg-white/90 text-surface-900 backdrop-blur-md shadow-soft hover:bg-primary-600 hover:text-white transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-white/90 text-red-500 backdrop-blur-md shadow-soft hover:bg-red-600 hover:text-white transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-black text-surface-900 truncate">{item.title}</h3>
                                            <span className="text-primary-600 font-black">₹{item.price}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-surface-700 font-bold mb-6">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4 text-surface-400" />
                                                {item.views_count || 0} views
                                            </span>
                                            <span className={`px-3 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider ${item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-surface-200 text-surface-700'}`}>
                                                {item.is_active ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                        <Link href={`/listing/${item.id}`} className="text-center block w-full py-3 rounded-xl bg-surface-50 text-surface-900 font-black border border-surface-100 hover:bg-white hover:shadow-soft transition-all">
                                            View Stats
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 premium-card">
                            <div className="w-20 h-20 rounded-3xl bg-surface-50 border border-surface-100 flex items-center justify-center mx-auto mb-6">
                                <Package className="w-10 h-10 text-surface-400" />
                            </div>
                            <h2 className="text-2xl font-black text-surface-900 mb-2">No listings yet</h2>
                            <p className="text-surface-600 font-bold mb-8 max-w-sm mx-auto">
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
