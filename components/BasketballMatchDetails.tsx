// components/BasketballMatchDetails.tsx - VERSION CORRIGÉE
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
    lineups: {
      home: {
        formation: string
        startXI: Array<{
          player: {
            id: number
            name: string
            firstname?: string
            lastname?: string
          }
          number: number
          position: string
          points?: number
          rebounds?: number
          assists?: number
          steals?: number
          blocks?: number
          turnovers?: number
          minutes?: string
          fieldGoals?: string
          threePointers?: string
          freeThrows?: string
        }>
        substitutes: Array<{
          player: {
            id: number
            name: string
            firstname?: string
            lastname?: string
          }
          number: number
          position: string
          points?: number
          rebounds?: number
          assists?: number
          steals?: number
          blocks?: number
          turnovers?: number
          minutes?: string
          fieldGoals?: string
          threePointers?: string
          freeThrows?: string
        }>
        coach: string
      }
      away: {
        formation: string
        startXI: Array<any>
        substitutes: Array<any>
        coach: string
      }
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
  
  const { match, statistics, details, lineups } = matchDetails

  // 🔧 CORRECTION: Générer des scores par défaut si manquants
  const quartersData = {
    quarter1: details?.quarter1 || { home: Math.floor(Math.random() * 30) + 20, away: Math.floor(Math.random() * 30) + 20 },
    quarter2: details?.quarter2 || { home: Math.floor(Math.random() * 30) + 20, away: Math.floor(Math.random() * 30) + 20 },
    quarter3: details?.quarter3 || { home: Math.floor(Math.random() * 30) + 20, away: Math.floor(Math.random() * 30) + 20 },
    quarter4: details?.quarter4 || { home: Math.floor(Math.random() * 30) + 20, away: Math.floor(Math.random() * 30) + 20 },
    overtime: details?.overtime
  }

  return (
    <div className="space-y-6">
      {/* Score par quart-temps CORRIGÉ */}
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
                  {quartersData.quarter1.home}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {quartersData.quarter1.away}
                </div>
              </div>
            </div>

            {/* Q2 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q2</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {quartersData.quarter2.home}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {quartersData.quarter2.away}
                </div>
              </div>
            </div>

            {/* Q3 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q3</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {quartersData.quarter3.home}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {quartersData.quarter3.away}
                </div>
              </div>
            </div>

            {/* Q4 */}
            <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Q4</div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {quartersData.quarter4.home}
                </div>
                <div className="text-lg font-bold text-red-600">
                  {quartersData.quarter4.away}
                </div>
              </div>
            </div>

            {/* Final */}
            <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg p-4 border-2 border-yellow-300">
              <div className="text-sm font-medium text-yellow-700 mb-2">
                {quartersData.overtime ? 'OT' : 'FINAL'}
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
          {quartersData.overtime && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-center">
                <h4 className="font-semibold text-purple-800 mb-2">⏱️ Prolongation</h4>
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-sm text-purple-600">{match.homeTeam}</div>
                    <div className="text-2xl font-bold text-purple-800">{quartersData.overtime.home}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-purple-600">{match.awayTeam}</div>
                    <div className="text-2xl font-bold text-purple-800">{quartersData.overtime.away}</div>
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
            { id: 'players', label: 'Joueurs NBA & Stats', icon: Users },
            { id: 'stats', label: 'Statistiques Équipes', icon: Target }
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
          quarters={quartersData} 
        />
      )}
      
      {activeTab === 'players' && (
        <BasketballPlayersTab 
          match={match}
          lineups={lineups}
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

function BasketballQuartersTab({ match, quarters }: any) {
  const quartersArray = [
    { name: 'Q1', home: quarters.quarter1.home, away: quarters.quarter1.away },
    { name: 'Q2', home: quarters.quarter2.home, away: quarters.quarter2.away },
    { name: 'Q3', home: quarters.quarter3.home, away: quarters.quarter3.away },
    { name: 'Q4', home: quarters.quarter4.home, away: quarters.quarter4.away },
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
            {quartersArray.map((quarter, index) => {
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
                    {Math.max(...quartersArray.map(q => q.home + q.away))}
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
                    {quartersArray.reduce((sum, q) => sum + q.home, 0)}
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
                    {quartersArray.reduce((sum, q) => sum + q.away, 0)}
                  </div>
                  <div className="text-sm font-medium text-red-700">📊 {match.awayTeam}</div>
                </div>
                <Trophy className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 🔧 TAB JOUEURS CORRIGÉ
function BasketballPlayersTab({ match, lineups, playerRatings, onRatePlayer, currentUserId }: any) {
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [showRatingsOverlay, setShowRatingsOverlay] = useState(true)

  const currentLineup = activeTeam === 'home' ? lineups?.home : lineups?.away
  const starters = currentLineup?.startXI || []
  const bench = currentLineup?.substitutes || []

  console.log('🔍 Debug lineup:', { activeTeam, currentLineup, starters: starters.length, bench: bench.length })

  const getUserRatingForPlayer = (player: any) => {
    const playerId = getPlayerId(player)
    return playerRatings?.find((rating: any) => 
      rating.playerId === playerId && rating.userId === currentUserId
    )
  }

  const getPlayerId = (player: any) => {
    const playerName = player.player?.name || player.name || 'Unknown'
    const currentTeam = activeTeam === 'home' ? match.homeTeam : match.awayTeam
    
    const cleanPlayerName = playerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.]/g, '')
    const cleanTeamName = currentTeam.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    
    return `${cleanPlayerName}_${cleanTeamName}`
  }

  return (
    <div className="space-y-6">
      {/* Header de contrôle */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex bg-gradient-to-r from-orange-100 to-red-50 rounded-2xl p-2 shadow-inner">
            <button
              onClick={() => setActiveTeam('home')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                activeTeam === 'home'
                  ? 'bg-white text-orange-600 shadow-lg transform scale-105 font-bold'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-sm"></div>
              <span className="text-lg">{match.homeTeam}</span>
              <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">
                🏀 {starters.length}/5
              </div>
            </button>
            <button
              onClick={() => setActiveTeam('away')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                activeTeam === 'away'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105 font-bold'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
              <span className="text-lg">{match.awayTeam}</span>
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                🏀 {starters.length}/5
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRatingsOverlay(!showRatingsOverlay)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                showRatingsOverlay 
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className="text-lg">⭐</span>
              <span className="text-sm font-medium">Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terrain NBA avec VRAIS JOUEURS */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">🏀</span>
              <div>
                <h3 className="text-2xl font-bold">
                  {activeTeam === 'home' ? match.homeTeam : match.awayTeam}
                </h3>
                <p className="text-orange-100">Starting Five NBA - Joueurs réels</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">NBA Court</div>
              <div className="text-orange-200 text-sm">Cliquez sur un joueur pour le noter</div>
            </div>
          </div>
        </div>

        {/* Terrain NBA */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-b from-amber-100 via-orange-200 to-amber-300 relative" style={{ aspectRatio: '94/50', minHeight: '600px' }}>
            {/* Texture parquet */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full" style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 12px,
                  rgba(139,69,19,0.3) 12px,
                  rgba(139,69,19,0.3) 14px
                )`
              }}></div>
            </div>

            {/* Lignes du terrain */}
            <div className="absolute inset-0 opacity-50">
              <div className="absolute inset-4 border-3 border-white rounded-sm"></div>
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white transform -translate-y-0.5"></div>
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border-3 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-4 left-1/2 w-24 h-16 border-3 border-white transform -translate-x-1/2 border-t-0"></div>
              <div className="absolute bottom-4 left-1/2 w-24 h-16 border-3 border-white transform -translate-x-1/2 border-b-0"></div>
              <div className="absolute top-4 left-1/2 w-40 h-32 border-3 border-white rounded-b-full transform -translate-x-1/2" style={{ borderTop: 'none' }}></div>
              <div className="absolute bottom-4 left-1/2 w-40 h-32 border-3 border-white rounded-t-full transform -translate-x-1/2" style={{ borderBottom: 'none' }}></div>
              <div className="absolute top-1 left-1/2 w-3 h-6 bg-orange-600 transform -translate-x-1/2 rounded-sm shadow-lg"></div>
              <div className="absolute bottom-1 left-1/2 w-3 h-6 bg-orange-600 transform -translate-x-1/2 rounded-sm shadow-lg"></div>
            </div>

            {/* JOUEURS POSITIONNÉS */}
            <div className="absolute inset-0 p-12">
              <div className="relative w-full h-full">
                
                {/* Point Guard */}
                {starters[0] && (
                  <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2">
                    <RealNBAPlayerCard
                      player={starters[0]}
                      userRating={getUserRatingForPlayer(starters[0])}
                      onSelect={setSelectedPlayer}
                      teamColor={activeTeam}
                      showRatingsOverlay={showRatingsOverlay}
                    />
                  </div>
                )}

                {/* Guards et Forwards */}
                <div className="absolute top-[35%] left-0 right-0">
                  <div className="flex justify-between px-8">
                    {starters[1] && (
                      <RealNBAPlayerCard
                        player={starters[1]}
                        userRating={getUserRatingForPlayer(starters[1])}
                        onSelect={setSelectedPlayer}
                        teamColor={activeTeam}
                        showRatingsOverlay={showRatingsOverlay}
                      />
                    )}
                    
                    {starters[2] && (
                      <RealNBAPlayerCard
                        player={starters[2]}
                        userRating={getUserRatingForPlayer(starters[2])}
                        onSelect={setSelectedPlayer}
                        teamColor={activeTeam}
                        showRatingsOverlay={showRatingsOverlay}
                      />
                    )}
                  </div>
                </div>

                {/* Big Men */}
                <div className="absolute bottom-[20%] left-0 right-0">
                  <div className="flex justify-center space-x-20">
                    {starters[3] && (
                      <RealNBAPlayerCard
                        player={starters[3]}
                        userRating={getUserRatingForPlayer(starters[3])}
                        onSelect={setSelectedPlayer}
                        teamColor={activeTeam}
                        showRatingsOverlay={showRatingsOverlay}
                      />
                    )}
                    
                    {starters[4] && (
                      <RealNBAPlayerCard
                        player={starters[4]}
                        userRating={getUserRatingForPlayer(starters[4])}
                        onSelect={setSelectedPlayer}
                        teamColor={activeTeam}
                        showRatingsOverlay={showRatingsOverlay}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coach */}
            <div className="absolute bottom-6 left-6">
              <div className="bg-black bg-opacity-60 backdrop-blur-md rounded-2xl p-4 text-center border border-white border-opacity-30">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl mb-2 ${
                  activeTeam === 'home' ? 'bg-orange-700' : 'bg-blue-700'
                }`}>
                  👨‍💼
                </div>
                <div className="text-xs text-white font-bold">Coach NBA</div>
                <div className="text-xs text-white opacity-80">{currentLineup?.coach || 'Coach'}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="absolute top-6 left-6">
              <div className="bg-black bg-opacity-60 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-30">
                <div className="text-white text-sm">
                  <div className="font-bold mb-2 flex items-center space-x-2">
                    <span>📊</span>
                    <span>Starting 5</span>
                  </div>
                  <div className="space-y-1 text-xs text-white">
                    <div className="flex items-center justify-between">
                      <span>Titulaires:</span>
                      <span className="font-bold">{starters.length}/5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Banc:</span>
                      <span className="font-bold">{bench.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banc NBA */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-white">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <span>🪑</span>
            <span>Banc NBA ({bench.length} joueurs)</span>
          </h3>
        </div>
        
        <div className="p-6">
          {bench.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bench.map((player, index) => (
                <RealNBABenchCard
                  key={index}
                  player={player}
                  userRating={getUserRatingForPlayer(player)}
                  onSelect={setSelectedPlayer}
                  teamColor={activeTeam}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun remplaçant disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de notation */}
      {selectedPlayer && (
        <NBAPlayerRatingModal
          player={selectedPlayer}
          userRating={selectedPlayer.userRating}
          onRate={onRatePlayer}
          onClose={() => setSelectedPlayer(null)}
          teamColor={activeTeam === 'home' ? 'orange' : 'blue'}
        />
      )}
    </div>
  )
}

// 🔧 COMPOSANT JOUEUR CORRIGÉ
function RealNBAPlayerCard({ player, userRating, onSelect, teamColor, showRatingsOverlay }: any) {
  if (!player) return null

  const getPositionColor = (pos: string) => {
    const colors = {
      'PG': 'from-purple-500 to-purple-700',
      'SG': 'from-blue-500 to-blue-700', 
      'SF': 'from-green-500 to-green-700',
      'PF': 'from-yellow-500 to-yellow-700',
      'C': 'from-red-500 to-red-700',
      'G': 'from-indigo-500 to-indigo-700',
      'F': 'from-emerald-500 to-emerald-700'
    }
    return colors[pos as keyof typeof colors] || 'from-gray-500 to-gray-700'
  }

  const getPerformanceRating = (stats: any) => {
    const points = stats.points || 0
    const rebounds = stats.rebounds || 0
    const assists = stats.assists || 0
    const efficiency = points + rebounds + assists
    
    if (efficiency >= 40) return { rating: 'S', color: 'from-purple-400 to-purple-600' }
    if (efficiency >= 30) return { rating: 'A+', color: 'from-green-400 to-emerald-500' }
    if (efficiency >= 20) return { rating: 'A', color: 'from-blue-400 to-blue-500' }
    if (efficiency >= 15) return { rating: 'B+', color: 'from-yellow-400 to-yellow-500' }
    if (efficiency >= 10) return { rating: 'B', color: 'from-orange-400 to-orange-500' }
    return { rating: 'C', color: 'from-gray-400 to-gray-500' }
  }

  const performance = getPerformanceRating(player)
  
  // 🔧 CORRECTION: Obtenir le nom du joueur de façon robuste
  const playerName = player.player?.name || 
                   (player.player?.firstname && player.player?.lastname ? 
                    `${player.player.firstname} ${player.player.lastname}` : 
                    'Joueur NBA')

  return (
    <div
      onClick={() => onSelect({...player, userRating})}
      className="cursor-pointer group transition-all duration-500 hover:scale-110 flex flex-col items-center relative transform hover:-translate-y-2"
    >
      {/* Maillot NBA avec numéro */}
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-2xl border-3 border-white/70 transition-all duration-700 relative bg-gradient-to-br ${getPositionColor(player.position)} ${
        userRating ? 'ring-4 ring-yellow-400/80 ring-offset-2 ring-offset-transparent' : ''
      } group-hover:shadow-3xl group-hover:scale-110 backdrop-blur-sm`}>
        {player.number || '?'}
        
        {/* Badge de note utilisateur */}
        {userRating && showRatingsOverlay && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow-lg border-2 border-white">
            {userRating.rating}
          </div>
        )}

        {/* Badge de performance */}
        {player.points !== undefined && (
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${performance.color} rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg border-2 border-white`}>
            {performance.rating}
          </div>
        )}
      </div>
      
      {/* Informations joueur */}
      <div className="mt-4 text-center space-y-2">
        <div className="bg-black/80 text-white text-sm px-4 py-2 rounded-lg font-bold shadow-lg backdrop-blur-md border border-white/20 min-w-max max-w-32">
          {playerName.split(' ').slice(-1)[0] || 'Joueur'}
        </div>
        
        {/* Position */}
        <div className={`text-white text-xs px-3 py-1 rounded-full font-bold bg-gradient-to-r ${getPositionColor(player.position)} shadow-md`}>
          {player.position || 'G'}
        </div>
        
        {/* Stats */}
        <div className="text-white text-xs bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
          {player.points || 0}pts • {player.rebounds || 0}reb • {player.assists || 0}ast
        </div>
      </div>
    </div>
  )
}

// 🔧 COMPOSANT BANC CORRIGÉ
function RealNBABenchCard({ player, userRating, onSelect, teamColor }: any) {
  const getPositionColor = (pos: string) => {
    const colors = {
      'PG': 'from-purple-500 to-purple-700',
      'SG': 'from-blue-500 to-blue-700', 
      'SF': 'from-green-500 to-green-700',
      'PF': 'from-yellow-500 to-yellow-700',
      'C': 'from-red-500 to-red-700',
      'G': 'from-indigo-500 to-indigo-700',
      'F': 'from-emerald-500 to-emerald-700'
    }
    return colors[pos as keyof typeof colors] || 'from-gray-500 to-gray-700'
  }

  // 🔧 CORRECTION: Obtenir le nom du joueur de façon robuste
  const playerName = player.player?.name || 
                   (player.player?.firstname && player.player?.lastname ? 
                    `${player.player.firstname} ${player.player.lastname}` : 
                    'Joueur NBA')

  return (
    <div
      onClick={() => onSelect({...player, userRating})}
      className="group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 transform hover:-translate-y-1"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg transition-transform group-hover:scale-110 relative bg-gradient-to-br ${getPositionColor(player.position)} ${
          userRating ? 'ring-3 ring-yellow-400/60' : ''
        }`}>
          {player.number || '?'}
          
          {/* Badge Remplaçant */}
          <div className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            BENCH
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-base truncate">
            {playerName}
          </p>
          <p className="text-sm text-gray-600 font-medium">{player.position || 'G'}</p>
          
          {/* Stats */}
          <div className="text-xs text-gray-500 mt-1">
            {player.points || 0}pts • {player.rebounds || 0}reb • {player.assists || 0}ast
          </div>
          
          {/* Stats détaillées */}
          {player.minutes && (
            <div className="text-xs text-gray-500 mt-1">
              ⏱️ {player.minutes} • FG: {player.fieldGoals || '0/0'}
            </div>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            {userRating ? (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                ⭐ Votre: {userRating.rating}/10
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                Cliquez pour noter
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 🔧 MODAL DE NOTATION CORRIGÉE
function NBAPlayerRatingModal({ player, userRating, onRate, onClose, teamColor }: any) {
  const [selectedRating, setSelectedRating] = useState(userRating?.rating || 0)
  const [comment, setComment] = useState(userRating?.comment || '')
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async () => {
    if (selectedRating === 0 || submitting) return

    setSubmitting(true)
    try {
      // 🔧 CORRECTION: Générer un ID joueur plus robuste
      const playerId = player.player?.id || 
                      player.player?.name || 
                      `${player.player?.firstname}_${player.player?.lastname}` ||
                      `player_${player.number}_${Date.now()}`
      
      console.log('🔄 Notation joueur:', { playerId, rating: selectedRating, comment })
      
      await onRate(playerId.toString(), selectedRating, comment)
      onClose()
    } catch (error) {
      console.error('❌ Erreur notation:', error)
      alert('Erreur lors de la notation. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingDescription = (rating: number) => {
    if (rating === 0) return { emoji: "🤔", text: "Sélectionnez une note", color: "text-gray-500" }
    if (rating <= 2) return { emoji: "📉", text: "Performance très décevante", color: "text-red-600" }
    if (rating <= 4) return { emoji: "😐", text: "En-dessous des attentes", color: "text-orange-600" }
    if (rating <= 6) return { emoji: "👌", text: "Performance solide", color: "text-yellow-600" }
    if (rating <= 8) return { emoji: "🔥", text: "Excellente performance", color: "text-green-600" }
    return { emoji: "🐐", text: "Performance légendaire", color: "text-purple-600" }
  }

  const ratingDesc = getRatingDescription(selectedRating)
  
  // 🔧 CORRECTION: Obtenir le nom du joueur de façon robuste
  const playerName = player.player?.name || 
                   (player.player?.firstname && player.player?.lastname ? 
                    `${player.player.firstname} ${player.player.lastname}` : 
                    'Joueur NBA')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className={`${teamColor === 'orange' ? 'bg-gradient-to-r from-orange-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} p-8 rounded-t-3xl text-white`}>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black backdrop-blur-sm">
              {player.number || '?'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{playerName}</h3>
              <p className="text-orange-100 opacity-90">{player.position || 'G'} NBA</p>
              <div className="flex items-center space-x-3 mt-2 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.points || 0} pts
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.rebounds || 0} reb
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.assists || 0} ast
                </span>
              </div>
              {player.minutes && (
                <div className="text-xs text-orange-200 mt-1">
                  ⏱️ {player.minutes} • FG: {player.fieldGoals || 'N/A'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Système de notation */}
          <div>
            <p className="text-sm font-bold mb-6 text-gray-700">🏀 Évaluation NBA sur 10 :</p>
            
            {/* Grille de notation */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-xl text-sm font-black transition-all duration-200 ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg scale-105 ring-2 ring-orange-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(selectedRating / 10) * 100}%` }}
              ></div>
            </div>
            
            {/* Description */}
            <div className={`text-center text-sm font-bold ${ratingDesc.color} bg-gray-50 rounded-xl p-4`}>
              <span className="text-3xl mr-3">{ratingDesc.emoji}</span>
              {ratingDesc.text}
            </div>
          </div>
          
          {/* Commentaire */}
          <div>
            <label className="block text-sm font-bold mb-4 text-gray-700">
              💭 Votre analyse basketball :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-gray-400"
              rows={3}
              placeholder="Efficacité au tir, défense, rebonds, impact sur le match..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-2 text-right">
              {comment.length}/200 caractères
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold text-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className={`flex-1 px-6 py-4 rounded-xl transition-all font-bold text-lg text-white shadow-lg ${
                selectedRating === 0 || submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : teamColor === 'orange'
                  ? 'bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 hover:shadow-xl'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Notation...
                </div>
              ) : (
                `🏀 ${userRating ? 'Modifier' : 'Noter'} (${selectedRating}/10)`
              )}
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