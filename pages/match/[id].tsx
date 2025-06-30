// pages/match/[id].tsx - VERSION MULTI-SPORTS COMPLÈTE
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Clock, MapPin, Users, Star,
  Target, AlertTriangle, RefreshCw, UserCheck,
  BarChart3, Activity, Trophy, Flag, Eye, EyeOff
} from 'lucide-react'
import axios from 'axios'
import FootballMatchDetails from '../../components/FootballMatchDetails'
import BasketballMatchDetails from '../../components/BasketballMatchDetails'

interface MatchData {
  id: string
  sport: 'FOOTBALL' | 'BASKETBALL' | 'MMA' | 'RUGBY' | 'F1'
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string
  venue: string
  referee: string
  attendance?: number
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

export default function MatchDetailsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { id } = router.query
  
  const [matchData, setMatchData] = useState<MatchDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
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
        setMatchData(response.data)
        
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
      console.log('🎯 Notation joueur:', { playerId, rating, comment, matchId: id })

      const response = await axios.post('/api/player-ratings', {
        playerId,
        matchId: id,
        rating,
        comment
      })

      console.log('✅ Réponse API:', response.data)

      if (response.data.success) {
        // Recharger TOUTES les notations des joueurs
        const ratingsResponse = await axios.get(`/api/player-ratings?matchId=${id}`)
        if (ratingsResponse.data.success) {
          setPlayerRatings(ratingsResponse.data.ratings || [])
          console.log(`📊 ${ratingsResponse.data.ratings?.length || 0} notations rechargées`)
        }
        
        // Notification de succès
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm'
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <div class="text-xl">⭐</div>
            <div>
              <div class="font-semibold">${response.data.message || 'Joueur noté !'}</div>
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
      console.error('❌ Erreur notation joueur:', error)
      
      // Notification d'erreur
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

  // Fonctions utilitaires pour différents sports
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

  const formatScore = (homeScore: number, awayScore: number, sport: string) => {
    if (sport === 'BASKETBALL') {
      return `${homeScore} - ${awayScore}`
    }
    if (sport === 'MMA') {
      return 'W - L' // Win/Loss
    }
    if (sport === 'F1') {
      return `P${homeScore}` // Position
    }
    return `${homeScore} - ${awayScore}` // Football, Rugby
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

  if (!matchData) {
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

  const { match } = matchData.data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Universel */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux matchs
          </Link>
          
          {/* Score principal universel */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-3xl">{getSportEmoji(match.sport)}</span>
              <span className="text-lg font-medium text-gray-600">{match.competition}</span>
            </div>

            <div className="flex items-center justify-center space-x-8 mb-4">
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-2">
                  {match.homeTeamLogo && (
                    <img src={match.homeTeamLogo} alt="" className="w-8 h-8" />
                  )}
                  <h1 className="text-2xl font-bold text-gray-900">{match.homeTeam}</h1>
                </div>
                <div className="text-4xl font-bold text-blue-600 mt-2">{match.homeScore}</div>
              </div>
              
              <div className="text-center">
                <div className="text-gray-500 text-sm">VS</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">-</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{match.awayTeam}</h1>
                  {match.awayTeamLogo && (
                    <img src={match.awayTeamLogo} alt="" className="w-8 h-8" />
                  )}
                </div>
                <div className="text-4xl font-bold text-blue-600 mt-2">{match.awayScore}</div>
              </div>
            </div>

            {/* Infos du match universelles */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(match.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{match.venue}</span>
              </div>
              {match.referee && (
                <div className="flex items-center space-x-1">
                  <Flag className="w-4 h-4" />
                  <span>{match.referee}</span>
                </div>
              )}
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

      {/* Contenu spécifique par sport */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal - Varie selon le sport */}
          <div className="lg:col-span-2">
            {match.sport === 'FOOTBALL' && (
              <FootballMatchDetails
                matchDetails={matchData.data}
                playerRatings={playerRatings}
                onRatePlayer={ratePlayer}
                currentUserId={session?.user?.id}
              />
            )}
            
            {match.sport === 'BASKETBALL' && (
              <BasketballMatchDetails
                matchDetails={matchData.data}
                playerRatings={playerRatings}
                onRatePlayer={ratePlayer}
                currentUserId={session?.user?.id}
              />
            )}

            {/* Sports pas encore implémentés */}
            {!['FOOTBALL', 'BASKETBALL'].includes(match.sport) && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">{getSportEmoji(match.sport)}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Interface {match.sport} en développement
                </h3>
                <p className="text-gray-600 mb-4">
                  L'interface détaillée pour {match.sport} sera bientôt disponible !
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    🚧 En attendant, vous pouvez toujours noter le match via la sidebar →
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar universelle - Notation du match */}
          <div className="lg:col-span-1 space-y-6">
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
            
            <MatchInfoCard match={match} />
          </div>
        </div>
      </div>
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getSportEmoji(match.sport)}</span>
          <div>
            <h3 className="text-lg font-semibold">Noter ce match</h3>
            <p className="text-indigo-100 text-sm">Sport: {match.sport}</p>
          </div>
        </div>
      </div>
      
      {/* Stats du match */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {totalRatings > 0 ? avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-gray-600">Note moyenne</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{totalRatings}</div>
            <div className="text-gray-600">Vote{totalRatings > 1 ? 's' : ''}</div>
          </div>
        </div>
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
              placeholder={`Qu'avez-vous pensé de ce match ${getSportEmoji(match.sport)} ?`}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/300 caractères
            </div>
          </div>
          
          <button
            onClick={onSubmitRating}
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
            Connectez-vous pour noter ce match
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
  )
}

// Composant d'informations sur le match
function MatchInfoCard({ match }: { match: MatchData }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h4 className="font-semibold text-gray-900 mb-4">📊 Informations</h4>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Sport</span>
          <span className="font-medium text-gray-900">{match.sport}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Date</span>
          <span className="font-medium text-gray-900">
            {new Date(match.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Lieu</span>
          <span className="font-medium text-gray-900">{match.venue}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Compétition</span>
          <span className="font-medium text-gray-900">{match.competition}</span>
        </div>
        {match.referee && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Arbitre</span>
            <span className="font-medium text-gray-900">{match.referee}</span>
          </div>
        )}
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
  )
}