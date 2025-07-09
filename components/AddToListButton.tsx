// components/AddToListButton.tsx
import { useState, useEffect } from 'react'
import { Plus, Check, X, Star, Edit, Trash2 } from 'lucide-react'
import axios from 'axios'

interface AddToListButtonProps {
  matchId: string
  matchTitle: string
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md' | 'lg'
}

interface MatchList {
  id: string
  name: string
  emoji?: string
  color?: string
  isInList: boolean
  matchCount: number
}

export default function AddToListButton({ 
  matchId, 
  matchTitle, 
  variant = 'button',
  size = 'md' 
}: AddToListButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [lists, setLists] = useState<MatchList[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUserLists = async () => {
    try {
      setLoading(true)
      
      // Récupérer les listes de l'utilisateur
      const listsResponse = await axios.get('/api/match-lists')
      const userLists = listsResponse.data.lists || []
      
      // Vérifier pour chaque liste si le match est déjà dedans
      const listsWithStatus = await Promise.all(
        userLists.map(async (list: any) => {
          try {
            const itemsResponse = await axios.get(`/api/match-list-items?listId=${list.id}`)
            const isInList = itemsResponse.data.items?.some((item: any) => item.match.id === matchId) || false
            
            return {
              id: list.id,
              name: list.name,
              emoji: list.emoji,
              color: list.color,
              isInList,
              matchCount: list.matchCount
            }
          } catch (error) {
            return {
              id: list.id,
              name: list.name,
              emoji: list.emoji,
              color: list.color,
              isInList: false,
              matchCount: list.matchCount
            }
          }
        })
      )
      
      setLists(listsWithStatus)
    } catch (error) {
      console.error('❌ Erreur chargement listes:', error)
      setLists([])
    } finally {
      setLoading(false)
    }
  }

  const toggleMatchInList = async (listId: string, isCurrentlyInList: boolean) => {
    try {
      setActionLoading(listId)
      
      const action = isCurrentlyInList ? 'remove' : 'add'
      const response = await axios.post('/api/match-list-items', {
        action,
        listId,
        matchId
      })
      
      if (response.data.success) {
        // Mettre à jour l'état local
        setLists(prev => prev.map(list => 
          list.id === listId 
            ? { ...list, isInList: !isCurrentlyInList }
            : list
        ))
        
        // Notification de succès
        showNotification(response.data.message, 'success')
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de l\'action'
      showNotification(message, 'error')
    } finally {
      setActionLoading(null)
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

  const handleOpenModal = () => {
    setShowModal(true)
    fetchUserLists()
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm'
      case 'lg': return 'px-6 py-4 text-lg'
      default: return 'px-4 py-3 text-base'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4'
      case 'lg': return 'w-6 h-6'
      default: return 'w-5 h-5'
    }
  }

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleOpenModal}
          className={`p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
            size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2'
          }`}
          title="Ajouter à une liste"
        >
          <Plus className={getIconSize() + ' text-gray-600 dark:text-gray-400'} />
        </button>
        
        {showModal && (
          <AddToListModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            lists={lists}
            loading={loading}
            actionLoading={actionLoading}
            onToggle={toggleMatchInList}
            matchTitle={matchTitle}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 ${getSizeClasses()}`}
      >
        <Plus className={getIconSize()} />
        <span>Ajouter à une liste</span>
      </button>

      {showModal && (
        <AddToListModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          lists={lists}
          loading={loading}
          actionLoading={actionLoading}
          onToggle={toggleMatchInList}
          matchTitle={matchTitle}
        />
      )}
    </>
  )
}

// Modal pour afficher les listes
function AddToListModal({
  isOpen,
  onClose,
  lists,
  loading,
  actionLoading,
  onToggle,
  matchTitle
}: {
  isOpen: boolean
  onClose: () => void
  lists: MatchList[]
  loading: boolean
  actionLoading: string | null
  onToggle: (listId: string, isInList: boolean) => void
  matchTitle: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Ajouter à une liste
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
              {matchTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-16"></div>
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="p-6 text-center">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune liste
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Créez votre première liste pour commencer à organiser vos matchs !
              </p>
              <button
                onClick={() => {
                  onClose()
                  // Rediriger vers le profil avec l'onglet listes
                  window.location.href = '/profile?tab=lists'
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                Créer une liste
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Indicateur couleur */}
                    <div className={`w-3 h-3 rounded-full ${
                      list.color ? `bg-${list.color}-500` : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    }`}></div>
                    
                    {/* Emoji et nom */}
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {list.emoji && <span className="text-lg">{list.emoji}</span>}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {list.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {list.matchCount} match{list.matchCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bouton toggle */}
                  <button
                    onClick={() => onToggle(list.id, list.isInList)}
                    disabled={actionLoading === list.id}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                      list.isInList
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                    }`}
                  >
                    {actionLoading === list.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : list.isInList ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Dans la liste</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Ajouter</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {lists.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {lists.filter(l => l.isInList).length} / {lists.length} listes
              </span>
              <button
                onClick={() => {
                  onClose()
                  window.location.href = '/profile?tab=lists'
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Gérer mes listes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}