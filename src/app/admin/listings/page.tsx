'use client'

import React, { useState, useEffect } from 'react'
import {
    ClipboardList,
    CheckCircle2,
    XCircle,
    Eye,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    Tag,
    User,
    Package,
    ShieldCheck,
    AlertCircle,
    ArrowUpRight,
    ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

interface PendingListing {
    id: string
    title: string
    price: number
    category_name: string
    seller_name: string
    seller_is_verified: boolean
    created_at: string
    images: string[]
    description: string
}

export default function ListingApprovalsPage() {
    const [listings, setListings] = useState<PendingListing[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [showRejectionModal, setShowRejectionModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchPendingListings()
    }, [])

    const fetchPendingListings = async () => {
        setIsLoading(true)
        setErrorMsg(null)
        try {
            // First attempt with full joins
            const { data, error } = await supabase
                .from('listings')
                .select(`
                    id, 
                    title, 
                    price, 
                    created_at, 
                    images, 
                    description,
                    approval_status,
                    seller_id,
                    categories(name),
                    profiles(full_name, is_verified)
                `)
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Initial fetch failed, trying fallback...', error)

                // Fallback: simpler select without joins
                const { data: simpleData, error: simpleError } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('approval_status', 'pending')
                    .order('created_at', { ascending: true })

                if (simpleError) throw simpleError

                if (simpleData) {
                    const formatted = simpleData.map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        price: l.price,
                        category_name: 'Item',
                        seller_name: 'Student Seller',
                        seller_is_verified: false,
                        created_at: l.created_at,
                        images: l.images || [],
                        description: l.description || ''
                    }))
                    setListings(formatted)
                    return
                }
            }

            if (data) {
                const formatted = data.map((l: any) => ({
                    id: l.id,
                    title: l.title,
                    price: l.price,
                    category_name: l.categories?.name || 'Other',
                    seller_name: l.profiles?.full_name || 'Student',
                    seller_is_verified: l.profiles?.is_verified || false,
                    created_at: l.created_at,
                    images: l.images || [],
                    description: l.description || ''
                }))
                setListings(formatted)
            }
        } catch (err: any) {
            console.error('Failed to fetch pending listings:', err)
            setErrorMsg(err.message || 'Failed to load moderation queue')
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = async (listing: PendingListing) => {
        setIsActionLoading(true)
        try {
            const { error } = await supabase
                .from('listings')
                .update({
                    approval_status: 'approved',
                    is_active: true
                })
                .eq('id', listing.id)

            if (error) throw error

            // Log action
            await supabase.from('audit_logs').insert({
                action: 'approve_listing',
                target_type: 'listing',
                target_id: listing.id,
                details: { listing_title: listing.title, seller: listing.seller_name }
            })

            setListings(prev => prev.filter(l => l.id !== listing.id))
            setShowPreview(false)
        } catch (err) {
            console.error('Approval failed:', err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedListing || !rejectionReason) return

        setIsActionLoading(true)
        try {
            const { error } = await supabase
                .from('listings')
                .update({
                    approval_status: 'rejected',
                    rejection_reason: rejectionReason,
                    is_active: false
                })
                .eq('id', selectedListing.id)

            if (error) throw error

            // Log action
            await supabase.from('audit_logs').insert({
                action: 'reject_listing',
                target_type: 'listing',
                target_id: selectedListing.id,
                details: {
                    listing_title: selectedListing.title,
                    seller: selectedListing.seller_name,
                    reason: rejectionReason
                }
            })

            setListings(prev => prev.filter(l => l.id !== selectedListing.id))
            setShowRejectionModal(false)
            setShowPreview(false)
        } catch (err) {
            console.error('Rejection failed:', err)
        } finally {
            setIsActionLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight">Listing Approvals</h1>
                    <p className="text-surface-500 font-bold mt-1">Review marketplace submissions before they go live</p>
                </div>
                {errorMsg && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errorMsg}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-200">
                        {listings.length} Pending Approvals
                    </span>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="premium-card h-64 animate-pulse bg-surface-50" />
                    ))}
                </div>
            ) : listings.length === 0 ? (
                <div className="premium-card py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-soft">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-surface-900 tracking-tight">Queue Empty</h3>
                        <p className="text-surface-500 font-bold max-w-sm mx-auto">
                            Great job! All marketplace listings have been reviewed and processed.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <div key={listing.id} className="premium-card group bg-white overflow-hidden hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1">
                            {/* Listing Image */}
                            <div className="aspect-[4/3] relative bg-surface-100 overflow-hidden">
                                {listing.images && listing.images.length > 0 ? (
                                    <NextImage
                                        src={listing.images[0]}
                                        alt={listing.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-surface-400 gap-2">
                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Image Provided</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                        {listing.category_name}
                                    </span>
                                    <span className="bg-white/90 backdrop-blur-md text-surface-900 px-2 py-1 rounded-lg text-xs font-black shadow-sm tracking-tight border border-white/40">
                                        ₹{listing.price}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setSelectedListing(listing); setShowPreview(true); }}
                                    className="absolute bottom-4 right-4 p-2.5 bg-white/90 backdrop-blur-md text-surface-900 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-indigo-600 shadow-xl border border-white/40"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-6">
                                <h3 className="text-lg font-black text-surface-900 mb-2 truncate group-hover:text-indigo-600 transition-colors tracking-tight">
                                    {listing.title}
                                </h3>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center text-surface-500 font-bold border border-surface-100">
                                        {listing.seller_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-surface-700 truncate">{listing.seller_name}</p>
                                            {listing.seller_is_verified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">Seller Registration</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-surface-50">
                                    <button
                                        onClick={() => handleApprove(listing)}
                                        className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => { setSelectedListing(listing); setShowRejectionModal(true); }}
                                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && selectedListing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-surface-900/40 backdrop-blur-md"
                        onClick={() => setShowPreview(false)}
                    />
                    <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
                            {/* Media Section */}
                            <div className="flex-1 bg-surface-50 p-6 lg:p-10 flex flex-col min-h-[400px]">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-surface-900 tracking-tight">Review Market submission</h3>
                                            <p className="text-xs font-bold text-surface-400">Examine details and safety protocols</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 relative bg-white rounded-[2.5rem] border-4 border-white shadow-soft overflow-hidden group">
                                    {selectedListing.images && selectedListing.images.length > 0 ? (
                                        <NextImage
                                            src={selectedListing.images[0]}
                                            alt={selectedListing.title}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-surface-200">
                                            <ImageIcon className="w-20 h-20 mb-4 opacity-10" />
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-surface-300">No images provided</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar Details */}
                            <div className="w-full lg:w-[400px] bg-white p-10 border-l border-surface-100 overflow-y-auto">
                                <div className="space-y-8">
                                    <div>
                                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-4 block">Item Description</span>
                                        <h2 className="text-2xl font-black text-surface-900 mb-3 tracking-tight">{selectedListing.title}</h2>
                                        <p className="text-sm font-bold text-surface-600 leading-relaxed bg-surface-50 p-6 rounded-3xl border border-surface-100 italic">
                                            "{selectedListing.description || 'No description provided.'}"
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-4 block">Seller Information</span>
                                        <div className="flex items-center gap-4 bg-white border border-surface-100 p-4 rounded-2xl shadow-sm">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-black text-xl">
                                                {selectedListing.seller_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-black text-surface-900 uppercase tracking-tight">{selectedListing.seller_name}</p>
                                                    {selectedListing.seller_is_verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                                </div>
                                                <p className="text-[10px] font-bold text-surface-500 uppercase">Registration ID Verified</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-surface-50 space-y-4">
                                        <button
                                            onClick={() => handleApprove(selectedListing)}
                                            disabled={isActionLoading}
                                            className="btn-primary w-full py-5 rounded-[2rem] text-lg font-black shadow-button flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                                        >
                                            {isActionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                <>
                                                    <CheckCircle2 className="w-6 h-6" />
                                                    Approve & Publish
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectionModal(true)}
                                            disabled={isActionLoading}
                                            className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Reject with Reason
                                        </button>
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="w-full py-3 text-[10px] font-black text-surface-400 uppercase tracking-widest hover:text-surface-900 transition-colors"
                                        >
                                            Return to Queue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-surface-900/20 backdrop-blur-sm"
                        onClick={() => setShowRejectionModal(false)}
                    />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-surface-900 tracking-tight">Rejection Feedback</h3>
                            <p className="text-surface-500 font-bold mt-1 text-sm italic">"Honest feedback improves the campus experience"</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {['Inappropriate Title', 'Unclear Photos', 'Prohibited Item', 'Misleading Price'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setRejectionReason(tag)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${rejectionReason === tag
                                            ? 'bg-red-500 border-red-500 text-white shadow-lg'
                                            : 'bg-surface-50 border-surface-200 text-surface-600 hover:border-red-300'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                className="w-full min-h-[120px] p-4 bg-surface-50 border-2 border-surface-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-red-500/20 outline-none"
                                placeholder="Write detailed instructions for the seller..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectionModal(false)}
                                className="flex-1 py-4 bg-surface-50 text-surface-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-100 transition-all font-display"
                            >
                                Nevermind
                            </button>
                            <button
                                disabled={!rejectionReason || isActionLoading}
                                onClick={handleReject}
                                className="flex-[2] py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                            >
                                {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
