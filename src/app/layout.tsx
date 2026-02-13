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
    manifest: '/manifest.json',
    themeColor: '#F9F9F9',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
            <body className="min-h-screen antialiased selection:bg-primary-500/10 selection:text-primary-600 bg-[#F9F9F9]">
                <AnimatedBackground />
                <div className="relative z-10">
                    <AuthProvider>
                        <VerificationGuard>
                            {children}
                        </VerificationGuard>
                    </AuthProvider>
                </div>
            </body>
        </html>
    )
}
