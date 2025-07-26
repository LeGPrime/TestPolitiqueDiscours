// pages/personal-matches.tsx - Page des matchs personnels et rivalités
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Trophy, Users, Plus, Star, Calendar, MapPin, 
  Target, Zap, Crown, Medal, TrendingUp, Clock,
  Search, Filter, Eye, MoreHorizontal, ChevronRight,
  UserPlus, Check, X, MessageCircle, Award, Flame,
  Settings, Edit3, BarChart3, Activity, Globe
} from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

// ==========================================
// INTERFACES
// ==========================================
interface Friend {
  id: string
  name: string
  username?: string
  image?: string
  email: string
}

interface Rivalry {
  id: string
  sport: string
  status: 'PENDING' | 'ACTIVE' | 'PAUSED'
  createdAt: string
  friend: Friend
  myStats: {
    wins: number
    losses: number
    totalMatches: number
    currentStreak: number
    streakType: 'wins' | 'losses' | 'none'
  }
  friendStats: {
    wins: number
    losses: number
    totalMatches: number
  }
  recentMatches: PersonalMatch[]
}

interface PersonalMatch {
  id: string
  date: string
  myScore: string
  friendScore: string
  location?: string
  comment?: string
  addedBy: string
  winner: 'me' | 'friend' | 'draw'
}

interface RivalryRequest {
  id: string
  sport: string
  friend: Friend
  message?: string
  createdAt: string
}

