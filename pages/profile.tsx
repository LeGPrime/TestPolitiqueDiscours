// pages/profile.tsx - Version mobile complètement optimisée
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Trophy, Search, Users, LogOut, Star, Calendar, MapPin, 
  Edit3, Settings, BarChart3, TrendingUp, Heart, UserPlus,
  Activity, Award, Target, Zap, Globe, Mail, Shield,
  Plus, X, Check, Camera, Upload, Save, Eye, ArrowRight,
  Gamepad2, BarChart, PieChart, Filter, Trash2, ChevronDown,
  MoreHorizontal, Edit, Menu
} from 'lucide-react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import Navbar from '../components/Navbar'
import TeamSearchModal from '../components/TeamSearchModal'
import EnhancedProfileEditor from '../components/EnhancedProfileEditor'
import EnhancedTeamGrid from '../components/EnhancedTeamGrid'
import AvatarUpload from '../components/AvatarUpload'
import DeleteAccountModal from '../components/DeleteAccountModal'

interface UserProfile {
  user: {
    id: string
    name?: string
    username?: string
    email: string
    image?: string
    bio?: string
    location?: string
    age?: string
    occupation?: string
    favoriteClub?: string
    favoriteBasketballTeam?: string
    favoriteTennisPlayer?: string
    favoriteF1Driver?: string
    preferredSports?: string[]
    watchingHabits?: string
    languages?: string[]
    visibility?: {
      location?: boolean
      age?: boolean
      occupation?: boolean
      favoriteClub?: boolean
      favoriteBasketballTeam?: boolean
      favoriteTennisPlayer?: boolean
      favoriteF1Driver?: boolean
    }
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
    totalTeamsFollowed: number
    favoriteSports: any[]
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
  founded?: number
  type: 'team' | 'player'
  followersCount: number
  isFollowed: boolean
  followedSince?: string
}

export default function EnhancedProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { userId } = router.query
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'player-ratings' | 'teams' | 'stats'>('overview')
  const [activeSport, setActiveSport] = useState<'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'>('all')
  
