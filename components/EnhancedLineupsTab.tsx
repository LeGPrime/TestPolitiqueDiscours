import { useState, useEffect } from 'react'
import { 
  Users, Trophy, Target, Star, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, RotateCcw, Eye, EyeOff, Filter,
  Award, TrendingUp, Activity, Zap, Crown
} from 'lucide-react'

interface EnhancedLineupsTabProps {
  lineups: {
    home: {
      formation: string
      startXI: any[]
      substitutes: any[]
      coach: string
      teamName?: string
    }
    away: {
      formation: string
      startXI: any[]
      substitutes: any[]
      coach: string
      teamName?: string
    }
  }
  matchId: string
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function EnhancedLineupsTab({ 
  lineups, 
  matchId, 
  playerRatings = [], 
  onRatePlayer, 
  currentUserId 
}: EnhancedLineupsTabProps) {
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const [viewMode, setViewMode] = useState<'tactical' | 'list' | 'compare'>('tactical')
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [showRatingsOverlay, setShowRatingsOverlay] = useState(true)
  const [loadingRatings, setLoadingRatings] = useState(false)
  const [localPlayerRatings, setLocalPlayerRatings] = useState<any[]>([])
  
  useEffect(() => {
    loadPlayerRatings()
  }, [matchId])

  const loadPlayerRatings = async () => {
    try {
      setLoadingRatings(true)
      setLocalPlayerRatings(playerRatings || [])
      console.log(`📊 ${playerRatings?.length || 0} notations joueurs chargées`)
    } catch (error) {
      console.error('Erreur chargement player ratings:', error)
    } finally {
      setLoadingRatings(false)
    }
  }

  const getUserRatingForPlayer = (player: any) => {
    const playerId = getPlayerId(player)
    return localPlayerRatings?.find((rating: any) => 
      rating.playerId === playerId && rating.userId === currentUserId
    )
  }

  const getPlayerStats = (player: any) => {
    const playerId = getPlayerId(player)
    const ratings = localPlayerRatings?.filter((rating: any) => rating.playerId === playerId) || []
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
      : 0
    
    return {
      avgRating,
      totalRatings: ratings.length,
      recentRatings: ratings.slice(0, 3)
    }
  }

  const getPlayerId = (player: any) => {
    const playerName = player.player?.name || player.player || player.name || 'Unknown'
    const currentTeam = activeTeam === 'home' ? lineups.home.teamName : lineups.away.teamName
    
    const cleanPlayerName = playerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.]/g, '')
    const cleanTeamName = (currentTeam || 'Unknown_Team').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    
    return `${cleanPlayerName}_${cleanTeamName}`
  }

  const enhancedOnRatePlayer = async (player: any, rating: number, comment?: string) => {
    try {
      const playerId = getPlayerId(player)
      await onRatePlayer(playerId, rating, comment)
      await loadPlayerRatings()
    } catch (error) {
      console.error('Erreur notation joueur:', error)
      throw error
    }
  }

  // Organiser les joueurs par lignes selon la formation
  const organizeByFormation = (formation: string, players: any[]) => {
    const formations: { [key: string]: number[] } = {
      '4-4-2': [1, 4, 4, 2],
      '4-3-3': [1, 4, 3, 3],
      '3-5-2': [1, 3, 5, 2],
      '4-2-3-1': [1, 4, 2, 3, 1],
      '5-4-1': [1, 5, 4, 1],
      '4-5-1': [1, 4, 5, 1],
      '3-4-3': [1, 3, 4, 3],
      '5-3-2': [1, 5, 3, 2],
      'default': [1, 4, 3, 3]
    }

    const lines = formations[formation] || formations['default']
    const distributed: any[][] = []
    let playerIndex = 0

    lines.forEach((lineSize) => {
      const line = players.slice(playerIndex, playerIndex + lineSize)
      distributed.push(line)
      playerIndex += lineSize
    })

    return distributed
  }

  const currentLineup = activeTeam === 'home' ? lineups.home : lineups.away
  const oppositeLineup = activeTeam === 'home' ? lineups.away : lineups.home
  const playerLines = organizeByFormation(currentLineup.formation, currentLineup.startXI)

  if (loadingRatings) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des compositions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de contrôle moderne */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Sélecteur d'équipe */}
          <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-2 shadow-inner">
            <button
              onClick={() => setActiveTeam('home')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                activeTeam === 'home'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-105 font-bold'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
              <span className="text-lg">{lineups.home.teamName}</span>
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                {currentLineup.formation}
              </div>
            </button>
            <button
              onClick={() => setActiveTeam('away')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                activeTeam === 'away'
                  ? 'bg-white text-red-600 shadow-lg transform scale-105 font-bold'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm"></div>
              <span className="text-lg">{lineups.away.teamName}</span>
              <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                {oppositeLineup.formation}
              </div>
            </button>
          </div>

          {/* Modes de vue */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('tactical')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                viewMode === 'tactical' ? 'bg-white shadow-md font-bold' : 'text-gray-600'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Vue Tactique</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white shadow-md font-bold' : 'text-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                viewMode === 'compare' ? 'bg-white shadow-md font-bold' : 'text-gray-600'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Comparaison</span>
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
              {showRatingsOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal selon le mode */}
      {viewMode === 'tactical' && (
        <TacticalView 
          playerLines={playerLines}
          activeTeam={activeTeam}
          currentLineup={currentLineup}
          getPlayerStats={getPlayerStats}
          getUserRatingForPlayer={getUserRatingForPlayer}
          onPlayerSelect={setSelectedPlayer}
          showRatingsOverlay={showRatingsOverlay}
          homeTeam={lineups.home.teamName}
          awayTeam={lineups.away.teamName}
        />
      )}

      {viewMode === 'list' && (
        <ListView 
          currentLineup={currentLineup}
          activeTeam={activeTeam}
          getPlayerStats={getPlayerStats}
          getUserRatingForPlayer={getUserRatingForPlayer}
          onPlayerSelect={setSelectedPlayer}
        />
      )}

      {viewMode === 'compare' && (
        <CompareView 
          homeLineup={lineups.home}
          awayLineup={lineups.away}
          getPlayerStats={getPlayerStats}
          getUserRatingForPlayer={getUserRatingForPlayer}
          onPlayerSelect={setSelectedPlayer}
        />
      )}

      {/* Statistiques des notations */}
      {localPlayerRatings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Statistiques des notations</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
              <div className="text-4xl font-black text-blue-600 mb-2">{localPlayerRatings.length}</div>
              <div className="text-sm font-bold text-blue-700">Notes données</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200">
              <div className="text-4xl font-black text-green-600 mb-2">
                {localPlayerRatings.length > 0 
                  ? (localPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / localPlayerRatings.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm font-bold text-green-700">Moyenne générale</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 text-center border border-yellow-200">
              <div className="text-4xl font-black text-yellow-600 mb-2">
                {Math.max(...localPlayerRatings.map(r => r.rating), 0)}
              </div>
              <div className="text-sm font-bold text-yellow-700">Note maximale</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200">
              <div className="text-4xl font-black text-purple-600 mb-2">
                {new Set(localPlayerRatings.map(r => r.playerId)).size}
              </div>
              <div className="text-sm font-bold text-purple-700">Joueurs notés</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de notation du joueur */}
      {selectedPlayer && (
        <PlayerRatingModal
          player={selectedPlayer}
          matchId={matchId}
          onRate={enhancedOnRatePlayer}
          onClose={() => setSelectedPlayer(null)}
          teamColor={activeTeam === 'home' ? 'blue' : 'red'}
        />
      )}
    </div>
  )
}

// Vue tactique moderne avec terrain réaliste
function TacticalView({ 
  playerLines, 
  activeTeam, 
  currentLineup, 
  getPlayerStats, 
  getUserRatingForPlayer, 
  onPlayerSelect, 
  showRatingsOverlay,
  homeTeam,
  awayTeam
}: any) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Trophy className="w-8 h-8" />
            <div>
              <h3 className="text-2xl font-bold">
                {activeTeam === 'home' ? homeTeam : awayTeam}
              </h3>
              <p className="text-green-100">Formation {currentLineup.formation}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">Vue Tactique</div>
            <div className="text-green-200 text-sm">Cliquez sur un joueur pour le noter</div>
          </div>
        </div>
      </div>

      {/* Terrain de football moderne */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-b from-green-400 via-green-500 to-green-600 relative" style={{ aspectRatio: '3/2', minHeight: '600px' }}>
          {/* Texture de pelouse */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 15px,
                rgba(255,255,255,0.1) 15px,
                rgba(255,255,255,0.1) 17px
              )`
            }}></div>
          </div>

          {/* Lignes du terrain détaillées */}
          <div className="absolute inset-0 opacity-30">
            {/* Ligne médiane */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-0.5"></div>
            
            {/* Cercle central */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Surface de réparation haute */}
            <div className="absolute top-4 left-1/2 w-44 h-20 border-2 border-white transform -translate-x-1/2"></div>
            <div className="absolute top-4 left-1/2 w-20 h-8 border-2 border-white transform -translate-x-1/2"></div>
            
            {/* Surface de réparation basse */}
            <div className="absolute bottom-4 left-1/2 w-44 h-20 border-2 border-white transform -translate-x-1/2"></div>
            <div className="absolute bottom-4 left-1/2 w-20 h-8 border-2 border-white transform -translate-x-1/2"></div>
            
            {/* Buts */}
            <div className="absolute top-0 left-1/2 w-12 h-2 bg-white transform -translate-x-1/2"></div>
            <div className="absolute bottom-0 left-1/2 w-12 h-2 bg-white transform -translate-x-1/2"></div>
          </div>

          {/* Positionnement des joueurs */}
          <div className="absolute inset-0 p-8">
            <div className="relative w-full h-full flex flex-col justify-between">
              {/* Formation tactique */}
              <div className="flex-1 flex flex-col justify-between py-8">
                {playerLines.map((line, lineIndex) => (
                  <div key={lineIndex} className="flex justify-center">
                    <div className={`flex ${
                      line.length === 1 ? 'justify-center' :
                      line.length === 2 ? 'justify-between max-w-md' :
                      line.length === 3 ? 'justify-between max-w-lg' :
                      line.length === 4 ? 'justify-between max-w-xl' :
                      'justify-between max-w-2xl'
                    } w-full px-4`}>
                      {line.map((player, playerIndex) => (
                        <PlayerTacticalCard
                          key={`${lineIndex}-${playerIndex}`}
                          player={player}
                          playerStats={getPlayerStats(player)}
                          userRating={getUserRatingForPlayer(player)}
                          activeTeam={activeTeam}
                          onSelect={onPlayerSelect}
                          showRatingsOverlay={showRatingsOverlay}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coach */}
          <div className="absolute bottom-6 right-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-2xl p-4 text-center border border-white border-opacity-20">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-xl mb-2 ${
                activeTeam === 'home' ? 'bg-blue-700' : 'bg-red-700'
              }`}>
                👨‍💼
              </div>
              <div className="text-xs text-white font-bold">Coach</div>
              <div className="text-xs text-white opacity-80">{currentLineup.coach}</div>
            </div>
          </div>

          {/* Légende */}
          <div className="absolute top-6 left-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-md rounded-2xl p-4 border border-white border-opacity-20">
              <div className="text-white text-sm font-bold mb-2">Légende</div>
              <div className="space-y-2 text-xs text-white">
                {showRatingsOverlay && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Badge jaune = Votre note</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Vert = Note élevée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Rouge = Note faible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remplaçants en bas */}
      <div className="bg-gray-50 p-6 border-t">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <span>Remplaçants ({currentLineup.substitutes.length})</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {currentLineup.substitutes.map((player: any, index: number) => (
            <PlayerSubstituteCard
              key={index}
              player={player}
              playerStats={getPlayerStats(player)}
              userRating={getUserRatingForPlayer(player)}
              activeTeam={activeTeam}
              onSelect={onPlayerSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Carte de joueur pour la vue tactique
function PlayerTacticalCard({ player, playerStats, userRating, activeTeam, onSelect, showRatingsOverlay }: any) {
  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="cursor-pointer group transition-all duration-300 hover:scale-110 flex flex-col items-center relative"
    >
      {/* Maillot du joueur */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-2xl border-4 border-white transition-all duration-300 relative ${
        activeTeam === 'home' ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-red-600 to-red-800'
      } ${userRating ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''} group-hover:shadow-2xl group-hover:scale-110`}>
        {player.number || player.player?.number || '?'}
        
        {/* Badge de note utilisateur */}
        {userRating && showRatingsOverlay && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow-lg border-2 border-white">
            {userRating.rating}
          </div>
        )}
        
        {/* Indicateur de performance */}
        {playerStats.avgRating > 0 && showRatingsOverlay && (
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
            playerStats.avgRating >= 8 ? 'bg-green-500' :
            playerStats.avgRating >= 6 ? 'bg-blue-500' :
            playerStats.avgRating >= 4 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}>
            {playerStats.avgRating.toFixed(0)}
          </div>
        )}
      </div>
      
      {/* Nom du joueur */}
      <div className="mt-3 text-center">
        <div className="bg-black bg-opacity-80 text-white text-xs px-3 py-1 rounded-lg font-bold shadow-lg backdrop-blur-sm min-w-max">
          {(player.player?.name || player.player || player.name || 'Joueur').split(' ').slice(-1)[0]}
        </div>
        
        {/* Position */}
        <div className="text-white text-xs mt-1 bg-white bg-opacity-30 px-2 py-0.5 rounded-full font-medium">
          {player.position || player.player?.pos || 'POS'}
        </div>
      </div>
    </div>
  )
}

// Carte de joueur remplaçant
function PlayerSubstituteCard({ player, playerStats, userRating, activeTeam, onSelect }: any) {
  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="group cursor-pointer bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md transition-transform group-hover:scale-110 ${
          activeTeam === 'home' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'
        } ${userRating ? 'ring-2 ring-yellow-400' : ''}`}>
          {player.number || player.player?.number || '?'}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm truncate">
            {(player.player?.name || player.player || player.name || 'Joueur').split(' ').slice(-1)[0]}
          </p>
          <p className="text-xs text-gray-600">{player.position || player.player?.pos || 'SUB'}</p>
          
          <div className="flex items-center space-x-2 mt-1">
            {playerStats.avgRating > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                ⭐ {playerStats.avgRating.toFixed(1)}
              </span>
            )}
            {userRating && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                Votre note: {userRating.rating}/10
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Vue en liste moderne
function ListView({ currentLineup, activeTeam, getPlayerStats, getUserRatingForPlayer, onPlayerSelect }: any) {
  return (
    <div className="space-y-6">
      {/* Titulaires */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h3 className="text-2xl font-bold flex items-center space-x-3">
            <Trophy className="w-6 h-6" />
            <span>Titulaires - Formation {currentLineup.formation}</span>
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentLineup.startXI.map((player: any, index: number) => (
              <PlayerListCard
                key={index}
                player={player}
                playerStats={getPlayerStats(player)}
                userRating={getUserRatingForPlayer(player)}
                activeTeam={activeTeam}
                onSelect={onPlayerSelect}
                isStarter={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Remplaçants */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-white">
          <h3 className="text-2xl font-bold flex items-center space-x-3">
            <Users className="w-6 h-6" />
            <span>Remplaçants ({currentLineup.substitutes.length})</span>
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentLineup.substitutes.map((player: any, index: number) => (
              <PlayerListCard
                key={index}
                player={player}
                playerStats={getPlayerStats(player)}
                userRating={getUserRatingForPlayer(player)}
                activeTeam={activeTeam}
                onSelect={onPlayerSelect}
                isStarter={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Carte de joueur pour la vue liste
function PlayerListCard({ player, playerStats, userRating, activeTeam, onSelect, isStarter }: any) {
  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="group cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg transition-transform group-hover:scale-110 ${
          activeTeam === 'home' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'
        } ${userRating ? 'ring-4 ring-yellow-400' : ''} ${isStarter ? 'border-4 border-white' : 'border-2 border-gray-300'}`}>
          {player.number || player.player?.number || '?'}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
              {player.player?.name || player.player || player.name || 'Joueur'}
            </h4>
            {isStarter && (
              <Crown className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 font-medium mb-3">
            {player.position || player.player?.pos || (isStarter ? 'Titulaire' : 'Remplaçant')}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {playerStats.avgRating > 0 && (
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                playerStats.avgRating >= 8 ? 'bg-green-100 text-green-800' :
                playerStats.avgRating >= 6 ? 'bg-blue-100 text-blue-800' :
                playerStats.avgRating >= 4 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                ⭐ {playerStats.avgRating.toFixed(1)} ({playerStats.totalRatings} votes)
              </span>
            )}
            {userRating && (
              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">
                Votre note: {userRating.rating}/10
              </span>
            )}
            {!userRating && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                Cliquez pour noter
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Vue de comparaison des deux équipes
function CompareView({ homeLineup, awayLineup, getPlayerStats, getUserRatingForPlayer, onPlayerSelect }: any) {
  return (
    <div className="space-y-6">
      {/* Comparaison des formations */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <Activity className="w-6 h-6 text-purple-600" />
          <span>Comparaison des équipes</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Équipe domicile */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              <h4 className="text-xl font-bold text-blue-600">{homeLineup.teamName}</h4>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                {homeLineup.formation}
              </span>
            </div>
            
            <div className="space-y-2">
              {homeLineup.startXI.map((player: any, index: number) => (
                <ComparePlayerCard
                  key={index}
                  player={player}
                  playerStats={getPlayerStats(player)}
                  userRating={getUserRatingForPlayer(player)}
                  teamColor="blue"
                  onSelect={onPlayerSelect}
                />
              ))}
            </div>
          </div>

          {/* Équipe extérieure */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              <h4 className="text-xl font-bold text-red-600">{awayLineup.teamName}</h4>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                {awayLineup.formation}
              </span>
            </div>
            
            <div className="space-y-2">
              {awayLineup.startXI.map((player: any, index: number) => (
                <ComparePlayerCard
                  key={index}
                  player={player}
                  playerStats={getPlayerStats(player)}
                  userRating={getUserRatingForPlayer(player)}
                  teamColor="red"
                  onSelect={onPlayerSelect}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Carte de joueur pour la vue de comparaison
function ComparePlayerCard({ player, playerStats, userRating, teamColor, onSelect }: any) {
  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="group cursor-pointer flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
        teamColor === 'blue' ? 'bg-blue-500' : 'bg-red-500'
      } ${userRating ? 'ring-2 ring-yellow-400' : ''}`}>
        {player.number || player.player?.number || '?'}
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
          {player.player?.name || player.player || player.name || 'Joueur'}
        </p>
        <p className="text-xs text-gray-600">{player.position || player.player?.pos || 'POS'}</p>
      </div>
      
      <div className="text-right">
        {playerStats.avgRating > 0 ? (
          <div className={`text-sm font-bold ${
            playerStats.avgRating >= 8 ? 'text-green-600' :
            playerStats.avgRating >= 6 ? 'text-blue-600' :
            playerStats.avgRating >= 4 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {playerStats.avgRating.toFixed(1)}
          </div>
        ) : (
          <div className="text-xs text-gray-400">—</div>
        )}
        {userRating && (
          <div className="text-xs text-purple-600 font-bold">
            Votre: {userRating.rating}
          </div>
        )}
      </div>
    </div>
  )
}

// Modal de notation du joueur
function PlayerRatingModal({ player, matchId, onRate, onClose, teamColor }: any) {
  const [selectedRating, setSelectedRating] = useState(player.userRating?.rating || 0)
  const [comment, setComment] = useState(player.userRating?.comment || '')
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async () => {
    if (selectedRating === 0 || submitting) return

    setSubmitting(true)
    try {
      await onRate(player, selectedRating, comment)
      onClose()
    } catch (error) {
      console.error('Erreur notation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingDescription = (rating: number) => {
    if (rating === 0) return { emoji: "🤔", text: "Sélectionnez une note", color: "text-gray-500" }
    if (rating <= 2) return { emoji: "😞", text: "Performance très décevante", color: "text-red-600" }
    if (rating <= 4) return { emoji: "😐", text: "Performance en-dessous des attentes", color: "text-orange-600" }
    if (rating <= 6) return { emoji: "🙂", text: "Performance correcte", color: "text-yellow-600" }
    if (rating <= 8) return { emoji: "😊", text: "Bonne performance", color: "text-green-600" }
    return { emoji: "🔥", text: "Performance exceptionnelle", color: "text-emerald-600" }
  }

  const ratingDesc = getRatingDescription(selectedRating)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header avec gradient */}
        <div className={`${teamColor === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-red-600 to-red-700'} p-8 rounded-t-3xl text-white`}>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black backdrop-blur-sm">
              {player.number || player.player?.number || '?'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{player.player?.name || player.player || player.name || 'Joueur'}</h3>
              <p className="text-blue-100 opacity-90">{player.position || player.player?.pos || 'Position'}</p>
              <div className="flex items-center space-x-3 mt-2 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  Moy: {player.avgRating ? player.avgRating.toFixed(1) : '—'}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {player.totalRatings || 0} votes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Système de notation moderne */}
          <div>
            <p className="text-sm font-bold mb-6 text-gray-700">Votre évaluation sur 10 :</p>
            
            {/* Grille de notation */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-xl text-sm font-black transition-all duration-200 ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900 shadow-lg scale-105 ring-2 ring-yellow-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            {/* Barre de progression visuelle */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(selectedRating / 10) * 100}%` }}
              ></div>
            </div>
            
            {/* Description de la note */}
            <div className={`text-center text-sm font-bold ${ratingDesc.color} bg-gray-50 rounded-xl p-4`}>
              <span className="text-3xl mr-3">{ratingDesc.emoji}</span>
              {ratingDesc.text}
            </div>
          </div>
          
          {/* Zone de commentaire améliorée */}
          <div>
            <label className="block text-sm font-bold mb-4 text-gray-700">
              💭 Votre analyse (optionnelle) :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              rows={3}
              placeholder="Partagez votre avis sur sa performance..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-2 text-right">
              {comment.length}/200 caractères
            </div>
          </div>
          
          {/* Actions avec design moderne */}
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
                  : teamColor === 'blue'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Notation...
                </div>
              ) : (
                `${player.userRating ? '✏️ Modifier' : '⭐ Noter'} (${selectedRating}/10)`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}