import { useState, useEffect } from 'react'
import { 
  Users, Trophy, Target, Star, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, RotateCcw, Eye, EyeOff, Filter,
  Award, TrendingUp, Activity, Zap, Crown, Play, Shirt
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
    if (!currentUserId) {
      console.error('❌ currentUserId non défini')
      return
    }

    try {
      const playerId = getPlayerId(player)
      console.log('🎯 Notation en cours:', { playerId, rating, currentUserId })
      
      setLocalPlayerRatings(prevRatings => {
        console.log('📊 Ratings avant:', prevRatings.length)
        
        const newRatings = prevRatings.filter(r => 
          !(r.playerId === playerId && r.userId === currentUserId)
        )
        
        const newRating = {
          id: `local_${Date.now()}`,
          userId: currentUserId,
          playerId: playerId,
          rating: rating,
          comment: comment || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: currentUserId,
            name: 'Vous',
            username: null,
            image: null
          },
          player: {
            id: playerId,
            name: player.player?.name || player.player || player.name || 'Joueur',
            position: player.position || player.player?.pos,
            number: player.number || player.player?.number,
            team: activeTeam === 'home' ? lineups.home.teamName : lineups.away.teamName,
            sport: 'FOOTBALL'
          }
        }
        
        const finalRatings = [...newRatings, newRating]
        console.log('📊 Ratings après:', finalRatings.length, 'nouvelle note:', newRating.rating)
        return finalRatings
      })

      await onRatePlayer(playerId, rating, comment)
      console.log('✅ Sauvegarde API réussie')
      
    } catch (error) {
      console.error('❌ Erreur notation:', error)
      loadPlayerRatings()
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
    <div className="space-y-4 md:space-y-6">
      {/* Header mobile-first */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
        {/* Mobile: Stack vertically */}
        <div className="space-y-4">
          {/* Team selector - Mobile optimized */}
          <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTeam('home')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl transition-all duration-300 ${
                activeTeam === 'home'
                  ? 'bg-white text-blue-600 shadow-lg font-bold'
                  : 'text-gray-600'
              }`}
            >
              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
              <span className="text-sm md:text-base font-semibold truncate">{lineups.home.teamName}</span>
            </button>
            <button
              onClick={() => setActiveTeam('away')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl transition-all duration-300 ${
                activeTeam === 'away'
                  ? 'bg-white text-red-600 shadow-lg font-bold'
                  : 'text-gray-600'
              }`}
            >
              <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full"></div>
              <span className="text-sm md:text-base font-semibold truncate">{lineups.away.teamName}</span>
            </button>
          </div>

          {/* Formation badge */}
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm ${
              activeTeam === 'home' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <Trophy className="w-4 h-4" />
              <span>Formation {currentLineup.formation}</span>
            </div>
          </div>

          {/* View modes - Mobile simplified - COULEURS CORRIGÉES */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('tactical')}
              className={`flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg transition-all text-xs md:text-sm font-medium ${
                viewMode === 'tactical' 
                  ? 'bg-white text-gray-900 shadow-md font-bold' // ✅ CORRIGÉ: texte noir sur fond blanc
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Shirt className="w-3 h-3 md:w-4 md:h-4" />
              <span>Tactique</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg transition-all text-xs md:text-sm font-medium ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-md font-bold' // ✅ CORRIGÉ: texte noir sur fond blanc
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span>Liste</span>
            </button>
          </div>

          {/* Notes toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowRatingsOverlay(!showRatingsOverlay)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                showRatingsOverlay 
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {showRatingsOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Afficher les notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'tactical' && (
        <MobileTacticalView 
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
        <MobileListView 
          currentLineup={currentLineup}
          activeTeam={activeTeam}
          getPlayerStats={getPlayerStats}
          getUserRatingForPlayer={getUserRatingForPlayer}
          onPlayerSelect={setSelectedPlayer}
        />
      )}

      {/* Stats section - Mobile optimized */}
      {localPlayerRatings.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
          <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Vos notations</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 md:p-4 text-center border border-blue-200">
              <div className="text-2xl md:text-3xl font-black text-blue-600 mb-1">{localPlayerRatings.length}</div>
              <div className="text-xs md:text-sm font-bold text-blue-700">Notes données</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 md:p-4 text-center border border-green-200">
              <div className="text-2xl md:text-3xl font-black text-green-600 mb-1">
                {localPlayerRatings.length > 0 
                  ? (localPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / localPlayerRatings.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-xs md:text-sm font-bold text-green-700">Moyenne</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 md:p-4 text-center border border-yellow-200">
              <div className="text-2xl md:text-3xl font-black text-yellow-600 mb-1">
                {Math.max(...localPlayerRatings.map(r => r.rating), 0)}
              </div>
              <div className="text-xs md:text-sm font-bold text-yellow-700">Note max</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 md:p-4 text-center border border-purple-200">
              <div className="text-2xl md:text-3xl font-black text-purple-600 mb-1">
                {new Set(localPlayerRatings.map(r => r.playerId)).size}
              </div>
              <div className="text-xs md:text-sm font-bold text-purple-700">Joueurs</div>
            </div>
          </div>
        </div>
      )}

      {/* Player rating modal */}
      {selectedPlayer && (
        <MobilePlayerRatingModal
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

// Vue tactique optimisée mobile
function MobileTacticalView({ 
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
  const [showBench, setShowBench] = useState(false) // 🆕 État pour afficher/masquer le banc
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header compact */}
      <div className={`p-4 md:p-6 text-white relative overflow-hidden ${
        activeTeam === 'home' 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
          : 'bg-gradient-to-br from-red-500 to-red-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shirt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">
                {activeTeam === 'home' ? homeTeam : awayTeam}
              </h3>
              <div className="text-sm opacity-90">{currentLineup.formation} • 11 titulaires</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium opacity-90">Appuyez pour noter ⭐</div>
          </div>
        </div>
      </div>

      {/* Terrain mobile-first */}
      <div className="relative bg-gradient-to-b from-emerald-400 to-green-500 overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Lignes du terrain simplifiées pour mobile */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-2 border-2 border-white rounded-lg"></div>
          <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-white"></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-2 left-1/2 w-20 h-8 border-2 border-white transform -translate-x-1/2 border-t-0 rounded-b-lg"></div>
          <div className="absolute bottom-2 left-1/2 w-20 h-8 border-2 border-white transform -translate-x-1/2 border-b-0 rounded-t-lg"></div>
        </div>

        {/* Positionnement mobile-optimized */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
          {/* Gardien */}
          <div className="flex justify-center">
            {playerLines[0] && playerLines[0][0] && (
              <MobilePlayerCard
                player={playerLines[0][0]}
                playerStats={getPlayerStats(playerLines[0][0])}
                userRating={getUserRatingForPlayer(playerLines[0][0])}
                activeTeam={activeTeam}
                onSelect={onPlayerSelect}
                showRatingsOverlay={showRatingsOverlay}
                position="GK"
              />
            )}
          </div>
          
          {/* Défenseurs */}
          <div className="flex justify-center">
            <div className="flex space-x-2 md:space-x-4">
              {playerLines[1] && playerLines[1].map((player, index) => (
                <MobilePlayerCard
                  key={index}
                  player={player}
                  playerStats={getPlayerStats(player)}
                  userRating={getUserRatingForPlayer(player)}
                  activeTeam={activeTeam}
                  onSelect={onPlayerSelect}
                  showRatingsOverlay={showRatingsOverlay}
                  position="DEF"
                />
              ))}
            </div>
          </div>
          
          {/* Milieux */}
          <div className="flex justify-center">
            <div className="flex space-x-2 md:space-x-4">
              {playerLines[2] && playerLines[2].map((player, index) => (
                <MobilePlayerCard
                  key={index}
                  player={player}
                  playerStats={getPlayerStats(player)}
                  userRating={getUserRatingForPlayer(player)}
                  activeTeam={activeTeam}
                  onSelect={onPlayerSelect}
                  showRatingsOverlay={showRatingsOverlay}
                  position="MID"
                />
              ))}
            </div>
          </div>
          
          {/* Ligne supplémentaire si besoin */}
          {playerLines[3] && playerLines[3].length > 0 && (
            <div className="flex justify-center">
              <div className="flex space-x-2 md:space-x-4">
                {playerLines[3].map((player, index) => (
                  <MobilePlayerCard
                    key={index}
                    player={player}
                    playerStats={getPlayerStats(player)}
                    userRating={getUserRatingForPlayer(player)}
                    activeTeam={activeTeam}
                    onSelect={onPlayerSelect}
                    showRatingsOverlay={showRatingsOverlay}
                    position="MID"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Attaquants */}
          <div className="flex justify-center">
            <div className="flex space-x-2 md:space-x-4">
              {playerLines[4] && playerLines[4].map((player, index) => (
                <MobilePlayerCard
                  key={index}
                  player={player}
                  playerStats={getPlayerStats(player)}
                  userRating={getUserRatingForPlayer(player)}
                  activeTeam={activeTeam}
                  onSelect={onPlayerSelect}
                  showRatingsOverlay={showRatingsOverlay}
                  position="ATT"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Coach info - Compact */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs">
                👨‍💼
              </div>
              <div>
                <div className="text-xs text-white/80">Coach</div>
                <div className="text-sm text-white font-bold">{currentLineup.coach}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats overlay - Mobile */}
        <div className="absolute top-4 right-4">
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <div className="text-white text-xs">
              <div className="font-bold mb-1">📊 Progress</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Notés:</span>
                  <span className="font-bold">
                    {currentLineup.startXI.filter(player => getUserRatingForPlayer(player)).length}/11
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remplaçants mobile-optimized - Avec système de déroulement */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 border-t border-gray-200">
        {/* Header cliquable pour dérouler/fermer */}
        <button
          onClick={() => setShowBench(!showBench)}
          className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-slate-600" />
            <h4 className="text-lg font-bold text-gray-900">Banc de touche</h4>
            <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
              {currentLineup.substitutes.length} remplaçants
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">
              {showBench ? 'Masquer' : 'Afficher'}
            </span>
            <div className={`transition-transform duration-300 ${showBench ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {/* Contenu du banc - Collapsible */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showBench 
            ? 'max-h-[2000px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 pb-4 md:px-6 md:pb-6">
            {currentLineup.substitutes.length > 0 ? (
              <>
                {/* Info banc */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Cliquez sur un remplaçant pour le noter ⭐</span>
                  </p>
                </div>

                {/* Grille des remplaçants */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentLineup.substitutes.map((player: any, index: number) => (
                    <MobileSubstituteCard
                      key={index}
                      player={player}
                      playerStats={getPlayerStats(player)}
                      userRating={getUserRatingForPlayer(player)}
                      activeTeam={activeTeam}
                      onSelect={onPlayerSelect}
                    />
                  ))}
                </div>

                {/* Stats du banc */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-700">{currentLineup.substitutes.length}</div>
                    <div className="text-xs text-gray-600">Remplaçants</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length}
                    </div>
                    <div className="text-xs text-gray-600">Notés</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {currentLineup.substitutes.length - currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length}
                    </div>
                    <div className="text-xs text-gray-600">À noter</div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length > 0
                        ? (currentLineup.substitutes
                            .filter(player => getUserRatingForPlayer(player))
                            .reduce((sum, player) => sum + getUserRatingForPlayer(player).rating, 0) / 
                           currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length
                          ).toFixed(1)
                        : '—'
                      }
                    </div>
                    <div className="text-xs text-gray-600">Moy. banc</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucun remplaçant disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Carte joueur mobile-optimized
function MobilePlayerCard({ player, playerStats, userRating, activeTeam, onSelect, showRatingsOverlay, position }: any) {
  const getPlayerCardColor = () => {
    if (userRating && userRating.rating) {
      const rating = userRating.rating
      if (rating >= 9) return 'from-emerald-400 to-emerald-600'
      if (rating >= 7) return 'from-green-400 to-green-600'
      if (rating >= 6) return 'from-blue-400 to-blue-600'
      if (rating >= 4) return 'from-yellow-400 to-yellow-600'
      if (rating >= 2) return 'from-orange-400 to-orange-600'
      return 'from-red-400 to-red-600'
    }
    
    // Couleur par position
    if (position === 'GK') return 'from-purple-500 to-purple-700'
    if (position === 'DEF') return 'from-blue-500 to-blue-700'
    if (position === 'MID') return 'from-green-500 to-green-700'
    if (position === 'ATT') return 'from-red-500 to-red-700'
    return 'from-gray-500 to-gray-700'
  }

  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="cursor-pointer group transition-all duration-300 hover:scale-110 flex flex-col items-center relative touch-target"
    >
      {/* Maillot moderne */}
      <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-black text-sm md:text-base shadow-xl border-2 border-white/50 transition-all duration-500 bg-gradient-to-br ${getPlayerCardColor()} ${
        userRating ? 'ring-2 ring-yellow-400/80' : ''
      } group-hover:shadow-2xl group-hover:scale-105`}>
        {player.number || player.player?.number || '?'}
        
        {/* Badge de note - Plus discret */}
        {userRating && showRatingsOverlay && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shadow-lg">
            {userRating.rating}
          </div>
        )}
      </div>
      
      {/* Nom du joueur - Compact */}
      <div className="mt-2 text-center min-w-0">
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-bold shadow-lg backdrop-blur-md border border-white/20 max-w-[80px] truncate">
          {(player.player?.name || player.player || player.name || 'Joueur').split(' ').slice(-1)[0]}
        </div>
      </div>
    </div>
  )
}

// Carte remplaçant mobile
function MobileSubstituteCard({ player, playerStats, userRating, activeTeam, onSelect }: any) {
  const getPlayerCardColor = () => {
    if (userRating && userRating.rating) {
      const rating = userRating.rating
      if (rating >= 9) return 'from-emerald-400 to-emerald-600'
      if (rating >= 7) return 'from-green-400 to-green-600'
      if (rating >= 6) return 'from-blue-400 to-blue-600'
      if (rating >= 4) return 'from-yellow-400 to-yellow-600'
      if (rating >= 2) return 'from-orange-400 to-orange-600'
      return 'from-red-400 to-red-600'
    }
    return activeTeam === 'home' ? 'from-blue-500 to-blue-700' : 'from-red-500 to-red-700'
  }

  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl p-3 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200 touch-target"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform group-hover:scale-110 relative bg-gradient-to-br ${getPlayerCardColor()} ${
          userRating ? 'ring-2 ring-yellow-400/60' : ''
        }`}>
          {player.number || player.player?.number || '?'}
          
          {/* Badge SUB */}
          <div className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs px-1 py-0.5 rounded-full font-bold">
            S
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm truncate">
            {(player.player?.name || player.player || player.name || 'Joueur').split(' ').slice(-1)[0]}
          </p>
          <p className="text-xs text-gray-600 font-medium">{player.position || player.player?.pos || 'SUB'}</p>
          
          <div className="mt-1">
            {userRating ? (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                ⭐ {userRating.rating}/10
              </span>
            ) : playerStats.avgRating > 0 ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                playerStats.avgRating >= 8 ? 'bg-emerald-100 text-emerald-800' :
                playerStats.avgRating >= 6 ? 'bg-blue-100 text-blue-800' :
                playerStats.avgRating >= 4 ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                ⭐ {playerStats.avgRating.toFixed(1)}
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Appuyer pour noter
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Vue liste mobile
function MobileListView({ currentLineup, activeTeam, getPlayerStats, getUserRatingForPlayer, onPlayerSelect }: any) {
  const [showBench, setShowBench] = useState(false) // 🆕 État pour le banc en vue liste
  return (
    <div className="space-y-4">
      {/* Titulaires */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className={`p-4 text-white ${
          activeTeam === 'home' 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Équipe titulaire</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{currentLineup.formation}</span>
          </h3>
        </div>
        
        <div className="p-4">
          <div className="space-y-3">
            {currentLineup.startXI.map((player: any, index: number) => (
              <MobileListPlayerCard
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

      {/* Remplaçants - Avec système de déroulement */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header cliquable pour dérouler/fermer */}
        <button
          onClick={() => setShowBench(!showBench)}
          className="w-full bg-gradient-to-r from-gray-500 to-gray-600 p-4 text-white flex items-center justify-between hover:from-gray-600 hover:to-gray-700 transition-all"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span className="text-lg font-bold">Banc de touche</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {currentLineup.substitutes.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium opacity-90">
              {showBench ? 'Masquer' : 'Afficher'}
            </span>
            <div className={`transition-transform duration-300 ${showBench ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {/* Contenu du banc - Collapsible */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showBench 
            ? 'max-h-[2000px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}>
          <div className="p-4">
            {currentLineup.substitutes.length > 0 ? (
              <>
                {/* Info pratique */}
                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 font-medium flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>Notez les remplaçants pour une analyse complète ⭐</span>
                  </p>
                </div>

                {/* Liste des remplaçants */}
                <div className="space-y-3">
                  {currentLineup.substitutes.map((player: any, index: number) => (
                    <MobileListPlayerCard
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

                {/* Statistiques du banc */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Statistiques du banc</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">
                        {currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length}
                      </div>
                      <div className="text-xs text-gray-600">Remplaçants notés</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length > 0
                          ? (currentLineup.substitutes
                              .filter(player => getUserRatingForPlayer(player))
                              .reduce((sum, player) => sum + getUserRatingForPlayer(player).rating, 0) / 
                             currentLineup.substitutes.filter(player => getUserRatingForPlayer(player)).length
                            ).toFixed(1)
                          : '—'
                        }
                      </div>
                      <div className="text-xs text-gray-600">Note moyenne banc</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucun remplaçant dans cette équipe</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Carte joueur pour vue liste mobile
function MobileListPlayerCard({ player, playerStats, userRating, activeTeam, onSelect, isStarter }: any) {
  const getPlayerCardColor = () => {
    if (userRating && userRating.rating) {
      const rating = userRating.rating
      if (rating >= 9) return 'from-emerald-400 to-emerald-600'
      if (rating >= 7) return 'from-green-400 to-green-600'
      if (rating >= 6) return 'from-blue-400 to-blue-600'
      if (rating >= 4) return 'from-yellow-400 to-yellow-600'
      if (rating >= 2) return 'from-orange-400 to-orange-600'
      return 'from-red-400 to-red-600'
    }
    return activeTeam === 'home' ? 'from-blue-500 to-blue-700' : 'from-red-500 to-red-700'
  }

  return (
    <div
      onClick={() => onSelect({...player, ...playerStats, userRating})}
      className="group cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 touch-target"
    >
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg transition-transform group-hover:scale-110 bg-gradient-to-br ${getPlayerCardColor()} ${
          userRating ? 'ring-2 ring-yellow-400' : ''
        } ${isStarter ? 'border-2 border-white' : 'border border-gray-300'}`}>
          {player.number || player.player?.number || '?'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors text-base truncate">
              {player.player?.name || player.player || player.name || 'Joueur'}
            </h4>
            {isStarter && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
          </div>
          <p className="text-sm text-gray-600 font-medium mb-2">
            {player.position || player.player?.pos || (isStarter ? 'Titulaire' : 'Remplaçant')}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {userRating ? (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                ⭐ Votre note: {userRating.rating}/10
              </span>
            ) : playerStats.avgRating > 0 ? (
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                playerStats.avgRating >= 8 ? 'bg-green-100 text-green-800' :
                playerStats.avgRating >= 6 ? 'bg-blue-100 text-blue-800' :
                playerStats.avgRating >= 4 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                ⭐ {playerStats.avgRating.toFixed(1)} ({playerStats.totalRatings} votes)
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                Cliquez pour noter
              </span>
            )}
          </div>
        </div>
        
        {/* Indicateur de clic */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}

// Modal de notation mobile-optimized
function MobilePlayerRatingModal({ player, matchId, onRate, onClose, teamColor }: any) {
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
    if (rating === 0) return { emoji: "🤔", text: "Tapez pour noter", color: "text-gray-500" }
    if (rating <= 2) return { emoji: "😞", text: "Très décevant", color: "text-red-600" }
    if (rating <= 4) return { emoji: "😐", text: "En-dessous des attentes", color: "text-orange-600" }
    if (rating <= 6) return { emoji: "🙂", text: "Performance correcte", color: "text-yellow-600" }
    if (rating <= 8) return { emoji: "😊", text: "Bonne performance", color: "text-green-600" }
    return { emoji: "🔥", text: "Exceptionnel !", color: "text-emerald-600" }
  }

  const ratingDesc = getRatingDescription(selectedRating)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 text-white relative overflow-hidden rounded-t-3xl ${
          teamColor === 'blue' 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
            : 'bg-gradient-to-br from-red-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-black backdrop-blur-sm">
                {player.number || player.player?.number || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold leading-tight">
                  {(player.player?.name || player.player || player.name || 'Joueur').split(' ').slice(-1)[0]}
                </h3>
                <p className="text-white/90 text-sm">{player.position || player.player?.pos || 'Joueur'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Système de notation tactile */}
          <div>
            <p className="text-sm font-bold mb-4 text-gray-700">Note sur 10 :</p>
            
            {/* Grille 2x5 pour mobile */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-xl text-sm font-black transition-all duration-200 touch-target ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900 shadow-lg scale-105 ring-2 ring-yellow-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(selectedRating / 10) * 100}%` }}
              ></div>
            </div>
            
            {/* Description */}
            <div className={`text-center text-sm font-bold ${ratingDesc.color} bg-gray-50 rounded-xl p-3`}>
              <span className="text-2xl mr-2">{ratingDesc.emoji}</span>
              {ratingDesc.text}
            </div>
          </div>
          
          {/* Commentaire */}
          <div>
            <label className="block text-sm font-bold mb-3 text-gray-700">
              💭 Commentaire (optionnel) :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 text-sm"
              rows={3}
              placeholder="Votre avis sur sa performance..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/200
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold touch-target"
            >
              Annuler
            </button>
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className={`flex-2 px-4 py-3 rounded-xl transition-all font-bold text-white shadow-lg touch-target ${
                selectedRating === 0 || submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : teamColor === 'blue'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  En cours...
                </div>
              ) : (
                `${player.userRating ? '✏️ Modifier' : '⭐ Noter'} ${selectedRating > 0 ? `(${selectedRating}/10)` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}