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
    onSave,
}: ListingCardProps) {
    const conditionInfo = CONDITIONS[condition]
    const imageUrl = images[0] || '/placeholder-product.jpg'
    const initials = sellerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <Link href={`/listing/${id}`} className="listing-card group block">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-dark-800">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="listing-card-image object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Save Button */}
                {onSave && (
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onSave()
                        }}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isSaved
                            ? 'bg-accent-500 text-white'
                            : 'bg-black/40 backdrop-blur-sm text-white hover:bg-accent-500'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                )}

                {/* Condition Badge */}
                <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${conditionInfo.bg} ${conditionInfo.color} backdrop-blur-sm`}>
                    {conditionInfo.label}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <h3 className="font-semibold text-white truncate mb-1 group-hover:text-primary-400 transition-colors">
                    {title}
                </h3>

                {/* Price */}
                <div className="text-xl font-bold gradient-text mb-3">
                    {formatPrice(price)}
                </div>

                {/* Seller Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        {sellerAvatar ? (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                                <Image
                                    src={sellerAvatar}
                                    alt={sellerName}
                                    fill
                                    className="object-cover"
                                    sizes="24px"
                                />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-[10px] font-semibold text-white">
                                {initials}
                            </div>
                        )}
                        <span className="text-sm text-dark-400 truncate">{sellerName}</span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-dark-500">
                        {viewsCount > 0 && (
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {viewsCount}
                            </span>
                        )}
                        <span>{formatRelativeTime(createdAt)}</span>
                    </div>
                </div>

                {/* College */}
                {collegeName && (
                    <div className="mt-2 text-xs text-dark-500 truncate">
                        📍 {collegeName}
                    </div>
                )}
            </div>
        </Link>
    )
}
