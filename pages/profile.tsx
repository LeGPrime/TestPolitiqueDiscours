// ==========================================
// IMPORTS
// ==========================================
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Trophy, Search, Users, Star, Calendar, MapPin, 
  Edit3, Settings, BarChart3, TrendingUp, Heart, UserPlus,
  Activity, Award, Target, Zap, Globe, Mail, Shield,
  Plus, X, Check, Camera, Upload, Save, Eye, ArrowRight,
  Gamepad2, BarChart, PieChart, Filter, Trash2, ChevronDown,
  MoreHorizontal, Edit, Menu, BookmarkPlus, Flame, Crown,
  Sparkles, Timer, ChevronRight, Share2, Bookmark, Grid3X3,
  List, TrendingDown, Clock, Medal, Hexagon, User
} from 'lucide-react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import Navbar from '../components/Navbar'
import TeamSearchModal from '../components/TeamSearchModal'
import EnhancedProfileEditor from '../components/EnhancedProfileEditor'
import EnhancedTeamGrid from '../components/EnhancedTeamGrid'
import AvatarUpload from '../components/AvatarUpload'
import DeleteAccountModal from '../components/DeleteAccountModal'
import MatchListsSection from '../components/MatchListsSection'
import ProfileSettingsSection from '../components/ProfileSettingsSection'

