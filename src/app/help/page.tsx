'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Search, ChevronDown, Book, HelpCircle, AlertCircle, UserCircle } from 'lucide-react'
import { useState } from 'react'

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const faqs = [
        {
            category: 'Getting Started',
            icon: Book,
            items: [
                { q: 'How do I create an account?', a: 'You can sign up using your official college email address. We will send you a verification link to ensure you are a valid student.' },
                { q: 'Why do I need a college email?', a: 'To maintain a safe and trusted community, we restrict access to verified students only. This prevents external vendors and scammers from entering our marketplace.' }
            ]
        },
        {
            category: 'Buying & Selling',
            icon: HelpCircle,
            items: [
                { q: 'How do I post a listing?', a: 'Once logged in, click the "Sell" button in the header. Fill in the details about your item, set a price, upload photos, and publish.' },
                { q: 'Is there a fee for selling?', a: 'No, PeeRly is currently free for students to list and sell items. We do not take a commission on your trades.' }
            ]
        },
        {
            category: 'Safety',
            icon: AlertCircle,
            items: [
                { q: 'Where should I meet the buyer/seller?', a: 'We highly recommend meeting in public, well-lit areas on campus during daylight hours—like the college library, canteen, or main gates.' },
                { q: 'What if I encounter a scammer?', a: 'Report the user immediately using the "Report" button on their profile or listing. We review all reports seriously.' }
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-4xl md:text-6xl font-display font-black text-surface-900 mb-6 tracking-tight">
                            How can we <span className="gradient-text italic">help?</span>
                        </h1>
                        <p className="text-surface-700 font-bold text-lg mb-10 max-w-2xl mx-auto italic">
                            Search our campus-verified guides or browse categories below to find answers to common peer trading questions.
                        </p>
                        <div className="relative max-w-xl mx-auto group">
                            <div className="absolute inset-0 bg-primary-500/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-white border border-surface-200 rounded-[2rem] pl-14 pr-6 py-5 text-surface-900 focus:border-primary-500 shadow-soft focus:shadow-premium transition-all outline-none text-lg font-medium relative z-10"
                                placeholder="Search for answers..."
                            />
                        </div>
                    </div>

                    {/* FAQ Sections */}
                    <div className="space-y-16">
                        {faqs.map((section, sIndex) => (
                            <div key={sIndex} className="animate-slide-up" style={{ animationDelay: `${sIndex * 110}ms` }}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-soft border border-surface-100 flex items-center justify-center">
                                        <section.icon className="w-6 h-6 text-primary-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-surface-900 tracking-tight">{section.category}</h2>
                                        <div className="h-1 w-10 bg-primary-500/20 rounded-full mt-1" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {section.items.map((item, iIndex) => {
                                        const currentIndex = sIndex * 10 + iIndex
                                        const isOpen = openIndex === currentIndex
                                        return (
                                            <div key={iIndex} className={`premium-card overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-primary-500/10 shadow-premium' : 'hover:border-surface-300'}`}>
                                                <button
                                                    onClick={() => setOpenIndex(isOpen ? null : currentIndex)}
                                                    className="w-full px-8 py-6 flex items-center justify-between text-left group"
                                                >
                                                    <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-primary-600' : 'text-surface-800'}`}>
                                                        {item.q}
                                                    </span>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-primary-500 text-white rotate-180' : 'bg-surface-50 text-surface-400 group-hover:bg-surface-100'}`}>
                                                        <ChevronDown className="w-5 h-5" />
                                                    </div>
                                                </button>
                                                {isOpen && (
                                                    <div className="px-8 pb-8 text-surface-900 font-bold leading-relaxed border-t border-surface-50 pt-6 animate-slide-down">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Still Need Help? */}
                    <div className="mt-24 p-12 premium-card bg-gradient-to-br from-white to-primary-50/30 border-primary-500/10 relative overflow-hidden text-center group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-surface-900 mb-4 tracking-tight">Still stuck?</h3>
                            <p className="text-surface-500 font-semibold mb-10 max-w-md mx-auto italic">
                                Campus commerce can be tricky. Our student support ambassadors are here to guide you.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="/contact" className="btn-primary py-4 px-10 text-base shadow-lg shadow-primary-500/20">
                                    Contact Support
                                </a>
                                <a href="/safety" className="btn-secondary py-4 px-10 text-base border-surface-200">
                                    Safety Center
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
