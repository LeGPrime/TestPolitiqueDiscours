// components/FavoritesProfileSection.tsx - Section "Top 5 Matchs" dans le profil
import { useState, useEffect } from 'react'
import { Bookmark, Star, Trophy, Calendar, MapPin, Eye, ArrowRight } from 'lucide-react'
import { useFavorites } from './FavoriteButton'
import Link from 'next/link'

interface FavoritesProfileSectionProps {
  userId?: string
  isOwnProfile: boolean
}

export default function FavoritesProfileSection({ userId, isOwnProfile }: FavoritesProfileSectionProps) {
  const { favorites, loading, fetchFavorites } = useFavorites(userId)

  useEffect(() => {
    fetchFavorites()
  }, [userId])

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

  const formatScore = (homeScore: number | null, awayScore: number | null, sport: string) => {
    if (sport === 'F1') {
      return 'COURSE TERMINÉE'
    }
    if (sport === 'MMA') {
      return 'W - L'
    }
    return `${homeScore ?? '?'} - ${awayScore ?? '?'}`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {isOwnProfile ? 'Vos' : 'Ses'} Top 5 Matchs
              </h3>
              <p className="text-white/90 text-sm">
                Comme sur Letterboxd, mais pour le sport !
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              {favorites.counts.matches}/5
            </div>
            <div className="text-white/80 text-sm">
              {favorites.counts.matches >= 5 ? 'Complet !' : `${5 - favorites.counts.matches} restants`}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {favorites.matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-blue-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isOwnProfile ? 'Aucun match favori' : 'Aucun match favori partagé'}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {isOwnProfile 
                ? 'Ajoutez vos 5 matchs préférés pour créer votre collection personnelle !'
                : 'Cet utilisateur n\'a pas encore sélectionné ses matchs favoris.'
              }
            </p>
            {isOwnProfile && (
              <Link
                href="/"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold"
              >
                <Star className="w-4 h-4" />
                <span>Découvrir des matchs</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.matches.map((favorite, index) => (
              <FavoriteMatchCard
                key={favorite.id}
                favorite={favorite}
                rank={index + 1}
                isOwnProfile={isOwnProfile}
              />
            ))}
            
            {/* Slots vides pour montrer qu'on peut en ajouter plus */}
            {isOwnProfile && favorites.matches.length < 5 && (
              <div className="space-y-3">
                {Array.from({ length: 5 - favorites.matches.length }, (_, i) => (
                  <EmptyFavoriteSlot
                    key={`empty-${i}`}
                    rank={favorites.matches.length + i + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer avec stats si il y a des favoris */}
      {favorites.matches.length > 0 && (
        <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 border-t border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">
                Sports représentés:
              </span>
              <div className="flex space-x-1">
                {Array.from(new Set(favorites.matches.map(fav => fav.match.sport)))
                  .map(sport => (
                    <span key={sport} className="text-lg">
                      {getSportEmoji(sport)}
                    </span>
                  ))
                }
              </div>
            </div>
            
            <div className="text-gray-600 dark:text-gray-400">
              Ajouté{favorites.matches.length > 1 ? 's' : ''} entre{' '}
              {new Date(Math.min(...favorites.matches.map(fav => new Date(fav.addedAt).getTime()))).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}{' '}
              et{' '}
              {new Date(Math.max(...favorites.matches.map(fav => new Date(fav.addedAt).getTime()))).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour une carte de match favori
function FavoriteMatchCard({ favorite, rank, isOwnProfile }: {
  favorite: any
  rank: number
  isOwnProfile: boolean
}) {
  const { match } = favorite
  
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

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500'
      case 2: return 'from-gray-300 to-gray-400' 
      case 3: return 'from-orange-400 to-red-500'
      default: return 'from-blue-400 to-purple-500'
    }
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏆'
    }
  }

  return (
    <Link
      href={`/match/${match.id}`}
      className="block group hover:shadow-lg transition-all duration-300"
    >
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-xl p-4 border border-gray-200 dark:border-slate-600 group-hover:border-blue-300 dark:group-hover:border-blue-600">
        <div className="flex items-center space-x-4">
          {/* Rang */}
          <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(rank)} rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
            <span className="text-lg">{getRankEmoji(rank)}</span>
          </div>

          {/* Infos du match */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getSportEmoji(match.sport)}</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                {match.competition}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(match.date).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {/* Teams et score */}
            {match.sport === 'F1' ? (
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  🏁 {match.homeTeam}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📍 {match.awayTeam}
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {match.homeTeamLogo && (
                    <img src={match.homeTeamLogo} alt="" className="w-6 h-6 rounded" />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {match.homeTeam}
                  </span>
                </div>

                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {match.homeScore ?? '?'} - {match.awayScore ?? '?'}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {match.awayTeam}
                  </span>
                  {match.awayTeamLogo && (
                    <img src={match.awayTeamLogo} alt="" className="w-6 h-6 rounded" />
                  )}
                </div>
              </div>
            )}

            {match.venue && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {match.venue}
                </span>
              </div>
            )}
          </div>

          {/* Stats et indicateur */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {match.avgRating > 0 ? match.avgRating.toFixed(1) : '—'}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {match.totalRatings} vote{match.totalRatings > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
              <Eye className="w-4 h-4 mr-1" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Badge "Ajouté récemment" si c'est récent */}
        {new Date(favorite.addedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
          <div className="mt-2 inline-flex items-center space-x-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
            <span>✨ Ajouté récemment</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// Composant pour les slots vides
function EmptyFavoriteSlot({ rank }: { rank: number }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-slate-600">
      <div className="flex items-center space-x-4 opacity-50">
        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-xl flex items-center justify-center">
          <span className="text-gray-400 font-bold">#{rank}</span>
        </div>
        <div className="flex-1">
          <div className="text-gray-500 dark:text-gray-400">
            Emplacement libre pour votre {rank === 1 ? '1er' : rank === 2 ? '2ème' : rank === 3 ? '3ème' : `${rank}ème`} match favori
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Cliquez sur ⭐ sur un match pour l'ajouter ici
          </div>
        </div>
      </div>
    </div>
  )
}