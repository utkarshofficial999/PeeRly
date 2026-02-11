import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import {
    Mail,
    Phone,
    MapPin
} from 'lucide-react'

const footerLinks = {
    product: [
        { name: 'Browse Listings', href: '/browse' },
        { name: 'Sell an Item', href: '/create' },
        { name: 'Categories', href: '/categories' },
        { name: 'How It Works', href: '/how-it-works' },
    ],
    company: [
        { name: 'About Us', href: '/about' },
        { name: 'For Colleges', href: '/colleges' },
        { name: 'Blog', href: '/blog' },
        { name: 'Careers', href: '/careers' },
    ],
    support: [
        { name: 'Help Center', href: '/help' },
        { name: 'Safety Tips', href: '/safety' },
        { name: 'Report Issue', href: '/report' },
        { name: 'Contact Us', href: '/contact' },
    ],
    legal: [
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Cookie Policy', href: '/cookies' },
    ],
}



export default function Footer() {
    return (
        <footer className="bg-white border-t border-surface-100">
            <div className="container-custom py-20">
                {/* Top Section */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center mb-6 group">
                            <Logo className="transition-transform duration-300 group-hover:scale-105" />
                        </Link>
                        <p className="text-surface-600 font-bold text-base mb-8 max-w-xs leading-relaxed italic">
                            The definitive student-to-student marketplace. Building a safer, more connected campus economy.
                        </p>
                        {/* Contact Info */}
                        <div className="space-y-3 font-black text-sm tracking-tight">
                            <a href="mailto:utkarshofficial999@gmail.com" className="flex items-center gap-3 text-surface-600 hover:text-primary-600 transition-colors">
                                <Mail className="w-4 h-4" />
                                utkarshofficial999@gmail.com
                            </a>
                            <div className="flex items-center gap-3 text-surface-600">
                                <MapPin className="w-4 h-4 text-primary-600" />
                                ABES Engineering College, Ghaziabad
                            </div>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-sm font-black text-surface-900 uppercase tracking-widest mb-6">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm font-bold text-surface-700 hover:text-primary-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="text-sm font-black text-surface-900 uppercase tracking-widest mb-6">Company</h4>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm font-bold text-surface-700 hover:text-primary-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="text-sm font-black text-surface-900 uppercase tracking-widest mb-6">Support</h4>
                        <ul className="space-y-4">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm font-bold text-surface-700 hover:text-primary-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-sm font-black text-surface-900 uppercase tracking-widest mb-6">Legal</h4>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-sm font-bold text-surface-700 hover:text-primary-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-surface-100 pt-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        {/* Copyright */}
                        <p className="text-xs font-black text-surface-500 tracking-widest uppercase">
                            © {new Date().getFullYear()} PeerLY. Engineered for Excellence.
                        </p>


                    </div>
                </div>
            </div>
        </footer>
    )
}
