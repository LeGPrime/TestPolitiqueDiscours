// components/NoSwipeZone.tsx
import { ReactNode } from 'react'

interface NoSwipeZoneProps {
  children: ReactNode
  className?: string
}

/**
 * Composant pour désactiver le swipe sur certaines zones
 * Utile pour les formulaires, sliders, carousels, etc.
 */
export default function NoSwipeZone({ children, className = '' }: NoSwipeZoneProps) {
  return (
    <div 
      className={`no-swipe ${className}`}
      style={{
        touchAction: 'auto',
        WebkitUserSelect: 'auto',
        userSelect: 'auto'
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

// Hook utilitaire pour désactiver temporairement le swipe
export function useNoSwipe() {
  const disableSwipe = () => {
    document.body.style.touchAction = 'auto'
    document.body.classList.add('no-swipe')
  }
  
  const enableSwipe = () => {
    document.body.style.touchAction = 'pan-y'
    document.body.classList.remove('no-swipe')
  }
  
  return { disableSwipe, enableSwipe }
}