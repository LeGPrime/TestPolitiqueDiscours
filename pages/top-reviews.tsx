// pages/top-reviews.tsx - VERSION AVEC MODAL DE PROFIL
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Head from 'next/head'
import {
  Trophy, Heart, Star, Clock, Users, TrendingUp, 
  Calendar, MapPin, Award, Crown, Medal, Target,
  Filter, RefreshCw, ExternalLink, MessageCircle,
  AlertCircle, ChevronDown, Eye, User
} from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import UserProfileModal from '../components/UserProfileModal'

interface TopReview {
  id: string
  rating: number
  comment: string
  createdAt: string
  likes: number
  isLiked: boolean
  user: {
    id: string
    name: string
    username?: string
    image?: string
    totalReviews: number
    avgRating: number
  }
  match: {
    id: string
    sport: string
    homeTeam: string
    awayTeam: string
    homeScore?: number
    awayScore?: number
    date: string
    competition: string
    venue: string
    homeTeamLogo?: string
    awayTeamLogo?: string
  }
}

export default function TopReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<TopReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [stats, setStats] = useState<any>(null)
  const [showMore, setShowMore] = useState(false)
  
  // États pour le modal de profil
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    fetchTopReviews()
  }, [filter, sportFilter])

  const fetchTopReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get('/api/top-reviews', {
        params: { period: filter, sport: sportFilter, limit: 50 }
      })
      
      if (response.data.success) {
        setReviews(response.data.reviews || [])
        setStats(response.data.stats || null)
      } else {
        setError('Erreur lors du chargement')
      }
    } catch (error: any) {
      console.error('Erreur:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    if (userId === session?.user?.id) {
      // Si c'est notre propre profil, aller directement sur la page
      window.location.href = '/profile'
    } else {
      // Sinon, ouvrir le modal compact
      setSelectedUserId(userId)
      setShowProfileModal(true)
    }
  }

  const handleLike = async (reviewId: string) => {
    if (!session?.user?.id) {
      alert('Connectez-vous pour liker !')
      return
    }

    try {
      await axios.post('/api/match-reviews/like', { reviewId })
      
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                isLiked: !review.isLiked,
                likes: review.isLiked ? review.likes - 1 : review.likes + 1
              }
            : review
        )
      )
    } catch (error) {
      console.error('Erreur like:', error)
    }
  }

  // Séparer le top 3 du reste
  const topThree = reviews.slice(0, 3)
  const restOfReviews = reviews.slice(3)
  const displayedReviews = showMore ? restOfReviews : restOfReviews.slice(0, 10)

  return (
    <>
      <Head>
        <title>Hall of Fame - SportRate</title>
        <meta name="description" content="Les commentaires sportifs les plus appréciés" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
        <Navbar activeTab="hall-of-fame" />

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
              🏆 Hall of Fame
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Les légendes du commentaire sportif
            </p>
          </div>

          {/* Filtres compacts */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
              {[
                { key: 'all', label: 'Tout' },
                { key: 'week', label: 'Semaine' },
                { key: 'month', label: 'Mois' },
                { key: 'year', label: 'Année' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filter === key
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tous les sports</option>
              <option value="football">⚽ Football</option>
              <option value="basketball">🏀 Basketball</option>
              <option value="f1">🏎️ F1</option>
              <option value="mma">🥊 MMA</option>
              <option value="rugby">🏉 Rugby</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Chargement...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 dark:text-red-300">{error}</p>
              <button
                onClick={fetchTopReviews}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Aucun commentaire trouvé</h3>
              <p className="text-gray-500 dark:text-gray-400">Soyez le premier à commenter et recevoir des likes !</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 🆕 PODIUM MOBILE ERGONOMIQUE */}
              {topThree.length > 0 && (
                <div className="relative mb-12">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🏆 Podium des légendes</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Les 3 commentaires les plus appréciés</p>
                  </div>
                  
                  {/* 🖥️ VERSION DESKTOP - Podium classique */}
                  <div className="hidden md:block">
                    <div className="flex items-end justify-center gap-6 max-w-6xl mx-auto">
                      {/* 2ème place - Gauche */}
                      {topThree[1] && (
                        <div className="flex flex-col items-center">
                          <div className="mb-4">
                            <DesktopPodiumCard 
                              review={topThree[1]} 
                              rank={2} 
                              onLike={() => handleLike(topThree[1].id)}
                              onUserClick={() => handleUserClick(topThree[1].user.id)}
                            />
                          </div>
                          <div className="w-64 h-32 bg-gradient-to-t from-gray-500 to-gray-300 rounded-t-2xl flex items-start justify-center pt-6 shadow-xl border-4 border-gray-400">
                            <div className="text-white font-black text-2xl drop-shadow-lg">🥈 2ème</div>
                          </div>
                          <div className="w-64 h-4 bg-gray-600"></div>
                        </div>
                      )}
                      
                      {/* 1ère place - Centre */}
                      {topThree[0] && (
                        <div className="flex flex-col items-center">
                          <div className="mb-4">
                            <DesktopPodiumCard 
                              review={topThree[0]} 
                              rank={1} 
                              onLike={() => handleLike(topThree[0].id)}
                              onUserClick={() => handleUserClick(topThree[0].user.id)}
                            />
                          </div>
                          <div className="w-64 h-40 bg-gradient-to-t from-yellow-600 to-yellow-300 rounded-t-2xl flex items-start justify-center pt-6 shadow-2xl border-4 border-yellow-500">
                            <div className="text-white font-black text-3xl drop-shadow-lg">🥇 1er</div>
                          </div>
                          <div className="w-64 h-4 bg-yellow-700"></div>
                        </div>
                      )}
                      
                      {/* 3ème place - Droite */}
                      {topThree[2] && (
                        <div className="flex flex-col items-center">
                          <div className="mb-4">
                            <DesktopPodiumCard 
                              review={topThree[2]} 
                              rank={3} 
                              onLike={() => handleLike(topThree[2].id)}
                              onUserClick={() => handleUserClick(topThree[2].user.id)}
                            />
                          </div>
                          <div className="w-64 h-24 bg-gradient-to-t from-orange-600 to-orange-300 rounded-t-2xl flex items-start justify-center pt-6 shadow-xl border-4 border-orange-500">
                            <div className="text-white font-black text-xl drop-shadow-lg">🥉 3ème</div>
                          </div>
                          <div className="w-64 h-4 bg-orange-700"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 📱 VERSION MOBILE ULTRA ERGONOMIQUE */}
                  <div className="md:hidden">
                    {/* Top 3 en format compact horizontal */}
                    <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 rounded-2xl p-4 shadow-2xl mb-6">
                      <div className="text-center text-white font-black text-lg mb-4">
                        🏆 TOP 3 LÉGENDES 🏆
                      </div>
                      
                      {/* Podium compact en ligne */}
                      <div className="flex items-end justify-center space-x-2 mb-4">
                        {/* 2ème place */}
                        {topThree[1] && (
                          <div className="flex flex-col items-center flex-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-black text-lg border-4 border-white shadow-lg mb-2">
                              🥈
                            </div>
                            <div className="w-full h-12 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg flex items-center justify-center text-white font-bold text-xs">
                              2ème
                            </div>
                            <div className="w-full h-1 bg-gray-700"></div>
                          </div>
                        )}
                        
                        {/* 1ère place (plus haute) */}
                        {topThree[0] && (
                          <div className="flex flex-col items-center flex-1">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-black text-xl border-4 border-white shadow-xl mb-2">
                              🥇
                            </div>
                            <div className="w-full h-16 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg flex items-center justify-center text-white font-bold text-sm">
                              1er
                            </div>
                            <div className="w-full h-1 bg-yellow-700"></div>
                          </div>
                        )}
                        
                        {/* 3ème place */}
                        {topThree[2] && (
                          <div className="flex flex-col items-center flex-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-black text-lg border-4 border-white shadow-lg mb-2">
                              🥉
                            </div>
                            <div className="w-full h-8 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg flex items-center justify-center text-white font-bold text-xs">
                              3ème
                            </div>
                            <div className="w-full h-1 bg-orange-700"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cartes compactes du TOP 3 pour mobile */}
                    <div className="space-y-3">
                      {topThree.map((review, index) => (
                        <MobilePodiumCard
                          key={review.id}
                          review={review}
                          rank={index + 1}
                          onLike={() => handleLike(review.id)}
                          onUserClick={() => handleUserClick(review.user.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reste du classement */}
              {restOfReviews.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                    📋 Classement complet
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedReviews.map((review, index) => (
                      <CompactReviewCard
                        key={review.id}
                        review={review}
                        rank={index + 4}
                        onLike={() => handleLike(review.id)}
                        onUserClick={() => handleUserClick(review.user.id)}
                      />
                    ))}
                  </div>

                  {/* Bouton voir plus */}
                  {restOfReviews.length > 10 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setShowMore(!showMore)}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-600"
                      >
                        <span>{showMore ? 'Voir moins' : `Voir ${restOfReviews.length - 10} autres`}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Stats en bas */}
              {stats && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center mt-12">
                  <h3 className="text-lg font-bold mb-4">📊 Statistiques de la communauté</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{stats.totalReviews}</div>
                      <div className="text-blue-100 text-sm">Commentaires</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.totalLikes}</div>
                      <div className="text-blue-100 text-sm">Likes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.activeUsers}</div>
                      <div className="text-blue-100 text-sm">Utilisateurs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spacer pour mobile */}
        <div className="h-20 md:hidden"></div>
      </div>

      {/* Modal de profil */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId || ''}
      />
    </>
  )
}

// 🆕 NOUVELLE CARTE MOBILE ULTRA COMPACTE POUR LE TOP 3 AVEC CLIC PROFIL
function MobilePodiumCard({ review, rank, onLike, onUserClick }: { review: TopReview, rank: number, onLike: () => void, onUserClick: () => void }) {
  const getSportEmoji = (sport: string) => {
    const emojis = { 'football': '⚽', 'basketball': '🏀', 'mma': '🥊', 'rugby': '🏉', 'f1': '🏎️' }
    return emojis[sport?.toLowerCase() as keyof typeof emojis] || '🏆'
  }

  const getTimeAgo = (date: string) => {
    const diffInDays = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays === 0) return 'Aujourd\'hui'
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `${diffInDays}j`
    return `${Math.floor(diffInDays / 7)}sem`
  }

  const rankColors = {
    1: 'from-yellow-400 to-yellow-600',
    2: 'from-gray-400 to-gray-600', 
    3: 'from-orange-400 to-orange-600'
  }

  const rankEmojis = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4 transition-all duration-300 hover:shadow-xl">
      
      {/* Header compact avec médaille */}
      <div className="flex items-center space-x-3 mb-3">
        {/* Badge médaille */}
        <div className={`w-12 h-12 bg-gradient-to-br ${rankColors[rank as keyof typeof rankColors]} rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-700`}>
          <span className="text-xl">{rankEmojis[rank as keyof typeof rankEmojis]}</span>
        </div>
        
        {/* User info compact - CLIQUABLE */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {/* Avatar cliquable */}
            <button 
              onClick={onUserClick}
              className="group relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:scale-105 transition-transform group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                {review.user.image ? (
                  <img src={review.user.image} alt="" className="w-full h-full rounded-full" />
                ) : (
                  review.user.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              
              {/* Tooltip hover */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Voir le profil
              </div>
            </button>

            <div className="flex-1 min-w-0">
              {/* Nom cliquable */}
              <button
                onClick={onUserClick}
                className="font-bold text-gray-900 dark:text-white text-sm truncate block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {review.user.name}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {review.user.totalReviews} reviews
              </div>
            </div>
          </div>
        </div>
        
        {/* Likes prominents */}
        <div className="text-right">
          <div className="flex items-center space-x-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full shadow-md">
            <Heart className="w-4 h-4 fill-current" />
            <span className="font-black text-sm">{review.likes}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">likes</div>
        </div>
      </div>

      {/* Match info très compact */}
      <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-sm">{getSportEmoji(review.match.sport)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {review.match.sport === 'f1' ? review.match.homeTeam : `${review.match.homeTeam} vs ${review.match.awayTeam}`}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-1">
            <span className="truncate">{review.match.competition}</span>
            <span>•</span>
            <span>{getTimeAgo(review.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment très compact */}
      <div className="mb-3">
        <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 border-l-4 border-blue-400">
          <blockquote className="text-sm text-gray-700 dark:text-gray-200 italic line-clamp-2">
            "{review.comment}"
          </blockquote>
        </div>
      </div>

      {/* Actions compactes */}
      <div className="flex items-center justify-between">
        <button
          onClick={onLike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            review.isLiked 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${review.isLiked ? 'fill-current' : ''}`} />
          <span>{review.likes}</span>
        </button>
        
        <Link
          href={`/match/${review.match.id}`}
          className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          <Eye className="w-4 h-4" />
          <span>Voir</span>
        </Link>
      </div>
    </div>
  )
}

// Carte desktop pour le podium avec clic profil
function DesktopPodiumCard({ review, rank, onLike, onUserClick }: { review: TopReview, rank: number, onLike: () => void, onUserClick: () => void }) {
  const getSportEmoji = (sport: string) => {
    const emojis = { 'football': '⚽', 'basketball': '🏀', 'mma': '🥊', 'rugby': '🏉', 'f1': '🏎️' }
    return emojis[sport?.toLowerCase() as keyof typeof emojis] || '🏆'
  }

  const getTimeAgo = (date: string) => {
    const diffInDays = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays === 0) return 'Aujourd\'hui'
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `${diffInDays}j`
    return `${Math.floor(diffInDays / 7)}sem`
  }

  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'

  return (
    <div className="w-64 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-600 overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
      {/* Header avec médaille */}
      <div className={`relative px-4 py-4 ${
        rank === 1 ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400' :
        rank === 2 ? 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-400' :
        'bg-gradient-to-r from-orange-400 via-orange-500 to-red-400'
      } text-white overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 translate-x-full animate-pulse"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl animate-bounce">{medalEmoji}</span>
            <div>
              <div className="font-black text-lg">{rank === 1 ? '1ère' : rank === 2 ? '2ème' : '3ème'}</div>
              <div className="text-xs opacity-90">place</div>
            </div>
          </div>
          
          <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-red-300 fill-current animate-pulse" />
              <span className="text-xl font-black">{review.likes}</span>
            </div>
            <div className="text-xs opacity-90">likes</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* User - CLIQUABLE */}
        <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div className="relative">
            {/* Avatar cliquable */}
            <button 
              onClick={onUserClick}
              className="group relative"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-slate-700 hover:scale-105 transition-transform group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                {review.user.image ? (
                  <img src={review.user.image} alt="" className="w-full h-full rounded-full" />
                ) : (
                  review.user.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              
              {/* Tooltip hover */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Voir le profil
              </div>
            </button>

            {review.user.totalReviews > 10 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white fill-current" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Nom cliquable */}
            <button
              onClick={onUserClick}
              className="font-bold text-gray-900 dark:text-white text-sm block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {review.user.name}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <span>{review.user.totalReviews} reviews</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span>{review.user.avgRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Match info */}
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-3 border border-blue-100 dark:border-slate-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md">
              <span className="text-lg">{getSportEmoji(review.match.sport)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">
                {review.match.sport === 'f1' ? review.match.homeTeam : `${review.match.homeTeam} vs ${review.match.awayTeam}`}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {review.match.competition} • {getTimeAgo(review.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Comment */}
        <div className="relative">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border-l-4 border-blue-400">
            <div className="absolute top-2 left-2 text-blue-400 opacity-50">
              <MessageCircle className="w-4 h-4" />
            </div>
            <blockquote className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium italic pl-6">
              "{review.comment}"
            </blockquote>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-all duration-200 ${
                    i < review.rating 
                      ? 'text-yellow-400 fill-current transform scale-110' 
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="font-black text-lg text-yellow-600 dark:text-yellow-400">
              {review.rating}/5
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onLike}
            className={`group flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
              review.isLiked 
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 transition-all group-hover:scale-110 ${
              review.isLiked ? 'fill-current animate-pulse' : 'group-hover:fill-current'
            }`} />
            <span className="font-bold">{review.likes}</span>
          </button>
          
          <Link
            href={`/match/${review.match.id}`}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm font-bold"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Voir le match</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Composant pour les cartes compactes du classement avec clic profil
function CompactReviewCard({ review, rank, onLike, onUserClick }: { review: TopReview, rank: number, onLike: () => void, onUserClick: () => void }) {
  const getSportEmoji = (sport: string) => {
    const emojis = { 'football': '⚽', 'basketball': '🏀', 'mma': '🥊', 'rugby': '🏉', 'f1': '🏎️' }
    return emojis[sport?.toLowerCase() as keyof typeof emojis] || '🏆'
  }

  const getTimeAgo = (date: string) => {
    const diffInDays = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays === 0) return 'Aujourd\'hui'
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `${diffInDays}j`
    return `${Math.floor(diffInDays / 7)}sem`
  }

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      
      {/* Header avec rang et like count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Badge de rang */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg">
              #{rank}
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
          
          {/* User info - CLIQUABLE */}
          <div className="flex items-center space-x-2">
            {/* Avatar cliquable */}
            <button 
              onClick={onUserClick}
              className="group relative"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-blue-200 hover:scale-105 transition-transform group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                {review.user.image ? (
                  <img src={review.user.image} alt="" className="w-full h-full rounded-full" />
                ) : (
                  review.user.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              
              {/* Tooltip hover */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Voir le profil
              </div>
            </button>

            <div>
              {/* Nom cliquable */}
              <button
                onClick={onUserClick}
                className="font-bold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {review.user.name}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {review.user.totalReviews} reviews
              </div>
            </div>
          </div>
        </div>

        {/* Likes prominents */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Like badge */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
            <Heart className="w-4 h-4 fill-current" />
            <span className="font-black text-sm">{review.likes}</span>
          </div>
        </div>
      </div>

      {/* Match info */}
      <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-lg border border-blue-100 dark:border-slate-500">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
            <span className="text-sm">{getSportEmoji(review.match.sport)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 dark:text-white truncate">
              {review.match.sport === 'f1' ? review.match.homeTeam : `${review.match.homeTeam} vs ${review.match.awayTeam}`}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center space-x-2">
              <span>{review.match.competition}</span>
              <span>•</span>
              <span>{getTimeAgo(review.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-600 rounded-lg p-3 border-l-4 border-blue-400 relative">
          <div className="absolute top-2 left-2 text-blue-400 opacity-30">
            <MessageCircle className="w-3 h-3" />
          </div>
          <blockquote className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium italic pl-5">
            "{review.comment}"
          </blockquote>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-600">
        <button
          onClick={onLike}
          className={`group flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
            review.isLiked 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md' 
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 transition-all group-hover:scale-110 ${
            review.isLiked ? 'fill-current animate-pulse' : 'group-hover:fill-current'
          }`} />
          <span className="font-bold text-sm">{review.likes}</span>
        </button>
        
        <Link
          href={`/match/${review.match.id}`}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md text-sm font-bold group"
        >
          <span>Voir le match</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}