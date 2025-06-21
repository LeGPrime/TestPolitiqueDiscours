// FICHIER: components/PlayerCard.tsx
// Créer ce nouveau fichier

import { useState } from 'react'

interface PlayerCardProps {
  player: {
    id: string
    name: string
    number?: number
    position?: string
    avgRating?: number
    totalRatings?: number
    recentRatings?: any[]
  }
  matchId: string
  userRating?: {
    rating: number
    comment?: string
  }
  onRate: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
  teamColor: string
}

export default function PlayerCard({ 
  player, 
  matchId, 
  userRating, 
  onRate, 
  currentUserId, 
  teamColor 
}: PlayerCardProps) {
  const [selectedRating, setSelectedRating] = useState(userRating?.rating || 0)
  const [comment, setComment] = useState(userRating?.comment || '')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async () => {
    if (selectedRating === 0 || submitting) return

    setSubmitting(true)
    try {
      await onRate(player.id, selectedRating, comment)
      setShowRatingForm(false)
    } catch (error) {
      console.error('Erreur notation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg border-l-4 ${teamColor} shadow-sm hover:shadow-md transition-all p-4`}>
      {/* Header joueur */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            teamColor === 'border-blue-500' ? 'bg-blue-500' : 'bg-red-500'
          }`}>
            {player.number || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{player.name}</h4>
            <p className="text-sm text-gray-600">{player.position}</p>
          </div>
        </div>
        
        {/* Note moyenne */}
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {player.avgRating ? player.avgRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-500">
            {player.totalRatings || 0} notes
          </div>
        </div>
      </div>

      {/* Notation utilisateur */}
      {userRating ? (
        <div className="bg-green-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">✅ Votre note</span>
            <div className="flex space-x-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < userRating.rating ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          {userRating.comment && (
            <p className="text-sm text-green-700">"{userRating.comment}"</p>
          )}
          <button
            onClick={() => setShowRatingForm(true)}
            className="text-xs text-green-600 hover:text-green-700 mt-1"
          >
            Modifier
          </button>
        </div>
      ) : (
        !showRatingForm && (
          <button
            onClick={() => setShowRatingForm(true)}
            className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            ⭐ Noter ce joueur
          </button>
        )
      )}

      {/* Formulaire de notation */}
      {showRatingForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Note sur 10 :</p>
            <div className="flex space-x-1">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                    i < selectedRating 
                      ? 'bg-yellow-400 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Mini-review :</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Votre avis sur sa performance..."
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {submitting ? '...' : '✅ Noter'}
            </button>
            <button
              onClick={() => {
                setShowRatingForm(false)
                setSelectedRating(userRating?.rating || 0)
                setComment(userRating?.comment || '')
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Aperçu des autres notes */}
      {player.recentRatings && player.recentRatings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-2">Derniers avis :</p>
          <div className="space-y-1">
            {player.recentRatings.slice(0, 2).map((rating: any, index: number) => (
              <div key={index} className="text-xs bg-gray-50 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{rating.user.name}</span>
                  <span className="text-blue-600 font-bold">{rating.rating}/10</span>
                </div>
                {rating.comment && (
                  <p className="text-gray-600 italic">"{rating.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}