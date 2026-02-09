'use client'

import React, { useState, useEffect } from 'react'
import {
    History,
    Search,
    Filter,
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    UserCircle,
    Package,
    ShieldCheck,
    XCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AuditLog {
    id: string
    action: string
    target_type: string
    target_id: string
    created_at: string
    details: any
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLogs(data || [])
        } catch (err) {
            console.error('Failed to fetch logs:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const getActionIcon = (action: string) => {
        if (action.includes('approve')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        if (action.includes('reject')) return <XCircle className="w-4 h-4 text-red-500" />
        return <History className="w-4 h-4 text-primary-500" />
    }

    const getTargetIcon = (type: string) => {
        if (type === 'user') return <UserCircle className="w-4 h-4 text-surface-400" />
        if (type === 'listing') return <Package className="w-4 h-4 text-surface-400" />
        return <ShieldCheck className="w-4 h-4 text-surface-400" />
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight">System Audit logs</h1>
                    <p className="text-surface-500 font-bold mt-1">Traceable history of all administrative actions</p>
                </div>
            </div>

            {/* Content Card */}
            <div className="premium-card bg-white overflow-hidden border border-surface-200">
                <div className="p-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-xs font-black text-surface-600 shadow-sm hover:bg-surface-50 transition-all uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5" />
                            Timeframe
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-50/50 border-b border-surface-100">
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Action Executed</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Target</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Execution Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Operator</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 font-mono">
                            {isLoading ? (
                                Array(8).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="h-4 bg-surface-50 rounded-full w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-surface-400 text-xs font-bold font-sans">
                                        No administrative records found.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-surface-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-surface-900">{new Date(log.created_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-surface-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="shrink-0">{getActionIcon(log.action)}</div>
                                            <span className="text-xs font-black text-surface-700 capitalize tracking-tight">
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getTargetIcon(log.target_type)}
                                            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{log.target_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs overflow-hidden">
                                            <p className="text-[10px] font-bold text-surface-600 truncate">
                                                {JSON.stringify(log.details)}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-black text-[10px]">U</div>
                                            <span className="text-xs font-black text-surface-900 tracking-tight font-sans">Utkarsh</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-surface-50/50 border-t border-surface-100 flex items-center justify-between">
                    <p className="text-[9px] font-black text-surface-400 uppercase tracking-[0.2em] font-sans">
                        Immutable Security Ledger • PeerLY v1.0
                    </p>
                    <div className="flex items-center gap-2 font-sans">
                        <button className="p-1.5 border border-surface-200 rounded-xl text-surface-300">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 border border-surface-200 rounded-xl text-surface-300">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
