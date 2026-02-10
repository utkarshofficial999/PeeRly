'use client'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { BookOpen, Laptop, Bike, Sofa, Shirt, Dumbbell, Music, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function CategoriesPage() {
    const categories = [
        { name: 'Textbooks', slug: 'textbooks', icon: BookOpen, color: 'from-blue-500 to-cyan-500', desc: 'Notes, books, and study materials' },
        { name: 'Electronics', slug: 'electronics', icon: Laptop, color: 'from-purple-500 to-pink-500', desc: 'Laptops, phones, and gadgets' },
        { name: 'Cycles', slug: 'cycles', icon: Bike, color: 'from-green-500 to-emerald-500', desc: 'Bicycles and campus rides' },
        { name: 'Furniture', slug: 'furniture', icon: Sofa, color: 'from-orange-500 to-amber-500', desc: 'Chairs, desks, and hostel decor' },
        { name: 'Clothing', slug: 'clothing', icon: Shirt, color: 'from-rose-500 to-red-500', desc: 'Fashion and campus wear' },
        { name: 'Sports', slug: 'sports', icon: Dumbbell, color: 'from-emerald-500 to-teal-500', desc: 'Gym and sports equipment' },
        { name: 'Music', slug: 'music', icon: Music, color: 'from-indigo-500 to-blue-500', desc: 'Instruments and audio gear' },
        { name: 'Other', slug: 'other', icon: Package, color: 'from-slate-500 to-slate-600', desc: 'Anything else you can imagine' },
    ]

    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-6 uppercase tracking-tight">
                            Browse by <span className="gradient-text">Department</span>
                        </h1>
                        <p className="text-xl text-surface-600 font-bold">
                            Direct access to specialized campus inventory.
                        </p>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((category, index) => (
                            <Link
                                key={category.slug}
                                href={`/browse?category=${category.slug}`}
                                className="bg-white border border-surface-200 p-8 group overflow-hidden relative animate-slide-up rounded-3xl shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} p-4 mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                                    <category.icon className="w-full h-full text-white" />
                                </div>

                                <h2 className="text-2xl font-black text-surface-900 mb-2 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                                    {category.name}
                                </h2>
                                <p className="text-surface-500 font-bold mb-6 line-clamp-2 italic">
                                    {category.desc}
                                </p>

                                <div className="flex items-center gap-2 text-primary-600 font-black uppercase text-xs tracking-widest group-hover:gap-3 transition-all pt-4 border-t border-surface-50">
                                    Analyze Inventory <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
