// components/MatchReviews.tsx - VERSION AVEC MODAL DE PROFIL
import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Star, ThumbsUp, Clock, Users, Eye, EyeOff, Car,
  ChevronDown, ChevronUp, Info, MoreVertical, Flag } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import UserProfileModal from './UserProfileModal'

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  spoilerFree: boolean
  likes: number
  isLiked: boolean
  user: {
    id: string
    name: string
    username?: string
    image?: string
    totalReviews?: number
    avgRating?: number
  }
  replies?: Reply[]
}

interface Reply {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    username?: string
    image?: string
  }
  likes: number
  isLiked: boolean
}

interface MatchReviewsProps {
  matchId: string
  matchTitle: string
  currentUserId?: string
  userHasRated: boolean
}

export default function MatchReviews({ 
  matchId, 
  matchTitle, 
  currentUserId, 
  userHasRated 
}: MatchReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('popular')
  const [showSpoilers, setShowSpoilers] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  
  // États pour le modal de profil
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [matchId, sortBy])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/match-reviews?matchId=${matchId}&sort=${sortBy}`)
      setReviews(response.data.reviews || [])
    } catch (error) {
      console.error('Erreur chargement reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    if (userId === currentUserId) {
      // Si c'est notre propre profil, aller directement sur la page
      window.location.href = '/profile'
    } else {
      // Sinon, ouvrir le modal compact
      setSelectedUserId(userId)
      setShowProfileModal(true)
    }
  }

  const handleLike = async (reviewId: string, isReply: boolean = false) => {
    try {
      await axios.post('/api/match-reviews/like', {
        reviewId,
        isReply,
        matchId
      })
      
      // Update local state
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

  const handleReply = async (reviewId: string) => {
    if (!replyContent.trim()) return

    try {
      await axios.post('/api/match-reviews/reply', {
        reviewId,
        content: replyContent,
        matchId
      })
      
      setReplyContent('')
      setReplyingTo(null)
      fetchReviews() // Refresh to show new reply
    } catch (error) {
      console.error('Erreur réponse:', error)
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const reviewDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`
    return reviewDate.toLocaleDateString('fr-FR')
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400'
    if (rating >= 3.5) return 'text-blue-600 dark:text-blue-400'
    if (rating >= 2.5) return 'text-yellow-600 dark:text-yellow-400'
    if (rating >= 1.5) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSortButtonClass = (currentSort: string) => {
    return sortBy === currentSort 
      ? 'bg-blue-500 dark:bg-blue-600 text-white' 
      : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/6"></div>
                </div>
              </div>
              <div className="h-16 bg-gray-200 dark:bg-slate-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <MessageCircle className="w-6 h-6" />
              <span>Reviews & Commentaires</span>
            </h3>
            <div className="flex items-center space-x-2 text-sm">
              <Users className="w-4 h-4" />
              <span>{reviews.length} avis</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Trier par:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${getSortButtonClass('popular')}`}
                >
                  👍 Populaires
                </button>
                <button
                  onClick={() => setSortBy('recent')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${getSortButtonClass('recent')}`}
                >
                  🕒 Récents
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${getSortButtonClass('rating')}`}
                >
                  ⭐ Note
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSpoilers(!showSpoilers)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                showSpoilers 
                  ? 'bg-red-500 dark:bg-red-600 text-white' 
                  : 'bg-white/20 dark:bg-slate-700/50 text-white hover:bg-white/30 dark:hover:bg-slate-600/50'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{showSpoilers ? 'Masquer spoilers' : 'Afficher spoilers'}</span>
            </button>
          </div>
        </div>

        {/* Call to action si pas encore noté */}
        {!userHasRated && currentUserId && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Partagez votre avis !</h4>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm">Notez ce match pour rejoindre la conversation</p>
              </div>
              <button className="bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                ⭐ Noter
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Aucun commentaire pour le moment</h4>
              <p className="text-sm">Soyez le premier à partager votre avis sur ce match !</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={currentUserId}
                showSpoilers={showSpoilers}
                onLike={() => handleLike(review.id)}
                onReply={() => setReplyingTo(review.id)}
                isReplying={replyingTo === review.id}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={() => handleReply(review.id)}
                onCancelReply={() => {
                  setReplyingTo(null)
                  setReplyContent('')
                }}
                onUserClick={handleUserClick}
              />
            ))
          )}
        </div>

        {/* Footer stats */}
        {reviews.length > 0 && (
          <div className="bg-gray-50 dark:bg-slate-700 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>💬 {reviews.length} commentaires</span>
                <span>❤️ {reviews.reduce((acc, r) => acc + r.likes, 0)} likes</span>
              </div>
              <Link 
                href={`/match/${matchId}/reviews`}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Voir tous les avis →
              </Link>
            </div>
          </div>
        )}
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

// Composant pour une review individuelle avec clic sur profil
function ReviewCard({ 
  review, 
  currentUserId, 
  showSpoilers, 
  onLike, 
  onReply, 
  isReplying, 
  replyContent, 
  setReplyContent, 
  onSubmitReply, 
  onCancelReply,
  onUserClick
}: any) {
  const [showFullComment, setShowFullComment] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400'
    if (rating >= 3.5) return 'text-blue-600 dark:text-blue-400'
    if (rating >= 2.5) return 'text-yellow-600 dark:text-yellow-400'
    if (rating >= 1.5) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const reviewDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInHours < 168) return `Il y a ${Math.floor(diffInHours / 24)}j`
    return reviewDate.toLocaleDateString('fr-FR')
  }

  const shouldBlurSpoiler = review.spoilerFree === false && !showSpoilers

  return (
    <div className="p-6">
      {/* User info & rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar cliquable */}
          <button 
            onClick={() => onUserClick(review.user.id)}
            className="group relative"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
              {review.user.image ? (
                <img src={review.user.image} alt="" className="w-full h-full rounded-full" />
              ) : (
                review.user.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            
            {/* Tooltip hover */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Voir le profil
            </div>
          </button>
          
          <div>
            <div className="flex items-center space-x-2">
              {/* Nom cliquable */}
              <button 
                onClick={() => onUserClick(review.user.id)}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {review.user.name}
              </button>
              {review.user.totalReviews && review.user.totalReviews > 10 && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">
                  {review.user.totalReviews > 100 ? '💎' : '⭐'} Expert
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(review.createdAt)}</span>
              {!review.spoilerFree && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  ⚠️ Spoilers
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="text-right">
          <div className={`text-2xl font-bold ${getRatingColor(review.rating)}`}>
            {review.rating.toFixed(1)}
          </div>
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className={`mb-4 relative ${shouldBlurSpoiler ? 'filter blur-sm' : ''}`}>
        <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
          !showFullComment && review.comment.length > 300 ? 'line-clamp-4' : ''
        }`}>
          {review.comment}
        </p>
        
        {review.comment.length > 300 && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mt-2"
          >
            {showFullComment ? 'Voir moins' : 'Lire la suite...'}
          </button>
        )}
        
        {shouldBlurSpoiler && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-500 dark:bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              ⚠️ Contient des spoilers
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onLike}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
              review.isLiked 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${review.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{review.likes}</span>
          </button>

          {currentUserId && (
            <button
              onClick={onReply}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Répondre</span>
            </button>
          )}

          {review.replies && review.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              {showReplies ? 'Masquer' : 'Voir'} {review.replies.length} réponse{review.replies.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1 rounded">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="mt-4 pl-13 border-l-2 border-blue-200 dark:border-blue-700">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Écrivez votre réponse..."
            className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={3}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={onCancelReply}
              className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={onSubmitReply}
              disabled={!replyContent.trim()}
              className="px-4 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Répondre
            </button>
          </div>
        </div>
      )}

      {/* Replies avec avatars cliquables */}
      {showReplies && review.replies && review.replies.map((reply: any) => (
        <div key={reply.id} className="mt-4 pl-13 border-l-2 border-gray-100 dark:border-slate-700">
          <div className="flex items-start space-x-3">
            <button 
              onClick={() => onUserClick(reply.user.id)}
              className="group relative"
            >
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-105 transition-transform group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                {reply.user.image ? (
                  <img src={reply.user.image} alt="" className="w-full h-full rounded-full" />
                ) : (
                  reply.user.name?.[0]?.toUpperCase() || '?'
                )}
              </div>
              
              {/* Tooltip hover */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Voir le profil
              </div>
            </button>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <button
                  onClick={() => onUserClick(reply.user.id)}
                  className="font-medium text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {reply.user.name}
                </button>
                <span className="text-gray-500 dark:text-gray-400 text-xs">{getTimeAgo(reply.createdAt)}</span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
              
              <div className="flex items-center space-x-2 mt-2">
                <button
                  className={`flex items-center space-x-1 text-xs ${
                    reply.isLiked ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                  <span>{reply.likes}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}