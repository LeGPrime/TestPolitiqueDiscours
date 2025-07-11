// components/ManOfMatchWidget.tsx - Widget pour voter et voir l'homme du match
import { useState, useEffect } from 'react'
import { Trophy, Star, Users, Eye, EyeOff, MessageCircle, Crown, Award, Medal, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'

interface ManOfMatchWidgetProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  sport: 'FOOTBALL' | 'BASKETBALL' | 'RUGBY' | 'MMA' | 'F1'
  players: Array<{
    id: string
    name: string
    position?: string
    number?: number
    team: string
  }>
  currentUserId?: string
}

interface Vote {
  id: string
  userId: string
  playerId: string
  comment?: string
  createdAt: string
  user: {
    id: string
    name?: string
    username?: string
    image?: string
  }
  player: {
    id: string
    name: string
    position?: string
    number?: number
    team: string
  }
}

interface PlayerVoteStats {
  player: {
    id: string
    name: string
    position?: string
    number?: number
    team: string
  }
  votes: Vote[]
  count: number
}

export default function ManOfMatchWidget({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  sport,
  players, 
  currentUserId 
}: ManOfMatchWidgetProps) {
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [comment, setComment] = useState('')
  const [expanded, setExpanded] = useState(false)
  
  // States pour les données
  const [votes, setVotes] = useState<Vote[]>([])
  const [playerVotes, setPlayerVotes] = useState<Record<string, PlayerVoteStats>>({})
  const [userVote, setUserVote] = useState<Vote | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (matchId) {
      fetchVotes()
    }
  }, [matchId, showComments])

  const fetchVotes = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/man-of-match?matchId=${matchId}&includeComments=${showComments}`)
      
      if (response.data.success) {
        setVotes(response.data.votes)
        setPlayerVotes(response.data.playerVotes)
        setUserVote(response.data.userVote)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error('Erreur chargement votes:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitVote = async () => {
    if (!selectedPlayer) return

    try {
      setVoting(true)
      const response = await axios.post('/api/man-of-match', {
        playerId: selectedPlayer,
        matchId,
        comment: comment.trim() || null
      })

      if (response.data.success) {
        // Notification de succès
        showNotification('success', response.data.message)
        
        // Réinitialiser le formulaire
        setShowVoteModal(false)
        setSelectedPlayer('')
        setComment('')
        
        // Recharger les votes
        await fetchVotes()
      }
    } catch (error: any) {
      console.error('Erreur vote:', error)
      showNotification('error', error.response?.data?.error || 'Erreur lors du vote')
    } finally {
      setVoting(false)
    }
  }

  const deleteVote = async () => {
    try {
      const response = await axios.delete(`/api/man-of-match?matchId=${matchId}`)
      
      if (response.data.success) {
        showNotification('success', 'Vote supprimé')
        await fetchVotes()
      }
    } catch (error: any) {
      console.error('Erreur suppression vote:', error)
      showNotification('error', error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="text-xl">${type === 'success' ? '✅' : '❌'}</div>
        <div class="font-semibold">${message}</div>
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 4000)
  }

  const getSportEmoji = () => {
    const emojis = {
      'FOOTBALL': '⚽',
      'BASKETBALL': '🏀',
      'RUGBY': '🏉',
      'MMA': '🥊',
      'F1': '🏎️'
    }
    return emojis[sport] || '🏆'
  }

  const getSportTitle = () => {
    const titles = {
      'FOOTBALL': 'Homme du Match',
      'BASKETBALL': 'MVP du Match',
      'RUGBY': 'Homme du Match',
      'MMA': 'Fighter of the Night',
      'F1': 'Driver of the Day'
    }
    return titles[sport] || 'Joueur du Match'
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-500" />
      case 1: return <Award className="w-5 h-5 text-gray-500" />
      case 2: return <Medal className="w-5 h-5 text-orange-500" />
      default: return <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
    }
  }

  const getRankBgColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-br from-yellow-400 to-amber-500'
      case 1: return 'bg-gradient-to-br from-gray-400 to-slate-500'
      case 2: return 'bg-gradient-to-br from-orange-500 to-red-600'
      default: return 'bg-gradient-to-br from-blue-500 to-indigo-600'
    }
  }

  // Filtrer uniquement les joueurs (pas les coachs)
  const eligiblePlayers = players.filter(p => p.position !== 'COACH')

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (eligiblePlayers.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span>{getSportEmoji()} {getSportTitle()}</span>
        </h4>
        <div className="text-center py-6">
          <p className="text-gray-600">Aucun joueur éligible pour ce match</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg overflow-hidden border border-yellow-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 md:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold">{getSportEmoji()} {getSportTitle()}</h4>
              <p className="text-white/90 text-sm">Qui a été le meilleur ?</p>
            </div>
          </div>
          
          {/* Toggle visibilité des avis */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              {showComments ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {showComments ? 'Masquer' : 'Voir'} avis
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Stats générales */}
        {stats && stats.totalVotes > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.totalVotes}</div>
                <div className="text-xs text-gray-600">Vote{stats.totalVotes > 1 ? 's' : ''}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.uniquePlayers}</div>
                <div className="text-xs text-gray-600">Candidat{stats.uniquePlayers > 1 ? 's' : ''}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.leader ? `${stats.leader.votes}` : '—'}
                </div>
                <div className="text-xs text-gray-600">Max votes</div>
              </div>
            </div>

            {/* Leader actuel */}
            {stats.leader && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-bold text-gray-900">{stats.leader.player.name}</h5>
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        Leader
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stats.leader.player.position} • {stats.leader.player.team}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-600">{stats.leader.votes}</div>
                    <div className="text-sm text-gray-600">{stats.leader.percentage}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bouton de vote */}
        {currentUserId && (
          <div className="mb-6">
            {userVote ? (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="font-semibold text-green-800">Votre vote : {userVote.player.name}</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {userVote.player.position} • {userVote.player.team}
                    </p>
                    {showComments && userVote.comment && (
                      <p className="text-sm text-green-600 italic mt-2">{userVote.comment}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowVoteModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={deleteVote}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowVoteModal(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🗳️ Voter pour l'{getSportTitle().toLowerCase()}
              </button>
            )}
          </div>
        )}

        {/* Top 3 ou classement */}
        {stats && stats.topThree && stats.topThree.length > 0 && (
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>Classement actuel</span>
            </h5>

            {/* Affichage compact par défaut */}
            <div className="space-y-3">
              {stats.topThree.slice(0, expanded ? stats.topThree.length : 3).map((playerStats: any, index: number) => (
                <div key={playerStats.player.id} className="bg-white/60 rounded-xl p-3 flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${getRankBgColor(index)}`}>
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 truncate">{playerStats.player.name}</span>
                      {index === 0 && stats.totalVotes > 2 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          En tête
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {playerStats.player.position} • {playerStats.player.team}
                    </div>
                    
                    {/* Votants récents visibles seulement si on voit les avis */}
                    {showComments && playerStats.recentVoters && playerStats.recentVoters.length > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Récemment: {playerStats.recentVoters.map((voter: any) => voter.name || 'Anonyme').join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{playerStats.votes}</div>
                    <div className="text-sm text-gray-600">{playerStats.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton pour étendre/réduire */}
            {stats.topThree.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center space-x-2 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {expanded ? 'Voir moins' : `Voir tous les candidats (${stats.topThree.length})`}
                </span>
              </button>
            )}
          </div>
        )}

        {/* État vide */}
        {(!stats || stats.totalVotes === 0) && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-yellow-800 font-medium mb-2">Aucun vote pour le moment</p>
            <p className="text-yellow-600 text-sm">
              Soyez le premier à voter pour l'{getSportTitle().toLowerCase()} !
            </p>
          </div>
        )}

        {/* Commentaires détaillés si activés et expandés */}
        {showComments && expanded && stats && stats.totalVotes > 0 && (
          <div className="mt-6 pt-6 border-t border-yellow-200">
            <h6 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-orange-500" />
              <span>Derniers avis ({votes.filter(v => v.comment).length})</span>
            </h6>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {votes
                .filter(vote => vote.comment && vote.comment.trim())
                .slice(0, 10)
                .map(vote => (
                  <div key={vote.id} className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {vote.user.name || vote.user.username || 'Anonyme'}
                        </span>
                        <span className="text-xs text-gray-500">→</span>
                        <span className="font-medium text-orange-600 text-sm">
                          {vote.player.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(vote.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{vote.comment}"</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de vote */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {getSportEmoji()} Voter pour l'{getSportTitle().toLowerCase()}
                </h3>
                <button
                  onClick={() => setShowVoteModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Sélection du joueur */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choisissez le {getSportTitle().toLowerCase()} :
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {/* Grouper par équipe */}
                    {[homeTeam, awayTeam].map(team => {
                      const teamPlayers = eligiblePlayers.filter(p => p.team === team)
                      if (teamPlayers.length === 0) return null
                      
                      return (
                        <div key={team} className="mb-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2 px-2">
                            {team} ({teamPlayers.length} joueur{teamPlayers.length > 1 ? 's' : ''})
                          </h4>
                          <div className="space-y-1">
                            {teamPlayers.map(player => (
                              <label
                                key={player.id}
                                className={`block p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                                  selectedPlayer === player.id
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="player"
                                  value={player.id}
                                  checked={selectedPlayer === player.id}
                                  onChange={(e) => setSelectedPlayer(e.target.value)}
                                  className="sr-only"
                                />
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{player.name}</div>
                                    <div className="text-sm text-gray-600">
                                      {player.position}
                                      {player.number && ` • #${player.number}`}
                                    </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedPlayer === player.id
                                      ? 'border-yellow-500 bg-yellow-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedPlayer === player.id && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Commentaire optionnel */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    💭 Pourquoi ce choix ? (optionnel)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Expliquez votre choix..."
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {comment.length}/200 caractères
                  </div>
                </div>

                {/* Aperçu du vote actuel s'il existe */}
                {userVote && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Vote actuel :</strong> {userVote.player.name}
                    </p>
                    {userVote.comment && (
                      <p className="text-sm text-blue-600 italic">"{userVote.comment}"</p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      Ce vote sera remplacé par votre nouveau choix
                    </p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowVoteModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submitVote}
                    disabled={!selectedPlayer || voting}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedPlayer && !voting
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 shadow-lg'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {voting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Envoi...</span>
                      </div>
                    ) : (
                      '🗳️ Confirmer le vote'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}