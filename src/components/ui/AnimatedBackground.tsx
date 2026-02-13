'use client'

import React, { useEffect, useState, useMemo } from 'react'

/**
 * AnimatedBackground Component
 * Implements an Infinite SVG Triangle Fusion effect globally.
 * Features:
 * - GPU Accelerated transforms
 * - Responsive grid density
 * - Smooth HSL color cycling
 * - Sit behind all content (z-index: -1)
 */
const AnimatedBackground = () => {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const gridItems = useMemo(() => {
        if (!mounted) return []

        // Dynamic grid based on screen size
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        const cols = isMobile ? 4 : 8
        const rows = isMobile ? 8 : 10
        const total = cols * rows

        return Array.from({ length: total }).map((_, i) => ({
            id: i,
            row: Math.floor(i / cols),
            col: i % cols,
            delayOffset: Math.random() * 2 // Add some organic randomness
        }))
    }, [mounted])

    // Prevent hydration mismatch
    if (!mounted) {
        return <div className="fixed inset-0 z-0 bg-[#F9F9F9]" />
    }

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Ambient Base Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(98,35,210,0.08),transparent_70%)]" />

            {/* The Fusion Grid */}
            <div
                className="absolute inset-[-10%] w-[120%] h-[120%] grid grid-cols-4 md:grid-cols-8"
                style={{
                    // Slightly rotate for more dynamic feel
                    transform: 'rotate(-5deg) scale(1.1)'
                }}
            >
                {gridItems.map((item) => (
                    <div
                        key={item.id}
                        className="relative w-full aspect-square clip-hexagon opacity-[0.25] transition-opacity duration-1000"
                        style={{
                            // Hexagonal staggering logic
                            transform: item.row % 2 === 0 ? 'translateX(0)' : 'translateX(50%)',
                            marginTop: item.row === 0 ? 0 : '-18%',
                        }}
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                            {/* SVG Triangle Polygons with CSS Animations */}
                            {[0, 90, 180, 270].map((rotation, i) => (
                                <polygon
                                    key={rotation}
                                    points="50,50 80,20 20,20"
                                    className="animate-triangle-fusion"
                                    style={{
                                        transformOrigin: '50% 50%',
                                        // Complex delay logic for the 'fusion' flow
                                        animationDelay: `${(i * -1) - (item.id * 0.05) - item.delayOffset}s`,
                                        transform: `rotate(${rotation}deg)`,
                                    }}
                                />
                            ))}
                        </svg>
                    </div>
                ))}
            </div>

            {/* Premium Dark Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.03)_100%)]" />

            {/* Grain Texture (Optional but adds premium feel) */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    )
}

export default AnimatedBackground
