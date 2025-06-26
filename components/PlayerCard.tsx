import { useState } from 'react'
import { Star, TrendingUp, Award, Zap, Target, Crown } from 'lucide-react'

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
      
      // Notification de succès moderne
      showNotification(
        `✅ ${player.name} noté ${selectedRating}/10 !`,
        'success'
      )

    } catch (error: any) {
      console.error('❌ Erreur notation:', error)
      setError(error.message || 'Erreur lors de la notation')
      
      showNotification(
        `❌ Erreur: ${error.message || 'Notation échouée'}`,
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm transform transition-all duration-300 ${
      type === 'success' 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
        : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="text-2xl">${type === 'success' ? '🎉' : '⚠️'}</div>
        <div class="font-semibold">${message}</div>
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'from-emerald-500 to-green-600 text-white'
    if (rating >= 8) return 'from-green-500 to-emerald-500 text-white'
    if (rating >= 7) return 'from-blue-500 to-indigo-500 text-white'
    if (rating >= 6) return 'from-yellow-500 to-amber-500 text-white'
    if (rating >= 5) return 'from-orange-500 to-red-500 text-white'
    return 'from-red-600 to-red-700 text-white'
  }

  const getRatingDescription = (rating: number) => {
    if (rating >= 9) return { emoji: "🔥", text: "Phénoménal", color: "text-emerald-600" }
    if (rating >= 8) return { emoji: "⭐", text: "Excellent", color: "text-green-600" }
    if (rating >= 7) return { emoji: "👍", text: "Très bon", color: "text-blue-600" }
    if (rating >= 6) return { emoji: "👌", text: "Bon", color: "text-yellow-600" }
    if (rating >= 5) return { emoji: "😐", text: "Correct", color: "text-orange-600" }
    if (rating >= 4) return { emoji: "👎", text: "Décevant", color: "text-red-600" }
    return { emoji: "💩", text: "Très mauvais", color: "text-red-700" }
  }

  const getPerformanceLevel = (avgRating: number) => {
    if (avgRating >= 8.5) return { level: "LEGEND", color: "from-purple-500 to-pink-500", icon: <Crown className="w-4 h-4" /> }
    if (avgRating >= 8) return { level: "ELITE", color: "from-green-500 to-emerald-500", icon: <Award className="w-4 h-4" /> }
    if (avgRating >= 7) return { level: "STAR", color: "from-blue-500 to-indigo-500", icon: <Star className="w-4 h-4" /> }
    if (avgRating >= 6) return { level: "SOLID", color: "from-yellow-500 to-amber-500", icon: <Target className="w-4 h-4" /> }
    if (avgRating >= 5) return { level: "AVERAGE", color: "from-gray-500 to-gray-600", icon: <TrendingUp className="w-4 h-4" /> }
    return { level: "BELOW", color: "from-red-500 to-red-600", icon: <Zap className="w-4 h-4" /> }
  }

  const performanceLevel = player.avgRating ? getPerformanceLevel(player.avgRating) : null

  return (
    <div className={`bg-white rounded-2xl border-l-4 ${teamColor === 'border-blue-500' ? 'border-blue-500' : 'border-red-500'} shadow-lg hover:shadow-2xl transition-all duration-300 p-6 transform hover:scale-105`}>
      {/* Header joueur modernisé */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl relative ${
            teamColor === 'border-blue-500' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'
          }`}>
            {player.number || '?'}
            
            {/* Badge de performance */}
            {performanceLevel && (
              <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br ${performanceLevel.color} rounded-full flex items-center justify-center shadow-lg`}>
                {performanceLevel.icon}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-black text-gray-900 text-lg leading-tight">{player.name}</h4>
            <p className="text-sm text-gray-600 font-medium">{player.position || 'N/A'}</p>
            {performanceLevel && (
              <div className={`inline-flex items-center space-x-1 mt-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${performanceLevel.color}`}>
                {performanceLevel.icon}
                <span>{performanceLevel.level}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Note moyenne avec design moderne */}
        <div className="text-center">
          <div className={`text-3xl font-black mb-1 ${
            player.avgRating && player.avgRating > 0 
              ? player.avgRating >= 8 ? 'text-green-600' :
                player.avgRating >= 6 ? 'text-blue-600' :
                player.avgRating >= 4 ? 'text-yellow-600' :
                'text-red-600'
              : 'text-gray-400'
          }`}>
            {player.avgRating && player.avgRating > 0 ? player.avgRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {player.totalRatings || 0} vote{(player.totalRatings || 0) > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* État actuel de la notation */}
      {userRating ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-sm font-black text-green-800">Votre évaluation</span>
            </div>
            <div className={`px-4 py-2 rounded-xl text-lg font-black bg-gradient-to-r ${getRatingColor(userRating.rating)}`}>
              {userRating.rating}/10
            </div>
          </div>
          {userRating.comment && (
            <div className="bg-white bg-opacity-60 rounded-xl p-3 mb-3">
              <p className="text-sm text-green-800 italic font-medium">"{userRating.comment}"</p>
            </div>
          )}
          <button
            onClick={() => setShowRatingForm(true)}
            className="text-xs text-green-700 hover:text-green-800 font-bold underline transition-colors"
          >
            ✏️ Modifier ma note
          </button>
        </div>
      ) : (
        !showRatingForm && (
          <button
            onClick={() => setShowRatingForm(true)}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              teamColor === 'border-blue-500' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' 
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            }`}
          >
            ⭐ Noter ce joueur
          </button>
        )
      )}

      {/* Formulaire de notation modernisé */}
      {showRatingForm && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-6 border border-gray-200">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-xl p-4">
              <p className="text-red-800 text-sm font-medium">❌ {error}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-black mb-4 text-gray-700">Note sur 10 :</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-xl text-sm font-black transition-all duration-200 ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900 shadow-lg scale-105 ring-2 ring-yellow-300' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105 shadow-md'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(selectedRating / 10) * 100}%` }}
              ></div>
            </div>
            
            {/* Description de la note */}
            {selectedRating > 0 && (
              <div className={`text-center text-sm font-bold ${getRatingDescription(selectedRating).color} bg-white rounded-xl p-3 shadow-sm`}>
                <span className="text-2xl mr-2">{getRatingDescription(selectedRating).emoji}</span>
                {getRatingDescription(selectedRating).text}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-black mb-3 text-gray-700">Commentaire (optionnel) :</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              rows={3}
              placeholder="Votre avis sur sa performance..."
              maxLength={200}
            />
            <div className="text-xs text-gray-500 text-right mt-2">
              {comment.length}/200
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className={`flex-1 py-4 px-6 rounded-xl text-lg font-black transition-all duration-200 ${
                selectedRating === 0 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : teamColor === 'border-blue-500'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
              className="px-6 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-100 text-lg font-bold transition-all border-2 border-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Aperçu des autres notes modernisé */}
      {player.recentRatings && player.recentRatings.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-black text-gray-600 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Derniers avis de la communauté ({player.recentRatings.length}) :</span>
          </p>
          <div className="space-y-3">
            {player.recentRatings.slice(0, 2).map((rating: any, index: number) => (
              <div key={index} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800 text-sm">
                    {rating.user?.name || 'Fan anonyme'}
                  </span>
                  <div className={`px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${getRatingColor(rating.rating)}`}>
                    {rating.rating}/10
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-gray-700 italic text-sm bg-gray-50 rounded-lg p-2">
                    "{rating.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}