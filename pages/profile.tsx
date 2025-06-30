// pages/profile.tsx - Version améliorée avec liens matches et stats par sport
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Trophy, Search, Users, LogOut, Star, Calendar, MapPin, 
  Edit3, Settings, BarChart3, TrendingUp, Heart, UserPlus,
  Activity, Award, Target, Zap, Globe, Mail, Shield,
  Plus, X, Check, Camera, Upload, Save, Eye, ArrowRight,
  Gamepad2, BarChart, PieChart, Filter
} from 'lucide-react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import Navbar from '../components/Navbar' 

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
    // 🆕 Stats par sport
    statsBySport: {
      [sport: string]: {
        totalRatings: number
        avgRating: number
        favoriteCompetition?: string
        totalPlayerRatings: number
        avgPlayerRating: number
      }
    }
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

interface EditProfileData {
  name: string
  username: string
  bio: string
  location: string
  favoriteClub: string
}

export default function EnhancedProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { userId } = router.query
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'player-ratings' | 'teams' | 'stats'>('overview')
  const [activeSport, setActiveSport] = useState<'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'>('all')
  const [teamSearchQuery, setTeamSearchQuery] = useState('')
  const [teamSportFilter, setTeamSportFilter] = useState<'all' | 'football' | 'basketball'>('all')
  const [showTeamSearch, setShowTeamSearch] = useState(false)
  const [editData, setEditData] = useState<EditProfileData>({
    name: '',
    username: '',
    bio: '',
    location: '',
    favoriteClub: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const targetUserId = userId as string || session?.user?.id
  const isOwnProfile = !userId || userId === session?.user?.id

  // Sports disponibles avec emojis
  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆', color: 'text-gray-600' },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'text-green-600' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'text-orange-600' },
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'text-red-600' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'text-purple-600' },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'text-blue-600' }
  ]

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
      
      // Pré-remplir les données d'édition
      if (response.data.user && isOwnProfile) {
        setEditData({
          name: response.data.user.name || '',
          username: response.data.user.username || '',
          bio: response.data.user.bio || '',
          location: response.data.user.location || '',
          favoriteClub: response.data.user.favoriteClub || ''
        })
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSavingProfile(true)
      await axios.put('/api/profile', editData)
      await fetchProfile() // Recharger le profil
      setEditMode(false)
      alert('Profil mis à jour avec succès ! ✅')
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error)
      alert('Erreur lors de la mise à jour du profil')
    } finally {
      setSavingProfile(false)
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

  const toggleTeamFollow = async (teamId: string, isFollowed: boolean) => {
    try {
      await axios.post('/api/teams', {
        action: isFollowed ? 'unfollow' : 'follow',
        teamId
      })

      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? { 
              ...team, 
              isFollowed: !isFollowed,
              followersCount: isFollowed ? team.followersCount - 1 : team.followersCount + 1
            }
          : team
      ))

      fetchProfile()
    } catch (error) {
      console.error('Erreur toggle team:', error)
    }
  }

  // Filtrer les ratings par sport
  const getFilteredRatings = (ratings: any[]) => {
    if (activeSport === 'all') return ratings
    return ratings.filter(rating => {
      const sport = getSportFromCompetition(rating.match?.competition || '')
      return sport === activeSport
    })
  }

  const getSportFromCompetition = (competition: string): string => {
    const basketballCompetitions = ['NBA', 'EuroLeague', 'WNBA', 'FIBA']
    const mmaCompetitions = ['UFC', 'Bellator', 'ONE', 'PFL']
    const rugbyCompetitions = ['Six Nations', 'Top 14', 'Premiership', 'URC']
    const f1Competitions = ['Formula 1', 'F1', 'Monaco GP', 'British GP']
    
    if (basketballCompetitions.some(comp => competition.includes(comp))) return 'basketball'
    if (mmaCompetitions.some(comp => competition.includes(comp))) return 'mma'
    if (rugbyCompetitions.some(comp => competition.includes(comp))) return 'rugby'
    if (f1Competitions.some(comp => competition.includes(comp))) return 'f1'
    
    return 'football'
  }

  const getStatsForActiveSport = () => {
    if (!profile) return null
    
    if (activeSport === 'all') {
      return {
        totalRatings: profile.stats.totalRatings,
        avgRating: profile.stats.avgRating,
        totalPlayerRatings: profile.stats.totalPlayerRatings,
        avgPlayerRating: profile.stats.avgPlayerRating,
        favoriteCompetition: profile.stats.favoriteCompetition
      }
    }
    
    return profile.stats.statsBySport?.[activeSport] || {
      totalRatings: 0,
      avgRating: 0,
      totalPlayerRatings: 0,
      avgPlayerRating: 0,
      favoriteCompetition: null
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

  const currentStats = getStatsForActiveSport()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <Navbar activeTab="home" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Profil */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-32 relative">
            {/* Bouton éditer bannière (futur) */}
            {isOwnProfile && editMode && (
              <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="relative px-8 pb-8">
            {/* Photo de profil */}
            <div className="flex items-end space-x-6 -mt-16">
              <div className="relative">
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
                
                {/* Bouton éditer photo */}
                {isOwnProfile && editMode && (
                  <button className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    {editMode ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nom complet"
                          className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={editData.username}
                          onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Nom d'utilisateur"
                          className="block bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none text-gray-600 dark:text-gray-400"
                        />
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {profile.user.name || profile.user.username}
                        </h1>
                        {profile.user.username && profile.user.name && (
                          <p className="text-gray-600 dark:text-gray-400">@{profile.user.username}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <div className="flex items-center space-x-3">
                      {editMode ? (
                        <>
                          <button
                            onClick={saveProfile}
                            disabled={savingProfile}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {savingProfile ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>Sauvegarder</span>
                          </button>
                          <button
                            onClick={() => setEditMode(false)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Annuler</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Modifier</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Infos utilisateur */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Parlez-nous de vous..."
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        maxLength={200}
                      />
                      <div className="text-xs text-gray-500 mt-1">{editData.bio.length}/200</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localisation</label>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Ville, Pays"
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Équipe favorite</label>
                      <input
                        type="text"
                        value={editData.favoriteClub}
                        onChange={(e) => setEditData(prev => ({ ...prev, favoriteClub: e.target.value }))}
                        placeholder="Votre équipe du cœur"
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
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
                )}
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

        {/* Filtres par sport */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtrer par sport</span>
            </h3>
            {currentStats && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentStats.totalRatings} notes • Moyenne: {currentStats.avgRating.toFixed(1)}/5
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setActiveSport(sport.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeSport === sport.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                }`}
              >
                <span className="text-lg">{sport.emoji}</span>
                <span className="font-medium">{sport.name}</span>
                {profile.stats.statsBySport?.[sport.id] && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activeSport === sport.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    {sport.id === 'all' 
                      ? profile.stats.totalRatings
                      : profile.stats.statsBySport[sport.id]?.totalRatings || 0
                    }
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-slate-700">
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
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
                {/* Stats par sport actuel */}
                {currentStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Trophy className="w-6 h-6 text-green-600" />
                        <h3 className="font-semibold text-green-900">
                          {activeSport === 'all' ? 'Tous sports' : sports.find(s => s.id === activeSport)?.name}
                        </h3>
                      </div>
                      <div className="text-2xl font-bold text-green-700 mb-1">
                        {currentStats.totalRatings} notes
                      </div>
                      <div className="text-sm text-green-600">
                        Moyenne: {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : '—'}/5
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Users className="w-6 h-6 text-purple-600" />
                        <h3 className="font-semibold text-purple-900">Notes joueurs</h3>
                      </div>
                      <div className="text-2xl font-bold text-purple-700 mb-1">
                        {currentStats.totalPlayerRatings || 0}
                      </div>
                      <div className="text-sm text-purple-600">
                        Moyenne: {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}/10
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Award className="w-6 h-6 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Compétition préférée</h3>
                      </div>
                      <div className="text-lg font-bold text-blue-700">
                        {currentStats.favoriteCompetition || 'Aucune'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top matchs notés (filtrés par sport) */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span>Meilleurs matchs notés {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}</span>
                  </h3>
                  
                  {(() => {
                    const filteredMatches = getFilteredRatings(profile.stats.topMatches)
                    return filteredMatches.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredMatches.slice(0, 4).map((rating: any, index: number) => (
                          <Link
                            key={index}
                            href={`/match/${rating.match.id}`}
                            className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                          >
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
                              <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="text-sm">Voir détails</span>
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {rating.match.homeTeam} vs {rating.match.awayTeam}
                            </h4>
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{rating.match.competition}</span>
                              <span>{new Date(rating.match.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {rating.comment && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic line-clamp-2">"{rating.comment}"</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>
                          Aucun match noté 
                          {activeSport !== 'all' && ` en ${sports.find(s => s.id === activeSport)?.name}`}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notes de matchs ({getFilteredRatings(profile.recentRatings).length})
                    {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
                  </h3>
                </div>

                {(() => {
                  const filteredRatings = getFilteredRatings(profile.recentRatings)
                  return filteredRatings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredRatings.map((rating: any) => (
                        <Link
                          key={rating.id}
                          href={`/match/${rating.match.id}`}
                          className="block bg-gray-50 dark:bg-slate-700 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                  {rating.match.competition}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                              </h4>
                              {rating.match.venue && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-3">
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
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {rating.rating}/5
                              </div>
                            </div>
                          </div>
                          
                          {rating.comment && (
                            <div className="bg-white dark:bg-slate-600 rounded-lg p-4 border-l-4 border-blue-500">
                              <p className="text-gray-700 dark:text-gray-300 italic">"{rating.comment}"</p>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune note</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile 
                          ? `Vous n'avez pas encore noté d'événements${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                          : `Cet utilisateur n'a pas encore noté d'événements${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
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
                  )
                })()}
              </div>
            )}

            {/* Player Ratings Tab - Même logique avec filtrage par sport */}
            {activeTab === 'player-ratings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span>
                      Notations de joueurs ({getFilteredRatings(profile.recentPlayerRatings || []).length})
                      {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
                    </span>
                  </h3>
                </div>

                {/* Stats rapides pour le sport actuel */}
                {currentStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">{currentStats.totalPlayerRatings || 0}</div>
                      <div className="text-sm text-purple-700">Joueurs notés</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}
                      </div>
                      <div className="text-sm text-blue-700">Note moyenne</div>
                    </div>
                  </div>
                )}

                {(() => {
                  const filteredPlayerRatings = getFilteredRatings(profile.recentPlayerRatings || [])
                  return filteredPlayerRatings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredPlayerRatings.map((rating: any) => (
                        <Link
                          key={rating.id}
                          href={`/match/${rating.match.id}`}
                          className="block bg-white dark:bg-slate-700 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        >
                          {/* Header avec info du match */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                  {rating.match.competition}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                📅 {new Date(rating.match.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {/* Détails de la notation du joueur */}
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {rating.player.number || '⚽'}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-purple-900 dark:text-purple-100">{rating.player.name}</h5>
                                  <p className="text-sm text-purple-700 dark:text-purple-300">{rating.player.position || 'Joueur'}</p>
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
                              <div className="bg-white dark:bg-slate-600 bg-opacity-50 rounded-lg p-3">
                                <p className="text-purple-800 dark:text-purple-200 italic">"{rating.comment}"</p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune notation de joueur</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile 
                          ? `Vous n'avez pas encore noté de joueurs${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                          : `Cet utilisateur n'a pas encore noté de joueurs${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                        }
                      </p>
                      {isOwnProfile && (
                        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
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
                  )
                })()}
              </div>
            )}

            {/* Teams Tab - Inchangé */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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

                {/* Teams content reste identique... */}
                {teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <div key={team.id} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 hover:shadow-md transition-shadow">
                        {/* Team card content... */}
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
                            <h4 className="font-semibold text-gray-900 dark:text-white">{team.name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>{team.sport === 'football' ? '⚽' : '🏀'}</span>
                              {team.league && <span>{team.league}</span>}
                              {team.country && <span>• {team.country}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune équipe suivie</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {isOwnProfile 
                        ? 'Commencez à suivre vos équipes préférées'
                        : 'Cet utilisateur ne suit aucune équipe'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab - Amélioré avec stats par sport */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Répartition des notes par sport */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Répartition des notes {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}</span>
                  </h3>
                  
                  {(() => {
                    // Calculer la distribution pour le sport actuel
                    const sportRatings = getFilteredRatings(profile.recentRatings)
                    const distribution = Array.from({ length: 5 }, (_, i) => {
                      const rating = i + 1
                      const count = sportRatings.filter((r: any) => r.rating === rating).length
                      return { 
                        rating, 
                        count, 
                        percentage: sportRatings.length > 0 ? (count / sportRatings.length) * 100 : 0 
                      }
                    })

                    return distribution.some(d => d.count > 0) ? (
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6">
                        <div className="space-y-4">
                          {distribution.filter(d => d.count > 0).map((dist: any) => (
                            <div key={dist.rating} className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2 w-20">
                                <div className="flex space-x-1">
                                  {Array.from({ length: dist.rating }, (_, i) => (
                                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-700"
                                    style={{ width: `${dist.percentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                                {dist.count} ({dist.percentage.toFixed(1)}%)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Pas assez de données pour afficher les statistiques</p>
                      </div>
                    )
                  })()}
                </div>

                {/* Autres statistiques par sport */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentStats && (
                    <>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <Target className="w-6 h-6 text-green-600" />
                          <h4 className="font-semibold text-green-900">Note moyenne</h4>
                        </div>
                        <div className="text-3xl font-bold text-green-700">
                          {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : '—'}
                        </div>
                        <div className="text-sm text-green-600 mt-1">sur 5.0</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <Activity className="w-6 h-6 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Total notes</h4>
                        </div>
                        <div className="text-3xl font-bold text-blue-700">
                          {currentStats.totalRatings}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">matchs notés</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <Users className="w-6 h-6 text-purple-600" />
                          <h4 className="font-semibold text-purple-900">Joueurs notés</h4>
                        </div>
                        <div className="text-3xl font-bold text-purple-700">
                          {currentStats.totalPlayerRatings || 0}
                        </div>
                        <div className="text-sm text-purple-600 mt-1">
                          avg: {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}/10
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Compétition préférée pour le sport actuel */}
                {currentStats?.favoriteCompetition && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Compétition préférée {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}
                    </h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                        <div>
                          <div className="text-xl font-bold text-yellow-800">
                            {currentStats.favoriteCompetition}
                          </div>
                          <div className="text-sm text-yellow-600">
                            La compétition que vous notez le plus {activeSport !== 'all' && `en ${sports.find(s => s.id === activeSport)?.name}`}
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