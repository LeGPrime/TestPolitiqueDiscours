// components/BasketballMatchDetails.tsx
import { useState } from 'react'
import { 
  BarChart3, Activity, Users, Trophy, Target, 
  Clock, TrendingUp, Award, Star, Zap
} from 'lucide-react'

interface BasketballMatchDetailsProps {
  matchDetails: {
    match: {
      id: string
      homeTeam: string
      awayTeam: string
      homeScore: number
      awayScore: number
      date: string
      venue: string
      attendance?: number
    }
    statistics: {
      home: Record<string, any>
      away: Record<string, any>
    }
    details?: {
      quarter1?: { home: number, away: number }
      quarter2?: { home: number, away: number }
      quarter3?: { home: number, away: number }
      quarter4?: { home: number, away: number }
      overtime?: { home: number, away: number }
    }
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function BasketballMatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: BasketballMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'quarters' | 'players' | 'stats'>('quarters')
  
  const { match, statistics, details } = matchDetails

  return (
    <div className="space-y-6">
      {/* Score par quart-temps */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">🏀 Score par quart-temps</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-5 gap-4">
            {/* Q1 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q1</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {details?.quarter1?.home || '-'}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {details?.quarter1?.away || '-'}
                </div>
              </div>
            </div>

            {/* Q2 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q2</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {details?.quarter2?.home || '-'}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {details?.quarter2?.away || '-'}
                </div>
              </div>
            </div>

            {/* Q3 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q3</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {details?.quarter3?.home || '-'}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {details?.quarter3?.away || '-'}
                </div>
              </div>
            </div>

            {/* Q4 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q4</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {details?.quarter4?.home || '-'}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {details?.quarter4?.away || '-'}
                </div>
              </div>
            </div>

            {/* Final ou OT */}
            <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg p-4 border-2 border-yellow-300">
              <div className="text-sm font-medium text-yellow-700 mb-2">
                {details?.overtime ? 'OT' : 'FINAL'}
              </div>
              <div className="space-y-1">
                <div className="text-xl font-black text-blue-600">
                  {match.homeScore}
                </div>
                <div className="text-xl font-black text-red-600">
                  {match.awayScore}
                </div>
              </div>
            </div>
          </div>

          {/* Overtime si applicable */}
          {details?.overtime && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-center">
                <h4 className="font-semibold text-purple-800 mb-2">⏱️ Prolongation</h4>
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-sm text-purple-600">{match.homeTeam}</div>
                    <div className="text-2xl font-bold text-purple-800">{details.overtime.home}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-purple-600">{match.awayTeam}</div>
                    <div className="text-2xl font-bold text-purple-800">{details.overtime.away}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Basketball */}
      <div className="bg-white border-b">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'quarters', label: 'Performance par quart', icon: BarChart3 },
            { id: 'players', label: 'Joueurs & Rotations', icon: Users },
            { id: 'stats', label: 'Stats Basketball', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'quarters' && (
        <BasketballQuartersTab 
          match={match}
          details={details} 
        />
      )}
      
      {activeTab === 'players' && (
        <BasketballPlayersTab 
          match={match}
          playerRatings={playerRatings}
          onRatePlayer={onRatePlayer}
          currentUserId={currentUserId}
        />
      )}
      
      {activeTab === 'stats' && (
        <BasketballStatsTab 
          statistics={statistics} 
          homeTeam={match.homeTeam} 
          awayTeam={match.awayTeam} 
        />
      )}
    </div>
  )
}

function BasketballQuartersTab({ match, details }: any) {
  const quarters = [
    { name: 'Q1', home: details?.quarter1?.home, away: details?.quarter1?.away },
    { name: 'Q2', home: details?.quarter2?.home, away: details?.quarter2?.away },
    { name: 'Q3', home: details?.quarter3?.home, away: details?.quarter3?.away },
    { name: 'Q4', home: details?.quarter4?.home, away: details?.quarter4?.away },
  ]

  return (
    <div className="space-y-6">
      {/* Graphique de performance par quart */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">📊 Évolution du score</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {quarters.map((quarter, index) => {
              const homeScore = quarter.home || 0
              const awayScore = quarter.away || 0
              const total = homeScore + awayScore
              const homePercent = total > 0 ? (homeScore / total) * 100 : 50
              const awayPercent = total > 0 ? (awayScore / total) * 100 : 50

              return (
                <div key={quarter.name} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">{homeScore}</span>
                    <div className="text-center">
                      <span className="text-sm font-bold text-gray-700">{quarter.name}</span>
                      <div className="text-xs text-gray-500">{total} pts total</div>
                    </div>
                    <span className="text-lg font-bold text-red-600">{awayScore}</span>
                  </div>
                  
                  <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
                      style={{ width: `${homePercent}%` }}
                    />
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000"
                      style={{ width: `${awayPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{match.homeTeam}</span>
                    <span>{match.awayTeam}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats des quart-temps */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.max(...quarters.map(q => (q.home || 0) + (q.away || 0)))}
                  </div>
                  <div className="text-sm font-medium text-green-700">🔥 Meilleur quart</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {quarters.reduce((sum, q) => sum + (q.home || 0), 0)}
                  </div>
                  <div className="text-sm font-medium text-blue-700">📊 {match.homeTeam}</div>
                </div>
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {quarters.reduce((sum, q) => sum + (q.away || 0), 0)}
                  </div>
                  <div className="text-sm font-medium text-red-700">📊 {match.awayTeam}</div>
                </div>
                <Trophy className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analyse des quart-temps */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">🎯 Analyse tactique</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">📈 Momentum du match</h3>
              {quarters.map((quarter, index) => {
                const homeDiff = (quarter.home || 0) - (quarter.away || 0)
                const isHomeWinning = homeDiff > 0
                const diff = Math.abs(homeDiff)
                
                return (
                  <div key={quarter.name} className="flex items-center space-x-3">
                    <span className="w-8 text-sm font-bold text-gray-600">{quarter.name}</span>
                    <div className="flex-1 flex items-center">
                      {isHomeWinning ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-blue-600 font-medium">
                            {match.homeTeam} +{diff}
                          </span>
                        </div>
                      ) : homeDiff < 0 ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-red-600 font-medium">
                            {match.awayTeam} +{diff}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-600 font-medium">Égalité</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">🔥 Points d'intensité</h3>
              <div className="space-y-3">
                {quarters.map((quarter, index) => {
                  const total = (quarter.home || 0) + (quarter.away || 0)
                  const intensity = total > 50 ? 'high' : total > 40 ? 'medium' : 'low'
                  
                  return (
                    <div key={quarter.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{quarter.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{total} pts</span>
                        <div className={`w-3 h-3 rounded-full ${
                          intensity === 'high' ? 'bg-red-500' :
                          intensity === 'medium' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BasketballPlayersTab({ match, playerRatings, onRatePlayer, currentUserId }: any) {
  // Simuler des joueurs NBA typiques (en attendant de vraies données)
  const generateBasketballPlayers = (teamName: string) => {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C']
    const players = []
    
    for (let i = 0; i < 12; i++) {
      players.push({
        id: `${teamName}_player_${i}`,
        name: `Joueur ${i + 1}`,
        number: i + 1,
        position: positions[i % positions.length],
        isStarter: i < 5,
        minutes: i < 5 ? Math.floor(Math.random() * 15) + 25 : Math.floor(Math.random() * 20) + 5,
        points: i < 5 ? Math.floor(Math.random() * 20) + 8 : Math.floor(Math.random() * 15),
        rebounds: Math.floor(Math.random() * 8) + 2,
        assists: Math.floor(Math.random() * 6) + 1,
        team: teamName
      })
    }
    
    return players
  }

  const homePlayers = generateBasketballPlayers(match.homeTeam)
  const awayPlayers = generateBasketballPlayers(match.awayTeam)
  
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const currentPlayers = activeTeam === 'home' ? homePlayers : awayPlayers

  const getUserRatingForPlayer = (playerId: string) => {
    return playerRatings?.find((rating: any) => 
      rating.playerId === playerId && rating.userId === currentUserId
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle équipes */}
      <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner w-fit">
        <button
          onClick={() => setActiveTeam('home')}
          className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
            activeTeam === 'home'
              ? 'bg-white text-blue-600 shadow-lg transform scale-105 font-semibold'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
          <span>{match.homeTeam}</span>
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
            activeTeam === 'away'
              ? 'bg-white text-red-600 shadow-lg transform scale-105 font-semibold'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm"></div>
          <span>{match.awayTeam}</span>
        </button>
      </div>

      {/* Cinq majeur */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <h3 className="text-xl font-semibold">🏀 Cinq Majeur</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {currentPlayers.filter(p => p.isStarter).map((player) => (
              <BasketballPlayerCard
                key={player.id}
                player={player}
                userRating={getUserRatingForPlayer(player.id)}
                onRate={onRatePlayer}
                teamColor={activeTeam === 'home' ? 'blue' : 'red'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Banc */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-white">
          <h3 className="text-xl font-semibold">🪑 Banc</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentPlayers.filter(p => !p.isStarter).map((player) => (
              <BasketballPlayerCard
                key={player.id}
                player={player}
                userRating={getUserRatingForPlayer(player.id)}
                onRate={onRatePlayer}
                teamColor={activeTeam === 'home' ? 'blue' : 'red'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BasketballPlayerCard({ player, userRating, onRate, teamColor }: any) {
  const [showRatingModal, setShowRatingModal] = useState(false)

  return (
    <>
      <div
        onClick={() => setShowRatingModal(true)}
        className="cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 group"
      >
        <div className="text-center mb-3">
          <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110 ${
            teamColor === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'
          } ${userRating ? 'ring-4 ring-yellow-400' : ''}`}>
            #{player.number}
          </div>
          
          <h4 className="font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
            {player.name}
          </h4>
          <p className="text-sm text-gray-600 font-medium">{player.position}</p>
        </div>

        {/* Stats basket */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Minutes:</span>
            <span className="font-bold">{player.minutes}'</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Points:</span>
            <span className="font-bold text-orange-600">{player.points}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rebonds:</span>
            <span className="font-bold text-green-600">{player.rebounds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Passes:</span>
            <span className="font-bold text-blue-600">{player.assists}</span>
          </div>
        </div>

        {/* Note utilisateur */}
        {userRating && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-center">
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                ⭐ Votre note: {userRating.rating}/10
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de notation */}
      {showRatingModal && (
        <BasketballPlayerRatingModal
          player={player}
          userRating={userRating}
          onRate={onRate}
          onClose={() => setShowRatingModal(false)}
          teamColor={teamColor}
        />
      )}
    </>
  )
}

function BasketballPlayerRatingModal({ player, userRating, onRate, onClose, teamColor }: any) {
  const [selectedRating, setSelectedRating] = useState(userRating?.rating || 0)
  const [comment, setComment] = useState(userRating?.comment || '')
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async () => {
    if (selectedRating === 0 || submitting) return

    setSubmitting(true)
    try {
      await onRate(player.id, selectedRating, comment)
      onClose()
    } catch (error) {
      console.error('Erreur notation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        <div className={`${teamColor === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600'} p-6 rounded-t-2xl`}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
              #{player.number}
            </div>
            <div className="flex-1 text-white">
              <h3 className="text-xl font-bold">{player.name}</h3>
              <p className="text-blue-100 opacity-90">{player.position}</p>
              <div className="flex items-center space-x-3 mt-1 text-sm">
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {player.points} pts
                </span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {player.minutes}'
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm font-semibold mb-4 text-gray-700">Performance sur 10 :</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-xl text-sm font-bold transition-all duration-200 ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg scale-105' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              💭 Commentaire (optionnel) :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              placeholder="Comment a-t-il joué selon vous ?"
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium text-white shadow-lg ${
                selectedRating === 0 || submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 hover:shadow-xl'
              }`}
            >
              {submitting ? 'Notation...' : `Noter ${selectedRating}/10`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BasketballStatsTab({ statistics, homeTeam, awayTeam }: any) {
  const basketballStats = {
    'Field Goals Made': 'Paniers réussis',
    'Field Goals Attempted': 'Tentatives de tir',
    'Field Goal Percentage': 'Pourcentage aux tirs (%)',
    'Free Throws Made': 'Lancers francs réussis',
    'Free Throws Attempted': 'Tentatives LF',
    'Free Throw Percentage': 'Pourcentage LF (%)',
    'Three Pointers Made': 'Paniers à 3pts',
    'Three Pointers Attempted': 'Tentatives 3pts',
    'Three Point Percentage': 'Pourcentage 3pts (%)',
    'Rebounds': 'Rebonds',
    'Assists': 'Passes décisives',
    'Steals': 'Interceptions',
    'Blocks': 'Contres',
    'Turnovers': 'Balles perdues',
    'Points in Paint': 'Points dans la raquette',
    'Fast Break Points': 'Points en contre-attaque'
  }

  const importantBasketballStats = [
    'Field Goal Percentage',
    'Three Point Percentage',
    'Free Throw Percentage',
    'Rebounds',
    'Assists',
    'Turnovers'
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">🏀 Statistiques Basketball</h2>
      </div>
      
      <div className="p-6">
        {Object.keys(statistics).length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Statistiques non disponibles</p>
          </div>
        ) : (
          <div className="space-y-6">
            {importantBasketballStats.map((statKey) => {
              const homeValue = statistics.home?.[statKey] || '0'
              const awayValue = statistics.away?.[statKey] || '0'
              const label = basketballStats[statKey] || statKey
              
              const homeNum = parseFloat(String(homeValue).replace('%', '')) || 0
              const awayNum = parseFloat(String(awayValue).replace('%', '')) || 0
              
              let homePercent, awayPercent
              
              // Pour les pourcentages, on compare directement
              if (statKey.includes('Percentage')) {
                const total = Math.max(homeNum + awayNum, 100)
                homePercent = (homeNum / total) * 100
                awayPercent = (awayNum / total) * 100
              } else {
                const total = homeNum + awayNum
                homePercent = total > 0 ? (homeNum / total) * 100 : 50
                awayPercent = total > 0 ? (awayNum / total) * 100 : 50
              }

              return (
                <div key={statKey} className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">{homeValue}</span>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className="text-lg font-bold text-red-600">{awayValue}</span>
                  </div>
                  
                  <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                      style={{ width: `${homePercent}%` }}
                    />
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700"
                      style={{ width: `${awayPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{homeTeam}</span>
                    <span>{awayTeam}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}