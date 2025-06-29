// pages/search-smart.tsx - Recherche intelligente mobile-first
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Search, Trophy, Users, LogOut, UserPlus, Check, Clock, X, Star, Filter,
  Calendar, MapPin, Award, SortAsc, ChevronDown, Zap, TrendingUp, Grid3X3,
  List, ArrowUp, Heart, Eye, Target, Sparkles
} from 'lucide-react'
import axios from 'axios'

interface Match {
  id: string
  sport: 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'
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

interface SearchFilters {
  sport: 'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'
  competition: string
  period: 'all' | 'week' | 'month' | 'year'
  minRating: number
  sortBy: 'relevance' | 'date' | 'rating' | 'popularity'
  viewMode: 'grid' | 'list'
}

export default function SmartSearchPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // États principaux
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'matches' | 'users'>('matches')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ matches: Match[], users: User[] }>({ matches: [], users: [] })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  // Filtres avec valeurs par défaut optimisées mobile
  const [filters, setFilters] = useState<SearchFilters>({
    sport: 'all',
    competition: 'all',
    period: 'all',
    minRating: 0,
    sortBy: 'relevance',
    viewMode: 'list' // Liste par défaut sur mobile
  })

  // Compétitions dynamiques
  const [competitions, setCompetitions] = useState<string[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  // Sports avec compteurs et design mobile
  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆', color: 'bg-gray-500', count: 0 },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'bg-green-500', count: 0 },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'bg-orange-500', count: 0 },
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'bg-red-500', count: 0 },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'bg-purple-500', count: 0 },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'bg-blue-500', count: 0 }
  ]

  // Recherche en temps réel avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch()
        saveSearchHistory(searchQuery)
      } else if (searchQuery.length === 0) {
        setResults({ matches: [], users: [] })
      }
    }, 300) // Debounce de 300ms pour mobile

    return () => clearTimeout(timer)
  }, [searchQuery, searchType, filters])

  // Charger les données initiales
  useEffect(() => {
    loadSearchData()
    loadRecentSearches()
  }, [])

  const loadSearchData = async () => {
    try {
      // Charger compétitions et stats
      const response = await axios.get(`/api/matches?sport=${filters.sport}&limit=1000`)
      const matches = response.data.matches || []
      
      // Extraire compétitions uniques
      const uniqueCompetitions = [...new Set(matches.map((m: Match) => m.competition))]
      setCompetitions(uniqueCompetitions.sort())
      
      // Mettre à jour les compteurs par sport
      sports.forEach(sport => {
        if (sport.id === 'all') {
          sport.count = matches.length
        } else {
          sport.count = matches.filter((m: Match) => m.sport === sport.id).length
        }
      })
    } catch (error) {
      console.error('Erreur chargement données:', error)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        sport: filters.sport
      })

      if (filters.competition !== 'all') {
        params.append('competition', filters.competition)
      }

      const response = await axios.get(`/api/search?${params}`)
      let searchResults = response.data

      // Appliquer les filtres locaux
      if (searchResults.matches) {
        searchResults.matches = filterAndSortMatches(searchResults.matches)
      }

      setResults(searchResults)
      
      // Générer suggestions si pas de résultats
      if (searchResults.matches.length === 0 && searchResults.users.length === 0) {
        generateSuggestions()
      }
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMatches = (matches: Match[]) => {
    let filtered = [...matches]

    // Filtre par période
    if (filters.period !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (filters.period) {
        case 'week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoff.setMonth(now.getMonth() - 1)
          break
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(m => new Date(m.date) >= cutoff)
    }

    // Filtre par note minimum
    if (filters.minRating > 0) {
      filtered = filtered.filter(m => m.avgRating >= filters.minRating)
    }

    // Tri
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'rating':
          return b.avgRating - a.avgRating || b.totalRatings - a.totalRatings
        case 'popularity':
          return b.totalRatings - a.totalRatings
        case 'relevance':
        default:
          // Score de pertinence basé sur plusieurs facteurs
          const scoreA = (a.totalRatings * 0.3) + (a.avgRating * 0.7)
          const scoreB = (b.totalRatings * 0.3) + (b.avgRating * 0.7)
          return scoreB - scoreA
      }
    })

    return filtered
  }

  const generateSuggestions = () => {
    const suggestions = [
      'Manchester City', 'Real Madrid', 'PSG', 'Barcelona', 'Liverpool',
      'Lakers', 'Warriors', 'Celtics', 'Heat', 'Bucks',
      'UFC', 'Bellator', 'Champions League', 'Premier League', 'NBA'
    ]
    setSearchSuggestions(suggestions.slice(0, 5))
  }

  const saveSearchHistory = (query: string) => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const updated = [query, ...history.filter((h: string) => h !== query)].slice(0, 5)
    localStorage.setItem('searchHistory', JSON.stringify(updated))
    setRecentSearches(updated)
  }

  const loadRecentSearches = () => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    setRecentSearches(history)
  }

  const getSportIcon = (sport: string) => {
    const sportData = sports.find(s => s.id === sport)
    return sportData ? sportData.emoji : '🏆'
  }

  const formatScore = (homeScore: any, awayScore: any, sport: string) => {
    if (homeScore === null || homeScore === undefined) return '? - ?'
    
    if (sport === 'mma') return `${homeScore} vs ${awayScore}`
    if (sport === 'f1') return `P${homeScore}`
    
    return `${homeScore} - ${awayScore}`
  }

  const getResultsCount = () => {
    const total = results.matches.length + results.users.length
    return total
  }

  const handleFriendAction = async (userId: string, action: string, friendshipId?: string) => {
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
    } catch (error) {
      console.error('Erreur action ami:', error)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
      {/* Header Mobile Optimisé */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Recherche</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <Link href="/profile" className="p-2 rounded-lg bg-gray-100 text-gray-600">
                <Users className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Barre de recherche principale */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher événements, équipes, utilisateurs..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Types de recherche */}
          <div className="flex mt-3 bg-gray-100 rounded-lg p-1">
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
                  className={`flex-1 flex items-center justify-center space-x-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    searchType === type.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filtres Avancés (Collapsible) */}
        {showFilters && (
          <div className="border-t bg-gray-50 px-4 py-4 space-y-4">
            {/* Sports avec compteurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <div className="grid grid-cols-3 gap-2">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setFilters(prev => ({ ...prev, sport: sport.id as any }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      filters.sport === sport.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-lg mb-1">{sport.emoji}</span>
                    <span className="text-xs font-medium text-gray-900">{sport.name}</span>
                    <span className="text-xs text-gray-500">{sport.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Période et Note (2 colonnes) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">Toutes</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note min.</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={0}>Toutes</option>
                  <option value={3}>3+ ⭐</option>
                  <option value={4}>4+ ⭐</option>
                  <option value={4.5}>4.5+ ⭐</option>
                </select>
              </div>
            </div>

            {/* Tri et Vue */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="relevance">Pertinence</option>
                  <option value="date">Date récente</option>
                  <option value="rating">Meilleure note</option>
                  <option value="popularity">Popularité</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affichage</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
                    className={`flex-1 flex items-center justify-center py-1 rounded-md transition-colors ${
                      filters.viewMode === 'list' ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
                    className={`flex-1 flex items-center justify-center py-1 rounded-md transition-colors ${
                      filters.viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Contenu Principal */}
      <main className="px-4 py-4 pb-20">
        {/* Suggestions et historique */}
        {searchQuery.length < 2 && !loading && (
          <div className="space-y-6">
            {/* Recherches récentes */}
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-500" />
                  Recherches récentes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recherches populaires */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                Recherches populaires
              </h3>
              <div className="space-y-2">
                {[
                  { text: '⚽ Manchester City', category: 'Football' },
                  { text: '🏀 Lakers vs Warriors', category: 'Basketball' },
                  { text: '🏆 Champions League', category: 'Compétition' },
                  { text: '🥊 UFC 290', category: 'MMA' },
                  { text: '🏎️ Monaco GP', category: 'F1' }
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion.text.split(' ').slice(1).join(' '))}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <span className="text-gray-900">{suggestion.text}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {suggestion.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Résultats de recherche */}
        {searchQuery.length >= 2 && (
          <div className="space-y-6">
            {/* En-tête des résultats */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {loading ? 'Recherche...' : `${getResultsCount()} résultat${getResultsCount() > 1 ? 's' : ''}`}
              </h3>
              {!loading && getResultsCount() > 0 && (
                <div className="text-sm text-gray-500">
                  pour "{searchQuery}"
                </div>
              )}
            </div>

            {/* Événements */}
            {(searchType === 'all' || searchType === 'matches') && results.matches.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                  Événements ({results.matches.length})
                </h4>
                
                {filters.viewMode === 'list' ? (
                  /* Vue Liste - Optimisée Mobile */
                  <div className="space-y-3">
                    {results.matches.map((match) => (
                      <div key={match.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        {/* Header compact */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getSportIcon(match.sport)}</span>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {match.competition}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(match.date).toLocaleDateString('fr-FR', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </div>
                        </div>

                        {/* Équipes et score - Layout mobile */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {match.homeTeamLogo && (
                                <img src={match.homeTeamLogo} alt="" className="w-6 h-6 rounded" />
                              )}
                              <span className="font-medium text-sm">{match.homeTeam}</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900 mx-3">
                              {formatScore(match.homeScore, match.awayScore, match.sport)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {match.awayTeamLogo && (
                                <img src={match.awayTeamLogo} alt="" className="w-6 h-6 rounded" />
                              )}
                              <span className="font-medium text-sm">{match.awayTeam}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats et actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">
                                {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <Link
                            href={`/match/${match.id}`}
                            className="text-blue-600 text-sm font-medium flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Voir</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Vue Grille - Plus compact */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.matches.map((match) => (
                      <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">{getSportIcon(match.sport)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        
                        <div className="space-y-1 mb-2">
                          <div className="text-sm font-medium">{match.homeTeam}</div>
                          <div className="text-sm font-medium">{match.awayTeam}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {formatScore(match.homeScore, match.awayScore, match.sport)}
                          </div>
                          <div className="flex items-center justify-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs">{match.avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Utilisateurs */}
            {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-500" />
                  Utilisateurs ({results.users.length})
                </h4>
                
                <div className="space-y-3">
                  {results.users.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center space-x-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {(user.name || user.username || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {user.name || user.username}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-400" />
                            {user.totalRatings} notation{user.totalRatings > 1 ? 's' : ''}
                          </p>
                          {user.bio && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{user.bio}</p>
                          )}
                        </div>

                        {/* Actions utilisateur */}
                        <div className="flex-shrink-0">
                          {user.friendshipStatus === 'none' && (
                            <button
                              onClick={() => handleFriendAction(user.id, 'send')}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          {user.friendshipStatus === 'sent' && (
                            <button
                              onClick={() => handleFriendAction(user.id, 'cancel', user.friendshipId)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          {user.friendshipStatus === 'received' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleFriendAction(user.id, 'accept', user.friendshipId)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFriendAction(user.id, 'decline', user.friendshipId)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {user.friendshipStatus === 'friends' && (
                            <span className="px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded-lg flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              Amis
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aucun résultat */}
            {!loading && searchQuery.length >= 2 && getResultsCount() === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Aucun résultat pour "{searchQuery}"
                  {filters.sport !== 'all' && ` dans ${sports.find(s => s.id === filters.sport)?.name}`}
                </p>

                {/* Suggestions intelligentes */}
                {searchSuggestions.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Essayez plutôt :
                    </h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(suggestion)}
                          className="px-3 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-500">
                  <p>💡 Suggestions :</p>
                  <div className="space-y-1">
                    <p>• Essayez des termes plus généraux</p>
                    <p>• Vérifiez l'orthographe</p>
                    <p>• Changez les filtres (sport, période)</p>
                    <p>• Recherchez "Tous sports" au lieu d'un sport spécifique</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation mobile en bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around">
          {[
            { href: '/', label: 'Accueil', icon: Trophy, active: false },
            { href: '/search-smart', label: 'Recherche', icon: Search, active: true },
            { href: '/friends', label: 'Amis', icon: Users, active: false },
            { href: '/profile', label: 'Profil', icon: Users, active: false },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bouton scroll to top */}
      {searchQuery.length >= 2 && getResultsCount() > 5 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-30"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}