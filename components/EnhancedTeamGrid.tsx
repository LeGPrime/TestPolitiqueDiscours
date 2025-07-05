// components/EnhancedTeamGrid.tsx - Grille d'équipes améliorée
import { useState } from 'react'
import { Heart, X, Plus, Globe, Calendar, Users, Star, Trophy, Filter } from 'lucide-react'

interface Team {
  id: string
  name: string
  logo: string
  sport: string
  league: string
  country: string
  founded?: number
  type: 'team' | 'player'
  isFollowed: boolean
  followersCount?: number
  followedSince?: string
}

interface EnhancedTeamGridProps {
  teams: Team[]
  onTeamToggle: (team: Team, isFollowed: boolean) => void
  isOwnProfile: boolean
  showFollowButton?: boolean
}

export default function EnhancedTeamGrid({ teams, onTeamToggle, isOwnProfile, showFollowButton = true }: EnhancedTeamGridProps) {
  const [filterSport, setFilterSport] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'sport'>('date')

  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆' },
    { id: 'football', name: 'Football', emoji: '⚽' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾' },
    { id: 'f1', name: 'F1', emoji: '🏎️' }
  ]

  const getSportEmoji = (sport: string) => {
    return sports.find(s => s.id === sport)?.emoji || '🏆'
  }

  const getSportColor = (sport: string) => {
    const colors = {
      football: 'from-green-400 to-emerald-500',
      basketball: 'from-orange-400 to-red-500',
      tennis: 'from-yellow-400 to-orange-500',
      f1: 'from-blue-400 to-cyan-500'
    }
    return colors[sport as keyof typeof colors] || 'from-gray-400 to-gray-500'
  }

  // Filtrer et trier les équipes
  const filteredTeams = teams
    .filter(team => {
      if (filterSport !== 'all' && team.sport !== filterSport) return false
      if (filterType !== 'all' && team.type !== filterType) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'sport':
          return a.sport.localeCompare(b.sport)
        case 'date':
        default:
          return new Date(b.followedSince || 0).getTime() - new Date(a.followedSince || 0).getTime()
      }
    })

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune équipe suivie
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {isOwnProfile 
            ? 'Commencez à suivre vos équipes et joueurs préférés'
            : 'Cet utilisateur ne suit aucune équipe'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres et tri */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>
                  {sport.emoji} {sport.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Équipes & Joueurs</option>
            <option value="team">Équipes seulement</option>
            <option value="player">Joueurs seulement</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date de suivi</option>
            <option value="name">Nom A-Z</option>
            <option value="sport">Sport</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredTeams.length} résultat{filteredTeams.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Grille d'équipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className={`bg-white dark:bg-slate-700 border rounded-xl p-6 hover:shadow-lg transition-all duration-300 ${
              team.isFollowed ? 'ring-2 ring-blue-500 ring-opacity-20 border-blue-200' : 'border-gray-200 dark:border-slate-600'
            }`}
          >
            {/* Header avec logo et sport */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {team.logo.startsWith('http') ? (
                  <img 
                    src={team.logo} 
                    alt={team.name}
                    className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : (
                  <div className={`w-12 h-12 bg-gradient-to-br ${getSportColor(team.sport)} rounded-full flex items-center justify-center shadow-sm text-2xl`}>
                    {team.logo}
                  </div>
                )}
                <div className="hidden w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">
                    {team.name[0].toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                    {team.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-lg">{getSportEmoji(team.sport)}</span>
                    <span className="capitalize">{team.sport}</span>
                    {team.type === 'player' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Joueur
                      </span>
                    )}
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

            {/* Infos de l'équipe/joueur */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Trophy className="w-4 h-4" />
                <span>{team.league}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Globe className="w-4 h-4" />
                <span>{team.country}</span>
              </div>
              
              {team.founded && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Fondé en {team.founded}</span>
                </div>
              )}

              {team.followedSince && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <Star className="w-4 h-4" />
                  <span>Suivi depuis {new Date(team.followedSince).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>

            {/* Stats et actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-600">
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{team.followersCount || 0}</span>
                <span>follower{(team.followersCount || 0) > 1 ? 's' : ''}</span>
              </div>
              
              {/* Bouton de suivi */}
              {isOwnProfile && showFollowButton && (
                <button
                  onClick={() => onTeamToggle(team, team.isFollowed)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    team.isFollowed
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {team.isFollowed ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Ne plus suivre</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Suivre</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats de suivi par sport */}
      {teams.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par sport
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sports.slice(1).map(sport => {
              const sportTeams = teams.filter(team => team.sport === sport.id)
              if (sportTeams.length === 0) return null
              
              return (
                <div key={sport.id} className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                  <div className="text-2xl mb-1">{sport.emoji}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {sportTeams.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {sport.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}