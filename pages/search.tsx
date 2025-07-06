import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search,
  Trophy,
  Users,
  UserPlus,
  Check,
  Clock,
  X,
  Star,
  Filter,
  Heart,
  Globe,
  Calendar,
  MapPin,
  Zap,
  TrendingUp,
  Play,
  MoreHorizontal,
  User
} from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

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
  sport: string
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

interface Player {
  id: string
  name: string
  team: string
  sport: string
  position?: string
  number?: number
  matchesCount: number
  avgRating: number
  recentMatches: Match[]
}

interface Team {
  id: string
  name: string
  logo?: string
  sport: string
  league?: string
  country?: string
  founded?: number
  website?: string
  followersCount: number
  isFollowed: boolean
}

export default function SearchPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'matches' | 'users' | 'teams' | 'players'>('all')
  const [sportFilter, setSportFilter] = useState<'all' | 'football' | 'basketball' | 'tennis' | 'f1'>('all')
  const [results, setResults] = useState<{ matches: Match[], users: User[], teams: Team[], players: Player[] }>({ 
    matches: [], 
    users: [], 
    teams: [],
    players: []
  })
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const searchTypes = [
    { id: 'all', label: 'Tout', icon: Search, count: results.matches.length + results.users.length + results.teams.length + results.players.length },
    { id: 'matches', label: 'Matchs', icon: Trophy, count: results.matches.length },
    { id: 'players', label: 'Joueurs', icon: User, count: results.players.length },
    { id: 'teams', label: 'Équipes', icon: Heart, count: results.teams.length },
    { id: 'users', label: 'Utilisateurs', icon: Users, count: results.users.length }
  ]

  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆' },
    { id: 'football', name: 'Football', emoji: '⚽' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾' },
    { id: 'f1', name: 'F1', emoji: '🏎️' }
  ]

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch()
    } else {
      setResults({ matches: [], users: [], teams: [], players: [] })
    }
  }, [searchQuery, searchType, sportFilter])

  const performSearch = async () => {
    setLoading(true)
    try {
      const searchPromises = []

      // Recherche des matchs et utilisateurs
      if (searchType === 'all' || searchType === 'matches' || searchType === 'users') {
        const searchParams = new URLSearchParams({
          q: searchQuery,
          type: searchType === 'all' ? 'all' : searchType,
          ...(sportFilter !== 'all' && { sport: sportFilter })
        })
        searchPromises.push(axios.get(`/api/search?${searchParams}`))
      }

      // Recherche des équipes
      if (searchType === 'all' || searchType === 'teams') {
        const teamParams = new URLSearchParams({
          search: searchQuery,
          ...(sportFilter !== 'all' && { sport: sportFilter })
        })
        searchPromises.push(axios.get(`/api/teams?${teamParams}`))
      }

      // Recherche des joueurs
      if (searchType === 'all' || searchType === 'players') {
        const playerParams = new URLSearchParams({
          q: searchQuery,
          ...(sportFilter !== 'all' && { sport: sportFilter })
        })
        searchPromises.push(axios.get(`/api/players/search?${playerParams}`))
      }

      const responses = await Promise.all(searchPromises)
      
      let newResults = { matches: [], users: [], teams: [], players: [] }

      // Traiter les résultats selon le type de recherche
      let responseIndex = 0

      // Résultats de matchs/utilisateurs
      if (searchType === 'all' || searchType === 'matches' || searchType === 'users') {
        if (responses[responseIndex] && responses[responseIndex].data) {
          newResults.matches = responses[responseIndex].data.matches || []
          newResults.users = responses[responseIndex].data.users || []
        }
        responseIndex++
      }

      // Résultats d'équipes
      if (searchType === 'all' || searchType === 'teams') {
        if (responses[responseIndex] && responses[responseIndex].data) {
          newResults.teams = responses[responseIndex].data.teams || []
        }
        responseIndex++
      }

      // Résultats de joueurs
      if (searchType === 'all' || searchType === 'players') {
        if (responses[responseIndex] && responses[responseIndex].data) {
          newResults.players = responses[responseIndex].data.players || []
        }
      }

      setResults(newResults)
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
    } catch (error) {
      console.error('Erreur action ami:', error)
    }
  }

  const handleTeamFollow = async (teamId: string, isFollowed: boolean) => {
    try {
      await axios.post('/api/teams', {
        action: isFollowed ? 'unfollow' : 'follow',
        teamId
      })

      setResults(prev => ({
        ...prev,
        teams: prev.teams.map(team => 
          team.id === teamId 
            ? { 
                ...team, 
                isFollowed: !isFollowed,
                followersCount: isFollowed ? team.followersCount - 1 : team.followersCount + 1
              }
            : team
        )
      }))
    } catch (error) {
      console.error('Erreur suivi équipe:', error)
    }
  }

  const getSportEmoji = (sport: string) => {
    const emojis = {
      football: '⚽',
      basketball: '🏀',
      tennis: '🎾',
      f1: '🏎️',
      mma: '🥊',
      rugby: '🏉'
    }
    return emojis[sport?.toLowerCase() as keyof typeof emojis] || '🏆'
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connexion requise
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connectez-vous pour rechercher des matchs, équipes et utilisateurs
          </p>
          <Link 
            href="/auth/signin" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      <Navbar activeTab="search" />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header avec titre et description */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recherche
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Trouvez des matchs, équipes et utilisateurs
              </p>
            </div>
          </div>
        </div>

        {/* Barre de recherche améliorée */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des matchs, équipes ou utilisateurs..."
              className="w-full pl-12 pr-20 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white shadow-sm"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-4">
              Tapez au moins 2 caractères pour rechercher
            </p>
          )}
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Sport
                </label>
                <div className="flex flex-wrap gap-2">
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => setSportFilter(sport.id as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        sportFilter === sport.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span>{sport.emoji}</span>
                      <span>{sport.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglets de recherche */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
            {searchTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSearchType(type.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    searchType === type.id
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                  {type.count > 0 && searchQuery.length >= 2 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      searchType === type.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {type.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">
              Recherche en cours...
            </p>
          </div>
        )}

        {/* Résultats */}
        {!loading && searchQuery.length >= 2 && (
          <div className="space-y-8">
            {/* Résultats des joueurs */}
            {(searchType === 'all' || searchType === 'players') && results.players.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-500" />
                  <span>Joueurs ({results.players.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.players.map((player) => (
                    <div
                      key={player.id}
                      className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {player.name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {player.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{getSportEmoji(player.sport)}</span>
                            <span>{player.team}</span>
                            {player.position && (
                              <>
                                <span>•</span>
                                <span>{player.position}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Matchs joués</span>
                          <span className="font-medium text-gray-900 dark:text-white">{player.matchesCount}</span>
                        </div>
                        {player.avgRating > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Note moyenne</span>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {player.avgRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Derniers matchs */}
                      {player.recentMatches && player.recentMatches.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Derniers matchs
                          </h4>
                          <div className="space-y-1">
                            {player.recentMatches.slice(0, 2).map((match) => (
                              <Link
                                key={match.id}
                                href={`/match/${match.id}`}
                                className="block p-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {match.homeTeam} vs {match.awayTeam}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Résultats des équipes */}
            {(searchType === 'all' || searchType === 'teams') && results.teams.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Équipes ({results.teams.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.teams.map((team) => (
                    <div
                      key={team.id}
                      className={`group p-6 bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                        team.isFollowed 
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800' 
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {team.logo?.startsWith('http') ? (
                            <img 
                              src={team.logo} 
                              alt={team.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                              {team.logo || team.name[0]}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {team.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{getSportEmoji(team.sport)}</span>
                              <span className="capitalize">{team.sport}</span>
                            </div>
                          </div>
                        </div>
                        
                        {team.isFollowed && (
                          <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3" />
                            <span>Suivi</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        {team.league && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Trophy className="w-4 h-4" />
                            <span>{team.league}</span>
                          </div>
                        )}
                        {team.country && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{team.country}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{team.followersCount} followers</span>
                        </div>
                        
                        <button
                          onClick={() => handleTeamFollow(team.id, team.isFollowed)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            team.isFollowed
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${team.isFollowed ? 'fill-current' : ''}`} />
                          <span>{team.isFollowed ? 'Suivi' : 'Suivre'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Résultats des matchs */}
            {(searchType === 'all' || searchType === 'matches') && results.matches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Matchs ({results.matches.length})</span>
                </h2>
                <div className="space-y-4">
                  {results.matches.map((match) => (
                    <div 
                      key={match.id} 
                      className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                            {getSportEmoji(match.sport)} {match.competition}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(match.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                          {match.homeTeamLogo && (
                            <img src={match.homeTeamLogo} alt="" className="w-8 h-8 rounded-full" />
                          )}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {match.homeTeam}
                          </span>
                        </div>
                        
                        <div className="mx-6 text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {match.awayTeam}
                          </span>
                          {match.awayTeamLogo && (
                            <img src={match.awayTeamLogo} alt="" className="w-8 h-8 rounded-full" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <Link
                          href={`/match/${match.id}`}
                          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium group"
                        >
                          <span>Voir le match</span>
                          <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Résultats des utilisateurs */}
            {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <span>Utilisateurs ({results.users.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.map((user) => (
                    <div 
                      key={user.id} 
                      className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || 'User'}
                            className="w-14 h-14 rounded-full border-2 border-gray-100 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {(user.name || user.username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {user.name || user.username}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <TrendingUp className="w-4 h-4" />
                            <span>{user.totalRatings} notation{user.totalRatings > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {user.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {user.bio}
                        </p>
                      )}

                      <div className="flex justify-end">
                        {user.friendshipStatus === 'none' && (
                          <button
                            onClick={() => handleFriendAction(user.id, 'send')}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Ajouter</span>
                          </button>
                        )}
                        {user.friendshipStatus === 'sent' && (
                          <button
                            onClick={() => handleFriendAction(user.id, 'cancel', user.friendshipId)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Annuler</span>
                          </button>
                        )}
                        {user.friendshipStatus === 'received' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleFriendAction(user.id, 'accept', user.friendshipId)}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accepter</span>
                            </button>
                            <button
                              onClick={() => handleFriendAction(user.id, 'decline', user.friendshipId)}
                              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 dark:bg-slate-600 text-white text-sm font-medium rounded-xl hover:bg-gray-700 dark:hover:bg-slate-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Refuser</span>
                            </button>
                          </div>
                        )}
                        {user.friendshipStatus === 'friends' && (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm font-medium rounded-xl">
                            <Check className="w-4 h-4" />
                            <span>Amis</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* État vide - Aucun résultat */}
            {!loading && searchQuery.length >= 2 && 
             results.matches.length === 0 && 
             results.users.length === 0 && 
             results.teams.length === 0 && 
             results.players.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Aucun résultat pour "<span className="font-medium">{searchQuery}</span>". 
                  Essayez avec d'autres termes ou modifiez vos filtres.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Effacer la recherche
                  </button>
                  <button
                    onClick={() => setSportFilter('all')}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Tous les sports
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* État initial - Pas de recherche */}
        {!loading && searchQuery.length < 2 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Découvrez le monde du sport
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Recherchez des matchs à noter, des équipes à suivre ou des utilisateurs à ajouter
            </p>
            
            {/* Suggestions de recherche */}
            <div className="max-w-2xl mx-auto">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Suggestions populaires :
              </h4>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { text: 'Real Madrid', emoji: '⚽' },
                  { text: 'Mbappé', emoji: '⚽' },
                  { text: 'NBA Lakers', emoji: '🏀' },
                  { text: 'Champions League', emoji: '🏆' },
                  { text: 'PSG', emoji: '⚽' }
                ].map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => setSearchQuery(suggestion.text)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <span>{suggestion.emoji}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">1.2k+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Matchs notés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Équipes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">8.5k+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">15k+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Notes</div>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions basées sur l'activité récente (optionnel) */}
        {!loading && searchQuery.length < 2 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Tendances actuelles</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  type: 'match',
                  title: 'PSG vs Marseille',
                  subtitle: 'Le Classico en Ligue 1',
                  emoji: '⚽',
                  rating: 4.8,
                  count: 247
                },
                {
                  type: 'team', 
                  title: 'Real Madrid',
                  subtitle: 'Champions League',
                  emoji: '👑',
                  followers: 1847
                },
                {
                  type: 'match',
                  title: 'Lakers vs Warriors',
                  subtitle: 'NBA Regular Season',
                  emoji: '🏀',
                  rating: 4.6,
                  count: 189
                }
              ].map((trend, index) => (
                <div
                  key={index}
                  className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                  onClick={() => setSearchQuery(trend.title)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{trend.emoji}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {trend.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trend.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {trend.type === 'match' ? 'Match' : 'Équipe'}
                    </span>
                    {trend.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {trend.rating}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({trend.count})
                        </span>
                      </div>
                    )}
                    {trend.followers && (
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {trend.followers}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}