import { useState, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
}

export function MobilePullToRefresh({
  onRefresh,
  children,
  threshold = 80
}: MobilePullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    if (diff > 0) {
      setIsPulling(true)
      setPullDistance(Math.min(diff, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setIsPulling(false)
    setPullDistance(0)
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${isPulling ? pullDistance * 0.5 : 0}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease'
      }}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Actualisation...' : pullDistance >= threshold ? 'Relâchez pour actualiser' : 'Tirez pour actualiser'}
            </span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}