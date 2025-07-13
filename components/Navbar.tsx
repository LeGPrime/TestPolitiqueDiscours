// components/Navbar.tsx - Version redesignée mobile avec profil dans bottom nav et logo SVG
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Search, Users, LogOut, Bell, Settings, 
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

  // 🆕 Navigation mobile AVEC profil (5 onglets équilibrés)
  const mobileNavItems = [
    { 
      href: '/', 
      label: 'Accueil', 
      icon: Home, 
      active: activeTab === 'home' || router.pathname === '/',
      id: 'home'
    },
    { 
      href: '/search', 
      label: 'Recherche', 
      icon: Search, 
      active: activeTab === 'search' || router.pathname.startsWith('/search'),
      id: 'search'
    },
    { 
      href: '/top-reviews', 
      label: 'Hall of Fame', 
      icon: Crown, 
      active: activeTab === 'hall-of-fame' || router.pathname === '/top-reviews',
      id: 'hall',
      special: true
    },
    { 
      href: '/top-matches', 
      label: 'Top', 
      icon: BarChart3, 
      active: activeTab === 'top' || router.pathname === '/top-matches',
      id: 'top'
    },
    { 
      href: '/profile', 
      label: 'Profil', 
      icon: User, 
      active: activeTab === 'profile' || router.pathname === '/profile',
      id: 'profile'
    }
  ]

  if (!session) {
    return (
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10">
                <Image
                  src="/global.png"
                  alt="Sporating"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
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
      {/* 🖥️ DESKTOP HEADER - Inchangé */}
      <header className="hidden md:block bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
              <div className="w-10 h-10 group-hover:scale-105 transition-transform">
                <Image
                  src="/global.png"
                  alt="Sporating"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
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
                  useSessionImage={true}
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

      {/* 📱 MOBILE HEADER - Design centré épuré */}
      <header className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="pt-safe-area-inset-top">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Texte Sporating à gauche */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sporating.</h1>
            
            {/* Logo centré */}
            <div className="flex-1 flex justify-center items-center -ml-12">
              <Link href="/" className="touch-manipulation">
                <div className="w-16 h-16 group-active:scale-95 transition-transform">
                  <Image
                    src="/global.png"
                    alt="Sporating"
                    width={48}
                    height={68}
                    className="w-full h-full object-contain"
                  />
                </div>
              </Link>
            </div>
            
            {/* Notifications à droite */}
            <div className="touch-manipulation">
              <NotificationCenter userId={session?.user?.id || session?.user?.email || 'user'} />
            </div>
          </div>
        </div>
      </header>

      {/* 📱 MOBILE BOTTOM NAVIGATION - 5 onglets avec Profil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 z-50">
        <div className="pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around px-1 py-2">
            {mobileNavItems.map((tab) => {
              const Icon = tab.icon
              const isHallOfFame = tab.special
              const isProfile = tab.id === 'profile'
              
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center space-y-1 px-2 py-2 rounded-xl transition-all duration-200 min-w-0 relative group touch-manipulation ${
                    tab.active 
                      ? isHallOfFame
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                        : isProfile
                        ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  style={{ minHeight: '56px', minWidth: '56px' }}
                >
                  {/* Icon avec avatar pour profil */}
                  <div className={`relative transition-transform duration-200 ${tab.active ? 'scale-110' : 'group-active:scale-95'}`}>
                    {isProfile ? (
                      <AvatarDisplay
  useSessionImage={true} // 🆕 Utiliser automatiquement l'image de session
  name={session.user?.name || session.user?.email || 'User'}
  size="sm"
  showBorder={true}
/>
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    
                    {/* Badge actif */}
                    {tab.active && (
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        isHallOfFame ? 'bg-yellow-500' : 
                        isProfile ? 'bg-purple-500' : 'bg-blue-500'
                      }`}></div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium truncate transition-all duration-200 ${
                    tab.active ? 'opacity-100 font-semibold' : 'opacity-70'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Indicateur de sélection en bas */}
                  {tab.active && (
                    <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                      isHallOfFame ? 'bg-yellow-500' : 
                      isProfile ? 'bg-purple-500' : 'bg-blue-500'
                    }`}></div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* 📱 SPACER */}
      <div className="md:hidden h-20"></div>
    </>
  )
}