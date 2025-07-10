// components/Navbar.tsx - Version corrigée avec profil en haut et safe area
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Trophy, Search, Users, LogOut, Bell, Settings, 
  User, BarChart3, Calendar, Target, Menu, X, Home, Crown
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NotificationCenter from './NotificationCenter'
import AvatarDisplay from './AvatarDisplay'

interface NavbarProps {
  activeTab?: string
}

export default function Navbar({ activeTab }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigationItems = [
    { 
      href: '/', 
      label: 'Accueil', 
      icon: Home, 
      active: activeTab === 'home' || router.pathname === '/',
      description: 'Événements à noter',
      id: 'home'
    },
    { 
      href: '/search', 
      label: 'Recherche', 
      icon: Search, 
      active: activeTab === 'search' || router.pathname.startsWith('/search'),
      description: 'Trouver des événements',
      id: 'search'
    },
    { 
      href: '/friends', 
      label: 'Amis', 
      icon: Users, 
      active: activeTab === 'friends' || router.pathname === '/friends',
      description: 'Réseau social',
      id: 'friends'
    },
    { 
      href: '/top-reviews', 
      label: 'Hall of Fame', 
      icon: Crown, 
      active: activeTab === 'hall-of-fame' || router.pathname === '/top-reviews',
      description: 'Meilleurs commentaires',
      id: 'hall'
    },
    { 
      href: '/top-matches', 
      label: 'Top', 
      icon: BarChart3, 
      active: activeTab === 'top' || router.pathname === '/top-matches',
      description: 'Meilleurs événements',
      id: 'top'
    }
  ]

  // Navigation mobile sans profil (sera en haut à droite)
  const mobileNavItems = navigationItems

  if (!session) {
    return (
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <Image
                  src="/GLOBAL.png"
                  alt="Sporating Logo"
                  width={140}
                  height={140}
                  className="rounded-lg"
                  priority
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sporating</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Ton œil sur le jeu.</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link
                href="/auth/signin"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      {/* 🖥️ DESKTOP HEADER - Masqué sur mobile */}
      <header className="hidden md:block bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
              <div className="relative">
                <Image
                  src="/GLOBAL.png"
                  alt="Sporating Logo"
                  width={80}
                  height={80}
                  className="rounded-lg group-hover:scale-105 transition-transform"
                  priority
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Sporating
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Un œil sur le jeu.
                </p>
              </div>
            </Link>
            
            {/* Actions droite */}
            <div className="flex items-center space-x-2">
              <NotificationCenter userId={session?.user?.id || session?.user?.email || 'user'} />

              {session.user?.email === 'admin@sporating.com' && (
                <Link 
                  href="/admin/sports-dashboard-2025"
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors"
                  title="Panneau d'administration"
                >
                  ⚙️ Admin
                </Link>
              )}

              <ThemeToggle />
              
              {/* Menu utilisateur desktop */}
              <Link 
                href="/profile"
                className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                title="Mon profil"
              >
                <AvatarDisplay
                  image={session.user?.image}
                  name={session.user?.name || session.user?.email || 'User'}
                  size="sm"
                  showBorder={true}
                />
                <span className="hidden lg:inline">
                  {session.user?.name?.split(' ')[0] || 'Profil'}
                </span>
              </Link>
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Navigation horizontale desktop - TOUS les onglets */}
          <nav className="flex space-x-6 mt-4">
            {[...navigationItems, { 
              href: '/profile', 
              label: 'Profil', 
              icon: User, 
              active: activeTab === 'profile' || router.pathname === '/profile',
              description: 'Mon profil',
              id: 'profile'
            }].map((item) => {
              const Icon = item.icon
              const isHallOfFame = item.id === 'hall'
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    item.active 
                      ? isHallOfFame
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 font-medium shadow-sm'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                  title={item.description}
                >
                  <Icon className={`w-4 h-4 ${
                    item.active 
                      ? isHallOfFame ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                      : 'group-hover:scale-110 transition-transform'
                  }`} />
                  <span>{item.label}</span>
                  {item.active && (
                    <div className={`w-1 h-1 rounded-full ${
                      isHallOfFame ? 'bg-yellow-600 dark:bg-yellow-400' : 'bg-blue-600 dark:bg-blue-400'
                    }`}></div>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* 📱 MOBILE HEADER - Avec safe area et profil en haut à droite */}
      <header className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        {/* Safe area pour iOS - plus conservative */}
        <div className="pt-safe-area-inset-top">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Logo à gauche */}
            <Link href="/" className="flex items-center space-x-3 touch-manipulation py-2">
              <div className="relative">
                <Image
                  src="/GLOBAL.png"
                  alt="Sporating Logo"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sporating</h1>
            </Link>
            
            {/* Actions à droite avec profil ET déconnexion */}
            <div className="flex items-center space-x-1">
              <div className="touch-manipulation">
                <NotificationCenter userId={session?.user?.id || session?.user?.email || 'user'} />
              </div>
              <div className="touch-manipulation">
                <ThemeToggle />
              </div>
              
              {/* 👤 PROFIL EN HAUT À DROITE SUR MOBILE - PLUS GRAND */}
              <Link
                href="/profile"
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 touch-manipulation ${
                  activeTab === 'profile' || router.pathname === '/profile'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                style={{ minHeight: '48px', minWidth: '48px' }}
              >
                <div className="relative">
                  <AvatarDisplay
                    image={session.user?.image}
                    name={session.user?.name || session.user?.email || 'User'}
                    size="md"
                    showBorder={true}
                  />
                  {/* Indicateur actif pour le profil */}
                  {(activeTab === 'profile' || router.pathname === '/profile') && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  )}
                </div>
              </Link>

              {/* 🚪 BOUTON DÉCONNEXION SUR MOBILE */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center justify-center p-3 rounded-xl transition-all duration-200 touch-manipulation text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                style={{ minHeight: '48px', minWidth: '48px' }}
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 MOBILE BOTTOM NAVIGATION - Sans profil maintenant */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 z-50">
        <div className="pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileNavItems.map((tab) => {
              const Icon = tab.icon
              const isHallOfFame = tab.id === 'hall'
              
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 relative group touch-manipulation ${
                    tab.active 
                      ? isHallOfFame
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  style={{ minHeight: '56px', minWidth: '56px' }}
                  // Force le changement de page
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(tab.href)
                  }}
                >
                  {/* Icon avec effet d'animation */}
                  <div className={`relative transition-transform duration-200 ${tab.active ? 'scale-110' : 'group-active:scale-95'}`}>
                    <Icon className="w-5 h-5" />
                    
                    {/* Badge actif */}
                    {tab.active && (
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        isHallOfFame ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium truncate transition-all duration-200 ${
                    tab.active ? 'opacity-100' : 'opacity-70'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Indicateur de sélection en bas */}
                  {tab.active && (
                    <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                      isHallOfFame ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* 📱 SPACER pour éviter que le contenu soit masqué par la nav bottom */}
      <div className="md:hidden h-20"></div>
    </>
  )
}