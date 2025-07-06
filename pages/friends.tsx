import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  Trophy,
  Search,
  Users,
  LogOut,
  UserPlus,
  Check,
  X,
  Clock,
  Star,
  Calendar,
  MessageCircle,
  Heart,
  UserCheck,
  UserX,
  MoreHorizontal,
  Mail,
  Phone,
  UserMinus
} from 'lucide-react'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle'
import Navbar from '../components/Navbar'

interface Friend {
  id: string
  name?: string
  username?: string
  email: string
  image?: string
  totalRatings: number
  friendsSince: string
  friendshipId: string
}

interface FriendRequest {
  id: string
  sender: {
    id: string
    name?: string
    username?: string
    image?: string
    _count: { ratings: number }
  }
  createdAt: string
}

interface SentRequest {
  id: string
  receiver: {
    id: string
    name?: string
    username?: string
    image?: string
    _count: { ratings: number }
  }
  createdAt: string
}

interface Suggestion {
  id: string
  name?: string
  username?: string
  image?: string
  _count: { ratings: number }
}

export default function FriendsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent' | 'suggestions'>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session, activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/friends?type=${activeTab}`)
      
      switch (activeTab) {
        case 'friends':
          setFriends(response.data.friends || [])
          break
        case 'requests':
          setRequests(response.data.requests || [])
          break
        case 'sent':
          setSentRequests(response.data.sent || [])
          break
        case 'suggestions':
          setSuggestions(response.data.suggestions || [])
          break
      }
    } catch (error) {
      console.error('Erreur chargement amis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendAction = async (userId: string, action: 'accept' | 'decline' | 'cancel' | 'send', friendshipId?: string) => {
    try {
      setActionLoading(userId)
      await axios.post('/api/friends', {
        action: action === 'send' ? 'send_request' : 
               action === 'cancel' ? 'cancel_request' :
               `${action}_request`,
        userId,
        friendshipId
      })

      fetchData() // Refresh data
      
      const messages = {
        accept: '✅ Demande acceptée',
        decline: '❌ Demande refusée',
        cancel: '🚫 Demande annulée',
        send: '📤 Demande envoyée'
      }
      
      // Toast notification (tu peux remplacer par react-hot-toast)
      console.log(messages[action])
    } catch (error) {
      console.error('Erreur action ami:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'friends': return friends.length
      case 'requests': return requests.length
      case 'sent': return sentRequests.length
      case 'suggestions': return suggestions.length
      default: return 0
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl max-w-md">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connexion requise</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Connectez-vous pour gérer vos amis</p>
          <Link href="/auth/signin" className="btn-mobile-primary w-full">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
        <Navbar activeTab="home" />
        
        {/* Hero Section */}
        <div className="px-4 py-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Mes amis</h1>
                <p className="text-blue-100 text-sm">Connectez-vous avec la communauté FootRate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 -mt-4 relative z-10">
        {/* Tabs - Design moderne avec badges */}
        <div className="mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
              {[
                { id: 'friends', label: 'Amis', icon: Users, color: 'blue' },
                { id: 'requests', label: 'Demandes', icon: MessageCircle, color: 'red' },
                { id: 'sent', label: 'Envoyées', icon: Clock, color: 'yellow' },
                { id: 'suggestions', label: 'Suggestions', icon: UserPlus, color: 'green' }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const count = getTabCount(tab.id)
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-200 touch-action-manipulation ${
                      isActive
                        ? `bg-${tab.color}-50 dark:bg-${tab.color}-900/20 text-${tab.color}-600 dark:text-${tab.color}-400 shadow-sm`
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {count > 0 && tab.id === 'requests' && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {count > 99 ? '99+' : count}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{tab.label}</span>
                    {count > 0 && tab.id !== 'requests' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${tab.color}-100 dark:bg-${tab.color}-900/30 text-${tab.color}-600 dark:text-${tab.color}-400`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Loading avec skeleton moderne */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div>
                {friends.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Users className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucun ami pour le moment</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Commencez à suivre d'autres utilisateurs pour découvrir leurs avis sur les matchs
                    </p>
                    <Link
                      href="/search"
                      className="btn-mobile-primary inline-flex items-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Rechercher des utilisateurs</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <div key={friend.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="relative">
                            {friend.image ? (
                              <img
                                src={friend.image}
                                alt={friend.name || 'Friend'}
                                className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-slate-600"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                  {(friend.name || friend.username || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                              <UserCheck className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {friend.name || friend.username}
                            </h4>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>{friend.totalRatings} notation{friend.totalRatings > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>Depuis {new Date(friend.friendsSince).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/profile?userId=${friend.id}`}
                            className="flex-1 text-center px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            Voir profil
                          </Link>
                          <button
                            onClick={() => handleFriendAction(friend.id, 'cancel', friend.friendshipId)}
                            disabled={actionLoading === friend.id}
                            className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === friend.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                {requests.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucune demande</h3>
                    <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas de nouvelles demandes d'ami</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="relative">
                              {request.sender.image ? (
                                <img
                                  src={request.sender.image}
                                  alt={request.sender.name || 'User'}
                                  className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-slate-600"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-xl font-bold text-white">
                                    {(request.sender.name || request.sender.username || 'U')[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {request.sender.name || request.sender.username}
                              </h4>
                              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span>{request.sender._count.ratings} notation{request.sender._count.ratings > 1 ? 's' : ''}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {formatTimeAgo(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleFriendAction(request.sender.id, 'accept', request.id)}
                              disabled={actionLoading === request.sender.id}
                              className="flex items-center space-x-1 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 min-w-[80px] justify-center"
                            >
                              {actionLoading === request.sender.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span className="hidden sm:inline">Accepter</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleFriendAction(request.sender.id, 'decline', request.id)}
                              disabled={actionLoading === request.sender.id}
                              className="flex items-center space-x-1 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 min-w-[80px] justify-center"
                            >
                              {actionLoading === request.sender.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <X className="w-4 h-4" />
                                  <span className="hidden sm:inline">Refuser</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === 'sent' && (
              <div>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucune demande envoyée</h3>
                    <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas de demandes d'ami en attente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <div key={request.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="relative">
                              {request.receiver.image ? (
                                <img
                                  src={request.receiver.image}
                                  alt={request.receiver.name || 'User'}
                                  className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-slate-600"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                  <span className="text-xl font-bold text-white">
                                    {(request.receiver.name || request.receiver.username || 'U')[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {request.receiver.name || request.receiver.username}
                              </h4>
                              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span>{request.receiver._count.ratings} notation{request.receiver._count.ratings > 1 ? 's' : ''}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Envoyée {formatTimeAgo(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleFriendAction(request.receiver.id, 'cancel', request.id)}
                            disabled={actionLoading === request.receiver.id}
                            className="flex items-center space-x-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === request.receiver.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">Annuler</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div>
                {suggestions.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <UserPlus className="w-12 h-12 text-green-500 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aucune suggestion</h3>
                    <p className="text-gray-600 dark:text-gray-400">Aucun utilisateur à suggérer pour le moment</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            {suggestion.image ? (
                              <img
                                src={suggestion.image}
                                alt={suggestion.name || 'User'}
                                className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-slate-600"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                  {(suggestion.name || suggestion.username || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                              <UserPlus className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {suggestion.name || suggestion.username}
                            </h4>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>{suggestion._count.ratings} notation{suggestion._count.ratings > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleFriendAction(suggestion.id, 'send')}
                          disabled={actionLoading === suggestion.id}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {actionLoading === suggestion.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>Ajouter</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button pour mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Link
          href="/search"
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 active:scale-95"
        >
          <Search className="w-6 h-6" />
        </Link>
      </div>

      {/* Safe area bottom pour les appareils avec notch */}
      <div className="safe-bottom"></div>
    </div>
  )
}