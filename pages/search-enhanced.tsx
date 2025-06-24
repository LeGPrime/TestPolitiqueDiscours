// pages/search-enhanced.tsx
// Page de recherche améliorée avec filtres par sport et ergonomie

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search, Trophy, Users, LogOut, UserPlus, Check, Clock, X, Star, Filter,
  Calendar, MapPin, Award, SortAsc, SortDesc
} from 'lucide-react'
import axios from 'axios'

interface Match {
  id: string
  sport: 'football' | 'basketball'
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

export default function EnhancedSearchPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'matches' | 'users'>('matches')
  const [sportFilter, setSportFilter] = useState<'all' | 'football' | 'basketball'>('all')
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'relevance'>('relevance')
  const [results, setResults] = useState<{ matches: Match[], users: User[] }>({ matches: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [competitions, setCompetitions] = useState<string[]>([])

  // Sports disponibles avec emojis et couleurs
  const sports = [
    { id: 'all', name: 'Tous sports', emoji: '🏆', color: 'text-gray-600' },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'text-green-600' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'text-orange-600' }
  ]

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch()
    } else {
      setResults({ matches: [], users: [] })
    }
  }, [searchQuery, searchType, sportFilter, competitionFilter, sortBy])

  useEffect(() => {
    // Charger les compétitions disponibles
    loadCompetitions()
  }, [sportFilter])

  const loadCompetitions = async () => {
    try {
      const response = await axios.get(`/api/matches?sport=${sportFilter}&limit=1000`)
      const matches = response.data.matches || []
      const uniqueCompetitions = [...new Set(matches.map((m: Match) => m.competition))]
      setCompetitions(uniqueCompetitions.sort())
    } catch (error) {
      console.error('Erreur chargement compétitions:', error)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        sport: sportFilter
      })

      if (competitionFilter !== 'all') {
        params.append('competition', competitionFilter)
      }

      const response = await axios.get(`/api/search?${params}`)
      let searchResults = response.data

      // Tri des résultats
      if (searchResults.matches) {
        searchResults.matches = sortMatches(searchResults.matches, sortBy)
      }

      setResults(searchResults)
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortMatches = (matches: Match[], sortType: string) => {
    return [...matches].sort((a, b) => {
      switch (sortType) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'rating':
          if (a.avgRating !== b.avgRating) {
            return b.avgRating - a.avgRating
          }
          return b.totalRatings - a.totalRatings
        case 'relevance':
        default:
          // Score de pertinence basé sur plusieurs facteurs
          const scoreA = (a.totalRatings * 0.3) + (a.avgRating * 0.7)
          const scoreB = (b.totalRatings * 0.3) + (b.avgRating * 0.7)
          return scoreB - scoreA
      }
    })
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

  const getSportIcon = (sport: string) => {
    const sportData = sports.find(s => s.id === sport)
    return sportData ? sportData.emoji : '🏆'
  }

  const formatScore = (homeScore: any, awayScore: any, sport: string) => {
    if (homeScore === null || homeScore === undefined) return '? - ?'
    return `${homeScore} - ${awayScore}`
  }

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: Trophy, active: false },
    { href: '/search-enhanced', label: 'Recherche', icon: Search, active: true },
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SportRate</h1>
                <p className="text-xs text-gray-500">Recherche Avancée</p>
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
                  href="/admin/sports-dashboard-2025"
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  ⚙️ Admin
                </Link>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Recherche Avancée</h2>
          <p className="text-gray-600">Trouvez des événements sportifs ou des utilisateurs avec nos filtres avancés</p>
        </div>

        {/* Filtres principaux */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="space-y-6">
            {/* Type de recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Type de recherche</label>
              <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                {[
                  { id: 'matches', label: 'Événements', icon: Trophy },
                  { id: 'users', label: 'Utilisateurs', icon: Users },
                  { id: 'all', label: 'Tout', icon: Search }
                ].map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSearchType(type.id as any)}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        searchType === type.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Barre de recherche principale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchType === 'matches' ? 'Rechercher des événements (équipes, compétitions...)' :
                    searchType === 'users' ? 'Rechercher des utilisateurs (nom, email...)' :
                    'Rechercher des événements ou des utilisateurs...'
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Filtres avancés pour les matchs */}
            {(searchType === 'matches' || searchType === 'all') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtre Sport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                  <select
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.emoji} {sport.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre Compétition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compétition</label>
                  <select
                    value={competitionFilter}
                    onChange={(e) => setCompetitionFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Toutes les compétitions</option>
                    {competitions.map((comp) => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>

                {/* Tri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="relevance">Pertinence</option>
                    <option value="date">Date récente</option>
                    <option value="rating">Meilleure note</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div>
          {/* Indicateur de recherche */}
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Tapez au moins 2 caractères pour rechercher</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Recherche en cours...</p>
            </div>
          )}

          {/* Résultats */}
          {!loading && searchQuery.length >= 2 && (
            <div className="space-y-8">
              {/* Résultats des événements */}
              {(searchType === 'all' || searchType === 'matches') && results.matches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <Trophy className="w-5 h-5" />
                      <span>Événements ({results.matches.length})</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Filter className="w-4 h-4" />
                      <span>
                        {sportFilter !== 'all' && `${getSportIcon(sportFilter)} ${sports.find(s => s.id === sportFilter)?.name}`}
                        {competitionFilter !== 'all' && ` • ${competitionFilter}`}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {results.matches.map((match) => (
                      <div key={match.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                        {/* Header du match */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getSportIcon(match.sport)}</span>
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {match.competition}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {new Date(match.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(match.date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Score et équipes */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 flex-1">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt="" className="w-8 h-8 rounded" />
                            )}
                            <span className="font-semibold text-lg">{match.homeTeam}</span>
                          </div>
                          
                          <div className="mx-6 text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatScore(match.homeScore, match.awayScore, match.sport)}
                            </div>
                            <div className="text-xs text-green-600 font-medium mt-1">Terminé</div>
                          </div>
                          
                          <div className="flex items-center space-x-3 flex-1 justify-end">
                            <span className="font-semibold text-lg">{match.awayTeam}</span>
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt="" className="w-8 h-8 rounded" />
                            )}
                          </div>
                        </div>

                        {/* Venue */}
                        {match.venue && (
                          <div className="flex items-center text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4 mr-1" />
                            {match.venue}
                          </div>
                        )}

                        {/* Stats et actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">
                                {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/match/${match.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                            >
                              <Award className="w-4 h-4" />
                              <span>Détails</span>
                            </Link>
                            {match.canRate && (
                              <Link
                                href={`/?highlight=${match.id}`}
                                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm font-medium"
                              >
                                Noter
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultats des utilisateurs */}
              {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Utilisateurs ({results.users.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.users.map((user) => (
                      <div key={user.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'User'}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {(user.name || user.username || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {user.name || user.username}
                            </h4>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-400" />
                              {user.totalRatings} notation{user.totalRatings > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {user.bio && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{user.bio}</p>
                        )}

                        <div className="flex justify-end">
                          {user.friendshipStatus === 'none' && (
                            <button
                              onClick={() => handleFriendAction(user.id, 'send')}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Ajouter</span>
                            </button>
                          )}
                          {user.friendshipStatus === 'sent' && (
                            <button
                              onClick={() => handleFriendAction(user.id, 'cancel', user.friendshipId)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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

              {/* Aucun résultat */}
              {!loading && searchQuery.length >= 2 && results.matches.length === 0 && results.users.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Aucun résultat pour "{searchQuery}"
                    {sportFilter !== 'all' && ` dans ${sports.find(s => s.id === sportFilter)?.name}`}
                    {competitionFilter !== 'all' && ` en ${competitionFilter}`}
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>💡 Suggestions :</p>
                    <p>• Essayez avec des termes différents</p>
                    <p>• Vérifiez l'orthographe</p>
                    <p>• Changez les filtres (sport, compétition)</p>
                    <p>• Recherchez "Tous sports" au lieu d'un sport spécifique</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* État initial */}
          {!loading && searchQuery.length < 2 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Recherche Avancée
              </h3>
              <p className="text-gray-600 mb-6">
                Utilisez nos filtres avancés pour trouver exactement ce que vous cherchez
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm text-gray-500">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">🏆 Événements Sportifs</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Recherche par équipes</li>
                    <li>• Filtrage par sport et compétition</li>
                    <li>• Tri par date, note, pertinence</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">👥 Utilisateurs</h4>
                  <ul className="space-y-1 text-green-700">
                    <li>• Recherche par nom d'utilisateur</li>
                    <li>• Gestion des demandes d'amis</li>
                    <li>• Profils avec statistiques</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}