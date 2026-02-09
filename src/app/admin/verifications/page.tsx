'use client'

import React, { useState, useEffect } from 'react'
import {
    ShieldCheck,
    User,
    Calendar,
    CheckCircle2,
    XCircle,
    Eye,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    AlertCircle,
    Loader2,
    ZoomIn,
    Scale
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

// Types for ID Verification
interface PendingUser {
    id: string
    full_name: string
    email: string
    college_name: string
    created_at: string
    id_card_url: string
}

export default function VerificationsPage() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectionModal, setShowRejectionModal] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchPendingUsers()
    }, [])

    // Generate signed URL for ID card
    useEffect(() => {
        const getSignedUrl = async () => {
            if (showPreview && selectedUser?.id_card_url) {
                try {
                    const { data, error } = await supabase.storage
                        .from('id_cards')
                        .createSignedUrl(selectedUser.id_card_url, 3600) // 1 hour expiry

                    if (error) throw error
                    setImagePreviewUrl(data.signedUrl)
                } catch (err) {
                    console.error('Failed to get signed URL:', err)
                    setImagePreviewUrl(null)
                }
            } else {
                setImagePreviewUrl(null)
            }
        }
        getSignedUrl()
    }, [showPreview, selectedUser, supabase])

    const fetchPendingUsers = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, created_at, id_card_url, colleges(name)')
                .eq('verification_status', 'pending')
                .not('id_card_url', 'is', null)
                .order('created_at', { ascending: true })

            if (error) throw error

            const formattedUsers = data.map((u: any) => ({
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                college_name: u.colleges?.name || 'Unknown Institution',
                created_at: u.created_at,
                id_card_url: u.id_card_url
            }))

            setPendingUsers(formattedUsers)
        } catch (err) {
            console.error('Failed to fetch pending users:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleApprove = async (user: PendingUser) => {
        setIsActionLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    verification_status: 'approved',
                    is_verified: true
                })
                .eq('id', user.id)

            if (error) throw error

            // Log action
            await supabase.from('audit_logs').insert({
                action: 'approve_id',
                target_type: 'user',
                target_id: user.id,
                details: { user_email: user.email }
            })

            setPendingUsers(prev => prev.filter(u => u.id !== user.id))
            setShowPreview(false)
        } catch (err) {
            console.error('Approval failed:', err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedUser || !rejectionReason) return

        setIsActionLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    verification_status: 'rejected',
                    rejection_reason: rejectionReason,
                    is_verified: false
                })
                .eq('id', selectedUser.id)

            if (error) throw error

            // Log action
            await supabase.from('audit_logs').insert({
                action: 'reject_id',
                target_type: 'user',
                target_id: selectedUser.id,
                details: { user_email: selectedUser.email, reason: rejectionReason }
            })

            setPendingUsers(prev => prev.filter(u => u.id !== selectedUser.id))
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
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight">ID Verification Queue</h1>
                    <p className="text-surface-500 font-bold mt-1">Review and verify student identifications</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-primary-200">
                        {pendingUsers.length} Pending Actions
                    </span>
                </div>
            </div>

            {/* Content Card */}
            <div className="premium-card bg-white overflow-hidden border border-surface-200">
                <div className="p-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-200 rounded-xl text-xs font-bold text-surface-600 shadow-sm hover:bg-surface-50 transition-all">
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            type="text"
                            placeholder="Search names or emails..."
                            className="pl-10 pr-4 py-1.5 bg-white border border-surface-200 rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-50/50 border-b border-surface-100">
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Student Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Institution</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Submitted On</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Identity Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-4 bg-surface-100 rounded-full w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : pendingUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center border border-surface-100">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="text-surface-700 font-black">All Caught Up!</p>
                                            <p className="text-surface-400 text-sm font-bold">No pending ID verifications at the moment.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pendingUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-surface-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 font-bold border border-surface-200">
                                                {user.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-surface-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{user.full_name}</p>
                                                <p className="text-[10px] font-bold text-surface-400 truncate max-w-[150px]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-surface-700">{user.college_name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-surface-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                            Pending Review
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowPreview(true); }}
                                                className="p-2 border border-surface-200 rounded-xl hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all"
                                                title="View ID card"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(user)}
                                                className="p-2 border border-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                                                title="Approve immediately"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowRejectionModal(true); }}
                                                className="p-2 border border-red-100 text-red-600 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 transition-all"
                                                title="Reject"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-surface-50/50 border-t border-surface-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        Showing {pendingUsers.length} of {pendingUsers.length} pending users
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 border border-surface-200 rounded-lg text-surface-300 cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 border border-surface-200 rounded-lg text-surface-300 cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ID Card Preview Modal */}
            {showPreview && selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-surface-900/40 backdrop-blur-md"
                        onClick={() => setShowPreview(false)}
                    />
                    <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                            {/* Image Part */}
                            <div className="flex-1 bg-surface-50 p-6 md:p-10 flex flex-col min-h-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-surface-900">Review Identity Card</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white rounded-xl shadow-sm text-surface-600 hover:text-primary-600 transition-colors">
                                            <ZoomIn className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-white rounded-xl shadow-sm text-surface-600 hover:text-primary-600 transition-colors">
                                            <Scale className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 relative bg-white rounded-[2rem] border-4 border-white shadow-soft overflow-hidden">
                                    {selectedUser.id_card_url ? (
                                        <div className="relative w-full h-full">
                                            {!imagePreviewUrl ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-surface-50">
                                                    <Loader2 className="w-8 h-8 text-primary-200 animate-spin" />
                                                </div>
                                            ) : (
                                                <NextImage
                                                    src={imagePreviewUrl}
                                                    alt="Student ID Card"
                                                    fill
                                                    className="object-contain"
                                                    priority
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-surface-100 flex items-center justify-center">
                                            <AlertCircle className="w-12 h-12 text-surface-300" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Sidebar */}
                            <div className="w-full md:w-80 border-l border-surface-100 p-8 flex flex-col bg-white">
                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-4">Student Information</p>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-surface-500 mb-0.5">Full Name</p>
                                            <p className="text-sm font-black text-surface-900">{selectedUser.full_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-surface-500 mb-0.5">Email Address</p>
                                            <p className="text-sm font-black text-surface-900 truncate">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-surface-500 mb-0.5">Institution</p>
                                            <p className="text-sm font-black text-surface-900">{selectedUser.college_name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-3">
                                    <button
                                        onClick={() => handleApprove(selectedUser)}
                                        disabled={isActionLoading}
                                        className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 group shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                Approve Student
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowRejectionModal(true)}
                                        disabled={isActionLoading}
                                        className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-500/10"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Reject Verification
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="w-full py-3 text-[10px] font-black text-surface-400 uppercase tracking-widest hover:text-surface-900 transition-colors"
                                    >
                                        Dismiss Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reason Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-surface-900/20 backdrop-blur-sm"
                        onClick={() => setShowRejectionModal(false)}
                    />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Background warning icon */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 text-red-500/5 rotate-12">
                            <XCircle className="w-full h-full" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-surface-900 mb-2 tracking-tight">Rejection Details</h3>
                            <p className="text-surface-500 font-bold mb-6">Why is this ID being rejected? Please be specific.</p>

                            <div className="space-y-4 mb-8">
                                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 px-1">Common Reasons</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Blurry Image', 'Expired ID', 'Mismatch Name', 'Not a Student ID'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setRejectionReason(tag)}
                                            className={`px-3 py-2 rounded-xl text-[11px] font-black border transition-all ${rejectionReason === tag
                                                ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                                : 'bg-surface-50 border-surface-200 text-surface-600 hover:border-red-300'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="w-full min-h-[120px] p-4 bg-surface-50 border-2 border-surface-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-300 transition-all outline-none"
                                    placeholder="Add custom rejection notes here..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectionModal(false)}
                                    className="flex-1 py-4 bg-surface-50 text-surface-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-surface-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!rejectionReason || isActionLoading}
                                    onClick={handleReject}
                                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
