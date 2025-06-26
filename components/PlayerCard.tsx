// components/PlayerCard.tsx
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
  onRate: (player: any, rating: number, comment?: string) => Promise<void>
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
  const [error, setError] = useState('')

  const handleRate = async () => {
    if (selectedRating === 0 || submitting) return

    setSubmitting(true)
    setError('')

    try {
      console.log('🎯 Tentative notation:', { 
        player: player.name, 
        rating: selectedRating, 
        comment 
      })

      await onRate(player, selectedRating, comment)
      setShowRatingForm(false)
      
      // Notification de succès
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.textContent = `✅ ${player.name} noté ${selectedRating}/10 !`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)

    } catch (error: any) {
      console.error('❌ Erreur notation:', error)
      setError(error.message || 'Erreur lors de la notation')
      
      // Notification d'erreur
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.textContent = `❌ Erreur: ${error.message || 'Notation échouée'}`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 4000)
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-100'
    if (rating >= 6) return 'text-blue-600 bg-blue-100'
    if (rating >= 4) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRatingDescription = (rating: number) => {
    if (rating >= 9) return { emoji: "🔥", text: "Exceptionnel" }
    if (rating >= 8) return { emoji: "⭐", text: "Excellent" }
    if (rating >= 7) return { emoji: "👍", text: "Très bon" }
    if (rating >= 6) return { emoji: "👌", text: "Bon" }
    if (rating >= 5) return { emoji: "😐", text: "Correct" }
    if (rating >= 4) return { emoji: "👎", text: "Décevant" }
    return { emoji: "💩", text: "Très mauvais" }
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
            <h4 className="font-semibold text-gray-900 text-sm leading-tight">{player.name}</h4>
            <p className="text-xs text-gray-600">{player.position || 'N/A'}</p>
          </div>
        </div>
        
        {/* Note moyenne */}
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {player.avgRating && player.avgRating > 0 ? player.avgRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-500">
            {player.totalRatings || 0} vote{(player.totalRatings || 0) > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* État actuel de la notation */}
      {userRating ? (
        <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800 flex items-center">
              ✅ Votre note
            </span>
            <div className={`px-2 py-1 rounded-full text-sm font-bold ${getRatingColor(userRating.rating)}`}>
              {userRating.rating}/10
            </div>
          </div>
          {userRating.comment && (
            <p className="text-sm text-green-700 italic">"{userRating.comment}"</p>
          )}
          <button
            onClick={() => setShowRatingForm(true)}
            className="text-xs text-green-600 hover:text-green-700 mt-2 underline"
          >
            Modifier ma note
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
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-3">Note sur 10 :</p>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md scale-105' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-105'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            {/* Description de la note */}
            {selectedRating > 0 && (
              <div className="mt-2 text-center">
                <span className="text-sm font-medium text-gray-700">
                  {getRatingDescription(selectedRating).emoji} {getRatingDescription(selectedRating).text}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Commentaire (optionnel) :</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Votre avis sur sa performance..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {comment.length}/200
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedRating === 0 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Notation...
                </div>
              ) : (
                `✅ Noter ${selectedRating > 0 ? selectedRating + '/10' : ''}`
              )}
            </button>
            <button
              onClick={() => {
                setShowRatingForm(false)
                setSelectedRating(userRating?.rating || 0)
                setComment(userRating?.comment || '')
                setError('')
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Aperçu des autres notes */}
      {player.recentRatings && player.recentRatings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-2">
            📊 Derniers avis ({player.recentRatings.length}) :
          </p>
          <div className="space-y-1">
            {player.recentRatings.slice(0, 2).map((rating: any, index: number) => (
              <div key={index} className="text-xs bg-gray-50 rounded p-2 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">
                    {rating.user?.name || 'Anonyme'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getRatingColor(rating.rating)}`}>
                    {rating.rating}/10
                  </span>
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