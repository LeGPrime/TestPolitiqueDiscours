// components/MatchListsSection.tsx
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Lock, Globe, Heart, Star, Calendar, MapPin, MoreHorizontal, ChevronRight } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import MatchListModal from './MatchListModal'

interface MatchListsProps {
  userId?: string
  isOwnProfile: boolean
}

interface MatchListItem {
  id: string
  name: string
  description?: string
  isPublic: boolean
  color?: string
  emoji?: string
  createdAt: string
  updatedAt: string
  matchCount: number
  likesCount: number
  isLiked?: boolean
  matches: Array<{
    id: string
    note?: string
    position: number
    addedAt: string
    match: {
      id: string
      homeTeam: string
      awayTeam: string
      homeScore?: number
      awayScore?: number
      date: string
      competition: string
      sport: string
      venue?: string
      homeTeamLogo?: string
      awayTeamLogo?: string
      avgRating: number
      totalRatings: number
    }
  }>
  isOwner: boolean
}

export default function MatchListsSection({ userId, isOwnProfile }: MatchListsProps) {
  const [lists, setLists] = useState<MatchListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingList, setEditingList] = useState<MatchListItem | null>(null)

  useEffect(() => {
    fetchLists()
  }, [userId])

  const fetchLists = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      
      const response = await axios.get(`/api/match-lists?${params}`)
      setLists(response.data.lists || [])
    } catch (error) {
      console.error('❌ Erreur chargement listes:', error)
      setLists([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async (listData: any) => {
    try {
      const response = await axios.post('/api/match-lists', listData)
      if (response.data.success) {
        setLists(prev => [response.data.list, ...prev])
        showNotification(response.data.message, 'success')
        setShowCreateModal(false)
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de la création'
      showNotification(message, 'error')
      throw error
    }
  }

  const handleUpdateList = async (listId: string, listData: any) => {
    try {
      const response = await axios.put('/api/match-lists', { listId, ...listData })
      if (response.data.success) {
        setLists(prev => prev.map(list => 
          list.id === listId ? response.data.list : list
        ))
        showNotification(response.data.message, 'success')
        setEditingList(null)
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de la mise à jour'
      showNotification(message, 'error')
      throw error
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la liste "${listName}" ?`)) {
      return
    }

    try {
      const response = await axios.delete(`/api/match-lists?listId=${listId}`)
      if (response.data.success) {
        setLists(prev => prev.filter(list => list.id !== listId))
        showNotification(response.data.message, 'success')
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de la suppression'
      showNotification(message, 'error')
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="text-xl">${type === 'success' ? '✅' : '❌'}</div>
        <div class="font-medium">${message}</div>
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 4000)
  }

  const getSportEmoji = (sport: string) => {
    const emojis = {
      'FOOTBALL': '⚽',
      'BASKETBALL': '🏀',
      'MMA': '🥊',
      'RUGBY': '🏉',
      'F1': '🏎️'
    }
    return emojis[sport as keyof typeof emojis] || '🏆'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl h-32"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton de création */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            {isOwnProfile ? 'Mes listes' : 'Ses listes'} ({lists.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isOwnProfile 
              ? 'Créez des listes thématiques de vos matchs préférés'
              : 'Les listes publiques de cet utilisateur'
            }
          </p>
        </div>
        
        {isOwnProfile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une liste</span>
          </button>
        )}
      </div>

      {/* Grid des listes */}
      {lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              isOwnProfile={isOwnProfile}
              onEdit={() => setEditingList(list)}
              onDelete={() => handleDeleteList(list.id, list.name)}
              getSportEmoji={getSportEmoji}
            />
          ))}
        </div>
      ) : (
        <EmptyState isOwnProfile={isOwnProfile} onCreateList={() => setShowCreateModal(true)} />
      )}

      {/* Modals */}
      <MatchListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateList}
        mode="create"
      />

      <MatchListModal
        isOpen={!!editingList}
        onClose={() => setEditingList(null)}
        onSave={(data) => handleUpdateList(editingList!.id, data)}
        mode="edit"
        initialData={editingList}
      />
    </div>
  )
}

// Composant pour une carte de liste
function ListCard({ 
  list, 
  isOwnProfile, 
  onEdit, 
  onDelete, 
  getSportEmoji 
}: {
  list: MatchListItem
  isOwnProfile: boolean
  onEdit: () => void
  onDelete: () => void
  getSportEmoji: (sport: string) => string
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Header avec couleur personnalisée */}
      <div className={`h-2 ${list.color ? `bg-${list.color}-500` : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}></div>
      
      <div className="p-4 md:p-6">
        {/* Title et actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {list.emoji && <span className="text-lg">{list.emoji}</span>}
              <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {list.name}
              </h4>
              <div className="flex items-center space-x-1">
                {list.isPublic ? (
                  <Globe className="w-4 h-4 text-green-500" title="Liste publique" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" title="Liste privée" />
                )}
              </div>
            </div>
            {list.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {list.description}
              </p>
            )}
          </div>
          
          {/* Menu actions pour le propriétaire */}
          {isOwnProfile && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-20 min-w-40 overflow-hidden">
                    <button
                      onClick={() => {
                        onEdit()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{list.matchCount} matchs</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{list.likesCount} likes</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(list.updatedAt).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Preview des matchs */}
        {list.matches.length > 0 ? (
          <div className="space-y-2 mb-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Aperçu :</h5>
            <div className="space-y-2">
              {list.matches.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-2 text-sm bg-gray-50 dark:bg-slate-700 rounded-lg p-2">
                  <span className="text-base">{getSportEmoji(item.match.sport)}</span>
                  <span className="flex-1 truncate text-gray-900 dark:text-white">
                    {item.match.homeTeam} vs {item.match.awayTeam}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.match.competition}
                  </span>
                </div>
              ))}
              {list.matchCount > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{list.matchCount - 3} autres matchs
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <Star className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Liste vide</p>
            {isOwnProfile && (
              <p className="text-xs mt-1">Ajoutez des matchs depuis leurs pages</p>
            )}
          </div>
        )}

        {/* Bouton voir plus */}
        <Link
          href={`/lists/${list.id}`}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 group-hover:shadow-md"
        >
          <Eye className="w-4 h-4" />
          <span className="font-medium">Voir la liste</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

// Composant pour l'état vide
function EmptyState({ isOwnProfile, onCreateList }: { isOwnProfile: boolean, onCreateList: () => void }) {
  return (
    <div className="text-center py-12 md:py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Star className="w-10 h-10 text-blue-500" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {isOwnProfile ? 'Aucune liste créée' : 'Aucune liste publique'}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {isOwnProfile 
          ? 'Créez votre première liste pour organiser vos matchs préférés par thème, équipe ou événement !'
          : 'Cet utilisateur n\'a pas encore créé de listes publiques.'
        }
      </p>

      {isOwnProfile && (
        <div className="space-y-4">
          <button
            onClick={onCreateList}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ✨ Créer ma première liste
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>💡 Idées de listes :</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {[
                '🏆 Mes finals préférées',
                '⚽ Meilleurs matchs de Messi', 
                '🏀 Playoffs NBA 2024',
                '🥊 Combats UFC épiques',
                '🏉 Six Nations mémorables'
              ].map((idea, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs"
                >
                  {idea}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}