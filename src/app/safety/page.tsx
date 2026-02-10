'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Shield, Eye, MapPin, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SafetyPage() {
    const tips = [
        {
            title: 'Meet in Public Spaces',
            desc: 'Always arrange to meet in well-lit, busy areas on campus. The library, main canteen, or near security gates are ideal spots.',
            icon: MapPin,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            title: 'Inspect Before You Pay',
            desc: "Don't pay any money upfront. Meet the seller, inspect the condition of the item thoroughly, and only pay when you're satisfied.",
            icon: Eye,
            color: 'text-primary-400',
            bgColor: 'bg-primary-500/10'
        },
        {
            title: 'Protect Your Information',
            desc: 'Avoid sharing your personal phone number, OTPs, or passwords. Use the in-app chat for all communication.',
            icon: Smartphone,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10'
        },
        {
            title: 'Trust Your Instincts',
            desc: 'If a deal feels too good to be true or a user makes you uncomfortable, walk away. Your safety is more important than any bargain.',
            icon: Shield,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10'
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-20 animate-fade-in">
                        <h1 className="text-4xl md:text-6xl font-display font-black text-surface-900 mb-6 tracking-tight">
                            Campus <span className="gradient-text italic">Safety</span> First
                        </h1>
                        <p className="text-xl text-surface-900 font-black uppercase tracking-tight">
                            Your security is our priority. These campus-verified practices ensure every trade is safe and successful.
                        </p>
                    </div>

                    {/* Tips Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-20">
                        {tips.map((tip, index) => (
                            <div key={index} className="premium-card p-10 animate-slide-up hover:border-primary-200" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className={`w-16 h-16 rounded-2xl ${tip.bgColor} flex items-center justify-center mb-8 shadow-sm`}>
                                    <tip.icon className={`w-8 h-8 ${tip.color}`} />
                                </div>
                                <h3 className="text-2xl font-black text-surface-900 mb-4 tracking-tight">{tip.title}</h3>
                                <p className="text-surface-900 font-bold leading-relaxed italic">
                                    {tip.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Checklist */}
                    <div className="premium-card p-10 md:p-16 relative overflow-hidden bg-gradient-to-br from-white to-surface-50/50">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 blur-3xl -mr-40 -mt-40" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-surface-900 mb-12 flex items-center gap-4 tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                </div>
                                Final Safety Checklist
                            </h2>
                            <div className="space-y-4">
                                {[
                                    'Meet during daylight hours.',
                                    'Tell a friend or roommate where you are going.',
                                    "Verify the user's student status on their profile.",
                                    'Use digital payments (like UPI) only after inspection.',
                                    'Report any suspicious behavior immediately.'
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-5 p-6 rounded-2xl bg-white border border-surface-100 items-center animate-fade-in group hover:border-primary-200 transition-colors shadow-sm" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="w-6 h-6 rounded-full border-2 border-primary-500 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                        </div>
                                        <span className="text-surface-900 text-lg font-black uppercase tracking-tight">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
