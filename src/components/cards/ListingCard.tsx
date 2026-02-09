import Link from 'next/link'
import Image from 'next/image'
import { Heart, Eye } from 'lucide-react'
import { formatPrice, formatRelativeTime, CONDITIONS, type Condition } from '@/lib/utils'

interface ListingCardProps {
    id: string
    title: string
    price: number
    condition: Condition
    images: string[]
    sellerName: string
    sellerAvatar?: string
    collegeName?: string
    viewsCount?: number
    createdAt: string
    isSaved?: boolean
    isVerified?: boolean
    onSave?: () => void
}

export default function ListingCard({
    id,
    title,
    price,
    condition,
    images,
    sellerName,
    sellerAvatar,
    collegeName,
    viewsCount = 0,
    createdAt,
    isSaved = false,
    isVerified = false,
    onSave,
}: ListingCardProps) {
    const conditionInfo = CONDITIONS[condition]
    const imageUrl = images[0] || '/placeholder-product.jpg'
    const initials = sellerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <Link href={`/listing/${id}`} className="premium-card-hover group block overflow-hidden">
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-100">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Save Button */}
                {onSave && (
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onSave()
                        }}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSaved
                            ? 'bg-peach-400 text-white shadow-lg shadow-peach-400/30'
                            : 'bg-white/80 backdrop-blur-md text-surface-400 hover:text-peach-400 shadow-soft'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                )}

                {/* Condition Badge */}
                <div className="absolute bottom-4 left-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${conditionInfo.bg.replace('bg-', 'bg-').replace('-500', '-500/80')} ${conditionInfo.color.replace('text-', 'text-')} border-white/20`}>
                        {conditionInfo.label}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* College & Time */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest truncate max-w-[120px]">
                        {collegeName || 'CAMPUS'}
                    </span>
                    <span className="text-[10px] font-black text-surface-600 uppercase tracking-tighter">
                        {formatRelativeTime(createdAt)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-surface-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {title}
                </h3>

                {/* Price */}
                <div className="text-2xl font-black gradient-text mb-4">
                    {formatPrice(price)}
                </div>

                {/* Seller Info */}
                <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {sellerAvatar ? (
                            <div className="relative w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-surface-100 shadow-sm">
                                <Image
                                    src={sellerAvatar}
                                    alt={sellerName}
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                />
                            </div>
                        ) : (
                            <div className="w-7 h-7 rounded-xl bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-white shadow-soft">
                                {initials}
                            </div>
                        )}
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm text-surface-900 font-black truncate">{sellerName}</span>
                            {isVerified && (
                                <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {viewsCount > 0 && (
                        <div className="flex items-center gap-1.5 text-surface-700">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black">{viewsCount}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
