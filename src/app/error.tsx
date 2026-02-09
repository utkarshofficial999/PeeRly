'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Segment Error:', error)
    }, [error])

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mx-auto border-4 border-white shadow-soft">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-surface-900 tracking-tight">Component Error</h2>
                    <p className="text-surface-600 font-bold leading-relaxed">
                        A specific part of the page failed to load. You can try resetting this section.
                    </p>
                    {error.digest && (
                        <div className="p-3 bg-surface-100 rounded-xl text-[9px] font-mono text-surface-400 break-all border border-surface-200 uppercase">
                            Digest: {error.digest}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={() => reset()}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-black shadow-button hover:bg-primary-600 transition-all active:scale-95 text-sm"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Retry
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-surface-900 px-6 py-3 rounded-xl font-black border border-surface-200 shadow-soft hover:bg-surface-50 transition-all active:scale-95 text-sm"
                    >
                        <Home className="w-4 h-4 text-primary-500" />
                        Home
                    </button>
                </div>
            </div>
        </div>
    )
}
