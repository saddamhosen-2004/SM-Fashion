'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface BannerProps {
  banners: any[]
}

export function HeroBanner({ banners }: BannerProps) {
  const [current, setCurrent] = useState(0)
  const { t } = useLanguage()

  // Fallback banner if database has no active banners
  const displayBanners = banners && banners.length > 0 ? banners : [
    {
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
      link_url: '/products'
    }
  ]

  useEffect(() => {
    if (displayBanners.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % displayBanners.length)
    }, 6000) // switch every 6 seconds
    return () => clearInterval(timer)
  }, [displayBanners.length])

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? displayBanners.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % displayBanners.length)
  }

  return (
    <div className="relative w-full h-[520px] bg-slate-950 overflow-hidden group">
      
      {/* Slides */}
      {displayBanners.map((slide, index) => {
        const isActive = index === current
        return (
          <div
            key={slide.id || index}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
              isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
            }`}
          >
            {/* Background Image with dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent z-10" />
            <img
              src={slide.image_url}
              alt="Fashion Banner"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Content overlay */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center sm:items-start text-center sm:text-left gap-6">
                <Badge variant="secondary" className="px-3 py-1 font-bold text-xs uppercase tracking-wider animate-bounce">
                  ✨ EID COLLECTION 2026
                </Badge>
                <h1 className="max-w-xl text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm font-inter">
                  Elegance in <span className="text-primary font-black">Every Thread</span>
                </h1>
                <p className="max-w-md text-sm sm:text-base text-slate-200 leading-relaxed font-medium drop-shadow">
                  Discover our premium collection, crafted with rich fabrics, delicate embroidery, and authentic Bangladeshi heritage.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
                  <Link href={slide.link_url || '/products'}>
                    <Button className="h-12 px-8 rounded-full bg-primary hover:bg-primary-hover shadow-lg font-bold gap-2 text-sm">
                      Shop Collection <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Navigation arrows (only show if multiple slides) */}
      {displayBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-900/30 hover:bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-900/30 hover:bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {displayBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === current ? 'w-8 bg-primary' : 'w-2.5 bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  )
}
