import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Star, Trophy, LogOut, RefreshCw, Search, Users, Calendar, Filter, BarChart3, Eye, X, ChevronDown, Play, Clock, MapPin, TrendingUp, Flame, MessageCircle, ChevronRight } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import ThemeToggle from '../components/ThemeToggle'
import Navbar from '../components/Navbar'

interface Match {
  id: string
  apiId?: number
  sport: 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'
  homeTeam: string
  awayTeam: string
  homeScore?: number | string
  awayScore?: number | string
  date: string
  competition: string
  venue?: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  avgRating: number
  totalRatings: number
  canRate: boolean
  details?: any
  ratings: Array<{
    id: string
    rating: number
    comment?: string
    user: { id: string; name?: string; email: string }
  }>
}

interface FilterStats {
  total: number
  bySport: Array<{
    sport: string
    count: number
  }>
  byCompetition: Array<{
    competition: string
    count: number
    sport: string
  }>
}

// Fonctions utilitaires pour les équipes
const getTeamInitials = (teamName: string) => {
  const cleanName = teamName
    .replace(/FC|CF|AC|AS|SC|United|City|Athletic|Club|Real|Olympique/gi, '')
    .trim()
  
  const words = cleanName.split(' ').filter(word => word.length > 0)
  
  if (words.length >= 2) {
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase()
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  
  return teamName.substring(0, 2).toUpperCase()
}

const getTeamColors = (teamName: string) => {
  const teamColors: { [key: string]: { primary: string, secondary: string } } = {
    'Manchester City': { primary: 'from-sky-400 to-sky-600', secondary: 'text-white' },
    'Arsenal FC': { primary: 'from-red-500 to-red-700', secondary: 'text-white' },
    'Arsenal': { primary: 'from-red-500 to-red-700', secondary: 'text-white' },
    'Liverpool': { primary: 'from-red-600 to-red-800', secondary: 'text-white' },
    'Chelsea': { primary: 'from-blue-600 to-blue-800', secondary: 'text-white' },
    'Manchester United': { primary: 'from-red-700 to-red-900', secondary: 'text-white' },
    'Tottenham': { primary: 'from-slate-600 to-slate-800', secondary: 'text-white' },
    'Real Madrid': { primary: 'from-white to-gray-100', secondary: 'text-gray-800' },
    'FC Barcelona': { primary: 'from-blue-700 to-red-600', secondary: 'text-white' },
    'Barcelona': { primary: 'from-blue-700 to-red-600', secondary: 'text-white' },
    'Paris Saint-Germain': { primary: 'from-blue-900 to-red-600', secondary: 'text-white' },
    'Bayern Munich': { primary: 'from-red-600 to-red-800', secondary: 'text-white' },
    'Juventus': { primary: 'from-black to-gray-800', secondary: 'text-white' },
    'AC Milan': { primary: 'from-red-600 to-black', secondary: 'text-white' },
    'Inter Milan': { primary: 'from-blue-600 to-black', secondary: 'text-white' },
    'Borussia Dortmund': { primary: 'from-yellow-400 to-yellow-600', secondary: 'text-black' },
    'Atletico Madrid': { primary: 'from-red-600 to-blue-800', secondary: 'text-white' },
    'Olympique de Marseille': { primary: 'from-sky-400 to-white', secondary: 'text-blue-600' },
    'AS Monaco': { primary: 'from-red-600 to-white', secondary: 'text-red-700' },
    'Olympique Lyonnais': { primary: 'from-blue-600 to-white', secondary: 'text-blue-700' },
    'Lakers': { primary: 'from-purple-600 to-yellow-400', secondary: 'text-white' },
    'Warriors': { primary: 'from-blue-600 to-yellow-400', secondary: 'text-white' },
  }
  
  return teamColors[teamName] || { 
    primary: 'from-gray-500 to-gray-700', 
    secondary: 'text-white' 
  }
}

const getSportEmoji = (sport: string) => {
  const emojis = {
    football: '⚽',
    basketball: '🏀',
    mma: '🥊',
    rugby: '🏉',
    f1: '🏎️'
  }
  return emojis[sport as keyof typeof emojis] || '🏆'
}

const getSportGradient = (sport: string) => {
  const gradients = {
    football: 'from-green-500 to-emerald-600',
    basketball: 'from-orange-500 to-red-600',
    mma: 'from-red-500 to-pink-600',
    rugby: 'from-purple-500 to-indigo-600',
    f1: 'from-blue-500 to-cyan-600'
  }
  return gradients[sport as keyof typeof gradients] || 'from-gray-500 to-gray-600'
}

// Composant TeamLogo
const TeamLogo = ({ teamName, size = 'md' }: { teamName: string, size?: 'sm' | 'md' | 'lg' }) => {
  const colors = getTeamColors(teamName)
  const initials = getTeamInitials(teamName)
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors.primary} ${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold ${colors.secondary} shadow-lg ring-1 ring-white/20`}>
      {initials}
    </div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'recent' | 'today'>('recent')
  const [sportFilter, setSportFilter] = useState<'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'>('all')
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<FilterStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [availableCompetitions, setAvailableCompetitions] = useState<Array<{competition: string, count: number, sport: string}>>([])

  useEffect(() => {
    if (session) {
      fetchMatches()
      fetchFilterStats()
    }
  }, [session, filter, sportFilter, competitionFilter])

  const fetchMatches = async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({
        type: filter,
        sport: sportFilter,
        days: '14'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (competitionFilter && competitionFilter !== 'all') {
        params.append('competition', competitionFilter)
      }

      const response = await axios.get(`/api/matches?${params}`)
      setMatches(response.data.matches)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Erreur chargement matchs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchFilterStats = async () => {
    try {
      const response = await axios.get('/api/filter-stats')
      if (response.data.success) {
        setAvailableCompetitions(response.data.competitions)
      }
    } catch (error) {
      console.error('Erreur stats filtres:', error)
    }
  }

  const rateMatch = async (matchId: string, rating: number, comment?: string) => {
    try {
      await axios.post('/api/ratings', { matchId, rating, comment })
      fetchMatches()
      showMobileNotification('⭐ Événement noté avec succès !', 'success')
    } catch (error) {
      console.error('Erreur notation:', error)
      showMobileNotification('❌ Erreur lors de la notation', 'error')
    }
  }

  const showMobileNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <span class="font-medium">${message}</span>
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.transform = 'translateY(-100px)'
      notification.style.opacity = '0'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchMatches()
  }

  const clearFilters = () => {
    setSportFilter('all')
    setCompetitionFilter('all')
    setSearchTerm('')
    setFilter('recent')
  }

  useEffect(() => {
    if (sportFilter !== 'all') {
      setCompetitionFilter('all')
    }
  }, [sportFilter])

  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆', color: 'from-gray-500 to-gray-600' },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'from-green-500 to-emerald-600' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'from-orange-500 to-red-600' },
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'from-red-500 to-pink-600' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'from-purple-500 to-indigo-600' },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'from-blue-500 to-cyan-600' }
  ]

  const getFilteredCompetitions = () => {
    if (sportFilter === 'all') {
      return availableCompetitions
    }
    return availableCompetitions.filter(comp => 
      comp.sport.toLowerCase() === sportFilter
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (sportFilter !== 'all') count++
    if (competitionFilter !== 'all') count++
    if (searchTerm) count++
    if (filter !== 'recent') count++
    return count
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex min-h-screen items-center justify-center px-4">
          {/* Floating background elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-red-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Sporating
            </h1>
            <p className="text-xl text-white/90 mb-2 font-medium">Ton oeil sur le sport</p>
            <p className="text-white/70 mb-8 text-sm">⚽🏀🥊🏉🏎️ Notez tous vos événements sportifs favoris</p>
            
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-blue-700 text-lg font-semibold transition-all duration-200 active:scale-95 shadow-lg"
              >
                🔐 Se connecter
              </Link>
              
              <Link
                href="/auth/register"
                className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl hover:from-green-600 hover:to-green-700 text-lg font-semibold transition-all duration-200 active:scale-95 shadow-lg"
              >
                ✨ Créer un compte
              </Link>
              
              <div className="text-center text-sm text-white/60 mt-6">
                <span>Ou </span>
                <button
                  onClick={() => signIn('github')}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold active:scale-95 transition-all"
                >
                  continuer avec GitHub
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <Navbar activeTab="home" />

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 safe-bottom">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
              Événements à noter
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              ⚽🏀🥊🏉🏎️ Découvrez et notez vos sports favoris
            </p>
            
            {/* Quick Stats */}
            {stats && (
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{stats.total} événements</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4" />
                  <span>Nouvelles notes</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Search & Filters */}
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher équipe, compétition, événement..."
                  className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 active:scale-95"
                >
                  Chercher
                </button>
              </div>
            </form>

            {/* Sports Filter Pills */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setSportFilter(sport.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                      sportFilter === sport.id
                        ? `bg-gradient-to-r ${sport.color} text-white shadow-lg`
                        : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <span className="text-lg">{sport.emoji}</span>
                    <span className="font-medium">{sport.name}</span>
                    {stats?.bySport && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sportFilter === sport.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-600'
                      }`}>
                        {sport.id === 'all' 
                          ? stats.total
                          : stats.bySport.find((s: any) => s.sport === sport.id)?.count || 0
                        }
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all active:scale-95"
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filtres avancés</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Effacer</span>
                </button>
              )}
              
              <button
                onClick={fetchMatches}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60 rounded-xl transition-all active:scale-95"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilters && (
            <div className="max-w-4xl mx-auto mt-6 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-600">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Period Filter */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Période</span>
                  </h3>
                  <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
                    <button
                      onClick={() => setFilter('recent')}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                        filter === 'recent' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Récents
                    </button>
                    <button
                      onClick={() => setFilter('today')}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                        filter === 'today' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Aujourd'hui
                    </button>
                  </div>
                </div>

                {/* Competition Filter */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Compétitions</span>
                  </h3>
                  <select
                    value={competitionFilter}
                    onChange={(e) => setCompetitionFilter(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Toutes les compétitions</option>
                    {getFilteredCompetitions().map((comp) => (
                      <option key={comp.competition} value={comp.competition}>
                        {comp.competition} ({comp.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="loading-spinner w-10 h-10 mx-auto mb-4 text-indigo-600"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">Chargement des événements...</p>
            <p className="text-gray-500 dark:text-gray-500">⚽🏀🥊🏉🏎️</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {getActiveFiltersCount() > 0 ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {getActiveFiltersCount() > 0 
                ? 'Aucun événement ne correspond à vos critères de recherche'
                : 'Les événements apparaîtront ici une fois terminés'
              }
            </p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 active:scale-95 font-semibold"
              >
                Voir tous les événements
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Results Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
                      {matches.length} événement{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}
                    </h2>
                    <p className="text-indigo-600 dark:text-indigo-400 text-sm">
                      Prêts à être notés et commentés
                    </p>
                  </div>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-slate-800/50 px-3 py-2 rounded-xl">
                    <Filter className="w-4 h-4" />
                    <span>{getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Matches Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <OptimizedMatchCard
                  key={match.id}
                  match={match}
                  onRate={rateMatch}
                  currentUserId={session.user?.id}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Composant de carte optimisée
function OptimizedMatchCard({ match, onRate, currentUserId }: {
  match: Match
  onRate: (matchId: string, rating: number, comment?: string) => void
  currentUserId?: string
}) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const router = useRouter()

  const userRating = match.ratings.find(r => r.user.id === currentUserId)
  
  // Compter seulement les commentaires non vides
  const commentsCount = match.ratings.filter(r => r.comment && r.comment.trim() !== '').length

  const handleRate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedRating > 0 && !isRating) {
      setIsRating(true)
      try {
        await onRate(match.id, selectedRating, comment)
        setShowRatingForm(false)
        setSelectedRating(0)
        setComment('')
      } finally {
        setIsRating(false)
      }
    }
  }

  const handleCardClick = () => {
    router.push(`/match/${match.id}`)
  }

  const handleRatingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRatingForm(true)
  }

  const formatScore = (homeScore: any, awayScore: any, sport: string) => {
    if (sport === 'mma') return `${homeScore} vs ${awayScore}`
    if (sport === 'f1') return `P${homeScore}`
    return `${homeScore ?? '?'} - ${awayScore ?? '?'}`
  }

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-white/50 dark:border-slate-700/50 hover:border-indigo-400/60 dark:hover:border-indigo-500/60 transform hover:-translate-y-2 hover:scale-[1.02]"
    >
      {/* Sport Badge - effet moderne */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getSportGradient(match.sport)} opacity-80`}></div>
      
      {/* Effet de brillance moderne */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      {/* Header - design moderne */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 bg-gradient-to-br ${getSportGradient(match.sport)} rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20`}>
              <span className="text-base">{getSportEmoji(match.sport)}</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide">
                {match.competition}
              </span>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="font-medium">
                  {new Date(match.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats modernes avec badges */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {commentsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Score moderne avec glassmorphism */}
        <div className="mb-4">
          {match.sport === 'f1' ? (
            <div className="text-center bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-900/30 dark:to-orange-900/30 backdrop-blur-sm rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
              <div className="text-base font-bold text-red-600 dark:text-red-400 mb-2">
                🏁 {match.homeTeam}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                📍 {match.awayTeam}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-slate-700/60 dark:to-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-slate-600/50">
              <div className="flex items-center justify-between">
                {/* Équipe domicile avec logo stylé */}
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <TeamLogo teamName={match.homeTeam} size="sm" />
                  <span className="font-bold text-gray-900 dark:text-white truncate text-sm">
                    {match.homeTeam}
                  </span>
                </div>
                
                <div className="mx-4 text-center">
                  <div className="text-xl font-black text-gray-900 dark:text-white tracking-wider">
                    {formatScore(match.homeScore, match.awayScore, match.sport)}
                  </div>
                </div>
                
                {/* Équipe extérieure avec logo stylé */}
                <div className="flex items-center space-x-2 flex-1 justify-end min-w-0">
                  <span className="font-bold text-gray-900 dark:text-white truncate text-sm text-right">
                    {match.awayTeam}
                  </span>
                  <TeamLogo teamName={match.awayTeam} size="sm" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Section - design moderne */}
      <div className="px-5 pb-5">
        {!match.canRate ? (
          <div className="text-center py-3 bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-slate-700/60 dark:to-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-300/50 dark:border-slate-600/50">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Événement pas encore disponible
            </div>
          </div>
        ) : userRating ? (
          <div className={`bg-gradient-to-r ${getSportGradient(match.sport)} rounded-xl p-4 text-white shadow-lg ring-1 ring-white/20`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">✅ Votre note</span>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < userRating.rating ? 'text-yellow-300 fill-current' : 'text-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            {userRating.comment && (
              <p className="text-xs text-white/90 italic truncate bg-white/10 rounded-lg p-2">
                "{userRating.comment}"
              </p>
            )}
          </div>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            {!showRatingForm ? (
              <button
                onClick={handleRatingClick}
                className={`w-full bg-gradient-to-r ${getSportGradient(match.sport)} text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2 text-sm shadow-lg hover:shadow-xl ring-1 ring-white/20 hover:ring-white/40`}
              >
                <Star className="w-4 h-4" />
                <span>Noter cet événement</span>
              </button>
            ) : (
              <div className="space-y-4 bg-gradient-to-br from-gray-50/90 to-white/90 dark:from-slate-700/70 dark:to-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-slate-600/50 shadow-inner">
                <div>
                  <p className="text-xs font-semibold mb-3 text-gray-900 dark:text-white">Votre note :</p>
                  <div className="flex justify-center space-x-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-7 h-7 cursor-pointer transition-all duration-300 ${
                          i < selectedRating ? 'text-yellow-400 fill-current scale-110 drop-shadow-lg' : 'text-gray-300 hover:text-yellow-300'
                        } hover:scale-125 active:scale-110`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRating(i + 1)
                        }}
                      />
                    ))}
                  </div>
                  {selectedRating > 0 && (
                    <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                      {selectedRating === 1 && "⭐ Très décevant"}
                      {selectedRating === 2 && "⭐⭐ Décevant"}
                      {selectedRating === 3 && "⭐⭐⭐ Correct"}
                      {selectedRating === 4 && "⭐⭐⭐⭐ Très bon"}
                      {selectedRating === 5 && "⭐⭐⭐⭐⭐ Exceptionnel"}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-900 dark:text-white">
                    💭 Commentaire (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 text-sm border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={2}
                    placeholder={`Votre avis sur ce match ${getSportEmoji(match.sport)} ?`}
                    maxLength={220}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                    {comment.length}/220 caractères
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleRate}
                    disabled={selectedRating === 0 || isRating}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${getSportGradient(match.sport)} text-white shadow-lg hover:shadow-xl ring-1 ring-white/20`}
                  >
                    {isRating ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Notation...
                      </div>
                    ) : (
                      `✅ Noter ${selectedRating > 0 ? selectedRating + '/5' : ''}`
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRatingForm(false)
                      setSelectedRating(0)
                      setComment('')
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:from-gray-300 hover:to-gray-400 dark:hover:from-slate-500 dark:hover:to-slate-600 transition-all duration-300 active:scale-95 text-sm font-medium shadow-md"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Glassmorphism overlay moderne */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none rounded-2xl"></div>
      
      {/* Click Indicator moderne */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
        <div className="w-8 h-8 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-full flex items-center justify-center ring-1 ring-white/20">
          <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-200" />
        </div>
      </div>
    </div>
  )
}