// components/RugbyMatchDetails.tsx - INTERFACE RUGBY
import { useState, useEffect } from 'react'
import { 
  Users, Trophy, Target, Star, ChevronLeft, ChevronRight,
  Clock, MapPin, Flag, Shield, Zap, Crown, Award, TrendingUp
} from 'lucide-react'

interface RugbyMatchDetailsProps {
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
      competition: string
      details?: any
    }
    events: Array<{
      minute: number
      type: string
      team: string
      player: string
      detail?: string
      points?: number
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

export default function RugbyMatchDetails({ 
  matchDetails, 
  playerRatings = [], 
  onRatePlayer, 
  currentUserId 
}: RugbyMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'lineups' | 'stats' | 'timeline'>('overview')
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home')

  const { match, events, lineups, statistics } = matchDetails

  // Analyser les événements rugby
  const tries = events.filter(e => e.type === 'TRY' || e.type === 'try')
  const penalties = events.filter(e => e.type === 'PENALTY' || e.type === 'penalty')
  const cards = events.filter(e => e.type === 'CARD' || e.type === 'card')
  const conversions = events.filter(e => e.type === 'CONVERSION' || e.type === 'conversion')

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Rugby avec résumé du match */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-4 md:p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              🏉
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Match de Rugby</h2>
              <p className="text-green-100 text-sm">{match.competition}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl md:text-4xl font-black">
              {match.homeScore} - {match.awayScore}
            </div>
            <div className="text-green-100 text-sm">Score final</div>
          </div>
        </div>

        {/* Infos du match */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(match.date).toLocaleDateString('fr-FR')}</span>
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
        </div>
      </div>

      {/* Navigation des onglets Rugby */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 p-2 min-w-full md:min-w-0 md:justify-center">
            {[
              { 
                id: 'overview', 
                label: 'Vue d\'ensemble', 
                icon: Trophy, 
                shortLabel: 'Résumé',
                color: 'green'
              },
              { 
                id: 'lineups', 
                label: 'Équipes', 
                icon: Users, 
                shortLabel: 'XV',
                color: 'blue'
              },
              { 
                id: 'stats', 
                label: 'Statistiques', 
                icon: TrendingUp, 
                shortLabel: 'Stats',
                color: 'purple'
              },
              { 
                id: 'timeline', 
                label: 'Chronologie', 
                icon: Clock, 
                shortLabel: 'Events',
                color: 'orange'
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
                          tab.color === 'green' ? 'from-green-500 to-green-600' :
                          tab.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          tab.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          'from-orange-500 to-orange-600'
                        } text-white shadow-lg scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  <div className="text-center">
                    <div className="font-bold text-xs md:text-sm">
                      {window.innerWidth < 768 ? tab.shortLabel : tab.label}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="min-h-[60vh]">
        {/* VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <RugbyOverviewTab 
            match={match}
            tries={tries}
            penalties={penalties}
            cards={cards}
            conversions={conversions}
          />
        )}
        
        {/* ÉQUIPES & COMPOSITIONS */}
        {activeTab === 'lineups' && (
          <RugbyLineupsTab 
            lineups={lineups}
            match={match}
            playerRatings={playerRatings}
            onRatePlayer={onRatePlayer}
            currentUserId={currentUserId}
          />
        )}
        
        {/* STATISTIQUES */}
        {activeTab === 'stats' && (
          <RugbyStatsTab 
            statistics={statistics}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            events={{ tries, penalties, cards, conversions }}
          />
        )}
        
        {/* CHRONOLOGIE */}
        {activeTab === 'timeline' && (
          <RugbyTimelineTab 
            events={events}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
          />
        )}
      </div>
    </div>
  )
}

// 🏉 COMPOSANT VUE D'ENSEMBLE RUGBY
function RugbyOverviewTab({ match, tries, penalties, cards, conversions }: any) {
  return (
    <div className="space-y-6">
      {/* Résumé rapide du match */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{tries.length}</div>
          <div className="text-xs md:text-sm font-medium text-green-700">🏉 Essais</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{penalties.length}</div>
          <div className="text-xs md:text-sm font-medium text-blue-700">🎯 Pénalités</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-4 border border-yellow-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-amber-600 mb-1">{cards.length}</div>
          <div className="text-xs md:text-sm font-medium text-amber-700">🟨🟥 Cartons</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 text-center">
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{conversions.length}</div>
          <div className="text-xs md:text-sm font-medium text-purple-700">⚽ Transformations</div>
        </div>
      </div>

      {/* Détails du match */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-green-600" />
          <span>🏉 Détails du match</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Infos générales */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Compétition</span>
              <span className="font-medium text-gray-900">{match.competition}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Date & Heure</span>
              <span className="font-medium text-gray-900">
                {new Date(match.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Stade</span>
              <span className="font-medium text-gray-900">{match.venue}</span>
            </div>
            {match.referee && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Arbitre</span>
                <span className="font-medium text-gray-900">{match.referee}</span>
              </div>
            )}
          </div>

          {/* Score détaillé */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h4 className="font-bold text-green-800 mb-4 text-center">🏆 Score Final</h4>
            
            <div className="space-y-4">
              {/* Équipe domicile */}
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    🏠
                  </div>
                  <span className="font-bold text-gray-900">{match.homeTeam}</span>
                </div>
                <div className="text-3xl font-black text-green-600">{match.homeScore}</div>
              </div>
              
              {/* Équipe extérieure */}
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    ✈️
                  </div>
                  <span className="font-bold text-gray-900">{match.awayTeam}</span>
                </div>
                <div className="text-3xl font-black text-red-600">{match.awayScore}</div>
              </div>
            </div>
            
            {/* Écart */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 bg-white/80 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-600">Écart:</span>
                <span className="font-bold text-gray-900">
                  {Math.abs(match.homeScore - match.awayScore)} point{Math.abs(match.homeScore - match.awayScore) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Temps forts du match */}
      {(tries.length > 0 || penalties.length > 0) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <span>⭐ Temps forts</span>
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Essais */}
            {tries.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center space-x-2">
                  <span>🏉</span>
                  <span>Essais ({tries.length})</span>
                </h4>
                <div className="space-y-3">
                  {tries.slice(0, 3).map((tryEvent: any, index: number) => (
                    <div key={index} className="bg-white/60 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-green-700">{tryEvent.player}</span>
                        <span className="text-sm text-green-600">{tryEvent.minute}'</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-green-600">({tryEvent.team})</span>
                        {tryEvent.points && (
                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                            +{tryEvent.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {tries.length > 3 && (
                    <div className="text-center text-green-600 text-sm">
                      ... et {tries.length - 3} autre{tries.length - 3 > 1 ? 's' : ''} essai{tries.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pénalités */}
            {penalties.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Pénalités ({penalties.length})</span>
                </h4>
                <div className="space-y-3">
                  {penalties.slice(0, 3).map((penalty: any, index: number) => (
                    <div key={index} className="bg-white/60 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-blue-700">{penalty.player}</span>
                        <span className="text-sm text-blue-600">{penalty.minute}'</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-blue-600">({penalty.team})</span>
                        {penalty.points && (
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                            +{penalty.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {penalties.length > 3 && (
                    <div className="text-center text-blue-600 text-sm">
                      ... et {penalties.length - 3} autre{penalties.length - 3 > 1 ? 's' : ''} pénalité{penalties.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note d'information rugby */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
            🏉
          </div>
          <div>
            <h4 className="font-bold text-green-800">Interface Rugby</h4>
            <p className="text-green-600 text-sm">
              Notez les joueurs, l'arbitrage et la qualité générale de ce match de rugby !
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 🏉 COMPOSANT ÉQUIPES RUGBY
function RugbyLineupsTab({ lineups, match, playerRatings, onRatePlayer, currentUserId }: any) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home')

  return (
    <div className="space-y-6">
      {/* Sélecteur d'équipe */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1 shadow-inner">
          <button
            onClick={() => setSelectedTeam('home')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl transition-all duration-300 ${
              selectedTeam === 'home'
                ? 'bg-white text-green-600 shadow-lg font-bold'
                : 'text-gray-600'
            }`}
          >
            <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full"></div>
            <span className="text-sm md:text-base font-semibold">{match.homeTeam}</span>
          </button>
          <button
            onClick={() => setSelectedTeam('away')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-3 rounded-xl transition-all duration-300 ${
              selectedTeam === 'away'
                ? 'bg-white text-red-600 shadow-lg font-bold'
                : 'text-gray-600'
            }`}
          >
            <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full"></div>
            <span className="text-sm md:text-base font-semibold">{match.awayTeam}</span>
          </button>
        </div>
      </div>

      {/* Note d'information */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
            ℹ️
          </div>
          <div>
            <h4 className="font-bold text-yellow-800">Compositions Rugby</h4>
            <p className="text-yellow-700 text-sm">
              Les compositions détaillées seront bientôt disponibles. En attendant, vous pouvez noter le match général !
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder pour les compositions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Compositions {selectedTeam === 'home' ? match.homeTeam : match.awayTeam}
        </h3>
        <p className="text-gray-600 mb-4">
          L'affichage détaillé des XV de départ et remplaçants sera bientôt disponible
        </p>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            🚧 En développement : Formations rugby, postes (piliers, talonneurs, etc.), remplacements
          </p>
        </div>
      </div>
    </div>
  )
}

// 🏉 COMPOSANT STATISTIQUES RUGBY
function RugbyStatsTab({ statistics, homeTeam, awayTeam, events }: any) {
  return (
    <div className="space-y-6">
      {/* Résumé des événements */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-6 h-6" />
          <span>📊 Statistiques du match</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{events.tries.length}</div>
            <div className="text-sm text-gray-600">🏉 Essais</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{events.penalties.length}</div>
            <div className="text-sm text-gray-600">🎯 Pénalités</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{events.conversions.length}</div>
            <div className="text-sm text-gray-600">⚽ Transformations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{events.cards.length}</div>
            <div className="text-sm text-gray-600">🟨🟥 Cartons</div>
          </div>
        </div>
      </div>

      {/* Placeholder pour stats détaillées */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-10 h-10 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Statistiques détaillées
        </h3>
        <p className="text-gray-600 mb-4">
          Possession, mêlées gagnées, touches, pénalités concédées...
        </p>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-800 text-sm">
            🚧 En développement : Stats complètes rugby (possession, mêlées, touches, plaquages, etc.)
          </p>
        </div>
      </div>
    </div>
  )
}

// 🏉 COMPOSANT CHRONOLOGIE RUGBY
function RugbyTimelineTab({ events, homeTeam, awayTeam }: any) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Clock className="w-6 h-6 text-orange-600" />
          <span>⏱️ Chronologie du match</span>
        </h3>
        <p className="text-gray-600 text-sm mt-2">
          Tous les événements importants du match minute par minute
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center border border-gray-100">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun événement disponible</h3>
          <p className="text-gray-600">
            Les détails des événements du match seront affichés ici
          </p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="space-y-4">
            {events.map((event: any, index: number) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {event.minute}'
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-900">{event.player}</span>
                    <span className="text-sm bg-gray-200 px-2 py-1 rounded">{event.team}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {event.type === 'TRY' && '🏉 Essai'}
                    {event.type === 'PENALTY' && '🎯 Pénalité'}
                    {event.type === 'CONVERSION' && '⚽ Transformation'}
                    {event.type === 'CARD' && '🟨 Carton'}
                    {event.detail && ` - ${event.detail}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}