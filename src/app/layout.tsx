import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import VerificationGuard from '@/components/auth/VerificationGuard'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import './globals.css'

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: 'PeerLY - Premium Student Marketplace',
    description: 'The definitive peer-to-peer marketplace for campus icons. Buy, sell, and trade with trust in your college community.',
    keywords: ['student marketplace', 'peerly', 'campus buy sell', 'college trading', 'student economy'],
    authors: [{ name: 'PeerLY' }],
    openGraph: {
        title: 'PeerLY - Premium Student Marketplace',
        description: 'Building the future of campus commerce.',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-surface-50 antialiased selection:bg-primary-500/10 selection:text-primary-600">
                <AnimatedBackground />
                <AuthProvider>
                    <VerificationGuard>
                        {children}
                    </VerificationGuard>
                </AuthProvider>
            </body>
        </html>
    )
}
