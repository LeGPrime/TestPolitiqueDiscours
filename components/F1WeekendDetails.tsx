// components/F1WeekendDetails.tsx - NOUVEAU composant intelligent
import { useState, useEffect } from 'react'
import { 
  Car, Clock, Trophy, Target, Users, MapPin,
  Flag, Timer, Zap, Award, BarChart3, Activity,
  Calendar, CheckCircle, XCircle
} from 'lucide-react'

interface F1WeekendDetailsProps {
  matchDetails: {
    match: {
      id: string
      homeTeam: string // "Spanish Grand Prix"
      awayTeam: string // "Circuit de Barcelona-Catalunya"
      date: string
      venue: string
      competition: string
      details?: {
        circuit: any
        location: any
        sessions: any[]
        hasRace: boolean
        hasQualifying: boolean
        hasSprint: boolean
      }
    }
    events: any[]
    lineups: any
    statistics: any
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string, session?: string) => Promise<void>
  currentUserId?: string
}

export default function F1WeekendDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: F1WeekendDetailsProps) {
  const [activeSession, setActiveSession] = useState<'race' | 'qualifying' | 'sprint' | 'practice'>('race')
  const [weekendData, setWeekendData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { match } = matchDetails

  useEffect(() => {
    fetchWeekendData()
  }, [match.id])

  const fetchWeekendData = async () => {
    try {
      setLoading(true)
      
      // Récupérer les données du week-end F1 complet
      const response = await fetch(`/api/f1-weekend-details/${match.id}`)
      if (response.ok) {
        const data = await response.json()
        setWeekendData(data)
      } else {
        // Données de fallback
        generateMockWeekendData()
      }
    } catch (error) {
      console.error('Erreur chargement week-end F1:', error)
      generateMockWeekendData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockWeekendData = () => {
    // Données de test pour développement
    setWeekendData({
      weekend: {
        name: match.homeTeam,
        circuit: match.awayTeam,
        sessions: ['race', 'qualifying', 'sprint']
      },
      sessions: {
        race: generateMockResults('race'),
        qualifying: generateMockResults('qualifying'),
        sprint: generateMockResults('sprint')
      }
    })
  }

  const generateMockResults = (sessionType: string) => {
    const drivers = [
      { name: "Max Verstappen", number: 1, team: "Red Bull Racing" },
      { name: "Lando Norris", number: 4, team: "McLaren" },
      { name: "Charles Leclerc", number: 16, team: "Ferrari" },
      { name: "Oscar Piastri", number: 81, team: "McLaren" },
      { name: "Carlos Sainz", number: 55, team: "Ferrari" },
      { name: "George Russell", number: 63, team: "Mercedes" },
      { name: "Lewis Hamilton", number: 44, team: "Mercedes" },
      { name: "Fernando Alonso", number: 14, team: "Aston Martin" },
      { name: "Lance Stroll", number: 18, team: "Aston Martin" },
      { name: "Pierre Gasly", number: 10, team: "Alpine" }
    ]

    return drivers.map((driver, index) => ({
      id: `${sessionType}_${index + 1}`,
      driver: {
        id: index + 1,
        name: driver.name,
        abbr: driver.name.split(' ').map(n => n[0]).join(''),
        number: driver.number,
        team: driver.team
      },
      position: index + 1,
      time: sessionType === 'qualifying' 
        ? `1:${(18 + Math.floor(index / 5)).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`
        : index === 0 ? "1:45:23.456" : `+${(index * 12 + Math.random() * 10).toFixed(3)}`,
      points: sessionType === 'race' ? [25,18,15,12,10,8,6,4,2,1][index] || 0 : 0,
      grid: Math.floor(Math.random() * 20) + 1
    }))
  }

  const getSessionIcon = (session: string) => {
    switch (session) {
      case 'race': return <Car className="w-5 h-5" />
      case 'qualifying': return <Timer className="w-5 h-5" />
      case 'sprint': return <Zap className="w-5 h-5" />
      case 'practice': return <Target className="w-5 h-5" />
      default: return <Flag className="w-5 h-5" />
    }
  }

  const getSessionLabel = (session: string) => {
    switch (session) {
      case 'race': return 'Course principale'
      case 'qualifying': return 'Qualifications'
      case 'sprint': return 'Course Sprint'
      case 'practice': return 'Essais libres'
      default: return session
    }
  }

  const getSessionColor = (session: string) => {
    switch (session) {
      case 'race': return 'from-red-500 to-orange-600'
      case 'qualifying': return 'from-blue-500 to-indigo-600'
      case 'sprint': return 'from-purple-500 to-pink-600'
      case 'practice': return 'from-gray-500 to-gray-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const availableSessions = weekendData?.weekend?.sessions || ['race', 'qualifying']

  return (
    <div className="space-y-6">
      {/* Header F1 Week-end */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center space-x-4 mb-4">
          <Car className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-red-800">🏁 {match.homeTeam}</h2>
            <p className="text-red-600">📍 {match.awayTeam}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Week-end du</span>
            </div>
            <p className="text-gray-900">{new Date(match.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}</p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Flag className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Sessions</span>
            </div>
            <div className="flex space-x-2">
              {availableSessions.includes('qualifying') && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Qualifs</span>
              )}
              {availableSessions.includes('sprint') && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Sprint</span>
              )}
              {availableSessions.includes('race') && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Course</span>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Localisation</span>
            </div>
            <p className="text-gray-900">{match.details?.location?.city}, {match.details?.location?.country}</p>
          </div>
        </div>
      </div>

      {/* Sélecteur de sessions */}
      <div className="bg-white border-b">
        <div className="flex space-x-4 px-6 overflow-x-auto">
          {availableSessions.map((session) => (
            <button
              key={session}
              onClick={() => setActiveSession(session as any)}
              className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeSession === session
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {getSessionIcon(session)}
              <span>{getSessionLabel(session)}</span>
              {weekendData?.sessions?.[session] && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full ml-2">
                  {weekendData.sessions[session].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu de la session */}
      {loading ? (
        <div className="text-center py-12">
          <Car className="w-8 h-8 animate-bounce mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Chargement des données du week-end...</p>
        </div>
      ) : (
        <F1SessionResults
          session={activeSession}
          results={weekendData?.sessions?.[activeSession] || []}
          playerRatings={playerRatings}
          onRatePlayer={onRatePlayer}
          currentUserId={currentUserId}
          matchId={match.id}
        />
      )}
    </div>
  )
}

// Composant pour afficher les résultats d'une session
function F1SessionResults({ 
  session, 
  results, 
  playerRatings, 
  onRatePlayer, 
  currentUserId, 
  matchId 
}: {
  session: string
  results: any[]
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string, session?: string) => Promise<void>
  currentUserId?: string
  matchId: string
}) {
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const getSessionTitle = (session: string) => {
    switch (session) {
      case 'race': return '🏁 Résultats de la course'
      case 'qualifying': return '⏱️ Grille de qualification'
      case 'sprint': return '⚡ Course Sprint'
      case 'practice': return '🔧 Essais libres'
      default: return `📊 ${session}`
    }
  }

  const getPositionEmoji = (position: number) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `P${position}`
  }

  const handleRateDriver = async () => {
    if (!selectedDriver || rating === 0) return

    try {
      const playerId = `f1_driver_${selectedDriver.driver.id}_${selectedDriver.driver.name.replace(/\s+/g, '_')}`
      await onRatePlayer(playerId, rating, comment, session)
      setSelectedDriver(null)
      setRating(0)