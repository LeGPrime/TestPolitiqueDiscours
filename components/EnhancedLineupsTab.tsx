// FICHIER: components/EnhancedLineupsTab.tsx
// Créer ce nouveau fichier

import { useState } from 'react'
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
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: EnhancedLineupsTabProps) {
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  
  const getUserRatingForPlayer = (playerId: string) => {
    return playerRatings?.find((rating: any) => 
      rating.playerId === playerId && rating.userId === currentUserId
    )
  }

  const getPlayerStats = (playerId: string) => {
    const ratings = playerRatings?.filter((rating: any) => rating.playerId === playerId) || []
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
      : 0
    
    return {
      avgRating,
      totalRatings: ratings.length,
      recentRatings: ratings.slice(0, 3)
    }
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
          <span>Équipe domicile</span>
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
          <span>Équipe extérieure</span>
        </button>
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
            Titulaires
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTeam === 'home' ? lineups.home.startXI : lineups.away.startXI).map((player: any, index: number) => {
              const playerStats = getPlayerStats(player.id)
              const userRating = getUserRatingForPlayer(player.id)
              
              return (
                <PlayerCard
                  key={index}
                  player={{ ...player, ...playerStats }}
                  matchId={matchId}
                  userRating={userRating}
                  onRate={onRatePlayer}
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
            Remplaçants
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTeam === 'home' ? lineups.home.substitutes : lineups.away.substitutes).map((player: any, index: number) => {
              const playerStats = getPlayerStats(player.id)
              const userRating = getUserRatingForPlayer(player.id)
              
              return (
                <PlayerCard
                  key={index}
                  player={{ ...player, ...playerStats }}
                  matchId={matchId}
                  userRating={userRating}
                  onRate={onRatePlayer}
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
    </div>
  )
}