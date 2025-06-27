// pages/profile.tsx
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Trophy, Search, Users, LogOut, Star, Calendar, MapPin, 
  Edit3, Settings, BarChart3, TrendingUp, Heart, UserPlus,
  Activity, Award, Target, Zap, Globe, Mail, Shield,
  Plus, X, Check
} from 'lucide-react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'

interface UserProfile {
  user: {
    id: string
    name?: string
    username?: string
    email: string
    image?: string
    bio?: string
    location?: string
    favoriteClub?: string
    createdAt: string
  }
  stats: {
    totalRatings: number
    totalPlayerRatings: number
    avgRating: number
    avgPlayerRating: number
    totalFriends: number
    favoriteCompetition?: string
    bestRatedPlayer?: any
    recentActivity: number
    recentPlayerActivity: number
    topMatches: any[]
    topPlayerRatings: any[]
    ratingDistribution: any[]
    playerRatingDistribution: any[]
    joinDate: string
  }
  recentRatings: any[]
  recentPlayerRatings: any[]
  followedTeams: any[]
}

interface Team {
  id: string
  name: string
  logo?: string
  sport: string
  league?: string
  country?: string
  followersCount: number
  isFollowed: boolean
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { userId } = router.query
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'player-ratings' | 'teams' | 'stats'>('overview')
  const [teamSearchQuery, setTeamSearchQuery] = useState('')
  const [teamSportFilter, setTeamSportFilter] = useState<'all' | 'football' | 'basketball'>('all')
  const [showTeamSearch, setShowTeamSearch] = useState(false)

  const targetUserId = userId as string || session?.user?.id
  const isOwnProfile = !userId || userId === session?.user?.id

