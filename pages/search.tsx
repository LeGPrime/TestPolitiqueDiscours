import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search,
  Trophy,
  Users,
  LogOut,
  UserPlus,
  Check,
  Clock,
  X,
  Star,
  Filter
} from 'lucide-react'
import axios from 'axios'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  homeScore?: number
  awayScore?: number
  date: string
  competition: string
  venue?: string
  avgRating: number
  totalRatings: number
  canRate: boolean
}

interface User {
  id: string
  name?: string
  username?: string
  email: string
  image?: string
  bio?: string
  totalRatings: number
  friendshipStatus: 'none' | 'friends' | 'sent' | 'received'
  friendshipId?: string
}

export default function SearchPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'matches' | 'users'>('all')
  const [results, setResults] = useState<{ matches: Match[], users: User[] }>({ matches: [], users: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch()
    } else {
      setResults({ matches: [], users: [] })
    }
  }, [searchQuery, searchType])

  const performSearch = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
      setResults(response.data)
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendAction = async (userId: string, action: 'send' | 'accept' | 'decline' | 'cancel', friendshipId?: string) => {
    try {
      await axios.post('/api/friends', {
        action: action === 'send' ? 'send_request' : 
               action === 'cancel' ? 'cancel_request' :
               `${action}_request`,
        userId,
        friendshipId
      })

      // Mettre à jour l'état local
      setResults(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                friendshipStatus: action === 'send' ? 'sent' : 
                                action === 'accept' ? 'friends' : 
                                action === 'decline' || action === 'cancel' ? 'none' : user.friendshipStatus
              }
            : user
        )
      }))

      const messages = {
        send: 'Demande d\'ami envoyée',
        accept: 'Demande d\'ami acceptée',
        decline: 'Demande d\'ami refusée',
        cancel: 'Demande annulée'
      }
      alert(messages[action])
    } catch (error) {
      console.error('Erreur action ami:', error)
      alert('Erreur lors de l\'action')
    }
  }

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: Trophy, active: false },
    { href: '/search', label: 'Recherche', icon: Search, active: true },
    { href: '/friends', label: 'Amis', icon: Users, active: false },
    { href: '/top-matches', label: 'Top', icon: Trophy, active: false },
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header identique */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FootRate</h1>
                <p className="text-xs text-gray-500">Letterboxd du foot</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        item.active 
                          ? 'text-blue-600 bg-blue-50 font-medium' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              
              <div className="flex items-center space-x-3">
                <Link 
                  href="/profile"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  👋 {session.user?.name?.split(' ')[0] || 'Profil'}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Recherche</h2>
          <p className="text-gray-600">Trouvez des matchs à noter ou des utilisateurs à suivre</p>
        </div>

        {/* Search Type Toggle */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            {[
              { id: 'all', label: 'Tout' },
              { id: 'matches', label: 'Matchs' },
              { id: 'users', label: 'Utilisateurs' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSearchType(type.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  searchType === type.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchType === 'matches' ? 'Rechercher des matchs (équipes, compétitions...)' :
                searchType === 'users' ? 'Rechercher des utilisateurs (nom, email...)' :
                'Rechercher des matchs ou des utilisateurs...'
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-gray-500 mt-2">Tapez au moins 2 caractères pour rechercher</p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Recherche en cours...</p>
          </div>
        )}

        {/* Results */}
        {!loading && searchQuery.length >= 2 && (
          <div className="space-y-8">
            {/* Matches Results */}
            {(searchType === 'all' || searchType === 'matches') && results.matches.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Matchs ({results.matches.length})</span>
                </h3>
                <div className="grid gap-4">
                  {results.matches.map((match) => (
                    <div key={match.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {match.competition}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(match.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {match.homeTeamLogo && (
                            <img src={match.homeTeamLogo} alt="" className="w-6 h-6" />
                          )}
                          <span className="font-medium">{match.homeTeam}</span>
                        </div>
                        
                        <div className="mx-4 text-center">
                          <div className="text-lg font-bold">
                            {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <span className="font-medium">{match.awayTeam}</span>
                          {match.awayTeamLogo && (
                            <img src={match.awayTeamLogo} alt="" className="w-6 h-6" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">
                              {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {match.canRate && (
                          <Link
                            href={`/?search=${encodeURIComponent(match.homeTeam)}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Voir le match →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Utilisateurs ({results.users.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.map((user) => (
                    <div key={user.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || 'User'}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600">
                              {(user.name || user.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {user.name || user.username}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {user.totalRatings} notation{user.totalRatings > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {user.bio && (
                        <p className="text-sm text-gray-600 mb-4">{user.bio}</p>
                      )}

                      <div className="flex justify-end">
                        {user.friendshipStatus === 'none' && (
                          <button
                            onClick={() => handleFriendAction(user.id, 'send')}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Ajouter</span>
                          </button>
                        )}
                        {user.friendshipStatus === 'sent' && (
                          <button
                            onClick={() => handleFriendAction(user.id, 'cancel', user.friendshipId)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Annuler</span>
                          </button>
                        )}
                        {user.friendshipStatus === 'received' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleFriendAction(user.id, 'accept', user.friendshipId)}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accepter</span>
                            </button>
                            <button
                              onClick={() => handleFriendAction(user.id, 'decline', user.friendshipId)}
                              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
                            >
                              <X className="w-4 h-4" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        )}
                        {user.friendshipStatus === 'friends' && (
                          <span className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                            <Check className="w-4 h-4" />
                            <span>Amis</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && searchQuery.length >= 2 && results.matches.length === 0 && results.users.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600">
                  Aucun résultat pour "{searchQuery}". Essayez avec d'autres termes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && searchQuery.length < 2 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Recherchez des matchs ou des utilisateurs
            </h3>
            <p className="text-gray-600">
              Tapez au moins 2 caractères pour commencer votre recherche
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
