import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Star, Trophy, LogOut, RefreshCw, Search, Users, Calendar, Filter, BarChart3, Eye, X, ChevronDown, Play, Clock, MapPin, TrendingUp, Flame, MessageCircle, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Plus, Loader2 } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'react-hot-toast'
import ThemeToggle from '../components/ThemeToggle'
import Navbar from '../components/Navbar'
import AnimatedCircularNote from '../components/AnimatedCircularNote'
import React from 'react'

interface Match {
  id: string
  apiId?: number
  sport: 'football' | 'basketball' | 'mma' | 'rugby' | 'f1' | 'tennis'  // 🆕 Ajouter tennis
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

// Fonctions utilitaires
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
    // 🆕 Couleurs pour les joueurs de tennis célèbres
    'Novak Djokovic': { primary: 'from-blue-600 to-blue-800', secondary: 'text-white' },
    'Rafael Nadal': { primary: 'from-orange-500 to-red-600', secondary: 'text-white' },
    'Roger Federer': { primary: 'from-red-600 to-red-800', secondary: 'text-white' },
    'Carlos Alcaraz': { primary: 'from-red-500 to-orange-500', secondary: 'text-white' },
    'Jannik Sinner': { primary: 'from-green-500 to-blue-500', secondary: 'text-white' },
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
    f1: '🏎️',
    tennis: '🎾'  // 🆕 Ajouter tennis
  }
  return emojis[sport as keyof typeof emojis] || '🏆'
}

const getSportGradient = (sport: string) => {
  const gradients = {
    football: 'from-green-500 to-emerald-600',
    basketball: 'from-orange-500 to-red-600',
    mma: 'from-red-500 to-pink-600',
    rugby: 'from-purple-500 to-indigo-600',
    f1: 'from-blue-500 to-cyan-600',
    tennis: 'from-blue-500 to-green-500'  // 🆕 Gradient pour tennis
  }
  return gradients[sport as keyof typeof gradients] || 'from-gray-500 to-gray-600'
}

