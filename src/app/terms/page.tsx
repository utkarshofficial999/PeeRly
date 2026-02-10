'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function TermsPage() {
    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: 'By accessing or using PeeRly, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.'
        },
        {
            title: '2. User Eligibility',
            content: 'You must be a student currently enrolled in a participating college or educational institution. You are required to use your official college email for verification.'
        },
        {
            title: '3. Listings & Transactions',
            content: 'Users are responsible for the accuracy of their listings. We are a platform that facilitates connections and do not handle payments, shipping, or physical transactions. Users should meet in safe campus areas to complete trades.'
        },
        {
            title: '4. Prohibited Content',
            content: 'You may not list illegal items, dangerous materials, or any content that violates college policies or local laws. We reserve the right to remove any listing at our discretion.'
        },
        {
            title: '5. Limitation of Liability',
            content: 'PeeRly is not responsible for any disputes, damages, or losses resulting from interaction between users. We encourage students to inspect items thoroughly before payment.'
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="premium-card p-10 md:p-16">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-surface-900 mb-2 tracking-tight">Terms of Service</h1>
                        <p className="text-surface-400 font-bold mb-10 pb-10 border-b border-surface-100 uppercase tracking-widest text-xs">Last Updated: February 10, 2026</p>

                        <div className="space-y-12">
                            {sections.map((section, index) => (
                                <section key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                    <h2 className="text-xl font-black text-surface-900 mb-4 tracking-tight uppercase tracking-wider">{section.title}</h2>
                                    <p className="text-surface-600 leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </section>
                            ))}
                        </div>

                        <div className="mt-16 p-8 rounded-[2rem] bg-surface-50 border border-surface-200 group">
                            <p className="text-base text-surface-500 font-medium">
                                Questions about our terms? We&apos;re committed to transparency. Reach out at <a href="mailto:legal@peerly.in" className="text-primary-600 font-black hover:text-primary-700 transition-colors border-b-2 border-primary-500/20 hover:border-primary-500">legal@peerly.in</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
