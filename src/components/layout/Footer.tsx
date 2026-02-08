import Link from 'next/link'
import {
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
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

const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
]

export default function Footer() {
    return (
        <footer className="bg-white border-t border-surface-100">
            <div className="container-custom py-20">
                {/* Top Section */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-6 group">
                            <div className="w-11 h-11 rounded-[1.2rem] bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                <span className="text-2xl font-black text-white">P</span>
                            </div>
                            <span className="text-2xl font-display font-black text-surface-900 tracking-tight">
                                Peer<span className="gradient-text">LY</span>
                            </span>
                        </Link>
                        <p className="text-surface-400 font-medium text-base mb-8 max-w-xs leading-relaxed">
                            The definitive student-to-student marketplace. Building a safer, more connected campus economy.
                        </p>
                        {/* Contact Info */}
                        <div className="space-y-3 font-bold text-sm tracking-tight">
                            <a href="mailto:hello@peerly.in" className="flex items-center gap-3 text-surface-400 hover:text-primary-600 transition-colors">
                                <Mail className="w-4 h-4" />
                                hello@peerly.in
                            </a>
                            <div className="flex items-center gap-3 text-surface-400">
                                <MapPin className="w-4 h-4 text-primary-500" />
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
                                    <Link href={link.href} className="text-sm font-bold text-surface-400 hover:text-primary-600 transition-colors">
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
                                    <Link href={link.href} className="text-sm font-bold text-surface-400 hover:text-primary-600 transition-colors">
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
                                    <Link href={link.href} className="text-sm font-bold text-surface-400 hover:text-primary-600 transition-colors">
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
                                    <Link href={link.href} className="text-sm font-bold text-surface-400 hover:text-primary-600 transition-colors">
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
                        <p className="text-xs font-bold text-surface-400 tracking-widest uppercase">
                            © {new Date().getFullYear()} PeerLY. Engineered for Excellence.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    className="w-12 h-12 rounded-[1.2rem] bg-surface-50 flex items-center justify-center text-surface-400 hover:text-white hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/30 transition-all border border-surface-100"
                                    aria-label={social.name}
                                >
                                    <social.icon className="w-5 h-5 transition-transform hover:scale-110" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
