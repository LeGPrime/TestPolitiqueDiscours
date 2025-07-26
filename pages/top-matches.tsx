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
  ChevronDown,
  UserCheck
} from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

// ============================================================================
// INTERFACES ET TYPES
// ============================================================================

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

interface BallonOrPlayer {
  id: string
  name: string
  positions?: string[]
  teams: string[]
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
    team: string
  }
  recentMatches: Array<{
    matchId: string
    rating: number
    comment?: string
    homeTeam: string
    awayTeam: string
    date: string
    competition: string
    team: string
  }>
  ratingHistory: Array<{
    month: string
    avgRating: number
    matchCount: number
  }>
  teamBreakdown: Array<{
    team: string
    avgRating: number
    matchCount: number
    ratingCount: number
  }>
}

interface CholismoCoach {
  id: string
  name: string
  normalizedName: string
  teams: string[]
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
    team: string
  }
  recentMatches: Array<{
    matchId: string
    rating: number
    comment?: string
    homeTeam: string
    awayTeam: string
    date: string
    competition: string
    team: string
  }>
  ratingHistory: Array<{
    month: string
    avgRating: number
    matchCount: number
  }>
  teamBreakdown: Array<{
    team: string
    avgRating: number
    matchCount: number
    ratingCount: number
  }>
  tacticalInsights: {
    strongestTeam: string
    averageByCompetition: Array<{
      competition: string
      avgRating: number
      matchCount: number
    }>
    winRate: number
  }
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function TopMatchesPage() {
  const { data: session } = useSession()
  
  // 🆕 NOUVEAUX ONGLETS avec Tennis et Driver séparés
  const [activeTab, setActiveTab] = useState<'matches' | 'ballon-or' | 'cholismo' | 'driver-fans' | 'tennis-goat' | 'mvp'>('matches')
  
  // États pour les matchs
  const [matches, setMatches] = useState<Match[]>([]) // 🔧 Valeur par défaut vide
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [period, setPeriod] = useState<'all-time' | 'this-year' | 'this-month' | 'this-week'>('all-time')
  const [sortBy, setSortBy] = useState<'rating' | 'popularity' | 'recent'>('rating')
  const [sportFilter, setSportFilter] = useState<'all' | 'FOOTBALL' | 'BASKETBALL' | 'MMA' | 'RUGBY' | 'F1' | 'TENNIS'>('all')

  // États pour le Ballon d'Or (FOOTBALL UNIQUEMENT maintenant)
  const [players, setPlayers] = useState<BallonOrPlayer[]>([]) // 🔧 Valeur par défaut vide
  const [playersLoading, setPlayersLoading] = useState(true)
  const [ballonOrPeriod, setBallonOrPeriod] = useState<'all-time' | 'this-year' | 'this-season' | 'last-6-months'>('all-time')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [minMatches, setMinMatches] = useState(3)

  // États pour le Cholismo du Peuple (coachs uniquement)
  const [coaches, setCoaches] = useState<CholismoCoach[]>([]) // 🔧 Valeur par défaut vide
  const [coachesLoading, setCoachesLoading] = useState(true)
  const [cholismoPeriod, setCholismoPeriod] = useState<'all-time' | 'this-year' | 'this-season' | 'last-6-months'>('all-time')
  const [coachSportFilter, setCoachSportFilter] = useState<'all' | 'FOOTBALL' | 'BASKETBALL' | 'MMA' | 'RUGBY' | 'F1'>('FOOTBALL')
  const [minCoachMatches, setMinCoachMatches] = useState(3)

  // États pour le Driver of the Fans (pilotes F1 uniquement)
  const [drivers, setDrivers] = useState<BallonOrPlayer[]>([]) // 🔧 Valeur par défaut vide
  const [driversLoading, setDriversLoading] = useState(true)
  const [driverPeriod, setDriverPeriod] = useState<'all-time' | 'this-year' | 'this-season' | 'last-6-months'>('all-time')
  const [minDriverRaces, setMinDriverRaces] = useState(3)

  // 🆕 NOUVEAUX ÉTATS pour Tennis GOAT (joueurs de tennis uniquement)
  const [tennisPlayers, setTennisPlayers] = useState<BallonOrPlayer[]>([]) // 🔧 Valeur par défaut vide
  const [tennisLoading, setTennisLoading] = useState(true)
  const [tennisPeriod, setTennisPeriod] = useState<'all-time' | 'this-year' | 'this-season' | 'last-6-months'>('all-time')
  const [minTennisMatches, setMinTennisMatches] = useState(3)

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (session) {
      switch (activeTab) {
        case 'matches':
          fetchTopMatches()
          break
        case 'ballon-or':
          fetchBallonOr()
          break
        case 'cholismo':
          fetchCholismo()
          break
        case 'driver-fans':
          fetchDriverOfTheFans()
          break
        case 'tennis-goat':
          fetchTennisGOAT()
          break
      }
    }
  }, [
    session, 
    activeTab, 
    period, 
    sortBy, 
    sportFilter, 
    ballonOrPeriod, 
    positionFilter, 
    minMatches, 
    cholismoPeriod, 
    coachSportFilter, 
    minCoachMatches, 
    driverPeriod, 
    minDriverRaces,
    tennisPeriod,
    minTennisMatches
  ])

  // ============================================================================
  // FONCTIONS API
  // ============================================================================

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
      
      console.log('🔍 Fetching TOP MATCHES with params:', params.toString()) // 🚨 DEBUG
      console.log('🌐 Full URL:', `/api/top-matches?${params}`) // 🚨 DEBUG
      const response = await axios.get(`/api/top-matches?${params}`)
      console.log('📦 TOP MATCHES API Response:', response.data) // 🚨 DEBUG
      
      setMatches(response.data.matches || []) // 🔧 Fallback à tableau vide
    } catch (error) {
      console.error('❌ Erreur chargement top matchs:', error)
      setMatches([]) // 🔧 En cas d'erreur, mettre tableau vide
    } finally {
      setMatchesLoading(false)
    }
  }

  const fetchBallonOr = async () => {
    try {
      setPlayersLoading(true)
      const params = new URLSearchParams({
        sport: 'FOOTBALL', // 🔒 STRICTEMENT FOOTBALL UNIQUEMENT
        position: positionFilter,
        period: ballonOrPeriod,
        minMatches: minMatches.toString(),
        limit: '100',
        excludeF1: 'true', // Exclure F1
        excludeTennis: 'true' // 🆕 Exclure Tennis aussi
      })
      
      const response = await axios.get(`/api/ballon-or?${params}`)
      
      if (response.data.success) {
        // 🔒 TRIPLE FILTRAGE côté client pour être absolument sûr
        const footballOnlyPlayers = (response.data.ballonOr || []).filter((player: any) => {
          const name = player.name.toLowerCase()
          
          // 1. Vérifier le sport
          if (player.sport !== 'FOOTBALL') {
            console.log(`🚫 Exclu pour sport: ${player.name} (${player.sport})`)
            return false
          }
          
          // 2. Blacklist explicite des noms de pilotes F1
          const f1Pilots = [
            'verstappen', 'hamilton', 'leclerc', 'norris', 'russell', 'sainz', 
            'alonso', 'perez', 'checo', 'vettel', 'bottas', 'ricciardo',
            'gasly', 'ocon', 'stroll', 'tsunoda', 'albon', 'zhou', 'magnussen',
            'f1 driver', 'driver', 'charles', 'max', 'lewis'
          ]
          
          for (const pilot of f1Pilots) {
            if (name.includes(pilot)) {
              console.log(`🚫 Exclu pilote F1: ${player.name}`)
              return false
            }
          }
          
          // 3. Blacklist explicite des noms de tennismans
          const tennisPlayers = [
            'djokovic', 'nadal', 'federer', 'murray', 'alcaraz', 'medvedev',
            'tsitsipas', 'zverev', 'rublev', 'thiem', 'wawrinka', 'kyrgios',
            'tennis', 'corentin', 'cmdfudr', 'moutet'
          ]
          
          for (const tennisPlayer of tennisPlayers) {
            if (name.includes(tennisPlayer)) {
              console.log(`🚫 Exclu joueur tennis: ${player.name}`)
              return false
            }
          }
          
          // 4. Filtrer les noms bizarres (IDs techniques)
          if (name.includes('cmdfudr') || name.includes('9u001o') || name.length > 50) {
            console.log(`🚫 Exclu nom technique: ${player.name}`)
            return false
          }
          
          console.log(`✅ Gardé footballeur: ${player.name}`)
          return true
        })
        
        console.log(`🔒 Filtrage final: ${footballOnlyPlayers.length} footballeurs gardés sur ${response.data.ballonOr?.length || 0}`)
        setPlayers(footballOnlyPlayers)
      } else {
        setPlayers([]) // 🔧 En cas d'échec API
      }
    } catch (error) {
      console.error('Erreur chargement Ballon d\'Or:', error)
      setPlayers([]) // 🔧 En cas d'erreur
    } finally {
      setPlayersLoading(false)
    }
  }

  const fetchCholismo = async () => {
    try {
      setCoachesLoading(true)
      const params = new URLSearchParams({
        sport: coachSportFilter,
        period: cholismoPeriod,
        minMatches: minCoachMatches.toString(),
        limit: '100'
      })
      
      const response = await axios.get(`/api/cholismo?${params}`)
      
      if (response.data.success) {
        setCoaches(response.data.cholismo)
      }
    } catch (error) {
      console.error('Erreur chargement Cholismo:', error)
    } finally {
      setCoachesLoading(false)
    }
  }

  const fetchDriverOfTheFans = async () => {
    try {
      setDriversLoading(true)
      const params = new URLSearchParams({
        sport: 'F1', // 🏎️ F1 uniquement
        period: driverPeriod,
        minMatches: minDriverRaces.toString(),
        limit: '50'
      })
      
      const response = await axios.get(`/api/ballon-or?${params}`)
      
      if (response.data.success) {
        setDrivers(response.data.ballonOr)
      }
    } catch (error) {
      console.error('Erreur chargement Driver of the Fans:', error)
    } finally {
      setDriversLoading(false)
    }
  }

  // 🆕 NOUVELLE FONCTION pour Tennis GOAT
  const fetchTennisGOAT = async () => {
    try {
      setTennisLoading(true)
      const params = new URLSearchParams({
        sport: 'TENNIS', // 🎾 TENNIS uniquement
        period: tennisPeriod,
        minMatches: minTennisMatches.toString(),
        limit: '50'
      })
      
      const response = await axios.get(`/api/ballon-or?${params}`)
      
      if (response.data.success) {
        setTennisPlayers(response.data.ballonOr)
      }
    } catch (error) {
      console.error('Erreur chargement Tennis GOAT:', error)
    } finally {
      setTennisLoading(false)
    }
  }

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  const getSportEmoji = (sport: string) => {
    const emojis = {
      'FOOTBALL': '⚽',
      'BASKETBALL': '🏀', 
      'MMA': '🥊',
      'RUGBY': '🏉',
      'F1': '🏎️',
      'TENNIS': '🎾'
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

  // ============================================================================
  // RENDU CONDITIONNEL - AUTHENTIFICATION
  // ============================================================================

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

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

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
                <h1 className="text-2xl md:text-3xl font-bold">Le Top des fans</h1>
                <p className="text-indigo-100 text-sm">Les meilleurs du sport selon la communauté</p>
              </div>
            </div>

            {/* 🆕 ONGLETS RÉORGANISÉS avec Tennis */}
            <div className="flex justify-center mb-6 px-4">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-1 border border-white/20 w-full max-w-5xl">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:justify-center gap-1 md:gap-0 md:space-x-1">
                  <button
                    onClick={() => setActiveTab('matches')}
                    className={`px-2 md:px-3 py-3 rounded-xl font-medium transition-all duration-200 text-xs md:text-sm ${
                      activeTab === 'matches'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    🏆 Top Matchs
                  </button>
                  <button
                    onClick={() => setActiveTab('ballon-or')}
                    className={`px-2 md:px-3 py-3 rounded-xl font-medium transition-all duration-200 text-xs md:text-sm ${
                      activeTab === 'ballon-or'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    👑 Ballon d'Or
                  </button>
                  <button
                    onClick={() => setActiveTab('cholismo')}
                    className={`px-2 md:px-3 py-3 rounded-xl font-medium transition-all duration-200 text-xs md:text-sm ${
                      activeTab === 'cholismo'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    🧠 Cholismo
                  </button>
                  <button
                    onClick={() => setActiveTab('driver-fans')}
                    className={`px-2 md:px-3 py-3 rounded-xl font-medium transition-all duration-200 text-xs md:text-sm ${
                      activeTab === 'driver-fans'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    🏎️ Driver
                  </button>
                  {/* 🆕 NOUVEL ONGLET TENNIS */}
                  <button
                    onClick={() => setActiveTab('tennis-goat')}
                    className={`px-2 md:px-3 py-3 rounded-xl font-medium transition-all duration-200 text-xs md:text-sm ${
                      activeTab === 'tennis-goat'
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    🎾 GOAT
                  </button>
                  <button
                    disabled
                    className="px-2 md:px-3 py-3 rounded-xl font-medium text-white/50 cursor-not-allowed relative text-xs md:text-sm col-span-2 md:col-span-1 lg:col-span-1"
                  >
                    🏀 MVP
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-yellow-900 text-xs px-1 py-0.5 rounded-full font-bold text-[10px]">
                      Soon
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Description de l'onglet actif */}
            <div className="max-w-2xl mx-auto">
              {activeTab === 'matches' && (
                <p className="text-indigo-100 text-sm">
                  📊 Les événements sportifs les mieux notés par la communauté
                </p>
              )}
              {activeTab === 'ballon-or' && (
                <p className="text-indigo-100 text-sm">
                  👑 Le classement des meilleurs footballeurs selon leurs performances notées
                </p>
              )}
              {activeTab === 'cholismo' && (
                <p className="text-indigo-100 text-sm">
                  👨‍💼 Le classement des meilleurs coachs selon leurs performances tactiques évaluées
                </p>
              )}
              {activeTab === 'driver-fans' && (
                <p className="text-indigo-100 text-sm">
                  🏎️ Le classement des pilotes F1 les mieux notés par les fans de course
                </p>
              )}
              {/* 🆕 DESCRIPTION TENNIS */}
              {activeTab === 'tennis-goat' && (
                <p className="text-indigo-100 text-sm">
                  🎾 Le classement des meilleurs joueurs de tennis selon la communauté
                </p>
              )}
              {activeTab === 'mvp' && (
                <p className="text-indigo-100 text-sm">
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

        {activeTab === 'cholismo' && (
          <CholismoContent
            coaches={coaches}
            loading={coachesLoading}
            cholismoPeriod={cholismoPeriod}
            setCholismoPeriod={setCholismoPeriod}
            coachSportFilter={coachSportFilter}
            setCoachSportFilter={setCoachSportFilter}
            minCoachMatches={minCoachMatches}
            setMinCoachMatches={setMinCoachMatches}
            formatDate={formatDate}
            getRankIcon={getRankIcon}
            getRankBgColor={getRankBgColor}
            getSportEmoji={getSportEmoji}
          />
        )}

        {activeTab === 'driver-fans' && (
          <DriverOfTheFansContent
            drivers={drivers}
            loading={driversLoading}
            driverPeriod={driverPeriod}
            setDriverPeriod={setDriverPeriod}
            minDriverRaces={minDriverRaces}
            setMinDriverRaces={setMinDriverRaces}
            formatDate={formatDate}
            getRankIcon={getRankIcon}
            getRankBgColor={getRankBgColor}
            getSportEmoji={getSportEmoji}
          />
        )}

        {/* 🆕 NOUVEAU CONTENU TENNIS GOAT */}
        {activeTab === 'tennis-goat' && (
          <TennisGOATContent
            tennisPlayers={tennisPlayers}
            loading={tennisLoading}
            tennisPeriod={tennisPeriod}
            setTennisPeriod={setTennisPeriod}
            minTennisMatches={minTennisMatches}
            setMinTennisMatches={setMinTennisMatches}
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

      <div className="h-24 safe-bottom"></div>
    </div>
  )
}

// ============================================================================
// 🆕 NOUVEAU COMPOSANT TENNIS GOAT
// ============================================================================

function TennisGOATContent({
  tennisPlayers,
  loading,
  tennisPeriod,
  setTennisPeriod,
  minTennisMatches,
  setMinTennisMatches,
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
    if (rating >= 9.5) return 'TENNIS LEGEND'
    if (rating >= 9) return 'GRAND SLAM KING'
    if (rating >= 8.5) return 'MASTER CHAMPION'
    if (rating >= 8) return 'ATP ELITE'
    if (rating >= 7.5) return 'TOP PLAYER'
    if (rating >= 7) return 'SOLID PLAYER'
    return 'RISING STAR'
  }

  return (
    <>
      {/* Filters Tennis GOAT */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-green-50 to-yellow-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg border border-green-200 dark:border-slate-600">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎾</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtres GOAT</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">🏆 Tennis uniquement - Les maîtres du court</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📅 Période
              </label>
              <select
                value={tennisPeriod}
                onChange={(e) => setTennisPeriod(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-green-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all-time">🏆 Tous temps</option>
                <option value="this-year">📅 Cette année</option>
                <option value="this-season">🎾 Cette saison</option>
                <option value="last-6-months">📊 6 derniers mois</option>
              </select>
            </div>

            {/* Min Matches Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🎯 Matchs minimum
              </label>
              <select
                value={minTennisMatches}
                onChange={(e) => setMinTennisMatches(parseInt(e.target.value))}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-green-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

      {/* Loading et contenu Tennis GOAT */}
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
      ) : tennisPlayers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎾</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun joueur de tennis trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Aucun joueur ne correspond à vos critères</p>
          <button
            onClick={() => {
              setTennisPeriod('all-time')
              setMinTennisMatches(1)
            }}
            className="btn-mobile-primary"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div>
          {/* Podium Top 3 Joueurs Tennis - TOUJOURS AFFICHÉ */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center space-x-2">
              <span className="text-3xl">🎾</span>
              <span>Podium Tennis GOAT</span>
            </h2>
            
            {tennisPlayers.length >= 3 ? (
              <div className="relative max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {tennisPlayers.slice(0, 3).map((player: any, index: number) => (
                    <div 
                      key={player.id}
                      className={`${
                        index === 0 ? 'md:order-2' : 
                        index === 1 ? 'md:order-1' : 
                        'md:order-3'
                      }`}
                    >
                      <div className={`relative group ${
                        index === 0 ? '' : 
                        index === 1 ? 'md:mt-8' : 
                        'md:mt-16'
                      }`}>
                        <div 
                          className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl transform transition-all duration-300 hover:scale-105 cursor-pointer ${getRankBgColor(index)}`}
                        >
                          <div className="absolute top-4 right-4">
                            <div className="w-12 h-12 bg-black/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/30">
                              {getRankIcon(index)}
                            </div>
                          </div>

                          <div className="absolute top-4 left-4">
                            <div className="w-10 h-10 bg-black/20 backdrop-blur rounded-full flex items-center justify-center text-xl border border-white/30">
                              🎾
                            </div>
                          </div>

                          <div className="absolute top-16 left-4">
                            <div className="bg-black/30 backdrop-blur px-2 py-1 rounded-full border border-white/30">
                              <span className="text-xs font-bold">🏆 TENNIS</span>
                            </div>
                          </div>

                          <div className="mt-16 mb-6 text-center">
                            <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{player.name}</h3>
                            <div className="space-y-1">
                              <p className="text-sm opacity-90 bg-black/20 inline-block px-3 py-1 rounded-full">
                                Joueur • {player.teams.join('/')}
                              </p>
                              <p className="text-xs opacity-75">
                                {player.totalMatches} match{player.totalMatches > 1 ? 's' : ''} • {player.totalRatings} note{player.totalRatings > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              <span className="text-2xl">🎾</span>
                              <span className="text-3xl font-black drop-shadow-lg">{player.avgRating.toFixed(2)}</span>
                              <span className="text-lg opacity-90">/10</span>
                            </div>
                            <p className="text-sm font-semibold bg-black/20 inline-block px-3 py-1 rounded-full">
                              {getRatingLabel(player.avgRating)}
                            </p>
                          </div>
                        </div>
                        
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
                          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-green-50 to-yellow-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-green-200 dark:border-slate-600">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎾</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Podium en attente</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Pas encore assez de joueurs pour le podium</p>
                <p className="text-sm text-green-600 dark:text-green-400">Ajustez les filtres pour voir plus de candidats</p>
              </div>
            )}
          </div>

          {/* Classement complet des joueurs de tennis */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span>Classement Complet Tennis GOAT</span>
            </h2>
            
            <div className="space-y-4">
              {tennisPlayers.map((player: any, index: number) => (
                <div key={player.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(index)}`}>
                        {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          🎾 Joueur de Tennis • {player.teams.join(', ')} • {player.totalMatches} match{player.totalMatches > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getRatingColor(player.avgRating)}`}>
                        {player.avgRating.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {player.totalRatings} note{player.totalRatings > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================================
// COMPOSANTS ENFANTS EXISTANTS (inchangés)
// ============================================================================

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
                <option value="TENNIS">🎾 Tennis</option>
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
      ) : !matches || matches.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun match trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400">Aucun match ne correspond à vos critères</p>
        </div>
      ) : (
        <div className="space-y-6">
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

// Composants BallonOrContent, CholismoContent, DriverOfTheFansContent restent identiques mais avec une ligne importante:

function BallonOrContent({
  players,
  loading,
  ballonOrPeriod,
  setBallonOrPeriod,
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
    if (rating >= 4) return 'MAUVAIS'
    return 'CORRECT'
  }

  return (
    <>
      {/* Filters Ballon d'Or - FOOTBALL UNIQUEMENT */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg border border-yellow-200 dark:border-slate-600">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtres Ballon d'Or</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">⚽ Football uniquement - Le prestige mondial</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Position Filter - FOOTBALL POSITIONS UNIQUEMENT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📍 Position
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-yellow-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">Toutes positions</option>
                <option value="GK">🥅 Gardien</option>
                <option value="DEF">🛡️ Défenseur</option>
                <option value="MID">⚙️ Milieu</option>
                <option value="FWD">⚽ Attaquant</option>
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
                className="w-full p-3 bg-white dark:bg-slate-700 border border-yellow-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                className="w-full p-3 bg-white dark:bg-slate-700 border border-yellow-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            ⚽ {players.length} footballeurs trouvés - Ballon d'Or strictement football !
          </p>
          
          {/* Liste des joueurs de football uniquement */}
          <div className="space-y-4">
            {players.map((player: any, index: number) => (
              <div key={player.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(index)}`}>
                      {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ⚽ Footballeur • {player.teams.join(', ')} • {player.totalMatches} match{player.totalMatches > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getRatingColor(player.avgRating)}`}>
                      {player.avgRating.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {player.totalRatings} note{player.totalRatings > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// CholismoContent et DriverOfTheFansContent restent identiques...

function CholismoContent({
  coaches,
  loading,
  cholismoPeriod,
  setCholismoPeriod,
  coachSportFilter,
  setCoachSportFilter,
  minCoachMatches,
  setMinCoachMatches,
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
    if (rating >= 9.5) return 'GÉNIE TACTIQUE'
    if (rating >= 9) return 'MAÎTRE STRATÈGE'
    if (rating >= 8.5) return 'TACTIQUE EXCELLENTE'
    if (rating >= 8) return 'TRÈS BON COACH'
    if (rating >= 7.5) return 'BON STRATÈGE'
    if (rating >= 7) return 'COACH CORRECT'
    return 'EN PROGRESSION'
  }

  return (
    <>
      {/* Filters Cholismo */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg border border-purple-200 dark:border-slate-600">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtres Cholismo du Peuple</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Classement des meilleurs stratèges</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🏆 Sport
              </label>
              <select
                value={coachSportFilter}
                onChange={(e) => setCoachSportFilter(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-purple-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">🌟 Tous les sports</option>
                <option value="FOOTBALL">⚽ Football</option>
                <option value="BASKETBALL">🏀 Basketball</option>
                <option value="MMA">🥊 MMA</option>
                <option value="RUGBY">🏉 Rugby</option>
              </select>
            </div>

            {/* Period Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📅 Période
              </label>
              <select
                value={cholismoPeriod}
                onChange={(e) => setCholismoPeriod(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-purple-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                value={minCoachMatches}
                onChange={(e) => setMinCoachMatches(parseInt(e.target.value))}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-purple-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {/* Contenu similaire au Ballon d'Or mais pour les coachs */}
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
      ) : coaches.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCheck className="w-12 h-12 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun coach trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Aucun coach ne correspond à vos critères</p>
          <button
            onClick={() => {
              setCoachSportFilter('FOOTBALL')
              setCholismoPeriod('all-time')
              setMinCoachMatches(1)
            }}
            className="btn-mobile-primary"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            👨‍💼 {coaches.length} coachs trouvés - Le Cholismo du Peuple !
          </p>
          
          {/* Liste des coachs */}
          <div className="space-y-4">
            {coaches.map((coach: any, index: number) => (
              <div key={coach.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(index)}`}>
                      {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{coach.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        👨‍💼 Coach • {coach.teams.join(', ')} • {coach.totalMatches} match{coach.totalMatches > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getRatingColor(coach.avgRating)}`}>
                      {coach.avgRating.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {coach.totalRatings} éval{coach.totalRatings > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function DriverOfTheFansContent({
  drivers,
  loading,
  driverPeriod,
  setDriverPeriod,
  minDriverRaces,
  setMinDriverRaces,
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
    if (rating >= 9.5) return 'LÉGENDE F1'
    if (rating >= 9) return 'CHAMPION WORLD'
    if (rating >= 8.5) return 'PILOTE EXCEPTIONNEL'
    if (rating >= 8) return 'TRÈS BON PILOTE'
    if (rating >= 7.5) return 'BON PILOTE'
    if (rating >= 7) return 'PILOTE CORRECT'
    return 'EN PROGRESSION'
  }

  return (
    <>
      {/* Filters Driver of the Fans */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg border border-red-200 dark:border-slate-600">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏎️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtres Driver of the Fans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">🏁 Formule 1 uniquement - Les rois de la vitesse</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📅 Période
              </label>
              <select
                value={driverPeriod}
                onChange={(e) => setDriverPeriod(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-red-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all-time">🏆 Tous temps</option>
                <option value="this-year">📅 Cette année</option>
                <option value="this-season">🏁 Cette saison</option>
                <option value="last-6-months">📊 6 derniers mois</option>
              </select>
            </div>

            {/* Min Races Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🏁 Courses minimum
              </label>
              <select
                value={minDriverRaces}
                onChange={(e) => setMinDriverRaces(parseInt(e.target.value))}
                className="w-full p-3 bg-white dark:bg-slate-700 border border-red-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value={1}>1+ course</option>
                <option value={3}>3+ courses</option>
                <option value={5}>5+ courses</option>
                <option value={10}>10+ courses</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading et contenu Driver of the Fans */}
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
      ) : drivers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏎️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun pilote trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Aucun pilote ne correspond à vos critères</p>
          <button
            onClick={() => {
              setDriverPeriod('all-time')
              setMinDriverRaces(1)
            }}
            className="btn-mobile-primary"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            🏎️ {drivers.length} pilotes F1 trouvés - Driver of the Fans !
          </p>
          
          {/* Liste des pilotes */}
          <div className="space-y-4">
            {drivers.map((driver: any, index: number) => (
              <div key={driver.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${getRankBgColor(index)}`}>
                      {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{driver.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        🏎️ Pilote F1 • {driver.teams.join(', ')} • {driver.totalMatches} course{driver.totalMatches > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getRatingColor(driver.avgRating)}`}>
                      {driver.avgRating.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {driver.totalRatings} note{driver.totalRatings > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}