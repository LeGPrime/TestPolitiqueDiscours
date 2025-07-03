import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Star, Trophy, LogOut, RefreshCw, Search, Users, Calendar, Filter, BarChart3, Eye, X, ChevronDown } from 'lucide-react'
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

  // Réinitialiser le filtre compétition quand on change de sport
  useEffect(() => {
    if (sportFilter !== 'all') {
      setCompetitionFilter('all')
    }
  }, [sportFilter])

  // Sports disponibles
  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆', color: 'text-gray-600' },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'text-green-600' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'text-orange-600' },
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'text-red-600' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'text-purple-600' },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'text-blue-600' }
  ]

  // Compétitions filtrées par sport sélectionné
  const getFilteredCompetitions = () => {
    if (sportFilter === 'all') {
      return availableCompetitions
    }
    return availableCompetitions.filter(comp => 
      comp.sport.toLowerCase() === sportFilter
    )
  }

  // Compter les filtres actifs
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm w-full border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SportRate</h1>
            <p className="text-lg text-gray-600 mb-2">Letterboxd du Sport</p>
            <p className="text-sm text-gray-500 mb-8">⚽🏀🥊🏉🏎️ Notez tous vos événements sportifs</p>
            
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 text-lg font-medium transition-all duration-200 active:scale-95"
              >
                🔐 Se connecter
              </Link>
              
              <Link
                href="/auth/register"
                className="block w-full bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 text-lg font-medium transition-all duration-200 active:scale-95"
              >
                ✨ Créer un compte
              </Link>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                <span>Ou </span>
                <button
                  onClick={() => signIn('github')}
                  className="text-blue-600 hover:text-blue-700 font-medium active:scale-95 transition-all"
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <Navbar activeTab="home" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8 safe-bottom">
        {/* 📱 MOBILE-FIRST HEADER */}
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Événements à noter
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              ⚽🏀🥊🏉🏎️ Tous vos sports favoris
            </p>
          </div>
          
          {/* 📱 MOBILE: Search + Filter button */}
          <div className="space-y-3">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher équipe, compétition..."
                className="flex-1 input-mobile text-sm"
              />
              <button
                type="submit"
                className="btn-mobile-primary px-4"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* 📱 Filter toggle button with active count */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm active:scale-95 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtres</span>
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-2">
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Effacer</span>
                  </button>
                )}
                
                <button
                  onClick={fetchMatches}
                  disabled={refreshing}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 📱 COLLAPSIBLE FILTERS */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-6">
              {/* Period filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Période</span>
                </h3>
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setFilter('recent')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      filter === 'recent' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Récents
                  </button>
                  <button
                    onClick={() => setFilter('today')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      filter === 'today' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Aujourd'hui
                  </button>
                </div>
              </div>

              {/* Sport filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Sports</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => setSportFilter(sport.id as any)}
                      className={`flex items-center space-x-2 p-3 rounded-lg transition-all duration-200 ${
                        sportFilter === sport.id
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-lg">{sport.emoji}</span>
                      <span className="font-medium text-sm">{sport.name}</span>
                      {stats?.bySport && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          sportFilter === sport.id ? 'bg-white/20' : 'bg-white dark:bg-slate-600'
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

              {/* Competition filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>
                    Compétitions
                    {sportFilter !== 'all' && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({sports.find(s => s.id === sportFilter)?.name})
                      </span>
                    )}
                  </span>
                </h3>
                
                {getFilteredCompetitions().length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => setCompetitionFilter('all')}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                        competitionFilter === 'all'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="font-medium text-sm">
                        🏆 Toutes les compétitions
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        competitionFilter === 'all' ? 'bg-white/20' : 'bg-white dark:bg-slate-600'
                      }`}>
                        {getFilteredCompetitions().reduce((sum, comp) => sum + comp.count, 0)}
                      </span>
                    </button>
                    
                    {getFilteredCompetitions()
                      .sort((a, b) => b.count - a.count)
                      .map((competition) => (
                      <button
                        key={competition.competition}
                        onClick={() => setCompetitionFilter(competition.competition)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                          competitionFilter === competition.competition
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {competition.sport === 'football' && '⚽'}
                            {competition.sport === 'basketball' && '🏀'}
                            {competition.sport === 'mma' && '🥊'}
                            {competition.sport === 'rugby' && '🏉'}
                            {competition.sport === 'f1' && '🏎️'}
                          </span>
                          <span className="font-medium text-sm">{competition.competition}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          competitionFilter === competition.competition ? 'bg-white/20' : 'bg-white dark:bg-slate-600'
                        }`}>
                          {competition.count}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {sportFilter === 'all' 
                        ? 'Aucune compétition disponible' 
                        : `Aucune compétition ${sports.find(s => s.id === sportFilter)?.name} disponible`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Summary of active filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Tout effacer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4 text-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des événements...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">⚽🏀🥊🏉🏎️</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {getActiveFiltersCount() > 0 ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 px-4">
              {getActiveFiltersCount() > 0 
                ? `Aucun événement ne correspond à vos critères de recherche`
                : 'Les événements apparaîtront ici une fois terminés'
              }
            </p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="btn-mobile-primary"
              >
                Voir tous les événements
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {matches.length} événement{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}
                  </span>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                    <Filter className="w-4 h-4" />
                    <span>{getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {matches.map((match) => (
              <MobileMatchCard
                key={match.id}
                match={match}
                onRate={rateMatch}
                currentUserId={session.user?.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// 📱 COMPOSANT MATCH CARD OPTIMISÉ MOBILE (inchangé)
function MobileMatchCard({ match, onRate, currentUserId }: {
  match: Match
  onRate: (matchId: string, rating: number, comment?: string) => void
  currentUserId?: string
}) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [isRating, setIsRating] = useState(false)

  const userRating = match.ratings.find(r => r.user.id === currentUserId)

  const handleRate = async () => {
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

  // Emoji par sport
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

  // Formatage du score selon le sport
  const formatScore = (homeScore: any, awayScore: any, sport: string) => {
    if (sport === 'mma') {
      return `${homeScore} vs ${awayScore}` // W vs L
    }
    if (sport === 'f1') {
      return `P${homeScore}` // Position
    }
    return `${homeScore ?? '?'} - ${awayScore ?? '?'}`
  }

  return (
    <div className="card-responsive hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getSportEmoji(match.sport)}</span>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
            {match.competition}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(match.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
          })}
        </div>
      </div>

      {/* Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {match.homeTeamLogo && (
              <img src={match.homeTeamLogo} alt="" className="w-6 h-6 flex-shrink-0" />
            )}
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {match.homeTeam}
            </span>
          </div>
          
          <div className="mx-4 text-center">
           {match.sport === 'f1' ? (
  <div className="text-center">
    {match.status === 'FINISHED' ? (
      <div className="text-green-600 font-semibold">
        <div className="text-lg">🏁</div>
        <div className="text-sm">TERMINÉ</div>
      </div>
    ) : (
      <div className="text-blue-600 font-semibold">
        <div className="text-lg">📅</div>
        <div className="text-sm">À VENIR</div>
      </div>
    )}
  </div>
) : (
  <div className="text-xl font-bold text-gray-900 dark:text-white">
    {formatScore(match.homeScore, match.awayScore, match.sport)}
  </div>
)}
          </div>
          
          <div className="flex items-center space-x-2 flex-1 justify-end min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {match.awayTeam}
            </span>
            {match.awayTeamLogo && (
              <img src={match.awayTeamLogo} alt="" className="w-6 h-6 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Rating & Actions */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-medium text-sm">
                {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
            </span>
          </div>
          
          <Link
            href={`/match/${match.id}`}
            className="flex items-center space-x-1 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>Détails</span>
          </Link>
        </div>

        {/* Rating Section */}
        {!match.canRate ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            Cet événement ne peut pas encore être noté
          </div>
        ) : userRating ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">✅ Votre note</span>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < userRating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {userRating.comment && (
              <p className="text-sm text-blue-700 dark:text-blue-300">"{userRating.comment}"</p>
            )}
          </div>
        ) : (
          <div>
            {!showRatingForm ? (
              <button
                onClick={() => setShowRatingForm(true)}
                className="w-full btn-mobile-primary"
              >
                ⭐ Noter cet événement
              </button>
            ) : (
              <div className="space-y-4 bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium mb-3 text-gray-900 dark:text-white">Votre note :</p>
                  <div className="flex justify-center space-x-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-8 h-8 cursor-pointer transition-all duration-200 touch-target ${
                          i < selectedRating ? 'text-yellow-400 fill-current scale-110' : 'text-gray-300'
                        } hover:text-yellow-400 active:scale-125`}
                        onClick={() => setSelectedRating(i + 1)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="input-mobile resize-none"
                    rows={3}
                    placeholder={`Qu'avez-vous pensé de cet événement ${getSportEmoji(match.sport)} ?`}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleRate}
                    disabled={selectedRating === 0 || isRating}
                    className="flex-1 btn-mobile-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRating ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Notation...
                      </div>
                    ) : (
                      `✅ Noter ${selectedRating > 0 ? selectedRating + '/5' : ''}`
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRatingForm(false)
                      setSelectedRating(0)
                      setComment('')
                    }}
                    className="px-4 btn-mobile-secondary"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}