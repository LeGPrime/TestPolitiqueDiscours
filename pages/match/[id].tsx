import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, MapPin, Users, Star,
  Target, AlertTriangle, RefreshCw, UserCheck,
  BarChart3, Activity, Trophy, Flag
} from 'lucide-react'
import axios from 'axios'

interface MatchDetails {
  match: {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    date: string
    venue: string
    referee: string
    attendance?: number
  }
  events: Array<{
    minute: number
    type: 'GOAL' | 'CARD' | 'SUBSTITUTION'
    team: string
    player: string
    detail?: string
    assist?: string
  }>
  lineups: {
    home: {
      formation: string
      startXI: Array<{ id?: string; player: string; number: number; position: string }>
      substitutes: Array<{ id?: string; player: string; number: number; position: string }>
      coach: string
    }
    away: {
      formation: string
      startXI: Array<{ id?: string; player: string; number: number; position: string }>
      substitutes: Array<{ id?: string; player: string; number: number; position: string }>
      coach: string
    }
  }
  statistics: {
    home: Record<string, any>
    away: Record<string, any>
  }
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

export default function MatchDetailsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { id } = router.query
  
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'stats'>('timeline')
  const [userRating, setUserRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([])

  useEffect(() => {
    if (id) {
      fetchMatchDetails()
    }
  }, [id])

  const fetchMatchDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/match-details/${id}`)
      
      if (response.data.success) {
        setMatchDetails(response.data.data)
        
        // Récupérer les notations des joueurs
        try {
          const ratingsResponse = await axios.get(`/api/player-ratings?matchId=${id}`)
          setPlayerRatings(ratingsResponse.data.ratings || [])
        } catch (error) {
          console.error('Erreur chargement player ratings:', error)
          setPlayerRatings([])
        }
        
        // Vérifier si l'utilisateur a déjà noté le match
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

  const submitRating = async () => {
    if (!userRating) return

    try {
      await axios.post('/api/ratings', {
        matchId: id,
        rating: userRating,
        comment
      })
      
      alert('Match noté avec succès ! ⭐')
      fetchMatchDetails() // Refresh
    } catch (error) {
      console.error('Erreur notation:', error)
      alert('Erreur lors de la notation')
    }
  }

  const ratePlayer = async (playerId: string, rating: number, comment?: string) => {
    try {
      await axios.post('/api/player-ratings', {
        playerId,
        matchId: id,
        rating,
        comment
      })
      
      // Recharger les notations des joueurs
      const ratingsResponse = await axios.get(`/api/player-ratings?matchId=${id}`)
      setPlayerRatings(ratingsResponse.data.ratings || [])
      
      alert('Joueur noté avec succès ! ⭐')
    } catch (error) {
      console.error('Erreur notation joueur:', error)
      alert('Erreur lors de la notation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des détails complets...</p>
        </div>
      </div>
    )
  }

  if (!matchDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Match non trouvé</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 mt-2 block">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  const { match, events, lineups, statistics } = matchDetails

  // Séparer les événements par type
  const goals = events.filter(e => e.type === 'GOAL')
  const cards = events.filter(e => e.type === 'CARD')
  const substitutions = events.filter(e => e.type === 'SUBSTITUTION')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux matchs
          </Link>
          
          {/* Score principal */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-8 mb-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">{match.homeTeam}</h1>
                <div className="text-4xl font-bold text-blue-600 mt-2">{match.homeScore}</div>
              </div>
              
              <div className="text-center">
                <div className="text-gray-500 text-sm">VS</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">-</div>
              </div>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">{match.awayTeam}</h1>
                <div className="text-4xl font-bold text-blue-600 mt-2">{match.awayScore}</div>
              </div>
            </div>

            {/* Infos du match */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(match.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{match.venue}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Flag className="w-4 h-4" />
                <span>{match.referee}</span>
              </div>
              {match.attendance && (
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{match.attendance.toLocaleString()} spectateurs</span>
                </div>
              )}
            </div>

            {/* Résumé rapide : Buteurs et Cartons */}
            {(goals.length > 0 || cards.filter(c => c.detail?.includes('Red') || c.detail?.includes('rouge')).length > 0) && (
              <div className="mt-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buteurs */}
                  {goals.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-green-800">Buteurs</h4>
                      </div>
                      <div className="space-y-2">
                        {goals.map((goal, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {goal.minute}'
                              </span>
                              <div>
                                <span className="font-medium text-gray-900">{goal.player}</span>
                                <span className="text-xs text-gray-600 ml-1">({goal.team})</span>
                                {goal.assist && (
                                  <div className="text-xs text-blue-600">
                                    Passe: {goal.assist}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cartons rouges */}
                  {cards.filter(c => c.detail?.includes('Red') || c.detail?.includes('rouge')).length > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">Cartons rouges</h4>
                      </div>
                      <div className="space-y-2">
                        {cards.filter(c => c.detail?.includes('Red') || c.detail?.includes('rouge')).map((card, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {card.minute}'
                              </span>
                              <div>
                                <span className="font-medium text-gray-900">{card.player}</span>
                                <span className="text-xs text-gray-600 ml-1">({card.team})</span>
                                {card.detail && (
                                  <div className="text-xs text-red-600">
                                    {card.detail}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'timeline', label: 'Timeline', icon: Activity },
              { id: 'lineups', label: 'Compositions', icon: UserCheck },
              { id: 'stats', label: 'Statistiques', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {activeTab === 'timeline' && (
              <TimelineTab events={events} goals={goals} cards={cards} substitutions={substitutions} />
            )}
            
            {activeTab === 'lineups' && (
              <TacticalFormationView 
                lineups={lineups} 
                matchId={id as string}
                playerRatings={playerRatings}
                onRatePlayer={ratePlayer}
                currentUserId={session?.user?.id}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
              />
            )}
            
            {activeTab === 'stats' && (
              <StatsTab statistics={statistics} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
            )}
          </div>

          {/* Sidebar moderne - Notation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Carte de notation du match */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Noter ce match</h3>
                <p className="text-indigo-100 text-sm">Partagez votre avis sur cette rencontre</p>
              </div>
              
              {session ? (
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-sm font-semibold mb-3 text-gray-700">Votre évaluation :</p>
                    <div className="flex space-x-2 justify-center">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-9 h-9 cursor-pointer transition-all duration-200 ${
                            i < userRating 
                              ? 'text-yellow-400 fill-current hover:scale-110' 
                              : 'text-gray-300 hover:text-yellow-300 hover:scale-105'
                          }`}
                          onClick={() => setUserRating(i + 1)}
                        />
                      ))}
                    </div>
                    {userRating > 0 && (
                      <p className="text-center text-sm text-gray-600 mt-2">
                        {userRating === 1 && "⭐ Très décevant"}
                        {userRating === 2 && "⭐⭐ Décevant"}
                        {userRating === 3 && "⭐⭐⭐ Correct"}
                        {userRating === 4 && "⭐⭐⭐⭐ Très bon"}
                        {userRating === 5 && "⭐⭐⭐⭐⭐ Exceptionnel"}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">
                      💭 Votre commentaire :
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                      rows={4}
                      placeholder="Qu'avez-vous pensé de ce match ? Partagez votre analyse..."
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {comment.length}/300 caractères
                    </div>
                  </div>
                  
                  <button
                    onClick={submitRating}
                    disabled={userRating === 0}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                      userRating === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {userRating > 0 ? '✏️ Mettre à jour' : '⭐ Noter'} le match
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    Connectez-vous pour noter ce match et partager votre avis
                  </p>
                  <Link 
                    href="/auth/signin" 
                    className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-medium"
                  >
                    Se connecter
                  </Link>
                </div>
              )}
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">📊 Résumé rapide</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="font-medium text-gray-900">
                    {new Date(match.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Stade</span>
                  <span className="font-medium text-gray-900">{match.venue}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Arbitre</span>
                  <span className="font-medium text-gray-900">{match.referee}</span>
                </div>
                {match.attendance && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Spectateurs</span>
                    <span className="font-medium text-gray-900">
                      {match.attendance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant PlayerCard simple et lisible
function PlayerCard({ player, playerStats, userRating, activeTeam, onSelect }: any) {
  if (!player) return null
  
  return (
    <div
      onClick={onSelect}
      className="cursor-pointer group transition-all duration-300 hover:scale-110 flex flex-col items-center"
    >
      {/* Maillot */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl border-4 border-white transition-all duration-300 ${
        activeTeam === 'home' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-red-500 to-red-700'
      } ${userRating ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''} group-hover:shadow-2xl group-hover:scale-110`}>
        {player.number || '?'}
      </div>
      
      {/* Badge de note utilisateur */}
      {userRating && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shadow-lg border-2 border-white">
          {userRating.rating}
        </div>
      )}
      
      {/* Nom du joueur - SOUS le maillot, pas de chevauchement possible */}
      <div className="mt-3 text-center">
        <div className="bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-lg font-semibold shadow-lg backdrop-blur-sm min-w-max">
          {player.player?.split(' ').slice(-1)[0] || player.name?.split(' ').slice(-1)[0]}
        </div>
        
        {/* Position */}
        <div className="text-white text-xs mt-1 bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
          {player.position}
        </div>
        
        {/* Note moyenne si disponible */}
        {playerStats.avgRating > 0 && (
          <div className="text-xs text-yellow-300 mt-1 font-bold">
            ⭐ {playerStats.avgRating.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant Timeline modernisé
function TimelineTab({ events, goals, cards, substitutions }: any) {
  return (
    <div className="space-y-6">
      {/* Résumé statistiques avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">{goals.length}</div>
              <div className="text-sm font-medium text-emerald-700">Buts marqués</div>
            </div>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-600">{cards.length}</div>
              <div className="text-sm font-medium text-amber-700">Cartons distribués</div>
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">{substitutions.length}</div>
              <div className="text-sm font-medium text-blue-700">Changements</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline moderne des événements */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Timeline du match</h2>
        </div>
        
        <div className="p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun événement disponible</p>
              <p className="text-gray-400 text-sm">Les événements du match apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event: any, index: number) => {
                const getEventStyle = (type: string) => {
                  switch(type) {
                    case 'GOAL':
                      return {
                        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
                        border: 'border-emerald-200',
                        icon: <Target className="w-5 h-5 text-emerald-600" />,
                        accent: 'bg-emerald-500'
                      }
                    case 'CARD':
                      return {
                        bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
                        border: 'border-amber-200',
                        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
                        accent: 'bg-amber-500'
                      }
                    case 'SUBSTITUTION':
                      return {
                        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                        border: 'border-blue-200',
                        icon: <RefreshCw className="w-5 h-5 text-blue-600" />,
                        accent: 'bg-blue-500'
                      }
                    default:
                      return {
                        bg: 'bg-gray-50',
                        border: 'border-gray-200',
                        icon: <Activity className="w-5 h-5 text-gray-600" />,
                        accent: 'bg-gray-500'
                      }
                  }
                }
                
                const style = getEventStyle(event.type)
                
                return (
                  <div key={index} className={`${style.bg} ${style.border} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
                    <div className="flex items-start space-x-4">
                      {/* Timeline marker */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 ${style.accent} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {event.minute}'
                        </div>
                        {index < events.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {style.icon}
                          <span className="font-semibold text-gray-900">{event.player}</span>
                          <span className="text-sm bg-white bg-opacity-60 px-2 py-1 rounded-full text-gray-600">
                            {event.team}
                          </span>
                        </div>
                        
                        {event.detail && (
                          <p className="text-sm text-gray-700 mb-2 bg-white bg-opacity-40 rounded-lg p-2">
                            {event.detail}
                          </p>
                        )}
                        
                        {event.assist && (
                          <p className="text-sm text-blue-600 font-medium">
                            🎯 Passe décisive: {event.assist}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant Vue Tactique Moderne et Améliorée
function TacticalFormationView({ lineups, matchId, playerRatings, onRatePlayer, currentUserId, homeTeam, awayTeam }: any) {
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [hoveredPlayer, setHoveredPlayer] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'field' | 'list'>('field')
  
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

  // Organiser les joueurs par formation avec un meilleur mapping
  const organizeByFormation = (formation: string, players: any[]) => {
    const formationMap: { [key: string]: string[][] } = {
      '4-4-2': [['GK'], ['RB', 'CB', 'CB', 'LB'], ['RM', 'CM', 'CM', 'LM'], ['ST', 'ST']],
      '4-3-3': [['GK'], ['RB', 'CB', 'CB', 'LB'], ['CDM', 'CM', 'CAM'], ['RW', 'ST', 'LW']],
      '3-5-2': [['GK'], ['CB', 'CB', 'CB'], ['RWB', 'CM', 'CM', 'CM', 'LWB'], ['ST', 'ST']],
      '4-2-3-1': [['GK'], ['RB', 'CB', 'CB', 'LB'], ['CDM', 'CDM'], ['RW', 'CAM', 'LW'], ['ST']],
      '5-4-1': [['GK'], ['RWB', 'CB', 'CB', 'CB', 'LWB'], ['RM', 'CM', 'CM', 'LM'], ['ST']],
      'default': [['GK'], ['DEF', 'DEF', 'DEF', 'DEF'], ['MID', 'MID', 'MID'], ['ATT', 'ATT']]
    }

    return formationMap[formation] || formationMap['default']
  }

  const currentLineup = activeTeam === 'home' ? lineups.home : lineups.away
  const formationStructure = organizeByFormation(currentLineup.formation, currentLineup.startXI)
  
  // Distribution intelligente des joueurs
  const distributePlayersByPosition = () => {
    const players = [...currentLineup.startXI]
    const distributed: any[][] = []
    
    formationStructure.forEach((line) => {
      const lineGroup: any[] = []
      line.forEach(() => {
        if (players.length > 0) {
          lineGroup.push(players.shift())
        }
      })
      distributed.push(lineGroup)
    })
    
    return distributed
  }

  const distributedPlayers = distributePlayersByPosition()

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Toggle équipes */}
        <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setActiveTeam('home')}
            className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
              activeTeam === 'home'
                ? 'bg-white text-blue-600 shadow-lg transform scale-105 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
            <span>{homeTeam}</span>
          </button>
          <button
            onClick={() => setActiveTeam('away')}
            className={`flex items-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 ${
              activeTeam === 'away'
                ? 'bg-white text-red-600 shadow-lg transform scale-105 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm"></div>
            <span>{awayTeam}</span>
          </button>
        </div>

        {/* Toggle vue */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('field')}
            className={`px-4 py-2 rounded-md transition-all ${
              viewMode === 'field' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'
            }`}
          >
            🏟️ Terrain
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md transition-all ${
              viewMode === 'list' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'
            }`}
          >
            📋 Liste
          </button>
        </div>
      </div>

      {viewMode === 'field' ? (
        /* Vue Terrain SIMPLIFIÉE et LISIBLE */
        <div className="relative">
          {/* Terrain de football simplifié mais efficace */}
          <div className="bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 rounded-2xl p-8 relative overflow-hidden shadow-xl">
            {/* Lignes du terrain basiques */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-0.5"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-4 left-1/2 w-32 h-16 border border-white transform -translate-x-1/2"></div>
              <div className="absolute bottom-4 left-1/2 w-32 h-16 border border-white transform -translate-x-1/2"></div>
            </div>

            {/* Formation tactique CLAIRE */}
            <div className="relative min-h-[600px] flex flex-col justify-between py-8">
              {/* Header formation */}
              <div className="text-center mb-8">
                <div className="bg-black bg-opacity-30 rounded-xl px-6 py-3 inline-block backdrop-blur-sm">
                  <div className="text-white font-bold text-xl">
                    {currentLineup.formation}
                  </div>
                  <div className="text-white text-base opacity-90">
                    {activeTeam === 'home' ? homeTeam : awayTeam}
                  </div>
                </div>
              </div>
              
              {/* Lignes de joueurs avec espacement MAXIMUM */}
              <div className="flex-1 space-y-16">
                {distributedPlayers.map((line, lineIndex) => (
                  <div key={lineIndex} className="w-full">
                    {/* Affichage différent selon le nombre de joueurs */}
                    {line.length === 1 ? (
                      // Un seul joueur - centré
                      <div className="flex justify-center">
                        {line.map((player, playerIndex) => (
                          <PlayerCard 
                            key={playerIndex}
                            player={player}
                            playerStats={getPlayerStats(player.id)}
                            userRating={getUserRatingForPlayer(player.id)}
                            activeTeam={activeTeam}
                            onSelect={() => setSelectedPlayer({...player, ...getPlayerStats(player.id), userRating: getUserRatingForPlayer(player.id)})}
                          />
                        ))}
                      </div>
                    ) : line.length === 2 ? (
                      // Deux joueurs - très espacés
                      <div className="flex justify-between max-w-md mx-auto">
                        {line.map((player, playerIndex) => (
                          <PlayerCard 
                            key={playerIndex}
                            player={player}
                            playerStats={getPlayerStats(player.id)}
                            userRating={getUserRatingForPlayer(player.id)}
                            activeTeam={activeTeam}
                            onSelect={() => setSelectedPlayer({...player, ...getPlayerStats(player.id), userRating: getUserRatingForPlayer(player.id)})}
                          />
                        ))}
                      </div>
                    ) : line.length === 3 ? (
                      // Trois joueurs - bien espacés
                      <div className="flex justify-between max-w-2xl mx-auto">
                        {line.map((player, playerIndex) => (
                          <PlayerCard 
                            key={playerIndex}
                            player={player}
                            playerStats={getPlayerStats(player.id)}
                            userRating={getUserRatingForPlayer(player.id)}
                            activeTeam={activeTeam}
                            onSelect={() => setSelectedPlayer({...player, ...getPlayerStats(player.id), userRating: getUserRatingForPlayer(player.id)})}
                          />
                        ))}
                      </div>
                    ) : (
                      // Quatre joueurs ou plus - grille
                      <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {line.map((player, playerIndex) => (
                          <PlayerCard 
                            key={playerIndex}
                            player={player}
                            playerStats={getPlayerStats(player.id)}
                            userRating={getUserRatingForPlayer(player.id)}
                            activeTeam={activeTeam}
                            onSelect={() => setSelectedPlayer({...player, ...getPlayerStats(player.id), userRating: getUserRatingForPlayer(player.id)})}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Coach */}
            <div className="absolute bottom-6 right-6">
              <div className="bg-black bg-opacity-30 rounded-xl p-3 backdrop-blur-sm text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg mx-auto ${
                  activeTeam === 'home' ? 'bg-blue-700' : 'bg-red-700'
                }`}>
                  👨‍💼
                </div>
                <div className="text-xs text-white mt-2 font-medium">
                  Coach
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vue Liste Moderne */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTeam === 'home' ? homeTeam : awayTeam} - Formation {currentLineup.formation}
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentLineup.startXI.map((player: any, index: number) => {
                const playerStats = getPlayerStats(player.id)
                const userRating = getUserRatingForPlayer(player.id)
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedPlayer({...player, ...playerStats, userRating})}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
                        activeTeam === 'home' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                      } ${userRating ? 'ring-2 ring-yellow-400' : ''} group-hover:scale-110 transition-transform`}>
                        {player.number || '?'}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {player.player}
                        </h4>
                        <p className="text-sm text-gray-600">{player.position}</p>
                        
                        <div className="flex items-center space-x-3 mt-1">
                          {playerStats.avgRating > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                              ⭐ {playerStats.avgRating.toFixed(1)}
                            </span>
                          )}
                          {userRating && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              Votre note: {userRating.rating}/10
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Remplaçants modernes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              activeTeam === 'home' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-red-400 to-red-600'
            }`}></div>
            Remplaçants
          </h4>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentLineup.substitutes.map((player: any, index: number) => {
              const playerStats = getPlayerStats(player.id)
              const userRating = getUserRatingForPlayer(player.id)
              
              return (
                <div
                  key={index}
                  onClick={() => setSelectedPlayer({...player, ...playerStats, userRating})}
                  className="group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-xl p-4 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md transition-transform group-hover:scale-110 ${
                      activeTeam === 'home' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                    } ${userRating ? 'ring-2 ring-yellow-400' : ''}`}>
                      {player.number || '?'}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                        {player.player || player.name}
                      </p>
                      <p className="text-xs text-gray-600">{player.position}</p>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        {playerStats.avgRating > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                            ⭐ {playerStats.avgRating.toFixed(1)}
                          </span>
                        )}
                        {userRating && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            {userRating.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal de notation du joueur sélectionné */}
      {selectedPlayer && (
        <PlayerRatingModal
          player={selectedPlayer}
          matchId={matchId}
          onRate={onRatePlayer}
          onClose={() => setSelectedPlayer(null)}
          teamColor={activeTeam === 'home' ? 'blue' : 'red'}
        />
      )}
    </div>
  )
}

// Modal de notation ultra-moderne
function PlayerRatingModal({ player, matchId, onRate, onClose, teamColor }: any) {
  const [selectedRating, setSelectedRating] = useState(player.userRating?.rating || 0)
  const [comment, setComment] = useState(player.userRating?.comment || '')
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async () => {
    if (selectedRating === 0 || submitting) return

    setSubmitting(true)
    try {
      await onRate(player.id, selectedRating, comment)
      onClose()
    } catch (error) {
      console.error('Erreur notation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingDescription = (rating: number) => {
    if (rating === 0) return { emoji: "🤔", text: "Sélectionnez une note", color: "text-gray-500" }
    if (rating <= 2) return { emoji: "😞", text: "Performance très décevante", color: "text-red-600" }
    if (rating <= 4) return { emoji: "😐", text: "Performance en-dessous des attentes", color: "text-orange-600" }
    if (rating <= 6) return { emoji: "🙂", text: "Performance correcte", color: "text-yellow-600" }
    if (rating <= 8) return { emoji: "😊", text: "Bonne performance", color: "text-green-600" }
    return { emoji: "🔥", text: "Performance exceptionnelle", color: "text-emerald-600" }
  }

  const ratingDesc = getRatingDescription(selectedRating)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header avec gradient */}
        <div className={`${teamColor === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600'} p-6 rounded-t-2xl`}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold backdrop-blur-sm">
              {player.number || '?'}
            </div>
            <div className="flex-1 text-white">
              <h3 className="text-xl font-bold">{player.player || player.name}</h3>
              <p className="text-blue-100 opacity-90">{player.position}</p>
              <div className="flex items-center space-x-3 mt-1 text-sm">
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  Moy: {player.avgRating ? player.avgRating.toFixed(1) : '—'}
                </span>
                <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {player.totalRatings || 0} votes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Système de notation moderne */}
          <div>
            <p className="text-sm font-semibold mb-4 text-gray-700">Votre évaluation sur 10 :</p>
            
            {/* Grille de notation */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRating(i + 1)}
                  className={`aspect-square rounded-xl text-sm font-bold transition-all duration-200 ${
                    i < selectedRating 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900 shadow-lg scale-105 ring-2 ring-yellow-300' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            {/* Barre de progression visuelle */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(selectedRating / 10) * 100}%` }}
              ></div>
            </div>
            
            {/* Description de la note */}
            <div className={`text-center text-sm font-medium ${ratingDesc.color} bg-gray-50 rounded-lg p-3`}>
              <span className="text-2xl mr-2">{ratingDesc.emoji}</span>
              {ratingDesc.text}
            </div>
          </div>
          
          {/* Zone de commentaire améliorée */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              💭 Votre analyse (optionnelle) :
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              rows={3}
              placeholder="Partagez votre avis sur sa performance..."
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/200 caractères
            </div>
          </div>
          
          {/* Actions avec design moderne */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleRate}
              disabled={selectedRating === 0 || submitting}
              className={`flex-1 px-4 py-3 rounded-xl transition-all font-medium text-white shadow-lg ${
                selectedRating === 0 || submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : teamColor === 'blue'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Notation...
                </div>
              ) : (
                `${player.userRating ? '✏️ Modifier' : '⭐ Noter'} la performance`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Statistiques
function StatsTab({ statistics, homeTeam, awayTeam }: any) {
  const statLabels = {
    'Shots on Goal': 'Tirs cadrés',
    'Shots off Goal': 'Tirs non cadrés',
    'Total Shots': 'Total tirs',
    'Blocked Shots': 'Tirs bloqués',
    'Shots insidebox': 'Tirs dans la surface',
    'Shots outsidebox': 'Tirs hors surface',
    'Fouls': 'Fautes',
    'Corner Kicks': 'Corners',
    'Offsides': 'Hors-jeux',
    'Ball Possession': 'Possession (%)',
    'Yellow Cards': 'Cartons jaunes',
    'Red Cards': 'Cartons rouges',
    'Goalkeeper Saves': 'Arrêts du gardien',
    'Total passes': 'Passes totales',
    'Passes accurate': 'Passes réussies',
    'Passes %': 'Précision passes (%)'
  }

  const importantStats = [
    'Ball Possession',
    'Total Shots',
    'Shots on Goal',
    'Corner Kicks',
    'Fouls',
    'Yellow Cards',
    'Red Cards'
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Statistiques du match</h2>
      </div>
      
      <div className="p-6">
        {Object.keys(statistics).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Statistiques non disponibles</p>
            <p className="text-gray-400 text-sm">Les données du match apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-6">
            {importantStats.map((statKey) => {
              const homeValue = statistics.home?.[statKey] || '0'
              const awayValue = statistics.away?.[statKey] || '0'
              const label = statLabels[statKey] || statKey
              
              // Convertir en nombres pour les barres
              const homeNum = parseFloat(String(homeValue).replace('%', '')) || 0
              const awayNum = parseFloat(String(awayValue).replace('%', '')) || 0
              const total = homeNum + awayNum
              const homePercent = total > 0 ? (homeNum / total) * 100 : 50
              const awayPercent = total > 0 ? (awayNum / total) * 100 : 50

              return (
                <div key={statKey} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">{homeValue}</span>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <span className="text-lg font-bold text-red-600">{awayValue}</span>
                  </div>
                  
                  <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                      style={{ width: `${homePercent}%` }}
                    />
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700"
                      style={{ width: `${awayPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{homeTeam}</span>
                    <span>{awayTeam}</span>
                  </div>
                </div>
              )
            })}
            
            {/* Autres statistiques */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-6">Statistiques détaillées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-600 mb-3">{homeTeam}</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(statistics.home || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{statLabels[key] || key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-semibold text-red-600 mb-3">{awayTeam}</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(statistics.away || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{statLabels[key] || key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}