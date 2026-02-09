'use client'

import React, { useState, useEffect } from 'react'
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    ShieldCheck,
    ShieldAlert,
    Clock,
    UserX,
    UserCheck,
    Mail,
    Building,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserSummary {
    id: string
    full_name: string
    email: string
    college_name: string
    verification_status: string
    created_at: string
    is_verified: boolean
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, 
                    full_name, 
                    email, 
                    verification_status, 
                    is_verified, 
                    created_at,
                    colleges(name)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formatted = data.map((u: any) => ({
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                college_name: u.colleges?.name || 'Unknown',
                verification_status: u.verification_status || 'pending',
                is_verified: u.is_verified || false,
                created_at: u.created_at
            }))

            setUsers(formatted)
        } catch (err) {
            console.error('Failed to fetch users:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.college_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100'
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100'
            default: return 'bg-surface-50 text-surface-400 border-surface-100'
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight">User Management</h1>
                    <p className="text-surface-500 font-bold mt-1">Directory of all PeerLY students and verification statuses</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-surface-200 rounded-2xl text-xs font-black text-surface-600 shadow-sm hover:bg-surface-50 transition-all uppercase tracking-widest">
                    <Download className="w-4 h-4 text-surface-400" />
                    Export Directory
                </button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3">
                {['All Users', 'Verified', 'Pending', 'Suspended'].map(filter => (
                    <button
                        key={filter}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${filter === 'All Users'
                                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Content Table Card */}
            <div className="premium-card bg-white overflow-hidden border border-surface-200 shadow-premium">
                <div className="p-6 border-b border-surface-100 flex items-center justify-between bg-surface-50/30">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or college..."
                            className="pl-12 pr-6 py-3 bg-white border-2 border-surface-100 rounded-2xl text-xs font-bold w-full focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-50/50 border-b border-surface-100">
                                <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest">Student Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest">Campus</th>
                                <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest">Joined On</th>
                                <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest">Verification</th>
                                <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6"><div className="h-4 bg-surface-50 rounded-full w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-surface-400 font-bold">No students found matching your search.</td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-primary-50/20 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-black text-lg shadow-sm">
                                                {user.full_name.charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-black text-surface-900 uppercase tracking-tight truncate">{user.full_name}</p>
                                                <div className="flex items-center gap-1.5 text-surface-400">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold truncate max-w-[140px]">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-surface-300" />
                                            <p className="text-xs font-black text-surface-700 tracking-tight">{user.college_name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-surface-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getStatusColor(user.verification_status)}`}>
                                            {user.verification_status === 'approved' ? <ShieldCheck className="w-3.5 h-3.5" /> :
                                                user.verification_status === 'rejected' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                                                    <Clock className="w-3.5 h-3.5" />}
                                            {user.verification_status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2.5 bg-white border border-surface-200 rounded-xl text-surface-600 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm">
                                                <UserCheck className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 bg-white border border-surface-200 rounded-xl text-surface-600 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                                                <UserX className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 bg-white border border-surface-200 rounded-xl text-surface-600 hover:bg-surface-50 transition-all">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer simple pagination */}
                <div className="p-6 bg-surface-50/50 border-t border-surface-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        Total {filteredUsers.length} Students Listed
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-surface-200 rounded-xl text-surface-300">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="p-2 border border-surface-200 rounded-xl text-surface-300">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
