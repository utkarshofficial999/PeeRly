'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Loader2 } from 'lucide-react'

// Dynamically import the content to avoid SSR issues with useSearchParams
const BrowseContent = nextDynamic(() => import('./BrowseContent'), { ssr: false })

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-dark-950">
            <Header />
            <main className="pt-20 md:pt-28 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                        <p className="text-dark-400">Loading browse page...</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default function BrowsePage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <BrowseContent />
        </Suspense>
    )
}
