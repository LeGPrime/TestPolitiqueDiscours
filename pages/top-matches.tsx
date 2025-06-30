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
  Filter
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

  useEffect(() => {
    if (session) {
      fetchTopMatches()
    }
  }, [session, period, sortBy])

  const fetchTopMatches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period,
        sortBy,
        limit: '50'
      })
      
      const response = await axios.get(`/api/top-matches?${params}`)
      setMatches(response.data.matches)
    } catch (error) {
      console.error('Erreur chargement top matchs:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: Trophy, active: false },
    { href: '/search', label: 'Recherche', icon: Search, active: false },
    { href: '/friends', label: 'Amis', icon: Users, active: false },
    { href: '/top-matches', label: 'Top', icon: Trophy, active: true },
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
     <Navbar activeTab="home" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-yellow-500" />
                <span>Top des matchs</span>
              </h2>
              <p className="text-gray-600">Les matchs les mieux notés par la communauté</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Period Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: 'all-time', label: 'Tout temps', icon: Trophy },
                { id: 'this-year', label: 'Cette année', icon: Calendar },
                { id: 'this-month', label: 'Ce mois', icon: Calendar },
                { id: 'this-week', label: 'Cette semaine', icon: Clock }
              ].map((periodOption) => {
                const Icon = periodOption.icon
                return (
                  <button
                    key={periodOption.id}
                    onClick={() => setPeriod(periodOption.id as any)}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      period === periodOption.id 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{periodOption.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Sort Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: 'rating', label: 'Note', icon: Star },
                { id: 'popularity', label: 'Popularité', icon: TrendingUp },
                { id: 'recent', label: 'Récents', icon: Clock }
              ].map((sortOption) => {
                const Icon = sortOption.icon
                return (
                  <button
                    key={sortOption.id}
                    onClick={() => setSortBy(sortOption.id as any)}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      sortBy === sortOption.id 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{sortOption.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des meilleurs matchs...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun match noté</h3>
            <p className="text-gray-600 mb-4">Il n'y a pas encore de matchs notés pour cette période</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Découvrir des matchs à noter →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match, index) => (
              <div key={match.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                {/* Rank Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {match.competition}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(match.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Match Details */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 flex-1">
                    {match.homeTeamLogo && (
                      <img src={match.homeTeamLogo} alt="" className="w-8 h-8" />
                    )}
                    <span className="font-semibold text-lg">{match.homeTeam}</span>
                  </div>
                  
                  <div className="mx-6 text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                    </div>
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

                {/* Rating & Stats */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(match.avgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {match.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{match.totalRatings}</span> note{match.totalRatings > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Recent Ratings Preview */}
                  {match.ratings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Derniers avis :</h4>
                      <div className="space-y-2">
                        {match.ratings.slice(0, 3).map((rating) => (
                          <div key={rating.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex space-x-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                {rating.comment || 'Aucun commentaire'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Par {rating.user.name || rating.user.username || 'Anonyme'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
