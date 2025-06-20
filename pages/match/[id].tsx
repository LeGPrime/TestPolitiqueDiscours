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
      startXI: Array<{ player: string; number: number; position: string }>
      substitutes: Array<{ player: string; number: number; position: string }>
      coach: string
    }
    away: {
      formation: string
      startXI: Array<{ player: string; number: number; position: string }>
      substitutes: Array<{ player: string; number: number; position: string }>
      coach: string
    }
  }
  statistics: {
    home: Record<string, any>
    away: Record<string, any>
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
        
        // Vérifier si l'utilisateur a déjà noté
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
              <LineupsTab lineups={lineups} />
            )}
            
            {activeTab === 'stats' && (
              <StatsTab statistics={statistics} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
            )}
          </div>

          {/* Sidebar - Notation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Noter ce match</h3>
              
              {session ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Votre note :</p>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-8 h-8 cursor-pointer transition-colors ${
                            i < userRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          } hover:text-yellow-400`}
                          onClick={() => setUserRating(i + 1)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Commentaire :</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Qu'avez-vous pensé de ce match ?"
                    />
                  </div>
                  
                  <button
                    onClick={submitRating}
                    disabled={userRating === 0}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {userRating > 0 ? 'Mettre à jour' : 'Noter'} le match
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">
                  <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700">
                    Connectez-vous
                  </Link> pour noter ce match
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant Timeline
function TimelineTab({ events, goals, cards, substitutions }: any) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline du match</h2>
      
      {/* Résumé rapide */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Target className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{goals.length}</div>
          <div className="text-sm text-green-700">Buts</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
          <div className="text-2xl font-bold text-yellow-600">{cards.length}</div>
          <div className="text-sm text-yellow-700">Cartons</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <RefreshCw className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-blue-600">{substitutions.length}</div>
          <div className="text-sm text-blue-700">Changements</div>
        </div>
      </div>

      {/* Timeline des événements */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun événement disponible</p>
        ) : (
          events.map((event: any, index: number) => (
            <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="text-sm font-bold text-gray-900 w-12">
                {event.minute}'
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {event.type === 'GOAL' && <Target className="w-4 h-4 text-green-600" />}
                  {event.type === 'CARD' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  {event.type === 'SUBSTITUTION' && <RefreshCw className="w-4 h-4 text-blue-600" />}
                  
                  <span className="font-medium">{event.player}</span>
                  <span className="text-gray-500">({event.team})</span>
                </div>
                
                {event.detail && (
                  <p className="text-sm text-gray-600 mt-1">{event.detail}</p>
                )}
                
                {event.assist && (
                  <p className="text-sm text-blue-600 mt-1">Passe décisive: {event.assist}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Composant Compositions
function LineupsTab({ lineups }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Équipe domicile */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Équipe domicile ({lineups.home.formation})
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">Entraîneur: {lineups.home.coach}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Titulaires</h4>
              <div className="space-y-2">
                {lineups.home.startXI.map((player: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                      {player.number}
                    </div>
                    <div>
                      <p className="font-medium">{player.player}</p>
                      <p className="text-sm text-gray-600">{player.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Remplaçants</h4>
              <div className="space-y-2">
                {lineups.home.substitutes.map((player: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {player.number}
                    </div>
                    <div>
                      <p className="font-medium">{player.player}</p>
                      <p className="text-sm text-gray-600">{player.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Équipe extérieure */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Équipe extérieure ({lineups.away.formation})
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">Entraîneur: {lineups.away.coach}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Titulaires</h4>
              <div className="space-y-2">
                {lineups.away.startXI.map((player: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600">
                      {player.number}
                    </div>
                    <div>
                      <p className="font-medium">{player.player}</p>
                      <p className="text-sm text-gray-600">{player.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Remplaçants</h4>
              <div className="space-y-2">
                {lineups.away.substitutes.map((player: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {player.number}
                    </div>
                    <div>
                      <p className="font-medium">{player.player}</p>
                      <p className="text-sm text-gray-600">{player.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiques du match</h2>
      
      {Object.keys(statistics).length === 0 ? (
        <p className="text-gray-500 text-center py-8">Statistiques non disponibles</p>
      ) : (
        <div className="space-y-4">
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
              <div key={statKey} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-600">{homeValue}</span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm font-medium text-red-600">{awayValue}</span>
                </div>
                
                <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${homePercent}%` }}
                  />
                  <div 
                    className="bg-red-500 transition-all duration-500"
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
            <h3 className="font-medium text-gray-900 mb-4">Statistiques détaillées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-600 mb-2">{homeTeam}</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(statistics.home || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{statLabels[key] || key}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-600 mb-2">{awayTeam}</h4>
                <div className="space-y-1 text-sm">
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
  )
}