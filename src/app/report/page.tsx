'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AlertTriangle, Shield, Flag, Send } from 'lucide-react'

export default function ReportPage() {
    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16 animate-fade-in">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 uppercase tracking-tight">
                            Report an <span className="text-red-600">Issue</span>
                        </h1>
                        <p className="text-xl text-surface-600 font-bold max-w-2xl mx-auto">
                            Help us keep the community safe. All reports are reviewed seriously and confidentially.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {[
                            { title: 'Fake Listing', icon: Flag, desc: 'Items that are misleading, non-existent, or stolen.' },
                            { title: 'Scams & Fraud', icon: Shield, desc: 'Suspicious behavior, advance payment requests, or phishing.' },
                            { title: 'Abuse', icon: AlertTriangle, desc: 'Harassment, inappropriate content, or offensive behavior.' }
                        ].map((item, index) => (
                            <div key={index} className="bg-white border border-surface-200 rounded-3xl p-6 text-center group hover:border-red-500/30 transition-all duration-300 shadow-soft">
                                <div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-50">
                                    <item.icon className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-lg font-black text-surface-900 mb-2 uppercase tracking-tight">{item.title}</h3>
                                <p className="text-sm font-bold text-surface-500 leading-relaxed italic">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Report Form */}
                    <div className="bg-white border border-surface-200 rounded-3xl p-8 md:p-12 shadow-premium animate-slide-up">
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Issue Category</label>
                                    <select className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3.5 text-surface-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-red-500 transition-all outline-none appearance-none cursor-pointer">
                                        <option value="fake">Fake Listing / Scam</option>
                                        <option value="abuse">Harassment / Abuse</option>
                                        <option value="stolen">Stolen Property</option>
                                        <option value="other">Other Issue</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Reference Coordinate</label>
                                    <input type="text" className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3.5 text-surface-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-red-500 transition-all outline-none" placeholder="peerly.in/listing/123" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Issue Briefing</label>
                                <textarea className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3.5 text-surface-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-red-500 transition-all outline-none h-40 resize-none" placeholder="Please provide technical detail for the security team..."></textarea>
                            </div>

                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-4">
                                <Shield className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 font-bold italic">
                                    Reporting helps our security team take action. If you are in immediate danger, please contact campus security or local police first.
                                </p>
                            </div>

                            <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:gap-3 shadow-lg shadow-red-600/20 active:scale-95 uppercase tracking-widest">
                                Submit Incident Report
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
