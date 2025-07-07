// components/TeamSearchModal.tsx - Version corrigée avec modal de confirmation
import { useState, useEffect } from 'react'
import { 
  Search, X, Plus, Check, Filter, Globe, Calendar, Users, Star, 
  Heart, HeartOff, MapPin, Loader2, Trophy
} from 'lucide-react'
import axios from 'axios'

interface Team {
  id: string
  name: string
  logo: string
  sport: string
  league: string
  country: string
  founded?: number
  type: 'team' | 'player'
  isFollowed?: boolean
  followersCount?: number
}

interface TeamSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamToggle: (team: Team, isFollowed: boolean) => Promise<void>
  followedTeams: Team[]
}

export default function TeamSearchModal({ isOpen, onClose, onTeamToggle, followedTeams }: TeamSearchModalProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])
  
  // États pour la confirmation
  const [showConfirmModal, setShowConfirmModal] = useState<Team | null>(null)
  const [actionType, setActionType] = useState<'follow' | 'unfollow'>('follow')
  const [loadingTeams, setLoadingTeams] = useState<Set<string>>(new Set())

  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆' },
    { id: 'football', name: 'Football', emoji: '⚽' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾' },
    { id: 'f1', name: 'Formule 1', emoji: '🏎️' },
    { id: 'mma', name: 'MMA', emoji: '🥊' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen, searchQuery, selectedSport, selectedLeague])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sport: selectedSport,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedLeague !== 'all' && { league: selectedLeague })
      })
      
      const response = await axios.get(`/api/teams/search?${params}`)
      console.log('🔍 Équipes trouvées:', response.data.teams?.length || 0)
      
      const teamsWithFollowStatus = response.data.teams.map((team: Team) => ({
        ...team,
        isFollowed: followedTeams.some(ft => ft.id === team.id),
        followersCount: team.followersCount || 0
      }))
      
      setTeams(teamsWithFollowStatus)
      
      // Extraire les ligues disponibles
      const leagues = [...new Set(response.data.teams.map((team: Team) => team.league))]
      setAvailableLeagues(leagues)
    } catch (error) {
      console.error('❌ Erreur recherche équipes:', error)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const getSportEmoji = (sport: string) => {
    const emojis = {
      football: '⚽',
      basketball: '🏀',
      tennis: '🎾',
      f1: '🏎️',
      mma: '🥊',
      rugby: '🏉'
    }
    return emojis[sport as keyof typeof emojis] || '🏆'
  }

  const handleTeamClick = (team: Team) => {
    const action = team.isFollowed ? 'unfollow' : 'follow'
    setActionType(action)
    setShowConfirmModal(team)
  }

  const confirmAction = async () => {
    if (!showConfirmModal) return
    
    const team = showConfirmModal
    setLoadingTeams(prev => new Set([...prev, team.id]))
    
    try {
      console.log(`🎯 Action ${actionType} pour équipe:`, team.name)
      
      // Appeler la fonction parent pour gérer l'action
      await onTeamToggle(team, team.isFollowed || false)
      
      // Mettre à jour la liste locale immédiatement
      setTeams(prev => prev.map(t => 
        t.id === team.id 
          ? { 
              ...t, 
              isFollowed: !t.isFollowed,
              followersCount: (t.followersCount || 0) + (t.isFollowed ? -1 : 1)
            }
          : t
      ))
      
      setShowConfirmModal(null)
      
      // Feedback mobile
      showMobileToast(
        team.isFollowed 
          ? `❌ ${team.name} retiré de vos suivis`
          : `✅ ${team.name} ajouté à vos suivis`,
        team.isFollowed ? 'warning' : 'success'
      )
      
      console.log('✅ Action réussie pour:', team.name)
      
    } catch (error) {
      console.error('❌ Erreur action équipe:', error)
      showMobileToast('❌ Erreur lors de l\'action', 'error')
    } finally {
      setLoadingTeams(prev => {
        const newSet = new Set(prev)
        newSet.delete(team.id)
        return newSet
      })
    }
  }

  const showMobileToast = (message: string, type: 'success' | 'warning' | 'error') => {
    const toast = document.createElement('div')
    const colors = {
      success: 'bg-green-500',
      warning: 'bg-orange-500', 
      error: 'bg-red-500'
    }
    
    toast.className = `fixed top-4 left-4 right-4 z-[60] ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 font-medium text-center`
    toast.textContent = message
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.style.transform = 'translateY(-100px)'
      toast.style.opacity = '0'
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Découvrir des équipes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Trouvez et suivez vos équipes et joueurs préférés
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filtres */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700 space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une équipe ou un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filtres par sport et ligue */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sport</label>
                <select
                  value={selectedSport}
                  onChange={(e) => {
                    setSelectedSport(e.target.value)
                    setSelectedLeague('all')
                  }}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {sport.emoji} {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ligue</label>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les ligues</option>
                  {availableLeagues.map(league => (
                    <option key={league} value={league}>{league}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="p-6 overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Recherche en cours...</span>
              </div>
            ) : teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer ${
                      team.isFollowed
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-300'
                    } active:scale-95`}
                    onClick={() => handleTeamClick(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Logo */}
                        {team.logo && team.logo.startsWith('http') ? (
                          <img 
                            src={team.logo} 
                            alt={team.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm text-2xl"
                          style={{ display: team.logo?.startsWith('http') ? 'none' : 'flex' }}
                        >
                          {getSportEmoji(team.sport)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {team.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Globe className="w-3 h-3" />
                              <span>{team.country}</span>
                            </span>
                            {team.founded && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{team.founded}</span>
                              </span>
                            )}
                            {team.type === 'player' && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                Joueur
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {team.league} • {team.sport}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bouton d'action ou loading */}
                      <div className="ml-3">
                        {loadingTeams.has(team.id) ? (
                          <div className="flex items-center justify-center w-20 h-10">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          </div>
                        ) : (
                          <button
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium min-w-[80px] justify-center ${
                              team.isFollowed
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTeamClick(team)
                            }}
                          >
                            {team.isFollowed ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Suivi</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>Suivre</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucune équipe trouvée
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Essayez de modifier votre recherche ou vos filtres
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {followedTeams.length} équipe{followedTeams.length > 1 ? 's' : ''} suivie{followedTeams.length > 1 ? 's' : ''}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md transform transition-all">
            
            {/* Header du modal */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-600">
              <div className="flex items-center space-x-4">
                {/* Logo équipe */}
                <div className="relative">
                  {showConfirmModal.logo && showConfirmModal.logo.startsWith('http') ? (
                    <img
                      src={showConfirmModal.logo}
                      alt={showConfirmModal.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-slate-600"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
                    style={{ display: showConfirmModal.logo?.startsWith('http') ? 'none' : 'flex' }}
                  >
                    <span className="text-2xl text-white">{getSportEmoji(showConfirmModal.sport)}</span>
                  </div>
                  
                  {/* Badge sport */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center">
                    <span className="text-lg">{getSportEmoji(showConfirmModal.sport)}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {showConfirmModal.name}
                  </h3>
                  {showConfirmModal.league && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {showConfirmModal.league}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {showConfirmModal.country && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{showConfirmModal.country}</span>
                      </div>
                    )}
                    {showConfirmModal.founded && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{showConfirmModal.founded}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="p-6">
              <div className="text-center mb-6">
                {actionType === 'follow' ? (
                  <div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Suivre {showConfirmModal.type === 'player' ? 'ce joueur' : 'cette équipe'} ?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {showConfirmModal.type === 'player' 
                        ? 'Vous pourrez suivre les performances de ce joueur'
                        : 'Vous recevrez des notifications et pourrez suivre leurs performances'
                      }
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HeartOff className="w-8 h-8 text-red-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Ne plus suivre ?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {showConfirmModal.type === 'player' 
                        ? 'Vous ne suivrez plus ce joueur'
                        : 'Vous ne recevrez plus de notifications de cette équipe'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    actionType === 'follow'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {actionType === 'follow' ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Heart className="w-4 h-4" />
                      <span>Suivre</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <HeartOff className="w-4 h-4" />
                      <span>Ne plus suivre</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}