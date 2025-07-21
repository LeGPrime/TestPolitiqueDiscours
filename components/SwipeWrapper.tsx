// components/SwipeWrapper.tsx
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation'

interface SwipeWrapperProps {
  children: ReactNode
  className?: string
  enableSwipe?: boolean
  customRouteMap?: { [key: string]: { left?: string, right?: string } }
}

export default function SwipeWrapper({ 
  children, 
  className = '', 
  enableSwipe = true,
  customRouteMap 
}: SwipeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 📱 DÉSACTIVER COMPLÈTEMENT SUR DESKTOP
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const swipeConfig = {
    threshold: 70,
    velocity: 0.25,
    preventScroll: true,
    routeMap: customRouteMap || {
      // 🔥 ORDRE EXACT DE TON SCREENSHOT
      '/': { right: '/search' }, // Accueil → Recherche
      '/search': { left: '/', right: '/top-reviews' }, // Recherche ← → Hall of Fame  
      '/top-reviews': { left: '/search', right: '/top-matches' }, // Hall of Fame ← → Top
      '/top-matches': { left: '/top-reviews', right: '/profile' }, // Top ← → Profil
      '/profile': { left: '/top-matches' }, // Profil ← Top
      
      // Pages secondaires
      '/match/[id]': { left: '/' },
      '/friends': { left: '/profile' },
      '/settings': { left: '/profile' },
      '/secret-login': { right: '/' }
    }
  }

  const { 
    onTouchStart, 
    onTouchMove, 
    onTouchEnd, 
    isSwipeActive, 
    swipeProgress 
  } = useSwipeNavigation(swipeConfig)

  useEffect(() => {
    // 📱 SEULEMENT ACTIVER SUR MOBILE
    if (!enableSwipe || !containerRef.current || !isMobile) return

    const container = containerRef.current

    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [enableSwipe, onTouchStart, onTouchMove, onTouchEnd, isMobile])

  // 📱 STYLES SEULEMENT SUR MOBILE
  const swipeStyle = (isMobile && isSwipeActive) ? {
    transform: `translateX(${swipeProgress * 10}px)`,
    opacity: 1 - (swipeProgress * 0.1),
    transition: swipeProgress > 0.8 ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none'
  } : {}

  return (
    <div
      ref={containerRef}
      className={`${isMobile ? 'touch-pan-y swipe-container' : ''} ${className}`}
      style={{
        touchAction: (enableSwipe && isMobile) ? 'pan-y' : 'auto',
        WebkitUserSelect: isMobile ? 'none' : 'auto',
        userSelect: isMobile ? 'none' : 'auto',
        ...swipeStyle
      }}
    >
      {/* 📱 INDICATEUR SEULEMENT SUR MOBILE */}
      {isMobile && isSwipeActive && swipeProgress > 0.2 && (
        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50 pointer-events-none">
          <div 
            className="flex items-center space-x-2 bg-black/50 text-white px-3 py-2 rounded-full backdrop-blur-sm"
            style={{
              opacity: swipeProgress,
              transform: `scale(${0.8 + (swipeProgress * 0.2)})`
            }}
          >
            <span className="text-sm">←</span>
            <span className="text-xs">Retour</span>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}