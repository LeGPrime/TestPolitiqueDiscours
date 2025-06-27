import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Star, Trophy, LogOut, RefreshCw, Search, Users, Calendar, Filter, BarChart3 } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'

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

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'recent' | 'today'>('recent')
  const [sportFilter, setSportFilter] = useState<'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetchMatches()
    }
  }, [session, filter, sportFilter])

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

  const rateMatch = async (matchId: string, rating: number, comment?: string) => {
    try {
      await axios.post('/api/ratings', { matchId, rating, comment })
      fetchMatches()
      alert('Événement noté avec succès! 🎉')
    } catch (error) {
      console.error('Erreur notation:', error)
      alert('Erreur lors de la notation')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      fetchMatches()
    }
  }

  // Navigation items
  const navigationItems = [
    { href: '/', label: 'Accueil', icon: Trophy, active: true },
    { href: '/search', label: 'Recherche', icon: Search, active: false },
    { href: '/friends', label: 'Amis', icon: Users, active: false },
    { href: '/top-matches', label: 'Top', icon: Trophy, active: false },
  ]

  // Sports disponibles
  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆', color: 'text-gray-600' },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'text-green-600' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'text-orange-600' },
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'text-red-600' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'text-purple-600' },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'text-blue-600' }
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SportRate</h1>
            <p className="text-lg text-gray-600 mb-2">Letterboxd du Sport</p>
            <p className="text-sm text-gray-500 mb-8">⚽🏀🥊🏉🏎️ Notez tous vos événements sportifs</p>
            
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-lg font-medium transition-colors"
              >
                🔐 Se connecter
              </Link>
              
              <Link
                href="/auth/register"
                className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg font-medium transition-colors"
              >
                ✨ Créer un compte
              </Link>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                <span>Ou </span>
                <button
                  onClick={() => signIn('github')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
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
                <h1 className="text-2xl font-bold text-gray-900">Sporating</h1>
                <p className="text-xs text-gray-500">Ton œil sur le jeu.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Navigation */}
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Événements à noter</h2>
              <p className="text-gray-600">⚽🏀🥊🏉🏎️ Tous vos sports favoris en un endroit</p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {/* Filtre période */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('recent')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'recent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2 inline" />
                  Récents
                </button>
                <button
                  onClick={() => setFilter('today')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Aujourd'hui
                </button>
              </div>
              
              <button
                onClick={fetchMatches}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Filtres Sports */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSportFilter(sport.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    sportFilter === sport.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-lg">{sport.emoji}</span>
                  <span className="font-medium">{sport.name}</span>
                  {stats?.bySport && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sportFilter === sport.id ? 'bg-white/20' : 'bg-gray-100'
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

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="flex max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une équipe, fighter, pilote..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des événements multi-sports...</p>
            <p className="text-sm text-gray-500 mt-2">Football, Basketball, MMA, Rugby, F1...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun événement trouvé' : 'Aucun événement disponible'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `Aucun événement trouvé pour "${searchTerm}" en ${sportFilter === 'all' ? 'tous sports' : sportFilter}`
                : 'Les événements apparaîtront ici une fois terminés'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  fetchMatches()
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Voir tous les événements
              </button>
            )}
            <div className="mt-6">
              <Link
                href="/admin/sports-dashboard"
                className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <span>⚙️ Importer des données</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {matches.map((match) => (
              <MatchCard
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

// Composant MatchCard adapté multi-sports
function MatchCard({ match, onRate, currentUserId }: {
  match: Match
  onRate: (matchId: string, rating: number, comment?: string) => void
  currentUserId?: string
}) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)

  const userRating = match.ratings.find(r => r.user.id === currentUserId)

  const handleRate = () => {
    if (selectedRating > 0) {
      onRate(match.id, selectedRating, comment)
      setShowRatingForm(false)
      setSelectedRating(0)
      setComment('')
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
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getSportEmoji(match.sport)}</span>
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {match.competition}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {new Date(match.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 flex-1">
          {match.homeTeamLogo && (
            <img src={match.homeTeamLogo} alt="" className="w-8 h-8" />
          )}
          <span className="font-semibold text-lg">{match.homeTeam}</span>
        </div>
        
        <div className="mx-6 text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatScore(match.homeScore, match.awayScore, match.sport)}
          </div>
          <div className="text-sm text-green-600 font-medium">Terminé</div>
        </div>
        
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <span className="font-semibold text-lg">{match.awayTeam}</span>
          {match.awayTeamLogo && (
            <img src={match.awayTeamLogo} alt="" className="w-8 h-8" />
          )}
        </div>
      </div>

      {match.venue && (
        <p className="text-sm text-gray-600 mb-4 flex items-center">
          <span className="mr-1">📍</span>
          {match.venue}
        </p>
      )}

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
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
          
          <Link
            href={`/match/${match.id}`}
            className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Détails</span>
          </Link>
        </div>

        {!match.canRate ? (
          <div className="text-sm text-gray-500 italic">
            Cet événement ne peut pas encore être noté
          </div>
        ) : userRating ? (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-800">✅ Votre note</span>
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
              <p className="text-sm text-blue-700">"{userRating.comment}"</p>
            )}
          </div>
        ) : (
          <div>
            {!showRatingForm ? (
              <button
                onClick={() => setShowRatingForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ⭐ Noter cet événement
              </button>
            ) : (
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium mb-3">Votre note :</p>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-7 h-7 cursor-pointer transition-colors ${
                          i < selectedRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        } hover:text-yellow-400`}
                        onClick={() => setSelectedRating(i + 1)}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={`Qu'avez-vous pensé de cet événement ${getSportEmoji(match.sport)} ?`}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleRate}
                    disabled={selectedRating === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    ✅ Confirmer
                  </button>
                  <button
                    onClick={() => {
                      setShowRatingForm(false)
                      setSelectedRating(0)
                      setComment('')
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    ❌ Annuler
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