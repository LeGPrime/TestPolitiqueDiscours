// components/BoxingMatchDetails.tsx - VERSION SIMPLE
import { useState } from 'react'
import { UserCheck, BarChart3, Crown } from 'lucide-react'

export default function BoxingMatchDetails({ matchDetails, playerRatings, onRatePlayer, currentUserId }: any) {
  const [activeTab, setActiveTab] = useState<'stats' | 'players'>('stats')
  const { match } = matchDetails

  const getResult = () => {
    const method = match.details?.method || 'Décision'
    if (match.homeScore === 1) return { winner: match.homeTeam, method }
    if (match.awayScore === 1) return { winner: match.awayTeam, method }
    return { winner: null, method }
  }

  const result = getResult()

  const getBoxersForRating = () => [
    { id: `${match.homeTeam}_boxing`.replace(/\s+/g, '_'), name: match.homeTeam, position: 'Boxeur A', team: 'Red Corner' },
    { id: `${match.awayTeam}_boxing`.replace(/\s+/g, '_'), name: match.awayTeam, position: 'Boxeur B', team: 'Blue Corner' }
  ]

  return (
    <div className="space-y-4">
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} sport="🥊" />
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <span>🥊</span><span>Combat de Boxe</span>
            </h2>
            
            <div className="bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{match.homeTeam} vs {match.awayTeam}</div>
                {result.winner ? (
                  <div>
                    <div className="text-green-600 font-bold">🏆 {result.winner} gagne</div>
                    <div className="text-sm text-gray-600">Par {result.method}</div>
                  </div>
                ) : (
                  <div className="text-gray-600">Combat terminé</div>
                )}
              </div>
            </div>

            <MatchInfo match={match} />
          </div>
        )}

        {activeTab === 'players' && (
          <PlayersRating 
            title="Noter les boxeurs"
            players={getBoxersForRating()}
            playerRatings={playerRatings}
            onRatePlayer={onRatePlayer}
            currentUserId={currentUserId}
            result={result}
            emoji="🥊"
          />
        )}
      </div>
    </div>
  )
}

// COMPOSANTS UTILITAIRES PARTAGÉS

function TabNavigation({ activeTab, setActiveTab, sport }: any) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className="flex p-2">
        {[
          { id: 'stats', label: 'Statistiques', icon: BarChart3, color: 'blue' },
          { id: 'players', label: 'Noter les joueurs', icon: UserCheck, color: 'green' }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? `bg-gradient-to-br ${tab.color === 'blue' ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'} text-white shadow-lg`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MatchInfo({ match }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-400">Compétition:</span>
        <span className="font-medium">{match.competition}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-400">Date:</span>
        <span className="font-medium">{new Date(match.date).toLocaleDateString('fr-FR')}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-400">Lieu:</span>
        <span className="font-medium">{match.venue}</span>
      </div>
    </div>
  )
}

function PlayersRating({ title, players, playerRatings, onRatePlayer, currentUserId, result, emoji, single = false }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
        <UserCheck className="w-6 h-6" />
        <span>{title}</span>
      </h2>

      <div className={`grid gap-6 ${single ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
        {players.map((player: any) => (
          <PlayerCard
            key={player.id}
            player={player}
            playerRatings={playerRatings}
            onRatePlayer={onRatePlayer}
            currentUserId={currentUserId}
            isWinner={result.winner === player.name}
            emoji={emoji}
          />
        ))}
      </div>
    </div>
  )
}

function PlayerCard({ player, playerRatings, onRatePlayer, currentUserId, isWinner, emoji }: any) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const existingRating = playerRatings.find(r => r.playerId === player.id && r.userId === currentUserId)

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    try {
      await onRatePlayer(player.id, rating, comment)
      setShowForm(false)
      setRating(0)
      setComment('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`p-6 rounded-xl border-2 transition-all ${
      isWinner 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
        : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-600'
    }`}>
      {isWinner && (
        <div className="flex justify-center mb-2">
          <Crown className="w-6 h-6 text-yellow-500" />
        </div>
      )}
      
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {player.score !== undefined ? `Score: ${player.score}` : 
           player.finalPosition ? `${player.finalPosition}e position` :
           player.sets !== undefined ? `${player.sets} sets` : player.position}
        </p>
      </div>

      {existingRating ? (
        <div className="text-center">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 mb-2">
            <div className="text-green-800 dark:text-green-300 font-semibold">
              ⭐ Note: {existingRating.rating}/10
            </div>
            {existingRating.comment && (
              <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                "{existingRating.comment}"
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Modifier ma note
          </button>
        </div>
      ) : currentUserId ? (
        showForm ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note /10:
              </label>
              <div className="flex justify-center space-x-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                      i < rating 
                        ? 'bg-yellow-500 text-white scale-110' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-yellow-200'
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
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Votre avis sur sa performance..."
                maxLength={200}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Envoi...' : '⭐ Noter'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
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
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ⭐ Noter
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