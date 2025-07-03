// components/MobileBottomSheet.tsx - Sheet modal mobile-friendly
import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  height?: 'auto' | 'half' | 'full'
}

export function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  height = 'auto' 
}: MobileBottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setTimeout(() => setIsVisible(false), 300)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current
    
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${Math.min(diff, 100)}px)`
    }
  }

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current
    
    if (diff > 100) {
      onClose()
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0px)'
    }
  }

  const getHeightClass = () => {
    switch (height) {
      case 'half': return 'max-h-[50vh]'
      case 'full': return 'max-h-[90vh]'
      default: return 'max-h-[80vh]'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`relative w-full bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${getHeightClass()}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// components/MobileTabBar.tsx - Navigation bottom mobile
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Search, Users, Trophy, User } from 'lucide-react'

export function MobileTabBar() {
  const router = useRouter()
  
  const tabs = [
    { icon: Home, label: 'Accueil', href: '/', active: router.pathname === '/' },
    { icon: Search, label: 'Recherche', href: '/search', active: router.pathname.startsWith('/search') },
    { icon: Users, label: 'Amis', href: '/friends', active: router.pathname === '/friends' },
    { icon: Trophy, label: 'Top', href: '/top-matches', active: router.pathname === '/top-matches' },
    { icon: User, label: 'Profil', href: '/profile', active: router.pathname === '/profile' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-bottom z-40">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-0 touch-target ${
                tab.active 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
              {tab.active && (
                <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// components/MobileSearchInput.tsx - Input de recherche optimisé mobile
import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface MobileSearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  showFilter?: boolean
  onFilterClick?: () => void
  filterActive?: boolean
}

export function MobileSearchInput({
  placeholder = "Rechercher...",
  value,
  onChange,
  onSearch,
  showFilter = false,
  onFilterClick,
  filterActive = false
}: MobileSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  const clearSearch = () => {
    onChange('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500' : ''
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
          {value && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {showFilter && (
          <button
            type="button"
            onClick={onFilterClick}
            className={`ml-3 p-3 rounded-xl border transition-all duration-200 touch-target ${
              filterActive
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  )
}

// components/MobileSwipeCard.tsx - Card avec swipe gestures
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

// components/MobilePullToRefresh.tsx - Pull to refresh
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