// components/FavoriteButton.tsx
import { useState } from 'react'
import { Heart, Star, Crown } from 'lucide-react'
import axios from 'axios'

interface FavoriteButtonProps {
  type: 'MATCH' | 'PLAYER'
  id: string
  isInitiallyFavorite?: boolean
  variant?: 'heart' | 'star' | 'crown'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onToggle?: (isFavorite: boolean) => void
}

export default function FavoriteButton({
  type,
  id,
  isInitiallyFavorite = false,
  variant = 'star',
  size = 'md',
  showText = false,
  onToggle
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

      await axios.post('/api/favorites', data)
      
      const newFavoriteState = !isFavorite
      setIsFavorite(newFavoriteState)
      onToggle?.(newFavoriteState)

      // Notification de succès
      const message = newFavoriteState
        ? `${type === 'MATCH' ? 'Match' : 'Joueur'} ajouté aux favoris ! ⭐`
        : `${type === 'MATCH' ? 'Match' : 'Joueur'} retiré des favoris`
      
      // Toast notification simple
      const toast = document.createElement('div')
      toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transform transition-all duration-300 ${
        newFavoriteState ? 'bg-green-500' : 'bg-gray-500'
      }`
      toast.textContent = message
      document.body.appendChild(toast)
      
      setTimeout(() => {
        toast.style.opacity = '0'
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 2000)

    } catch (error: any) {
      console.error('Erreur toggle favori:', error)
      
      // Afficher l'erreur spécifique (limite atteinte, etc.)
      const errorMessage = error.response?.data?.error || 'Erreur lors de la modification des favoris'
      
      const errorToast = document.createElement('div')
      errorToast.className = 'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-red-500 text-white text-sm font-medium transform transition-all duration-300'
      errorToast.textContent = errorMessage
      document.body.appendChild(errorToast)
      
      setTimeout(() => {
        errorToast.style.opacity = '0'
        setTimeout(() => document.body.removeChild(errorToast), 300)
      }, 4000)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'heart':
        return Heart
      case 'crown':
        return Crown
      default:
        return Star
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
        return 'p-1'
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
        default:
          return 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
      }
    } else {
      return 'text-gray-400 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:text-gray-600'
    }
  }

  const Icon = getIcon()

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${getButtonSize()} border-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${getColors()} ${
        showText ? 'flex items-center space-x-2' : ''
      }`}
      title={isFavorite 
        ? `Retirer des favoris ${type === 'MATCH' ? 'ce match' : 'ce joueur'}`
        : `Ajouter aux favoris ${type === 'MATCH' ? 'ce match' : 'ce joueur'}`
      }
    >
      {loading ? (
        <div className={`${getSize()} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : (
        <Icon className={`${getSize()} ${isFavorite ? 'fill-current' : ''}`} />
      )}
      
      {showText && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
        </span>
      )}
    </button>
  )
}

// components/FavoritesIndicator.tsx - Pour afficher le statut des favoris
interface FavoritesIndicatorProps {
  favoriteMatchesCount: number
  favoritePlayersCount: number
  maxMatches?: number
  maxPlayersPerSport?: number
}

export function FavoritesIndicator({ 
  favoriteMatchesCount, 
  favoritePlayersCount,
  maxMatches = 5,
  maxPlayersPerSport = 1
}: FavoritesIndicatorProps) {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-gray-600">
          Matchs: {favoriteMatchesCount}/{maxMatches}
        </span>
      </div>
      
      <div className="flex items-center space-x-1">
        <Crown className="w-4 h-4 text-purple-500" />
        <span className="text-gray-600">
          Joueurs: {favoritePlayersCount}
        </span>
      </div>
    </div>
  )
}