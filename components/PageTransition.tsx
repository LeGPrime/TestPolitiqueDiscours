// components/PageTransition.tsx
import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // 📱 DÉTECTER SI ON EST SUR MOBILE
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // 📱 SEULEMENT ACTIVER LES TRANSITIONS SUR MOBILE
    if (!isMobile) return

    const handleRouteChangeStart = (url: string) => {
      setIsTransitioning(true)
      
      const currentPath = router.pathname
      const targetPath = url

      // 🔥 ORDRE EXACT DE TON SCREENSHOT
      const pageOrder = [
        '/',           // Accueil
        '/search',     // Recherche  
        '/top-reviews', // Hall of Fame
        '/top-matches', // Top
        '/profile'     // Profil
      ]

      const currentIndex = pageOrder.indexOf(currentPath)
      const targetIndex = pageOrder.indexOf(targetPath)

      if (currentIndex !== -1 && targetIndex !== -1) {
        setTransitionDirection(targetIndex > currentIndex ? 'right' : 'left')
      } else {
        setTransitionDirection('right')
      }
    }

    const handleRouteChangeComplete = () => {
      setTimeout(() => {
        setIsTransitioning(false)
        setTransitionDirection(null)
      }, 300)
    }

    router.events.on('routeChangeStart', handleRouteChangeStart)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    router.events.on('routeChangeError', handleRouteChangeComplete)

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
      router.events.off('routeChangeError', handleRouteChangeComplete)
    }
  }, [router, isMobile])

  const getTransitionClass = () => {
    // 📱 PAS DE TRANSITION SUR DESKTOP
    if (!isMobile || !isTransitioning) return 'translate-x-0'
    
    if (transitionDirection === 'right') {
      return 'translate-x-full'
    } else {
      return '-translate-x-full'
    }
  }

  return (
    <div className={isMobile ? "relative overflow-hidden" : ""}>
      <div
        className={isMobile ? `transition-transform duration-300 ease-in-out ${getTransitionClass()}` : ''}
        style={{
          willChange: isMobile ? 'transform' : 'auto'
        }}
      >
        {children}
      </div>
    </div>
  )
}