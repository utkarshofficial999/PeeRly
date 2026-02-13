'use client'

import React, { useEffect, useState, useMemo, memo } from 'react'

/**
 * Highly Optimized Animated Background
 * - Reduced shape count (12 triangles)
 * - CSS-only transforms (scale, rotate, opacity)
 * - GPU acceleration with will-change
 * - Page Visibility API to pause animations
 * - Hidden on mobile to save battery/CPU
 */
const AnimatedBackground = memo(() => {
    const [isVisible, setIsVisible] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Page Visibility API to pause animation when tab is inactive
        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible')
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    const shapes = useMemo(() => {
        // Drastically reduced shape count (12 shapes as requested)
        return Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            // Spread shapes across the screen
            left: `${(i % 4) * 25 + Math.random() * 10}%`,
            top: `${Math.floor(i / 4) * 33 + Math.random() * 10}%`,
            delay: i * 0.8,
            duration: 10 + Math.random() * 5,
            scale: 0.5 + Math.random() * 1.5,
            rotation: Math.random() * 360
        }))
    }, [])

    if (!mounted) {
        return <div className="fixed inset-0 z-0 bg-[#F9F9F9]" />
    }

    return (
        <div
            className={`fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block ${!isVisible ? 'pause-animations' : ''}`}
            aria-hidden="true"
        >
            {/* Ambient Background Base */}
            <div className="absolute inset-0 bg-[#F9F9F9]" />

            {/* Ambient Radial Gradients (Static) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(98,35,210,0.03),transparent_70%)]" />

            <svg className="w-full h-full opacity-[0.22]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="tri-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6223D2" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {shapes.map((shape) => (
                    <g
                        key={shape.id}
                        style={{
                            transform: `translate(${shape.left}, ${shape.top}) rotate(${shape.rotation}deg) scale(${shape.scale})`,
                            transformBox: 'fill-box',
                            transformOrigin: 'center'
                        }}
                    >
                        <path
                            d="M 50,20 L 80,80 L 20,80 Z"
                            fill="url(#tri-grad)"
                            className="optimized-triangle-float"
                            style={{
                                animationDelay: `${shape.delay}s`,
                                animationDuration: `${shape.duration}s`,
                                willChange: 'transform, opacity'
                            }}
                        />
                    </g>
                ))}
            </svg>

            {/* Subtle Overlay to blend */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
        </div>
    )
})

AnimatedBackground.displayName = 'AnimatedBackground'

export default AnimatedBackground
