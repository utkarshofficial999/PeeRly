'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Calendar, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BlogPage() {
    const posts = [
        {
            title: '5 Smart Ways to Save Money in College',
            description: 'From second-hand books to hostel cooking, learn how to keep your wallet full while enjoying campus life.',
            category: 'Smart Living',
            date: 'Feb 4, 2026',
            author: 'Ananya S.',
        },
        {
            title: 'How to Sell Faster on PeeRly: Pro Tips',
            description: 'Better photos, clear descriptions, and fair pricing—the ultimate guide to clearing your hostel room.',
            category: 'Selling Tips',
            date: 'Feb 1, 2026',
            author: 'Rahul K.',
        },
        {
            title: 'Safety Tips for Campus Exchanges',
            description: 'Your safety is our priority. Here are the best spots on campus for meetups and what to check before you buy.',
            category: 'Safety',
            date: 'Jan 28, 2026',
            author: 'PeeRly Team',
        }
    ]

    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 uppercase tracking-tight">
                            The <span className="gradient-text">PeeRly</span> Blog
                        </h1>
                        <p className="text-xl text-surface-600 font-bold max-w-2xl mx-auto">
                            Campus Life. Smart Buying. Student Hustles.
                        </p>
                    </div>

                    {/* Blog Feed */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, index) => (
                            <div
                                key={index}
                                className="bg-white border border-surface-200 rounded-3xl overflow-hidden group hover:border-primary-500/30 transition-all duration-300 shadow-soft animate-slide-up"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Thumbnail Placeholder */}
                                <div className="aspect-[16/9] bg-surface-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {post.category}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {post.author}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-surface-900 mb-3 group-hover:text-primary-600 transition-colors leading-tight uppercase tracking-tight">
                                        {post.title}
                                    </h2>
                                    <p className="text-surface-500 font-bold text-sm mb-6 line-clamp-2 leading-relaxed italic">
                                        {post.description}
                                    </p>
                                    <Link href="#" className="inline-flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all pt-4 border-t border-surface-50 w-full">
                                        Read Dispatch <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Newsletter Simple */}
                    <div className="mt-20 bg-white border border-surface-200 rounded-3xl p-10 text-center relative overflow-hidden shadow-premium">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-surface-900 mb-2 uppercase tracking-tight">Contributor Protocol</h3>
                            <p className="text-surface-500 font-bold mb-6">We are actively seeking dispatches from the campus economy.</p>
                            <a href="mailto:blog@peerly.in" className="btn-primary px-8 py-3 rounded-2xl">Get in touch</a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
