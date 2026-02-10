'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Rocket, Target, Users, ShieldCheck } from 'lucide-react'

export default function AboutPage() {
    const values = [
        {
            icon: Users,
            title: 'Community Driven',
            description: 'We believe in the power of student communities helping each other succeed.'
        },
        {
            icon: Target,
            title: 'Campus Focused',
            description: 'Everything we do is designed to solve specific challenges students face on campus.'
        },
        {
            icon: ShieldCheck,
            title: 'Safety & Trust',
            description: 'Verification via college ID ensures you are always trading with a verified peer.'
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20 animate-fade-in">
                        <h1 className="text-4xl md:text-6xl font-display font-black text-surface-900 mb-6 tracking-tight">
                            About <span className="gradient-text italic">PeeRly</span>
                        </h1>
                        <p className="text-xl text-surface-600 max-w-2xl mx-auto leading-relaxed font-medium">
                            We are building the infrastructure of trust for campus commerce—making college life more affordable and sustainable.
                        </p>
                    </div>

                    {/* Mission Section */}
                    <div className="premium-card p-10 md:p-16 mb-20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-primary-500/10 rounded-full" />
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-surface-900 mb-8 flex items-center gap-4 tracking-tight">
                                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                                    <Rocket className="w-6 h-6 text-primary-500" />
                                </div>
                                Our Mission
                            </h2>
                            <p className="text-xl text-surface-700 leading-relaxed mb-10 font-medium">
                                To create a trusted digital space where students help students. We want to remove the friction of buying and selling essentials, allowing you to focus on what matters most—your education and campus journey.
                            </p>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 rounded-2xl bg-surface-50 border border-surface-100 group-hover:border-surface-200 transition-colors">
                                    <h3 className="text-surface-900 font-extrabold mb-3 text-lg">The Problem</h3>
                                    <p className="text-surface-500 font-medium leading-relaxed">High costs of new materials, trust issues with open platforms, and the hassle of arranging meetups outside campus.</p>
                                </div>
                                <div className="p-8 rounded-2xl bg-primary-50/50 border border-primary-100 group-hover:border-primary-200 transition-colors">
                                    <h3 className="text-primary-900 font-extrabold mb-3 text-lg">Our Solution</h3>
                                    <p className="text-primary-700 font-medium leading-relaxed">A verified, campus-only marketplace that makes trades fast, secure, and right where you already are.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Values Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mb-24">
                        {values.map((value, index) => (
                            <div key={index} className="premium-card p-10 text-center animate-slide-up hover:border-primary-100 transition-all" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="w-14 h-14 rounded-2xl bg-primary-500/5 flex items-center justify-center mx-auto mb-8 shadow-sm">
                                    <value.icon className="w-7 h-7 text-primary-500" />
                                </div>
                                <h3 className="text-xl font-black text-surface-900 mb-4 tracking-tight">{value.title}</h3>
                                <p className="text-surface-500 font-medium leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Team Shoutout */}
                    <div className="text-center animate-fade-in py-10 border-t border-surface-100">
                        <p className="text-surface-400 font-black text-sm uppercase tracking-[0.2em]">Engineered with passion for</p>
                        <p className="text-primary-600 font-black text-lg mt-2 tracking-tight">ABES Engineering College Community</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
