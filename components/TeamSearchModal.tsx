// components/TeamSearchModal.tsx - Modal de recherche d'équipes
import { useState, useEffect } from 'react'
import { Search, X, Plus, Check, Filter, Globe, Calendar, Users, Star } from 'lucide-react'
import axios from 'axios'

interface Team {
  id: string
  name: string
  logo: string
  sport: string
  league: string
  country: string
  founded?: number
  type: 'team' | 'player'
  isFollowed?: boolean
}

interface TeamSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamToggle: (team: Team, isFollowed: boolean) => void
  followedTeams: Team[]
}

export default function TeamSearchModal({ isOpen, onClose, onTeamToggle, followedTeams }: TeamSearchModalProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])

  const sports = [
    { id: 'all', name: 'Tous', emoji: '🏆' },
    { id: 'football', name: 'Football', emoji: '⚽' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾' },
    { id: 'f1', name: 'Formule 1', emoji: '🏎️' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen, searchQuery, selectedSport, selectedLeague])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sport: selectedSport,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedLeague !== 'all' && { league: selectedLeague })
      })
      
      const response = await axios.get(`/api/teams/search?${params}`)
      const teamsWithFollowStatus = response.data.teams.map((team: Team) => ({
        ...team,
        isFollowed: followedTeams.some(ft => ft.id === team.id)
      }))
      
      setTeams(teamsWithFollowStatus)
      
      // Extraire les ligues disponibles
      const leagues = [...new Set(response.data.teams.map((team: Team) => team.league))]
      setAvailableLeagues(leagues)
    } catch (error) {
      console.error('Erreur recherche équipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamToggle = async (team: Team) => {
    try {
      // Optimistic update
      setTeams(prev => prev.map(t => 
        t.id === team.id ? { ...t, isFollowed: !t.isFollowed } : t
      ))
      
      // Call parent handler
      await onTeamToggle(team, team.isFollowed || false)
    } catch (error) {
      console.error('Erreur toggle team:', error)
      // Revert optimistic update
      setTeams(prev => prev.map(t => 
        t.id === team.id ? { ...t, isFollowed: team.isFollowed } : t
      ))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Découvrir des équipes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Trouvez et suivez vos équipes et joueurs préférés
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filtres */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une équipe ou un joueur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtres par sport et ligue */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sport</label>
              <select
                value={selectedSport}
                onChange={(e) => {
                  setSelectedSport(e.target.value)
                  setSelectedLeague('all')
                }}
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {sports.map(sport => (
                  <option key={sport.id} value={sport.id}>
                    {sport.emoji} {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ligue</label>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les ligues</option>
                {availableLeagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Recherche en cours...</span>
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer ${
                    team.isFollowed
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}
                  onClick={() => handleTeamToggle(team)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {team.logo.startsWith('http') ? (
                        <img 
                          src={team.logo} 
                          alt={team.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm text-2xl">
                          {team.logo}
                        </div>
                      )}
                      <div className="hidden w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                        {team.name[0]}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {team.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>{team.country}</span>
                          </span>
                          {team.founded && (
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{team.founded}</span>
                            </span>
                          )}
                          {team.type === 'player' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              Joueur
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {team.league} • {team.sport}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                        team.isFollowed
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTeamToggle(team)
                      }}
                    >
                      {team.isFollowed ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Suivi</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Suivre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune équipe trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Essayez de modifier votre recherche ou vos filtres
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {followedTeams.length} équipe{followedTeams.length > 1 ? 's' : ''} suivie{followedTeams.length > 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}