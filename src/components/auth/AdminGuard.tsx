'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        if (!isLoading) {
            if (user?.email === SUPER_ADMIN_EMAIL) {
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
            }
        }
    }, [user, isLoading])

    if (isLoading || isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        )
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
                <div className="max-w-md w-full premium-card p-10 text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-peach-500/10 blur-[100px] rounded-full" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-peach-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-peach-100 shadow-sm">
                            <ShieldAlert className="w-10 h-10 text-peach-500" />
                        </div>

                        <h1 className="text-3xl font-black text-surface-900 mb-4 tracking-tight">
                            Access Denied
                        </h1>

                        <p className="text-surface-600 font-bold mb-8 leading-relaxed">
                            You do not have the necessary permissions to access the Super Admin Dashboard.
                            This area is restricted to authorized personnel only.
                        </p>

                        <div className="space-y-4">
                            <Link
                                href="/"
                                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Return to Homepage
                            </Link>

                            <p className="text-xs font-black text-surface-400 uppercase tracking-widest">
                                Logged in as: <span className="text-surface-600">{user?.email || 'Guest'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
