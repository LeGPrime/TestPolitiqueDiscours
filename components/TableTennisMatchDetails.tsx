// components/TableTennisMatchDetails.tsx
import { useState } from 'react'
import { 
  Target, UserCheck, BarChart3, 
  Activity, Trophy, Flag, Crown, Zap, 
  ChevronDown, Timer
} from 'lucide-react'

interface TableTennisMatchDetailsProps {
  matchDetails: {
    match: {
      id: string
      homeTeam: string // Joueur 1
      awayTeam: string // Joueur 2
      homeScore: number | null // Sets gagnés joueur 1
      awayScore: number | null // Sets gagnés joueur 2
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
      set?: number
      score?: string
    }>
    statistics: {
      home: Record<string, any>
      away: Record<string, any>
    }
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function TableTennisMatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: TableTennisMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'players'>('overview')
  const [showMatchSummary, setShowMatchSummary] = useState(true)
  
  const { match, events, statistics } = matchDetails

  // Analyser le résultat
  const getMatchResult = () => {
    if (match.homeScore === null || match.awayScore === null) {
      return { result: 'En cours', winner: null, method: null }
    }
    
    if (match.homeScore > match.awayScore) {
      return { result: `${match.homeTeam} gagne`, winner: match.homeTeam, method: `${match.homeScore}-${match.awayScore} en sets` }
    } else if (match.awayScore > match.homeScore) {
      return { result: `${match.awayTeam} gagne`, winner: match.awayTeam, method: `${match.awayScore}-${match.homeScore} en sets` }
    }
    
    return { result: 'Match terminé', winner: null, method: null }
  }

  const matchResult = getMatchResult()

  // Sets importants
  const importantSets = events.filter(e => 
    e.type === 'SET_WON' || 
    e.type === 'MATCH_POINT' || 
    e.type === 'COMEBACK'
  )

  // Données des joueurs
  const getPlayersForRating = () => {
    return [
      {
        id: `${match.homeTeam}_tabletennis_p1`.replace(/\s+/g, '_'),
        name: match.homeTeam,
        position: 'Joueur 1',
        number: null,
        team: 'Player 1',
        sets: match.homeScore
      },
      {
        id: `${match.awayTeam}_tabletennis_p2`.replace(/\s+/g, '_'),
        name: match.awayTeam,
        position: 'Joueur 2',
        number: null,
        team: 'Player 2',
        sets: match.awayScore
      }
    ]
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* TABS NAVIGATION */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 p-2 min-w-full md:min-w-0 md:justify-center">
            {[
              { 
                id: 'overview', 
                label: 'Vue d\'ensemble', 
                icon: Target, 
                shortLabel: 'Résumé',
                color: 'cyan',
                description: 'Résumé du match'
              },
              { 
                id: 'stats', 
                label: 'Statistiques', 
                icon: BarChart3, 
                shortLabel: 'Stats',
                color: 'blue',
                description: 'Stats du match'
              },
              { 
                id: 'players', 
                label: 'Joueurs', 
                icon: UserCheck, 
                shortLabel: 'Joueurs',
                color: 'indigo',
                description: 'Noter les joueurs'
              }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 flex flex-col items-center space-y-2 px-4 py-3 md:px-6 md:py-4 rounded-xl font-medium text-sm transition-all duration-300 min-w-[100px] md:min-w-[140px] ${
                    isActive
                      ? `bg-gradient-to-br ${
                          tab.color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
                          tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          'from-indigo-500 to-indigo-600'
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
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setShowMatchSummary(!showMatchSummary)}
                className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors rounded-2xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">🏓 Résumé du match</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {matchResult.result} • {importantSets.length} sets clés
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMatchSummary ? 'rotate-180' : ''}`} />
              </button>

              {showMatchSummary && (
                <div className="px-4 pb-4 md:px-6 md:pb-6">
                  {/* Résultat principal */}
                  <div className="mb-6">
                    <div className={`text-center p-6 rounded-xl ${
                      matchResult.winner 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700'
                        : 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700'
                    }`}>
                      <div className="text-3xl mb-2">
                        {matchResult.winner ? '🏆' : '🏓'}
                      </div>
                      <h3 className={`text-xl font-bold ${
                        matchResult.winner 
                          ? 'text-green-800 dark:text-green-300' 
                          : 'text-cyan-800 dark:text-cyan-300'
                      }`}>
                        {matchResult.result}
                      </h3>
                      {matchResult.method && (
                        <p className={`text-sm mt-1 ${
                          matchResult.winner 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-cyan-600 dark:text-cyan-400'
                        }`}>
                          {matchResult.method}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sets importants */}
                  {importantSets.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-cyan-500" />
                        <span>Sets décisifs</span>
                      </h5>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {importantSets.map((set, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                            <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {set.set || index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {set.player}
                                </span>
                                <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-full">
                                  Set {set.set}
                                </span>
                              </div>
                              {set.score && (
                                <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">
                                  Score: {set.score}
                                </p>
                              )}
                              {set.detail && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {set.detail}
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
          <TableTennisStatsTab 
            statistics={statistics} 
            homePlayer={match.homeTeam} 
            awayPlayer={match.awayTeam}
            matchResult={matchResult}
            match={match}
          />
        )}
        
        {/* TAB 3: JOUEURS */}
        {activeTab === 'players' && (
          <TableTennisPlayersTab
            players={getPlayersForRating()}
            playerRatings={playerRatings}
            onRatePlayer={onRatePlayer}
            currentUserId={currentUserId}
            matchResult={matchResult}
          />
        )}
      </div>
    </div>
  )
}

// 📊 COMPOSANT STATS TENNIS DE TABLE
function TableTennisStatsTab({ statistics, homePlayer, awayPlayer, matchResult, match }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>📊 Statistiques du match</span>
        </h2>

        {/* Score par sets */}
        <div className="mb-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-900 dark:text-white">Score par sets</h3>
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{homePlayer}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Joueur 1</div>
              <div className="text-3xl font-black text-cyan-600 mt-2">{match.homeScore ?? '?'}</div>
              <div className="text-sm text-cyan-600 dark:text-cyan-400">sets</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">🏓</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{matchResult.result}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{awayPlayer}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Joueur 2</div>
              <div className="text-3xl font-black text-blue-600 mt-2">{match.awayScore ?? '?'}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">sets</div>
            </div>
          </div>
        </div>

        {/* Stats détaillées */}
        {Object.keys(statistics).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-3">
                🏓 {homePlayer}
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(statistics.home || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-cyan-700 dark:text-cyan-300">{key}:</span>
                    <span className="font-medium text-cyan-900 dark:text-cyan-100">{value}</span>
                  </div>
                ))}
                {Object.keys(statistics.home || {}).length === 0 && (
                  <p className="text-cyan-600 dark:text-cyan-400 text-xs italic">Stats détaillées non disponibles</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                🏓 {awayPlayer}
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(statistics.away || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">{key}:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">{value}</span>
                  </div>
                ))}
                {Object.keys(statistics.away || {}).length === 0 && (
                  <p className="text-blue-600 dark:text-blue-400 text-xs italic">Stats détaillées non disponibles</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 👥 COMPOSANT NOTATION JOUEURS
function TableTennisPlayersTab({ players, playerRatings, onRatePlayer, currentUserId, matchResult }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <UserCheck className="w-6 h-6 text-indigo-600" />
          <span>👥 Noter les joueurs</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {players.map((player: any) => (
            <TableTennisPlayerCard
              key={player.id}
              player={player}
              playerRatings={playerRatings}
              onRatePlayer={onRatePlayer}
              currentUserId={currentUserId}
              isWinner={matchResult.winner === player.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// 🎭 COMPOSANT CARTE JOUEUR
function TableTennisPlayerCard({ player, playerRatings, onRatePlayer, currentUserId, isWinner }: any) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        : player.team === 'Player 1'
        ? 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-700'
        : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700'
    }`}>
      
      {isWinner && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="text-center mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${
          player.team === 'Player 1'
            ? 'bg-cyan-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          🏓
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{player.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {player.position} • {player.sets ?? '?'} sets
        </p>
      </div>

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
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
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
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Votre avis sur sa performance..."
                maxLength={200}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
              className="bg-cyan-600 text-white py-2 px-6 rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
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