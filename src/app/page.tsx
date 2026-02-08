'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    BookOpen,
    Laptop,
    Bike,
    Sofa,
    Shirt,
    MoreHorizontal,
    ArrowRight,
    Shield,
    Users,
    Zap,
    CheckCircle,
    Star,
    TrendingUp,
    MapPin,
    Loader2
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ListingCard from '@/components/cards/ListingCard'
import { createClient } from '@/lib/supabase/client'

const categories = [
    { name: 'Textbooks', icon: BookOpen, color: 'from-blue-500 to-cyan-500', count: 234 },
    { name: 'Electronics', icon: Laptop, color: 'from-purple-500 to-pink-500', count: 156 },
    { name: 'Cycles', icon: Bike, color: 'from-green-500 to-emerald-500', count: 89 },
    { name: 'Furniture', icon: Sofa, color: 'from-orange-500 to-amber-500', count: 67 },
    { name: 'Clothing', icon: Shirt, color: 'from-rose-500 to-red-500', count: 123 },
    { name: 'More', icon: MoreHorizontal, color: 'from-slate-500 to-slate-600', count: null },
]

const features = [
    {
        icon: Shield,
        title: 'Verified Students Only',
        description: "Every user is verified with their college email. Trade with confidence knowing you're dealing with real students.",
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
    },
    {
        icon: MapPin,
        title: 'Campus-Based',
        description: 'Find items within your campus. No shipping hassles - just meet up between classes.',
        color: 'text-primary-400',
        bgColor: 'bg-primary-500/10',
    },
    {
        icon: Zap,
        title: 'Instant Messaging',
        description: 'Chat directly with sellers in real-time. Negotiate prices and arrange meetups easily.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
    },
    {
        icon: TrendingUp,
        title: 'Smart Pricing',
        description: 'See what similar items sold for. Get fair prices for both buyers and sellers.',
        color: 'text-accent-400',
        bgColor: 'bg-accent-500/10',
    },
]

const stats = [
    { value: '10K+', label: 'Active Students' },
    { value: '₹50L+', label: 'Worth Traded' },
    { value: '15+', label: 'Colleges' },
    { value: '4.9★', label: 'User Rating' },
]

const testimonials = [
    {
        quote: "Sold all my engineering books in just 2 days! Way better than those chaotic WhatsApp groups.",
        author: "Priya Sharma",
        role: "Final Year, ABES EC",
        avatar: "PS",
    },
    {
        quote: "Found a barely-used laptop at half the market price. The seller was from my own hostel!",
        author: "Rahul Kumar",
        role: "2nd Year, CS",
        avatar: "RK",
    },
    {
        quote: "Love that I can trust sellers here - they're all verified students from my college.",
        author: "Ananya Singh",
        role: "3rd Year, IT",
        avatar: "AS",
    },
]