// ==========================================
// INTERFACES ET TYPES
// ==========================================
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

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function ModernProfilePage() {
  // ==========================================
  // HOOKS ET VARIABLES
  // ==========================================
  const { data: session } = useSession()
  const router = useRouter()
  const { userId } = router.query
  
  // États du profil et données
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  
  // États de navigation et affichage
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'player-ratings' | 'teams' | 'lists' | 'stats'>('overview')
  const [activeSport, setActiveSport] = useState<'all' | 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // États pour les modals
  const [showTeamSearch, setShowTeamSearch] = useState(false)
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userHasPassword, setUserHasPassword] = useState(false)

  // État temporaire pour les données avancées
  const [localAdvancedData, setLocalAdvancedData] = useState<any>({})

  // Variables dérivées
  const targetUserId = userId as string || session?.user?.id
  const isOwnProfile = !userId || userId === session?.user?.id

  // ==========================================
  // CONSTANTES ET CONFIGURATION
  // ==========================================
  
  // Sports disponibles avec emojis et couleurs modernisées
  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆', color: 'from-gray-500 to-gray-600', bgGradient: 'from-gray-50 to-gray-100', darkBgGradient: 'from-gray-800 to-gray-900' },
    { id: 'football', name: 'Football', emoji: '⚽', color: 'from-green-500 to-emerald-600', bgGradient: 'from-green-50 to-emerald-100', darkBgGradient: 'from-green-900/20 to-emerald-900/20' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: 'from-orange-500 to-red-600', bgGradient: 'from-orange-50 to-red-100', darkBgGradient: 'from-orange-900/20 to-red-900/20' },
    { id: 'mma', name: 'MMA', emoji: '🥊', color: 'from-red-500 to-pink-600', bgGradient: 'from-red-50 to-pink-100', darkBgGradient: 'from-red-900/20 to-pink-900/20' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: 'from-purple-500 to-indigo-600', bgGradient: 'from-purple-50 to-indigo-100', darkBgGradient: 'from-purple-900/20 to-indigo-900/20' },
    { id: 'f1', name: 'F1', emoji: '🏎️', color: 'from-blue-500 to-cyan-600', bgGradient: 'from-blue-50 to-cyan-100', darkBgGradient: 'from-blue-900/20 to-cyan-900/20' }
  ]

  // ==========================================
  // FONCTIONS UTILITAIRES
  // ==========================================

  // Fonction helper pour les labels des sélections
  const getSelectLabel = (field: string, value: string) => {
    const options = {
      favoriteTennisPlayer: {
        // Joueurs actuels
        'djokovic': 'Novak Djokovic',
        'alcaraz': 'Carlos Alcaraz',
        'medvedev': 'Daniil Medvedev',
        'tsitsipas': 'Stefanos Tsitsipas',
        'zverev': 'Alexander Zverev',
        'rublev': 'Andrey Rublev',
        'sinner': 'Jannik Sinner',
        'fritz': 'Taylor Fritz',
        'auger-aliassime': 'Félix Auger-Aliassime',
        'tiafoe': 'Frances Tiafoe',
        // Légendes
        'nadal': 'Rafael Nadal',
        'federer': 'Roger Federer',
        'murray': 'Andy Murray',
        'wawrinka': 'Stan Wawrinka',
        'gasquet': 'Richard Gasquet',
        'monfils': 'Gaël Monfils',
        // Femmes actuelles
        'swiatek': 'Iga Swiatek',
        'sabalenka': 'Aryna Sabalenka',
        'gauff': 'Coco Gauff',
        'rybakina': 'Elena Rybakina',
        'jabeur': 'Ons Jabeur',
        'pegula': 'Jessica Pegula',
        'garcia': 'Caroline Garcia',
        // Légendes féminines
        'serena': 'Serena Williams',
        'venus': 'Venus Williams',
        'sharapova': 'Maria Sharapova',
        'henin': 'Justine Henin',
        'mauresmo': 'Amélie Mauresmo'
      },
      favoriteF1Driver: {
        // Pilotes actuels
        'verstappen': 'Max Verstappen',
        'hamilton': 'Lewis Hamilton',
        'leclerc': 'Charles Leclerc',
        'norris': 'Lando Norris',
        'russell': 'George Russell',
        'sainz': 'Carlos Sainz Jr.',
        'perez': 'Sergio Pérez',
        'alonso': 'Fernando Alonso',
        'ocon': 'Esteban Ocon',
        'gasly': 'Pierre Gasly',
        'stroll': 'Lance Stroll',
        'tsunoda': 'Yuki Tsunoda',
        'albon': 'Alexander Albon',
        'bottas': 'Valtteri Bottas',
        'zhou': 'Zhou Guanyu',
        // Légendes
        'schumacher': 'Michael Schumacher',
        'senna': 'Ayrton Senna',
        'prost': 'Alain Prost',
        'vettel': 'Sebastian Vettel',
        'raikkonen': 'Kimi Räikkönen',
        'button': 'Jenson Button',
        'rosberg': 'Nico Rosberg',
        'massa': 'Felipe Massa',
        'webber': 'Mark Webber',
        'ricciardo': 'Daniel Ricciardo'
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

  // Fonction pour merger les données DB + local
  const getMergedUserData = () => {
    if (!profile?.user) return null
    return {
      ...profile.user,
      ...localAdvancedData,
    }
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

  const getGradeFromRating = (rating: number) => {
    if (rating >= 4.5) return { grade: 'S', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300' }
    if (rating >= 4.0) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300' }
    if (rating >= 3.5) return { grade: 'A', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300' }
    if (rating >= 3.0) return { grade: 'B+', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300' }
    if (rating >= 2.5) return { grade: 'B', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300' }
    return { grade: 'C', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300' }
  }

  // ==========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ==========================================

  const handleTabChange = (newTab: any) => {
    // Empêcher le scroll vers le haut
    const currentScrollPos = window.pageYOffset
    setActiveTab(newTab)
    
    // Maintenir la position de scroll
    setTimeout(() => {
      window.scrollTo(0, currentScrollPos)
    }, 0)
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

  // ==========================================
  // FONCTIONS API
  // ==========================================

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

  // ==========================================
  // EFFETS (useEffect)
  // ==========================================

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

  // ==========================================
  // RENDU DES COMPOSANTS DE GARDE
  // ==========================================

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

  // ==========================================
  // VARIABLES CALCULÉES POUR LE RENDU
  // ==========================================
  const currentStats = getStatsForActiveSport()
  const grade = getGradeFromRating(profile.stats.avgRating)

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <Navbar activeTab="profile" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* 🎨 HEADER MOBILE ULTRA MODERNE */}
        <div className="relative overflow-hidden rounded-3xl mb-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl">
          {/* Background subtil avec motifs géométriques */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 opacity-50" />
          
          {/* Motifs géométriques plus subtils */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-blue-500 blur-xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-purple-500 blur-lg" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rotate-45 bg-pink-500 rounded-lg blur-md" />
          </div>

          <div className="relative">
            {/* Header avec actions en mobile */}
            {isOwnProfile && (
              <div className="flex items-center justify-end p-4 space-x-2">
                {/* Bouton Settings compact */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl text-gray-600 dark:text-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
                  title="Paramètres"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Bouton Amis compact */}
                <Link
                  href="/friends"
                  className="p-2.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400 transition-all duration-300 shadow-md hover:shadow-lg"
                  title="Amis"
                >
                  <Users className="w-4 h-4" />
                </Link>

                {/* Bouton Éditer compact */}
                <button 
                  onClick={() => setShowEnhancedEditor(true)}
                  className="p-2.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400 transition-all duration-300 shadow-md hover:shadow-lg"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="px-6 pb-6">
              {/* Avatar et infos principales - Design mobile optimisé */}
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar plus petit et élégant */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    {isOwnProfile ? (
                      <AvatarUpload
                        currentImage={profile.user.image}
                        userName={profile.user.name || profile.user.username || 'User'}
                        onImageChange={handleAvatarChange}
                        size="lg" // Taille réduite pour mobile
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-lg">
                        {profile.user.image ? (
                          <img 
                            src={profile.user.image} 
                            alt={profile.user.name || profile.user.username || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                            {(profile.user.name || profile.user.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Badge de statut plus petit */}
                  <div className="absolute -bottom-1 -right-1 bg-green-500 border-3 border-white dark:border-slate-800 rounded-full w-5 h-5 shadow-lg" />
                </div>
                
                {/* Nom et username */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile.user.name || profile.user.username}
                  </h1>
                  {profile.user.username && profile.user.name && (
                    <p className="text-gray-600 dark:text-gray-400 text-base font-medium">@{profile.user.username}</p>
                  )}
                </div>

                {/* Bio */}
                {profile.user.bio && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-w-xs">{profile.user.bio}</p>
                )}

                {/* Métadonnées compactes */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  {profile.user.location && profile.user.visibility?.location !== false && (
                    <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 rounded-full px-2 py-1 border border-blue-200 dark:border-blue-800">
                      <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-800 dark:text-blue-200">{profile.user.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-700 rounded-full px-2 py-1 border border-gray-200 dark:border-slate-600">
                    <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200">Depuis {new Date(profile.user.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                  </div>

                  {profile.stats.recentActivity > 0 && (
                    <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 rounded-full px-2 py-1 border border-orange-200 dark:border-orange-800">
                      <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                      <span className="text-orange-800 dark:text-orange-200">Actif</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NOUVELLES INFORMATIONS DU PROFIL VISIBLE */}
              {(() => {
                const userData = getMergedUserData() || profile.user
                const visibleInfo = []

                // Age
                if (userData.age && userData.visibility?.age !== false) {
                  visibleInfo.push({
                    icon: <Calendar className="w-4 h-4" />,
                    label: `${userData.age} ans`,
                    color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  })
                }

                // Profession
                if (userData.occupation && userData.visibility?.occupation !== false) {
                  visibleInfo.push({
                    icon: <User className="w-4 h-4" />,
                    label: userData.occupation,
                    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  })
                }

                // Équipe de foot favorite
                if (userData.favoriteClub && userData.visibility?.favoriteClub !== false) {
                  visibleInfo.push({
                    icon: <span className="text-sm">⚽</span>,
                    label: userData.favoriteClub,
                    color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                  })
                }

                // Équipe de basket favorite
                if (userData.favoriteBasketballTeam && userData.visibility?.favoriteBasketballTeam !== false) {
                  visibleInfo.push({
                    icon: <span className="text-sm">🏀</span>,
                    label: userData.favoriteBasketballTeam,
                    color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                  })
                }

                // Tennisman préféré
                if (userData.favoriteTennisPlayer && userData.visibility?.favoriteTennisPlayer !== false) {
                  const tennisLabel = getSelectLabel('favoriteTennisPlayer', userData.favoriteTennisPlayer)
                  visibleInfo.push({
                    icon: <span className="text-sm">🎾</span>,
                    label: tennisLabel,
                    color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                  })
                }

                // Pilote F1 préféré
                if (userData.favoriteF1Driver && userData.visibility?.favoriteF1Driver !== false) {
                  const f1Label = getSelectLabel('favoriteF1Driver', userData.favoriteF1Driver)
                  visibleInfo.push({
                    icon: <span className="text-sm">🏎️</span>,
                    label: f1Label,
                    color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  })
                }

                // Sports préférés
                if (userData.preferredSports && userData.preferredSports.length > 0) {
                  const sportsLabels = userData.preferredSports.map((sport: string) => {
                    const sportOptions = {
                      'football': '⚽ Football',
                      'basketball': '🏀 Basketball', 
                      'tennis': '🎾 Tennis',
                      'f1': '🏎️ Formule 1',
                      'mma': '🥊 MMA',
                      'rugby': '🏉 Rugby'
                    }
                    return sportOptions[sport as keyof typeof sportOptions] || sport
                  }).slice(0, 3) // Limite à 3 pour éviter de surcharger

                  visibleInfo.push({
                    icon: <Trophy className="w-4 h-4" />,
                    label: sportsLabels.join(', ') + (userData.preferredSports.length > 3 ? '...' : ''),
                    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  })
                }

                // Habitudes de visionnage
                if (userData.watchingHabits) {
                  const habitsLabel = getSelectLabel('watchingHabits', userData.watchingHabits)
                  visibleInfo.push({
                    icon: <span className="text-sm">📺</span>,
                    label: habitsLabel,
                    color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                  })
                }

                // Langues parlées
                if (userData.languages && userData.languages.length > 0) {
                  const languagesLabels = userData.languages.map((lang: string) => {
                    const langOptions = {
                      'fr': '🇫🇷 FR',
                      'en': '🇺🇸 EN',
                      'es': '🇪🇸 ES',
                      'de': '🇩🇪 DE',
                      'it': '🇮🇹 IT',
                      'pt': '🇵🇹 PT'
                    }
                    return langOptions[lang as keyof typeof langOptions] || lang
                  }).slice(0, 4) // Limite à 4 langues

                  visibleInfo.push({
                    icon: <Globe className="w-4 h-4" />,
                    label: languagesLabels.join(' '),
                    color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                  })
                }

                return visibleInfo.length > 0 ? (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                      {visibleInfo.map((info, index) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border ${info.color} transition-all duration-300 hover:scale-105`}
                        >
                          {info.icon}
                          <span className="font-medium">{info.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {/* Stats rapides modernisées - Plus compactes pour mobile */}
              <div className="grid grid-cols-4 gap-3 mt-6">
                <button
                  onClick={() => setActiveTab('ratings')}
                  className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-md rounded-xl p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 border border-blue-200 dark:border-blue-800 group"
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform">
                      {profile.stats.totalRatings}
                    </div>
                    <div className="text-blue-800 dark:text-blue-200 text-xs font-medium">Notes</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className="bg-yellow-50 dark:bg-yellow-900/20 backdrop-blur-md rounded-xl p-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-300 border border-yellow-200 dark:border-yellow-800 group"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${grade.bg} ${grade.border} border-2 group-hover:scale-110 transition-transform`}>
                        <span className={`text-xs font-bold ${grade.color}`}>{grade.grade}</span>
                      </div>
                    </div>
                    <div className="text-yellow-800 dark:text-yellow-200 text-xs font-medium">
                      {profile.stats.avgRating > 0 ? profile.stats.avgRating.toFixed(1) : '—'}
                    </div>
                  </div>
                </button>

                <Link
                  href="/friends"
                  className="bg-green-50 dark:bg-green-900/20 backdrop-blur-md rounded-xl p-3 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-300 border border-green-200 dark:border-green-800 group block"
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1 group-hover:scale-110 transition-transform">
                      {profile.stats.totalFriends}
                    </div>
                    <div className="text-green-800 dark:text-green-200 text-xs font-medium">Amis</div>
                  </div>
                </Link>

                <button
                  onClick={() => setActiveTab('teams')}
                  className="bg-purple-50 dark:bg-purple-900/20 backdrop-blur-md rounded-xl p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-300 border border-purple-200 dark:border-purple-800 group"
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1 group-hover:scale-110 transition-transform">
                      {teams.length}
                    </div>
                    <div className="text-purple-800 dark:text-purple-200 text-xs font-medium">Équipes</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 FILTRES SPORTS MODERNISÉS */}
        {profile && profile.stats && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <span>Filtrer par sport</span>
              </h3>
              {currentStats && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-full px-4 py-2 border border-gray-200 dark:border-slate-700">
                  {currentStats.totalRatings} notes • Moyenne: {currentStats.avgRating.toFixed(1)}/5
                </div>
              )}
            </div>
            
            {/* Sports en pills horizontales avec gradients */}
            <div className="flex overflow-x-auto space-x-3 pb-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {sports.map((sport) => {
                const isActive = activeSport === sport.id
                const sportStats = sport.id === 'all' 
                  ? profile.stats.totalRatings 
                  : profile.stats.statsBySport?.[sport.id]?.totalRatings || 0
                
                return (
                  <button
                    key={sport.id}
                    onClick={() => setActiveSport(sport.id as any)}
                    className={`flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all duration-300 whitespace-nowrap flex-shrink-0 min-w-fit transform hover:scale-105 ${
                      isActive
                        ? `bg-gradient-to-r ${sport.color} text-white shadow-xl shadow-blue-500/25`
                        : `bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:${sport.bgGradient} dark:hover:${sport.darkBgGradient} border border-gray-200 dark:border-slate-600 hover:border-transparent shadow-lg hover:shadow-xl`
                    }`}
                  >
                    <span className="text-2xl">{sport.emoji}</span>
                    <div className="text-left">
                      <div className="font-bold text-base">{sport.name}</div>
                      {sportStats > 0 && (
                        <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                          {sportStats} note{sportStats > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 📱 TABS MODERNISÉS AVEC STYLE SEGMENTED CONTROL */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700">
          {/* Tab Navigation avec scroll prevention */}
          <div className="p-2 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex overflow-x-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: Sparkles, color: 'from-blue-500 to-purple-600' },
                { id: 'ratings', label: 'Notes matchs', icon: Star, color: 'from-yellow-500 to-orange-600' },
                { id: 'player-ratings', label: 'Notes joueurs', icon: Users, color: 'from-green-500 to-emerald-600' },
                { id: 'teams', label: 'Équipes', icon: Heart, color: 'from-red-500 to-pink-600' },
                { id: 'lists', label: 'Mes listes', icon: BookmarkPlus, color: 'from-purple-500 to-indigo-600' },
                { id: 'stats', label: 'Stats', icon: BarChart3, color: 'from-cyan-500 to-blue-600' }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={(e) => {
                      e.preventDefault()
                      handleTabChange(tab.id as any)
                    }}
                    className={`flex items-center space-x-2 py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 rounded-2xl'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content des tabs avec scroll prevention */}
          <div className="p-6"
            onScroll={(e) => {
              // Empêcher le scroll vers le haut lors du changement d'onglet
              e.preventDefault()
            }}
          >
            {/* 🌟 OVERVIEW TAB MODERNISÉ */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Stats principales avec design card moderne */}
                {currentStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100">
                          {activeSport === 'all' ? 'Tous sports' : sports.find(s => s.id === activeSport)?.name}
                        </h3>
                      </div>
                      <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                        {currentStats.totalRatings} notes
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                        <span>Moyenne: {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : '—'}/5</span>
                        {currentStats.avgRating >= 4 && <Flame className="w-4 h-4 text-orange-500" />}
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-purple-900 dark:text-purple-100">Notes joueurs</h3>
                      </div>
                      <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
                        {currentStats.totalPlayerRatings || 0}
                      </div>
                      <div className="text-purple-600 dark:text-purple-400">
                        Moyenne: {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}/10
                      </div>
                    </div>

                    <div className="group bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">Compétition préférée</h3>
                      </div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {currentStats.favoriteCompetition || 'Aucune'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top matchs avec design modernisé */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <span>Meilleurs matchs notés</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {(() => {
                    const filteredMatches = getFilteredRatings(profile?.stats?.topMatches || [])
                    return filteredMatches.length > 0 ? (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                        {filteredMatches.slice(0, 6).map((rating: any, index: number) => (
                          <Link
                            key={index}
                            href={`/match/${rating.match.id}`}
                            className="group block bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl p-6 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <div className="flex items-center text-blue-600 group-hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                            </h4>
                            {rating.match.venue && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-3">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{rating.match.venue}</span>
                              </p>
                            )}
                            <div className="text-right ml-4">
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
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {rating.rating}/5
                              </div>
                            </div>
                            
                            {rating.comment && (
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-l-4 border-blue-500 mt-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{rating.comment}"</p>
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="w-8 h-8 text-gray-400" />
                        </div>
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
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <span>Découvrir des événements à noter</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

           {/* RATINGS TAB */}
            {activeTab === 'ratings' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <span>
                      Notes de matchs ({getFilteredRatings(profile.recentRatings || []).length})
                      {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
                    </span>
                  </h3>
                </div>

                {(() => {
                  const filteredRatings = getFilteredRatings(profile.recentRatings || [])
                  return filteredRatings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredRatings.map((rating: any) => (
                        <Link
                          key={rating.id}
                          href={`/match/${rating.match.id}`}
                          className="group block bg-white dark:bg-slate-700 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-600 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                  {rating.match.competition}
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span>{new Date(rating.createdAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="flex items-center text-blue-600 group-hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-all">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                📅 {new Date(rating.match.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right ml-4">
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
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {rating.rating}/5
                              </div>
                            </div>
                          </div>

                          {rating.comment && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border-l-4 border-blue-500">
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{rating.comment}"</p>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun match noté</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile 
                          ? `Vous n'avez pas encore noté d'événements${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                          : `Cet utilisateur n'a pas encore noté d'événements${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                        }
                      </p>
                      {isOwnProfile && (
                        <Link
                          href="/"
                          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <span>Découvrir des événements à noter</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* PLAYER RATINGS TAB */}
            {activeTab === 'player-ratings' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <span>
                      Notations de joueurs ({getFilteredRatings(profile.recentPlayerRatings || []).length})
                      {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
                    </span>
                  </h3>
                </div>

                {(() => {
                  const filteredPlayerRatings = getFilteredRatings(profile.recentPlayerRatings || [])
                  return filteredPlayerRatings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredPlayerRatings.map((rating: any) => (
                        <Link
                          key={rating.id}
                          href={`/match/${rating.match.id}`}
                          className="group block bg-white dark:bg-slate-700 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-600 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                  {rating.match.competition}
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span>{new Date(rating.createdAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="flex items-center text-purple-600 group-hover:text-purple-700 opacity-0 group-hover:opacity-100 transition-all">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {rating.match.homeTeam} {rating.match.homeScore ?? '?'} - {rating.match.awayScore ?? '?'} {rating.match.awayTeam}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                📅 {new Date(rating.match.date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                  {rating.player.number || '⚽'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-purple-900 dark:text-purple-100 text-base">{rating.player.name}</h5>
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
                              <div className="bg-white dark:bg-slate-600 bg-opacity-70 rounded-xl p-3 mt-3">
                                <p className="text-sm text-purple-800 dark:text-purple-200 italic">"{rating.comment}"</p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune notation de joueur</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile 
                          ? `Vous n'avez pas encore noté de joueurs${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                          : `Cet utilisateur n'a pas encore noté de joueurs${activeSport !== 'all' ? ` en ${sports.find(s => s.id === activeSport)?.name}` : ''}`
                        }
                      </p>
                      {isOwnProfile && (
                        <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                          <p className="flex items-center justify-center space-x-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Pour noter des joueurs :</span>
                          </p>
                          <div className="space-y-1">
                            <p>1. Allez sur la page d'un match terminé</p>
                            <p>2. Cliquez sur l'onglet "Compositions"</p>
                            <p>3. Cliquez sur un joueur pour le noter</p>
                          </div>
                          <Link
                            href="/"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mt-3"
                          >
                            <span>Découvrir des matchs</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* TEAMS TAB */}
            {activeTab === 'teams' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <span>Équipes et joueurs suivis ({teams.length})</span>
                  </h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowTeamSearch(true)}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="w-5 h-5" />
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

            {/* LISTS TAB */}
            {activeTab === 'lists' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <MatchListsSection 
                  userId={targetUserId}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Répartition des notes par sport avec design moderne */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
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
                      <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-600">
                        <div className="space-y-6">
                          {distribution.filter(d => d.count > 0).reverse().map((dist: any) => (
                            <div key={dist.rating} className="group">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="flex space-x-1">
                                    {Array.from({ length: dist.rating }, (_, i) => (
                                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                  </div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {dist.rating} étoile{dist.rating > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {dist.count} note{dist.count > 1 ? 's' : ''}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {dist.percentage.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                              <div className="relative">
                                <div className="bg-gray-200 dark:bg-slate-600 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                                      dist.rating === 5 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                      dist.rating === 4 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                      dist.rating === 3 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                                      dist.rating === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                                      'bg-gradient-to-r from-red-400 to-pink-500'
                                    } group-hover:shadow-lg`}
                                    style={{ width: `${dist.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pas assez de données</h3>
                        <p className="text-gray-600 dark:text-gray-400">Pas assez de données pour afficher les statistiques</p>
                      </div>
                    )
                  })()}
                </div>

                {/* Statistiques détaillées avec cartes modernes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentStats && (
                    <>
                      <div className="group bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-emerald-900 dark:text-emerald-100">Note moyenne</h4>
                        </div>
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                          {currentStats.avgRating > 0 ? currentStats.avgRating.toFixed(1) : '—'}
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center space-x-2">
                          <span>sur 5.0</span>
                          {currentStats.avgRating >= 4 && <Flame className="w-4 h-4 text-orange-500" />}
                        </div>
                      </div>

                      <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-100">Total notes</h4>
                        </div>
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                          {currentStats.totalRatings}
                        </div>
                        <div className="text-blue-600 dark:text-blue-400 text-sm">matchs notés</div>
                      </div>

                      <div className="group bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-purple-900 dark:text-purple-100">Joueurs notés</h4>
                        </div>
                        <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-2">
                          {currentStats.totalPlayerRatings || 0}
                        </div>
                        <div className="text-purple-600 dark:text-purple-400 text-sm">
                          avg: {currentStats.avgPlayerRating > 0 ? currentStats.avgPlayerRating.toFixed(1) : '—'}/10
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Compétition préférée avec design moderne */}
                {currentStats?.favoriteCompetition && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <span>Compétition préférée {activeSport !== 'all' && `(${sports.find(s => s.id === activeSport)?.name})`}</span>
                    </h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8 border border-yellow-200 dark:border-yellow-800 shadow-lg">
                      <div className="flex items-center space-x-6">
                        <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl shadow-xl">
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                            {currentStats.favoriteCompetition}
                          </div>
                          <div className="text-yellow-600 dark:text-yellow-400 flex items-center space-x-2">
                            <Crown className="w-4 h-4" />
                            <span>La compétition que vous notez le plus {activeSport !== 'all' && `en ${sports.find(s => s.id === activeSport)?.name}`}</span>
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

      

      {/* MODALS */}
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

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center space-x-3">
                <Settings className="w-6 h-6" />
                <span>Paramètres</span>
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <ProfileSettingsSection
                userEmail={profile.user.email}
                onDeleteAccount={handleDeleteAccount}
                userHasPassword={userHasPassword}
              />
            </div>
          </div>
        </div>
      )}

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
        
        @keyframes slide-in-from-bottom-4 {
          from {
            transform: translateY(16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation: slide-in-from-bottom-4 0.5s ease-out;
        }
      `}</style>

      {/* 📱 ESPACE POUR LA NAVIGATION BOTTOM */}
      <div className="h-20 md:h-0"></div>
    </div>
  )
}
