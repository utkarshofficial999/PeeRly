'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Mail, Clock, MapPin, Send } from 'lucide-react'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-4xl md:text-6xl font-display font-black text-surface-900 mb-6 tracking-tight">
                            Contact <span className="gradient-text italic">Us</span>
                        </h1>
                        <p className="text-xl text-surface-600 font-medium max-w-2xl mx-auto">
                            We&apos;re here to help! Reach out with questions, feedback, or partnership ideas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 bg-white p-8 md:p-12 premium-card">
                        {/* Contact Info */}
                        <div className="space-y-10 animate-slide-left">
                            <h2 className="text-3xl font-black text-surface-900 tracking-tight">Get in Touch</h2>

                            <div className="flex items-start gap-5 group">
                                <div className="w-14 h-14 rounded-2xl bg-primary-500/5 group-hover:bg-primary-500/10 flex items-center justify-center shrink-0 transition-colors">
                                    <Mail className="w-7 h-7 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-surface-900 mb-1">Email Support</h3>
                                    <p className="text-surface-500 font-medium mb-3">For general inquiries and support.</p>
                                    <a href="mailto:support@peerly.in" className="text-primary-600 font-black hover:text-primary-700 transition-colors border-b-2 border-primary-500/20 hover:border-primary-500">support@peerly.in</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group">
                                <div className="w-14 h-14 rounded-2xl bg-peach-500/5 group-hover:bg-peach-500/10 flex items-center justify-center shrink-0 transition-colors">
                                    <Clock className="w-7 h-7 text-peach-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-surface-900 mb-1">Availability</h3>
                                    <p className="text-surface-500 font-medium leading-relaxed italic">
                                        Mon – Fri: 10 AM – 6 PM<br />
                                        Weekend: Limited support via email
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-5 group">
                                <div className="w-14 h-14 rounded-2xl bg-mint-500/5 group-hover:bg-mint-500/10 flex items-center justify-center shrink-0 transition-colors">
                                    <MapPin className="w-7 h-7 text-mint-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-surface-900 mb-1">Location</h3>
                                    <p className="text-surface-500 font-medium leading-relaxed">
                                        ABES Engineering College<br />
                                        Campus Innovation Hub, Ghaziabad
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-surface-50/50 p-8 rounded-3xl border border-surface-100 animate-slide-right">
                            <h2 className="text-2xl font-black text-surface-900 mb-8 tracking-tight">Send a Message</h2>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-surface-700 px-1">Full Name</label>
                                        <input type="text" className="w-full bg-white border border-surface-200 rounded-2xl px-5 py-4 text-surface-900 focus:border-primary-500 shadow-sm transition-all outline-none font-medium" placeholder="Utkarsh Sharma" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-surface-700 px-1">College Email</label>
                                        <input type="email" className="w-full bg-white border border-surface-200 rounded-2xl px-5 py-4 text-surface-900 focus:border-primary-500 shadow-sm transition-all outline-none font-medium" placeholder="mail@abes.ac.in" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-surface-700 px-1">Subject</label>
                                    <input type="text" className="w-full bg-white border border-surface-200 rounded-2xl px-5 py-4 text-surface-900 focus:border-primary-500 shadow-sm transition-all outline-none font-medium" placeholder="Partnership inquiry" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-surface-700 px-1">Message</label>
                                    <textarea className="w-full bg-white border border-surface-200 rounded-2xl px-5 py-4 text-surface-900 focus:border-primary-500 shadow-sm transition-all outline-none h-32 resize-none font-medium" placeholder="Tell us more..."></textarea>
                                </div>
                                <button type="button" className="btn-primary w-full py-5 justify-center shadow-lg shadow-primary-500/30 text-lg">
                                    Send Message
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
