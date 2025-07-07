// components/MobileAppNavigation.tsx - Navigation spéciale pour l'app mobile
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Home, Search, Users, Crown, User, Bell, Settings, LogOut,
  Trophy, BarChart3, Menu, X
} from 'lucide-react'
import AvatarDisplay from './AvatarDisplay'
import NotificationCenter from './NotificationCenter'
import ThemeToggle from './ThemeToggle'

export default function MobileAppNavigation() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
                <span className="text-lg font-bold text-gray-900 dark:text-white">Sporating</span>
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
      {/* 📱 TOP HEADER - Minimaliste pour app */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 safe-top sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo simple */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Sporating</span>
            </div>
            
            {/* Actions top */}
            <div className="flex items-center space-x-2">
              <NotificationCenter userId={session?.user?.id || session?.user?.email || 'user'} />
              
              {/* Bouton profil/menu */}
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <AvatarDisplay
                  image={session.user?.image}
                  name={session.user?.name || session.user?.email || 'User'}
                  size="sm"
                  showBorder={true}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 📱 MENU PROFIL DÉROULANT */}
        {showProfileMenu && (
          <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="px-4 py-3 space-y-2">
              {/* Info utilisateur */}
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                <AvatarDisplay
                  image={session.user?.image}
                  name={session.user?.name || session.user?.email || 'User'}
                  size="md"
                  showBorder={true}
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {session.user?.name || 'Utilisateur'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </div>
                </div>
              </div>

              {/* Actions supplémentaires */}
              <Link
                href="/top-matches"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Top Événements</span>
              </Link>

              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-700 dark:text-gray-300">Thème</span>
                <ThemeToggle />
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="flex items-center space-x-3 px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}
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
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 ${
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