// components/TeamCard.tsx
import { Heart, Users, Globe, Calendar, MapPin } from 'lucide-react'

interface Team {
  id: string
  name: string
  logo?: string
  sport: string
  league?: string
  country?: string
  founded?: number
  website?: string
  followersCount: number
  isFollowed: boolean
  followedSince?: string
}

interface TeamCardProps {
  team: Team
  onToggleFollow: (teamId: string, isFollowed: boolean) => void
  isOwnProfile: boolean
  showFollowButton?: boolean
}

export default function TeamCard({ 
  team, 
  onToggleFollow, 
  isOwnProfile, 
  showFollowButton = true
}: TeamCardProps) {
  const getSportEmoji = (sport: string) => {
    const emojis = {
      football: '⚽',
      basketball: '🏀',
      mma: '🥊',
      rugby: '🏉',
      f1: '🏎️'
    }
    return emojis[sport.toLowerCase() as keyof typeof emojis] || '🏆'
  }

  const getSportColor = (sport: string) => {
    const colors = {
      football: 'from-green-400 to-emerald-500',
      basketball: 'from-orange-400 to-red-500',
      mma: 'from-red-400 to-pink-500',
      rugby: 'from-purple-400 to-indigo-500',
      f1: 'from-blue-400 to-cyan-500'
    }
    return colors[sport.toLowerCase() as keyof typeof colors] || 'from-gray-400 to-gray-500'
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${
      team.isFollowed ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
    }`}>
      {/* Header avec logo et sport */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {team.logo ? (
            <img 
              src={team.logo} 
              alt={team.name} 
              className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-12 h-12 bg-gradient-to-br ${getSportColor(team.sport)} rounded-full flex items-center justify-center shadow-sm ${team.logo ? 'hidden' : ''}`}>
            <span className="text-white font-bold text-lg">
              {team.name[0].toUpperCase()}
            </span>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {team.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="text-lg">{getSportEmoji(team.sport)}</span>
              <span className="capitalize">{team.sport}</span>
            </div>
          </div>
        </div>

        {/* Badge de suivi */}
        {team.isFollowed && (
          <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
            <Heart className="w-3 h-3 fill-current" />
            <span>Suivi</span>
          </div>
        )}
      </div>

      {/* Infos de l'équipe */}
      <div className="space-y-2 mb-4">
        {team.league && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>🏆</span>
            <span>{team.league}</span>
          </div>
        )}
        
        {team.country && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{team.country}</span>
          </div>
        )}
        
        {team.founded && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Fondé en {team.founded}</span>
          </div>
        )}
      </div>

      {/* Stats et actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{team.followersCount}</span>
          <span>follower{team.followersCount > 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Lien site web */}
          {team.website && (
            <a
              href={team.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
            </a>
          )}

          {/* Bouton de suivi */}
          {isOwnProfile && showFollowButton && (
            <button
              onClick={() => onToggleFollow(team.id, team.isFollowed)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                team.isFollowed
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${team.isFollowed ? 'fill-current' : ''}`} />
              <span>{team.isFollowed ? 'Ne plus suivre' : 'Suivre'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}