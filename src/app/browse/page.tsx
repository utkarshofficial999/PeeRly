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
        <div className="min-h-screen bg-surface-50 flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <p className="text-surface-400 font-bold tracking-widest uppercase text-xs">Summoning Feed...</p>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default function BrowsePage() {
    return (
        <>
            <Suspense fallback={<LoadingFallback />}>
                <BrowseContent />
            </Suspense>
            <Footer />
        </>
    )
}