  useEffect(() => {
    if (session && targetUserId) {
      fetchProfile()
      if (isOwnProfile || activeTab === 'teams') {
        fetchTeams()
      }
    }
  }, [session, targetUserId, activeTab])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/profile?userId=${targetUserId}`)
      setProfile(response.data)
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const params = new URLSearchParams({
        sport: teamSportFilter,
        followed: 'true'
      })
      
      if (teamSearchQuery) {
        params.append('search', teamSearchQuery)
      }

      const response = await axios.get(`/api/teams?${params}`)
      setTeams(response.data.teams)
    } catch (error) {
      console.error('Erreur chargement équipes:', error)
    }
  }

  const searchAllTeams = async () => {
    try {
      const params = new URLSearchParams({
        sport: teamSportFilter
      })
      
      if (teamSearchQuery) {
        params.append('search', teamSearchQuery)
      }

      const response = await axios.get(`/api/teams?${params}`)
      setTeams(response.data.teams)
    } catch (error) {
      console.error('Erreur recherche équipes:', error)
    }
  }

  const toggleTeamFollow = async (teamId: string, isFollowed: boolean) => {
    try {
      await axios.post('/api/teams', {
        action: isFollowed ? 'unfollow' : 'follow',
        teamId
      })

      // Mettre à jour l'état local
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? { 
              ...team, 
              isFollowed: !isFollowed,
              followersCount: isFollowed ? team.followersCount - 1 : team.followersCount + 1
            }
          : team
      ))

      // Rafraîchir le profil pour les stats
      fetchProfile()
    } catch (error) {
      console.error('Erreur toggle team:', error)
    }
  }

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: Trophy, active: false },
    { href: '/search', label: 'Recherche', icon: Search, active: false },
    { href: '/friends', label: 'Amis', icon: Users, active: false },
    { href: '/profile', label: 'Profil', icon: Users, active: true },
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connexion requise</h1>
          <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profil non trouvé</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SportRate</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Profil Utilisateur</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        item.active 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Link 
                  href="/admin/sports-dashboard-2025"
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  ⚙️ Admin
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
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
        {/* Header Profil */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-32"></div>
          <div className="relative px-8 pb-8">
            {/* Photo de profil */}
            <div className="flex items-end space-x-6 -mt-16">
              {profile.user.image ? (
                <img
                  src={profile.user.image}
                  alt={profile.user.name || 'User'}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {(profile.user.name || profile.user.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {profile.user.name || profile.user.username}
                    </h1>
                    {profile.user.username && profile.user.name && (
                      <p className="text-gray-600 dark:text-gray-400">@{profile.user.username}</p>
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Infos utilisateur */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                {profile.user.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bio</h3>
                    <p className="text-gray-700 dark:text-gray-300">{profile.user.bio}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {profile.user.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Membre depuis {new Date(profile.user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  {profile.user.favoriteClub && (
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{profile.user.favoriteClub}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats rapides */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.stats.totalRatings}</div>
                    <div className="text-sm text-blue-700">Notes données</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {profile.stats.avgRating > 0 ? profile.stats.avgRating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-yellow-700">Note moyenne</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{profile.stats.totalFriends}</div>
                    <div className="text-sm text-green-700">Amis</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{teams.length}</div>
                    <div className="text-sm text-purple-700">Équipes suivies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
                { id: 'ratings', label: 'Notes matchs', icon: Star },
                { id: 'player-ratings', label: 'Notes joueurs', icon: Users },
                { id: 'teams', label: 'Équipes suivies', icon: Heart },
                { id: 'stats', label: 'Statistiques', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Compétition préférée et activité récente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Trophy className="w-6 h-6 text-green-600" />
                      <h3 className="font-semibold text-green-900">Compétition préférée</h3>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {profile.stats.favoriteCompetition || 'Aucune préférence'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Zap className="w-6 h-6 text-purple-600" />
                      <h3 className="font-semibold text-purple-900">Activité récente</h3>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {profile.stats.recentActivity} notes
                    </div>
                    <div className="text-sm text-purple-600 mt-1">6 derniers mois</div>
                  </div>
                </div>

                {/* Top matchs notés */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span>Meilleurs matchs notés</span>
                  </h3>
                  {profile.stats.topMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.stats.topMatches.slice(0, 4).map((rating: any, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex space-x-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(rating.match.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {rating.match.homeTeam} vs {rating.match.awayTeam}
                          </h4>
                          <p className="text-sm text-gray-600">{rating.match.competition}</p>
                          {rating.comment && (
                            <p className="text-sm text-gray-700 mt-2 italic">"{rating.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Aucun match noté pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dernières notes ({profile.recentRatings.length})
                  </h3>
                  {profile.stats.totalRatings > profile.recentRatings.length && (
                    <Link 
                      href="/search" 
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Voir toutes les notes →
                    </Link>
                  )}
                </div>

                {profile.recentRatings.length > 0 ? (
                  <div className="space-y-4">
                    {profile.recentRatings.map((rating: any) => (
                      <div key={rating.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {rating.match.competition}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                            </h4>
                            {rating.match.venue && (
                              <p className="text-sm text-gray-600 flex items-center mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                {rating.match.venue}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex space-x-1 mb-2">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rating.rating}/5
                            </div>
                          </div>
                        </div>
                        
                        {rating.comment && (
                          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <p className="text-gray-700 italic">"{rating.comment}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune note</h3>
                    <p className="text-gray-600 mb-4">
                      {isOwnProfile 
                        ? 'Vous n\'avez pas encore noté d\'événements'
                        : 'Cet utilisateur n\'a pas encore noté d\'événements'
                      }
                    </p>
                    {isOwnProfile && (
                      <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Découvrir des événements à noter →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

{/* Player Ratings Tab */}
{activeTab === 'player-ratings' && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
        <Users className="w-5 h-5 text-purple-500" />
        <span>Notations de joueurs ({profile.stats.totalPlayerRatings || 0})</span>
      </h3>
      {profile.stats.totalPlayerRatings > (profile.recentPlayerRatings?.length || 0) && (
        <span className="text-blue-600 text-sm font-medium">
          Affichage des {profile.recentPlayerRatings?.length || 0} plus récentes
        </span>
      )}
    </div>

    {/* Statistiques rapides */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
        <div className="text-2xl font-bold text-purple-600">{profile.stats.totalPlayerRatings || 0}</div>
        <div className="text-sm text-purple-700">Joueurs notés</div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
        <div className="text-2xl font-bold text-blue-600">
          {profile.stats.avgPlayerRating > 0 ? profile.stats.avgPlayerRating.toFixed(1) : '—'}
        </div>
        <div className="text-sm text-blue-700">Note moyenne</div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
        <div className="text-2xl font-bold text-green-600">
          {profile.stats.bestRatedPlayer ? profile.stats.bestRatedPlayer.rating : '—'}
        </div>
        <div className="text-sm text-green-700">Meilleure note</div>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200">
        <div className="text-2xl font-bold text-yellow-600">{profile.stats.recentPlayerActivity || 0}</div>
        <div className="text-sm text-yellow-700">Notes récentes</div>
      </div>
    </div>

    {/* Meilleur joueur noté */}
    {profile.stats.bestRatedPlayer && (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-1">
              🏆 Votre joueur le mieux noté
            </h3>
            <div className="text-2xl font-bold text-yellow-800">
              {profile.stats.bestRatedPlayer.player.name}
            </div>
            <div className="text-sm text-yellow-700 flex items-center space-x-4 mt-2">
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                {profile.stats.bestRatedPlayer.rating}/10
              </span>
              <span>
                {profile.stats.bestRatedPlayer.match.homeTeam} vs {profile.stats.bestRatedPlayer.match.awayTeam}
              </span>
              <span>
                {new Date(profile.stats.bestRatedPlayer.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {profile.stats.bestRatedPlayer.comment && (
              <div className="mt-2 bg-white bg-opacity-50 rounded-lg p-3">
                <p className="text-yellow-800 italic">"{profile.stats.bestRatedPlayer.comment}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Répartition des notes de joueurs */}
    {profile.stats.playerRatingDistribution && profile.stats.playerRatingDistribution.some((d: any) => d.count > 0) && (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <span>Répartition des notes joueurs (sur 10)</span>
        </h3>
        
        <div className="space-y-3">
          {profile.stats.playerRatingDistribution.filter((dist: any) => dist.count > 0).map((dist: any) => (
            <div key={dist.rating} className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 w-16">
                <span className="text-sm font-medium w-8">{dist.rating}/10</span>
              </div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 rounded-full ${
                      dist.rating >= 8 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      dist.rating >= 6 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                      dist.rating >= 4 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      'bg-gradient-to-r from-red-400 to-pink-500'
                    }`}
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 w-20 text-right font-medium">
                {dist.count} ({dist.percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Liste des notations récentes */}
    {profile.recentPlayerRatings && profile.recentPlayerRatings.length > 0 ? (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Dernières notations de joueurs</h4>
        {profile.recentPlayerRatings.map((rating: any) => (
          <div key={rating.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            {/* Header avec info du match */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {rating.match.competition}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                </h4>
                <p className="text-sm text-gray-600">
                  📅 {new Date(rating.match.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Détails de la notation du joueur */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {rating.player.number || '⚽'}
                  </div>
                  <div>
                    <h5 className="font-semibold text-purple-900">{rating.player.name}</h5>
                    <p className="text-sm text-purple-700">{rating.player.position || 'Joueur'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{rating.rating}/10</div>
                  <div className="text-sm text-purple-500">
                    {rating.rating >= 8 ? '🔥 Excellent' :
                     rating.rating >= 6 ? '👍 Bon' :
                     rating.rating >= 4 ? '😐 Correct' :
                     '👎 Décevant'}
                  </div>
                </div>
              </div>
              
              {rating.comment && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                  <p className="text-purple-800 italic">"{rating.comment}"</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notation de joueur</h3>
        <p className="text-gray-600 mb-4">
          {isOwnProfile 
            ? 'Vous n\'avez pas encore noté de joueurs'
            : 'Cet utilisateur n\'a pas encore noté de joueurs'
          }
        </p>
        {isOwnProfile && (
          <div className="space-y-2 text-sm text-gray-500">
            <p>💡 Pour noter des joueurs :</p>
            <p>1. Allez sur la page d'un match terminé</p>
            <p>2. Cliquez sur l'onglet "Compositions"</p>
            <p>3. Cliquez sur un joueur pour le noter</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Découvrir des matchs →
            </Link>
          </div>
        )}
      </div>
    )}
  </div>
)}


            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Équipes suivies ({teams.length})
                  </h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowTeamSearch(!showTeamSearch)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Suivre une équipe</span>
                    </button>
                  )}
                </div>

                {/* Recherche d'équipes */}
                {showTeamSearch && isOwnProfile && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Rechercher des équipes</h4>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <input
                        type="text"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        placeholder="Nom de l'équipe..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={teamSportFilter}
                        onChange={(e) => setTeamSportFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Tous sports</option>
                        <option value="football">⚽ Football</option>
                        <option value="basketball">🏀 Basketball</option>
                      </select>
                      <button
                        onClick={searchAllTeams}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowTeamSearch(false)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des équipes */}
                {teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <div key={team.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4 mb-4">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {team.name[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{team.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{team.sport === 'football' ? '⚽' : '🏀'}</span>
                              {team.league && <span>{team.league}</span>}
                              {team.country && <span>• {team.country}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {team.followersCount} follower{team.followersCount > 1 ? 's' : ''}
                          </div>
                          
                          {isOwnProfile && (
                            <button
                              onClick={() => toggleTeamFollow(team.id, team.isFollowed)}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                team.isFollowed
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {team.isFollowed ? (
                                <>
                                  <X className="w-4 h-4" />
                                  <span>Ne plus suivre</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span>Suivre</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {team.website && (
                          <div className="mt-3 pt-3 border-t">
                            <a
                              href={team.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <Globe className="w-4 h-4" />
                              <span>Site officiel</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {showTeamSearch ? 'Aucune équipe trouvée' : 'Aucune équipe suivie'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {showTeamSearch 
                        ? 'Essayez avec d\'autres termes de recherche'
                        : isOwnProfile 
                          ? 'Commencez à suivre vos équipes préférées'
                          : 'Cet utilisateur ne suit aucune équipe'
                      }
                    </p>
                    {isOwnProfile && !showTeamSearch && (
                      <button
                        onClick={() => setShowTeamSearch(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Découvrir des équipes →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Répartition des notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Répartition des notes</span>
                  </h3>
                  
                  {profile.stats.ratingDistribution.length > 0 ? (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="space-y-4">
                        {profile.stats.ratingDistribution.map((dist: any) => (
                          <div key={dist.rating} className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 w-20">
                              <div className="flex space-x-1">
                                {Array.from({ length: dist.rating }, (_, i) => (
                                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-700"
                                  style={{ width: `${dist.percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 w-16 text-right">
                              {dist.count} ({dist.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Pas assez de données pour afficher les statistiques</p>
                    </div>
                  )}
                </div>

                {/* Autres statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Target className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-green-900">Note moyenne</h4>
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      {profile.stats.avgRating > 0 ? profile.stats.avgRating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-green-600 mt-1">sur 5.0</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <Activity className="w-6 h-6 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Activité</h4>
                    </div>
                    <div className="text-3xl font-bold text-blue-700">
                      {profile.stats.recentActivity}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">notes récentes</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">Popularité</h4>
                    </div>
                    <div className="text-3xl font-bold text-purple-700">
                      {profile.stats.totalFriends}
                    </div>
                    <div className="text-sm text-purple-600 mt-1">amis</div>
                  </div>
                </div>

                {/* Compétition préférée */}
                {profile.stats.favoriteCompetition && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétition préférée</h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                        <div>
                          <div className="text-xl font-bold text-yellow-800">
                            {profile.stats.favoriteCompetition}
                          </div>
                          <div className="text-sm text-yellow-600">
                            La compétition que vous notez le plus
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}