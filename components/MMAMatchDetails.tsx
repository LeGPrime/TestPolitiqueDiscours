// components/MMAMatchDetails.tsx - VERSION COMPLÈTE AVEC STATS ET FEATURES
import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Clock, 
  Target, 
  Zap, 
  Award,
  TrendingUp,
  Star,
  MessageCircle,
  Eye,
  EyeOff,
  Timer,
  Activity,
  BarChart3,
  User,
  Crown,
  Flame
} from 'lucide-react'

interface MMAMatchDetailsProps {
  matchDetails: {
    match: {
      id: string
      sport: string
      homeTeam: string
      awayTeam: string
      homeScore: number | null
      awayScore: number | null
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
      round?: number
      method?: string
    }>
    lineups: any
    statistics: any
  }
  playerRatings: Array<{
    id: string
    userId: string
    playerId: string
    rating: number
    comment?: string
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
      team: string
    }
  }>
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function MMAMatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: MMAMatchDetailsProps) {
  const { match, events, statistics } = matchDetails
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showSpoilers, setShowSpoilers] = useState(true)

  // Extraire les informations du combat
  const fighter1 = match.homeTeam
  const fighter2 = match.awayTeam
  const winner = match.homeScore === 1 ? fighter1 : match.awayScore === 1 ? fighter2 : null
  const method = match.details?.method || match.details?.api_data?.processed?.result?.method || 'Decision'
  const round = match.details?.round || match.details?.api_data?.processed?.round || 'N/A'
  const time = match.details?.time || match.details?.api_data?.processed?.time || 'N/A'
  
  // Statistiques des combattants depuis tale_of_the_tape
  const taleOfTape = match.details?.tale_of_the_tape || match.details?.api_data?.tale_of_the_tape || {}
  
  // Cotes si disponibles
  const odds = match.details?.odds || match.details?.api_data?.odds || null

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Eye },
    { id: 'fighters', label: 'Combattants', icon: User },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'ratings', label: 'Notes', icon: Star }
  ]

  return (
    <div className="space-y-6">
      {/* Header du combat */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Combat MMA</h2>
              <p className="text-white/90">{match.competition}</p>
            </div>
          </div>
          
          {/* Toggle spoilers */}
          <button
            onClick={() => setShowSpoilers(!showSpoilers)}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all"
          >
            {showSpoilers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showSpoilers ? 'Masquer résultat' : 'Voir résultat'}
            </span>
          </button>
        </div>

        {/* Résultat du combat */}
        <div className="bg-white/10 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Combattant 1 */}
            <div className={`text-center ${winner === fighter1 ? 'text-yellow-300' : 'text-white/80'}`}>
              <div className="flex items-center justify-center mb-2">
                {winner === fighter1 && <Crown className="w-5 h-5 mr-2 text-yellow-300" />}
                <h3 className="text-lg font-bold">{fighter1}</h3>
              </div>
              {getFighterRecord(fighter1, taleOfTape) && (
                <p className="text-sm opacity-90">{getFighterRecord(fighter1, taleOfTape)}</p>
              )}
            </div>

            {/* VS / Résultat */}
            <div className="text-center">
              {showSpoilers && winner ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">VICTOIRE</div>
                  <div className="text-sm bg-white/20 rounded-lg px-3 py-1 inline-block">
                    {method} • R{round} • {time}
                  </div>
                </div>
              ) : (
                <div className="text-4xl font-bold opacity-60">VS</div>
              )}
            </div>

            {/* Combattant 2 */}
            <div className={`text-center ${winner === fighter2 ? 'text-yellow-300' : 'text-white/80'}`}>
              <div className="flex items-center justify-center mb-2">
                <h3 className="text-lg font-bold">{fighter2}</h3>
                {winner === fighter2 && <Crown className="w-5 h-5 ml-2 text-yellow-300" />}
              </div>
              {getFighterRecord(fighter2, taleOfTape) && (
                <p className="text-sm opacity-90">{getFighterRecord(fighter2, taleOfTape)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                selectedTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenu des tabs */}
      <div className="space-y-6">
        {/* Tab Overview */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Informations du combat */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-red-500" />
                <span>Détails du combat</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Événement</span>
                    <span className="font-medium text-gray-900 dark:text-white">{match.competition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lieu</span>
                    <span className="font-medium text-gray-900 dark:text-white">{match.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(match.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                {showSpoilers && winner && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Vainqueur</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{winner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Méthode</span>
                      <span className="font-medium text-gray-900 dark:text-white">{method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Round</span>
                      <span className="font-medium text-gray-900 dark:text-white">{round}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Temps</span>
                      <span className="font-medium text-gray-900 dark:text-white">{time}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cotes (si disponibles) */}
            {odds && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Cotes de paris</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(odds).map(([fighter, fightOdds]: [string, any]) => (
                    <div key={fighter} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{fighter}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Américaine</span>
                          <span className="font-medium">{fightOdds.American}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Décimale</span>
                          <span className="font-medium">{fightOdds.Decimal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Probabilité</span>
                          <span className="font-medium">{fightOdds['Implied Probability']}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Combattants */}
        {selectedTab === 'fighters' && (
          <div className="space-y-6">
            <FighterProfilesSection 
              fighter1={fighter1}
              fighter2={fighter2}
              taleOfTape={taleOfTape}
              winner={winner}
              showSpoilers={showSpoilers}
            />
          </div>
        )}

        {/* Tab Statistiques */}
        {selectedTab === 'stats' && (
          <div className="space-y-6">
            <FightStatisticsSection 
              taleOfTape={taleOfTape}
              fighter1={fighter1}
              fighter2={fighter2}
            />
          </div>
        )}

        {/* Tab Notations */}
        {selectedTab === 'ratings' && (
          <div className="space-y-6">
            <FighterRatingsSection
              fighter1={fighter1}
              fighter2={fighter2}
              playerRatings={playerRatings}
              onRatePlayer={onRatePlayer}
              currentUserId={currentUserId}
              matchId={match.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Composant pour les profils des combattants
function FighterProfilesSection({ fighter1, fighter2, taleOfTape, winner, showSpoilers }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[fighter1, fighter2].map((fighter, index) => (
        <div key={fighter} className="bg-white dark:bg-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
              showSpoilers && winner === fighter ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {fighter[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <span>{fighter}</span>
                {showSpoilers && winner === fighter && <Crown className="w-5 h-5 text-yellow-500" />}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {getFighterRecord(fighter, taleOfTape) || 'Record non disponible'}
              </p>
            </div>
          </div>

          {/* Stats du combattant */}
          <div className="space-y-3">
            {getFighterStats(fighter, taleOfTape).map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Composant pour les statistiques du combat
function FightStatisticsSection({ taleOfTape, fighter1, fighter2 }: any) {
  if (!taleOfTape || Object.keys(taleOfTape).length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Statistiques non disponibles
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Les statistiques détaillées ne sont pas disponibles pour ce combat.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
        <BarChart3 className="w-5 h-5 text-blue-500" />
        <span>Comparaison des combattants</span>
      </h3>

      <div className="space-y-4">
        {Object.entries(taleOfTape).map(([statName, statData]: [string, any]) => {
          if (!statData || typeof statData !== 'object') return null
          
          const fighter1Stat = statData[fighter1]
          const fighter2Stat = statData[fighter2]
          
          if (!fighter1Stat && !fighter2Stat) return null

          return (
            <div key={statName} className="border-b border-gray-200 dark:border-slate-700 pb-4 last:border-b-0">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">{statName}</h4>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fighter1Stat || 'N/A'}
                  </span>
                </div>
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  VS
                </div>
                <div className="text-left">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fighter2Stat || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant pour noter les combattants
function FighterRatingsSection({ 
  fighter1, 
  fighter2, 
  playerRatings, 
  onRatePlayer, 
  currentUserId, 
  matchId 
}: any) {
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const fighters = [fighter1, fighter2]

  const handleRating = async () => {
    if (!selectedFighter || rating === 0 || loading) return

    setLoading(true)
    try {
      // Créer un ID unique pour le combattant
      const playerId = `${selectedFighter}_${matchId}`.replace(/\s+/g, '_')
      
      await onRatePlayer(playerId, rating, comment)
      
      // Reset form
      setSelectedFighter(null)
      setRating(0)
      setComment('')
    } catch (error) {
      console.error('Erreur notation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFighterRatings = (fighterName: string) => {
    return playerRatings.filter(r => 
      r.player.name.includes(fighterName) || 
      r.playerId.includes(fighterName.replace(/\s+/g, '_'))
    )
  }

  return (
    <div className="space-y-6">
      {/* Sélection du combattant à noter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span>Noter un combattant</span>
        </h3>

        {!selectedFighter ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fighters.map((fighter) => (
              <button
                key={fighter}
                onClick={() => setSelectedFighter(fighter)}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2 group-hover:scale-110 transition-transform">
                    {fighter[0]}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{fighter}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Noter {selectedFighter}
              </h4>
              <button
                onClick={() => {
                  setSelectedFighter(null)
                  setRating(0)
                  setComment('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Annuler
              </button>
            </div>

            {/* Étoiles de notation */}
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 cursor-pointer transition-all ${
                    i < rating 
                      ? 'text-yellow-400 fill-current hover:scale-110' 
                      : 'text-gray-300 hover:text-yellow-300 hover:scale-105'
                  }`}
                  onClick={() => setRating(i + 1)}
                />
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                {rating}/10 - {getRatingLabel(rating)}
              </p>
            )}

            {/* Commentaire */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Votre avis sur la performance de ${selectedFighter}...`}
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
              rows={3}
              maxLength={200}
            />

            <button
              onClick={handleRating}
              disabled={rating === 0 || loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Notation...' : `Noter ${selectedFighter} - ${rating}/10`}
            </button>
          </div>
        )}
      </div>

      {/* Affichage des notes existantes */}
      {fighters.map((fighter) => {
        const fighterRatings = getFighterRatings(fighter)
        if (fighterRatings.length === 0) return null

        const avgRating = fighterRatings.reduce((sum, r) => sum + r.rating, 0) / fighterRatings.length

        return (
          <div key={fighter} className="bg-white dark:bg-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notes pour {fighter}
              </h4>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {avgRating.toFixed(1)}/10
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({fighterRatings.length} note{fighterRatings.length > 1 ? 's' : ''})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {fighterRatings.map((rating) => (
                <div key={rating.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {rating.user.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rating.user.name || rating.user.username}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-bold text-gray-900 dark:text-white">
                          {rating.rating}/10
                        </span>
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Fonctions utilitaires
function getFighterRecord(fighter: string, taleOfTape: any): string | null {
  if (!taleOfTape || !taleOfTape['Wins/Losses/Draws']) return null
  return taleOfTape['Wins/Losses/Draws'][fighter] || null
}

function getFighterStats(fighter: string, taleOfTape: any): Array<{ label: string; value: string }> {
  if (!taleOfTape) return []
  
  const stats = []
  const statFields = [
    { key: 'Height', label: 'Taille' },
    { key: 'Weight', label: 'Poids' },
    { key: 'Reach', label: 'Allonge' },
    { key: 'Stance', label: 'Stance' },
    { key: 'Striking Accuracy', label: 'Précision de frappe' },
    { key: 'Takedown Accuracy', label: 'Précision takedown' }
  ]
  
  for (const field of statFields) {
    if (taleOfTape[field.key] && taleOfTape[field.key][fighter]) {
      stats.push({
        label: field.label,
        value: taleOfTape[field.key][fighter]
      })
    }
  }
  
  return stats
}

function getRatingLabel(rating: number): string {
  if (rating <= 2) return 'Très décevant'
  if (rating <= 4) return 'Décevant'
  if (rating <= 6) return 'Correct'
  if (rating <= 8) return 'Très bon'
  return 'Exceptionnel'
}