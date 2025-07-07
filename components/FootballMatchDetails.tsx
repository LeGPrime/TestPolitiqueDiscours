// components/FootballMatchDetails.tsx - VERSION RÉORGANISÉE ET MOBILE-OPTIMIZED
import { useState, useEffect } from 'react'
import { 
  Target, AlertTriangle, RefreshCw, UserCheck, BarChart3, 
  Activity, Trophy, Flag, Clock, MapPin, Users, ChevronDown, ChevronUp
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
  // 🔄 NOUVEL ORDRE : Compositions → Stats → Timeline
  const [activeTab, setActiveTab] = useState<'lineups' | 'stats' | 'timeline'>('lineups')
  
  // 📱 État différent selon la taille d'écran
  const [showQuickSummary, setShowQuickSummary] = useState(() => {
    // Fermer par défaut sur mobile, ouvert sur desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 // Desktop: ouvert, Mobile: fermé
    }
    return false // SSR: fermé par défaut
  })

  // 📱 Écouter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      // Réajuster l'état selon la nouvelle taille
      if (window.innerWidth >= 768) {
        setShowQuickSummary(true) // Desktop: ouvert par défaut
      } else {
        setShowQuickSummary(false) // Mobile: fermé par défaut
      }
    }

    // Écouter les changements de taille
    window.addEventListener('resize', handleResize)
    
    // Nettoyer l'événement
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const { match, events, lineups, statistics } = matchDetails

  // Séparer les événements football
  const goals = events.filter(e => e.type === 'GOAL')
  const cards = events.filter(e => e.type === 'CARD')
  const redCards = cards.filter(c => c.detail?.includes('Red') || c.detail?.includes('rouge'))
  const substitutions = events.filter(e => e.type === 'SUBSTITUTION')

  // Données pour résumé rapide
  const keyEvents = {
    goals: goals.length,
    redCards: redCards.length,
    totalCards: cards.length,
    substitutions: substitutions.length
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 📱 RÉSUMÉ RAPIDE COLLAPSIBLE - Responsive selon écran */}
      {(goals.length > 0 || redCards.length > 0 || cards.length > 2) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
          <button
            onClick={() => setShowQuickSummary(!showQuickSummary)}
            className="w-full p-4 md:p-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors rounded-2xl touch-target"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">⚽ Résumé du match</h4>
                <p className="text-sm text-gray-600">
                  {goals.length} but{goals.length > 1 ? 's' : ''} • {cards.length} carton{cards.length > 1 ? 's' : ''} • {substitutions.length} changement{substitutions.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">
                {showQuickSummary ? 'Masquer' : 'Afficher'}
              </span>
              <div className={`transition-transform duration-300 ${showQuickSummary ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </button>

          {showQuickSummary && (
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buteurs */}
                {goals.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Target className="w-5 h-5 text-green-600" />
                      <h5 className="font-semibold text-green-800">⚽ Buteurs ({goals.length})</h5>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {goals.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {goal.minute}'
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900 block truncate">{goal.player}</span>
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-gray-600">({goal.team})</span>
                                {goal.assist && (
                                  <span className="text-blue-600 truncate">
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
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h5 className="font-semibold text-red-800">
                        🟨🟥 Cartons ({cards.length})
                        {redCards.length > 0 && ` • ${redCards.length} rouge${redCards.length > 1 ? 's' : ''}`}
                      </h5>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {cards.slice(0, 6).map((card, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                            card.detail?.includes('Red') || card.detail?.includes('rouge') 
                              ? 'bg-red-600' 
                              : 'bg-yellow-600'
                          }`}>
                            {card.minute}'
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-900 block truncate">{card.player}</span>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-gray-600">({card.team})</span>
                              {card.detail && (
                                <span className={`truncate ${
                                  card.detail?.includes('Red') || card.detail?.includes('rouge')
                                    ? 'text-red-600' 
                                    : 'text-yellow-600'
                                }`}>
                                  {card.detail}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {cards.length > 6 && (
                        <div className="text-xs text-gray-500 text-center py-1">
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
      )}

      {/* 📱 TABS NAVIGATION - Mobile Optimized */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Mobile: Horizontal scroll tabs */}
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 p-2 min-w-full md:min-w-0 md:justify-center">
            {[
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
                  className={`flex-shrink-0 flex flex-col items-center space-y-2 px-4 py-3 md:px-6 md:py-4 rounded-xl font-medium text-sm transition-all duration-300 min-w-[100px] md:min-w-[140px] ${
                    isActive
                      ? `bg-gradient-to-br ${
                          tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          tab.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          'from-green-500 to-green-600'
                        } text-white shadow-lg scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  <div className="text-center">
                    <div className="font-bold text-xs md:text-sm">
                      {window.innerWidth < 768 ? tab.shortLabel : tab.label}
                    </div>
                    {isActive && (
                      <div className="text-xs opacity-90 hidden md:block">
                        {tab.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Badge avec nombre d'éléments */}
                  {tab.id === 'timeline' && events.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {events.length > 9 ? '9+' : events.length}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 📱 CONTENU DES TABS - Mobile First */}
      <div className="min-h-[60vh]">
        {/* TAB 1: COMPOSITIONS & TACTIQUE (Par défaut) */}
        {activeTab === 'lineups' && (
          <div className="space-y-4">
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
          </div>
        )}
        
        {/* TAB 2: STATISTIQUES */}
        {activeTab === 'stats' && (
          <FootballStatsTabMobile 
            statistics={statistics} 
            homeTeam={match.homeTeam} 
            awayTeam={match.awayTeam}
            keyEvents={keyEvents}
          />
        )}
        
        {/* TAB 3: TIMELINE */}
        {activeTab === 'timeline' && (
          <FootballTimelineTabMobile 
            events={events} 
            goals={goals} 
            cards={cards} 
            substitutions={substitutions}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />
        )}
      </div>
    </div>
  )
}

// 📱 COMPOSANT TIMELINE OPTIMISÉ MOBILE
function FootballTimelineTabMobile({ events, goals, cards, substitutions, homeTeam, awayTeam }: any) {
  const [filter, setFilter] = useState<'all' | 'goals' | 'cards' | 'subs'>('all')

  // Filtrer les événements
  const filteredEvents = events.filter((event: any) => {
    if (filter === 'all') return true
    if (filter === 'goals') return event.type === 'GOAL'
    if (filter === 'cards') return event.type === 'CARD'
    if (filter === 'subs') return event.type === 'SUBSTITUTION'
    return true
  })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats résumé - Mobile Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 border border-green-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-emerald-600 mb-1">{goals.length}</div>
          <div className="text-xs md:text-sm font-medium text-emerald-700">⚽ Buts</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-amber-600 mb-1">{cards.length}</div>
          <div className="text-xs md:text-sm font-medium text-amber-700">🟨🟥 Cartons</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{substitutions.length}</div>
          <div className="text-xs md:text-sm font-medium text-blue-700">🔄 Changes</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{events.length}</div>
          <div className="text-xs md:text-sm font-medium text-purple-700">📊 Total</div>
        </div>
      </div>

      {/* Timeline principale */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header avec filtres */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-gray-600" />
              <span>⚽ Timeline du match</span>
            </h2>
            
            {/* Filtres mobile */}
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { id: 'all', label: 'Tout', count: events.length, color: 'gray' },
                { id: 'goals', label: 'Buts', count: goals.length, color: 'green', emoji: '⚽' },
                { id: 'cards', label: 'Cartons', count: cards.length, color: 'yellow', emoji: '🟨' },
                { id: 'subs', label: 'Changes', count: substitutions.length, color: 'blue', emoji: '🔄' }
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id as any)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filter === filterOption.id
                      ? `bg-${filterOption.color}-500 text-white shadow-md`
                      : `bg-${filterOption.color}-100 text-${filterOption.color}-700 hover:bg-${filterOption.color}-200`
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    {filterOption.emoji && <span>{filterOption.emoji}</span>}
                    <span>{filterOption.label}</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {filterOption.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {filter === 'all' ? 'Aucun événement disponible' : `Aucun ${filter === 'goals' ? 'but' : filter === 'cards' ? 'carton' : 'changement'} dans ce match`}
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredEvents.map((event: any, index: number) => {
                const getEventStyle = (type: string) => {
                  switch(type) {
                    case 'GOAL':
                      return {
                        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
                        border: 'border-emerald-200',
                        icon: <Target className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />,
                        accent: 'bg-emerald-500',
                        textColor: 'text-emerald-800'
                      }
                    case 'CARD':
                      return {
                        bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
                        border: 'border-amber-200',
                        icon: <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />,
                        accent: event.detail?.includes('Red') ? 'bg-red-500' : 'bg-amber-500',
                        textColor: 'text-amber-800'
                      }
                    case 'SUBSTITUTION':
                      return {
                        bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                        border: 'border-blue-200',
                        icon: <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />,
                        accent: 'bg-blue-500',
                        textColor: 'text-blue-800'
                      }
                    default:
                      return {
                        bg: 'bg-gray-50',
                        border: 'border-gray-200',
                        icon: <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />,
                        accent: 'bg-gray-500',
                        textColor: 'text-gray-800'
                      }
                  }
                }
                
                const style = getEventStyle(event.type)
                
                return (
                  <div key={index} className={`${style.bg} ${style.border} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
                    <div className="flex items-start space-x-3 md:space-x-4">
                      {/* Minute + Timeline connector */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 ${style.accent} rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base`}>
                          {event.minute}'
                        </div>
                        {index < filteredEvents.length - 1 && (
                          <div className="w-0.5 h-6 md:h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      
                      {/* Contenu de l'événement */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3 mb-2">
                          {style.icon}
                          <span className="font-bold text-gray-900 text-base md:text-lg">{event.player}</span>
                          <span className="text-sm bg-white/60 px-3 py-1 rounded-full text-gray-600 font-medium">
                            {event.team}
                          </span>
                        </div>
                        
                        {event.detail && (
                          <div className={`text-sm ${style.textColor} mb-2 bg-white/40 rounded-lg p-3 font-medium`}>
                            {event.detail}
                          </div>
                        )}
                        
                        {event.assist && (
                          <div className="text-sm text-blue-600 font-medium bg-blue-50 rounded-lg p-2">
                            🎯 Passe décisive: <span className="font-bold">{event.assist}</span>
                          </div>
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

// 📱 COMPOSANT STATS OPTIMISÉ MOBILE
function FootballStatsTabMobile({ statistics, homeTeam, awayTeam, keyEvents }: any) {
  const [category, setCategory] = useState<'shooting' | 'possession' | 'discipline'>('shooting')

  const statCategories = {
    shooting: {
      title: '🎯 Attaque & Tirs',
      color: 'green',
      stats: ['Total Shots', 'Shots on Goal', 'Shots off Goal', 'Blocked Shots', 'Shots insidebox', 'Shots outsidebox']
    },
    possession: {
      title: '⚽ Possession & Passes',
      color: 'blue', 
      stats: ['Ball Possession', 'Total passes', 'Passes accurate', 'Passes %', 'Corner Kicks', 'Offsides']
    },
    discipline: {
      title: '🟨 Discipline & Gardien',
      color: 'amber',
      stats: ['Fouls', 'Yellow Cards', 'Red Cards', 'Goalkeeper Saves']
    }
  }

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Résumé rapide des événements */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>📊 Résumé événements</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{keyEvents.goals}</div>
            <div className="text-sm text-gray-600">⚽ Buts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{keyEvents.totalCards}</div>
            <div className="text-sm text-gray-600">🟨 Cartons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{keyEvents.redCards}</div>
            <div className="text-sm text-gray-600">🟥 Rouges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{keyEvents.substitutions}</div>
            <div className="text-sm text-gray-600">🔄 Changes</div>
          </div>
        </div>
      </div>

      {/* Sélecteur de catégories */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 p-2 min-w-full">
            {Object.entries(statCategories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setCategory(key as any)}
                className={`flex-1 min-w-[120px] flex flex-col items-center space-y-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  category === key
                    ? `bg-gradient-to-br ${
                        cat.color === 'green' ? 'from-green-500 to-green-600' :
                        cat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                        'from-amber-500 to-amber-600'
                      } text-white shadow-lg scale-105`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-center">{cat.title}</div>
                <div className="text-xs opacity-90">{cat.stats.length} stats</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistiques de la catégorie sélectionnée */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className={`p-4 md:p-6 text-white bg-gradient-to-r ${
          statCategories[category].color === 'green' ? 'from-green-500 to-green-600' :
          statCategories[category].color === 'blue' ? 'from-blue-500 to-blue-600' :
          'from-amber-500 to-amber-600'
        }`}>
          <h3 className="text-xl font-bold flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>{statCategories[category].title}</span>
          </h3>
          <p className="text-white/90 text-sm mt-1">Comparaison détaillée entre les deux équipes</p>
        </div>
        
        <div className="p-4 md:p-6">
          {Object.keys(statistics).length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Statistiques non disponibles</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {statCategories[category].stats.map((statKey) => {
                const homeValue = statistics.home?.[statKey] || '0'
                const awayValue = statistics.away?.[statKey] || '0'
                const label = statLabels[statKey] || statKey
                
                const homeNum = parseFloat(String(homeValue).replace('%', '')) || 0
                const awayNum = parseFloat(String(awayValue).replace('%', '')) || 0
                
                let homePercent, awayPercent
                
                if (statKey.includes('Percentage') || statKey.includes('%')) {
                  const total = Math.max(homeNum + awayNum, 100)
                  homePercent = (homeNum / total) * 100
                  awayPercent = (awayNum / total) * 100
                } else {
                  const total = homeNum + awayNum
                  homePercent = total > 0 ? (homeNum / total) * 100 : 50
                  awayPercent = total > 0 ? (awayNum / total) * 100 : 50
                }

                // Déterminer qui domine cette stat
                const homeDominates = homeNum > awayNum
                const isDraw = homeNum === awayNum

                return (
                  <div key={statKey} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    {/* Header avec les valeurs */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-center min-w-[60px]">
                        <span className={`text-lg md:text-xl font-bold ${
                          homeDominates && !isDraw ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {homeValue}
                        </span>
                        {homeDominates && !isDraw && (
                          <div className="text-xs text-blue-600 font-medium">👑</div>
                        )}
                      </div>
                      
                      <div className="text-center flex-1 px-4">
                        <span className="text-sm md:text-base font-semibold text-gray-700 block">
                          {label}
                        </span>
                        {isDraw && homeNum > 0 && (
                          <div className="text-xs text-purple-600 font-medium mt-1">🤝 Égalité</div>
                        )}
                      </div>
                      
                      <div className="text-center min-w-[60px]">
                        <span className={`text-lg md:text-xl font-bold ${
                          !homeDominates && !isDraw ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {awayValue}
                        </span>
                        {!homeDominates && !isDraw && (
                          <div className="text-xs text-red-600 font-medium">👑</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`transition-all duration-700 ${
                          homeDominates && !isDraw 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                            : 'bg-gradient-to-r from-blue-400 to-blue-500'
                        }`}
                        style={{ width: `${homePercent}%` }}
                      />
                      <div 
                        className={`transition-all duration-700 ${
                          !homeDominates && !isDraw 
                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                            : 'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${awayPercent}%` }}
                      />
                    </div>
                    
                    {/* Noms des équipes */}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <span>🏠</span>
                        <span className="font-medium">{homeTeam}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="font-medium">{awayTeam}</span>
                        <span>✈️</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Insights automatiques */}
      {Object.keys(statistics).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-purple-200">
          <h4 className="font-bold text-purple-900 mb-3 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>🧠 Analyse tactique</span>
          </h4>
          <div className="space-y-2 text-sm text-purple-800">
            {generateTacticalInsights(statistics, homeTeam, awayTeam, keyEvents)}
          </div>
        </div>
      )}
    </div>
  )
}

// 📊 Fonction pour générer des insights tactiques automatiques
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
  const homeShotsOnTarget = parseInt(statistics.home?.['Shots on Goal'] || '0')
  const awayShotsOnTarget = parseInt(statistics.away?.['Shots on Goal'] || '0')

  if (homeShots > awayShots + 5) {
    insights.push(`⚽ ${homeTeam} a tenté ${homeShots} tirs contre ${awayShots} - approche plus offensive`)
  }

  // Efficacité
  if (homeShotsOnTarget > 0 && homeShots > 0) {
    const homeEfficiency = Math.round((homeShotsOnTarget / homeShots) * 100)
    if (homeEfficiency > 50) {
      insights.push(`🎯 ${homeTeam} très précis : ${homeEfficiency}% de tirs cadrés`)
    }
  }

  // Analyse discipline
  const homeCards = parseInt(statistics.home?.['Yellow Cards'] || '0') + parseInt(statistics.home?.['Red Cards'] || '0')
  const awayCards = parseInt(statistics.away?.['Yellow Cards'] || '0') + parseInt(statistics.away?.['Red Cards'] || '0')
  
  if (homeCards > awayCards + 2) {
    insights.push(`🟨 ${homeTeam} a reçu plus de cartons (${homeCards} vs ${awayCards}) - match plus rugueux ?`)
  } else if (awayCards > homeCards + 2) {
    insights.push(`🟨 ${awayTeam} a été plus sanctionné (${awayCards} vs ${homeCards}) - intensité défensive`)
  }

  // Analyse événements
  if (keyEvents.redCards > 0) {
    insights.push(`🟥 ${keyEvents.redCards} exclusion${keyEvents.redCards > 1 ? 's' : ''} - match très tendu avec des moments chauds`)
  }

  if (keyEvents.goals > 4) {
    insights.push(`🔥 Match spectaculaire avec ${keyEvents.goals} buts - défenses perméables ou attaques efficaces ?`)
  } else if (keyEvents.goals === 0) {
    insights.push(`🛡️ Match défensif - gardiens impériaux ou manque d'efficacité offensive ?`)
  }

  // Si pas d'insights, en ajouter des génériques
  if (insights.length === 0) {
    insights.push(`⚽ Match équilibré entre ${homeTeam} et ${awayTeam}`)
    insights.push(`📊 Les statistiques montrent une rencontre disputée des deux côtés`)
  }

  return insights.map((insight, index) => (
    <div key={index} className="flex items-start space-x-2">
      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
      <span>{insight}</span>
    </div>
  ))
}