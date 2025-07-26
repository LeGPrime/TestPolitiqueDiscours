// components/ChessMatchDetails.tsx
import { useState, useEffect } from 'react'
import { 
  Target, AlertTriangle, RefreshCw, UserCheck, BarChart3, 
  Activity, Trophy, Flag, Clock, MapPin, Users, ChevronDown, ChevronUp,
  Crown, Zap, Brain, Timer
} from 'lucide-react'

interface ChessMatchDetailsProps {
  matchDetails: {
    match: {
      id: string
      homeTeam: string // Joueur 1 (Blancs)
      awayTeam: string // Joueur 2 (Noirs)
      homeScore: number | null // Score joueur 1
      awayScore: number | null // Score joueur 2
      date: string
      venue: string
      referee: string
      competition: string
      details?: any
    }
    events: Array<{
      minute: number
      type: string
      team: string
      player: string
      detail?: string
      move?: string
      notation?: string
    }>
    lineups: any // Non utilisé pour les échecs
    statistics: {
      home: Record<string, any>
      away: Record<string, any>
    }
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function ChessMatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: ChessMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'players'>('overview')
  const [showGameSummary, setShowGameSummary] = useState(true)
  
  const { match, events, statistics } = matchDetails

  // Analyser le résultat de la partie
  const getGameResult = () => {
    if (match.homeScore === null || match.awayScore === null) {
      return { result: 'En cours', winner: null, method: null }
    }
    
    if (match.homeScore === 1 && match.awayScore === 0) {
      return { result: `${match.homeTeam} gagne`, winner: match.homeTeam, method: match.details?.method || 'Victoire' }
    } else if (match.homeScore === 0 && match.awayScore === 1) {
      return { result: `${match.awayTeam} gagne`, winner: match.awayTeam, method: match.details?.method || 'Victoire' }
    } else if (match.homeScore === 0.5 && match.awayScore === 0.5) {
      return { result: 'Match nul', winner: null, method: match.details?.method || 'Nulle' }
    }
    
    return { result: 'Partie terminée', winner: null, method: null }
  }

  const gameResult = getGameResult()

  // Extraire les coups importants
  const importantMoves = events.filter(e => 
    e.type === 'CRITICAL_MOVE' || 
    e.type === 'BLUNDER' || 
    e.type === 'BRILLIANT_MOVE' ||
    e.type === 'CHECKMATE' ||
    e.type === 'CHECK'
  )

  // Données des joueurs pour notation
  const getPlayersForRating = () => {
    return [
      {
        id: `${match.homeTeam}_chess_white`.replace(/\s+/g, '_'),
        name: match.homeTeam,
        position: 'Blancs',
        number: null,
        team: 'Blancs',
        color: 'white',
        score: match.homeScore
      },
      {
        id: `${match.awayTeam}_chess_black`.replace(/\s+/g, '_'),
        name: match.awayTeam,
        position: 'Noirs', 
        number: null,
        team: 'Noirs',
        color: 'black',
        score: match.awayScore
      }
    ]
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* TABS NAVIGATION - Adapté pour les échecs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 p-2 min-w-full md:min-w-0 md:justify-center">
            {[
              { 
                id: 'overview', 
                label: 'Vue d\'ensemble', 
                icon: Target, 
                shortLabel: 'Résumé',
                color: 'slate',
                description: 'Résumé de la partie'
              },
              { 
                id: 'stats', 
                label: 'Statistiques', 
                icon: BarChart3, 
                shortLabel: 'Stats',
                color: 'purple',
                description: 'Stats de la partie'
              },
              { 
                id: 'players', 
                label: 'Joueurs', 
                icon: UserCheck, 
                shortLabel: 'Joueurs',
                color: 'blue',
                description: 'Noter les joueurs'
              }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 flex flex-col items-center space-y-2 px-4 py-3 md:px-6 md:py-4 rounded-xl font-medium text-sm transition-all duration-300 min-w-[100px] md:min-w-[140px] relative ${
                    isActive
                      ? `bg-gradient-to-br ${
                          tab.color === 'slate' ? 'from-slate-500 to-slate-600' :
                          tab.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          'from-blue-500 to-blue-600'
                        } text-white shadow-lg scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  <div className="text-center">
                    <div className="font-bold text-xs md:text-sm">
                      {typeof window !== 'undefined' && window.innerWidth < 768 ? tab.shortLabel : tab.label}
                    </div>
                    {isActive && (
                      <div className="text-xs opacity-90 hidden md:block">
                        {tab.description}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CONTENU DES TABS */}
      <div className="min-h-[60vh]">
        {/* TAB 1: VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Résumé de la partie */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setShowGameSummary(!showGameSummary)}
                className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors rounded-2xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">♟️ Résumé de la partie</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {gameResult.result} • {importantMoves.length} coups clés
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showGameSummary ? 'rotate-180' : ''}`} />
              </button>

              {showGameSummary && (
                <div className="px-4 pb-4 md:px-6 md:pb-6">
                  {/* Résultat principal */}
                  <div className="mb-6">
                    <div className={`text-center p-6 rounded-xl ${
                      gameResult.winner 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700'
                    }`}>
                      <div className="text-3xl mb-2">
                        {gameResult.winner ? '👑' : '🤝'}
                      </div>
                      <h3 className={`text-xl font-bold ${
                        gameResult.winner 
                          ? 'text-green-800 dark:text-green-300' 
                          : 'text-blue-800 dark:text-blue-300'
                      }`}>
                        {gameResult.result}
                      </h3>
                      {gameResult.method && (
                        <p className={`text-sm mt-1 ${
                          gameResult.winner 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          Par {gameResult.method}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coups importants */}
                  {importantMoves.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span>Moments clés de la partie</span>
                      </h5>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {importantMoves.map((move, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              move.type === 'BRILLIANT_MOVE' ? 'bg-yellow-500' :
                              move.type === 'BLUNDER' ? 'bg-red-500' :
                              move.type === 'CHECKMATE' ? 'bg-green-500' :
                              move.type === 'CHECK' ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`}>
                              {move.minute}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {move.player}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  move.type === 'BRILLIANT_MOVE' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                                  move.type === 'BLUNDER' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                                  move.type === 'CHECKMATE' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                                  move.type === 'CHECK' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                                  'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {move.type === 'BRILLIANT_MOVE' ? '⭐ Brilliant' :
                                   move.type === 'BLUNDER' ? '💥 Blunder' :
                                   move.type === 'CHECKMATE' ? '♔ Échec et mat' :
                                   move.type === 'CHECK' ? '♔ Échec' :
                                   'Coup clé'}
                                </span>
                              </div>
                              {move.notation && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                                  {move.notation}
                                </p>
                              )}
                              {move.detail && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {move.detail}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* TAB 2: STATISTIQUES */}
        {activeTab === 'stats' && (
          <ChessStatsTab 
            statistics={statistics} 
            homePlayer={match.homeTeam} 
            awayPlayer={match.awayTeam}
            gameResult={gameResult}
            match={match}
          />
        )}
        
        {/* TAB 3: JOUEURS (Notation individuelle) */}
        {activeTab === 'players' && (
          <ChessPlayersTab
            players={getPlayersForRating()}
            playerRatings={playerRatings}
            onRatePlayer={onRatePlayer}
            currentUserId={currentUserId}
            gameResult={gameResult}
          />
        )}
      </div>
    </div>
  )
}

// 📊 COMPOSANT STATS ÉCHECS
function ChessStatsTab({ statistics, homePlayer, awayPlayer, gameResult, match }: any) {
  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <span>📊 Statistiques de la partie</span>
        </h2>

        {/* Score final */}
        <div className="mb-6 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-900 dark:text-white">Score Final</h3>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{homePlayer}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Blancs</div>
              <div className="text-3xl font-black text-blue-600 mt-2">{match.homeScore ?? '?'}</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold">VS</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{gameResult.result}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{awayPlayer}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Noirs</div>
              <div className="text-3xl font-black text-red-600 mt-2">{match.awayScore ?? '?'}</div>
            </div>
          </div>
        </div>

        {/* Stats détaillées si disponibles */}
        {Object.keys(statistics).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center space-x-2">
                <div className="w-6 h-6 bg-white rounded border-2 border-gray-800"></div>
                <span>{homePlayer} (Blancs)</span>
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(statistics.home || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">{key}:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">{value}</span>
                  </div>
                ))}
                {Object.keys(statistics.home || {}).length === 0 && (
                  <p className="text-blue-600 dark:text-blue-400 text-xs italic">Statistiques détaillées non disponibles</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-300 mb-3 flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-800 dark:bg-gray-200 rounded"></div>
                <span>{awayPlayer} (Noirs)</span>
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(statistics.away || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{key}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
                  </div>
                ))}
                {Object.keys(statistics.away || {}).length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-xs italic">Statistiques détaillées non disponibles</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Infos de la partie */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4">
          <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center space-x-2">
            <Flag className="w-5 h-5" />
            <span>Informations de la partie</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700 dark:text-purple-300">Tournoi:</span>
              <span className="font-medium text-purple-900 dark:text-purple-100">{match.competition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700 dark:text-purple-300">Date:</span>
              <span className="font-medium text-purple-900 dark:text-purple-100">
                {new Date(match.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700 dark:text-purple-300">Lieu:</span>
              <span className="font-medium text-purple-900 dark:text-purple-100">{match.venue}</span>
            </div>
            {match.referee && (
              <div className="flex justify-between">
                <span className="text-purple-700 dark:text-purple-300">Arbitre:</span>
                <span className="font-medium text-purple-900 dark:text-purple-100">{match.referee}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 👥 COMPOSANT NOTATION JOUEURS ÉCHECS
function ChessPlayersTab({ players, playerRatings, onRatePlayer, currentUserId, gameResult }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          <span>👥 Noter les joueurs</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {players.map((player: any) => (
            <ChessPlayerCard
              key={player.id}
              player={player}
              playerRatings={playerRatings}
              onRatePlayer={onRatePlayer}
              currentUserId={currentUserId}
              isWinner={gameResult.winner === player.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// 🎭 COMPOSANT CARTE JOUEUR ÉCHECS
function ChessPlayerCard({ player, playerRatings, onRatePlayer, currentUserId, isWinner }: any) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Trouver la note existante
  const existingRating = playerRatings.find(r => r.playerId === player.id && r.userId === currentUserId)
  
  const handleSubmit = async () => {
    if (rating === 0) return
    
    setIsSubmitting(true)
    try {
      await onRatePlayer(player.id, rating, comment)
      setShowRatingForm(false)
      setRating(0)
      setComment('')
    } catch (error) {
      console.error('Erreur notation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`relative rounded-xl p-6 border-2 transition-all ${
      isWinner 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
        : player.color === 'white'
        ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700'
        : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-600'
    }`}>
      
      {/* Badge winner */}
      {isWinner && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Info joueur */}
      <div className="text-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${
          player.color === 'white'
            ? 'bg-white border-4 border-gray-800 text-gray-800'
            : 'bg-gray-800 border-4 border-white text-white'
        }`}>
          ♔
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{player.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {player.position} • Score: {player.score ?? '?'}
        </p>
      </div>

      {/* Notation existante ou formulaire */}
      {existingRating ? (
        <div className="text-center">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 mb-3">
            <div className="text-green-800 dark:text-green-300 font-semibold">
              ⭐ Votre note: {existingRating.rating}/10
            </div>
            {existingRating.comment && (
              <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                "{existingRating.comment}"
              </p>
            )}
          </div>
          <button
            onClick={() => setShowRatingForm(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Modifier ma note
          </button>
        </div>
      ) : currentUserId ? (
        showRatingForm ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note /10:
              </label>
              <div className="flex space-x-1 justify-center">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                      i < rating 
                        ? 'bg-yellow-500 text-white scale-110' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-yellow-200 dark:hover:bg-yellow-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Commentaire (optionnel):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Votre avis sur sa performance..."
                maxLength={200}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSubmitting ? 'Envoi...' : '⭐ Noter'}
              </button>
              <button
                onClick={() => {
                  setShowRatingForm(false)
                  setRating(0)
                  setComment('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowRatingForm(true)}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ⭐ Noter ce joueur
            </button>
          </div>
        )
      ) : (
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Connectez-vous pour noter
          </p>
        </div>
      )}
    </div>
  )
}