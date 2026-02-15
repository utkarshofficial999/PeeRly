'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
    ArrowRight,
    Shield,
    Users,
    Zap,
    CheckCircle,
    Star,
    TrendingUp,
    MapPin,
    Loader2,
    Smartphone
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ListingCard from '@/components/cards/ListingCard'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/ui/Logo'


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
    const supabase = useMemo(() => createClient(), [])
    const { user } = useAuth()
    const router = useRouter()
    const [recentListings, setRecentListings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (reg) => console.log('SW Registered:', reg.scope),
                    (err) => console.log('SW Registration Failed:', err)
                );
            });
        }

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const [isDownloading, setIsDownloading] = useState(false)

    const handleInstallClick = async () => {
        setIsDownloading(true)

        // Brief delay to make it feel like a "download" or preparation is happening
        await new Promise(resolve => setTimeout(resolve, 800))

        if (!deferredPrompt) {
            setIsDownloading(false)
            // Fallback for browsers that don't support beforeinstallprompt (like iOS Safari)
            alert('To install PeerLY App:\n\n' +
                '• If you see an "Install" icon in your address bar, click it.\n' +
                '• On iPhone: Tap the Share button and select "Add to Home Screen".\n' +
                '• On Android: Tap the 3 dots and select "Install App".');
            return
        }

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
        setIsDownloading(false)
    }

    useEffect(() => {
        const fetchRecent = async () => {
            const { data, error } = await supabase
                .from('listings')
                .select(`
                    *,
                    listing_type,
                    seller:profiles!listings_seller_id_fkey(full_name, avatar_url, is_verified),
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

    // Fetch saved listings for current user
    useEffect(() => {
        if (!user) {
            setSavedIds(new Set())
            return
        }

        const fetchSavedIds = async () => {
            try {
                const { data } = await supabase
                    .from('saved_listings')
                    .select('listing_id')
                    .eq('user_id', user.id)

                if (data) {
                    setSavedIds(new Set(data.map((item: { listing_id: string }) => item.listing_id)))
                }
            } catch (err) {
                console.error('Failed to fetch saved listings:', err)
            }
        }

        fetchSavedIds()
    }, [user, supabase])

    const handleToggleSave = async (listingId: string) => {
        if (!user) {
            router.push(`/login?next=/`)
            return
        }

        const isCurrentlySaved = savedIds.has(listingId)

        // Optimistic update
        setSavedIds(prev => {
            const next = new Set(prev)
            if (isCurrentlySaved) next.delete(listingId)
            else next.add(listingId)
            return next
        })

        try {
            if (isCurrentlySaved) {
                await supabase
                    .from('saved_listings')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('listing_id', listingId)
            } else {
                await supabase
                    .from('saved_listings')
                    .insert({ user_id: user.id, listing_id: listingId })
            }
        } catch (err) {
            console.error('Save error:', err)
            // Rollback on error
            setSavedIds(prev => {
                const next = new Set(prev)
                if (isCurrentlySaved) next.add(listingId)
                else next.delete(listingId)
                return next
            })
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Accent orbs - subtle in light mode */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-mint-100/20 rounded-full blur-[100px] -translate-x-1/2" />

            <Header />

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 md:pt-48 pb-20 px-4 min-h-[90vh] flex items-center overflow-hidden">
                    {/* Background Container with Zoom & Blur */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-white/60 z-10" /> {/* Light tint overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-surface-50 z-20" />
                        <div
                            className="absolute inset-0 bg-cover bg-center animate-hero-zoom transition-opacity duration-1000"
                            style={{
                                backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756eaa63f?q=80&w=2070&auto=format&fit=crop')`,
                                filter: 'blur(3px)'
                            }}
                        />
                    </div>

                    <div className="container-custom relative z-30">
                        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-soft border border-surface-100 mb-8 animate-in fade-in transition-all hover:scale-105 cursor-default group">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-mint-500"></span>
                                </span>
                                <span className="text-xs font-black text-surface-900 tracking-wide uppercase">Live at ABES Engineering College</span>
                            </div>
                            {/* Logo Hero */}
                            <div className="flex justify-center mb-6 animate-in fade-in stagger-1">
                                <Logo className="scale-150 md:scale-[2]" />
                            </div>

                            {/* Heading */}
                            <h1 className="text-6xl md:text-8xl font-display font-extrabold text-surface-900 tracking-tight mb-8 animate-in slide-in-from-bottom-8">
                                Buy, Sell & <span className="gradient-text">Collaborate</span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-xl md:text-2xl text-surface-800 mb-12 max-w-2xl mx-auto animate-in fade-in stagger-1 leading-relaxed font-medium">
                                The ultimate student marketplace. Trade resources, share skills, and connect with
                                <span className="text-primary-600 font-black px-1">verified peers</span> across your campus.
                            </p>

                            {/* Main CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full animate-in slide-in-from-bottom-12 stagger-2">
                                <Link href="/browse" className="btn-primary w-full sm:w-auto text-lg px-10 py-5 group shadow-button">
                                    Start Exploring
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <Link href="/create" className="btn-secondary w-full sm:w-auto text-lg px-10 py-5 border-none bg-white shadow-soft hover:shadow-premium">
                                    Post a Listing
                                </Link>
                                <button
                                    onClick={handleInstallClick}
                                    disabled={isDownloading}
                                    className="flex items-center gap-2 text-primary-600 font-black hover:text-primary-700 transition-colors py-3 px-6 rounded-2xl bg-white/50 backdrop-blur-sm shadow-soft hover:shadow-premium group disabled:opacity-50"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Smartphone className="w-5 h-5 transition-transform group-hover:scale-110" />
                                            Download App
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                </section>



                {/* Fresh Feed */}
                <section className="py-24 overflow-hidden">
                    <div className="container-custom">
                        <div className="flex items-end justify-between mb-16 px-4">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-display font-black text-surface-900 mb-4 tracking-tight">
                                    Student <span className="gradient-text">Exclusives</span>
                                </h2>
                                <p className="text-surface-700 font-bold text-lg">Curated listings from your college peers</p>
                            </div>
                            <Link href="/browse" className="hidden sm:flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all">
                                See Everything <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                                        isVerified={listing.seller?.is_verified}
                                        createdAt={listing.created_at}
                                        listingType={listing.listing_type}
                                        isSaved={savedIds.has(listing.id)}
                                        onSave={() => handleToggleSave(listing.id)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-16 text-center sm:hidden w-full">
                            <Link href="/browse" className="btn-secondary w-full py-5 rounded-2xl">
                                View all listings
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features: The Social Advantage */}
                <section className="py-24 bg-surface-900 text-white rounded-[4rem] mx-4 my-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-900/50 to-transparent" />
                    <div className="container-custom relative z-10">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                                Built for the <span className="text-mint-400">Campus Social</span>
                            </h2>
                            <p className="text-surface-300 text-lg max-w-2xl mx-auto font-bold uppercase tracking-widest text-sm">
                                PeerLY isn&apos;t just a marketplace. It&apos;s where your college network meets commerce.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] group hover:bg-white/10 transition-all duration-500">
                                    <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                        <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-black mb-3 tracking-tight uppercase">
                                        {feature.title}
                                    </h3>
                                    <p className="text-surface-200 leading-relaxed text-sm font-bold italic">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24">
                    <div className="container-custom">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 tracking-tight uppercase">
                                Trusted by <span className="text-primary-600">Students</span>
                            </h2>
                            <p className="text-surface-600 font-black text-lg uppercase tracking-widest">Join the thousands of peers trading on PeerLY</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="premium-card p-10 flex flex-col justify-between hover:-translate-y-2 transition-all">
                                    <div>
                                        <div className="flex items-center gap-1 mb-8">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-peach-400 text-peach-400" />
                                            ))}
                                        </div>
                                        <p className="text-surface-900 text-lg font-medium leading-relaxed italic mb-8">
                                            &ldquo;{testimonial.quote}&rdquo;
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 pt-8 border-t border-surface-100">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-sm font-black text-white shadow-soft">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-surface-900">{testimonial.author}</div>
                                            <div className="text-xs font-bold text-primary-500 uppercase tracking-widest">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Download App Section */}
                <section className="py-24 bg-surface-50 relative overflow-hidden">
                    <div className="container-custom">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2 space-y-8 animate-in slide-in-from-left-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary-50 border border-primary-100 mb-4">
                                    <Smartphone className="w-4 h-4 text-primary-600" />
                                    <span className="text-xs font-black text-primary-600 tracking-wider uppercase">Mobile Experience</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-display font-black text-surface-900 leading-tight">
                                    PeerLY in Your <span className="gradient-text">Pocket</span>
                                </h2>
                                <p className="text-xl text-surface-700 font-medium leading-relaxed">
                                    Experience the smoothest way to buy and sell on campus. Install PeerLY as an app and get instant access to your listings and messages.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-mint-100 flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle className="w-4 h-4 text-mint-600" />
                                        </div>
                                        <p className="text-surface-700 font-bold">Installs in seconds - no app store required</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-mint-100 flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle className="w-4 h-4 text-mint-600" />
                                        </div>
                                        <p className="text-surface-700 font-bold">Fast, lightweight, and works offline</p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-mint-100 flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle className="w-4 h-4 text-mint-600" />
                                        </div>
                                        <p className="text-surface-700 font-bold">Real-time alerts for your listings</p>
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-wrap gap-4">
                                    <button
                                        onClick={handleInstallClick}
                                        disabled={isDownloading}
                                        className="btn-primary px-8 py-4 text-lg shadow-button hover:shadow-premium disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Downloading...
                                            </>
                                        ) : 'Download App Now'}
                                    </button>
                                </div>
                            </div>
                            <div className="lg:w-1/2 relative">
                                <div className="relative z-10 animate-in zoom-in-95 duration-700">
                                    {/* Phone Mockup Placeholder or generated image */}
                                    <div className="relative w-full max-w-[320px] mx-auto aspect-[9/19] bg-surface-900 rounded-[3rem] border-[12px] border-surface-800 shadow-premium overflow-hidden">
                                        <div className="absolute top-0 inset-x-0 h-10 bg-surface-800 flex items-center justify-center">
                                            <div className="w-20 h-5 bg-black rounded-full" />
                                        </div>
                                        <div className="absolute inset-0 top-10 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black">P</div>
                                            <h3 className="text-white text-xl font-bold tracking-tight">PeerLY</h3>
                                            <p className="text-surface-400 text-sm font-medium">Ready to install</p>
                                            <button
                                                onClick={handleInstallClick}
                                                disabled={isDownloading}
                                                className="w-full btn-primary py-2 text-sm rounded-xl disabled:opacity-70 flex items-center justify-center gap-2"
                                            >
                                                {isDownloading ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Installing...
                                                    </>
                                                ) : 'Install Now'}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Decorative orbs */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-400/20 rounded-full blur-[40px] z-0 animate-pulse" />
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-mint-400/20 rounded-full blur-[40px] z-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32">
                    <div className="container-custom">
                        <div className="bg-gradient-primary rounded-[4rem] p-16 md:p-24 text-center relative overflow-hidden shadow-premium">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-mint-400/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />

                            <div className="relative z-10 max-w-3xl mx-auto">
                                <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-8 tracking-tighter">
                                    Ready to Elevate Your Campus Experience?
                                </h2>
                                <p className="text-primary-100 text-xl mb-12 font-medium">
                                    Connect with your peers, unlock hidden deals, and build your campus network today.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                    <Link href="/signup" className="btn-secondary border-none bg-white text-primary-600 text-lg px-12 py-5 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                        Join PeerLY Now
                                    </Link>
                                    <Link href="/browse" className="btn-primary bg-primary-900/30 border border-white/20 text-white text-lg px-12 py-5 hover:bg-primary-900/50 shadow-none transition-all">
                                        Browse Feed
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div >
    )
}
