'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Briefcase, Sparkles, Code, PenTool, TrendingUp, Mail } from 'lucide-react'

export default function CareersPage() {
    const roles = [
        { title: 'Student Ambassadors', icon: TrendingUp, desc: 'Lead PeeRly on your campus. Manage events and grow the community.' },
        { title: 'Frontend Developers', icon: Code, desc: 'Build stunning, fast, and responsive React interfaces with us.' },
        { title: 'Content Creators', icon: PenTool, desc: 'Help us tell the PeeRly story through blogs, videos, and social media.' },
        { title: 'Campus Marketing Interns', icon: Sparkles, desc: 'Learn real-world marketing and growth hacking on your own campus.' }
    ]

    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 uppercase tracking-tight">
                            Join the <span className="gradient-text">Movement</span>
                        </h1>
                        <p className="text-xl text-surface-600 font-bold max-w-2xl mx-auto italic">
                            &quot;The Architecture of Campus Commerce 🚀&quot;
                        </p>
                    </div>

                    {/* Culture Stat */}
                    <div className="bg-white border border-surface-200 rounded-3xl p-10 mb-12 shadow-soft text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-surface-900 mb-4 uppercase tracking-tight">System Philosophy</h2>
                            <p className="text-surface-600 font-bold text-lg max-w-2xl mx-auto leading-relaxed">
                                We are a decentralized collective of students and creators engineering the future of peer-to-peer exchange. We operate with high velocity, collective learning, and radical initiative.
                            </p>
                        </div>
                    </div>

                    {/* Roles Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-16">
                        {roles.map((role, index) => (
                            <div key={index} className="bg-white border border-surface-200 rounded-3xl p-8 group hover:border-primary-500/30 transition-all duration-300 shadow-soft">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <role.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-black text-surface-900 mb-2 uppercase tracking-tight">{role.title}</h3>
                                <p className="text-surface-500 font-bold leading-relaxed italic text-sm">
                                    {role.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Application CTA */}
                    <div className="text-center bg-surface-900 text-white rounded-3xl p-12 shadow-premium animate-slide-up">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-8 h-8 text-primary-400" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Submit Credentials</h2>
                        <p className="text-surface-400 font-bold mb-8 max-w-md mx-auto">
                            If your specialization is not listed, submit your portfolio and technical briefing for future considerations.
                        </p>
                        <a
                            href="mailto:careers@peerly.in"
                            className="inline-flex items-center gap-3 bg-white text-surface-900 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all shadow-lg uppercase tracking-widest text-sm"
                        >
                            <Mail className="w-5 h-5" />
                            careers@peerly.in
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
