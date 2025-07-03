import { useState, useRef } from 'react'

interface MobileSwipeCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  swipeThreshold?: number
  className?: string
}

export function MobileSwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className = ''
}: MobileSwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    setDragOffset(diff)
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${diff}px) rotate(${diff * 0.1}deg)`
      cardRef.current.style.opacity = Math.max(0.5, 1 - Math.abs(diff) / 300).toString()
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    if (Math.abs(dragOffset) > swipeThreshold) {
      if (dragOffset > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (dragOffset < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    
    // Reset card position
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)'
      cardRef.current.style.opacity = '1'
    }
    
    setDragOffset(0)
  }

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-200 ${isDragging ? '' : 'transform-none'} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  )
}
