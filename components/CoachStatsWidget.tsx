// components/CoachStatsWidget.tsx - Widget pour afficher les stats des coachs
import { useState, useEffect } from 'react'
import { UserCheck, TrendingUp, Award, Target, BarChart3 } from 'lucide-react'

interface CoachStatsWidgetProps {
  matchId: string
  homeCoach: string
  awayCoach: string
  homeTeam: string
  awayTeam: string
  playerRatings: any[]
  currentUserId?: string
}

export default function CoachStatsWidget({ 
  matchId, 
  homeCoach, 
  awayCoach, 
  homeTeam, 
  awayTeam, 
  playerRatings, 
  currentUserId 
}: CoachStatsWidgetProps) {
  const [coachStats, setCoachStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    processCoachStats()
  }, [playerRatings, matchId])

  const processCoachStats = () => {
    try {
      // Identifier les IDs des coachs
      const homeCoachId = `COACH_${homeCoach.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.]/g, '')}_${homeTeam.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`
      const awayCoachId = `COACH_${awayCoach.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\.]/g, '')}_${awayTeam.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`

      // Filtrer les notations des coachs
      const homeCoachRatings = playerRatings.filter(r => r.playerId === homeCoachId)
      const awayCoachRatings = playerRatings.filter(r => r.playerId === awayCoachId)

      // Calculer les stats
      const homeCoachAvg = homeCoachRatings.length > 0 
        ? homeCoachRatings.reduce((sum, r) => sum + r.rating, 0) / homeCoachRatings.length 
        : 0

      const awayCoachAvg = awayCoachRatings.length > 0 
        ? awayCoachRatings.reduce((sum, r) => sum + r.rating, 0) / awayCoachRatings.length 
        : 0

      // Notation de l'utilisateur actuel
      const userHomeRating = homeCoachRatings.find(r => r.userId === currentUserId)
      const userAwayRating = awayCoachRatings.find(r => r.userId === currentUserId)

      setCoachStats({
        home: {
          name: homeCoach,
          team: homeTeam,
          avgRating: homeCoachAvg,
          totalRatings: homeCoachRatings.length,
          userRating: userHomeRating,
          ratings: homeCoachRatings
        },
        away: {
          name: awayCoach,
          team: awayTeam,
          avgRating: awayCoachAvg,
          totalRatings: awayCoachRatings.length,
          userRating: userAwayRating,
          ratings: awayCoachRatings
        },
        comparison: {
          homeLeads: homeCoachAvg > awayCoachAvg,
          difference: Math.abs(homeCoachAvg - awayCoachAvg),
          totalVotes: homeCoachRatings.length + awayCoachRatings.length
        }
      })
    } catch (error) {
      console.error('Erreur traitement stats coachs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Comparaison visuelle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-lg font-bold">🏠</span>
              </div>
              <div className="font-bold text-gray-900 text-sm truncate">{home.name}</div>
              <div className="text-xs text-gray-600">{home.team}</div>
            </div>
            
            <div className="px-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">VS</div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
              </div>
            </div>
            
            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-lg font-bold">✈️</span>
              </div>
              <div className="font-bold text-gray-900 text-sm truncate">{away.name}</div>
              <div className="text-xs text-gray-600">{away.team}</div>
            </div>
          </div>

          {/* Barre de comparaison */}
          <div className="relative">
            <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`transition-all duration-700 ${
                  home.avgRating >= away.avgRating 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}
                style={{ 
                  width: `${home.totalRatings > 0 ? 
                    (home.avgRating / (home.avgRating + away.avgRating || 1)) * 100 : 50
                  }%` 
                }}
              />
              <div 
                className={`transition-all duration-700 ${
                  away.avgRating > home.avgRating 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ 
                  width: `${away.totalRatings > 0 ? 
                    (away.avgRating / (home.avgRating + away.avgRating || 1)) * 100 : 50
                  }%` 
                }}
              />
            </div>
            
            {/* Notes moyennes */}
            <div className="flex justify-between mt-2">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  home.avgRating >= away.avgRating ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {home.avgRating > 0 ? home.avgRating.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-gray-600">{home.totalRatings} vote{home.totalRatings > 1 ? 's' : ''}</div>
              </div>
              
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  away.avgRating > home.avgRating ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {away.avgRating > 0 ? away.avgRating.toFixed(1) : '—'}
                </div>
                <div className="text-xs text-gray-600">{away.totalRatings} vote{away.totalRatings > 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>

          {/* Indicateur du gagnant */}
          {comparison.totalVotes > 1 && comparison.difference > 0.5 && (
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold ${
                comparison.homeLeads 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <Trophy className="w-4 h-4" />
                <span>
                  {comparison.homeLeads ? home.name : away.name} mène tactiquement
                </span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                  +{comparison.difference.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{comparison.totalVotes}</div>
            <div className="text-xs text-gray-600">Total votes</div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-indigo-600">
              {comparison.totalVotes > 0 
                ? ((home.avgRating + away.avgRating) / 2).toFixed(1)
                : '—'
              }
            </div>
            <div className="text-xs text-gray-600">Moy. générale</div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.max(
                home.ratings.filter(r => r.rating >= 8).length,
                away.ratings.filter(r => r.rating >= 8).length
              )}
            </div>
            <div className="text-xs text-gray-600">Notes 8+</div>
          </div>
          
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-orange-600">
              {Math.max(
                home.ratings.filter(r => r.rating <= 4).length,
                away.ratings.filter(r => r.rating <= 4).length
              )}
            </div>
            <div className="text-xs text-gray-600">Notes 4-</div>
          </div>
        </div>

        {/* Vos notations */}
        {(home.userRating || away.userRating) && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h5 className="font-semibold text-yellow-800 mb-3 flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Vos évaluations tactiques</span>
            </h5>
            
            <div className="space-y-3">
              {home.userRating && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🏠</span>
                    <span className="font-medium text-yellow-800 text-sm">{home.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 text-sm font-bold">
                      ⭐ {home.userRating.rating}/10
                    </span>
                  </div>
                </div>
              )}
              
              {away.userRating && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✈️</span>
                    <span className="font-medium text-yellow-800 text-sm">{away.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 text-sm font-bold">
                      ⭐ {away.userRating.rating}/10
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analyse tactique */}
        {comparison.totalVotes > 2 && (
          <div className="mt-4 bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h5 className="font-semibold text-indigo-800 mb-2 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analyse tactique</span>
            </h5>
            
            <div className="text-sm text-indigo-700 space-y-1">
              {generateTacticalInsights(home, away, comparison)}
            </div>
          </div>
        )}

        {/* Commentaires récents */}
        {(home.ratings.some(r => r.comment) || away.ratings.some(r => r.comment)) && (
          <div className="mt-4">
            <h5 className="font-semibold text-gray-800 mb-3 text-sm">💭 Derniers commentaires</h5>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {[...home.ratings, ...away.ratings]
                .filter(r => r.comment && r.comment.trim())
                .slice(0, 3)
                .map((rating, index) => (
                  <div key={index} className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-900 text-xs">
                        {rating.user?.name || 'Anonyme'}
                      </span>
                      <span className="text-xs text-gray-600">
                        ⭐ {rating.rating}/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {rating.comment}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Fonction pour générer des insights tactiques automatiques
function generateTacticalInsights(home: any, away: any, comparison: any) {
  const insights = []
  
  // Analyse des notes
  if (comparison.difference > 1.5) {
    const leader = comparison.homeLeads ? home : away
    insights.push(
      <div key="dominance" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>
          <strong>{leader.name}</strong> domine tactiquement avec {leader.avgRating.toFixed(1)}/10
        </span>
      </div>
    )
  } else if (comparison.difference < 0.5) {
    insights.push(
      <div key="equilibrium" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>Équilibre tactique parfait entre les deux coachs</span>
      </div>
    )
  }

  // Analyse des votes élevés
  const homeHighRatings = home.ratings.filter(r => r.rating >= 8).length
  const awayHighRatings = away.ratings.filter(r => r.rating >= 8).length
  
  if (homeHighRatings > awayHighRatings + 1) {
    insights.push(
      <div key="home-excellence" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>
          {home.name} impressionne: {homeHighRatings} notes excellentes (8+)
        </span>
      </div>
    )
  } else if (awayHighRatings > homeHighRatings + 1) {
    insights.push(
      <div key="away-excellence" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>
          {away.name} brille: {awayHighRatings} notes excellentes (8+)
        </span>
      </div>
    )
  }

  // Analyse des votes faibles
  const homeLowRatings = home.ratings.filter(r => r.rating <= 4).length
  const awayLowRatings = away.ratings.filter(r => r.rating <= 4).length
  
  if (homeLowRatings > 0 && homeLowRatings > awayLowRatings) {
    insights.push(
      <div key="home-criticism" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>
          Choix tactiques de {home.name} critiqués: {homeLowRatings} note{homeLowRatings > 1 ? 's' : ''} faible{homeLowRatings > 1 ? 's' : ''}
        </span>
      </div>
    )
  } else if (awayLowRatings > 0 && awayLowRatings > homeLowRatings) {
    insights.push(
      <div key="away-criticism" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>
          Stratégie de {away.name} questionnée: {awayLowRatings} note{awayLowRatings > 1 ? 's' : ''} faible{awayLowRatings > 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  // Insight sur l'engagement
  if (comparison.totalVotes >= 10) {
    insights.push(
      <div key="engagement" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>
          Forte participation: {comparison.totalVotes} évaluations tactiques au total
        </span>
      </div>
    )
  }

  // Si pas d'insights, en ajouter des génériques
  if (insights.length === 0) {
    insights.push(
      <div key="general" className="flex items-start space-x-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
        <span>Les deux coachs livrent une bataille tactique intéressante</span>
      </div>
    )
  }

  return insights
}</div>
    )
  }

  if (!coachStats || coachStats.comparison.totalVotes === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-4 md:p-6 border border-purple-200">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-purple-600" />
          <span>👨‍💼 Bataille des coachs</span>
        </h4>
        
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-purple-800 font-medium mb-2">Aucune notation de coach encore</p>
          <p className="text-purple-600 text-sm">
            Soyez le premier à noter les performances tactiques !
          </p>
        </div>

        {/* Preview des coachs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-bold text-purple-800 text-sm truncate">{homeCoach}</div>
            <div className="text-xs text-purple-600">{homeTeam}</div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-2xl mb-2">✈️</div>
            <div className="font-bold text-purple-800 text-sm truncate">{awayCoach}</div>
            <div className="text-xs text-purple-600">{awayTeam}</div>
          </div>
        </div>
      </div>
    )
  }

  const { home, away, comparison } = coachStats

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg overflow-hidden border border-purple-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 md:p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold">👨‍💼 Bataille des coachs</h4>
            <p className="text-white/90 text-sm">Qui a été le plus stratégique ?</p>
          </div>
        </div>