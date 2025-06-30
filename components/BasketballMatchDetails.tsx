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
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [showRatingsOverlay, setShowRatingsOverlay] = useState(true)

  // Générer des joueurs NBA typiques avec positions basketball
  const generateBasketballPlayers = (teamName: string) => {
    const positions = [
      { pos: 'PG', name: 'Point Guard' },
      { pos: 'SG', name: 'Shooting Guard' },
      { pos: 'SF', name: 'Small Forward' },
      { pos: 'PF', name: 'Power Forward' },
      { pos: 'C', name: 'Center' }
    ]
    
    // Bench players
    const benchPositions = [
      { pos: 'PG', name: 'Backup PG' },
      { pos: 'SG', name: 'Sixth Man' },
      { pos: 'SF', name: 'Wing' },
      { pos: 'PF', name: 'Backup PF' },
      { pos: 'C', name: 'Backup C' },
      { pos: 'G', name: 'Guard' },
      { pos: 'F', name: 'Forward' }
    ]
    
    const players = []
    
    // Starting 5
    for (let i = 0; i < 5; i++) {
      players.push({
        id: `${teamName}_starter_${i}`,
        name: `${positions[i].name} ${i + 1}`,
        number: i + 1,
        position: positions[i].pos,
        isStarter: true,
        minutes: Math.floor(Math.random() * 15) + 28, // 28-42 min pour les titulaires
        points: Math.floor(Math.random() * 25) + 8,   // 8-32 points
        rebounds: Math.floor(Math.random() * 10) + 3, // 3-12 rebonds
        assists: Math.floor(Math.random() * 8) + 2,   // 2-9 passes
        team: teamName,
        efficiency: Math.floor(Math.random() * 20) + 10 // +/- efficiency
      })
    }
    
    // Bench (7 joueurs)
    for (let i = 0; i < 7; i++) {
      players.push({
        id: `${teamName}_bench_${i}`,
        name: `${benchPositions[i].name} ${i + 6}`,
        number: i + 6,
        position: benchPositions[i].pos,
        isStarter: false,
        minutes: Math.floor(Math.random() * 20) + 5, // 5-24 min pour les remplaçants
        points: Math.floor(Math.random() * 15) + 2,  // 2-16 points
        rebounds: Math.floor(Math.random() * 6) + 1, // 1-6 rebonds
        assists: Math.floor(Math.random() * 4) + 1,  // 1-4 passes
        team: teamName,
        efficiency: Math.floor(Math.random() * 15) - 5 // -5 to +10 efficiency
      })
    }
    
    return players
  }

  const homePlayers = generateBasketballPlayers(match.homeTeam)
  const awayPlayers = generateBasketballPlayers(match.awayTeam)
  
  const currentPlayers = activeTeam === 'home' ? homePlayers : awayPlayers
  const starters = currentPlayers.filter(p => p.isStarter)
  const bench = currentPlayers.filter(p => !p.isStarter)

  const getUserRatingForPlayer = (playerId: string) => {
    return playerRatings?.find((rating: any) => 
      rating.playerId === playerId && rating.userId === currentUserId
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de contrôle basketball */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Sélecteur d'équipe */}
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
                🏀 Starting 5
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
                🏀 Starting 5
              </div>
            </button>
          </div>

          {/* Contrôles d'affichage */}
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

      {/* Terrain de Basketball Interactif */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">🏀</span>
              <div>
                <h3 className="text-2xl font-bold">
                  {activeTeam === 'home' ? match.homeTeam : match.awayTeam}
                </h3>
                <p className="text-orange-100">Starting Five - Vue Tactique</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">Basketball Court</div>
              <div className="text-orange-200 text-sm">Cliquez sur un joueur pour le noter</div>
            </div>
          </div>
        </div>

        {/* Terrain de Basketball Moderne */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-b from-amber-100 via-orange-200 to-amber-300 relative" style={{ aspectRatio: '94/50', minHeight: '600px' }}>
            {/* Texture parquet */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 8px,
                  rgba(139,69,19,0.3) 8px,
                  rgba(139,69,19,0.3) 9px
                )`
              }}></div>
            </div>

            {/* Lignes du terrain de basketball détaillées */}
            <div className="absolute inset-0 opacity-40">
              {/* Ligne médiane */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white transform -translate-x-0.5"></div>
              
              {/* Cercle central */}
              <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              
              {/* Zone restrictive gauche */}
              <div className="absolute top-1/2 left-4 w-16 h-32 border-2 border-white transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-4 w-8 h-16 border-2 border-white transform -translate-y-1/2"></div>
              
              {/* Zone restrictive droite */}
              <div className="absolute top-1/2 right-4 w-16 h-32 border-2 border-white transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 right-4 w-8 h-16 border-2 border-white transform -translate-y-1/2"></div>
              
              {/* Ligne à 3 points gauche */}
              <div className="absolute top-1/2 left-0 w-32 h-48 border-2 border-white rounded-r-full transform -translate-y-1/2" style={{ borderLeft: 'none' }}></div>
              
              {/* Ligne à 3 points droite */}
              <div className="absolute top-1/2 right-0 w-32 h-48 border-2 border-white rounded-l-full transform -translate-y-1/2" style={{ borderRight: 'none' }}></div>
              
              {/* Paniers */}
              <div className="absolute top-1/2 left-2 w-2 h-4 bg-orange-600 transform -translate-y-1/2 rounded-sm"></div>
              <div className="absolute top-1/2 right-2 w-2 h-4 bg-orange-600 transform -translate-y-1/2 rounded-sm"></div>
            </div>

            {/* Positionnement des joueurs Basketball */}
            <div className="absolute inset-0 p-8">
              <div className="relative w-full h-full flex justify-between items-center">
                
                {/* Formation Basketball - 5 joueurs positionnés stratégiquement */}
                <div className="flex flex-col justify-between h-full py-16">
                  {/* PG - Point Guard (arrière) */}
                  <div className="flex justify-center">
                    <BasketballPlayerCard
                      player={starters[0]}
                      userRating={getUserRatingForPlayer(starters[0]?.id)}
                      onSelect={setSelectedPlayer}
                      teamColor={activeTeam}
                      showRatingsOverlay={showRatingsOverlay}
                      position="PG"
                    />
                  </div>
                </div>

                {/* Zone milieu gauche */}
                <div className="flex flex-col justify-between h-full py-8">
                  {/* SG - Shooting Guard */}
                  <div className="flex justify-center">
                    <BasketballPlayerCard
                      player={starters[1]}
                      userRating={getUserRatingForPlayer(starters[1]?.id)}
                      onSelect={setSelectedPlayer}
                      teamColor={activeTeam}
                      showRatingsOverlay={showRatingsOverlay}
                      position="SG"
                    />
                  </div>
                  
                  {/* SF - Small Forward */}
                  <div className="flex justify-center">
                    <BasketballPlayerCard
                      player={starters[2]}
                      userRating={getUserRatingForPlayer(starters[2]?.id)}
                      onSelect={setSelectedPlayer}
                      teamColor={activeTeam}
                      showRatingsOverlay={showRatingsOverlay}
                      position="SF"
                    />
                  </div>
                </div>

                {/* Zone avant (près du panier) */}
                <div className="flex flex-col justify-center space-y-16">
                  {/* PF - Power Forward */}
                  <BasketballPlayerCard
                    player={starters[3]}
                    userRating={getUserRatingForPlayer(starters[3]?.id)}
                    onSelect={setSelectedPlayer}
                    teamColor={activeTeam}
                    showRatingsOverlay={showRatingsOverlay}
                    position="PF"
                  />
                  
                  {/* C - Center */}
                  <BasketballPlayerCard
                    player={starters[4]}
                    userRating={getUserRatingForPlayer(starters[4]?.id)}
                    onSelect={setSelectedPlayer}
                    teamColor={activeTeam}
                    showRatingsOverlay={showRatingsOverlay}
                    position="C"
                  />
                </div>
              </div>
            </div>

            {/* Coach position */}
            <div className="absolute bottom-6 left-6">
              <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-2xl p-4 text-center border border-white border-opacity-20">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl mb-2 ${
                  activeTeam === 'home' ? 'bg-orange-700' : 'bg-blue-700'
                }`}>
                  👨‍💼
                </div>
                <div className="text-xs text-white font-bold">Head Coach</div>
                <div className="text-xs text-white opacity-80">NBA</div>
              </div>
            </div>

            {/* Légende Basketball */}
            <div className="absolute top-6 right-6">
              <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20">
                <div className="text-white text-sm font-bold mb-2">🏀 Positions</div>
                <div className="space-y-1 text-xs text-white">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span>PG - Point Guard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>SG - Shooting Guard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>SF - Small Forward</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>PF - Power Forward</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>C - Center</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banc de touche moderne */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-white">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <span>🪑</span>
            <span>Banc de touche ({bench.length} joueurs)</span>
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bench.map((player, index) => (
              <BasketballBenchCard
                key={index}
                player={player}
                userRating={getUserRatingForPlayer(player.id)}
                onSelect={setSelectedPlayer}
                teamColor={activeTeam}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal de notation du joueur */}
      {selectedPlayer && (
        <BasketballPlayerRatingModal
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

// Composant carte joueur pour le terrain de basketball
function BasketballPlayerCard({ player, userRating, onSelect, teamColor, showRatingsOverlay, position }: any) {
  if (!player) return null

  const getPositionColor = (pos: string) => {
    const colors = {
      'PG': 'from-purple-500 to-purple-700',
      'SG': 'from-blue-500 to-blue-700', 
      'SF': 'from-green-500 to-green-700',
      'PF': 'from-yellow-500 to-yellow-700',
      'C': 'from-red-500 to-red-700'
    }
    return colors[pos as keyof typeof colors] || 'from-gray-500 to-gray-700'
  }

  return (
    <div
      onClick={() => onSelect({...player, userRating})}
      className="cursor-pointer group transition-all duration-300 hover:scale-110 flex flex-col items-center relative"
    >
      {/* Maillot basketball avec couleur selon position */}
      <div className={`w-18 h-18 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-2xl border-4 border-white transition-all duration-300 relative bg-gradient-to-br ${getPositionColor(position)} ${
        userRating ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''
      } group-hover:shadow-2xl group-hover:scale-110`}>
        {player.number || '?'}
        
        {/* Badge de note utilisateur */}
        {userRating && showRatingsOverlay && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow-lg border-2 border-white">
            {userRating.rating}
          </div>
        )}
      </div>
      
      {/* Nom et position du joueur */}
      <div className="mt-3 text-center">
        <div className="bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-lg font-bold shadow-lg backdrop-blur-sm min-w-max">
          {player.name?.split(' ').slice(-1)[0] || `Player ${player.number}`}
        </div>
        
        {/* Position avec couleur */}
        <div className={`text-white text-xs mt-1 px-2 py-0.5 rounded-full font-bold bg-gradient-to-r ${getPositionColor(position)}`}>
          {position}
        </div>
        
        {/* Stats rapides */}
        <div className="text-white text-xs mt-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
          {player.points}pts • {player.rebounds}reb • {player.assists}ast
        </div>
      </div>
    </div>
  )
}

// Composant carte joueur pour le banc
function BasketballBenchCard({ player, userRating, onSelect, teamColor }: any) {
  return (
    <div
      onClick={() => onSelect({...player, userRating})}
      className="group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md transition-transform group-hover:scale-110 ${
          teamColor === 'home' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'
        } ${userRating ? 'ring-2 ring-yellow-400' : ''}`}>
          {player.number || '?'}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm truncate">
            {player.name}
          </p>
          <p className="text-xs text-gray-600">{player.position}</p>
          
          {/* Stats joueur */}
          <div className="text-xs text-gray-500 mt-1">
            {player.points}pts • {player.minutes}min • +{player.efficiency}
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            {userRating && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                ⭐ Votre note: {userRating.rating}/10
              </span>
            )}
            {!userRating && (
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

  const getRatingDescription = (rating: number) => {
    if (rating === 0) return { emoji: "🤔", text: "Sélectionnez une note", color: "text-gray-500" }
    if (rating <= 2) return { emoji: "📉", text: "Performance très décevante", color: "text-red-600" }
    if (rating <= 4) return { emoji: "😐", text: "En-dessous des attentes", color: "text-orange-600" }
    if (rating <= 6) return { emoji: "👌", text: "Performance solide", color: "text-yellow-600" }
    if (rating <= 8) return { emoji: "🔥", text: "Excellente performance", color: "text-green-600" }
    return { emoji: "🐐", text: "Performance légendaire", color: "text-purple-600" }
  }

  const ratingDesc = getRatingDescription(selectedRating)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header avec gradient basketball */}
        <div className={`${teamColor === 'orange' ? 'bg-gradient-to-r from-orange-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} p-8 rounded-t-3xl text-white`}>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black backdrop-blur-sm">
              {player.number || '?'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{player.name}</h3>
              <p className="text-orange-100 opacity-90">{player.position} • {player.team}</p>
              <div className="flex items-center space-x-3 mt-2 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.points} pts
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.rebounds} reb
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.assists} ast
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Système de notation basketball */}
          <div>
            <p className="text-sm font-bold mb-6 text-gray-700">🏀 Évaluation de la performance :</p>
            
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
            
            {/* Barre de progression basketball */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(selectedRating / 10) * 100}%` }}
              ></div>
            </div>
            
            {/* Description de la note */}
            <div className={`text-center text-sm font-bold ${ratingDesc.color} bg-gray-50 rounded-xl p-4`}>
              <span className="text-3xl mr-3">{ratingDesc.emoji}</span>
              {ratingDesc.text}
            </div>
          </div>
          
          {/* Zone de commentaire basketball */}
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
          
          {/* Actions avec design basketball */}
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