// ==========================================
// CONSTANTES
// ==========================================
const SPORTS = [
  // Sports d'équipe
  { id: 'football', name: 'Football', emoji: '⚽', category: 'Équipe' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', category: 'Équipe' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', category: 'Équipe' },
  { id: 'handball', name: 'Handball', emoji: '🤾', category: 'Équipe' },
  { id: 'rugby', name: 'Rugby', emoji: '🏉', category: 'Équipe' },
  { id: 'waterpolo', name: 'Water-polo', emoji: '🤽', category: 'Équipe' },
  
  // Sports de raquette
  { id: 'tennis', name: 'Tennis', emoji: '🎾', category: 'Raquette' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', category: 'Raquette' },
  { id: 'pingpong', name: 'Ping-pong', emoji: '🏓', category: 'Raquette' },
  { id: 'squash', name: 'Squash', emoji: '🎾', category: 'Raquette' },
  { id: 'padel', name: 'Padel', emoji: '🎾', category: 'Raquette' },
  
  // Sports de combat
  { id: 'boxing', name: 'Boxe', emoji: '🥊', category: 'Combat' },
  { id: 'mma', name: 'MMA', emoji: '🥋', category: 'Combat' },
  { id: 'judo', name: 'Judo', emoji: '🥋', category: 'Combat' },
  { id: 'karate', name: 'Karaté', emoji: '🥋', category: 'Combat' },
  { id: 'wrestling', name: 'Lutte', emoji: '🤼', category: 'Combat' },
  
  // Sports individuels
  { id: 'running', name: 'Course à pied', emoji: '🏃', category: 'Individuel' },
  { id: 'cycling', name: 'Cyclisme', emoji: '🚴', category: 'Individuel' },
  { id: 'swimming', name: 'Natation', emoji: '🏊', category: 'Individuel' },
  { id: 'golf', name: 'Golf', emoji: '⛳', category: 'Individuel' },
  { id: 'climbing', name: 'Escalade', emoji: '🧗', category: 'Individuel' },
  { id: 'gymnastics', name: 'Gymnastique', emoji: '🤸', category: 'Individuel' },
  
  // Sports mécaniques
  { id: 'f1', name: 'Formule 1', emoji: '🏎️', category: 'Mécanique' },
  { id: 'karting', name: 'Karting', emoji: '🏎️', category: 'Mécanique' },
  { id: 'motocross', name: 'Motocross', emoji: '🏍️', category: 'Mécanique' },
  
  // Sports d'hiver
  { id: 'skiing', name: 'Ski', emoji: '⛷️', category: 'Hiver' },
  { id: 'snowboard', name: 'Snowboard', emoji: '🏂', category: 'Hiver' },
  { id: 'icehockey', name: 'Hockey sur glace', emoji: '🏒', category: 'Hiver' },
  
  // Autres
  { id: 'chess', name: 'Échecs', emoji: '♟️', category: 'Réflexion' },
  { id: 'darts', name: 'Fléchettes', emoji: '🎯', category: 'Précision' },
  { id: 'bowling', name: 'Bowling', emoji: '🎳', category: 'Précision' },
  { id: 'pool', name: 'Billard', emoji: '🎱', category: 'Précision' },
  { id: 'other', name: 'Autre sport', emoji: '🏆', category: 'Autre' }
]

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function PersonalMatchesPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rivalries' | 'requests' | 'stats'>('dashboard')
  const [loading, setLoading] = useState(true)
  
  // États pour les données
  const [friends, setFriends] = useState<Friend[]>([])
  const [rivalries, setRivalries] = useState<Rivalry[]>([])
  const [requests, setRequests] = useState<RivalryRequest[]>([])
  
  // États pour les modals
  const [showCreateRivalry, setShowCreateRivalry] = useState(false)
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [selectedRivalry, setSelectedRivalry] = useState<Rivalry | null>(null)
  
  // États pour les formulaires
  const [createRivalryForm, setCreateRivalryForm] = useState({
    friendId: '',
    sport: '',
    message: ''
  })
  
  const [addMatchForm, setAddMatchForm] = useState({
    myScore: '',
    friendScore: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    comment: ''
  })

  // ==========================================
  // FONCTIONS API
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true)
      
      console.log('🔄 Chargement des données...')
      
      // Récupérer les amis
      const friendsResponse = await axios.get('/api/friends?type=friends')
      setFriends(friendsResponse.data.friends || [])
      console.log(`✅ ${friendsResponse.data.friends?.length || 0} amis chargés`)
      
      // Récupérer toutes les rivalités
      const rivalriesResponse = await axios.get('/api/personal-rivalries')
      setRivalries(rivalriesResponse.data.rivalries || [])
      console.log(`✅ ${rivalriesResponse.data.rivalries?.length || 0} rivalités chargées`)
      
      // Récupérer les demandes reçues
      const requestsResponse = await axios.get('/api/personal-rivalries?type=requests')
      setRequests(requestsResponse.data.rivalries || [])
      console.log(`✅ ${requestsResponse.data.rivalries?.length || 0} demandes chargées`)
      
    } catch (error) {
      console.error('❌ Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRivalry = async () => {
    try {
      if (!createRivalryForm.friendId || !createRivalryForm.sport) {
        alert('Veuillez sélectionner un ami et un sport')
        return
      }

      console.log('🚀 Envoi création rivalité:', createRivalryForm)

      // Appel API pour créer la rivalité
      const response = await axios.post('/api/personal-rivalries', {
        friendId: createRivalryForm.friendId,
        sport: createRivalryForm.sport,
        message: createRivalryForm.message
      })
      
      console.log('✅ Réponse API:', response.data)
      
      // Actualiser les données
      await fetchData()
      
      alert('Demande de rivalité envoyée ! 🏆')
      
      setShowCreateRivalry(false)
      setCreateRivalryForm({ friendId: '', sport: '', message: '' })
      
    } catch (error: any) {
      console.error('❌ Erreur création rivalité:', error)
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de la rivalité'
      alert(errorMessage)
    }
  }

  const handleAddMatch = async () => {
    try {
      if (!addMatchForm.myScore || !addMatchForm.friendScore) {
        alert('Veuillez renseigner les scores')
        return
      }

      // TODO: Appel API pour ajouter le match
      console.log('Ajout match:', addMatchForm, 'Rivalité:', selectedRivalry?.id)
      
      // Simulation d'ajout
      alert('Match ajouté ! 🎯')
      
      setShowAddMatch(false)
      setSelectedRivalry(null)
      setAddMatchForm({
        myScore: '',
        friendScore: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        comment: ''
      })
      
    } catch (error) {
      console.error('❌ Erreur ajout match:', error)
      alert('Erreur lors de l\'ajout du match')
    }
  }

  // ==========================================
  // EFFETS
  // ==========================================
  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  // ==========================================
  // RENDU DES GUARDS
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connexion requise</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous pour gérer vos rivalités sportives</p>
          <Link href="/auth/signin" className="btn-mobile-primary w-full">
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
          <p className="text-gray-600 dark:text-gray-300">Chargement de vos rivalités...</p>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <Navbar activeTab="home" />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <div className="max-w-7xl mx-auto px-4 py-8 text-white">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Mes Rivalités</h1>
              <p className="text-blue-100 text-lg">Trackez vos duels sportifs avec vos amis</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{rivalries.length}</div>
              <div className="text-blue-100 text-sm">Rivalités</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {rivalries.reduce((total, r) => total + r.myStats.totalMatches, 0)}
              </div>
              <div className="text-blue-100 text-sm">Matchs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {rivalries.reduce((total, r) => total + r.myStats.wins, 0)}
              </div>
              <div className="text-blue-100 text-sm">Victoires</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{requests.length}</div>
              <div className="text-blue-100 text-sm">Demandes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        {/* Navigation tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-slate-700 mb-8">
          <div className="p-2 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex overflow-x-auto space-x-1">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: Trophy, color: 'from-blue-500 to-purple-600' },
                { id: 'rivalries', label: 'Mes rivalités', icon: Users, color: 'from-green-500 to-emerald-600', count: rivalries.length },
                { id: 'requests', label: 'Demandes', icon: UserPlus, color: 'from-yellow-500 to-orange-600', count: requests.length, badge: requests.length > 0 },
                { id: 'stats', label: 'Statistiques', icon: BarChart3, color: 'from-purple-500 to-indigo-600' }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-3 px-6 rounded-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 relative ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.badge && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Action buttons */}
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={() => setShowCreateRivalry(true)}
                    disabled={friends.length === 0}
                    className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Créer une nouvelle rivalité</span>
                  </button>
                  
                  {friends.length === 0 && (
                    <Link
                      href="/friends"
                      className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Ajouter des amis d'abord</span>
                    </Link>
                  )}
                </div>

                {/* État vide pour les rivalités */}
                {rivalries.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-700 rounded-2xl border border-gray-200 dark:border-slate-600">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aucune rivalité active</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Commencez votre première rivalité sportive avec un ami ! 
                      Trackez vos victoires, défaites et progressez ensemble.
                    </p>
                    
                    {friends.length > 0 ? (
                      <button
                        onClick={() => setShowCreateRivalry(true)}
                        className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Créer ma première rivalité</span>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Vous devez d'abord avoir des amis pour créer des rivalités
                        </p>
                        <Link
                          href="/friends"
                          className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <UserPlus className="w-5 h-5" />
                          <span>Ajouter des amis</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  // Liste des rivalités actives (pour plus tard)
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Rivalités actives</h3>
                    {/* TODO: Affichage des rivalités */}
                  </div>
                )}
              </div>
            )}

            {/* RIVALRIES TAB */}
            {activeTab === 'rivalries' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mes rivalités ({rivalries.length})</h3>
                  {friends.length > 0 && (
                    <button
                      onClick={() => setShowCreateRivalry(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nouvelle rivalité</span>
                    </button>
                  )}
                </div>

                {rivalries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune rivalité</h3>
                    <p className="text-gray-600 dark:text-gray-400">Créez votre première rivalité sportive !</p>
                  </div>
                ) : (
                  // TODO: Liste des rivalités
                  <div className="text-center py-12 text-gray-500">
                    Rivalités à venir...
                  </div>
                )}
              </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Demandes de rivalité ({requests.length})</h3>

                {requests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                    <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune demande</h3>
                    <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas de demandes de rivalité en attente</p>
                  </div>
                ) : (
                  // TODO: Liste des demandes
                  <div className="text-center py-12 text-gray-500">
                    Demandes à venir...
                  </div>
                )}
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Statistiques globales</h3>

                {rivalries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pas de statistiques</h3>
                    <p className="text-gray-600 dark:text-gray-400">Créez des rivalités pour voir vos statistiques</p>
                  </div>
                ) : (
                  // TODO: Statistiques détaillées
                  <div className="text-center py-12 text-gray-500">
                    Statistiques à venir...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL - Créer une rivalité */}
      {showCreateRivalry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center space-x-3">
                <Trophy className="w-6 h-6" />
                <span>Nouvelle rivalité</span>
              </h2>
              <button
                onClick={() => setShowCreateRivalry(false)}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Sélection de l'ami */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  👥 Choisir un adversaire
                </label>
                <select
                  value={createRivalryForm.friendId}
                  onChange={(e) => setCreateRivalryForm({...createRivalryForm, friendId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un ami...</option>
                  {friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>
                      {friend.name || friend.username} {friend.username && friend.name && `(@${friend.username})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection du sport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏆 Choisir un sport
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-xl p-3">
                  {Object.entries(
                    SPORTS.reduce((acc, sport) => {
                      if (!acc[sport.category]) acc[sport.category] = []
                      acc[sport.category].push(sport)
                      return acc
                    }, {} as Record<string, typeof SPORTS>)
                  ).map(([category, sports]) => (
                    <div key={category}>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        {category}
                      </div>
                      <div className="grid grid-cols-2 gap-1 mb-3">
                        {sports.map((sport) => (
                          <button
                            key={sport.id}
                            onClick={() => setCreateRivalryForm({...createRivalryForm, sport: sport.id})}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                              createRivalryForm.sport === sport.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                            }`}
                          >
                            <span>{sport.emoji}</span>
                            <span className="truncate">{sport.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message optionnel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💬 Message (optionnel)
                </label>
                <textarea
                  value={createRivalryForm.message}
                  onChange={(e) => setCreateRivalryForm({...createRivalryForm, message: e.target.value})}
                  placeholder="Hey ! Ça te dit de tracker nos matchs de tennis ?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Aperçu */}
              {createRivalryForm.friendId && createRivalryForm.sport && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">
                      {SPORTS.find(s => s.id === createRivalryForm.sport)?.emoji}
                    </div>
                    <div>
                      <div className="font-semibold text-blue-900 dark:text-blue-100">
                        Rivalité {SPORTS.find(s => s.id === createRivalryForm.sport)?.name}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        avec {friends.find(f => f.id === createRivalryForm.friendId)?.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    🔔 Une notification sera envoyée pour validation
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky bottom-0">
                <button
                  onClick={() => setShowCreateRivalry(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateRivalry}
                  disabled={!createRivalryForm.friendId || !createRivalryForm.sport}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer la rivalité
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - Ajouter un match */}
      {showAddMatch && selectedRivalry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center space-x-3">
                <Plus className="w-6 h-6" />
                <span>Ajouter un match</span>
              </h2>
              <button
                onClick={() => {
                  setShowAddMatch(false)
                  setSelectedRivalry(null)
                }}
                className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info de la rivalité */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {SPORTS.find(s => s.id === selectedRivalry.sport)?.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {SPORTS.find(s => s.id === selectedRivalry.sport)?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      vs {selectedRivalry.friend.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📊 Résultat du match
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Votre score</label>
                    <input
                      type="text"
                      value={addMatchForm.myScore}
                      onChange={(e) => setAddMatchForm({...addMatchForm, myScore: e.target.value})}
                      placeholder="6-4, 6-2"
                      className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Score de {selectedRivalry.friend.name}</label>
                    <input
                      type="text"
                      value={addMatchForm.friendScore}
                      onChange={(e) => setAddMatchForm({...addMatchForm, friendScore: e.target.value})}
                      placeholder="4-6, 2-6"
                      className="w-full px-3 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-center font-semibold"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Format libre : "3-1", "6-4, 6-2", "21-19", etc.
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Date du match
                </label>
                <input
                  type="date"
                  value={addMatchForm.date}
                  onChange={(e) => setAddMatchForm({...addMatchForm, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📍 Lieu (optionnel)
                </label>
                <input
                  type="text"
                  value={addMatchForm.location}
                  onChange={(e) => setAddMatchForm({...addMatchForm, location: e.target.value})}
                  placeholder="Club de tennis, Terrain municipal..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💬 Commentaire (optionnel)
                </label>
                <textarea
                  value={addMatchForm.comment}
                  onChange={(e) => setAddMatchForm({...addMatchForm, comment: e.target.value})}
                  placeholder="Excellent match ! J'ai bien progressé au service..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Information sur la notification */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedRivalry.friend.name} recevra une notification
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddMatch(false)
                    setSelectedRivalry(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddMatch}
                  disabled={!addMatchForm.myScore || !addMatchForm.friendScore}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter le match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe area bottom */}
      <div className="h-20 md:h-0"></div>
    </div>
  )
}