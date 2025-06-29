// components/FootballMatchDetails.tsx
import { useState } from 'react'
import { 
  Target, AlertTriangle, RefreshCw, UserCheck, BarChart3, 
  Activity, Trophy, Flag, Clock, MapPin, Users 
} from 'lucide-react'
import EnhancedLineupsTab from './EnhancedLineupsTab'

interface FootballMatchDetailsProps {
  matchDetails: {
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
      home: any
      away: any
    }
    statistics: {
      home: Record<string, any>
      away: Record<string, any>
    }
  }
  playerRatings: any[]
  onRatePlayer: (playerId: string, rating: number, comment?: string) => Promise<void>
  currentUserId?: string
}

export default function FootballMatchDetails({ 
  matchDetails, 
  playerRatings, 
  onRatePlayer, 
  currentUserId 
}: FootballMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'stats'>('timeline')
  
  const { match, events, lineups, statistics } = matchDetails

  // Séparer les événements football
  const goals = events.filter(e => e.type === 'GOAL')
  const cards = events.filter(e => e.type === 'CARD')
  const substitutions = events.filter(e => e.type === 'SUBSTITUTION')

  return (
    <div className="space-y-6">
      {/* Résumé rapide football */}
      {(goals.length > 0 || cards.filter(c => c.detail?.includes('Red') || c.detail?.includes('rouge')).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buteurs */}
          {goals.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">⚽ Buteurs</h4>
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
                <h4 className="font-semibold text-red-800">🟥 Cartons rouges</h4>
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
      )}

      {/* Tabs Football */}
      <div className="bg-white border-b">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'timeline', label: 'Timeline', icon: Activity },
            { id: 'lineups', label: 'Compositions & Tactique', icon: UserCheck },
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

      {/* Contenu des tabs */}
      {activeTab === 'timeline' && (
        <FootballTimelineTab 
          events={events} 
          goals={goals} 
          cards={cards} 
          substitutions={substitutions} 
        />
      )}
      
      {activeTab === 'lineups' && (
        <EnhancedLineupsTab 
          lineups={{
            home: { ...lineups.home, teamName: match.homeTeam },
            away: { ...lineups.away, teamName: match.awayTeam }
          }}
          matchId={match.id}
          playerRatings={playerRatings}
          onRatePlayer={onRatePlayer}
          currentUserId={currentUserId}
        />
      )}
      
      {activeTab === 'stats' && (
        <FootballStatsTab 
          statistics={statistics} 
          homeTeam={match.homeTeam} 
          awayTeam={match.awayTeam} 
        />
      )}
    </div>
  )
}

function FootballTimelineTab({ events, goals, cards, substitutions }: any) {
  return (
    <div className="space-y-6">
      {/* Stats résumé football */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">{goals.length}</div>
              <div className="text-sm font-medium text-emerald-700">⚽ Buts marqués</div>
            </div>
            <Target className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-600">{cards.length}</div>
              <div className="text-sm font-medium text-amber-700">🟨🟥 Cartons</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">{substitutions.length}</div>
              <div className="text-sm font-medium text-blue-700">🔄 Changements</div>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Timeline des événements football */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">⚽ Timeline du match</h2>
        </div>
        
        <div className="p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun événement disponible</p>
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
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 ${style.accent} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {event.minute}'
                        </div>
                        {index < events.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      
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

function FootballStatsTab({ statistics, homeTeam, awayTeam }: any) {
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
        <h2 className="text-xl font-semibold text-gray-900">⚽ Statistiques Football</h2>
      </div>
      
      <div className="p-6">
        {Object.keys(statistics).length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Statistiques non disponibles</p>
          </div>
        ) : (
          <div className="space-y-6">
            {importantStats.map((statKey) => {
              const homeValue = statistics.home?.[statKey] || '0'
              const awayValue = statistics.away?.[statKey] || '0'
              const label = statLabels[statKey] || statKey
              
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
          </div>
        )}
      </div>
    </div>
  )
}