export default function HomePage() {
    const supabase = createClient()
    const [recentListings, setRecentListings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchRecent = async () => {
            const { data, error } = await supabase
                .from('listings')
                .select(`
                    *,
                    seller:profiles!listings_seller_id_fkey(full_name, avatar_url),
                    college:colleges(name)
                `)
                .eq('is_active', true)
                .eq('is_sold', false)
                .order('created_at', { ascending: false })
                .limit(8)

            if (data) setRecentListings(data)
            setIsLoading(false)
        }
        fetchRecent()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="min-h-screen bg-dark-950 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="glow-orb-primary w-[500px] h-[500px] -top-48 -left-48" />
            <div className="glow-orb-accent w-[400px] h-[400px] top-1/3 -right-32" />
            <div className="glow-orb-primary w-[300px] h-[300px] bottom-1/4 left-1/4" />

            <Header />

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 md:pt-32 pb-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-4xl mx-auto">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 animate-fade-in">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-sm text-primary-300">Now live at ABES Engineering College</span>
                            </div>

                            {/* Heading */}
                            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-slide-up">
                                Buy & Sell Within Your
                                <span className="block gradient-text">Campus Community</span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-xl text-dark-300 mb-10 max-w-2xl mx-auto animate-slide-up stagger-1">
                                The trusted marketplace for college students. Trade textbooks, electronics,
                                furniture, and more with verified peers from your own campus.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-2">
                                <Link href="/browse" className="btn-primary text-lg px-8 py-4">
                                    Start Browsing
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link href="/create" className="btn-secondary text-lg px-8 py-4">
                                    Sell Something
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-dark-400 animate-fade-in stagger-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span>Verified Students Only</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary-400" />
                                    <span>Safe & Secure</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-400" />
                                    <span>4.9/5 User Rating</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-12 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl md:text-4xl font-display font-bold gradient-text mb-1">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-dark-400">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Fresh on Campus Section */}
                <section className="py-20 px-4 bg-dark-900/40">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-2 text-white">
                                    Fresh on <span className="gradient-text">Campus</span>
                                </h2>
                                <p className="text-dark-400">The latest items posted by students at ABES EC</p>
                            </div>
                            <Link href="/browse" className="hidden sm:flex items-center gap-2 text-primary-400 font-bold hover:gap-3 transition-all">
                                View all <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {recentListings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        id={listing.id}
                                        title={listing.title}
                                        price={listing.price}
                                        condition={listing.condition}
                                        images={listing.images}
                                        sellerName={listing.seller?.full_name || 'Student'}
                                        sellerAvatar={listing.seller?.avatar_url}
                                        collegeName={listing.college?.name}
                                        viewsCount={listing.views_count}
                                        createdAt={listing.created_at}
                                        onSave={() => console.log('Save', listing.id)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-12 text-center sm:hidden">
                            <Link href="/browse" className="btn-secondary w-full py-4 justify-center">
                                View all listings
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 px-4 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                Why Students Love <span className="gradient-text">PeeRly</span>
                            </h2>
                            <p className="text-dark-400 max-w-2xl mx-auto">
                                Built specifically for campus communities, with features that matter
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((feature, index) => (
                                <div key={index} className="glass-card p-6 group hover:bg-white/10 transition-all duration-300">
                                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                    <p className="text-dark-400 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 px-4 bg-dark-900/50">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                Start Trading in 3 Steps
                            </h2>
                            <p className="text-dark-400">It&apos;s as simple as 1-2-3</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { step: '01', title: 'Sign Up', desc: 'Create account with your college email and get verified instantly' },
                                { step: '02', title: 'List or Browse', desc: 'Post what you want to sell or find great deals from peers' },
                                { step: '03', title: 'Meet & Trade', desc: 'Chat with the other party and meet on campus to complete the deal' },
                            ].map((item, index) => (
                                <div key={index} className="relative text-center">
                                    <div className="text-7xl font-display font-bold text-dark-800 mb-4">{item.step}</div>
                                    <h3 className="text-xl font-semibold text-white mb-2 -mt-8 relative">{item.title}</h3>
                                    <p className="text-dark-400">{item.desc}</p>
                                    {index < 2 && (
                                        <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                                            <ArrowRight className="w-8 h-8 text-dark-700" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                What Students Say
                            </h2>
                            <p className="text-dark-400">Join thousands of happy students</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="glass-card p-6">
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-dark-200 mb-6 leading-relaxed">{testimonial.quote}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-semibold text-white">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{testimonial.author}</div>
                                            <div className="text-sm text-dark-400">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="gradient-border glass-card p-12 text-center relative overflow-hidden">
                            <div className="glow-orb-primary w-64 h-64 -top-32 -right-32 opacity-30" />
                            <div className="glow-orb-accent w-48 h-48 -bottom-24 -left-24 opacity-30" />

                            <div className="relative">
                                <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                                    Ready to Start Trading?
                                </h2>
                                <p className="text-dark-300 mb-8 max-w-xl mx-auto">
                                    Join your campus community today and discover amazing deals from fellow students.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                                        Create Free Account
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <Link href="/browse" className="btn-secondary text-lg px-8 py-4">
                                        Browse Listings
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
