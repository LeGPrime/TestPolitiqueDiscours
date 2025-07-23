// components/UserProfileModal.tsx - Modal de profil compact pour les commentaires
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  X, MapPin, Calendar, Users, Star, Heart, UserPlus, 
  UserCheck, Clock, Trophy, Globe, User, Flame
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

interface CompactProfile {
  id: string
  name?: string
  username?: string
  image?: string
  bio?: string
  location?: string
  createdAt: string
  // Données étendues si disponibles
  age?: string
  occupation?: string
  favoriteClub?: string
  favoriteBasketballTeam?: string
  favoriteTennisPlayer?: string
  favoriteF1Driver?: string
  preferredSports?: string[]
  languages?: string[]
  visibility?: {
    [key: string]: boolean
  }
  // Stats de base
  stats: {
    totalRatings: number
    avgRating: number
    totalFriends: number
    recentActivity: number
  }
  // Statut d'amitié
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends'
}

export default function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<CompactProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchCompactProfile()
    }
  }, [isOpen, userId])

  const fetchCompactProfile = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/users/compact-profile?userId=${userId}`)
      setProfile(response.data)
    } catch (error) {
      console.error('❌ Erreur chargement profil compact:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendAction = async (action: 'send' | 'accept' | 'decline' | 'cancel') => {
    if (!profile) return

    try {
      setActionLoading(true)
      await axios.post('/api/friends', {
        action: action === 'send' ? 'send_request' : 
               action === 'cancel' ? 'cancel_request' :
               `${action}_request`,
        userId: profile.id,
      })

      // Refetch le profil pour mettre à jour le statut
      await fetchCompactProfile()

      const messages = {
        send: '📤 Demande d\'ami envoyée !',
        accept: '✅ Demande acceptée !',
        decline: '❌ Demande refusée',
        cancel: '🚫 Demande annulée'
      }

      // Simple notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      notification.textContent = messages[action]
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)

    } catch (error) {
      console.error('❌ Erreur action ami:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getSelectLabel = (field: string, value: string) => {
    const options = {
      favoriteTennisPlayer: {
        'djokovic': 'Novak Djokovic', 'alcaraz': 'Carlos Alcaraz', 'medvedev': 'Daniil Medvedev',
        'nadal': 'Rafael Nadal', 'federer': 'Roger Federer', 'swiatek': 'Iga Swiatek',
        'sabalenka': 'Aryna Sabalenka', 'gauff': 'Coco Gauff'
      },
      favoriteF1Driver: {
        'verstappen': 'Max Verstappen', 'hamilton': 'Lewis Hamilton', 'leclerc': 'Charles Leclerc',
        'norris': 'Lando Norris', 'russell': 'George Russell', 'sainz': 'Carlos Sainz Jr.',
        'alonso': 'Fernando Alonso', 'schumacher': 'Michael Schumacher'
      }
    }
    return options[field as keyof typeof options]?.[value as keyof any] || value
  }

  const getLanguageFlag = (lang: string) => {
    const flags = {
      'fr': '🇫🇷 FR', 'en': '🇺🇸 EN', 'es': '🇪🇸 ES',
      'de': '🇩🇪 DE', 'it': '🇮🇹 IT', 'pt': '🇵🇹 PT'
    }
    return flags[lang as keyof typeof flags] || lang
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4">
        
        {loading ? (
          // Loading state
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Chargement du profil...</p>
          </div>
        ) : profile ? (
          <>
            {/* Header avec dégradé */}
            <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-6 text-white">
              {/* Bouton fermer */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Avatar et infos principales */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-lg">
                    {profile.image ? (
                      <img 
                        src={profile.image} 
                        alt={profile.name || profile.username || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {(profile.name || profile.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {profile.stats.recentActivity > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 border-3 border-white rounded-full w-6 h-6 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold mb-1">
                  {profile.name || profile.username}
                </h2>
                
                {profile.username && profile.name && (
                  <p className="text-white/80 text-sm">@{profile.username}</p>
                )}

                {profile.bio && (
                  <p className="text-white/90 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              
              {/* Métadonnées de base */}
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.location && profile.visibility?.location !== false && (
                  <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 rounded-full px-3 py-1 border border-blue-200 dark:border-blue-800">
                    <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-800 dark:text-blue-200 text-xs">{profile.location}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-700 rounded-full px-3 py-1 border border-gray-200 dark:border-slate-600">
                  <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-xs">
                    Depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {profile.stats.recentActivity > 0 && (
                  <div className="flex items-center space-x-1 bg-orange-50 dark:bg-orange-900/20 rounded-full px-3 py-1 border border-orange-200 dark:border-orange-800">
                    <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-800 dark:text-orange-200 text-xs">Actif</span>
                  </div>
                )}
              </div>

              {/* Badges de préférences */}
              <div className="space-y-3 mb-6">
                {/* Age et profession */}
                {(profile.age || profile.occupation) && (
                  <div className="flex flex-wrap gap-2">
                    {profile.age && profile.visibility?.age !== false && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-medium">
                        <User className="w-3 h-3" />
                        <span>{profile.age} ans</span>
                      </div>
                    )}
                    
                    {profile.occupation && profile.visibility?.occupation !== false && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-medium">
                        <User className="w-3 h-3" />
                        <span>{profile.occupation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sports favoris */}
                {((profile.favoriteClub && profile.visibility?.favoriteClub !== false) ||
                  (profile.favoriteBasketballTeam && profile.visibility?.favoriteBasketballTeam !== false) ||
                  (profile.favoriteTennisPlayer && profile.visibility?.favoriteTennisPlayer !== false) ||
                  (profile.favoriteF1Driver && profile.visibility?.favoriteF1Driver !== false)) && (
                  <div className="flex flex-wrap gap-2">
                    {profile.favoriteClub && profile.visibility?.favoriteClub !== false && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full text-xs font-medium">
                        <span>⚽</span>
                        <span>{profile.favoriteClub}</span>
                      </div>
                    )}
                    
                    {profile.favoriteBasketballTeam && profile.visibility?.favoriteBasketballTeam !== false && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-full text-xs font-medium">
                        <span>🏀</span>
                        <span>{profile.favoriteBasketballTeam}</span>
                      </div>
                    )}
                    
                    {profile.favoriteTennisPlayer && profile.visibility?.favoriteTennisPlayer !== false && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded-full text-xs font-medium">
                        <span>🎾</span>
                        <span>{getSelectLabel('favoriteTennisPlayer', profile.favoriteTennisPlayer)}</span>
                      </div>
                    )}
                    
                    {profile.favoriteF1Driver && profile.visibility?.favoriteF1Driver !== false && (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-full text-xs font-medium">
                        <span>🏎️</span>
                        <span>{getSelectLabel('favoriteF1Driver', profile.favoriteF1Driver)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sports préférés */}
                {profile.preferredSports && profile.preferredSports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.preferredSports.slice(0, 3).map((sport, index) => {
                      const sportLabels = {
                        'football': '⚽ Football', 'basketball': '🏀 Basketball',
                        'tennis': '🎾 Tennis', 'f1': '🏎️ F1', 'mma': '🥊 MMA', 'rugby': '🏉 Rugby'
                      }
                      return (
                        <div key={index} className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full text-xs font-medium">
                          <Trophy className="w-3 h-3" />
                          <span>{sportLabels[sport as keyof typeof sportLabels] || sport}</span>
                        </div>
                      )
                    })}
                    {profile.preferredSports.length > 3 && (
                      <div className="flex items-center px-3 py-1.5 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-600 rounded-full text-xs">
                        +{profile.preferredSports.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Langues */}
                {profile.languages && profile.languages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.slice(0, 4).map((lang, index) => (
                      <div key={index} className="flex items-center space-x-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-full text-xs font-medium">
                        <Globe className="w-3 h-3" />
                        <span>{getLanguageFlag(lang)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {profile.stats.totalRatings}
                  </div>
                  <div className="text-blue-800 dark:text-blue-200 text-xs">Notes</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {profile.stats.avgRating > 0 ? profile.stats.avgRating.toFixed(1) : '—'}
                  </div>
                  <div className="text-yellow-800 dark:text-yellow-200 text-xs">Moyenne</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {profile.stats.totalFriends}
                  </div>
                  <div className="text-green-800 dark:text-green-200 text-xs">Amis</div>
                </div>
              </div>

              {/* Actions */}
              {session?.user?.id && session.user.id !== profile.id && (
                <div className="space-y-3">
                  {profile.friendshipStatus === 'none' && (
                    <button
                      onClick={() => handleFriendAction('send')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          <span>Ajouter en ami</span>
                        </>
                      )}
                    </button>
                  )}

                  {profile.friendshipStatus === 'pending_sent' && (
                    <button
                      onClick={() => handleFriendAction('cancel')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Clock className="w-5 h-5" />
                          <span>Demande envoyée</span>
                        </>
                      )}
                    </button>
                  )}

                  {profile.friendshipStatus === 'pending_received' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFriendAction('accept')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <UserCheck className="w-5 h-5" />
                        <span>Accepter</span>
                      </button>
                      <button
                        onClick={() => handleFriendAction('decline')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                        <span>Refuser</span>
                      </button>
                    </div>
                  )}

                  {profile.friendshipStatus === 'friends' && (
                    <div className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl border border-green-200 dark:border-green-800 font-medium">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span>Vous êtes amis</span>
                    </div>
                  )}


                </div>
              )}
            </div>
          </>
        ) : (
          // Error state
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profil non trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Impossible de charger ce profil</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}