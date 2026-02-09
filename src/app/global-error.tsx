'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Platform Error:', error)
    }, [error])

    return (
        <html>
            <body className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-red-100 rounded-[2.5rem] flex items-center justify-center mx-auto border-4 border-white shadow-soft">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-black text-surface-900 tracking-tight">System Glitch</h1>
                        <p className="text-surface-600 font-bold leading-relaxed">
                            Something went wrong while processing your request. Our team has been notified.
                        </p>
                        <div className="p-4 bg-surface-100 rounded-2xl text-[10px] font-mono text-surface-400 break-all border border-surface-200 uppercase">
                            Error Digest: {error.digest || 'Unknown Application Error'}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => reset()}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white px-8 py-4 rounded-2xl font-black shadow-button hover:bg-primary-600 transition-all active:scale-95"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            Retry Page
                        </button>
                        <a
                            href="/"
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-surface-900 px-8 py-4 rounded-2xl font-black border border-surface-200 shadow-soft hover:bg-surface-50 transition-all active:scale-95"
                        >
                            <Home className="w-5 h-5 text-primary-500" />
                            Return Home
                        </a>
                    </div>
                </div>
            </body>
        </html>
    )
}
