// components/FriendsSection.tsx - Section amis pour intégrer dans le profil
import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  MoreHorizontal,
  MessageSquare,
  Trophy,
  Star,
  Calendar,
  MapPin,
  Crown
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import AvatarDisplay from './AvatarDisplay'

interface Friend {
  id: string
  name: string
  username?: string
  image?: string
  email: string
  bio?: string
  location?: string
  stats?: {
    totalRatings: number
    avgRating: number
    totalFriends: number
  }
  mutualFriends?: number
  lastActivity?: string
  isOnline?: boolean
}

interface FriendRequest {
  id: string
  sender: Friend
  receiver: Friend
  createdAt: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

interface FriendsSectionProps {
  userId: string
  isOwnProfile: boolean
}

export default function FriendsSection({ userId, isOwnProfile }: FriendsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'friends' | 'requests' | 'discover'>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [suggestions, setSuggestions] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const subTabs = [
    { 
      id: 'friends', 
      label: 'Mes amis', 
      icon: Users, 
      count: friends.length 
    },
    { 
      id: 'requests', 
      label: 'Demandes', 
      icon: UserPlus, 
      count: requests.length,
      badge: requests.length > 0 
    },
    { 
      id: 'discover', 
      label: 'Découvrir', 
      icon: Search, 
      count: suggestions.length 
    }
  ]

  useEffect(() => {
    fetchFriendsData()
  }, [userId])

  const fetchFriendsData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les amis
      const friendsResponse = await axios.get(`/api/friends?userId=${userId}`)
      setFriends(friendsResponse.data.friends || [])
      
      if (isOwnProfile) {
        // Récupérer les demandes d'amitié
        const requestsResponse = await axios.get('/api/friends/requests')
        setRequests(requestsResponse.data.requests || [])
        
        // Récupérer les suggestions
        const suggestionsResponse = await axios.get('/api/friends/suggestions')
        setSuggestions(suggestionsResponse.data.suggestions || [])
      }
    } catch (error) {
      console.error('❌ Erreur chargement amis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequest = async (targetUserId: string, action: 'send' | 'accept' | 'decline' | 'remove') => {
    try {
      await axios.post('/api/friends/request', {
        targetUserId,
        action
      })
      
      // Rafraîchir les données
      await fetchFriendsData()
    } catch (error) {
      console.error('❌ Erreur action ami:', error)
    }
  }

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec sous-onglets */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isOwnProfile ? 'Mes amis' : 'Amis'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isOwnProfile ? 'Gérez votre réseau social' : `${friends.length} amis`}
          </p>
        </div>
      </div>

      {/* Sous-navigation (seulement pour son propre profil) */}
      {isOwnProfile && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 relative ${
                  activeSubTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activeSubTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Barre de recherche (onglet amis) */}
      {(activeSubTab === 'friends' || !isOwnProfile) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un ami..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      {(activeSubTab === 'friends' || !isOwnProfile) && (
        <div className="space-y-4">
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredFriends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/profile?userId=${friend.id}`}
                  className="block bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <AvatarDisplay
                        image={friend.image}
                        name={friend.name}
                        size="md"
                        showBorder={true}
                      />
                      {friend.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {friend.name}
                        </h3>
                        {friend.stats && friend.stats.totalRatings > 100 && (
                          <Crown className="w-4 h-4 text-yellow-500" title="Super utilisateur" />
                        )}
                      </div>
                      
                      {friend.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{friend.username}</p>
                      )}
                      
                      {friend.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-1">
                          {friend.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {friend.stats && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{friend.stats.totalRatings} notes</span>
                          </div>
                        )}
                        
                        {friend.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{friend.location}</span>
                          </div>
                        )}
                        
                        {friend.mutualFriends && friend.mutualFriends > 0 && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{friend.mutualFriends} amis communs</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {friend.stats && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {friend.stats.avgRating.toFixed(1)}/5
                          </div>
                          <div className="text-xs text-gray-500">moyenne</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery 
                  ? 'Essayez un autre terme de recherche'
                  : isOwnProfile 
                    ? 'Commencez à vous faire des amis !'
                    : 'Cet utilisateur n\'a pas encore d\'amis'
                }
              </p>
              {isOwnProfile && !searchQuery && (
                <button
                  onClick={() => setActiveSubTab('discover')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Découvrir des amis
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Onglet Demandes d'amitié */}
      {isOwnProfile && activeSubTab === 'requests' && (
        <div className="space-y-4">
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600"
                >
                  <div className="flex items-center space-x-4">
                    <AvatarDisplay
                      image={request.sender.image}
                      name={request.sender.name}
                      size="md"
                      showBorder={true}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.sender.name}
                      </h3>
                      {request.sender.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{request.sender.username}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Il y a {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFriendRequest(request.sender.id, 'accept')}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Accepter"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFriendRequest(request.sender.id, 'decline')}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Refuser"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune demande d'amitié
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vous n'avez pas de nouvelles demandes d'amitié en attente
              </p>
            </div>
          )}
        </div>
      )}

      {/* Onglet Découvrir */}
      {isOwnProfile && activeSubTab === 'discover' && (
        <div className="space-y-4">
          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600"
                >
                  <div className="flex items-center space-x-4">
                    <AvatarDisplay
                      image={suggestion.image}
                      name={suggestion.name}
                      size="md"
                      showBorder={true}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {suggestion.name}
                        </h3>
                        {suggestion.stats && suggestion.stats.totalRatings > 50 && (
                          <Trophy className="w-4 h-4 text-blue-500" title="Utilisateur actif" />
                        )}
                      </div>
                      
                      {suggestion.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{suggestion.username}</p>
                      )}
                      
                      {suggestion.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                          {suggestion.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.stats && (
                          <>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>{suggestion.stats.totalRatings} notes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Trophy className="w-3 h-3" />
                              <span>{suggestion.stats.avgRating.toFixed(1)}/5</span>
                            </div>
                          </>
                        )}
                        
                        {suggestion.mutualFriends && suggestion.mutualFriends > 0 && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{suggestion.mutualFriends} amis communs</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleFriendRequest(suggestion.id, 'send')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Ajouter
                      </button>
                      <Link
                        href={`/profile?userId=${suggestion.id}`}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-center"
                      >
                        Voir profil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune suggestion
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Nous n'avons pas de suggestions d'amis pour le moment
              </p>
              <button
                onClick={() => setActiveSubTab('friends')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir mes amis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats rapides en bas */}
      {friends.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {friends.length}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {friends.length > 1 ? 'Amis' : 'Ami'}
              </div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {friends.filter(f => f.isOnline).length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">En ligne</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {friends.reduce((total, friend) => total + (friend.stats?.totalRatings || 0), 0)}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Notes totales</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {friends.length > 0 
                  ? (friends.reduce((total, friend) => total + (friend.stats?.avgRating || 0), 0) / friends.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">Moyenne groupe</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}