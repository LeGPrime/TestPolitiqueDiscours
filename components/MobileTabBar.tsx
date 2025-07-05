// components/MobileTabBar.tsx - Navigation bottom mobile avec Hall of Fame
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Search, Users, Trophy, User, Crown } from 'lucide-react'

export function MobileTabBar() {
  const router = useRouter()
  
  const tabs = [
    { icon: Home, label: 'Accueil', href: '/', active: router.pathname === '/' },
    { icon: Search, label: 'Recherche', href: '/search', active: router.pathname.startsWith('/search') },
    { icon: Crown, label: 'Hall of Fame', href: '/top-reviews', active: router.pathname === '/top-reviews' },
    { icon: Users, label: 'Amis', href: '/friends', active: router.pathname === '/friends' },
    { icon: User, label: 'Profil', href: '/profile', active: router.pathname === '/profile' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-bottom z-40">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isHallOfFame = tab.href === '/top-reviews'
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors min-w-0 touch-target ${
                tab.active 
                  ? isHallOfFame
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
              {tab.active && (
                <div className={`w-1 h-1 rounded-full ${
                  isHallOfFame ? 'bg-yellow-600 dark:bg-yellow-400' : 'bg-blue-600 dark:bg-blue-400'
                }`}></div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}