// components/UserStats.tsx
import { Star, Trophy, TrendingUp, Activity, Target, Calendar, Heart, Users } from 'lucide-react'

interface UserStatsProps {
  stats: {
    totalRatings: number
    avgRating: number
    totalFriends: number
    favoriteCompetition?: string
    recentActivity: number
    ratingDistribution: Array<{
      rating: number
      count: number
      percentage: number
    }>
    totalTeamsFollowed: number
    favoriteSports?: Array<{
      sport: string
      count: number
    }>
  }
  isOwnProfile: boolean
}

export default function UserStats({ stats, isOwnProfile }: UserStatsProps) {
  const getSportEmoji = (sport: string) => {
    const emojis = {
      football: '⚽',
      basketball: '🏀',
      mma: '🥊',
      rugby: '🏉',
      f1: '🏎️'
    }
    return emojis[sport.toLowerCase() as keyof typeof emojis] || '🏆'
  }

  const getGradeFromRating = (rating: number) => {
    if (rating >= 4.5) return { grade: 'S', color: 'text-purple-600', bg: 'bg-purple-100' }
    if (rating >= 4.0) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100' }
    if (rating >= 3.5) return { grade: 'A', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (rating >= 3.0) return { grade: 'B+', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (rating >= 2.5) return { grade: 'B', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { grade: 'C', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const grade = getGradeFromRating(stats.avgRating)

  return (
    <div className="space-y-8">
      {/* Vue d'ensemble rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
          <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">{stats.totalRatings}</div>
          <div className="text-sm text-blue-600">Notes données</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200">
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${grade.bg} mb-2`}>
            <span className={`text-sm font-bold ${grade.color}`}>{grade.grade}</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          </div>
          <div className="text-sm text-yellow-600">Note moyenne</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
          <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-700">{stats.totalFriends}</div>
          <div className="text-sm text-green-600">Amis</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
          <Heart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-700">{stats.totalTeamsFollowed}</div>
          <div className="text-sm text-purple-600">Équipes suivies</div>
        </div>
      </div>

      {/* Répartition des notes avec design moderne */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-500" />
          <span>Répartition des notes</span>
        </h3>
        
        {stats.ratingDistribution.length > 0 ? (
          <div className="space-y-4">
            {stats.ratingDistribution.reverse().map((dist) => (
              <div key={dist.rating} className="flex items-center space-x-4">
                {/* Étoiles */}
                <div className="flex items-center space-x-1 w-24">
                  {Array.from({ length: dist.rating }, (_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">{dist.rating}</span>
                </div>
                
                {/* Barre de progression */}
                <div className="flex-1 relative">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${
                        dist.rating === 5 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        dist.rating === 4 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        dist.rating === 3 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        dist.rating === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                        'bg-gradient-to-r from-red-400 to-pink-500'
                      }`}
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  
                  {/* Pourcentage flottant */}
                  {dist.percentage > 5 && (
                    <div 
                      className="absolute top-0 text-xs text-white font-medium transform -translate-y-1"
                      style={{ left: `${Math.max(dist.percentage - 5, 0)}%` }}
                    >
                      {dist.percentage.toFixed(1)}%
                    </div>
                  )}
                </div>
                
                {/* Nombre */}
                <div className="text-sm text-gray-600 w-16 text-right font-medium">
                  {dist.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Pas assez de données pour afficher les statistiques</p>
          </div>
        )}
      </div>

      {/* Sports préférés */}
      {stats.favoriteSports && stats.favoriteSports.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span>Sports préférés</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.favoriteSports.map((sportStat, index) => (
              <div 
                key={sportStat.sport}
                className={`text-center p-4 rounded-xl border-2 ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' :
                  index === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' :
                  'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
                }`}
              >
                <div className="text-3xl mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="text-2xl mb-1">
                  {getSportEmoji(sportStat.sport)}
                </div>
                <div className="font-semibold text-gray-900 capitalize">
                  {sportStat.sport}
                </div>
                <div className="text-sm text-gray-600">
                  {sportStat.count} équipe{sportStat.count > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compétition préférée */}
      {stats.favoriteCompetition && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                Compétition préférée
              </h3>
              <div className="text-2xl font-bold text-yellow-800">
                {stats.favoriteCompetition}
              </div>
              <div className="text-sm text-yellow-700">
                {isOwnProfile ? 'Votre' : 'Sa'} compétition la plus notée
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activité récente */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-1">
              Activité récente
            </h3>
            <div className="text-2xl font-bold text-purple-800">
              {stats.recentActivity} notes
            </div>
            <div className="text-sm text-purple-700 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Ces 6 derniers mois
            </div>
          </div>
          
          {/* Indicateur d'activité */}
          <div className="flex-1 text-right">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              stats.recentActivity >= 20 ? 'bg-green-100 text-green-700' :
              stats.recentActivity >= 10 ? 'bg-yellow-100 text-yellow-700' :
              stats.recentActivity >= 5 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                stats.recentActivity >= 20 ? 'bg-green-500' :
                stats.recentActivity >= 10 ? 'bg-yellow-500' :
                stats.recentActivity >= 5 ? 'bg-orange-500' :
                'bg-gray-500'
              }`} />
              <span>
                {stats.recentActivity >= 20 ? 'Très actif' :
                 stats.recentActivity >= 10 ? 'Actif' :
                 stats.recentActivity >= 5 ? 'Modéré' :
                 'Peu actif'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}