// components/MobileAppNavigation.tsx - Version épurée et réorganisée
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Home, Search, Users, Crown, User, Trophy
} from 'lucide-react'
import AvatarDisplay from './AvatarDisplay'
import NotificationCenter from './NotificationCenter'

export default function MobileAppNavigation() {
  const { data: session } = useSession()
  const router = useRouter()

  const bottomTabs = [
    { 
      href: '/', 
      label: 'Accueil', 
      icon: Home, 
      active: router.pathname === '/'
    },
    { 
      href: '/search', 
      label: 'Recherche', 
      icon: Search, 
      active: router.pathname.startsWith('/search')
    },
    { 
      href: '/top-reviews', 
      label: 'Hall of Fame', 
      icon: Crown, 
      active: router.pathname === '/top-reviews',
      special: true // Pour style spécial
    },
    { 
      href: '/friends', 
      label: 'Amis', 
      icon: Users, 
      active: router.pathname === '/friends'
    },
    { 
      href: '/profile', 
      label: 'Profil', 
      icon: User, 
      active: router.pathname === '/profile'
    }
  ]

  if (!session) {
    return (
      <>
        {/* Header simple pour non-connectés */}
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 safe-top">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Sporatting</span>
              </div>
              
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                Connexion
              </Link>
            </div>
          </div>
        </header>
      </>
    )
  }

  return (
    <>
      {/* 📱 TOP HEADER - Clean et épuré */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 safe-top sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Nom à gauche */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Sporating</span>
            </div>
            
            {/* Notifications + Avatar à droite */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <NotificationCenter userId={session?.user?.id || session?.user?.email || 'user'} />
              
              {/* Avatar - Lien vers profil */}
              <Link
                href="/profile"
                className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
              >
                <AvatarDisplay
                  image={session.user?.image}
                  name={session.user?.name || session.user?.email || 'User'}
                  size="sm"
                  showBorder={true}
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 BOTTOM NAVIGATION - Style iOS/Android */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-bottom z-50">
        <div className="flex items-center justify-around py-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon
            const isSpecial = tab.special // Hall of Fame
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 touch-manipulation ${
                  tab.active 
                    ? isSpecial
                      ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                style={{ minHeight: '64px', minWidth: '64px' }} // Taille touch-friendly
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 transition-transform ${
                    tab.active ? 'scale-110' : 'hover:scale-105'
                  }`} />
                  
                  {/* Badge actif */}
                  {tab.active && (
                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                      isSpecial ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                  )}
                </div>
                
                <span className={`text-xs font-medium truncate transition-colors ${
                  tab.active ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 📱 BOTTOM PADDING - Éviter que le contenu soit caché */}
      <div className="h-20 safe-bottom"></div>
    </>
  )
}