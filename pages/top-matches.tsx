import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  Trophy,
  Search,
  Users,
  LogOut,
  Star,
  Calendar,
  TrendingUp,
  Clock,
  Filter,
  Medal,
  Crown,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  MapPin,
  MessageCircle,
  ChevronRight,
  Flame,
  Sparkles,
  Target,
  Gamepad2,
  Zap,
  Car
} from 'lucide-react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
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
  sport?: string
  ratings: Array<{
    id: string
    rating: number
    comment?: string
    user: { id: string; name?: string; username?: string; image?: string }
  }>
}

export default function TopMatchesPage() {
  const { data: session } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all-time' | 'this-year' | 'this-month' | 'this-week'>('all-time')
  const [sortBy, setSortBy] = useState<'rating' | 'popularity' | 'recent'>('rating')
  const [sportFilter, setSportFilter] = useState<'all' | 'FOOTBALL' | 'BASKETBALL' | 'MMA' | 'RUGBY' | 'F1'>('all')

  useEffect(() => {
    if (session) {
      fetchTopMatches()
    }
  }, [session, period, sortBy, sportFilter])

  const fetchTopMatches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period,
        sortBy,
        limit: '50'
      })
      
      if (sportFilter !== 'all') {
        params.append('sport', sportFilter)
      }
      
      const response = await axios.get(`/api/top-matches?${params}`)
      setMatches(response.data.matches)
    } catch (error) {
      console.error('Erreur chargement top matchs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-white" />
      case 1: return <Medal className="w-5 h-5 text-white" />
      case 2: return <Award className="w-5 h-5 text-white" />
      default: return <span className="text-lg font-bold text-white">#{index + 1}</span>
    }
  }

  const getRankBgColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-br from-yellow-400 to-amber-500'
      case 1: return 'bg-gradient-to-br from-slate-400 to-slate-500'
      case 2: return 'bg-gradient-to-br from-orange-500 to-red-600'
      default: return 'bg-gradient-to-br from-blue-500 to-indigo-600'
    }
  }

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'FOOTBALL': return '⚽'
      case 'BASKETBALL': return '🏀'
      case 'MMA': return '🥊'
      case 'RUGBY': return '🏈'
      case 'F1': return '🏎️'
      default: return '🏆'
    }
  }

  const getSportLabel = () => {
    switch (sportFilter) {
      case 'all': return 'Tous sports'
      case 'FOOTBALL': return 'Football'
      case 'BASKETBALL': return 'Basketball'
      case 'MMA': return 'MMA'
      case 'RUGBY': return 'Rugby'
      case 'F1': return 'Formule 1'
      default: return 'Tous sports'
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'all-time': return 'Tous temps'
      case 'this-year': return 'Cette année'
      case 'this-month': return 'Ce mois'
      case 'this-week': return 'Cette semaine'
      default: return 'Tous temps'
    }
  }

  const getSortLabel = () => {
    switch (sortBy) {
      case 'rating': return 'Mieux notés'
      case 'popularity': return 'Plus populaires'
      case 'recent': return 'Plus récents'
      default: return 'Mieux notés'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    })
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connexion requise</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous pour voir le top des matchs</p>
          <Link href="/auth/signin" className="btn-mobile-primary w-full">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header avec gradient moderne */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-700 dark:via-purple-700 dark:to-blue-700 safe-top">
        <Navbar activeTab="home" />
        
        {/* Hero Section */}
        <div className="px-4 py-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Top des matchs</h1>
                <p className="text-indigo-100 text-sm">Les événements les mieux notés</p>
              </div>
            </div>
            
            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Période</span>
                </div>
                <p className="text-lg font-bold mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Tri</span>
                </div>
                <p className="text-lg font-bold mt-1">{getSortLabel()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">Sport</span>
                </div>
                <p className="text-lg font-bold mt-1">{getSportLabel()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Notes</span>
                </div>
                <p className="text-lg font-bold mt-1">
                  {matches.reduce((sum, m) => sum + m.totalRatings, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 -mt-4 relative z-10">
        {/* Filters - Design moderne avec badges */}
        <div className="mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-slate-700">
            {/* Period Filter */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Période</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'all-time', label: 'Tout temps', icon: Trophy, color: 'purple' },
                  { id: 'this-year', label: 'Cette année', icon: Calendar, color: 'blue' },
                  { id: 'this-month', label: 'Ce mois', icon: Calendar, color: 'green' },
                  { id: 'this-week', label: 'Cette semaine', icon: Clock, color: 'indigo' }
                ].map((periodOption) => {
                  const Icon = periodOption.icon
                  const isActive = period === periodOption.id
                  return (
                    <button
                      key={periodOption.id}
                      onClick={() => setPeriod(periodOption.id as any)}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `bg-${periodOption.color}-50 dark:bg-${periodOption.color}-900/20 text-${periodOption.color}-600 dark:text-${periodOption.color}-400 shadow-sm border border-${periodOption.color}-200 dark:border-${periodOption.color}-800`
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{periodOption.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sport Filter */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Sport</span>
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: 'all', label: 'Tous', emoji: '🏆', color: 'slate' },
                  { id: 'FOOTBALL', label: 'Football', emoji: '⚽', color: 'emerald' },
                  { id: 'BASKETBALL', label: 'Basket', emoji: '🏀', color: 'orange' },
                  { id: 'MMA', label: 'MMA', emoji: '🥊', color: 'red' },
                  { id: 'RUGBY', label: 'Rugby', emoji: '🏈', color: 'amber' },
                  { id: 'F1', label: 'F1', emoji: '🏎️', color: 'rose' }
                ].map((sportOption) => {
                  const isActive = sportFilter === sportOption.id
                  return (
                    <button
                      key={sportOption.id}
                      onClick={() => setSportFilter(sportOption.id as any)}
                      className={`flex flex-col items-center justify-center space-y-1 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `bg-${sportOption.color}-50 dark:bg-${sportOption.color}-900/20 text-${sportOption.color}-600 dark:text-${sportOption.color}-400 shadow-sm border border-${sportOption.color}-200 dark:border-${sportOption.color}-800`
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">{sportOption.emoji}</span>
                      <span className="text-xs font-medium">{sportOption.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Trier par</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rating', label: 'Note', icon: Star, color: 'yellow' },
                  { id: 'popularity', label: 'Popularité', icon: TrendingUp, color: 'pink' },
                  { id: 'recent', label: 'Récents', icon: Clock, color: 'indigo' }
                ].map((sortOption) => {
                  const Icon = sortOption.icon
                  const isActive = sortBy === sortOption.id
                  return (
                    <button
                      key={sortOption.id}
                      onClick={() => setSortBy(sortOption.id as any)}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `bg-${sortOption.color}-50 dark:bg-${sortOption.color}-900/20 text-${sortOption.color}-600 dark:text-${sortOption.color}-400 shadow-sm border border-${sortOption.color}-200 dark:border-${sortOption.color}-800`
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{sortOption.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Loading avec skeleton moderne */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun match trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Il n'y a pas encore de matchs notés pour cette période. Soyez le premier à noter !
            </p>
            <div className="space-y-4">
              <Link
                href="/"
                className="btn-mobile-primary inline-flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Découvrir des matchs</span>
              </Link>
              {period !== 'all-time' && (
                <button
                  onClick={() => setPeriod('all-time')}
                  className="btn-mobile-secondary"
                >
                  Voir tous les temps
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Podium pour le top 3 */}
            {matches.length >= 3 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2 justify-center">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  <span>Podium des Champions</span>
                </h2>
                
                {/* Vrai podium avec hauteurs différentes */}
                <div className="relative max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {matches.slice(0, 3).map((match, index) => (
                      <Link 
                        key={match.id}
                        href={`/match/${match.id}`}
                        className={`${
                          index === 0 ? 'md:order-2' : // 1er au centre
                          index === 1 ? 'md:order-1' : // 2ème à gauche  
                          'md:order-3'                  // 3ème à droite
                        }`}
                      >
                        <div className={`relative group ${
                          index === 0 ? '' : // 1er : normal
                          index === 1 ? 'md:mt-8' : // 2ème : 8 plus bas
                          'md:mt-16' // 3ème : 16 plus bas
                        }`}>
                          {/* Carte du match */}
                          <div 
                            className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl transform transition-all duration-300 hover:scale-105 cursor-pointer ${
                              index === 0 ? 'mb-6 bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/25' :
                              index === 1 ? 'mb-4 bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/25' :
                              'mb-3 bg-gradient-to-br from-orange-500 to-red-600 shadow-red-500/25'
                            }`}
                          >
                            {/* Badge de position avec ombre */}
                            <div className="absolute top-4 right-4">
                              <div className="w-12 h-12 bg-black/20 backdrop-blur rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                                {getRankIcon(index)}
                              </div>
                            </div>

                            {/* Sport emoji avec fond sombre */}
                            <div className="absolute top-4 left-4">
                              <div className="w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-xl border border-white/30">
                                {getSportIcon(match.sport || 'FOOTBALL')}
                              </div>
                            </div>

                            {/* Competition avec fond plus contrasté */}
                            <div className="mb-4 mt-12">
                              <span className="text-xs font-bold bg-black/20 backdrop-blur px-3 py-1.5 rounded-full border border-white/30">
                                {match.competition}
                              </span>
                            </div>

                            {/* Teams */}
                            <div className="mb-6">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-3 mb-3">
                                  {match.homeTeamLogo && (
                                    <img src={match.homeTeamLogo} alt="" className="w-7 h-7 rounded-full border border-white/30" />
                                  )}
                                  <span className="text-sm font-semibold drop-shadow-lg">{match.homeTeam}</span>
                                </div>
                                <div className="text-3xl font-black mb-3 drop-shadow-lg">
                                  {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                                </div>
                                <div className="flex items-center justify-center space-x-3">
                                  <span className="text-sm font-semibold drop-shadow-lg">{match.awayTeam}</span>
                                  {match.awayTeamLogo && (
                                    <img src={match.awayTeamLogo} alt="" className="w-7 h-7 rounded-full border border-white/30" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Rating avec ombre */}
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <Star className="w-6 h-6 fill-current drop-shadow-lg" />
                                <span className="text-2xl font-black drop-shadow-lg">{match.avgRating.toFixed(1)}</span>
                              </div>
                              <p className="text-sm opacity-90 drop-shadow">
                                {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
                              </p>
                            </div>

                            {/* Effet de brillance sur hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                          </div>
                          
                          {/* Socle du podium avec gros numéro */}
                          <div className={`relative mx-auto w-24 rounded-t-2xl ${
                            index === 0 ? 'h-20 bg-gradient-to-t from-yellow-500 to-yellow-300' :
                            index === 1 ? 'h-16 bg-gradient-to-t from-slate-500 to-slate-300' :
                            'h-12 bg-gradient-to-t from-orange-600 to-red-500'
                          }`}>
                            {/* Gros numéro sur le socle */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`font-black text-white drop-shadow-lg ${
                                index === 0 ? 'text-4xl' :
                                index === 1 ? 'text-3xl' :
                                'text-2xl'
                              }`}>
                                {index + 1}
                              </span>
                            </div>
                            
                            {/* Effet de brillance sur le socle */}
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-t-2xl"></div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Ligne de base du podium */}
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
              </div>
            )}

            {/* Liste complète */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                <span>Classement complet</span>
              </h2>
              
              <div className="space-y-6">
                {matches.map((match, index) => (
                  <Link 
                    key={match.id}
                    href={`/match/${match.id}`}
                  >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group mb-4">
                      <div className="p-6">
                        {/* Header avec rang et date */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(index)}`}>
                              {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getSportIcon(match.sport || 'FOOTBALL')}</span>
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                {match.competition}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(match.date)}
                            </div>
                          </div>
                        </div>

                        {/* Match Details */}
                        <div className="flex items-center justify-between mb-4">
                          {/* Home Team */}
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt="" className="w-8 h-8 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                              {match.homeTeam}
                            </span>
                          </div>
                          
                          {/* Score */}
                          <div className="mx-4 text-center bg-gray-50 dark:bg-slate-700 rounded-xl p-3 min-w-[80px]">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                            </div>
                          </div>
                          
                          {/* Away Team */}
                          <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                              {match.awayTeam}
                            </span>
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt="" className="w-8 h-8 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Venue */}
                        {match.venue && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{match.venue}</span>
                          </div>
                        )}

                        {/* Rating & Stats */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(match.avgRating) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {match.avgRating.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <MessageCircle className="w-4 h-4" />
                              <span>{match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>

                        {/* Recent Ratings Preview - Nouvelle section */}
                        {match.ratings.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                              <MessageCircle className="w-4 h-4" />
                              <span>Derniers avis</span>
                            </h4>
                            <div className="space-y-3">
                              {match.ratings.slice(0, 2).map((rating) => (
                                <div key={rating.id} className="flex items-start space-x-3">
                                  <div className="flex space-x-1">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < rating.rating 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                      {rating.comment || 'Aucun commentaire'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Par {rating.user.name || rating.user.username || 'Anonyme'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {match.ratings.length > 2 && (
                              <button 
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-3 flex items-center space-x-1"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  // Optionnel: scroll vers la section avis sur la page match
                                }}
                              >
                                <span>Voir tous les avis ({match.ratings.length})</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Safe area bottom pour les appareils avec notch */}
      <div className="safe-bottom"></div>
    </div>
  )
}