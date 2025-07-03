// components/F1MatchDetails.tsx
import { useState, useEffect } from 'react'
import { 
  Car, Clock, Trophy, Target, Users, MapPin,
  Flag, Timer, Zap, Award, BarChart3, Activity
} from 'lucide-react'

interface F1MatchDetailsProps {
  matchDetails: {
    match: {
      id: string
      homeTeam: string
      awayTeam: string
      date: string
      venue: string
      competition: string
      details?: {
        circuit: {
          id: number
          name: string
          length: number
          image: string
        }
        location: {
          country: string
          city: string
        }
        fastest_lap?: {
          driver: {
            id: number
            name: string
            abbr: string
          }
          time: string
        }
        type: string
      }
    }
    events: any[]
    lineups: any
    statistics: any
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

interface F1Driver {
  id: number
  name: string
  abbr: string
  number: number
  team: string
  position?: number
  time?: string
  points?: number
  grid?: number
  fastest_lap?: {
    lap: number
    time: string
    speed: string
  }
}

export default function F1MatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: F1MatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'qualifying' | 'drivers' | 'circuit'>('results')
  const [raceResults, setRaceResults] = useState<F1Driver[]>([])
  const [qualifyingResults, setQualifyingResults] = useState<F1Driver[]>([])
  const [drivers, setDrivers] = useState<F1Driver[]>([])
  const [loading, setLoading] = useState(true)

  const { match } = matchDetails

  useEffect(() => {
    fetchF1Data()
  }, [match.id])

  const fetchF1Data = async () => {
    try {
      setLoading(true)
      
      // Récupérer les données F1 depuis notre API
      const response = await fetch(`/api/f1-race-details/${match.id}`)
      if (response.ok) {
        const data = await response.json()
        setRaceResults(data.results || [])
        setQualifyingResults(data.qualifying || [])
        setDrivers(data.drivers || [])
      } else {
        // Données de fallback si l'API n'est pas disponible
        generateMockF1Data()
      }
    } catch (error) {
      console.error('Erreur chargement données F1:', error)
      generateMockF1Data()
    } finally {
      setLoading(false)
    }
  }

  const generateMockF1Data = () => {
    // Pilotes F1 2024 réalistes
    const mockDrivers: F1Driver[] = [
      { id: 1, name: "Max Verstappen", abbr: "VER", number: 1, team: "Red Bull Racing", position: 1, time: "1:42:34.567", points: 25, grid: 1 },
      { id: 2, name: "Lando Norris", abbr: "NOR", number: 4, team: "McLaren", position: 2, time: "+12.345", points: 18, grid: 3 },
      { id: 3, name: "Charles Leclerc", abbr: "LEC", number: 16, team: "Ferrari", position: 3, time: "+23.456", points: 15, grid: 2 },
      { id: 4, name: "Oscar Piastri", abbr: "PIA", number: 81, team: "McLaren", position: 4, time: "+34.567", points: 12, grid: 4 },
      { id: 5, name: "Carlos Sainz", abbr: "SAI", number: 55, team: "Ferrari", position: 5, time: "+45.678", points: 10, grid: 5 },
      { id: 6, name: "George Russell", abbr: "RUS", number: 63, team: "Mercedes", position: 6, time: "+56.789", points: 8, grid: 6 },
      { id: 7, name: "Lewis Hamilton", abbr: "HAM", number: 44, team: "Mercedes", position: 7, time: "+1:07.890", points: 6, grid: 8 },
      { id: 8, name: "Fernando Alonso", abbr: "ALO", number: 14, team: "Aston Martin", position: 8, time: "+1:18.901", points: 4, grid: 7 },
      { id: 9, name: "Lance Stroll", abbr: "STR", number: 18, team: "Aston Martin", position: 9, time: "+1:29.012", points: 2, grid: 9 },
      { id: 10, name: "Pierre Gasly", abbr: "GAS", number: 10, team: "Alpine", position: 10, time: "+1:40.123", points: 1, grid: 10 }
    ]

    setRaceResults(mockDrivers)
    setQualifyingResults([...mockDrivers].sort(() => Math.random() - 0.5))
    setDrivers(mockDrivers)
  }

  return (
    <div className="space-y-6">
      {/* Header F1 */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
        <div className="flex items-center space-x-4 mb-4">
          <Car className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-red-800">{match.homeTeam}</h2>
            <p className="text-red-600">{match.awayTeam}</p>
          </div>
        </div>
        
        {match.details && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Localisation</span>
              </div>
              <p className="text-gray-900">{match.details.location?.city}, {match.details.location?.country}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Longueur circuit</span>
              </div>
              <p className="text-gray-900">{match.details.circuit?.length ? `${match.details.circuit.length} m` : 'N/A'}</p>
            </div>
            
            {match.details.fastest_lap && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">Meilleur tour</span>
                </div>
                <p className="text-gray-900">{match.details.fastest_lap.driver.name}</p>
                <p className="text-sm text-gray-600">{match.details.fastest_lap.time}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs F1 */}
      <div className="bg-white border-b">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'results', label: 'Résultats course', icon: Trophy },
            { id: 'qualifying', label: 'Qualifications', icon: Timer },
            { id: 'drivers', label: 'Pilotes & Notes', icon: Users },
            { id: 'circuit', label: 'Infos circuit', icon: Flag }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
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

      {/* Contenu des tabs */}
      {loading ? (
        <div className="text-center py-12">
          <Car className="w-8 h-8 animate-bounce mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Chargement des données F1...</p>
        </div>
      ) : (
        <>
          {activeTab === 'results' && (
            <F1ResultsTab results={raceResults} />
          )}
          
          {activeTab === 'qualifying' && (
            <F1QualifyingTab qualifying={qualifyingResults} />
          )}
          
          {activeTab === 'drivers' && (
            <F1DriversTab 
              drivers={drivers}
              playerRatings={playerRatings}
              onRatePlayer={onRatePlayer}
              currentUserId={currentUserId}
              matchId={match.id}
            />
          )}
          
          {activeTab === 'circuit' && (
            <F1CircuitTab match={match} />
          )}
        </>
      )}
    </div>
  )
}

// Composant Résultats de course
function F1ResultsTab({ results }: { results: F1Driver[] }) {
  const getPositionEmoji = (position: number) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `P${position}`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 text-white">
        <h3 className="text-xl font-semibold flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>🏁 Classement final</span>
        </h3>
      </div>
      
      <div className="p-6">
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Résultats non disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((driver) => (
              <div key={driver.id} className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                driver.position === 1 ? 'bg-yellow-50 border-yellow-300' :
                driver.position === 2 ? 'bg-gray-50 border-gray-300' :
                driver.position === 3 ? 'bg-orange-50 border-orange-300' :
                driver.position && driver.position <= 10 ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                {/* Position */}
                <div className="text-center w-12">
                  <div className={`text-2xl font-bold ${
                    driver.position === 1 ? 'text-yellow-600' :
                    driver.position === 2 ? 'text-gray-600' :
                    driver.position === 3 ? 'text-orange-600' :
                    'text-gray-700'
                  }`}>
                    {driver.position ? getPositionEmoji(driver.position) : '—'}
                  </div>
                </div>
                
                {/* Pilote */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {driver.number}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                      <p className="text-sm text-gray-600">{driver.team}</p>
                    </div>
                  </div>
                </div>
                
                {/* Temps */}
                <div className="text-right">
                  <div className="font-mono text-lg font-semibold text-gray-900">
                    {driver.time || '—'}
                  </div>
                  {driver.points && (
                    <div className="text-sm text-green-600 font-medium">
                      {driver.points} pts
                    </div>
                  )}
                </div>
                
                {/* Grid */}
                {driver.grid && (
                  <div className="text-center w-16">
                    <div className="text-sm text-gray-500">Grid</div>
                    <div className="font-semibold text-gray-700">P{driver.grid}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant Qualifications
function F1QualifyingTab({ qualifying }: { qualifying: F1Driver[] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
        <h3 className="text-xl font-semibold flex items-center space-x-2">
          <Timer className="w-5 h-5" />
          <span>⏱️ Grille de départ</span>
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualifying.map((driver, index) => (
            <div key={driver.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{driver.name}</h4>
                <p className="text-sm text-gray-600">{driver.team}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold">
                  {driver.time || `1:${20 + index}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Composant Notation des pilotes
function F1DriversTab({ 
  drivers, 
  playerRatings, 
  onRatePlayer, 
  currentUserId, 
  matchId 
}: { 
  drivers: F1Driver[]
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
  matchId: string
}) {
  const [selectedDriver, setSelectedDriver] = useState<F1Driver | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const getPositionEmoji = (position: number) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return `P${position}`
  }

  const handleRateDriver = async () => {
    if (!selectedDriver || rating === 0) return

    try {
      const playerId = `f1_driver_${selectedDriver.id}_${selectedDriver.name.replace(/\s+/g, '_')}`
      await onRatePlayer(playerId, rating, comment)
      setSelectedDriver(null)
      setRating(0)
      setComment('')
    } catch (error) {
      console.error('Erreur notation pilote:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-white">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>🏁 Notation des pilotes</span>
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => {
              const driverRating = playerRatings.find(r => 
                r.player.name === driver.name || r.player.id.includes(driver.id.toString())
              )
              const userRating = driverRating && currentUserId ? 
                playerRatings.find(r => r.user.id === currentUserId && r.player.name === driver.name) : null

              return (
                <div key={driver.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      {driver.number}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                      <p className="text-sm text-gray-600">{driver.team}</p>
                      {driver.position && (
                        <p className="text-sm font-medium text-red-600">
                          {getPositionEmoji(driver.position)}
                        </p>
                      )}
                    </div>
                  </div>

                  {userRating ? (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">✅ Votre note</span>
                        <span className="text-lg font-bold text-green-600">{userRating.rating}/10</span>
                      </div>
                      {userRating.comment && (
                        <p className="text-sm text-green-700 italic">"{userRating.comment}"</p>
                      )}
                    </div>
                  ) : currentUserId ? (
                    <button
                      onClick={() => setSelectedDriver(driver)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      ⭐ Noter ce pilote
                    </button>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-2">
                      Connectez-vous pour noter
                    </div>
                  )}

                  {/* Moyenne des notes */}
                  {driverRating && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Moyenne: {driverRating.avgRating || 'N/A'}/10
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal de notation */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Car className="w-5 h-5 text-red-600" />
              <span>Noter {selectedDriver.name}</span>
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {selectedDriver.number}
                </div>
                <div>
                  <p className="font-medium">{selectedDriver.name}</p>
                  <p className="text-sm text-gray-600">{selectedDriver.team}</p>
                  {selectedDriver.position && (
                    <p className="text-sm font-medium text-red-600">
                      Position finale: {getPositionEmoji(selectedDriver.position)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note sur 10
              </label>
              <div className="flex space-x-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className={`w-8 h-8 rounded-full border-2 font-bold text-sm transition-colors ${
                      i < rating 
                        ? 'bg-red-600 border-red-600 text-white' 
                        : 'border-gray-300 text-gray-400 hover:border-red-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating <= 3 && "Performance décevante"}
                  {rating >= 4 && rating <= 6 && "Performance correcte"}
                  {rating >= 7 && rating <= 8 && "Bonne performance"}
                  {rating >= 9 && "Performance exceptionnelle !"}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Votre avis sur cette performance..."
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">{comment.length}/200</div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRateDriver}
                disabled={rating === 0}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                ✅ Confirmer la note
              </button>
              <button
                onClick={() => {
                  setSelectedDriver(null)
                  setRating(0)
                  setComment('')
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant Infos circuit
function F1CircuitTab({ match }: { match: any }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-white">
        <h3 className="text-xl font-semibold flex items-center space-x-2">
          <Flag className="w-5 h-5" />
          <span>🏁 Informations circuit</span>
        </h3>
      </div>
      
      <div className="p-6">
        {match.details?.circuit ? (
          <div className="space-y-6">
            {/* Image du circuit */}
            {match.details.circuit.image && (
              <div className="text-center">
                <img 
                  src={match.details.circuit.image} 
                  alt={match.details.circuit.name}
                  className="max-w-full h-64 object-contain mx-auto rounded-lg"
                />
              </div>
            )}

            {/* Infos circuit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Caractéristiques</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom:</span>
                    <span className="font-medium">{match.details.circuit.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longueur:</span>
                    <span className="font-medium">{match.details.circuit.length} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Localisation:</span>
                    <span className="font-medium">
                      {match.details.location?.city}, {match.details.location?.country}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Records</span>
                </h4>
                <div className="space-y-2">
                  {match.details.fastest_lap ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Meilleur tour:</span>
                        <span className="font-medium">{match.details.fastest_lap.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pilote:</span>
                        <span className="font-medium">{match.details.fastest_lap.driver.name}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Aucun record disponible</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description générique */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🏁 À propos de ce Grand Prix</h4>
              <p className="text-blue-800">
                Le {match.homeTeam} est l'une des courses emblématiques du calendrier de Formule 1. 
                Le circuit de {match.details.circuit.name} offre un défi unique aux pilotes avec ses 
                {Math.round(match.details.circuit.length / 1000)} kilomètres de tracé.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Flag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Informations du circuit non disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}