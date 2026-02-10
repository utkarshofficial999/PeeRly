'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PrivacyPage() {
    const sections = [
        {
            title: 'Information We Collect',
            content: 'We collect basic account information like your name, college email, and profile avatar. We also store your listings and messages to facilitate trades and ensure campus safety.'
        },
        {
            title: 'How We Use Your Data',
            content: 'Your data is used to verify your student status, display your listings, and allow other students to contact you. We do not sell your personal data to third parties.'
        },
        {
            title: 'Data Security',
            content: 'We use industry-standard security measures to protect your information. Your email is only used for verification and important platform notifications.'
        },
        {
            title: 'User Control',
            content: 'You can update your profile details and delete your listings at any time through your dashboard. If you wish to delete your account, please contact us.'
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white border border-surface-200 rounded-3xl shadow-premium p-10 md:p-16">
                        <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-2 tracking-tight uppercase">Privacy Policy</h1>
                        <p className="text-surface-400 font-black mb-10 pb-10 border-b border-surface-100 uppercase tracking-widest text-xs italic">Last Updated: February 10, 2026</p>

                        <div className="space-y-12">
                            {sections.map((section, index) => (
                                <section key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                    <h2 className="text-xl font-black text-surface-900 mb-4 tracking-tight uppercase flex items-center gap-3">
                                        <div className="w-2 h-8 bg-primary-500 rounded-full" />
                                        {section.title}
                                    </h2>
                                    <p className="text-surface-700 leading-relaxed font-bold pl-5 italic">
                                        {section.content}
                                    </p>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
