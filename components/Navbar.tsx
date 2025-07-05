// components/Navbar.tsx - Version corrigée avec AvatarDisplay
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
import AvatarDisplay from './AvatarDisplay' // 🆕 Import du composant AvatarDisplay

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
      description: 'Événements à noter'
    },
    { 
      href: '/search', 
      label: 'Recherche', 
      icon: Search, 
      active: activeTab === 'search' || router.pathname.startsWith('/search'),
      description: 'Trouver des événements'
    },
    { 
      href: '/friends', 
      label: 'Amis', 
      icon: Users, 
      active: activeTab === 'friends' || router.pathname === '/friends',
      description: 'Réseau social'
    },
    { 
      href: '/top-reviews', 
      label: 'Hall of Fame', 
      icon: Crown, 
      active: activeTab === 'hall-of-fame' || router.pathname === '/top-reviews',
      description: 'Meilleurs commentaires'
    },
    { 
      href: '/top-matches', 
      label: 'Top', 
      icon: BarChart3, 
      active: activeTab === 'top' || router.pathname === '/top-matches',
      description: 'Meilleurs événements'
    },
    { 
      href: '/profile', 
      label: 'Profil', 
      icon: User, 
      active: activeTab === 'profile' || router.pathname === '/profile',
      description: 'Mon profil'
    }
  ]

  if (!session) {
    return (
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              {/* 🆕 LOGO PERSONNALISÉ */}
              <div className="relative">
                <Image
                  src="/logosporating.svg" // ou /logo.png
                  alt="Sporating Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                  priority
                />
                {/* Badge sport optionnel */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-2.5 h-2.5 text-white" />
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
      {/* 📱 HEADER MOBILE */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo avec vraie image */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
              <div className="relative">
                {/* 🎨 TON LOGO ICI */}
                <Image
                  src="/logosporating.svg" // Remplace par ton fichier logo
                  alt="Sporating Logo"
                  width={40}
                  height={40}
                  className="rounded-lg group-hover:scale-105 transition-transform"
                  priority
                />
                
                {/* Badge animé optionnel */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Trophy className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Sporating
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
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
                  className="hidden sm:inline-block text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors"
                  title="Panneau d'administration"
                >
                  ⚙️ Admin
                </Link>
              )}

              <ThemeToggle />
              
              {/* 🖥️ DESKTOP: Menu utilisateur complet */}
              <div className="hidden md:flex items-center space-x-2">
                <Link 
                  href="/profile"
                  className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  title="Mon profil"
                >
                  {/* 🆕 REMPLACEMENT: Utiliser AvatarDisplay au lieu de Image */}
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

              {/* 📱 MOBILE: Bouton menu hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* 🖥️ DESKTOP: Navigation horizontale */}
          <nav className="hidden md:flex space-x-6 mt-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isHallOfFame = item.href === '/top-reviews'
              
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

        {/* 📱 MOBILE: Menu déroulant */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <nav className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isHallOfFame = item.href === '/top-reviews'
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      item.active 
                        ? isHallOfFame
                          ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 font-medium'
                          : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    </div>
                    {item.active && (
                      <div className={`w-2 h-2 rounded-full ${
                        isHallOfFame ? 'bg-yellow-600 dark:bg-yellow-400' : 'bg-blue-600 dark:bg-blue-400'
                      }`}></div>
                    )}
                  </Link>
                )
              })}
              
              {/* Profil et déconnexion sur mobile */}
              <div className="border-t border-gray-200 dark:border-slate-700 my-3"></div>
              
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {/* 🆕 REMPLACEMENT: Utiliser AvatarDisplay au lieu de Image */}
                <AvatarDisplay
                  image={session.user?.image}
                  name={session.user?.name || session.user?.email || 'User'}
                  size="sm"
                  showBorder={true}
                />
                <div className="flex-1">
                  <div className="font-medium">Mon profil</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{session.user?.name || session.user?.email}</div>
                </div>
              </Link>
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="flex items-center space-x-3 px-3 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <div>
                  <div className="font-medium">Se déconnecter</div>
                  <div className="text-xs text-red-500 dark:text-red-400">Quitter l'application</div>
                </div>
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}