  // États pour les modals
  const [showTeamSearch, setShowTeamSearch] = useState(false)
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userHasPassword, setUserHasPassword] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // État temporaire pour les données avancées
  const [localAdvancedData, setLocalAdvancedData] = useState<any>({})

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

  // Fonction pour merger les données DB + local
  const getMergedUserData = () => {
    if (!profile?.user) return null
    return {
      ...profile.user,
      ...localAdvancedData,
    }
  }

  useEffect(() => {
    if (session && targetUserId) {
      fetchProfile()
      fetchTeams()
      if (isOwnProfile) {
        checkUserHasPassword()
      }
    }
  }, [session, targetUserId])

  useEffect(() => {
    if (session && targetUserId && profile) {
      if (activeTab === 'ratings' || activeTab === 'player-ratings' || activeTab === 'stats') {
        fetchProfile()
      }
      if (activeTab === 'teams') {
        fetchTeams()
      }
    }
  }, [activeTab])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      let response
      try {
        response = await axios.get(`/api/profile/fixed?userId=${targetUserId}`)
      } catch (error) {
        try {
          response = await axios.get(`/api/profile/enhanced?userId=${targetUserId}`)
        } catch (error2) {
          response = await axios.get(`/api/profile?userId=${targetUserId}`)
        }
      }
      setProfile(response.data)
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`/api/teams?followed=true`)
      setTeams(response.data.teams || [])
    } catch (error) {
      console.error('❌ Erreur chargement équipes:', error)
      setTeams([])
    }
  }

  const checkUserHasPassword = async () => {
    try {
      const response = await axios.get('/api/profile/check-password')
      setUserHasPassword(response.data.hasPassword)
    } catch (error) {
      console.error('Erreur vérification mot de passe:', error)
      setUserHasPassword(false)
    }
  }

  const saveEnhancedProfile = async (data: any) => {
    try {
      try {
        const response = await axios.put('/api/profile/enhanced', data)
      } catch (error) {
        const basicData = {
          name: data.name,
          username: data.username,
          bio: data.bio,
          location: data.location,
          favoriteClub: data.favoriteClub
        }
        
        try {
          await axios.put('/api/profile/fixed', basicData)
        } catch (error2) {
          await axios.put('/api/profile', basicData)
        }
        
        if (profile) {
          const mergedData = {
            ...data,
            favoriteTennisPlayer: data.favoriteTennisPlayer,
            favoriteF1Driver: data.favoriteF1Driver,
            favoriteBasketballTeam: data.favoriteBasketballTeam,
            preferredSports: data.preferredSports || [],
            languages: data.languages || [],
            watchingHabits: data.watchingHabits,
            age: data.age,
            occupation: data.occupation,
            visibility: data.visibility || {}
          }
          
          setLocalAdvancedData(mergedData)
          
          setProfile(prev => ({
            ...prev!,
            user: {
              ...prev!.user,
              ...mergedData
            }
          }))
        }
      }
      
      await fetchProfile()
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde profil:', error)
      if (error.response?.data?.error) {
        alert(`Erreur: ${error.response.data.error}`)
      } else {
        alert('Erreur lors de la mise à jour du profil')
      }
      throw error
    }
  }

  const toggleTeamFollow = async (team: Team, isFollowed: boolean) => {
    try {
      await axios.post('/api/teams', {
        action: isFollowed ? 'unfollow' : 'follow',
        teamId: team.id
      })

      setTeams(prev => {
        if (!isFollowed && !prev.find(t => t.id === team.id)) {
          return [...prev, { ...team, isFollowed: true, followedSince: new Date().toISOString() }]
        } else if (isFollowed) {
          return prev.filter(t => t.id !== team.id)
        } else {
          return prev.map(t => 
            t.id === team.id 
              ? { 
                  ...t, 
                  isFollowed: !isFollowed,
                  followersCount: isFollowed ? t.followersCount - 1 : t.followersCount + 1
                }
              : t
          )
        }
      })

      await fetchProfile()
    } catch (error) {
      console.error('❌ Erreur toggle team:', error)
    }
  }

  const handleAvatarChange = async (imageData: string | null) => {
    try {
      const response = await axios.post('/api/profile/avatar', { imageData })
      
      if (profile) {
        setProfile(prev => ({
          ...prev!,
          user: {
            ...prev!.user,
            image: imageData
          }
        }))
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde avatar:', error)
      alert('Erreur lors de la sauvegarde de l\'avatar')
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

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
    if (!profile || !profile.stats) return {
      totalRatings: 0,
      avgRating: 0,
      totalPlayerRatings: 0,
      avgPlayerRating: 0,
      favoriteCompetition: null
    }
    
    if (activeSport === 'all') {
      return {
        totalRatings: profile.stats.totalRatings || 0,
        avgRating: profile.stats.avgRating || 0,
        totalPlayerRatings: profile.stats.totalPlayerRatings || 0,
        avgPlayerRating: profile.stats.avgPlayerRating || 0,
        favoriteCompetition: profile.stats.favoriteCompetition || null
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

  const getSelectLabel = (field: string, value: string) => {
    const options = {
      favoriteTennisPlayer: {
        'djokovic': 'Novak Djokovic',
        'nadal': 'Rafael Nadal',
        'federer': 'Roger Federer',
        'alcaraz': 'Carlos Alcaraz',
        'medvedev': 'Daniil Medvedev',
        'swiatek': 'Iga Swiatek',
        'sabalenka': 'Aryna Sabalenka'
      },
      favoriteF1Driver: {
        'verstappen': 'Max Verstappen',
        'hamilton': 'Lewis Hamilton',
        'leclerc': 'Charles Leclerc',
        'norris': 'Lando Norris',
        'russell': 'George Russell',
        'sainz': 'Carlos Sainz'
      },
      watchingHabits: {
        'casual': 'Fan occasionnel',
        'regular': 'Fan régulier',
        'hardcore': 'Fan hardcore',
        'analyst': 'Analyste/Expert'
      }
    }

    return options[field as keyof typeof options]?.[value as keyof any] || value
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Connexion requise</h1>
          <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Profil non trouvé</h1>
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
      <Navbar activeTab="profile" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* 📱 MOBILE OPTIMIZED HEADER PROFIL */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200 dark:border-slate-700">
          {/* Background gradient - réduit sur mobile */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-16 md:h-32 relative">
            {/* 📱 Menu actions - Optimisé mobile */}
            {isOwnProfile && (
              <div className="absolute top-2 md:top-4 right-2 md:right-4">
                {/* 📱 Version mobile avec menu dropdown */}
                <div className="md:hidden relative">
                  <button 
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                    title="Options"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown menu mobile */}
                  {showMobileMenu && (
                    <>
                      {/* Overlay pour fermer */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowMobileMenu(false)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-20 min-w-48 overflow-hidden">
                        <div className="py-1">
                          <button 
                            onClick={() => {
                              setShowMobileMenu(false)
                              setShowEnhancedEditor(true)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left text-sm"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                            <span>Modifier le profil</span>
                          </button>
                          <button 
                            onClick={() => {
                              setShowMobileMenu(false)
                              fetchProfile()
                              fetchTeams()
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-left text-sm"
                          >
                            <Activity className="w-4 h-4 text-green-600" />
                            <span>Actualiser</span>
                          </button>
                          <button 
                            onClick={() => {
                              setShowMobileMenu(false)
                              setShowEnhancedEditor(true)
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors text-left text-sm"
                          >
                            <Settings className="w-4 h-4 text-purple-600" />
                            <span>Paramètres</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* 🖥️ Version desktop */}
                <div className="hidden md:flex space-x-2">
                  <button 
                    onClick={() => {
                      fetchProfile()
                      fetchTeams()
                    }}
                    className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                    title="Actualiser les données"
                  >
                    <Activity className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowEnhancedEditor(true)}
                    className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                    title="Paramètres du profil"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative px-4 md:px-8 pb-4 md:pb-8">
            {/* 📱 Layout repensé pour mobile */}
            <div className="-mt-8 md:-mt-16">
              {/* Avatar + Nom - Layout mobile-first */}
              <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-6">
                {/* Avatar centré sur mobile */}
                <div className="flex justify-center md:justify-start">
                  <AvatarUpload
                    currentImage={profile.user.image}
                    userName={profile.user.name || profile.user.username || 'User'}
                    onImageChange={handleAvatarChange}
                    size="lg"
                  />
                </div>
                
                {/* Infos utilisateur */}
                <div className="flex-1 text-center md:text-left md:pt-4">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {profile.user.name || profile.user.username}
                    </h1>
                    {profile.user.username && profile.user.name && (
                      <p className="text-gray-600 dark:text-gray-400">@{profile.user.username}</p>
                    )}
                  </div>
                  
                  {/* 📱 Bouton d'action mobile plus discret */}
                  {isOwnProfile && (
                    <div className="md:hidden">
                      <button
                        onClick={() => setShowEnhancedEditor(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  )}
                  
                  {/* 🖥️ Bouton desktop */}
                  {isOwnProfile && (
                    <div className="hidden md:flex items-center justify-end">
                      <button
                        onClick={() => setShowEnhancedEditor(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Personnaliser</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 📱 Infos compactes sur mobile */}
              <div className="mt-6 space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                {/* Bio et métadonnées */}
                <div className="space-y-3 md:col-span-1">
                  {profile.user.bio && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Bio</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{profile.user.bio}</p>
                    </div>
                  )}
                  
                  {/* Métadonnées en liste compacte mobile */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {profile.user.location && profile.user.visibility?.location !== false && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{profile.user.location}</span>
                      </div>
                    )}
                    
                    {profile.user.age && profile.user.visibility?.age && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{profile.user.age} ans</span>
                      </div>
                    )}
                    
                    {profile.user.occupation && profile.user.visibility?.occupation && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{profile.user.occupation}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Depuis {new Date(profile.user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Préférences personnelles compactes */}
                  {(() => {
                    const userData = getMergedUserData()
                    const personalInfo = []
                    
                    if (userData?.favoriteClub && userData?.visibility?.favoriteClub !== false) {
                      personalInfo.push({ icon: '⚽', text: userData.favoriteClub })
                    }
                    if (userData?.favoriteBasketballTeam && userData?.visibility?.favoriteBasketballTeam !== false) {
                      personalInfo.push({ icon: '🏀', text: userData.favoriteBasketballTeam })
                    }
                    if (userData?.favoriteTennisPlayer && userData?.visibility?.favoriteTennisPlayer !== false) {
                      personalInfo.push({ icon: '🎾', text: getSelectLabel('favoriteTennisPlayer', userData.favoriteTennisPlayer) })
                    }
                    if (userData?.favoriteF1Driver && userData?.visibility?.favoriteF1Driver !== false) {
                      personalInfo.push({ icon: '🏎️', text: getSelectLabel('favoriteF1Driver', userData.favoriteF1Driver) })
                    }
                    
                    if (personalInfo.length > 0) {
                      return (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">Préférences</h4>
                          <div className="flex flex-wrap gap-2">
                            {personalInfo.slice(0, 3).map((info, index) => (
                              <div key={index} className="inline-flex items-center space-x-1 bg-gray-100 dark:bg-slate-700 rounded-full px-2 py-1 text-xs">
                                <span>{info.icon}</span>
                                <span className="text-gray-800 dark:text-gray-200 max-w-20 truncate">{info.text}</span>
                              </div>
                            ))}
                            {personalInfo.length > 3 && (
                              <div className="inline-flex items-center px-2 py-1 bg-gray-50 dark:bg-slate-600 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                +{personalInfo.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
                
                {/* 📱 Stats en grille compacte mobile */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">{profile?.stats?.totalRatings || 0}</div>
                      <div className="text-xs md:text-sm text-blue-700 dark:text-blue-300">Notes</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {profile?.stats?.avgRating > 0 ? profile.stats.avgRating.toFixed(1) : '—'}
                      </div>
                      <div className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">Moyenne</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">{profile?.stats?.totalFriends || 0}</div>
                      <div className="text-xs md:text-sm text-green-700 dark:text-green-300">Amis</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">{teams.length}</div>
                      <div className="text-xs md:text-sm text-purple-700 dark:text-purple-300">Équipes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📱 Filtres par sport - Version mobile optimisée */}
        {profile && profile.stats && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-2 md:space-y-0">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Filter className="w-4 md:w-5 h-4 md:h-5" />
                <span>Filtrer par sport</span>
              </h3>
              {currentStats && (
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {currentStats.totalRatings} notes • Moyenne: {currentStats.avgRating.toFixed(1)}/5
                </div>
              )}
            </div>
            
            {/* 📱 Sports en scrolling horizontal sur mobile */}
            <div className="md:flex md:flex-wrap md:gap-2">
              <div className="flex md:hidden overflow-x-auto space-x-3 pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setActiveSport(sport.id as any)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeSport === sport.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{sport.emoji}</span>
                    <span className="font-medium text-sm">{sport.name}</span>
                    {profile.stats.statsBySport?.[sport.id] && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeSport === sport.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'
                      }`}>
                        {sport.id === 'all' 
                          ? profile.stats.totalRatings || 0
                          : profile.stats.statsBySport[sport.id]?.totalRatings || 0
                        }
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Desktop version */}
              <div className="hidden md:flex md:flex-wrap md:gap-2">
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
                          ? profile.stats.totalRatings || 0
                          : profile.stats.statsBySport[sport.id]?.totalRatings || 0
                        }
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 📱 Tabs - Version mobile avec scrolling horizontal */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-slate-700">
            {/* 📱 Mobile tabs avec scroll horizontal */}
            <div className="md:hidden">
              <div className="flex overflow-x-auto px-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {[
                  { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
                  { id: 'ratings', label: 'Notes matchs', icon: Star },
                  { id: 'player-ratings', label: 'Notes joueurs', icon: Users },
                  { id: 'teams', label: 'Équipes', icon: Heart },
                  { id: 'stats', label: 'Stats', icon: BarChart3 }
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
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
            
            {/* 🖥️ Desktop tabs */}
            <div className="hidden md:flex space-x-8 px-6">
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

          {/* Content des tabs */}
          <div className="p-4 md:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8">
                {/* Stats par sport actuel */}
                {currentStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 md:p-6 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3 mb-3 md:mb-4">
                        <Trophy className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
                        <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm md:text-base">
                          {activeSport === 'all' ? 'Tous sports' : sports.find(s => s.id === activeSport)?.name}
                        </h3>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                        {currentStats.totalRatings} notes
                      </div>
                      <div className="text-xs md:text-sm text-green-600 dark:text-green-400">
                        Moyenne: {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : '—'}/5
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 md:p-6 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-3 mb-3 md:mb-4">
                        <Users className="w-5 md:w-6 h-5 md:h-6 text-purple-600" />
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm md:text-base">Notes joueurs</h3>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                        {currentStats.totalPlayerRatings || 0}
                      </div>
                      <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
                        Moyenne: {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}/10
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 md:p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3 mb-3 md:mb-4">
                        <Award className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm md:text-base">Compétition préférée</h3>
                      </div>
                      <div className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-300">
                        {currentStats.favoriteCompetition || 'Aucune'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top matchs notés */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Award className="w-4 md:w-5 h-4 md:h-5 text-yellow-500" />
                    <span>Meilleurs matchs notés {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}</span>
                  </h3>
                  
                  {(() => {
                    const filteredMatches = getFilteredRatings(profile?.stats?.topMatches || [])
                    return filteredMatches.length > 0 ? (
                      <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                        {filteredMatches.slice(0, 4).map((rating: any, index: number) => (
                          <Link
                            key={index}
                            href={`/match/${rating.match.id}`}
                            className="block bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-3 md:p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 md:w-4 h-3 md:h-4 ${
                                      i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                <Eye className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                                <span className="text-xs md:text-sm">Voir</span>
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm md:text-base line-clamp-1">
                              {rating.match.homeTeam} vs {rating.match.awayTeam}
                            </h4>
                            <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              <span className="truncate">{rating.match.competition}</span>
                              <span>{new Date(rating.match.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {rating.comment && (
                              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-2 italic line-clamp-1">"{rating.comment}"</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Star className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm md:text-base">
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
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                    Notes de matchs ({getFilteredRatings(profile.recentRatings || []).length})
                    {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
                  </h3>
                </div>

                {(() => {
                  const filteredRatings = getFilteredRatings(profile.recentRatings || [])
                  return filteredRatings.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {filteredRatings.map((rating: any) => (
                        <Link
                          key={rating.id}
                          href={`/match/${rating.match.id}`}
                          className="block bg-gray-50 dark:bg-slate-700 rounded-xl p-4 md:p-6 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                                <span className="text-xs md:text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                  {rating.match.competition}
                                </span>
                                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                  <ArrowRight className="w-3 md:w-4 h-3 md:h-4 ml-2" />
                                </div>
                              </div>
                              <h4 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                              </h4>
                              {rating.match.venue && (
                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 flex items-center mb-3">
                                  <MapPin className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                                  <span className="truncate">{rating.match.venue}</span>
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex space-x-1 mb-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 md:w-5 h-4 md:h-5 ${
                                      i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                {rating.rating}/5
                              </div>
                            </div>
                          </div>
                          
                          {rating.comment && (
                            <div className="bg-white dark:bg-slate-600 rounded-lg p-3 md:p-4 border-l-4 border-blue-500">
                              <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 italic line-clamp-2">"{rating.comment}"</p>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <Star className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune note</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile 
                          ? `Vous n'avez pas encore noté d'événements${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                          : `Cet utilisateur n'a pas encore noté d'événements${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                        }
                      </p>
                      {isOwnProfile && (
                        <Link
                          href="/"
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base"
                        >
                          Découvrir des événements à noter →
                        </Link>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Player Ratings Tab */}
            {activeTab === 'player-ratings' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Users className="w-4 md:w-5 h-4 md:h-5 text-purple-500" />
                    <span>
                      Notations de joueurs ({getFilteredRatings(profile.recentPlayerRatings || []).length})
                      {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
                    </span>
                  </h3>
                </div>

                {(() => {
                  const filteredPlayerRatings = getFilteredRatings(profile.recentPlayerRatings || [])
                  return filteredPlayerRatings.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {filteredPlayerRatings.map((rating: any) => (
                        <Link
                          key={rating.id}
                          href={`/match/${rating.match.id}`}
                          className="block bg-white dark:bg-slate-700 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                                <span className="text-xs md:text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                  {rating.match.competition}
                                </span>
                                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                                <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                  <ArrowRight className="w-3 md:w-4 h-3 md:h-4 ml-2" />
                                </div>
                              </div>
                              <h4 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                              </h4>
                              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                📅 {new Date(rating.match.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 md:p-4 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 md:w-10 h-8 md:h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                                  {rating.player.number || '⚽'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-semibold text-purple-900 dark:text-purple-100 text-sm md:text-base truncate">{rating.player.name}</h5>
                                  <p className="text-xs md:text-sm text-purple-700 dark:text-purple-300">{rating.player.position || 'Joueur'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl md:text-2xl font-bold text-purple-600">{rating.rating}/10</div>
                                <div className="text-xs md:text-sm text-purple-500">
                                  {rating.rating >= 8 ? '🔥 Excellent' :
                                   rating.rating >= 6 ? '👍 Bon' :
                                   rating.rating >= 4 ? '😐 Correct' :
                                   '👎 Décevant'}
                                </div>
                              </div>
                            </div>
                            
                            {rating.comment && (
                              <div className="bg-white dark:bg-slate-600 bg-opacity-50 rounded-lg p-3">
                                <p className="text-xs md:text-sm text-purple-800 dark:text-purple-200 italic line-clamp-2">"{rating.comment}"</p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <Users className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune notation de joueur</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile 
                          ? `Vous n'avez pas encore noté de joueurs${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                          : `Cet utilisateur n'a pas encore noté de joueurs${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                        }
                      </p>
                      {isOwnProfile && (
                        <div className="space-y-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
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

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                    Équipes et joueurs suivis ({teams.length})
                  </h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowTeamSearch(true)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full md:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Découvrir</span>
                    </button>
                  )}
                </div>

                <EnhancedTeamGrid
                  teams={teams}
                  onTeamToggle={toggleTeamFollow}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6 md:space-y-8">
                {/* Répartition des notes par sport */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-4 md:w-5 h-4 md:h-5 text-blue-500" />
                    <span>Répartition des notes {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}</span>
                  </h3>
                  
                  {(() => {
                    const sportRatings = getFilteredRatings(profile.recentRatings || [])
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
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 md:p-6">
                        <div className="space-y-3 md:space-y-4">
                          {distribution.filter(d => d.count > 0).map((dist: any) => (
                            <div key={dist.rating} className="flex items-center space-x-3 md:space-x-4">
                              <div className="flex items-center space-x-2 w-16 md:w-20">
                                <div className="flex space-x-1">
                                  {Array.from({ length: dist.rating }, (_, i) => (
                                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                  ))}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-200 dark:bg-slate-600 rounded-full h-2 md:h-3 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-700"
                                    style={{ width: `${dist.percentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 w-12 md:w-16 text-right">
                                {dist.count} ({dist.percentage.toFixed(1)}%)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <BarChart3 className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm md:text-base">Pas assez de données pour afficher les statistiques</p>
                      </div>
                    )
                  })()}
                </div>

                {/* Autres statistiques par sport */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {currentStats && (
                    <>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 md:p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-3 mb-3 md:mb-4">
                          <Target className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm md:text-base">Note moyenne</h4>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
                          {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : '—'}
                        </div>
                        <div className="text-xs md:text-sm text-green-600 dark:text-green-400 mt-1">sur 5.0</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 md:p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-3 mb-3 md:mb-4">
                          <Activity className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm md:text-base">Total notes</h4>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {currentStats.totalRatings}
                        </div>
                        <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400 mt-1">matchs notés</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 md:p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center space-x-3 mb-3 md:mb-4">
                          <Users className="w-5 md:w-6 h-5 md:h-6 text-purple-600" />
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm md:text-base">Joueurs notés</h4>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-300">
                          {currentStats.totalPlayerRatings || 0}
                        </div>
                        <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400 mt-1">
                          avg: {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}/10
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Compétition préférée pour le sport actuel */}
                {currentStats?.favoriteCompetition && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Compétition préférée {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}
                    </h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 md:p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-6 md:w-8 h-6 md:h-8 text-yellow-600" />
                        <div>
                          <div className="text-lg md:text-xl font-bold text-yellow-800 dark:text-yellow-200">
                            {currentStats.favoriteCompetition}
                          </div>
                          <div className="text-xs md:text-sm text-yellow-600 dark:text-yellow-400">
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

        {/* Zone de danger - Version mobile optimisée */}
        {isOwnProfile && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mt-6 md:mt-8 border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 md:p-6 border-b border-red-200 dark:border-red-800">
              <h3 className="text-base md:text-lg font-semibold text-red-900 dark:text-red-100 flex items-center space-x-2">
                <Shield className="w-4 md:w-5 h-4 md:h-5" />
                <span>Zone de danger</span>
              </h3>
              <p className="text-red-700 dark:text-red-200 mt-2 text-sm md:text-base">
                Actions irréversibles sur votre compte
              </p>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Supprimer mon compte</h4>
                  <div className="text-gray-600 dark:text-gray-400 text-xs md:text-sm space-y-1">
                    <p>Supprime définitivement votre compte et toutes vos données :</p>
                    <ul className="ml-4 list-disc text-xs space-y-1">
                      <li>{profile?.stats?.totalRatings || 0} notes de matchs</li>
                      <li>{profile?.stats?.totalPlayerRatings || 0} notes de joueurs</li>
                      <li>{profile?.stats?.totalFriends || 0} relations d'amitié</li>
                      <li>{teams.length} équipes suivies</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm md:text-base w-full md:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <TeamSearchModal
        isOpen={showTeamSearch}
        onClose={() => setShowTeamSearch(false)}
        onTeamToggle={toggleTeamFollow}
        followedTeams={teams}
      />

      <EnhancedProfileEditor
        isOpen={showEnhancedEditor}
        onClose={() => setShowEnhancedEditor(false)}
        onSave={saveEnhancedProfile}
        initialData={profile?.user || {}}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userHasPassword={userHasPassword}
        userEmail={profile?.user?.email || ''}
      />

      {/* CSS pour masquer la scrollbar */}
      <style jsx>{`
        .flex.overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        .flex.overflow-x-auto {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}