import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, MapPin, Users, Star,
  Target, AlertTriangle, RefreshCw, UserCheck,
  BarChart3, Activity, Trophy, Flag, Eye, EyeOff, Car,
  ChevronDown, ChevronUp, MessageCircle, Info,
  Youtube, Plus, ThumbsUp, ThumbsDown, ExternalLink, Play, X
} from 'lucide-react'
import axios from 'axios'
import FootballMatchDetails from '../../components/FootballMatchDetails'
import BasketballMatchDetails from '../../components/BasketballMatchDetails'
import F1MatchDetails from '../../components/F1MatchDetails'
import RugbyMatchDetails from '../../components/RugbyMatchDetails'
import MMAMatchDetails from '../../components/MMAMatchDetails'
import MatchReviews from '../../components/MatchReviews'
import AddToListButton from '../../components/AddToListButton'

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface MatchData {
  id: string
  sport: 'FOOTBALL' | 'BASKETBALL' | 'MMA' | 'RUGBY' | 'F1'
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  date: string
  venue: string
  referee: string
  attendance?: number
  weather?: string
  competition: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  details?: any
}

interface MatchDetailsResponse {
  success: boolean
  data: {
    match: MatchData
    events: Array<{
      minute: number
      type: string
      team: string
      player: string
      detail?: string
      assist?: string
      round?: number
      method?: string
    }>
    lineups: {
      home: any
      away: any
    }
    statistics: {
      home: Record<string, any>
      away: Record<string, any>
    }
  }
  ratings: any[]
  avgRating: number
  totalRatings: number
}

interface PlayerRating {
  id: string
  userId: string
  playerId: string
  rating: number
  comment?: string
  user: {
    id: string
    name?: string
    username?: string
    image?: string
  }
  player: {
    id: string
    name: string
    position?: string
    number?: number
    team: string
  }
}

