// components/FavoriteButton.tsx - VERSION AMÉLIORÉE AVEC GESTION DES LIMITES
import { useState } from 'react'
import { Heart, Star, Crown, Bookmark } from 'lucide-react'
import axios from 'axios'

interface FavoriteButtonProps {
  type: 'MATCH' | 'PLAYER'
  id: string
  isInitiallyFavorite?: boolean
  variant?: 'heart' | 'star' | 'crown' | 'bookmark'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  showCounter?: boolean
  onToggle?: (isFavorite: boolean) => void
  matchData?: {
    homeTeam: string
    awayTeam: string
    competition: string
  }
}

export default function FavoriteButton({
  type,
  id,
  isInitiallyFavorite = false,
  variant = 'bookmark',
  size = 'md',
  showText = false,
  showCounter = false,
  onToggle,
  matchData
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(isInitiallyFavorite)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    try {
      setLoading(true)
      
      const action = isFavorite ? 'remove' : 'add'
      const data: any = { action, type }
      
      if (type === 'MATCH') {
        data.matchId = id
      } else {
        data.playerId = id
      }

      const response = await axios.post('/api/favorites', data)
      
      const newFavoriteState = !isFavorite
      setIsFavorite(newFavoriteState)
      onToggle?.(newFavoriteState)

      // Notification de succès avec informations spécifiques
      const message = response.data.message || (newFavoriteState
        ? `${type === 'MATCH' ? 'Match' : 'Joueur'} ajouté aux favoris ! ⭐`
        : `${type === 'MATCH' ? 'Match' : 'Joueur'} retiré des favoris`)
      
      // Toast notification améliorée
      showNotification(message, 'success', response.data)

    } catch (error: any) {
      console.error('Erreur toggle favori:', error)
      
      // Gestion des erreurs spécifiques
      let errorMessage = 'Erreur lors de la modification des favoris'
      
      if (error.response?.data?.code === 'LIMIT_REACHED') {
        errorMessage = `🔒 ${error.response.data.error}\n\nVous avez déjà ${error.response.data.current}/${error.response.data.limit} matchs favoris.`
      } else if (error.response?.data?.code === 'ALREADY_FAVORITE') {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error', extraData?: any) => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    
    let content = `
      <div class="flex items-start space-x-3">
        <div class="text-2xl">
          ${type === 'success' ? '⭐' : '❌'}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-white">${message.split('\n')[0]}</div>
    `
    
    // Ajouter des infos supplémentaires si c'est un succès
    if (type === 'success' && extraData) {
      if (extraData.remainingSlots !== undefined) {
        content += `<div class="text-white/90 text-sm mt-1">
          ${extraData.remainingSlots} emplacements restants (${5 - extraData.remainingSlots}/5)
        </div>`
      }
    }
    
    // Ajouter le texte d'erreur complet si nécessaire
    if (type === 'error' && message.includes('\n')) {
      content += `<div class="text-white/90 text-sm mt-1">
        ${message.split('\n').slice(1).join('\n')}
      </div>`
    }
    
    content += `
        </div>
      </div>
    `
    
    notification.innerHTML = content
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, type === 'error' ? 5000 : 3000)
  }

  const getIcon = () => {
    switch (variant) {
      case 'heart':
        return Heart
      case 'crown':
        return Crown
      case 'star':
        return Star
      default:
        return Bookmark
    }
  }

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-5 h-5'
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'p-1.5'
      case 'lg':
        return 'p-3'
      default:
        return 'p-2'
    }
  }

  const getColors = () => {
    if (isFavorite) {
      switch (variant) {
        case 'heart':
          return 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200'
        case 'crown':
          return 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
        case 'star':
          return 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
        default: // bookmark
          return 'text-blue-500 bg-blue-50 hover:bg-blue-100 border-blue-200'
      }
    } else {
      return 'text-gray-400 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:text-gray-600'
    }
  }

  const getTooltipText = () => {
    if (type === 'MATCH') {
      if (isFavorite) {
        return 'Retirer de vos 5 matchs favoris'
      } else {
        return 'Ajouter à vos 5 matchs favoris (comme sur Letterboxd !)'
      }
    } else {
      return isFavorite 
        ? 'Retirer des favoris ce joueur'
        : 'Ajouter aux favoris ce joueur'
    }
  }

  const getButtonText = () => {
    if (type === 'MATCH') {
      return isFavorite ? 'Top 5' : 'Ajouter au Top 5'
    } else {
      return isFavorite ? 'Favori' : 'Ajouter aux favoris'
    }
  }

  const Icon = getIcon()

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${getButtonSize()} border-2 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${getColors()} ${
        showText ? 'flex items-center space-x-2' : ''
      }`}
      title={getTooltipText()}
    >
      {loading ? (
        <div className={`${getSize()} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : (
        <Icon className={`${getSize()} ${isFavorite ? 'fill-current' : ''}`} />
      )}
      
      {showText && (
        <span className="text-sm font-medium whitespace-nowrap">
          {getButtonText()}
        </span>
      )}

      {showCounter && type === 'MATCH' && isFavorite && (
        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
          Top 5
        </span>
      )}
    </button>
  )
}

// Composant pour afficher le statut des favoris
interface FavoritesStatusProps {
  favoriteMatchesCount: number
  favoritePlayersCount: number
  maxMatches?: number
}

export function FavoritesStatus({ 
  favoriteMatchesCount, 
  favoritePlayersCount,
  maxMatches = 5
}: FavoritesStatusProps) {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Bookmark className="w-4 h-4 text-blue-500" />
          {favoriteMatchesCount >= maxMatches && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </div>
        <span className={`${favoriteMatchesCount >= maxMatches ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
          Top 5 Matchs: {favoriteMatchesCount}/{maxMatches}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Crown className="w-4 h-4 text-purple-500" />
        <span className="text-gray-600">
          Joueurs: {favoritePlayersCount}
        </span>
      </div>
    </div>
  )
}

// Hook pour gérer les favoris
export function useFavorites(userId?: string) {
  const [favorites, setFavorites] = useState<{
    matches: any[]
    players: any[]
    counts: { matches: number, players: number }
  }>({
    matches: [],
    players: [],
    counts: { matches: 0, players: 0 }
  })
  const [loading, setLoading] = useState(false)

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/favorites')
      setFavorites({
        matches: response.data.favoriteMatches || [],
        players: response.data.favoritePlayers || [],
        counts: response.data.counts || { matches: 0, players: 0 }
      })
    } catch (error) {
      console.error('Erreur chargement favoris:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (type: 'MATCH' | 'PLAYER', id: string, isCurrentlyFavorite: boolean) => {
    try {
      const action = isCurrentlyFavorite ? 'remove' : 'add'
      const data: any = { action, type }
      
      if (type === 'MATCH') {
        data.matchId = id
      } else {
        data.playerId = id
      }

      await axios.post('/api/favorites', data)
      await fetchFavorites() // Refresh
      
      return true
    } catch (error) {
      console.error('Erreur toggle favori:', error)
      throw error
    }
  }

  const isMatchFavorite = (matchId: string) => {
    return favorites.matches.some(fav => fav.match?.id === matchId)
  }

  const isPlayerFavorite = (playerId: string) => {
    return favorites.players.some(fav => fav.player?.id === playerId)
  }

  return {
    favorites,
    loading,
    fetchFavorites,
    toggleFavorite,
    isMatchFavorite,
    isPlayerFavorite
  }
}