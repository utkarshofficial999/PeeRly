'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { CheckCircle, MessageSquare, MapPin, Shield, Pointer, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function HowItWorks() {
    const steps = [
        {
            number: '01',
            title: 'Sign Up',
            description: 'Create your account using your college email. This ensures everyone on the platform is a verified student within your campus community.',
            icon: Shield,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10'
        },
        {
            number: '02',
            title: 'List or Browse',
            description: 'Got something to sell? Post it in seconds. Looking for something? Browse listings from peers at your college. Simple and direct.',
            icon: Pointer,
            color: 'text-primary-400',
            bgColor: 'bg-primary-500/10'
        },
        {
            number: '03',
            title: 'Chat & Decide',
            description: 'Use our in-app messaging to talk safely. Discuss the price, condition, and where you want to meet up on campus.',
            icon: MessageSquare,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10'
        },
        {
            number: '04',
            title: 'Meet & Exchange',
            description: 'Meet at a safe, public spot on campus. Inspect the item, handle the payment, and complete your trade. It&apos;s that easy!',
            icon: MapPin,
            color: 'text-accent-400',
            bgColor: 'bg-accent-500/10'
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-24 md:pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-surface-900 mb-6">
                            How <span className="gradient-text">PeeRly</span> Works
                        </h1>
                        <p className="text-xl text-surface-600 font-bold">
                            Buy. Sell. Connect. All within your campus limits.
                        </p>
                    </div>

                    {/* Steps List */}
                    <div className="space-y-8">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="premium-card p-8 flex flex-col md:flex-row gap-8 items-start animate-slide-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center shrink-0`}>
                                    <step.icon className={`w-8 h-8 ${step.color}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-display font-black text-primary-600 uppercase tracking-widest">{step.number}</span>
                                        <h2 className="text-2xl font-black text-surface-900">{step.title}</h2>
                                    </div>
                                    <p className="text-surface-600 leading-relaxed text-lg font-medium">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Safety Badge */}
                    <div className="mt-16 premium-card p-8 border-emerald-500/20 bg-emerald-500/5 text-center animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
                            <Shield className="w-5 h-5" />
                            <span className="font-bold">Safety First</span>
                        </div>
                        <h3 className="text-2xl font-black text-surface-900 mb-4">Help Us Keep PeeRly Safe</h3>
                        <p className="text-surface-600 font-medium mb-6">
                            Always rate your experience after a trade. If you encounter any issues, report them immediately so we can keep our community trusted and secure.
                        </p>
                        <Link href="/safety" className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center gap-2 transition-colors">
                            Read our Safety Tips <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* CTA */}
                    <div className="mt-12 text-center">
                        <Link href="/signup" className="btn-primary px-8 py-4 text-lg">
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
