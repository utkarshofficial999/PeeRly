import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: 'PeeRly - Student Marketplace',
    description: 'Buy and sell within your campus community. Trusted peer-to-peer marketplace for college and school students.',
    keywords: ['student marketplace', 'buy sell campus', 'college marketplace', 'peer to peer', 'second hand books', 'used textbooks'],
    authors: [{ name: 'PeeRly' }],
    openGraph: {
        title: 'PeeRly - Student Marketplace',
        description: 'Buy and sell within your campus community',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-dark-950">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
