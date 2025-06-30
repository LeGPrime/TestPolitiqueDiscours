// components/Navbar.tsx - Composant navbar réutilisable et cohérent
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Trophy, Search, Users, LogOut, Bell, Settings, 
  User, BarChart3, Calendar, Target
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import NotificationCenter from './NotificationCenter'

interface NavbarProps {
  activeTab?: string
}

export default function Navbar({ activeTab }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const navigationItems = [
    { 
      href: '/', 
      label: 'Accueil', 
      icon: Trophy, 
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sporating</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Un œil sur le jeu.</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo toujours cliquable */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sporating</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Un œil sur le jeu.</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-6">
            {/* Navigation principale */}
            <nav className="hidden md:flex space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      item.active 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                    title={item.description}
                  >
                    <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-110 transition-transform'}`} />
                    <span>{item.label}</span>
                    {item.active && (
                      <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                  </Link>
                )
              })}
            </nav>
            
            {/* Actions utilisateur */}
            <div className="flex items-center space-x-3">
              {/* Notifications (placeholder pour futur) */}
              <button 
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Notifications (bientôt disponible)"
              >
                <Bell className="w-5 h-5" />
                {/* Badge notification */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
              </button>

              {/* Lien Admin (si besoin) */}
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
              
              {/* Menu utilisateur */}
              <div className="flex items-center space-x-2">
                <Link 
                  href="/profile"
                  className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  title="Mon profil"
                >
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profil" 
                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:inline">
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
          </div>
        </div>
        
        {/* Navigation mobile */}
        <nav className="md:hidden mt-4 flex space-x-1 overflow-x-auto pb-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-shrink-0 ${
                  item.active 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}