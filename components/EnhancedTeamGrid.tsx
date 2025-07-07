// components/EnhancedTeamGrid.tsx - Version mobile optimisée CORRIGÉE
import { useState } from 'react'
import { 
  Heart, 
  HeartOff, 
  MapPin, 
  Calendar, 
  Globe, 
  Users, 
  Trophy,
  Star,
  Plus,
  Check,
  X,
  Loader2,
  Filter
} from 'lucide-react'

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
  website?: string
}

interface EnhancedTeamGridProps {
  teams: Team[]
  onTeamToggle: (team: Team, isFollowed: boolean) => Promise<void>
  isOwnProfile: boolean
  showFollowButton?: boolean
}

export default function EnhancedTeamGrid({ 
  teams, 
  onTeamToggle, 
  isOwnProfile, 
  showFollowButton = true 
}: EnhancedTeamGridProps) {
  const [loadingTeams, setLoadingTeams] = useState<Set<string>>(new Set())
  const [showConfirmModal, setShowConfirmModal] = useState<Team | null>(null)
  const [actionType, setActionType] = useState<'follow' | 'unfollow'>('follow')
  const [filterSport, setFilterSport] = useState<string>('all')

  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆' },
    { id: 'football', name: 'Football', emoji: '⚽' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾' },
    { id: 'f1', name: 'F1', emoji: '🏎️' },
    { id: 'mma', name: 'MMA', emoji: '🥊' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉' }
  ]

  // Grouper les équipes par sport
  const filteredTeams = teams.filter(team => 
    filterSport === 'all' || team.sport.toLowerCase() === filterSport
  )

  const teamsBySport = filteredTeams.reduce((acc, team) => {
    const sport = team.sport.toLowerCase()
    if (!acc[sport]) acc[sport] = []
    acc[sport].push(team)
    return acc
  }, {} as Record<string, Team[]>)

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

  const getSportName = (sport: string) => {
    const names = {
      football: 'Football',
      basketball: 'Basketball', 
      tennis: 'Tennis',
      f1: 'Formule 1',
      mma: 'MMA',
      rugby: 'Rugby'
    }
    return names[sport as keyof typeof names] || sport.charAt(0).toUpperCase() + sport.slice(1)
  }

  const handleTeamClick = (team: Team) => {
    if (!isOwnProfile || !showFollowButton) return
    
    const action = team.isFollowed ? 'unfollow' : 'follow'
    setActionType(action)
    setShowConfirmModal(team)
  }

  const confirmAction = async () => {
    if (!showConfirmModal) return
    
    const team = showConfirmModal
    setLoadingTeams(prev => new Set([...prev, team.id]))
    
    try {
      await onTeamToggle(team, team.isFollowed)
      setShowConfirmModal(null)
      
      // Feedback mobile
      showMobileToast(
        team.isFollowed 
          ? `❌ ${team.name} retiré de vos suivis`
          : `✅ ${team.name} ajouté à vos suivis`,
        team.isFollowed ? 'warning' : 'success'
      )
    } catch (error) {
      console.error('Erreur toggle team:', error)
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
    
    toast.className = `fixed top-4 left-4 right-4 z-50 ${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg transform transition-all duration-300 font-medium text-center`
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

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {isOwnProfile ? 'Aucune équipe suivie' : 'Aucune équipe suivie'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {isOwnProfile 
            ? 'Découvrez et suivez vos équipes préférées pour rester au courant de leurs performances'
            : 'Cet utilisateur ne suit aucune équipe pour le moment'
          }
        </p>
        {isOwnProfile && (
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>💡 Comment suivre des équipes :</p>
            <p>1. Cliquez sur le bouton "Découvrir" ci-dessus</p>
            <p>2. Recherchez vos équipes préférées</p>
            <p>3. Cliquez sur ❤️ pour les suivre</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filtre par sport */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>
                  {sport.emoji} {sport.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTeams.length} équipe{filteredTeams.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Affichage par sport */}
        {Object.entries(teamsBySport).map(([sport, sportTeams]) => (
          <div key={sport}>
            {/* Header par sport */}
            <div className="flex items-center space-x-3 mb-4 pb-2 border-b border-gray-200 dark:border-slate-600">
              <span className="text-2xl">{getSportEmoji(sport)}</span>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {getSportName(sport)}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                {sportTeams.length} équipe{sportTeams.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Grid mobile-friendly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sportTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isOwnProfile={isOwnProfile}
                  showFollowButton={showFollowButton}
                  isLoading={loadingTeams.has(team.id)}
                  onClick={() => handleTeamClick(team)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Stats récapitulatives */}
        {filteredTeams.length > 0 && (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Répartition par sport
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sports.slice(1).map(sport => {
                const sportTeams = teams.filter(team => team.sport.toLowerCase() === sport.id)
                if (sportTeams.length === 0) return null
                
                return (
                  <div key={sport.id} className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <div className="text-2xl mb-1">{sport.emoji}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {sportTeams.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {sport.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation mobile */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
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
                      Suivre cette équipe ?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Vous recevrez des notifications et pourrez suivre leurs performances
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
                      Vous ne recevrez plus de notifications de cette équipe
                    </p>
                    {showConfirmModal.followedSince && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Suivi depuis {new Date(showConfirmModal.followedSince).toLocaleDateString('fr-FR')}
                      </p>
                    )}
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

// Composant carte d'équipe optimisé mobile
function TeamCard({ 
  team, 
  isOwnProfile, 
  showFollowButton,
  isLoading, 
  onClick 
}: { 
  team: Team
  isOwnProfile: boolean
  showFollowButton: boolean
  isLoading: boolean
  onClick: () => void
}) {
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

  return (
    <div 
      className={`bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
        isOwnProfile && showFollowButton ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 active:scale-95' : ''
      }`}
      onClick={isOwnProfile && showFollowButton ? onClick : undefined}
    >
      {/* Header avec logo */}
      <div className="relative">
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-600 dark:to-slate-700 p-4 text-center">
          {team.logo && team.logo.startsWith('http') ? (
            <img
              src={team.logo}
              alt={team.name}
              className="w-16 h-16 mx-auto rounded-xl object-cover border-2 border-white dark:border-slate-600 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm"
            style={{ display: team.logo?.startsWith('http') ? 'none' : 'flex' }}
          >
            <span className="text-3xl text-white">{getSportEmoji(team.sport)}</span>
          </div>
        </div>

        {/* Badge sport */}
        <div className="absolute top-2 right-2 bg-white dark:bg-slate-800 rounded-full px-2 py-1 border border-gray-200 dark:border-slate-600">
          <span className="text-lg">{getSportEmoji(team.sport)}</span>
        </div>

        {/* Badge suivi */}
        {team.isFollowed && (
          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1.5">
            <Heart className="w-4 h-4 fill-current" />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h4 className="font-bold text-gray-900 dark:text-white text-center mb-3 line-clamp-2 min-h-[3rem] flex items-center justify-center">
          {team.name}
        </h4>

        {/* Infos équipe */}
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          {team.league && (
            <div className="flex items-center justify-center space-x-1">
              <Trophy className="w-3 h-3" />
              <span className="truncate">{team.league}</span>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-3">
            {team.country && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{team.country}</span>
              </div>
            )}
            {team.founded && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{team.founded}</span>
              </div>
            )}
          </div>

          {team.followersCount > 0 && (
            <div className="flex items-center justify-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{team.followersCount} suiveur{team.followersCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Bouton d'action ou status */}
        {isOwnProfile && showFollowButton ? (
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
                team.isFollowed
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Action...</span>
                </div>
              ) : team.isFollowed ? (
                <div className="flex items-center justify-center space-x-2">
                  <HeartOff className="w-4 h-4" />
                  <span>Ne plus suivre</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Suivre</span>
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              team.isFollowed
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
            }`}>
              {team.isFollowed ? (
                <>
                  <Heart className="w-3 h-3 fill-current" />
                  <span>Suivi</span>
                </>
              ) : (
                <>
                  <span>Non suivi</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Date de suivi */}
        {team.isFollowed && team.followedSince && (
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Suivi depuis {new Date(team.followedSince).toLocaleDateString('fr-FR', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}