'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

const EXCLUDED_PATHS = ['/verify', '/login', '/signup', '/', '/auth/callback', '/admin', '/browse', '/settings']

export default function VerificationGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isLoading && user) {
            const isExcluded = EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(path))
            const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()

            if (!isExcluded && !isSuperAdmin && profile && profile.verification_status !== 'approved') {
                router.push('/verify')
            }
        }
    }, [user, profile, isLoading, pathname, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}
