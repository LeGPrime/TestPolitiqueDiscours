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
  MessageCircle
} from 'lucide-react'
import axios from 'axios'

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
      await axios.post('/api/friends', {
        action: action === 'send' ? 'send_request' : 
               action === 'cancel' ? 'cancel_request' :
               `${action}_request`,
        userId,
        friendshipId
      })

      fetchData() // Refresh data
      
      const messages = {
        accept: 'Demande d\'ami acceptée',
        decline: 'Demande d\'ami refusée',
        cancel: 'Demande annulée',
        send: 'Demande d\'ami envoyée'
      }
      alert(messages[action])
    } catch (error) {
      console.error('Erreur action ami:', error)
      alert('Erreur lors de l\'action')
    }
  }

  const navigationItems = [
    { href: '/', label: 'Accueil', icon: Trophy, active: false },
    { href: '/search', label: 'Recherche', icon: Search, active: false },
    { href: '/friends', label: 'Amis', icon: Users, active: true },
    { href: '/top-matches', label: 'Top', icon: Trophy, active: false },
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GFoot</h1>
                <p className="text-xs text-gray-500">Application du Goat</p>
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
                          ? 'text-blue-600 bg-blue-50 font-medium' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              
              <div className="flex items-center space-x-3">
                <Link 
                  href="/profile"
                  className="text-sm text-gray-700 hover:text-blue-600 font-medium"
                >
                  👋 {session.user?.name?.split(' ')[0] || 'Profil'}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <Users className="w-8 h-8 text-blue-500" />
            <span>Mes amis</span>
          </h2>
          <p className="text-gray-600">Gérez votre réseau d'amis FootRate</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            {[
              { id: 'friends', label: 'Amis', icon: Users },
              { id: 'requests', label: 'Demandes reçues', icon: MessageCircle },
              { id: 'sent', label: 'Demandes envoyées', icon: Clock },
              { id: 'suggestions', label: 'Suggestions', icon: UserPlus }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'requests' && requests.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {requests.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : (
          <div>
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div>
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun ami</h3>
                    <p className="text-gray-600 mb-4">Commencez à suivre d'autres utilisateurs pour découvrir leurs avis</p>
                    <Link
                      href="/search"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Rechercher des utilisateurs →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {friends.map((friend) => (
                      <div key={friend.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          {friend.image ? (
                            <img
                              src={friend.image}
                              alt={friend.name || 'Friend'}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-lg font-medium text-gray-600">
                                {(friend.name || friend.username || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {friend.name || friend.username}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {friend.totalRatings} notation{friend.totalRatings > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Calendar className="w-4 h-4 mr-1" />
                          Amis depuis {new Date(friend.friendsSince).toLocaleDateString('fr-FR')}
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/profile?userId=${friend.id}`}
                            className="flex-1 text-center px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200"
                          >
                            Voir profil
                          </Link>
                          <button
                            onClick={() => handleFriendAction(friend.id, 'cancel', friend.friendshipId)}
                            className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200"
                          >
                            Retirer
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
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
                    <p className="text-gray-600">Vous n'avez pas de nouvelles demandes d'ami</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {request.sender.image ? (
                              <img
                                src={request.sender.image}
                                alt={request.sender.name || 'User'}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-lg font-medium text-gray-600">
                                  {(request.sender.name || request.sender.username || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {request.sender.name || request.sender.username}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {request.sender._count.ratings} notation{request.sender._count.ratings > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-gray-500">
                                Demande envoyée {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleFriendAction(request.sender.id, 'accept', request.id)}
                              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white texttext-sm font-medium rounded-lg hover:bg-green-700"
                           >
                             <Check className="w-4 h-4" />
                             <span>Accepter</span>
                           </button>
                           <button
                             onClick={() => handleFriendAction(request.sender.id, 'decline', request.id)}
                             className="flex items-center space-x-1 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
                           >
                             <X className="w-4 h-4" />
                             <span>Refuser</span>
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
                 <div className="text-center py-12">
                   <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande envoyée</h3>
                   <p className="text-gray-600">Vous n'avez pas de demandes d'ami en attente</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {sentRequests.map((request) => (
                     <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                           {request.receiver.image ? (
                             <img
                               src={request.receiver.image}
                               alt={request.receiver.name || 'User'}
                               className="w-12 h-12 rounded-full"
                             />
                           ) : (
                             <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                               <span className="text-lg font-medium text-gray-600">
                                 {(request.receiver.name || request.receiver.username || 'U')[0].toUpperCase()}
                               </span>
                             </div>
                           )}
                           <div>
                             <h4 className="font-medium text-gray-900">
                               {request.receiver.name || request.receiver.username}
                             </h4>
                             <p className="text-sm text-gray-600">
                               {request.receiver._count.ratings} notation{request.receiver._count.ratings > 1 ? 's' : ''}
                             </p>
                             <p className="text-xs text-gray-500">
                               Envoyée {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                             </p>
                           </div>
                         </div>
                         
                         <button
                           onClick={() => handleFriendAction(request.receiver.id, 'cancel', request.id)}
                           className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200"
                         >
                           <X className="w-4 h-4" />
                           <span>Annuler</span>
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
                 <div className="text-center py-12">
                   <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune suggestion</h3>
                   <p className="text-gray-600">Aucun utilisateur à suggérer pour le moment</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {suggestions.map((suggestion) => (
                     <div key={suggestion.id} className="bg-white rounded-lg shadow-md p-6">
                       <div className="flex items-center space-x-4 mb-4">
                         {suggestion.image ? (
                           <img
                             src={suggestion.image}
                             alt={suggestion.name || 'User'}
                             className="w-12 h-12 rounded-full"
                           />
                         ) : (
                           <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                             <span className="text-lg font-medium text-gray-600">
                               {(suggestion.name || suggestion.username || 'U')[0].toUpperCase()}
                             </span>
                           </div>
                         )}
                         <div className="flex-1">
                           <h4 className="font-medium text-gray-900">
                             {suggestion.name || suggestion.username}
                           </h4>
                           <p className="text-sm text-gray-600">
                             {suggestion._count.ratings} notation{suggestion._count.ratings > 1 ? 's' : ''}
                           </p>
                         </div>
                       </div>

                       <button
                         onClick={() => handleFriendAction(suggestion.id, 'send')}
                         className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                       >
                         <UserPlus className="w-4 h-4" />
                         <span>Ajouter</span>
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
   </div>
 )
}
