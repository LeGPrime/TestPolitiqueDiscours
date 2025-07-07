// pages/profile.tsx - Version complète avec nouvelles fonctionnalités
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Trophy, Search, Users, LogOut, Star, Calendar, MapPin, 
  Edit3, Settings, BarChart3, TrendingUp, Heart, UserPlus,
  Activity, Award, Target, Zap, Globe, Mail, Shield,
  Plus, X, Check, Camera, Upload, Save, Eye, ArrowRight,
  Gamepad2, BarChart, PieChart, Filter, Trash2
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
    // Stats par sport
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
  
  // Nouveaux états pour les modals
  const [showTeamSearch, setShowTeamSearch] = useState(false)
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false) // Modifié ici
  const [userHasPassword, setUserHasPassword] = useState(false) // Nouveau state

  // État temporaire pour les données avancées
  const [localAdvancedData, setLocalAdvancedData] = useState<any>({})

  const targetUserId = userId as string || session?.user?.id
  const isOwnProfile = !userId || userId === session?.user?.id

  // Fonction pour merger les données DB + local
  const getMergedUserData = () => {
    if (!profile?.user) return null
    
    return {
      ...profile.user,
      ...localAdvancedData, // Priorité aux données locales
    }
  }

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
      console.log('🔄 Rechargement des données pour:', targetUserId)
      fetchProfile()
      fetchTeams()
      if (isOwnProfile) {
        checkUserHasPassword()
      }
    }
  }, [session, targetUserId])

  // Recharger quand on change d'onglet pour avoir les données les plus récentes
  useEffect(() => {
    if (session && targetUserId && profile) {
      console.log('📱 Changement d\'onglet vers:', activeTab)
      
      // Recharger les données seulement si nécessaire
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
      
      // Essayer d'abord l'API de debug pour voir les données
      console.log('🔍 Test API debug...')
      try {
        const debugResponse = await axios.get(`/api/profile/debug?userId=${targetUserId}`)
        console.log('📊 Debug data:', debugResponse.data)
      } catch (error) {
        console.log('⚠️ API debug non disponible')
      }
      
      // Essayer l'API corrigée
      let response
      try {
        console.log('🔄 Tentative API profile/fixed...')
        response = await axios.get(`/api/profile/fixed?userId=${targetUserId}`)
        console.log('✅ Profil chargé depuis API fixed')
      } catch (error) {
        console.log('⚠️ API fixed non disponible, tentative API enhanced...')
        try {
          response = await axios.get(`/api/profile/enhanced?userId=${targetUserId}`)
          console.log('✅ Profil chargé depuis API enhanced')
        } catch (error2) {
          console.log('⚠️ API enhanced non disponible, utilisation API classique')
          response = await axios.get(`/api/profile?userId=${targetUserId}`)
          console.log('✅ Profil chargé depuis API classique')
        }
      }
      
      console.log('📊 Données profil reçues:', response.data)
      console.log('📈 Stats détaillées:', response.data.stats)
      setProfile(response.data)
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      console.log('🔄 Chargement des équipes suivies...')
      const response = await axios.get(`/api/teams?followed=true`)
      console.log('✅ Équipes chargées:', response.data.teams?.length || 0)
      setTeams(response.data.teams || [])
    } catch (error) {
      console.error('❌ Erreur chargement équipes:', error)
      setTeams([])
    }
  }

  // Nouvelle fonction pour vérifier si l'utilisateur a un mot de passe
  const checkUserHasPassword = async () => {
    try {
      const response = await axios.get('/api/profile/check-password')
      setUserHasPassword(response.data.hasPassword)
      console.log('🔒 Utilisateur a un mot de passe:', response.data.hasPassword)
    } catch (error) {
      console.error('Erreur vérification mot de passe:', error)
      setUserHasPassword(false) // Par défaut, assume qu'il n'y a pas de mot de passe
    }
  }

  const saveEnhancedProfile = async (data: any) => {
    try {
      console.log('💾 Sauvegarde profil avec données complètes:', data)
      
      // Essayer d'abord l'API étendue pour toutes les données avancées
      try {
        const response = await axios.put('/api/profile/enhanced', data)
        console.log('✅ Profil sauvegardé via API enhanced:', response.data)
      } catch (error) {
        console.log('⚠️ API enhanced non disponible, sauvegarde partielle via API fixed')
        
        // Fallback : sauvegarder seulement les champs de base via API fixed
        const basicData = {
          name: data.name,
          username: data.username,
          bio: data.bio,
          location: data.location,
          favoriteClub: data.favoriteClub
        }
        
        try {
          const response = await axios.put('/api/profile/fixed', basicData)
          console.log('✅ Profil de base sauvegardé via API fixed:', response.data)
        } catch (error2) {
          // Dernier fallback vers API classique
          const response = await axios.put('/api/profile', basicData)
          console.log('✅ Profil sauvegardé via API classique:', response.data)
        }
        
        // IMPORTANT: Sauvegarder les données avancées localement temporairement
        // jusqu'à ce que l'API enhanced soit disponible
        console.log('⚠️ Données avancées temporairement stockées localement:', {
          favoriteTennisPlayer: data.favoriteTennisPlayer,
          favoriteF1Driver: data.favoriteF1Driver,
          favoriteBasketballTeam: data.favoriteBasketballTeam,
          preferredSports: data.preferredSports,
          languages: data.languages,
          watchingHabits: data.watchingHabits,
          age: data.age,
          occupation: data.occupation,
          visibility: data.visibility
        })
        
        // Mettre à jour le state local avec toutes les données
        if (profile) {
          const mergedData = {
            ...data,
            // S'assurer que les nouvelles données sont bien incluses
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
          
          // Sauvegarder dans le state local temporaire
          setLocalAdvancedData(mergedData)
          
          setProfile(prev => ({
            ...prev!,
            user: {
              ...prev!.user,
              ...mergedData
            }
          }))
          console.log('✅ State local mis à jour avec les données avancées:', mergedData)
        }
      }
      
      // Recharger le profil pour afficher les nouvelles données
      console.log('🔄 Rechargement du profil...')
      await fetchProfile()
      
      // Feedback utilisateur
      console.log('✅ Profil mis à jour avec succès')
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde profil:', error)
      
      // Afficher l'erreur spécifique
      if (error.response?.data?.error) {
        alert(`Erreur: ${error.response.data.error}`)
      } else {
        alert('Erreur lors de la mise à jour du profil')
      }
      
      // Re-lancer l'erreur pour que le modal gère l'état de chargement
      throw error
    }
  }

  const toggleTeamFollow = async (team: Team, isFollowed: boolean) => {
    try {
      console.log('🔄 Toggle team:', team.name, isFollowed ? 'unfollow' : 'follow')
      
      await axios.post('/api/teams', {
        action: isFollowed ? 'unfollow' : 'follow',
        teamId: team.id
      })

      console.log('✅ Action team réussie')

      // Mettre à jour localement
      setTeams(prev => {
        if (!isFollowed && !prev.find(t => t.id === team.id)) {
          // Ajouter à la liste si c'est un nouveau suivi
          return [...prev, { ...team, isFollowed: true, followedSince: new Date().toISOString() }]
        } else if (isFollowed) {
          // Retirer de la liste si on arrête de suivre
          return prev.filter(t => t.id !== team.id)
        } else {
          // Mettre à jour l'état
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

      // Recharger le profil pour mettre à jour les stats
      console.log('🔄 Rechargement profil après modification équipe')
      await fetchProfile()
    } catch (error) {
      console.error('❌ Erreur toggle team:', error)
    }
  }

  const handleAvatarChange = async (imageData: string | null) => {
    try {
      console.log('📸 Sauvegarde avatar...')
      const response = await axios.post('/api/profile/avatar', { imageData })
      console.log('✅ Avatar sauvegardé:', response.data)
      
      // Mettre à jour le state local immédiatement
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

  // Nouvelle fonction pour gérer l'ouverture du modal de suppression
  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
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

  // Fonction pour formater les labels des options select
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

  const getSportEmojis = (sports: string[]) => {
    const sportEmojis = { football: '⚽', basketball: '🏀', tennis: '🎾', f1: '🏎️', mma: '🥊', rugby: '🏉' }
    return sports.map(sport => sportEmojis[sport as keyof typeof sportEmojis]).join(' ')
  }

  const getLanguageFlags = (languages: string[]) => {
    const flags = { fr: '🇫🇷', en: '🇺🇸', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹' }
    return languages.map(lang => flags[lang as keyof typeof flags]).join(' ')
  }

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
      <Navbar activeTab="profile" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Profil */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-32 relative">
            {/* Bouton paramètres et refresh */}
            {isOwnProfile && (
              <div className="absolute top-4 right-4 flex space-x-2">
                <button 
                  onClick={() => {
                    console.log('🔄 Refresh manuel des données')
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
            )}
          </div>
          
          <div className="relative px-8 pb-8">
            {/* Photo de profil avec upload */}
            <div className="flex items-end space-x-6 -mt-16">
              <AvatarUpload
                currentImage={profile.user.image}
                userName={profile.user.name || profile.user.username || 'User'}
                onImageChange={handleAvatarChange}
                size="lg"
              />
              
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
                    <div className="flex items-center space-x-3">
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
            </div>

            {/* Infos utilisateur enrichies */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                {profile.user.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bio</h3>
                    <p className="text-gray-700 dark:text-gray-300">{profile.user.bio}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {profile.user.location && profile.user.visibility?.location !== false && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.user.location}</span>
                    </div>
                  )}
                  
                  {profile.user.age && profile.user.visibility?.age && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{profile.user.age} ans</span>
                    </div>
                  )}
                  
                  {profile.user.occupation && profile.user.visibility?.occupation && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{profile.user.occupation}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Membre depuis {new Date(profile.user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Infos personnelles modernes */}
                {(() => {
                  const userData = getMergedUserData()
                  const personalInfo = []
                  
                  // Construire les infos principales
                  if (userData?.favoriteClub && userData?.visibility?.favoriteClub !== false) {
                    personalInfo.push({ icon: '⚽', text: userData.favoriteClub, category: 'Football' })
                  }
                  if (userData?.favoriteBasketballTeam && userData?.visibility?.favoriteBasketballTeam !== false) {
                    personalInfo.push({ icon: '🏀', text: userData.favoriteBasketballTeam, category: 'Basketball' })
                  }
                  if (userData?.favoriteTennisPlayer && userData?.visibility?.favoriteTennisPlayer !== false) {
                    personalInfo.push({ icon: '🎾', text: getSelectLabel('favoriteTennisPlayer', userData.favoriteTennisPlayer), category: 'Tennis' })
                  }
                  if (userData?.favoriteF1Driver && userData?.visibility?.favoriteF1Driver !== false) {
                    personalInfo.push({ icon: '🏎️', text: getSelectLabel('favoriteF1Driver', userData.favoriteF1Driver), category: 'F1' })
                  }
                  
                  // Infos secondaires
                  const secondaryInfo = []
                  if (userData?.watchingHabits) {
                    secondaryInfo.push({ icon: '📺', text: getSelectLabel('watchingHabits', userData.watchingHabits) })
                  }
                  if (userData?.preferredSports && userData.preferredSports.length > 0) {
                    secondaryInfo.push({ 
                      icon: '🏆', 
                      text: `${userData.preferredSports.length} sport${userData.preferredSports.length > 1 ? 's' : ''}`,
                      detail: userData.preferredSports.map((sport: string) => {
                        const emojis = { football: '⚽', basketball: '🏀', tennis: '🎾', f1: '🏎️', mma: '🥊', rugby: '🏉' }
                        return emojis[sport as keyof typeof emojis]
                      }).join(' ')
                    })
                  }
                  if (userData?.languages && userData.languages.length > 0) {
                    secondaryInfo.push({ 
                      icon: '🗣️', 
                      text: `${userData.languages.length} langue${userData.languages.length > 1 ? 's' : ''}`,
                      detail: userData.languages.map((lang: string) => {
                        const flags = { fr: '🇫🇷', en: '🇺🇸', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹' }
                        return flags[lang as keyof typeof flags]
                      }).join(' ')
                    })
                  }
                  
                  if (personalInfo.length === 0 && secondaryInfo.length === 0) return null
                  
                  return (
                    <div className="space-y-4">
                      {/* Préférences principales */}
                      {personalInfo.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {personalInfo.map((info, index) => (
                            <div key={index} className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-slate-700 rounded-full px-3 py-1.5 text-sm">
                              <span className="text-base">{info.icon}</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{info.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Infos secondaires */}
                      {secondaryInfo.length > 0 && (
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                          {secondaryInfo.map((info, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span>{info.icon}</span>
                              <span>{info.text}</span>
                              {info.detail && <span className="ml-1">{info.detail}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
                
                {/* Indicateur discret de synchronisation */}
                {isOwnProfile && (localAdvancedData.favoriteTennisPlayer || localAdvancedData.favoriteF1Driver) && (
                  <div className="mt-2 inline-flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Données synchronisées</span>
                  </div>
                )}
              </div>
              
              {/* Stats rapides */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile?.stats?.totalRatings || 0}</div>
                    <div className="text-sm text-blue-700">Notes données</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {profile?.stats?.avgRating > 0 ? profile.stats.avgRating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-yellow-700">Note moyenne</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{profile?.stats?.totalFriends || 0}</div>
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
            {profile && profile.stats && (
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
                            ? profile.stats.totalRatings || 0
                            : profile.stats.statsBySport[sport.id]?.totalRatings || 0
                          }
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    const filteredMatches = getFilteredRatings(profile?.stats?.topMatches || [])
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
                    Notes de matchs ({getFilteredRatings(profile.recentRatings || []).length})
                    {activeSport !== 'all' && ` - ${sports.find(s => s.id === activeSport)?.name}`}
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

            {/* Player Ratings Tab */}
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

            {/* Teams Tab */}
            {activeTab === 'teams' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Équipes et joueurs suivis ({teams.length})
                  </h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowTeamSearch(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="space-y-8">
                {/* Répartition des notes par sport */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
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

        {/* Zone de danger - Version améliorée */}
        {isOwnProfile && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden mt-8 border border-red-200 dark:border-red-800">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Zone de danger</span>
              </h3>
              <p className="text-red-700 dark:text-red-200 mt-2">
                Actions irréversibles sur votre compte
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Supprimer mon compte</h4>
                  <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
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
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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

      {/* Modal de suppression de compte amélioré */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userHasPassword={userHasPassword}
        userEmail={profile?.user?.email || ''}
      />
    </div>
  )
}