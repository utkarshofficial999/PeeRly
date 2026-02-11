'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function SavedItemsPage() {
    const { user } = useAuth()
    const [savedItems, setSavedItems] = useState<any[]>([])
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

    const fetchSavedItems = useCallback(async () => {
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
                console.warn('Saved items fetch timed out')
            }
        }, 10000)

        try {
            // Fetch saved_listings joined with listings
            const { data, error } = await supabase
                .from('saved_listings')
                .select(`
                    listing_id,
                    listings (*)
                `)
                .eq('user_id', user.id)
                .abortSignal(controller.signal)

            if (error) throw error
            if (!isMountedRef.current || requestCountRef.current !== currentReqId) return

            if (data) {
                setSavedItems(data.map((item: any) => item.listings))
            }
        } catch (err: any) {
            if (!isMountedRef.current || requestCountRef.current !== currentReqId) return
            if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
            console.error('Error fetching saved items:', err)
        } finally {
            clearTimeout(timeoutId)
            if (isMountedRef.current && requestCountRef.current === currentReqId) {
                setIsLoading(false)
            }
        }
    }, [user, supabase])

    useEffect(() => {
        if (user) {
            fetchSavedItems()
        }
    }, [user, fetchSavedItems])

    const removeSaved = async (id: string) => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('saved_listings')
                .delete()
                .eq('user_id', user.id)
                .eq('listing_id', id)

            if (error) throw error
            setSavedItems(prev => prev.filter(item => item.id !== id))
        } catch (err) {
            console.error('Error removing saved item:', err)
            alert('Failed to remove item from saved list.')
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-3xl font-display font-bold text-surface-900 mb-2">Saved Items</h1>
                        <p className="text-surface-500 font-bold">Keep track of the things you&apos;re interested in.</p>
                    </div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="glass-card h-80 animate-pulse" />
                            ))}
                        </div>
                    ) : savedItems.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {savedItems.map((item) => (
                                <div key={item.id} className="glass-card overflow-hidden group h-full flex flex-col">
                                    <div className="aspect-[4/5] bg-surface-100 relative overflow-hidden">
                                        {item.images?.[0] && (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )}
                                        <button
                                            onClick={() => removeSaved(item.id)}
                                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            <Heart className="w-5 h-5 fill-current" />
                                        </button>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-surface-900 font-bold mb-1 truncate">{item.title}</h3>
                                        <p className="text-primary-600 font-bold mb-4">₹{item.price}</p>
                                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                            <Link href={`/listing/${item.id}`} className="text-sm font-bold text-surface-900 hover:text-primary-600 transition-colors flex items-center gap-1 group/link">
                                                View Details <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 glass-card">
                            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-10 h-10 text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-surface-900 mb-2">No saved items</h2>
                            <p className="text-surface-400 mb-8 max-w-sm mx-auto italic">
                                &quot;Found something interesting? Save listings and come back later without searching again.&quot;
                            </p>
                            <Link href="/browse" className="btn-secondary px-8 py-3 mx-auto flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                Continue Browsing
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
