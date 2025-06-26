// components/EnhancedLineupsTab.tsx - VERSION CORRIGÉE
import { useState, useEffect } from 'react'
import PlayerCard from './PlayerCard'

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
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [localPlayerRatings, setLocalPlayerRatings] = useState<any[]>([])
  
  // Charger les notations des joueurs au montage
  useEffect(() => {
    loadPlayerRatings()
  }, [matchId])

  const loadPlayerRatings = async () => {
    try {
      setLoadingRatings(true)
      const response = await fetch(`/api/player-ratings?matchId=${matchId}`)
      const data = await response.json()
      
      if (data.success) {
        setLocalPlayerRatings(data.ratings || [])
        console.log(`📊 ${data.ratings?.length || 0} notations joueurs chargées`)
      }
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

  // 🔧 FONCTION CORRIGÉE pour générer l'ID du joueur
  const getPlayerId = (player: any) => {
    const playerName = player.player?.name || player.player || player.name || 'Unknown'
    const currentTeam = activeTeam === 'home' ? lineups.home.teamName : lineups.away.teamName
    
    // 🔧 FORMAT CORRIGÉ: Nom_Equipe (plus simple et plus fiable)
    const cleanPlayerName = playerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.]/g, '')
    const cleanTeamName = (currentTeam || 'Unknown_Team').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    
    const playerId = `${cleanPlayerName}_${cleanTeamName}`
    
    console.log('🎯 ID généré:', {
      originalName: playerName,
      team: currentTeam,
      generatedId: playerId
    })
    
    return playerId
  }

  const enhancedOnRatePlayer = async (player: any, rating: number, comment?: string) => {
    try {
      const playerId = getPlayerId(player)
      
      console.log('🎯 Notation joueur:', {
        playerId,
        playerName: player.player?.name || player.player || player.name,
        team: activeTeam === 'home' ? lineups.home.teamName : lineups.away.teamName,
        rating,
        comment,
        matchId
      })

      await onRatePlayer(playerId, rating, comment)
      
      // Recharger les notations après succès
      await loadPlayerRatings()
      
    } catch (error) {
      console.error('Erreur notation joueur:', error)
      throw error
    }
  }

  if (loadingRatings) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des compositions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle équipes */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-fit mx-auto">
        <button
          onClick={() => setActiveTeam('home')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTeam === 'home'
              ? 'bg-white text-blue-600 shadow-sm font-medium'
              : 'text-gray-600'
          }`}
        >
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>{lineups.home.teamName || 'Équipe domicile'}</span>
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTeam === 'away'
              ? 'bg-white text-red-600 shadow-sm font-medium'
              : 'text-gray-600'
          }`}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>{lineups.away.teamName || 'Équipe extérieure'}</span>
        </button>
      </div>

      {/* 🔧 DEBUG INFO - à supprimer une fois que ça marche */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p><strong>🔍 Debug Info:</strong></p>
        <p>Équipe active: {activeTeam}</p>
        <p>Nom équipe: {activeTeam === 'home' ? lineups.home.teamName : lineups.away.teamName}</p>
        <p>Notations chargées: {localPlayerRatings.length}</p>
      </div>

      {/* Équipe sélectionnée */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {activeTeam === 'home' ? lineups.home.teamName : lineups.away.teamName}
          </h3>
          <div className="text-sm text-gray-600">
            Formation: {activeTeam === 'home' ? lineups.home.formation : lineups.away.formation}
          </div>
        </div>

        {/* Titulaires */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              activeTeam === 'home' ? 'bg-blue-500' : 'bg-red-500'
            }`}></div>
            Titulaires ({(activeTeam === 'home' ? lineups.home.startXI : lineups.away.startXI).length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTeam === 'home' ? lineups.home.startXI : lineups.away.startXI).map((player: any, index: number) => {
              const playerStats = getPlayerStats(player)
              const userRating = getUserRatingForPlayer(player)
              
              return (
                <PlayerCard
                  key={`${getPlayerId(player)}_${index}`}
                  player={{ 
                    ...player, 
                    id: getPlayerId(player),
                    name: player.player?.name || player.player || player.name || `Joueur ${index + 1}`,
                    number: player.player?.number || player.number || index + 1,
                    position: player.player?.pos || player.position || 'N/A',
                    ...playerStats 
                  }}
                  matchId={matchId}
                  userRating={userRating}
                  onRate={enhancedOnRatePlayer}
                  currentUserId={currentUserId}
                  teamColor={activeTeam === 'home' ? 'border-blue-500' : 'border-red-500'}
                />
              )
            })}
          </div>
        </div>

        {/* Remplaçants */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              activeTeam === 'home' ? 'bg-blue-300' : 'bg-red-300'
            }`}></div>
            Remplaçants ({(activeTeam === 'home' ? lineups.home.substitutes : lineups.away.substitutes).length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTeam === 'home' ? lineups.home.substitutes : lineups.away.substitutes).map((player: any, index: number) => {
              const playerStats = getPlayerStats(player)
              const userRating = getUserRatingForPlayer(player)
              
              return (
                <PlayerCard
                  key={`${getPlayerId(player)}_sub_${index}`}
                  player={{ 
                    ...player, 
                    id: getPlayerId(player),
                    name: player.player?.name || player.player || player.name || `Remplaçant ${index + 1}`,
                    number: player.player?.number || player.number || (50 + index),
                    position: player.player?.pos || player.position || 'SUB',
                    ...playerStats 
                  }}
                  matchId={matchId}
                  userRating={userRating}
                  onRate={enhancedOnRatePlayer}
                  currentUserId={currentUserId}
                  teamColor={activeTeam === 'home' ? 'border-blue-500' : 'border-red-500'}
                />
              )
            })}
          </div>
        </div>

        {/* Coach */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
              activeTeam === 'home' ? 'bg-blue-600' : 'bg-red-600'
            }`}>
              C
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {activeTeam === 'home' ? lineups.home.coach : lineups.away.coach}
              </p>
              <p className="text-sm text-gray-600">Entraîneur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques des notations */}
      {localPlayerRatings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">📊 Statistiques des notations</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{localPlayerRatings.length}</div>
              <div className="text-sm text-blue-700">Notes données</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {localPlayerRatings.length > 0 
                  ? (localPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / localPlayerRatings.length).toFixed(1)
                  : '0'
                }
              </div>
              <div className="text-sm text-green-700">Moyenne générale</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.max(...localPlayerRatings.map(r => r.rating), 0)}
              </div>
              <div className="text-sm text-yellow-700">Note maximale</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(localPlayerRatings.map(r => r.playerId)).size}
              </div>
              <div className="text-sm text-purple-700">Joueurs notés</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}