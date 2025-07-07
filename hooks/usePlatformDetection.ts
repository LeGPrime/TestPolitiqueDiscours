// hooks/usePlatformDetection.ts - Détection automatique de la plateforme
import { useState, useEffect } from 'react'

export interface PlatformInfo {
  isCapacitor: boolean        // App mobile Capacitor
  isMobileWeb: boolean       // Navigateur mobile
  isDesktop: boolean         // Navigateur desktop
  platform: 'capacitor' | 'mobile-web' | 'desktop'
  userAgent: string
}

export const usePlatformDetection = (): PlatformInfo => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isCapacitor: false,
    isMobileWeb: false,
    isDesktop: true,
    platform: 'desktop',
    userAgent: ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = window.navigator.userAgent
    const isCapacitor = !!(window as any).Capacitor || 
                       window.location.protocol === 'capacitor:' ||
                       userAgent.includes('CapacitorWebView')
    
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?=.*Tablet)|Windows(?=.*Touch)/i.test(userAgent)
    const isMobileWeb = isMobileDevice && !isCapacitor && !isTablet
    const isDesktop = !isMobileDevice && !isCapacitor

    let platform: 'capacitor' | 'mobile-web' | 'desktop'
    if (isCapacitor) {
      platform = 'capacitor'
    } else if (isMobileWeb) {
      platform = 'mobile-web'
    } else {
      platform = 'desktop'
    }

    setPlatformInfo({
      isCapacitor,
      isMobileWeb,
      isDesktop,
      platform,
      userAgent
    })

    // Debug en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Platform Detection:', {
        isCapacitor,
        isMobileWeb,
        isDesktop,
        platform,
        userAgent: userAgent.substring(0, 50) + '...'
      })
    }
  }, [])

  return platformInfo
}

// Hook pour les styles conditionnels
export const usePlatformStyles = () => {
  const platform = usePlatformDetection()
  
  return {
    // Classes CSS conditionnelles
    containerClass: platform.isCapacitor 
      ? 'pb-20 safe-bottom' // Espace pour bottom nav
      : platform.isMobileWeb 
      ? 'pb-4' 
      : '',
      
    headerClass: platform.isCapacitor
      ? 'safe-top'
      : '',
      
    // Tailles tactiles
    touchTarget: platform.isCapacitor || platform.isMobileWeb
      ? 'min-h-[44px] min-w-[44px]' // iOS guidelines
      : 'min-h-[32px]',
      
    // Navigation
    showBottomNav: platform.isCapacitor,
    showMobileMenu: platform.isMobileWeb,
    showDesktopNav: platform.isDesktop
  }
}

// Utilitaires supplémentaires
export const isPlatform = {
  capacitor: () => {
    if (typeof window === 'undefined') return false
    return !!(window as any).Capacitor || window.location.protocol === 'capacitor:'
  },
  
  mobileWeb: () => {
    if (typeof window === 'undefined') return false
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    return isMobile && !isPlatform.capacitor()
  },
  
  desktop: () => {
    if (typeof window === 'undefined') return true
    return !isPlatform.capacitor() && !isPlatform.mobileWeb()
  }
}