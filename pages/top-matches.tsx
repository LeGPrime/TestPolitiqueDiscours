// pages/top-matches.tsx - Version avec onglets Top Matchs + Ballon d'Or du Peuple
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Star,
  TrendingUp,
  Calendar,
  Users,
  Filter,
  BarChart3,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  MapPin,
  Clock,
  Flame,
  Sparkles,
  MessageCircle,
  Eye,
  ChevronDown
} from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

// Types pour les matchs (existant)
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

// Types pour le Ballon d'Or
interface BallonOrPlayer {
  id: string
  name: string
  position?: string
  team: string
  sport: string
  avgRating: number
  totalRatings: number
  totalMatches: number
  bestMatch: {
    id: string
    rating: number
    homeTeam: string
    awayTeam: string
    date: string
    competition: string
  }
  recentMatches: Array<{
    matchId: string
    rating: number
    comment?: string
    homeTeam: string
    awayTeam: string
    date: string
    competition: string
  }>
  ratingHistory: Array<{
    month: string
    avgRating: number
    matchCount: number
  }>
}

export default function TopMatchesPage() {
  const { data: session } = useSession()
  
  // État des onglets
  const [activeTab, setActiveTab] = useState<'matches' | 'ballon-or' | 'mvp'>('matches')
  
  // État pour les matchs
  const [matches, setMatches] = useState<Match[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [period, setPeriod] = useState<'all-time' | 'this-year' | 'this-month' | 'this-week'>('all-time')
  const [sortBy, setSortBy] = useState<'rating' | 'popularity' | 'recent'>('rating')
  const [sportFilter, setSportFilter] = useState<'all' | 'FOOTBALL' | 'BASKETBALL' | 'MMA' | 'RUGBY' | 'F1'>('all')

  // État pour le Ballon d'Or
  const [players, setPlayers] = useState<BallonOrPlayer[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [ballonOrPeriod, setBallonOrPeriod] = useState<'all-time' | 'this-year' | 'this-season' | 'last-6-months'>('all-time')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [minMatches, setMinMatches] = useState(3)

  useEffect(() => {
    if (session) {
      if (activeTab === 'matches') {
        fetchTopMatches()
      } else if (activeTab === 'ballon-or') {
        fetchBallonOr()
      }
    }
  }, [session, activeTab, period, sortBy, sportFilter, ballonOrPeriod, positionFilter, minMatches])

  const fetchTopMatches = async () => {
    try {
      setMatchesLoading(true)
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
      setMatchesLoading(false)
    }
  }

  const fetchBallonOr = async () => {
    try {
      setPlayersLoading(true)
      const params = new URLSearchParams({
        sport: sportFilter,
        position: positionFilter,
        period: ballonOrPeriod,
        minMatches: minMatches.toString(),
        limit: '100'
      })
      
      const response = await axios.get(`/api/ballon-or?${params}`)
      
      if (response.data.success) {
        setPlayers(response.data.ballonOr)
      }
    } catch (error) {
      console.error('Erreur chargement Ballon d\'Or:', error)
    } finally {
      setPlayersLoading(false)
    }
  }

  const getSportEmoji = (sport: string) => {
    const emojis = {
      'FOOTBALL': '⚽',
      'BASKETBALL': '🏀', 
      'MMA': '🥊',
      'RUGBY': '🏉',
      'F1': '🏎️'
    }
    return emojis[sport as keyof typeof emojis] || '🏆'
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous pour voir les tops</p>
          <Link href="/auth/signin" className="btn-mobile-primary w-full">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar activeTab="home" />

      {/* Header principal */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-700 dark:via-purple-700 dark:to-blue-700 safe-top">
        <div className="px-4 py-8 text-white">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Hall of Fame</h1>
                <p className="text-indigo-100 text-sm">Les meilleurs du sport selon la communauté</p>
              </div>
            </div>

            {/* Onglets principaux */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-1 border border-white/20">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('matches')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === 'matches'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    🏆 Top Matchs
                  </button>
                  <button
                    onClick={() => setActiveTab('ballon-or')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === 'ballon-or'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    👑 Ballon d'Or du Peuple
                  </button>
                  <button
                    onClick={() => setActiveTab('mvp')}
                    disabled
                    className="px-6 py-3 rounded-xl font-medium text-white/50 cursor-not-allowed relative"
                  >
                    🌟 MVP du Peuple
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                      Bientôt
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Description de l'onglet actif */}
            <div className="max-w-2xl mx-auto">
              {activeTab === 'matches' && (
                <p className="text-indigo-100">
                  📊 Les événements sportifs les mieux notés par la communauté
                </p>
              )}
              {activeTab === 'ballon-or' && (
                <p className="text-indigo-100">
                  👑 Le classement des joueurs basé sur la moyenne de TOUTES leurs performances notées
                </p>
              )}
              {activeTab === 'mvp' && (
                <p className="text-indigo-100">
                  🌟 Les joueurs les plus influents dans les matchs décisifs (bientôt disponible)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-4 relative z-10">
        {/* Contenu selon l'onglet actif */}
        {activeTab === 'matches' && (
          <TopMatchesContent
            matches={matches}
            loading={matchesLoading}
            period={period}
            setPeriod={setPeriod}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            formatDate={formatDate}
            getRankIcon={getRankIcon}
            getRankBgColor={getRankBgColor}
            getSportEmoji={getSportEmoji}
          />
        )}

        {activeTab === 'ballon-or' && (
          <BallonOrContent
            players={players}
            loading={playersLoading}
            ballonOrPeriod={ballonOrPeriod}
            setBallonOrPeriod={setBallonOrPeriod}
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            positionFilter={positionFilter}
            setPositionFilter={setPositionFilter}
            minMatches={minMatches}
            setMinMatches={setMinMatches}
            formatDate={formatDate}
            getRankIcon={getRankIcon}
            getRankBgColor={getRankBgColor}
            getSportEmoji={getSportEmoji}
          />
        )}

        {activeTab === 'mvp' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-lg">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              MVP du Peuple - Bientôt disponible
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Le classement des joueurs les plus décisifs dans les gros matchs arrive prochainement !
            </p>
            <div className="inline-flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">En développement</span>
            </div>
          </div>
        )}
      </main>

      <div className="safe-bottom"></div>
    </div>
  )
}

// Composant pour l'onglet Top Matches
function TopMatchesContent({ 
  matches, 
  loading, 
  period, 
  setPeriod, 
  sortBy, 
  setSortBy, 
  sportFilter, 
  setSportFilter,
  formatDate,
  getRankIcon,
  getRankBgColor,
  getSportEmoji
}: any) {
  return (
    <>
      {/* Filters Top Matches */}
      <div className="mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📅 Période
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all-time">🏆 Tous temps</option>
                <option value="this-year">📅 Cette année</option>
                <option value="this-month">📊 Ce mois</option>
                <option value="this-week">⚡ Cette semaine</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔀 Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="rating">⭐ Note</option>
                <option value="popularity">📈 Popularité</option>
                <option value="recent">🕐 Récents</option>
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🏆 Sport
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value as any)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">🌟 Tous</option>
                <option value="FOOTBALL">⚽ Football</option>
                <option value="BASKETBALL">🏀 Basketball</option>
                <option value="MMA">🥊 MMA</option>
                <option value="RUGBY">🏉 Rugby</option>
                <option value="F1">🏎️ F1</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading et contenu Top Matches */}
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
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun match trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400">Aucun match ne correspond à vos critères</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Podium Top 3 Matches */}
          {matches.length >= 3 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <span>Podium des Matchs</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matches.slice(0, 3).map((match: any, index: number) => (
                  <Link key={match.id} href={`/match/${match.id}`}>
                    <div className={`${
                      index === 0 ? 'md:order-2' : 
                      index === 1 ? 'md:order-1' : 
                      'md:order-3'
                    }`}>
                      <div className={`relative group ${
                        index === 0 ? '' : 
                        index === 1 ? 'md:mt-8' : 
                        'md:mt-16'
                      }`}>
                        <div 
                          className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl transform transition-all duration-300 hover:scale-105 cursor-pointer ${getRankBgColor(index)}`}
                        >
                          <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 bg-black/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/30">
                              {getRankIcon(index)}
                            </div>
                          </div>

                          <div className="absolute top-4 left-4">
                            <div className="w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-xl border border-white/30">
                              {getSportEmoji(match.sport || 'FOOTBALL')}
                            </div>
                          </div>

                          <div className="mb-4 mt-12">
                            <span className="text-xs font-bold bg-black/20 backdrop-blur px-3 py-1.5 rounded-full border border-white/30">
                              {match.competition}
                            </span>
                          </div>

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

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              <Star className="w-6 h-6 fill-current drop-shadow-lg" />
                              <span className="text-2xl font-black drop-shadow-lg">{match.avgRating.toFixed(1)}</span>
                            </div>
                            <p className="text-sm opacity-90 drop-shadow">
                              {match.totalRatings} note{match.totalRatings > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Liste complète des matchs */}
          <div className="space-y-4">
            {matches.map((match: any, index: number) => (
              <Link key={match.id} href={`/match/${match.id}`}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(index)}`}>
                          {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getSportEmoji(match.sport || 'FOOTBALL')}</span>
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

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {match.homeTeamLogo && (
                          <img src={match.homeTeamLogo} alt="" className="w-8 h-8 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {match.homeTeam}
                        </span>
                      </div>
                      
                      <div className="mx-4 text-center bg-gray-50 dark:bg-slate-700 rounded-xl p-3 min-w-[80px]">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {match.awayTeam}
                        </span>
                        {match.awayTeamLogo && (
                          <img src={match.awayTeamLogo} alt="" className="w-8 h-8 flex-shrink-0" />
                        )}
                      </div>
                    </div>

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
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// Composant pour l'onglet Ballon d'Or
function BallonOrContent({
  players,
  loading,
  ballonOrPeriod,
  setBallonOrPeriod,
  sportFilter,
  setSportFilter,
  positionFilter,
  setPositionFilter,
  minMatches,
  setMinMatches,
  formatDate,
  getRankIcon,
  getRankBgColor,
  getSportEmoji
}: any) {
  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'text-emerald-600'
    if (rating >= 8) return 'text-green-600'
    if (rating >= 7) return 'text-blue-600'
    if (rating >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 9.5) return 'LÉGENDAIRE'
    if (rating >= 9) return 'PHÉNOMÉNAL'
    if (rating >= 8.5) return 'EXCEPTIONNEL'
    if (rating >= 8) return 'EXCELLENT'
    if (rating >= 7.5) return 'TRÈS BON'
    if (rating >= 7) return 'BON'
    return 'CORRECT'
  }

  return (
    <>
      {/* Filters Ballon d'Or */}
      <div className="mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🏆 Sport
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value as any)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">🌟 Tous les sports</option>
                <option value="FOOTBALL">⚽ Football</option>
                <option value="BASKETBALL">🏀 Basketball</option>
                <option value="MMA">🥊 MMA</option>
                <option value="RUGBY">🏉 Rugby</option>
                <option value="F1">🏎️ Formule 1</option>
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📍 Position
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">Toutes positions</option>
                {sportFilter === 'FOOTBALL' && (
                  <>
                    <option value="GK">Gardien</option>
                    <option value="DEF">Défenseur</option>
                    <option value="MID">Milieu</option>
                    <option value="FWD">Attaquant</option>
                  </>
                )}
                {sportFilter === 'BASKETBALL' && (
                  <>
                    <option value="PG">Meneur</option>
                    <option value="SG">Arrière</option>
                    <option value="SF">Ailier</option>
                    <option value="PF">Ailier-Fort</option>
                    <option value="C">Pivot</option>
                  </>
                )}
              </select>
            </div>

            {/* Period Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📅 Période
              </label>
              <select
                value={ballonOrPeriod}
                onChange={(e) => setBallonOrPeriod(e.target.value as any)}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all-time">🏆 Tous temps</option>
                <option value="this-year">📅 Cette année</option>
                <option value="this-season">⚽ Cette saison</option>
                <option value="last-6-months">📊 6 derniers mois</option>
              </select>
            </div>

            {/* Min Matches Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🎯 Matchs minimum
              </label>
              <select
                value={minMatches}
                onChange={(e) => setMinMatches(parseInt(e.target.value))}
                className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value={1}>1+ match</option>
                <option value={3}>3+ matchs</option>
                <option value={5}>5+ matchs</option>
                <option value={10}>10+ matchs</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading et contenu Ballon d'Or */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun joueur trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Aucun joueur ne correspond à vos critères</p>
          <button
            onClick={() => {
              setSportFilter('all')
              setPositionFilter('all')
              setBallonOrPeriod('all-time')
              setMinMatches(1)
            }}
            className="btn-mobile-primary"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div>
          {/* Podium Top 3 Joueurs */}
          {players.length >= 3 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center space-x-2">
                <Crown className="w-7 h-7 text-yellow-500" />
                <span>Podium du Ballon d'Or</span>
              </h2>
              
              <div className="relative max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {players.slice(0, 3).map((player: any, index: number) => (
                    <div 
                      key={player.id}
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
                        {/* Carte joueur */}
                        <div 
                          className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 cursor-pointer ${getRankBgColor(index)}`}
                        >
                          {/* Badge position */}
                          <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 bg-black/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/30">
                              {getRankIcon(index)}
                            </div>
                          </div>

                          {/* Sport */}
                          <div className="absolute top-4 left-4">
                            <div className="w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-xl border border-white/30">
                              {getSportEmoji(player.sport)}
                            </div>
                          </div>

                          {/* Infos joueur */}
                          <div className="mt-12 mb-6 text-center">
                            <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{player.name}</h3>
                            <div className="space-y-1">
                              <p className="text-sm opacity-90 bg-black/20 inline-block px-3 py-1 rounded-full">
                                {player.position || 'Joueur'} • {player.team}
                              </p>
                              <p className="text-xs opacity-75">
                                {player.totalMatches} match{player.totalMatches > 1 ? 's' : ''} • {player.totalRatings} note{player.totalRatings > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Note moyenne */}
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              <Star className="w-6 h-6 fill-current drop-shadow-lg" />
                              <span className="text-3xl font-black drop-shadow-lg">{player.avgRating.toFixed(2)}</span>
                              <span className="text-lg opacity-90">/10</span>
                            </div>
                            <p className="text-sm font-semibold bg-black/20 inline-block px-3 py-1 rounded-full">
                              {getRatingLabel(player.avgRating)}
                            </p>
                          </div>

                          {/* Effet brillance */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        </div>
                        
                        {/* Socle */}
                        <div className={`relative mx-auto w-32 rounded-t-2xl ${
                          index === 0 ? 'h-24 bg-gradient-to-t from-yellow-600 to-yellow-400' :
                          index === 1 ? 'h-20 bg-gradient-to-t from-gray-600 to-gray-400' :
                          'h-16 bg-gradient-to-t from-orange-700 to-orange-500'
                        }`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`font-black text-white drop-shadow-lg ${
                              index === 0 ? 'text-5xl' :
                              index === 1 ? 'text-4xl' :
                              'text-3xl'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-t-2xl"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Classement complet */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <span>Classement Complet</span>
            </h2>
            
            <div className="space-y-4">
              {players.map((player: any, index: number) => (
                <BallonOrPlayerCard
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  isTopThree={index < 3}
                  getRankIcon={getRankIcon}
                  getRankBgColor={getRankBgColor}
                  getSportEmoji={getSportEmoji}
                  getRatingColor={getRatingColor}
                  getRatingLabel={getRatingLabel}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Composant pour une carte joueur dans le Ballon d'Or avec fusion d'équipes
function BallonOrPlayerCard({ 
  player, 
  rank, 
  isTopThree,
  getRankIcon,
  getRankBgColor,
  getSportEmoji,
  getRatingColor,
  getRatingLabel,
  formatDate
}: any) {
  const [showDetails, setShowDetails] = useState(false)

  // Affichage intelligent des équipes
  const getTeamsDisplay = (teams: string[]) => {
    if (teams.length === 1) {
      return teams[0]
    }
    if (teams.length === 2) {
      return teams.join(' & ')
    }
    return `${teams.slice(0, 2).join(', ')} +${teams.length - 2}`
  }

  // Couleur pour les joueurs multi-équipes
  const getPlayerBadgeColor = (teams: string[]) => {
    if (teams.length > 1) {
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    }
    return 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300'
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden ${
      isTopThree 
        ? 'border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl' 
        : 'border-gray-200 dark:border-slate-700 hover:shadow-md'
    }`}>
      <div className="p-6">
        {/* Header avec rang et infos principales */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(rank - 1)} relative`}>
              {rank <= 3 ? getRankIcon(rank - 1) : `#${rank}`}
              
              {/* Badge multi-équipes */}
              {player.teams && player.teams.length > 1 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{player.teams.length}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xl">{getSportEmoji(player.sport)}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h3>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(player.positions && player.positions.length > 0 ? player.positions.join('/') : player.position) || 'Joueur'}
                  </p>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlayerBadgeColor(player.teams || [player.team])}`}>
                    {getTeamsDisplay(player.teams || [player.team])}
                  </div>
                  {player.teams && player.teams.length > 1 && (
                    <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                      <span>🔗</span>
                      <span>Multi-clubs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Note moyenne */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getRatingColor(player.avgRating)}`}>
              {player.avgRating.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {player.totalRatings} note{player.totalRatings > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Stats principales avec info fusion */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{player.totalMatches}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Match{player.totalMatches > 1 ? 's' : ''}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{player.bestMatch.rating}/10</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Meilleure note</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
            <div className={`text-sm font-bold ${getRatingColor(player.avgRating)}`}>
              {getRatingLabel(player.avgRating)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Niveau</div>
          </div>
        </div>

        {/* Répartition par équipe (nouveau) */}
        {player.teams && player.teams.length > 1 && player.teamBreakdown && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
              <span>📊 Performance par équipe</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {player.teamBreakdown.slice(0, 4).map((teamStats: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {teamStats.team}
                    </span>
                    <span className={`text-sm font-bold ${getRatingColor(teamStats.avgRating)}`}>
                      {teamStats.avgRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {teamStats.matchCount} match{teamStats.matchCount > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {showDetails ? 'Masquer les détails' : 'Voir les détails'}
          </span>
          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>

        {/* Détails expandables */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600 space-y-4">
            {/* Meilleur match avec équipe */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Meilleur match ({player.bestMatch.rating}/10)</span>
              </h4>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {player.bestMatch.homeTeam} vs {player.bestMatch.awayTeam}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{player.bestMatch.competition}</span>
                      <span>•</span>
                      <span>{formatDate(player.bestMatch.date)}</span>
                      {player.bestMatch.team && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-purple-600 dark:text-purple-400">
                            avec {player.bestMatch.team}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {player.bestMatch.rating}/10
                  </div>
                </div>
              </div>
            </div>

            {/* Matchs récents avec équipes */}
            {player.recentMatches && player.recentMatches.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Derniers matchs</span>
                </h4>
                <div className="space-y-2">
                  {player.recentMatches.slice(0, 3).map((match: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {match.homeTeam} vs {match.awayTeam}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>{formatDate(match.date)}</span>
                          <span>•</span>
                          <span>{match.competition}</span>
                          {match.team && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-purple-600 dark:text-purple-400">
                                {match.team}
                              </span>
                            </>
                          )}
                        </div>
                        {match.comment && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                            "{match.comment.substring(0, 60)}..."
                          </p>
                        )}
                      </div>
                      <div className={`text-lg font-bold ${getRatingColor(match.rating)} ml-3`}>
                        {match.rating}/10
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Répartition complète par équipe */}
            {player.teams && player.teams.length > 1 && player.teamBreakdown && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>Statistiques par équipe</span>
                </h4>
                <div className="space-y-2">
                  {player.teamBreakdown.map((teamStats: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {teamStats.team}
                          </span>
                          {index === 0 && (
                            <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs px-2 py-1 rounded-full font-medium">
                              Meilleure
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {teamStats.matchCount} match{teamStats.matchCount > 1 ? 's' : ''} • {teamStats.ratingCount} note{teamStats.ratingCount > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getRatingColor(teamStats.avgRating)}`}>
                          {teamStats.avgRating.toFixed(2)}
                        </div>
                        
                        {/* Barre de progression comparative */}
                        <div className="w-16 bg-gray-200 dark:bg-slate-600 rounded-full h-1 mt-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-500 ${
                              teamStats.avgRating >= 8 ? 'bg-green-500' :
                              teamStats.avgRating >= 7 ? 'bg-blue-500' :
                              teamStats.avgRating >= 6 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(teamStats.avgRating / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Insight sur les équipes */}
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-500 text-sm">💡</span>
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      <span className="font-semibold">Fusion intelligente :</span> Ce joueur a été noté avec {player.teams.length} équipe{player.teams.length > 1 ? 's' : ''} différente{player.teams.length > 1 ? 's' : ''}.
                      {player.teamBreakdown.length > 1 && (
                        <span> Sa meilleure performance est avec {player.teamBreakdown[0].team} ({player.teamBreakdown[0].avgRating.toFixed(1)}/10).</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Évolution des notes */}
            {player.ratingHistory && player.ratingHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Évolution (derniers mois)</span>
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {player.ratingHistory.slice(-4).map((period: any) => (
                    <div key={period.month} className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className={`text-sm font-bold ${getRatingColor(period.avgRating)}`}>
                        {period.avgRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {period.month.split('-')[1]}/{period.month.split('-')[0].slice(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {period.matchCount}m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info technique sur la fusion */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 text-sm">🔗</span>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Données fusionnées :</span>
                  <div className="mt-1 space-y-1">
                    <div>• <span className="font-medium">{player.totalRatings} notes</span> collectées à travers <span className="font-medium">{player.totalMatches} matchs</span></div>
                    <div>• Équipes : <span className="font-medium">{(player.teams || [player.team]).join(', ')}</span></div>
                    <div>• Position{(player.positions || [player.position]).length > 1 ? 's' : ''} : <span className="font-medium">{(player.positions || [player.position]).join(', ') || 'Non définie'}</span></div>
                    <div>• Moyenne globale calculée sur toutes les performances</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}