// Composant TeamLogo
const TeamLogo = ({ teamName, size = 'sm' }: { teamName: string, size?: 'xs' | 'sm' | 'md' }) => {
  const colors = getTeamColors(teamName)
  const initials = getTeamInitials(teamName)
  
  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors.primary} ${sizeClasses[size]} rounded-md flex items-center justify-center font-bold ${colors.secondary} shadow-sm ring-1 ring-white/20`}>
      {initials}
    </div>
  )
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'recent' | 'today'>('recent')
  const [sportFilter, setSportFilter] = useState<'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1' | 'tennis'>('all')  // 🆕 Ajouter tennis
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<FilterStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [availableCompetitions, setAvailableCompetitions] = useState<Array<{competition: string, count: number, sport: string}>>([])
  const [sortBy, setSortBy] = useState<'date' | 'popularity' | 'rating'>('date')
  const [currentSortBy, setCurrentSortBy] = useState<string>('date')

  const MATCHES_PER_PAGE = 20

  // Gestion des redirections onboarding
  useEffect(() => {
    const { welcome, fromOnboarding } = router.query

    if (welcome === 'true') {
      toast.success('🎉 Bienvenue sur Sporating ! Explorez et découvrez de nouveaux matchs.', {
        duration: 5000,
        icon: '👋',
      })
      
      router.replace('/', undefined, { shallow: true })
    }

    if (fromOnboarding === 'skipped') {
      toast('💡 N\'oubliez pas de personnaliser votre profil dans les paramètres !', {
        duration: 4000,
        icon: '⚙️',
      })
      
      router.replace('/', undefined, { shallow: true })
    }
  }, [router])

  // Charger les matchs initiaux
  useEffect(() => {
    if (session) {
      resetAndFetchMatches()
      fetchFilterStats()
    }
  }, [session, filter, sportFilter, competitionFilter, sortBy])

  // Fonction pour reset et charger les premiers matchs
  const resetAndFetchMatches = async () => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    await fetchMatches(1, true)
    setLoading(false)
  }

  // Fonction pour charger plus de matchs
  const loadMoreMatches = async () => {
    if (!hasMore || loadingMore) return
    
    setLoadingMore(true)
    const nextPage = page + 1
    await fetchMatches(nextPage, false)
    setPage(nextPage)
    setLoadingMore(false)
  }

  // Fonction principale pour récupérer les matchs
  const fetchMatches = async (pageNum: number, isReset: boolean = false) => {
    try {
      if (isReset) setRefreshing(true)
      
      const params = new URLSearchParams({
        type: filter,
        sport: sportFilter,
        days: '365',
        limit: MATCHES_PER_PAGE.toString(),
        page: pageNum.toString(),
        sortBy: sortBy
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (competitionFilter && competitionFilter !== 'all') {
        params.append('competition', competitionFilter)
      }

      const response = await axios.get(`/api/matches?${params}`)
      const newMatches = response.data.matches
      
      if (isReset) {
        setMatches(newMatches)
      } else {
        setMatches(prev => [...prev, ...newMatches])
      }
      
      setStats(response.data.stats)
      setCurrentSortBy(response.data.sortBy || 'date')
      
      // Vérifier s'il y a plus de matchs
      setHasMore(newMatches.length === MATCHES_PER_PAGE)
      
    } catch (error) {
      console.error('Erreur chargement matchs:', error)
      toast.error('Erreur lors du chargement des matchs')
    } finally {
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
      // Mettre à jour le match dans la liste
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId 
            ? { ...match, ratings: [...match.ratings, { id: 'temp', rating, comment, user: { id: session?.user?.id || '', name: session?.user?.name, email: session?.user?.email || '' } }] }
            : match
        )
      )
      showMobileNotification('⭐ Événement noté avec succès !', 'success')
    } catch (error) {
      console.error('Erreur notation:', error)
      showMobileNotification('❌ Erreur lors de la notation', 'error')
    }
  }

  const showMobileNotification = (message: string, type: 'success' | 'error') => {
    toast[type](message, {
      duration: 3000,
      position: 'top-center',
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    resetAndFetchMatches()
  }

  const clearFilters = () => {
    setSportFilter('all')
    setCompetitionFilter('all')
    setSearchTerm('')
    setFilter('recent')
    setSortBy('date')
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
    { id: 'tennis', name: 'Tennis', emoji: '🎾', color: 'from-blue-500 to-green-500' }, // 🆕 Nouveau sport
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'from-red-500 to-pink-600' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'from-purple-500 to-indigo-600' },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'from-blue-500 to-cyan-600' }
  ]

  const sortOptions = [
    { 
      id: 'date', 
      name: 'Plus récents', 
      icon: Clock, 
      description: 'Par date',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'popularity', 
      name: 'Plus populaires', 
      icon: Flame, 
      description: 'Par nombre de notes',
      color: 'from-orange-500 to-red-600'
    },
    { 
      id: 'rating', 
      name: 'Mieux notés', 
      icon: Star, 
      description: 'Par note moyenne',
      color: 'from-yellow-500 to-amber-600'
    }
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
    if (sortBy !== 'date') count++
    return count
  }

  const getCurrentSortIcon = () => {
    const currentSort = sortOptions.find(option => option.id === sortBy)
    return currentSort?.icon || Clock
  }

  const getCurrentSortName = () => {
    const currentSort = sortOptions.find(option => option.id === sortBy)
    return currentSort?.name || 'Plus récents'
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy as any)
    setShowSortDropdown(false)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex min-h-screen items-center justify-center px-4">
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
            <p className="text-white/70 mb-8 text-sm">Notez tous vos événements sportifs favoris</p>
            
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

      <main className="max-w-7xl mx-auto px-4 pt-2 pb-28 md:py-8">
        {/* Hero Section */}
        <div className="mb-6 md:mb-8">
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2 md:mb-4">
              Événements à noter
            </h1>
            <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mb-3 md:mb-6">
              Découvrez et notez vos sports favoris !
            </p>
            
            {/* Quick Stats */}
            {stats && (
              <div className="flex items-center justify-center space-x-4 md:space-x-6 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{stats.total} événements</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="w-3 h-3 md:w-4 md:h-4" />
                  <span>Nouvelles notes</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Search & Filters */}
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4 md:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher équipe, compétition..."
                  className="w-full pl-10 pr-20 py-2.5 md:py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm md:text-lg placeholder:text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 md:px-6 py-1.5 md:py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 active:scale-95 text-xs md:text-sm font-medium"
                >
                  <Search className="w-4 h-4 md:hidden" />
                  <span className="hidden md:inline">Chercher</span>
                </button>
              </div>
            </form>

            {/* Sports Filter - 3 par ligne sur mobile */}
            <div className="mb-4 md:mb-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-2 md:gap-3 md:justify-center">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setSportFilter(sport.id as any)}
                    className={`flex flex-col items-center justify-center h-16 w-full rounded-xl md:flex-row md:px-4 md:py-2 md:h-auto md:w-auto md:rounded-full transition-all duration-200 active:scale-95 text-[11px] md:text-sm ${
                      sportFilter === sport.id
                        ? `bg-gradient-to-r ${sport.color} text-white shadow`
                        : 'bg-white/60 dark:bg-slate-800/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <span className="text-lg">{sport.emoji}</span>
                    <span className="font-medium mt-0.5 md:mt-0 md:ml-2">{sport.name}</span>
                    <span className="text-[10px] mt-0.5 md:mt-0 md:ml-2 bg-white/10 md:bg-transparent px-1.5 rounded-full">
                      {sport.id === 'all'
                        ? stats?.total
                        : stats?.bySport.find((s: any) => s.sport === sport.id)?.count || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtres à dérouler côte à côte - FIXED Z-INDEX */}
            <div className="mb-4 md:mb-6 relative z-20">
              <div className="flex flex-row gap-2 md:gap-4 items-center justify-center">
                {/* Dropdown de tri */}
                <div className="relative flex-1 md:flex-none">
                  <button
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown)
                      setShowFilters(false)
                    }}
                    className="flex items-center justify-between w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-gray-200 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all active:scale-95 md:min-w-[180px] relative z-30"
                  >
                    <div className="flex items-center space-x-2">
                      {React.createElement(getCurrentSortIcon(), { className: "w-4 h-4 text-gray-600 dark:text-gray-400" })}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getCurrentSortName()}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSortDropdown && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 z-50 md:min-w-[200px]">
                      {sortOptions.map((option) => {
                        const IconComponent = option.icon
                        const isActive = sortBy === option.id
                        
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleSortChange(option.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all first:rounded-t-xl last:rounded-b-xl ${
                              isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500' : ''
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                            <div className="flex-1 text-left">
                              <div className={`text-sm font-medium ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'}`}>
                                {option.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {option.description}
                              </div>
                            </div>
                            {isActive && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bouton Filtres */}
                <div className="relative flex-1 md:flex-none">
                  <button
                    onClick={() => {
                      setShowFilters(!showFilters)
                      setShowSortDropdown(false)
                    }}
                    className="flex items-center justify-between w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-gray-200 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all active:scale-95 md:min-w-[140px] relative z-30"
                  >
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Filtres</span>
                      {getActiveFiltersCount() > 0 && (
                        <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {getActiveFiltersCount()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions supplémentaires */}
            <div className="flex items-center justify-center space-x-3 md:space-x-4 mb-4">
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Effacer filtres</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtres avancés collapsibles */}
          {showFilters && (
            <div className="max-w-4xl mx-auto mt-4 md:mt-6 p-4 md:p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-slate-600 relative z-30">
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Période</span>
                  </h3>
                  <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setFilter('recent')}
                      className={`flex-1 py-1.5 px-3 text-xs md:text-sm font-medium rounded-md transition-all ${
                        filter === 'recent' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Récents
                    </button>
                    <button
                      onClick={() => setFilter('today')}
                      className={`flex-1 py-1.5 px-3 text-xs md:text-sm font-medium rounded-md transition-all ${
                        filter === 'today' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      Aujourd'hui
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Compétitions</span>
                  </h3>
                  <select
                    value={competitionFilter}
                    onChange={(e) => setCompetitionFilter(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs md:text-sm"
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
          <div className="text-center py-12 md:py-16">
            <div className="loading-spinner w-8 h-8 md:w-10 md:h-10 mx-auto mb-4 text-indigo-600"></div>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-2">Chargement des événements...</p>
            <p className="text-gray-500 dark:text-gray-500">⚽🏀🥊🏉🏎️🎾</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Trophy className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
              {getActiveFiltersCount() > 0 ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-6 max-w-md mx-auto text-sm md:text-base">
              {getActiveFiltersCount() > 0 
                ? 'Aucun événement ne correspond à vos critères de recherche'
                : 'Les événements apparaîtront ici une fois terminés'
              }
            </p>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 active:scale-95 font-semibold text-sm md:text-base"
              >
                Voir tous les événements
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Grille des matchs */}
            <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <CompactMatchCard
                  key={match.id}
                  match={match}
                  onRate={rateMatch}
                  currentUserId={session.user?.id}
                />
              ))}
            </div>

            {/* Bouton Load More */}
            {hasMore && (
              <div className="text-center mt-6 md:mt-8">
                <button
                  onClick={loadMoreMatches}
                  disabled={loadingMore}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 active:scale-95 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Charger 20 événements de plus</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Fin de liste */}
            {!hasMore && matches.length > 0 && (
              <div className="text-center mt-6 md:mt-8 py-4 md:py-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm md:text-base">
                  🎉 Vous avez vu tous les événements !
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mt-1">
                  Revenez plus tard pour découvrir de nouveaux matchs
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fermer les dropdowns au clic extérieur - SANS FLOU */}
      {(showSortDropdown || showFilters) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setShowSortDropdown(false)
            setShowFilters(false)
          }}
        />
      )}
    </div>
  )
}

// 🔧 Fonction améliorée pour le formatage des scores avec support tennis - CORRIGÉ
const formatScore = (homeScore: any, awayScore: any, sport: string, details?: any) => {
  if (sport === 'tennis') {
    // Affichage spécial pour le tennis
    if (details?.scores?.player1 && details?.scores?.player2) {
      const p1Sets = details.scores.player1.sets || 0
      const p2Sets = details.scores.player2.sets || 0
      return `${p1Sets} - ${p2Sets} sets`
    }
    
    // Fallback avec scores normaux pour tennis
    if (homeScore !== null && awayScore !== null) {
      return `${homeScore} - ${awayScore} sets`
    }
    
    return 'Match Tennis'
  }
  
  if (sport === 'mma') {
    const winner = details?.winner || details?.processed?.result?.winner || details?.api_data?.winner
    const method = details?.method || details?.processed?.result?.method || details?.api_data?.method
    
    if (winner) {
      return `${winner} victoire` + (method ? ` (${method})` : '')
    }
    
    if (homeScore === null && awayScore === null) {
      return 'Combat MMA'
    }
    
    return `${homeScore ?? '?'} vs ${awayScore ?? '?'}`
  }
  
  if (sport === 'f1') return `P${homeScore}`
  return `${homeScore ?? '?'} - ${awayScore ?? '?'}`
}

// Composant CompactMatchCard - VERSION ULTRA AFFINÉE avec support tennis
function CompactMatchCard({ match, onRate, currentUserId }: {
  match: Match
  onRate: (matchId: string, rating: number, comment?: string) => void
  currentUserId?: string
}) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const router = useRouter()

  const userRating = match.ratings.find(r => r.user.id === currentUserId)
  const commentsCount = match.ratings.filter(r => r.comment && r.comment.trim() !== '').length
  const likesCount = match.totalRatings

  const handleRate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedRating > 0 && !isRating) {
      setIsRating(true)
      try {
        await onRate(match.id, selectedRating, comment)
        setShowRatingModal(false)
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
    setShowRatingModal(true)
  }

  return (
    <>
      {/* 🔥 CARTE ULTRA COMPACTE */}
      <div 
        onClick={handleCardClick}
        className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-400 transform hover:-translate-y-1 hover:scale-[1.02]"
      >
        {/* Sport Badge - plus fin */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getSportGradient(match.sport)}`}></div>
        
        {/* Content principal ultra-compact */}
        <div className="p-3">
          {/* Header ultra-compact */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className={`w-6 h-6 bg-gradient-to-br ${getSportGradient(match.sport)} rounded-lg flex items-center justify-center shadow-sm`}>
                <span className="text-xs">{getSportEmoji(match.sport)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide truncate leading-tight">
                  {match.competition}
                </h3>
                <div className="flex items-center space-x-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {new Date(match.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Note moyenne - plus petite */}
            <div className="w-6 h-6 relative">
              <svg
                className="w-full h-full transform -rotate-90 transition-all duration-1000 ease-out"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-gray-300 dark:text-slate-600"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {match.totalRatings > 0 && (
                  <path
                    className={`
                      ${match.avgRating >= 4 ? 'text-green-500'
                      : match.avgRating >= 2.5 ? 'text-yellow-400'
                      : 'text-red-500'}
                    `}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(match.avgRating / 5) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`
                  text-[9px] font-bold
                  ${match.avgRating >= 4 ? 'text-green-600 dark:text-green-400'
                  : match.avgRating >= 2.5 ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'}
                `}>
                  {match.totalRatings > 0 ? match.avgRating.toFixed(1) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Score ultra-compact avec support tennis */}
          <div className="mb-2">
            {match.sport === 'f1' ? (
              <div className="text-center bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-lg p-2 border border-red-200/50 dark:border-red-800/50">
                <div className="text-sm font-bold text-red-600 dark:text-red-400">
                  🏁 {match.homeTeam}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  📍 {match.awayTeam}
                </div>
              </div>
            ) : match.sport === 'mma' ? (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 backdrop-blur-sm rounded-lg p-2 border border-red-200/50 dark:border-red-800/50">
                <div className="text-center">
                  <div className="text-sm font-bold text-red-600 dark:text-red-400 truncate">
                    🥊 {match.homeTeam} vs {match.awayTeam}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    {match.details?.winner ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        🏆 {match.details.winner} victoire
                      </span>
                    ) : (
                      <span>Combat MMA</span>
                    )}
                  </div>
                </div>
              </div>
            ) : match.sport === 'tennis' ? (
              // 🆕 Affichage spécial pour le tennis - CORRIGÉ
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-lg p-2 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs text-white font-bold">
                        {match.details?.scores?.player1?.sets || match.homeScore || '0'}
                      </span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400 truncate text-xs">
                      {match.homeTeam}
                    </span>
                  </div>
                  
                  <div className="mx-2 text-center">
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      🎾 {match.details?.surface || 'Hard'}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-500">
                      {match.details?.tournament?.level || 'ATP'}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 flex-1 justify-end min-w-0">
                    <span className="font-bold text-blue-600 dark:text-blue-400 truncate text-xs text-right">
                      {match.awayTeam}
                    </span>
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs text-white font-bold">
                        {match.details?.scores?.player2?.sets || match.awayScore || '0'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Scores détaillés si disponibles */}
                {match.details?.scores?.player1?.games && match.details?.scores?.player2?.games && match.details.scores.player1.games.length > 0 && (
                  <div className="mt-1 text-center">
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      {match.details.scores.player1.games.map((game: number, i: number) => 
                        `(${game}-${match.details.scores.player2.games[i] || 0})`
                      ).join(' ')}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Affichage normal pour les autres sports
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700/60 dark:to-blue-900/20 backdrop-blur-sm rounded-lg p-2 border border-gray-200/50 dark:border-slate-600/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    <TeamLogo teamName={match.homeTeam} size="xs" />
                    <span className="font-bold text-gray-900 dark:text-white truncate text-xs">
                      {match.homeTeam}
                    </span>
                  </div>
                  
                  <div className="mx-2 text-center">
                    <div className="text-sm font-black text-gray-900 dark:text-white">
                      {formatScore(match.homeScore, match.awayScore, match.sport, match.details)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 flex-1 justify-end min-w-0">
                    <span className="font-bold text-gray-900 dark:text-white truncate text-xs text-right">
                      {match.awayTeam}
                    </span>
                    <TeamLogo teamName={match.awayTeam} size="xs" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer ultra-compact */}
        <div className="flex justify-between items-center px-3 py-1.5 border-t border-white/10 bg-white/5 dark:bg-slate-800/40 text-[10px]">
          {/* Ma note à gauche */}
          {userRating ? (
            <div className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shadow-sm">
              <span className="text-[8px] font-semibold uppercase tracking-wide">Ma note</span>
              <span className="text-[10px] font-bold">{userRating.rating}</span>
            </div>
          ) : (
            <div /> // Pour garder l'alignement
          )}

          {/* Likes & Commentaires à droite */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
              <span className="font-semibold">{likesCount}</span>
            </div>
            {commentsCount > 0 && (
              <div className="flex items-center gap-0.5">
                <MessageCircle className="w-2.5 h-2.5 text-blue-500" />
                <span className="font-semibold">{commentsCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Indicateur de clic - plus petit */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md rounded-full flex items-center justify-center ring-1 ring-indigo-300/30">
            <Eye className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Effet de survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
      </div>

      {/* Modal notation améliorée */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRatingModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${getSportGradient(match.sport)} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                <span className="text-lg">{getSportEmoji(match.sport)}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Noter ce match
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {match.homeTeam} vs {match.awayTeam}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {match.competition}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-4 text-gray-900 dark:text-white text-center">
                  Votre note :
                </p>
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRating(i + 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        i < selectedRating 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white scale-110 shadow-lg' 
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-400 hover:text-yellow-400 hover:scale-105'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${i < selectedRating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <div className="text-center mt-3">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRating <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      selectedRating === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {selectedRating === 1 && "⭐ Très décevant"}
                      {selectedRating === 2 && "⭐⭐ Décevant"}
                      {selectedRating === 3 && "⭐⭐⭐ Correct"}
                      {selectedRating === 4 && "⭐⭐⭐⭐ Très bon"}
                      {selectedRating === 5 && "⭐⭐⭐⭐⭐ Exceptionnel"}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
                  💭 Commentaire (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 text-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                  placeholder={`Votre avis sur ce match ${getSportEmoji(match.sport)} ? (Optionnel)`}
                  maxLength={220}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Partagez votre ressenti
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {comment.length}/220
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleRate}
                  disabled={selectedRating === 0 || isRating}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 bg-gradient-to-r ${getSportGradient(match.sport)} text-white shadow-lg hover:shadow-xl`}
                >
                  {isRating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Notation...</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      <span>Noter {selectedRating > 0 ? selectedRating + '/5' : ''}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRatingModal(false)
                    setSelectedRating(0)
                    setComment('')
                  }}
                  className="px-4 py-3 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-500 transition-all duration-200 active:scale-95 text-sm font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}