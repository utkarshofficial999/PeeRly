'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import { Loader2 } from 'lucide-react'

// Dynamically import the content with ssr: false to prevent hydration hangs on refresh
// This is critical for pages using useSearchParams in Next.js on Netlify
const MessagesContent = dynamic(() => import('./MessagesContent'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
    )
})

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    )
}
