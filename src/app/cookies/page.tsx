'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white border border-surface-200 rounded-3xl p-10 md:p-16 shadow-soft">
                        <h1 className="text-4xl font-black text-surface-900 mb-2 uppercase tracking-tight">Cookie Policy</h1>
                        <p className="text-surface-400 font-bold mb-10 pb-10 border-b border-surface-100 italic">Last Optimized: February 10, 2026</p>

                        <div className="space-y-8">
                            <section>
                                <h2 className="text-xl font-black text-surface-900 mb-4 uppercase tracking-tight flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-sm">01</span>
                                    What Are Cookies?
                                </h2>
                                <p className="text-surface-600 font-bold leading-relaxed pl-10">
                                    Cookies are small text files stored on your device that help our platform function better. They allow us to remember your preferences and maintain your active session security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-surface-900 mb-4 uppercase tracking-tight flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-sm">02</span>
                                    Technical Implementation
                                </h2>
                                <ul className="list-disc pl-14 space-y-4 text-surface-600 font-bold">
                                    <li><strong className="text-surface-900 uppercase text-sm">Authentication:</strong> Maintaining your encrypted identity token across navigation events.</li>
                                    <li><strong className="text-surface-900 uppercase text-sm">Preferences:</strong> Caching your interface configuration and search parameters locally.</li>
                                    <li><strong className="text-surface-900 uppercase text-sm">Performance:</strong> Analyzing telemetry data to optimize campus-wide resource distribution.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-surface-900 mb-4 uppercase tracking-tight flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-sm">03</span>
                                    Configuration Control
                                </h2>
                                <p className="text-surface-600 font-bold leading-relaxed pl-10">
                                    Standard browser interfaces provide granular control over cookie distribution. Note that total suppression of cookies will compromise platform stability and disable authenticated access.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
