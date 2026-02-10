'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Building2, Recycle, Mail, BadgeCheck, Zap } from 'lucide-react'

export default function CollegesPage() {
    const benefits = [
        {
            title: 'Sustainability',
            desc: 'Reduces waste through reuse and circular economy within the campus.',
            icon: Recycle
        },
        {
            title: 'Affordability',
            desc: 'Makes campus life cost-effective by providing access to used essentials.',
            icon: Zap
        },
        {
            title: 'Verified Safety',
            desc: 'Restricts access to only your verified students via .edu or campus email.',
            icon: BadgeCheck
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
                            For <span className="gradient-text italic">Colleges</span>
                        </h1>
                        <p className="text-xl text-surface-600 max-w-2xl mx-auto leading-relaxed font-medium">
                            Empower your students and champion sustainability by officializing PeeRly as your campus&apos;s trusted trade ecosystem.
                        </p>
                    </div>

                    {/* Why colleges love us */}
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="premium-card p-10 hover:border-primary-100 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-primary-500/5 flex items-center justify-center mb-8 shadow-sm">
                                    <benefit.icon className="w-7 h-7 text-primary-500" />
                                </div>
                                <h3 className="text-2xl font-black text-surface-900 mb-4 tracking-tight">{benefit.title}</h3>
                                <p className="text-surface-500 font-medium leading-relaxed">
                                    {benefit.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Partnership Section */}
                    <div className="premium-card p-10 md:p-16 animate-slide-up relative overflow-hidden bg-gradient-to-br from-white to-primary-50/30">
                        <div className="absolute -bottom-8 -right-8 w-80 h-80 bg-primary-500/5 blur-3xl rounded-full" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-surface-900 mb-8 flex items-center gap-4 tracking-tight">
                                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                                    <Building2 className="w-7 h-7 text-primary-600" />
                                </div>
                                Support Campus Entrepreneurship
                            </h2>
                            <p className="text-lg text-surface-700 mb-10 leading-relaxed font-medium">
                                We collaborate with university administrations to foster a secure, student-led marketplace. Official partnership guarantees:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6 mb-12">
                                {[
                                    'Pre-verified email whitelist for your college',
                                    'Dashboard for security team verification',
                                    'Sustainability reports for ESG goals',
                                    'Direct support for student initiatives'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-surface-100 shadow-sm">
                                        <div className="w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                                        <span className="text-surface-800 font-bold">{item}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Contact Box */}
                            <div className="p-10 rounded-3xl bg-white border border-primary-200 text-center shadow-premium relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-surface-900 mb-2">Interested in partnering?</h3>
                                    <p className="text-surface-500 font-medium mb-8 max-w-md mx-auto italic">Let&apos;s discuss how we can integrate PeeRly into your campus digital landscape.</p>
                                    <a
                                        href="mailto:colleges@peerly.in"
                                        className="inline-flex items-center gap-3 text-primary-600 hover:text-primary-700 font-black text-xl transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        colleges@peerly.in
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
