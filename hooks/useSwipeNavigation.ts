// hooks/useSwipeNavigation.ts
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

interface SwipeConfig {
  threshold?: number // Distance minimale pour déclencher le swipe (px)
  velocity?: number  // Vitesse minimale (px/ms)
  preventScroll?: boolean // Empêcher le scroll vertical pendant le swipe
  enabledRoutes?: string[] // Routes où le swipe est activé
  routeMap?: { [key: string]: { left?: string, right?: string } } // Mapping des routes
}

interface SwipeNavigation {
  onTouchStart: (e: TouchEvent) => void
  onTouchMove: (e: TouchEvent) => void
  onTouchEnd: (e: TouchEvent) => void
  isSwipeActive: boolean
  swipeProgress: number // 0-1, utile pour les animations
}

export const useSwipeNavigation = (config: SwipeConfig = {}): SwipeNavigation => {
  const router = useRouter()
  const {
    threshold = 80, // Réduit pour mobile
    velocity = 0.25, // Plus sensible
    preventScroll = true,
    enabledRoutes,
    routeMap
  } = config

  const [isSwipeActive, setIsSwipeActive] = useState(false)
  const [swipeProgress, setSwipeProgress] = useState(0)
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  // Configuration par défaut des routes
  const defaultRouteMap = {
    '/': { left: null, right: '/search' },
    '/search': { left: '/', right: '/leaderboard' },
    '/leaderboard': { left: '/search', right: '/profile' },
    '/profile': { left: '/leaderboard', right: null },
    // Ajoute d'autres routes selon tes besoins
  }

  const currentRouteMap = routeMap || defaultRouteMap

  // Vérifier si le swipe est autorisé sur la route actuelle
  const isSwipeEnabled = () => {
    if (enabledRoutes) {
      return enabledRoutes.includes(router.pathname)
    }
    return Object.keys(currentRouteMap).includes(router.pathname)
  }

  const onTouchStart = (e: TouchEvent) => {
    if (!isSwipeEnabled()) return

    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    }
    setIsSwipeActive(false)
    setSwipeProgress(0)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current || !isSwipeEnabled()) return

    const touch = e.touches[0]
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    }

    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Détecter si c'est un swipe horizontal
    if (absDeltaX > absDeltaY && absDeltaX > 10) {
      setIsSwipeActive(true)
      
      // Calculer le progrès du swipe (0-1)
      const progress = Math.min(absDeltaX / threshold, 1)
      setSwipeProgress(progress)

      // Empêcher le scroll si configuré
      if (preventScroll) {
        e.preventDefault()
      }
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStartRef.current || !touchCurrentRef.current || !isSwipeEnabled()) {
      setIsSwipeActive(false)
      setSwipeProgress(0)
      return
    }

    const deltaX = touchCurrentRef.current.x - touchStartRef.current.x
    const deltaY = touchCurrentRef.current.y - touchStartRef.current.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const deltaTime = Date.now() - touchStartRef.current.time
    const velocityX = absDeltaX / deltaTime

    // Vérifier si c'est un swipe valide
    const isHorizontalSwipe = absDeltaX > absDeltaY
    const isLongEnough = absDeltaX > threshold
    const isFastEnough = velocityX > velocity
    const isValidSwipe = isHorizontalSwipe && (isLongEnough || isFastEnough)

    if (isValidSwipe) {
      const currentRoute = router.pathname
      const routeConfig = currentRouteMap[currentRoute]

      if (routeConfig) {
        let targetRoute: string | null = null

        if (deltaX > 0 && routeConfig.left) {
          // Swipe vers la droite = page précédente (retour)
          targetRoute = routeConfig.left
        } else if (deltaX < 0 && routeConfig.right) {
          // Swipe vers la gauche = page suivante
          targetRoute = routeConfig.right
        }

        if (targetRoute) {
          // Animation de transition avant navigation
          setSwipeProgress(1)
          setTimeout(() => {
            router.push(targetRoute as string)
          }, 150) // Délai pour l'animation
        }
      }
    }

    // Reset
    setTimeout(() => {
      setIsSwipeActive(false)
      setSwipeProgress(0)
      touchStartRef.current = null
      touchCurrentRef.current = null
    }, 150)
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwipeActive,
    swipeProgress
  }
}