// components/TennisMatchDetails.tsx - VERSION SPÉCIALISÉE TENNIS
import { useState, useEffect } from 'react'
import { 
  Target, AlertTriangle, RefreshCw, UserCheck, BarChart3, 
  Activity, Trophy, Flag, Clock, MapPin, Users, ChevronDown, ChevronUp,
  Star, TrendingUp, Award, User, MessageCircle
} from 'lucide-react'

interface TennisMatchDetailsProps {
  matchDetails: {
    match: {
      id: string
      homeTeam: string
      awayTeam: string
      homeScore: number
      awayScore: number
      date: string
      venue: string
      referee: string
      attendance?: number
      details?: any
    }
    events: Array<{
      minute: number
      type: 'GOAL' | 'CARD' | 'SUBSTITUTION'
      team: string
      player: string
      detail?: string
      assist?: string
    }>
    lineups: {
      home: any
      away: any
    }
    statistics: {
      home: Record<string, any>
      away: Record<string, any>
    }
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function TennisMatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: TennisMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'comparison'>('individual')
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [currentRating, setCurrentRating] = useState(0)
  const [currentComment, setCurrentComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  const { match } = matchDetails

  // 🎾 EXTRAIRE LES JOUEURS TENNIS (2 joueurs seulement)
  const getTennisPlayers = () => {
    const players = [
      {
        id: `${match.homeTeam}_PLAYER`.replace(/\s+/g, '_'),
        name: match.homeTeam,
        team: match.homeTeam,
        position: 'Joueur 1',
        sets: match.homeScore || 0,
        isWinner: (match.homeScore || 0) > (match.awayScore || 0)
      },
      {
        id: `${match.awayTeam}_PLAYER`.replace(/\s+/g, '_'),
        name: match.awayTeam,
        team: match.awayTeam,
        position: 'Joueur 2',
        sets: match.awayScore || 0,
        isWinner: (match.awayScore || 0) > (match.homeScore || 0)
      }
    ]

    return players
  }

  const players = getTennisPlayers()

  // 🎾 OBTENIR LES RATINGS D'UN JOUEUR
  const getPlayerRatings = (playerId: string) => {
    return playerRatings.filter(rating => rating.playerId === playerId)
  }

  const getPlayerAverageRating = (playerId: string) => {
    const ratings = getPlayerRatings(playerId)
    if (ratings.length === 0) return 0
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
  }

  const getUserRatingForPlayer = (playerId: string) => {
    return playerRatings.find(r => r.playerId === playerId && r.userId === currentUserId)
  }

  // 🎾 GÉRER LA NOTATION
  const handleRatePlayer = async (playerId: string) => {
    if (!currentUserId) {
      alert('Connectez-vous pour noter les joueurs')
      return
    }

    const existingRating = getUserRatingForPlayer(playerId)
    
    setSelectedPlayer(playerId)
    setCurrentRating(existingRating?.rating || 0)
    setCurrentComment(existingRating?.comment || '')
    setShowRatingModal(true)
  }

  const submitPlayerRating = async () => {
    if (!selectedPlayer || currentRating === 0) return

    setSubmittingRating(true)
    try {
      await onRatePlayer(selectedPlayer, currentRating, currentComment)
      setShowRatingModal(false)
      setSelectedPlayer(null)
      setCurrentRating(0)
      setCurrentComment('')
    } catch (error) {
      console.error('Erreur notation joueur:', error)
    } finally {
      setSubmittingRating(false)
    }
  }

  // 🎾 FORMATAGE SCORE TENNIS
  const formatTennisScore = () => {
    if (!match.details?.scores) {
      return {
        sets: `${match.homeScore || 0}-${match.awayScore || 0}`,
        games: null
      }
    }

    const scores = match.details.scores
    const setsDisplay = `${scores.player1?.sets || 0}-${scores.player2?.sets || 0}`
    
    let gamesDisplay = ''
    if (scores.player1?.games && scores.player2?.games) {
      const gameSets = scores.player1.games.map((g1: number, i: number) => {
        const g2 = scores.player2.games[i] || 0
        return `${g1}-${g2}`
      })
      gamesDisplay = gameSets.join(', ')
    }

    return {
      sets: setsDisplay,
      games: gamesDisplay
    }
  }

  const tennisScore = formatTennisScore()

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 🎾 HEADER SPÉCIAL TENNIS */}
      <div className="bg-gradient-to-r from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 rounded-2xl p-4 md:p-6 border border-yellow-200 dark:border-yellow-700">
        <div className="text-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <span>🎾 Notation des Joueurs</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Notez individuellement la performance de chaque joueur sur 10
          </p>
        </div>

        {/* Score recap */}
        <div className="bg-white/60 dark:bg-slate-700/60 rounded-xl p-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Score final: {tennisScore.sets}
            </div>
            {tennisScore.games && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Détail: {tennisScore.games}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎾 NAVIGATION TENNIS SPÉCIALISÉE */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 font-medium transition-all duration-300 ${
              activeTab === 'individual'
                ? 'bg-gradient-to-r from-yellow-500 to-green-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Notation Individuelle</span>
          </button>
          
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 font-medium transition-all duration-300 ${
              activeTab === 'comparison'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Comparaison</span>
          </button>
        </div>
      </div>

      {/* 🎾 CONTENU SPÉCIALISÉ */}
      <div className="min-h-[60vh]">
        {/* TAB 1: NOTATION INDIVIDUELLE */}
        {activeTab === 'individual' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {players.map((player, index) => {
                const playerRatings = getPlayerRatings(player.id)
                const avgRating = getPlayerAverageRating(player.id)
                const userRating = getUserRatingForPlayer(player.id)
                
                return (
                  <div 
                    key={player.id} 
                    className={`bg-gradient-to-br ${
                      player.isWinner 
                        ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
                        : 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'
                    } rounded-2xl p-6 border`}
                  >
                    {/* Header joueur */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 ${
                        player.isWinner ? 'bg-green-600' : 'bg-blue-600'
                      } rounded-full flex items-center justify-center mx-auto mb-3 relative`}>
                        <span className="text-2xl text-white">🎾</span>
                        {player.isWinner && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Trophy className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {player.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {player.position} • {player.sets} set{player.sets > 1 ? 's' : ''}
                      </p>
                      
                      {player.isWinner && (
                        <div className="inline-flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                          <Trophy className="w-3 h-3" />
                          <span>Vainqueur</span>
                        </div>
                      )}
                    </div>

                    {/* Stats du joueur */}
                    <div className="bg-white/60 dark:bg-slate-700/60 rounded-xl p-4 mb-6">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Moyenne</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {playerRatings.length}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Vote{playerRatings.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      
                      {avgRating > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-center space-x-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < avgRating / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action notation */}
                    {currentUserId ? (
                      <div className="space-y-3">
                        {userRating ? (
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                Votre note: {userRating.rating}/10
                              </span>
                              <div className="flex space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < userRating.rating / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {userRating.comment && (
                              <p className="text-xs text-green-700 dark:text-green-400 italic">
                                "{userRating.comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                              Vous n'avez pas encore noté ce joueur
                            </p>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleRatePlayer(player.id)}
                          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                            player.isWinner 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                          } shadow-lg hover:shadow-xl transform hover:scale-105`}
                        >
                          {userRating ? '✏️ Modifier ma note' : '⭐ Noter ce joueur'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Connectez-vous pour noter ce joueur
                        </p>
                        <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">
                          Se connecter
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Commentaires récents */}
            {playerRatings.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span>Commentaires récents</span>
                </h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {playerRatings
                    .filter(rating => rating.comment)
                    .slice(0, 5)
                    .map((rating, index) => {
                      const player = players.find(p => p.id === rating.playerId)
                      
                      return (
                        <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {rating.user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {rating.user.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {player?.name}
                                </span>
                                <div className="flex space-x-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < rating.rating / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                "{rating.comment}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* TAB 2: COMPARAISON */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <span>📊 Comparaison des Performances</span>
              </h2>

              {/* Comparaison notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {players.map((player) => {
                  const avgRating = getPlayerAverageRating(player.id)
                  const totalRatings = getPlayerRatings(player.id).length
                  
                  return (
                    <div key={player.id} className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {player.name}
                      </h3>
                      
                      <div className={`text-4xl font-black mb-2 ${
                        player.isWinner ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {totalRatings} note{totalRatings > 1 ? 's' : ''}
                      </div>
                      
                      {avgRating > 0 && (
                        <div className="flex justify-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < avgRating / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Barre de comparaison */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Comparaison directe
                </h4>
                
                <div className="space-y-4">
                  {/* Notes moyennes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes moyennes</span>
                    </div>
                    
                    <div className="flex h-6 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      {(() => {
                        const avg1 = getPlayerAverageRating(players[0].id)
                        const avg2 = getPlayerAverageRating(players[1].id)
                        const total = avg1 + avg2
                        
                        if (total === 0) {
                          return (
                            <div className="w-full bg-gray-300 dark:bg-slate-500 flex items-center justify-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Aucune note</span>
                            </div>
                          )
                        }
                        
                        const percent1 = (avg1 / total) * 100
                        const percent2 = (avg2 / total) * 100
                        
                        return (
                          <>
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${percent1}%` }}
                            >
                              {avg1.toFixed(1)}
                            </div>
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${percent2}%` }}
                            >
                              {avg2.toFixed(1)}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{players[0].name}</span>
                      <span>{players[1].name}</span>
                    </div>
                  </div>

                  {/* Nombre de votes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de votes</span>
                    </div>
                    
                    <div className="flex h-6 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      {(() => {
                        const votes1 = getPlayerRatings(players[0].id).length
                        const votes2 = getPlayerRatings(players[1].id).length
                        const total = votes1 + votes2
                        
                        if (total === 0) {
                          return (
                            <div className="w-full bg-gray-300 dark:bg-slate-500 flex items-center justify-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Aucun vote</span>
                            </div>
                          )
                        }
                        
                        const percent1 = (votes1 / total) * 100
                        const percent2 = (votes2 / total) * 100
                        
                        return (
                          <>
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${percent1}%` }}
                            >
                              {votes1}
                            </div>
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${percent2}%` }}
                            >
                              {votes2}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Résumé du match */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span>Résumé du match</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {tennisScore.sets}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Score final</div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {match.details?.surface || 'Hard'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Surface</div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {players.find(p => p.isWinner)?.name || 'Match nul'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Vainqueur</div>
                  </div>
                </div>
                
                {tennisScore.games && (
                  <div className="mt-3 text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Détail des jeux</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {tennisScore.games}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎾 MODAL DE NOTATION */}
      {showRatingModal && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRatingModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-600">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-green-600 p-4 text-white">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🎾</span>
                </div>
                <h2 className="text-xl font-bold">Noter ce joueur</h2>
                <p className="text-white/90 text-sm">
                  {players.find(p => p.id === selectedPlayer)?.name}
                </p>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Note sur 10 :
                  </label>
                  <div className="flex justify-center space-x-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentRating(i + 1)}
                        className={`w-8 h-8 rounded-full font-bold text-sm transition-all duration-200 ${
                          i + 1 <= currentRating
                            ? 'bg-yellow-500 text-white shadow-lg scale-110'
                            : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-slate-500'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  {currentRating > 0 && (
                    <div className="text-center mt-3">
                      <div className="flex justify-center space-x-1 mb-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < currentRating / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentRating === 1 && "⭐ Très faible"}
                        {currentRating === 2 && "⭐⭐ Faible"}
                        {currentRating === 3 && "⭐⭐ Moyen-"}
                        {currentRating === 4 && "⭐⭐ Moyen"}
                        {currentRating === 5 && "⭐⭐⭐ Moyen+"}
                        {currentRating === 6 && "⭐⭐⭐ Bien"}
                        {currentRating === 7 && "⭐⭐⭐⭐ Très bien"}
                        {currentRating === 8 && "⭐⭐⭐⭐ Excellent"}
                        {currentRating === 9 && "⭐⭐⭐⭐⭐ Exceptionnel"}
                        {currentRating === 10 && "⭐⭐⭐⭐⭐ Parfait"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Commentaire (optionnel) :
                  </label>
                  <textarea
                    value={currentComment}
                    onChange={(e) => setCurrentComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    rows={3}
                    placeholder="Qu'avez-vous pensé de sa performance ?"
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {currentComment.length}/200 caractères
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowRatingModal(false)}
                  disabled={submittingRating}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={submitPlayerRating}
                  disabled={currentRating === 0 || submittingRating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-green-600 hover:from-yellow-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg transition-all disabled:cursor-not-allowed font-semibold"
                >
                  {submittingRating ? '⏳ Envoi...' : '⭐ Noter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}