// 🆕 NOUVEAUX TYPES - Suggestions vidéo
interface VideoSuggestion {
  id: string
  matchId: string
  url: string
  title: string
  description?: string
  platform: 'youtube' | 'dailymotion' | 'twitch' | 'other'
  suggestedBy: {
    id: string
    name: string
    username: string
    image?: string
  }
  votes: {
    upvotes: number
    downvotes: number
    userVote?: 'up' | 'down' | null
  }
  createdAt: string
  isVerified?: boolean
  reportsCount?: number
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

const getSportEmoji = (sport: string) => {
  const emojis = {
    'FOOTBALL': '⚽',
    'BASKETBALL': '🏀',
    'MMA': '🥊',
    'RUGBY': '🏉',
    'F1': '🏎️'
  }
  return emojis[sport as keyof typeof emojis] || '🏆'
}

const getSportColor = (sport: string) => {
  const colors = {
    'FOOTBALL': 'from-green-500 to-emerald-600',
    'BASKETBALL': 'from-orange-500 to-red-600',
    'MMA': 'from-red-500 to-pink-600',
    'RUGBY': 'from-green-500 to-green-600',
    'F1': 'from-red-500 to-orange-600'
  }
  return colors[sport as keyof typeof colors] || 'from-indigo-500 to-purple-600'
}

const getSportLabel = (sport: string) => {
  const labels = {
    'FOOTBALL': 'Match de Football',
    'BASKETBALL': 'Match de Basketball', 
    'MMA': 'Combat MMA',
    'RUGBY': 'Match de Rugby',
    'F1': 'Grand Prix F1'
  }
  return labels[sport as keyof typeof labels] || 'Événement'
}

// 🎾 FONCTIONS SPÉCIFIQUES TENNIS
const formatTennisScore = (match: MatchData) => {
  // Gérer le cas où details.tournament est un objet
  let tournamentName = match.competition
  if (match.details?.tournament) {
    if (typeof match.details.tournament === 'string') {
      tournamentName = match.details.tournament
    } else if (match.details.tournament.name) {
      tournamentName = match.details.tournament.name
    }
  }

  if (!match.details?.scores) {
    return { 
      display: `${match.homeScore || 0}-${match.awayScore || 0}`,
      sets: null,
      games: null,
      surface: match.details?.surface || 'Hard',
      tournament: tournamentName
    }
  }

  const scores = match.details.scores
  let setsDisplay = `${scores.player1?.sets || 0}-${scores.player2?.sets || 0}`
  
  // Construire l'affichage des jeux par set
  let gamesDisplay = ''
  if (scores.player1?.games && scores.player2?.games) {
    const gameSets = scores.player1.games.map((g1: number, i: number) => {
      const g2 = scores.player2.games[i] || 0
      return `${g1}-${g2}`
    })
    gamesDisplay = gameSets.join(', ')
  }

  return {
    display: setsDisplay,
    sets: setsDisplay,
    games: gamesDisplay,
    surface: match.details.surface || 'Hard',
    tournament: tournamentName
  }
}

const getTennisWinner = (match: MatchData) => {
  if (match.homeScore && match.awayScore) {
    return match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam
  }
  
  if (match.details?.scores) {
    const scores = match.details.scores
    if (scores.player1?.sets > scores.player2?.sets) return match.homeTeam
    if (scores.player2?.sets > scores.player1?.sets) return match.awayTeam
  }
  
  return null
}

// Fonction pour extraire tous les joueurs
function getAllPlayers(lineups: any, match: any) {
  const players = []
  
  // Joueurs de l'équipe domicile - Titulaires
  if (lineups.home.startXI) {
    lineups.home.startXI.forEach((p: any) => {
      players.push({
        id: `${p.player.name || p.player}_${match.homeTeam}`.replace(/\s+/g, '_'),
        name: p.player.name || p.player,
        position: p.position,
        number: p.number,
        team: match.homeTeam
      })
    })
  }
  
  // Joueurs de l'équipe domicile - Remplaçants
  if (lineups.home.substitutes) {
    lineups.home.substitutes.forEach((p: any) => {
      players.push({
        id: `${p.player.name || p.player}_${match.homeTeam}`.replace(/\s+/g, '_'),
        name: p.player.name || p.player,
        position: p.position,
        number: p.number,
        team: match.homeTeam
      })
    })
  }

  // Joueurs de l'équipe extérieure - Titulaires
  if (lineups.away.startXI) {
    lineups.away.startXI.forEach((p: any) => {
      players.push({
        id: `${p.player.name || p.player}_${match.awayTeam}`.replace(/\s+/g, '_'),
        name: p.player.name || p.player,
        position: p.position,
        number: p.number,
        team: match.awayTeam
      })
    })
  }
  
  // Joueurs de l'équipe extérieure - Remplaçants
  if (lineups.away.substitutes) {
    lineups.away.substitutes.forEach((p: any) => {
      players.push({
        id: `${p.player.name || p.player}_${match.awayTeam}`.replace(/\s+/g, '_'),
        name: p.player.name || p.player,
        position: p.position,
        number: p.number,
        team: match.awayTeam
      })
    })
  }

  return players
}

// Fonction pour générer des insights tactiques automatiques
function generateTacticalInsights(statistics: any, homeTeam: string, awayTeam: string, keyEvents: any) {
  const insights = []
  
  // Analyse possession
  const homePossession = parseFloat(statistics.home?.['Ball Possession'] || '0')
  const awayPossession = parseFloat(statistics.away?.['Ball Possession'] || '0')
  
  if (homePossession > 60) {
    insights.push(`🎯 ${homeTeam} a dominé la possession (${homePossession}%) mais a-t-elle su la convertir ?`)
  } else if (awayPossession > 60) {
    insights.push(`🎯 ${awayTeam} a contrôlé le ballon (${awayPossession}%) pour imposer son rythme`)
  }

  // Analyse tirs
  const homeShots = parseInt(statistics.home?.['Total Shots'] || '0')
  const awayShots = parseInt(statistics.away?.['Total Shots'] || '0')
  
  if (homeShots > awayShots * 2) {
    insights.push(`⚽ ${homeTeam} a été beaucoup plus offensif avec ${homeShots} tirs contre ${awayShots}`)
  } else if (awayShots > homeShots * 2) {
    insights.push(`⚽ ${awayTeam} a monopolisé l'attaque avec ${awayShots} tirs contre ${homeShots}`)
  }

  return insights.map((insight, index) => (
    <div key={index} className="text-sm bg-white/60 dark:bg-slate-700/60 rounded-lg p-3">
      {insight}
    </div>
  ))
}

// ============================================================================
// 🆕 COMPOSANT SUGGESTIONS VIDÉO COMMUNAUTAIRES
// ============================================================================

interface CommunityVideoSystemProps {
  matchId: string
  matchTitle: string
  currentUserId?: string
  suggestions: VideoSuggestion[]
  onRefresh: () => void
}

const CommunityVideoSystem: React.FC<CommunityVideoSystemProps> = ({
  matchId,
  matchTitle,
  currentUserId,
  suggestions,
  onRefresh
}) => {
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [showVideosModal, setShowVideosModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newSuggestion, setNewSuggestion] = useState({
    url: '',
    title: '',
    description: ''
  })

  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: '🔴',
      dailymotion: '🔵', 
      twitch: '🟣',
      other: '📺'
    }
    return icons[platform as keyof typeof icons] || icons.other
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Il y a moins d\'1h'
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${Math.floor(diffHours / 24)} jour(s)`
  }

  const handleVote = async (suggestionId: string, voteType: 'up' | 'down') => {
    if (!currentUserId) {
      alert('Connectez-vous pour voter')
      return
    }

    try {
      const response = await axios.post('/api/video-votes', {
        suggestionId,
        voteType
      })

      if (response.data.success) {
        onRefresh() // Rafraîchir les données
      }
    } catch (error) {
      console.error('Erreur vote:', error)
      alert('Erreur lors du vote')
    }
  }

  const handleSuggest = async () => {
    if (!currentUserId) {
      alert('Connectez-vous pour suggérer une vidéo')
      return
    }

    if (!newSuggestion.url.trim()) {
      alert('Veuillez entrer une URL')
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.post(`/api/video-suggestions/${matchId}`, {
        url: newSuggestion.url.trim(),
        title: newSuggestion.title.trim() || undefined,
        description: newSuggestion.description.trim() || undefined
      })

      if (response.data.success) {
        setNewSuggestion({ url: '', title: '', description: '' })
        setShowSuggestModal(false)
        onRefresh()
        alert('✅ Suggestion ajoutée ! Merci pour votre contribution 🎉')
      }
    } catch (error: any) {
      console.error('Erreur suggestion:', error)
      const message = error.response?.data?.error || 'Erreur lors de la suggestion'
      alert(`❌ ${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReport = async (suggestionId: string) => {
    if (!currentUserId) {
      alert('Connectez-vous pour signaler')
      return
    }

    const reason = prompt('Raison du signalement:\n- spam\n- inappropriate\n- broken_link\n- duplicate\n- other')
    if (!reason) return

    try {
      await axios.post('/api/video-reports', {
        suggestionId,
        reason: reason.toLowerCase(),
        comment: ''
      })

      alert('✅ Signalement envoyé')
      onRefresh()
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors du signalement'
      alert(`❌ ${message}`)
    }
  }

  return (
    <>
      {/* Bouton principal - Simple sous les infos stade/heure */}
      <div className="flex justify-center mt-3">
        <button
          onClick={() => setShowVideosModal(true)}
          className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Youtube className="w-4 h-4" />
          <span>📺 Voir les résumés</span>
          {suggestions.length > 0 && (
            <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs">
              {suggestions.length}
            </span>
          )}
        </button>
      </div>

      {/* Modal principale avec suggestions */}
      {showVideosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowVideosModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-gray-200 dark:border-slate-600">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 md:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1">📺 Résumés Vidéo</h2>
                  <p className="text-red-100 text-sm md:text-base">{matchTitle}</p>
                </div>
                <button
                  onClick={() => setShowVideosModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bouton suggérer */}
              {currentUserId && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setShowVideosModal(false)
                      setShowSuggestModal(true)
                    }}
                    className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Suggérer une vidéo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Liste des suggestions */}
            <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
              {suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Aucune suggestion pour l'instant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Soyez le premier à partager un résumé de ce match !
                  </p>
                  {currentUserId && (
                    <button
                      onClick={() => {
                        setShowVideosModal(false)
                        setShowSuggestModal(true)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      ✨ Suggérer une vidéo
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          {/* Position et badge */}
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Titre et badges */}
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base line-clamp-1">
                                {suggestion.title}
                              </h3>
                              <span className="text-lg">{getPlatformIcon(suggestion.platform)}</span>
                              {suggestion.isVerified && (
                                <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                  ✅ Vérifié
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {suggestion.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {suggestion.description}
                              </p>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>Par {suggestion.suggestedBy.name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(suggestion.createdAt)}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bouton voir */}
                        <div className="flex-shrink-0 ml-4">
                          <a
                            href={suggestion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>Voir</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Votes et actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-600">
                        <div className="flex items-center space-x-3">
                          {/* Votes */}
                          {currentUserId && (
                            <>
                              <button
                                onClick={() => handleVote(suggestion.id, 'up')}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm transition-colors ${
                                  suggestion.votes.userVote === 'up' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{suggestion.votes.upvotes}</span>
                              </button>

                              <button
                                onClick={() => handleVote(suggestion.id, 'down')}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm transition-colors ${
                                  suggestion.votes.userVote === 'down' 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                                <span>{suggestion.votes.downvotes}</span>
                              </button>
                            </>
                          )}

                          {/* Score total */}
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Score: +{suggestion.votes.upvotes - suggestion.votes.downvotes}
                          </div>
                        </div>

                        {/* Signaler */}
                        {currentUserId && (
                          <button 
                            onClick={() => handleReport(suggestion.id)}
                            className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-xs text-gray-500 dark:text-gray-400 transition-colors"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Signaler</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal suggérer une vidéo */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSuggestModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-slate-600">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">✨ Suggérer une vidéo</h2>
                <button
                  onClick={() => setShowSuggestModal(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formulaire */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔗 Lien de la vidéo *
                  </label>
                  <input
                    type="url"
                    value={newSuggestion.url}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    YouTube, Dailymotion, Twitch acceptés
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📝 Titre (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newSuggestion.title}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Résumé complet du match"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💭 Description (optionnel)
                  </label>
                  <textarea
                    value={newSuggestion.description}
                    onChange={(e) => setNewSuggestion(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Pourquoi recommandez-vous cette vidéo ?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSuggestModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSuggest}
                  disabled={!newSuggestion.url.trim() || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Envoi...' : '✨ Suggérer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================================
// AUTRES COMPOSANTS EXISTANTS
// ============================================================================

// Composant Section Résumé du Match
function QuickSummarySection({ 
  goals, 
  cards, 
  redCards, 
  substitutions, 
  showQuickSummary, 
  setShowQuickSummary 
}: any) {
  if (goals.length === 0 && redCards.length === 0 && cards.length <= 2) {
    return null
  }

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
      <button
        onClick={() => setShowQuickSummary(!showQuickSummary)}
        className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors rounded-2xl touch-target"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg">⚽ Résumé du match</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {goals.length} but{goals.length > 1 ? 's' : ''} • {cards.length} carton{cards.length > 1 ? 's' : ''} • {substitutions.length} changement{substitutions.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium hidden sm:block">
            {showQuickSummary ? 'Masquer' : 'Afficher'}
          </span>
          <div className={`transition-transform duration-300 ${showQuickSummary ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </button>

      {showQuickSummary && (
        <div className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buteurs */}
            {goals.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h5 className="font-semibold text-green-800 dark:text-green-300">⚽ Buteurs ({goals.length})</h5>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {goals.map((goal: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="w-7 h-7 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {goal.minute}'
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 dark:text-white block truncate">{goal.player}</span>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-gray-600 dark:text-gray-400">({goal.team})</span>
                            {goal.assist && (
                              <span className="text-blue-600 dark:text-blue-400 truncate">
                                👟 {goal.assist}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cartons & Incidents */}
            {(redCards.length > 0 || cards.length > 2) && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h5 className="font-semibold text-red-800 dark:text-red-300">
                    🟨🟥 Cartons ({cards.length})
                    {redCards.length > 0 && ` • ${redCards.length} rouge${redCards.length > 1 ? 's' : ''}`}
                  </h5>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cards.slice(0, 6).map((card: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                        card.detail?.includes('Red') || card.detail?.includes('rouge') 
                          ? 'bg-red-600 dark:bg-red-500' 
                          : 'bg-yellow-600 dark:bg-yellow-500'
                      }`}>
                        {card.minute}'
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-900 dark:text-white block truncate">{card.player}</span>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">({card.team})</span>
                          {card.detail && (
                            <span className={`truncate ${
                              card.detail?.includes('Red') || card.detail?.includes('rouge')
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {card.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {cards.length > 6 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                      ... et {cards.length - 6} autre{cards.length - 6 > 1 ? 's' : ''} carton{cards.length - 6 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant Sidebar de notation universelle
function MatchRatingSidebar({ 
  match, 
  userRating, 
  setUserRating, 
  comment, 
  setComment, 
  onSubmitRating, 
  session,
  avgRating,
  totalRatings
}: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
      <div className={`p-4 md:p-6 text-white bg-gradient-to-r ${getSportColor(match.sport)}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl md:text-3xl">{getSportEmoji(match.sport)}</span>
          <div>
            <h3 className="text-base md:text-lg font-semibold">Noter cet événement</h3>
            <p className="text-white/90 text-xs md:text-sm">{getSportLabel(match.sport)}</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {totalRatings > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">Note moyenne</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{totalRatings}</div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">Vote{totalRatings > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>
      
      {session ? (
        <div className="p-4 md:p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Votre évaluation :</p>
            <div className="flex space-x-1 md:space-x-2 justify-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-7 h-7 md:w-9 md:h-9 cursor-pointer transition-all duration-200 touch-target ${
                    i < userRating 
                      ? 'text-yellow-400 fill-current hover:scale-110' 
                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300 hover:scale-105'
                  }`}
                  onClick={() => setUserRating(i + 1)}
                />
              ))}
            </div>
            {userRating > 0 && (
              <p className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2">
                {userRating === 1 && "⭐ Très décevant"}
                {userRating === 2 && "⭐⭐ Décevant"}
                {userRating === 3 && "⭐⭐⭐ Correct"}
                {userRating === 4 && "⭐⭐⭐⭐ Très bon"}
                {userRating === 5 && "⭐⭐⭐⭐⭐ Exceptionnel"}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              💭 Votre commentaire :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 md:p-4 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm md:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
              placeholder={`Qu'avez-vous pensé de cet événement ? ${getSportEmoji(match.sport)}`}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {comment.length}/300 caractères
            </div>
          </div>
          
          <button
            onClick={onSubmitRating}
            disabled={userRating === 0}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 touch-target ${
              userRating === 0
                ? 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : `bg-gradient-to-r ${getSportColor(match.sport)} hover:shadow-lg hover:shadow-xl transform hover:scale-105 text-white`
            }`}
          >
            {userRating > 0 ? '✏️ Mettre à jour' : '⭐ Noter'} l'événement
          </button>

          <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
            <AddToListButton
              matchId={match.id}
              matchTitle={
                match.sport === 'F1' ? match.homeTeam : 
                match.sport === 'MMA' ? `${match.homeTeam} vs ${match.awayTeam}` :
                match.sport === 'RUGBY' ? `${match.homeTeam} vs ${match.awayTeam}` :
                `${match.homeTeam} vs ${match.awayTeam}`
              }
              variant="button"
              size="md"
            />
          </div>
        </div>
      ) : (
        <div className="p-4 md:p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Connectez-vous pour noter cet événement
          </p>
          <Link 
            href="/auth/signin" 
            className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium touch-target"
          >
            Se connecter
          </Link>
        </div>
      )}
    </div>
  )
}

// Composant d'informations sur l'événement
function MatchInfoCard({ match }: { match: MatchData }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6 border border-gray-200 dark:border-slate-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span>📊 Informations</span>
      </h4>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sport</span>
          <span className="font-medium text-gray-900 dark:text-white">{match.sport}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            {new Date(match.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Lieu</span>
          <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[120px]">{match.venue}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Compétition</span>
          <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[120px]">{match.competition}</span>
        </div>
        {match.referee && match.sport !== 'F1' && (
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {match.sport === 'MMA' ? 'Arbitre' : 'Arbitre'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[120px]">{match.referee}</span>
          </div>
        )}
        {match.attendance && (
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Spectateurs</span>
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {match.attendance.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Widget statistiques de la communauté
function CommunityStatsWidget({ matchId }: { matchId: string }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommunityStats()
  }, [matchId])

  const fetchCommunityStats = async () => {
    try {
      const response = await axios.get(`/api/match-community-stats?matchId=${matchId}`)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Erreur stats communauté:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg p-4 md:p-6 border border-purple-200 dark:border-purple-700">
      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <span>Activité Communauté</span>
      </h4>
      
      <div className="space-y-4">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{stats.totalLikes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
          </div>
        </div>

        {/* Top reviewer du match */}
        {stats.topReviewer && (
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">🏆 Top reviewer</p>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {stats.topReviewer.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.topReviewer.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{stats.topReviewer.likes} likes reçus</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Link 
        href={`/match/${matchId}/reviews`}
        className="block w-full text-center mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all text-sm font-medium touch-target"
      >
        💬 Voir toutes les reviews
      </Link>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL - MATCH DETAILS PAGE
// ============================================================================
// 🎾 COMPOSANTS SPÉCIALISÉS TENNIS
function TennisMatchHeader({ match }: { match: MatchData }) {
  const tennisScore = formatTennisScore(match)
  const winner = getTennisWinner(match)

  return (
    <div className="bg-gradient-to-r from-yellow-500/80 to-green-600/80 backdrop-blur-sm border border-gray-200/20 dark:border-slate-600/30 mx-4 mt-4 rounded-2xl p-4 md:p-6 mb-4">
      {/* Badge tournoi */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center space-x-2 bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm">
          <span className="text-xl">🎾</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{tennisScore.tournament}</span>
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
            {tennisScore.surface}
          </span>
        </span>
      </div>
      
      {/* Joueurs face-à-face */}
      <div className="flex items-center justify-between">
        {/* Joueur 1 */}
        <div className="flex-1 text-center">
          <h3 className="font-bold text-white text-lg md:text-xl mb-2">
            {match.homeTeam}
          </h3>
          <p className="text-xs md:text-sm text-gray-300 mb-3">
            {winner === match.homeTeam ? '🏆 Vainqueur' : 'Joueur 1'}
          </p>
          <div className="text-3xl md:text-4xl font-black text-white">
            {match.homeScore || 0}
          </div>
          <div className="text-sm text-white/80 mt-1">sets</div>
        </div>
        
        {/* Séparateur VS */}
        <div className="px-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
              <span className="text-base font-bold text-white">VS</span>
            </div>
          </div>
        </div>
        
        {/* Joueur 2 */}
        <div className="flex-1 text-center">
          <h3 className="font-bold text-white text-lg md:text-xl mb-2">
            {match.awayTeam}
          </h3>
          <p className="text-xs md:text-sm text-gray-300 mb-3">
            {winner === match.awayTeam ? '🏆 Vainqueur' : 'Joueur 2'}
          </p>
          <div className="text-3xl md:text-4xl font-black text-white">
            {match.awayScore || 0}
          </div>
          <div className="text-sm text-white/80 mt-1">sets</div>
        </div>
      </div>
      
      {/* Score détaillé par jeux */}
      {tennisScore.games && (
        <div className="mt-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-sm text-white/90 font-medium">Détail: {tennisScore.games}</div>
          </div>
        </div>
      )}
      
      {/* Infos du match */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs md:text-sm text-gray-300">
        <span className="flex items-center space-x-1">
          <MapPin className="w-4 h-4" />
          <span>{match.venue}</span>
        </span>
        <span className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{new Date(match.date).toLocaleDateString('fr-FR')}</span>
        </span>
      </div>
    </div>
  )
}

function TennisTabNavigation({ activeTab, setActiveTab }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void
}) {
  const tabs = [
    { id: 'overview', label: 'Résumé', icon: Eye, color: 'emerald' },
    { id: 'match-stats', label: 'Stats Match', icon: BarChart3, color: 'yellow' },
    { id: 'player-details', label: 'Joueurs', icon: UserCheck, color: 'blue' }
  ]

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700 mx-4 mb-4">
      <div className="flex overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1 p-2 min-w-full md:min-w-0 md:justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex flex-col items-center space-y-2 px-4 py-4 rounded-xl font-medium text-sm transition-all duration-300 min-w-[120px] ${
                  isActive
                    ? `bg-gradient-to-br ${
                        tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                        tab.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                        'from-emerald-500 to-emerald-600'
                      } text-white shadow-lg scale-105`
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="font-bold text-xs">{tab.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TennisMatchContent({ activeTab, match, matchData, session, userRating, setUserRating, comment, setComment, submitRating }: any) {
  const tennisScore = formatTennisScore(match)
  
  if (activeTab === 'match-stats') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-yellow-600" />
          <span>📊 Statistiques du match</span>
        </h2>
        
        {/* Score détaillé */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score par set</h3>
          <div className="bg-gradient-to-r from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{match.homeTeam}</div>
                <div className="text-2xl font-black text-yellow-600">{match.homeScore || 0} sets</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{match.awayTeam}</div>
                <div className="text-2xl font-black text-green-600">{match.awayScore || 0} sets</div>
              </div>
            </div>
            
            {tennisScore.games && (
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Détail des jeux</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tennisScore.games}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Infos du match */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🏟️ Informations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tournoi:</span>
                <span className="font-medium text-gray-900 dark:text-white">{tennisScore.tournament}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Surface:</span>
                <span className="font-medium text-gray-900 dark:text-white">{tennisScore.surface}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Lieu:</span>
                <span className="font-medium text-gray-900 dark:text-white">{match.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(match.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🏆 Résultat</h4>
            <div className="space-y-2 text-sm">
              {getTennisWinner(match) && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Vainqueur:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {getTennisWinner(match)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Terminé
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'player-details') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          <span>👤 Profils des joueurs</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Joueur 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white">🎾</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{match.homeTeam}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Joueur 1</p>
            </div>
          </div>

          {/* Joueur 2 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white">🎾</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{match.awayTeam}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Joueur 2</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Pour l'onglet 'overview', on garde le contenu standard existant
  return null
}

export default function MatchDetailsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { id } = router.query
  
  const [matchData, setMatchData] = useState<MatchDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRating, setUserRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([])
  
  // 🆕 NOUVEAUX ÉTATS - Suggestions vidéo
  const [videoSuggestions, setVideoSuggestions] = useState<VideoSuggestion[]>([])
  const [loadingVideoSuggestions, setLoadingVideoSuggestions] = useState(false)
  const [showVideoSection, setShowVideoSection] = useState(false) // 🆕 NOUVEL ÉTAT
  
  // Nouveau système d'onglets - 5 au lieu de 4
  const [activeTab, setActiveTab] = useState<'overview' | 'lineups' | 'man-of-match' | 'stats' | 'timeline'>('overview')
  
  // État pour le menu déroulant résumé (fermé par défaut)
  const [showQuickSummary, setShowQuickSummary] = useState(() => {
    if (typeof window !== 'undefined') {
      return false // Toujours fermé par défaut maintenant
    }
    return false
  })

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (id) {
      fetchMatchDetails()
      fetchVideoSuggestions() // 🆕 NOUVEAU - Charger les suggestions vidéo
    }
  }, [id])

  // ============================================================================
  // FONCTIONS API
  // ============================================================================

  const fetchMatchDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/match-details/${id}`)
      
      if (response.data.success) {
        setMatchData(response.data)
        
        try {
          const ratingsResponse = await axios.get(`/api/player-ratings?matchId=${id}`)
          setPlayerRatings(ratingsResponse.data.ratings || [])
        } catch (error) {
          console.error('Erreur chargement player ratings:', error)
          setPlayerRatings([])
        }
        
        const existingRating = response.data.ratings?.find(
          (r: any) => r.user.id === session?.user?.id
        )
        if (existingRating) {
          setUserRating(existingRating.rating)
          setComment(existingRating.comment || '')
        }
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 NOUVELLE FONCTION - Charger les suggestions vidéo
  const fetchVideoSuggestions = async () => {
    setLoadingVideoSuggestions(true)
    try {
      console.log('🔍 Chargement suggestions vidéo...')
      const response = await axios.get(`/api/video-suggestions/${id}`)
      
      if (response.data.success) {
        setVideoSuggestions(response.data.suggestions || [])
        console.log(`✅ ${response.data.suggestions?.length || 0} suggestions chargées`)
      }
    } catch (error) {
      console.error('❌ Erreur chargement suggestions:', error)
      setVideoSuggestions([]) // Pas d'erreur bloquante
    } finally {
      setLoadingVideoSuggestions(false)
    }
  }

  // 🆕 NOUVELLE FONCTION - Rafraîchir après nouvelle suggestion/vote
  const refreshVideoSuggestions = async () => {
    await fetchVideoSuggestions()
  }

  const submitRating = async () => {
    if (!userRating) return

    try {
      await axios.post('/api/ratings', {
        matchId: id,
        rating: userRating,
        comment
      })
      
      alert('Événement noté avec succès ! ⭐')
      fetchMatchDetails()
    } catch (error) {
      console.error('Erreur notation:', error)
      alert('Erreur lors de la notation')
    }
  }

  const ratePlayer = async (playerId: string, rating: number, comment?: string) => {
    try {
      console.log('🎯 Notation joueur/pilote/combattant:', { playerId, rating, comment, matchId: id })

      const response = await axios.post('/api/player-ratings', {
        playerId,
        matchId: id,
        rating,
        comment
      })

      console.log('✅ Réponse API:', response.data)

      if (response.data.success) {
        const ratingsResponse = await axios.get(`/api/player-ratings?matchId=${id}`)
        if (ratingsResponse.data.success) {
          setPlayerRatings(ratingsResponse.data.ratings || [])
          console.log(`📊 ${ratingsResponse.data.ratings?.length || 0} notations rechargées`)
        }
        
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm'
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <div class="text-xl">⭐</div>
            <div>
              <div class="font-semibold">${response.data.message || 'Notation enregistrée !'}</div>
              <div class="text-sm opacity-90">Moyenne: ${response.data.avgRating}/10 (${response.data.totalRatings} votes)</div>
            </div>
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 4000)
        
      } else {
        throw new Error(response.data.error || 'Erreur inconnue')
      }

    } catch (error: any) {
      console.error('❌ Erreur notation:', error)
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm'
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="text-xl">❌</div>
          <div>
            <div class="font-semibold">Erreur de notation</div>
            <div class="text-sm opacity-90">${error.response?.data?.error || error.message || 'Erreur inconnue'}</div>
          </div>
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 5000)
      
      throw error
    }
  }

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-300">Chargement des détails complets...</p>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Événement non trouvé</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2 block">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  const { match } = matchData.data
  
  // Séparer les événements football
  const goals = matchData.data.events.filter(e => e.type === 'GOAL')
  const cards = matchData.data.events.filter(e => e.type === 'CARD')
  const redCards = cards.filter(c => c.detail?.includes('Red') || c.detail?.includes('rouge'))
  const substitutions = matchData.data.events.filter(e => e.type === 'SUBSTITUTION')

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header mobile avec navigation */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="pt-4 md:pt-2 safe-area-top">
            <div className="flex items-center justify-between py-4 md:py-2">
              <Link href="/" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors touch-target group">
                <div className="flex items-center space-x-2 px-4 py-3 md:px-3 md:py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                  <ArrowLeft className="w-5 h-5 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium text-base md:text-base">Retour</span>
                </div>
              </Link>
              
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-700 rounded-xl px-4 py-3 md:px-3 md:py-2">
                <span className="text-xl md:text-lg">{getSportEmoji(match.sport)}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{match.competition}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Score amélioré */}
      <div className="bg-gradient-to-r from-slate-700/80 to-slate-800/80 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-sm border border-gray-200/20 dark:border-slate-600/30 mx-4 mt-4 rounded-2xl p-4 md:p-6 mb-4">
        {/* Badge compétition centré */}
        <div className="text-center mb-4">
          <span className="inline-flex items-center space-x-2 bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm">
            <span className="text-xl">{getSportEmoji(match.sport)}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{match.competition}</span>
          </span>
        </div>
        
        {/* Score face-à-face */}
        <div className="flex items-center justify-between">
          {/* Équipe domicile */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              {match.homeTeamLogo && (
                <img src={match.homeTeamLogo} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-sm" />
              )}
              <div>
                <h3 className="font-bold text-white text-lg md:text-xl leading-tight">
                  {match.homeTeam}
                </h3>
                <p className="text-xs md:text-sm text-gray-300 dark:text-gray-400 font-medium">Domicile</p>
              </div>
            </div>
            <div className="text-4xl md:text-5xl font-black text-blue-400 dark:text-blue-300">
              {match.homeScore ?? '?'}
            </div>
          </div>
          
          {/* Séparateur VS */}
          <div className="px-4 md:px-6">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-100/20 to-gray-200/20 dark:from-slate-600/50 dark:to-slate-700/50 rounded-full flex items-center justify-center border-2 border-white/30 dark:border-slate-500/50 shadow-lg backdrop-blur-sm">
                <span className="text-sm md:text-base font-bold text-gray-200 dark:text-gray-300">VS</span>
              </div>
              <div className="text-xs md:text-sm text-gray-300 dark:text-gray-400 mt-2 font-medium">
                {new Date(match.date).toLocaleDateString('fr-FR', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </div>
            </div>
          </div>
          
          {/* Équipe extérieure */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="text-right">
                <h3 className="font-bold text-white text-lg md:text-xl leading-tight">
                  {match.awayTeam}
                </h3>
                <p className="text-xs md:text-sm text-gray-300 dark:text-gray-400 font-medium">Extérieur</p>
              </div>
              {match.awayTeamLogo && (
                <img src={match.awayTeamLogo} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-sm" />
              )}
            </div>
            <div className="text-4xl md:text-5xl font-black text-red-400 dark:text-red-300">
              {match.awayScore ?? '?'}
            </div>
          </div>
        </div>
        
        {/* Infos match en bas */}
        <div className="flex items-center justify-center space-x-4 md:space-x-6 mt-4 text-xs md:text-sm text-gray-300 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
            <span className="font-medium">{match.venue}</span>
          </span>
          {match.attendance && (
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-medium">{match.attendance.toLocaleString()}</span>
            </span>
          )}
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            <span className="font-medium">
              {new Date(match.date).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </span>
        </div>

        {/* 🆕 BOUTON DIRECT - Ouvre la section immédiatement */}
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setShowVideoSection(!showVideoSection)}
            className="inline-flex items-center space-x-2 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-800 dark:text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border border-white/20 dark:border-slate-600/50"
          >
            <Youtube className="w-4 h-4 text-red-600" />
            <span>Résumés vidéo</span>
            {videoSuggestions.length > 0 && (
              <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {videoSuggestions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation onglets existante */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700 mx-4 mb-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 p-2 min-w-full md:min-w-0 md:justify-center">
            {[
              { 
                id: 'overview', 
                label: 'Vue d\'ensemble', 
                icon: Eye, 
                shortLabel: 'Résumé',
                color: 'emerald',
                description: 'Résumé complet'
              },
              { 
                id: 'lineups', 
                label: 'Compositions', 
                icon: UserCheck, 
                shortLabel: 'Équipes',
                color: 'blue',
                description: 'Formations & tactiques'
              },
              { 
                id: 'stats', 
                label: 'Statistiques', 
                icon: BarChart3, 
                shortLabel: 'Stats',
                color: 'purple',
                description: 'Données du match'
              },
              { 
                id: 'timeline', 
                label: 'Timeline', 
                icon: Activity, 
                shortLabel: 'Events',
                color: 'green',
                description: 'Événements'
              }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 flex flex-col items-center space-y-2 px-3 py-3 md:px-4 md:py-4 rounded-xl font-medium text-sm transition-all duration-300 min-w-[90px] md:min-w-[120px] relative ${
                    isActive
                      ? `bg-gradient-to-br ${
                          tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          tab.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                          tab.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          tab.color === 'green' ? 'from-green-500 to-green-600' :
                          tab.color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
                          'from-gray-500 to-gray-600'
                        } text-white shadow-lg scale-105`
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  <div className="text-center">
                    <div className="font-bold text-xs">
                      {typeof window !== 'undefined' && window.innerWidth < 768 ? tab.shortLabel : tab.label}
                    </div>
                    {isActive && (
                      <div className="text-xs opacity-90 hidden md:block">
                        {tab.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Badge avec nombre d'éléments */}
                  {tab.id === 'timeline' && matchData.data.events.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {matchData.data.events.length > 9 ? '9+' : matchData.data.events.length}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Zone de contenu principal */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* Résumé du match - Visible sur tous les onglets */}
            <QuickSummarySection 
              goals={goals}
              cards={cards}
              redCards={redCards}
              substitutions={substitutions}
              showQuickSummary={showQuickSummary}
              setShowQuickSummary={setShowQuickSummary}
            />

            {/* TAB 1: VUE D'ENSEMBLE */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 🆕 Section Suggestions Vidéo - S'AFFICHE DIRECTEMENT */}
                {showVideoSection && !loadingVideoSuggestions && (
                  <CommunityVideoSystem 
                    matchId={match.id}
                    matchTitle={
                      match.sport === 'F1' ? match.homeTeam : 
                      match.sport === 'MMA' ? `${match.homeTeam} vs ${match.awayTeam}` :
                      match.sport === 'RUGBY' ? `${match.homeTeam} vs ${match.awayTeam}` :
                      `${match.homeTeam} vs ${match.awayTeam}`
                    }
                    currentUserId={session?.user?.id}
                    suggestions={videoSuggestions}
                    onRefresh={refreshVideoSuggestions}
                  />
                )}

                {/* Section Noter cet événement */}
                <MatchRatingSidebar
                  match={match}
                  userRating={userRating}
                  setUserRating={setUserRating}
                  comment={comment}
                  setComment={setComment}
                  onSubmitRating={submitRating}
                  session={session}
                  avgRating={matchData.avgRating}
                  totalRatings={matchData.totalRatings}
                />

                {/* Section Reviews & Commentaires */}
                <MatchReviews
                  matchId={match.id}
                  matchTitle={
                    match.sport === 'F1' ? match.homeTeam : 
                    match.sport === 'MMA' ? `${match.homeTeam} vs ${match.awayTeam}` :
                    match.sport === 'RUGBY' ? `${match.homeTeam} vs ${match.awayTeam}` :
                    `${match.homeTeam} vs ${match.awayTeam}`
                  }
                  currentUserId={session?.user?.id}
                  userHasRated={!!userRating}
                />
              </div>
            )}
            
            {/* TAB 2: COMPOSITIONS & TACTIQUE */}
            {activeTab === 'lineups' && (
              <div className="space-y-4">
                {/* Football */}
                {match.sport === 'FOOTBALL' && (
                  <FootballMatchDetails
                    matchDetails={matchData.data}
                    playerRatings={playerRatings}
                    onRatePlayer={ratePlayer}
                    currentUserId={session?.user?.id}
                  />
                )}
                
                {/* Basketball */}
                {match.sport === 'BASKETBALL' && (
                  <BasketballMatchDetails
                    matchDetails={matchData.data}
                    playerRatings={playerRatings}
                    onRatePlayer={ratePlayer}
                    currentUserId={session?.user?.id}
                  />
                )}

                {/* F1 */}
                {match.sport === 'F1' && (
                  <F1MatchDetails
                    matchDetails={matchData.data}
                    playerRatings={playerRatings}
                    onRatePlayer={ratePlayer}
                    currentUserId={session?.user?.id}
                  />
                )}

                {/* Rugby */}
                {match.sport === 'RUGBY' && (
                  <RugbyMatchDetails
                    matchDetails={matchData.data}
                    playerRatings={playerRatings}
                    onRatePlayer={ratePlayer}
                    currentUserId={session?.user?.id}
                  />
                )}

                {/* MMA */}
                {match.sport === 'MMA' && (
                  <MMAMatchDetails
                    matchDetails={matchData.data}
                    playerRatings={playerRatings}
                    onRatePlayer={ratePlayer}
                    currentUserId={session?.user?.id}
                  />
                )}

                {/* Placeholder pour sports non implémentés */}
                {!['FOOTBALL', 'BASKETBALL', 'F1', 'RUGBY', 'MMA'].includes(match.sport) && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 text-center border border-gray-200 dark:border-slate-700">
                    <div className="text-4xl md:text-6xl mb-4">{getSportEmoji(match.sport)}</div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Interface {match.sport} en développement
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base">
                      L'interface détaillée pour {match.sport} sera bientôt disponible !
                    </p>
                    <div className="bg-blue-50 dark:bg-slate-700 rounded-lg p-4">
                      <p className="text-blue-800 dark:text-blue-300 text-sm">
                        🚧 En attendant, vous pouvez toujours noter l'événement via l'onglet "Vue d'ensemble"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* TAB 3: STATISTIQUES */}
            {activeTab === 'stats' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Statistiques du match</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Statistiques détaillées disponibles pour les matchs avec données complètes.
                </p>
                {/* Ici tu peux ajouter tes composants de stats existants */}
              </div>
            )}
            
            {/* TAB 4: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⚡ Timeline des événements</h2>
                {matchData.data.events.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">Aucun événement disponible pour ce match.</p>
                ) : (
                  <div className="space-y-4">
                    {matchData.data.events.map((event, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          {event.minute}'
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{event.player}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.type} - {event.team}</p>
                          {event.detail && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">{event.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Infos uniquement maintenant */}
          <div className="lg:col-span-1 space-y-6">
            <MatchInfoCard match={match} />
            <CommunityStatsWidget matchId={match.id} />
          </div>
        </div>
      </div>
    </div>
  )
}