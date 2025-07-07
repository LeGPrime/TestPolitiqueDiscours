// pages/api/top-reviews.ts - VERSION SIMPLIFIÉE QUI MARCHE
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        period = 'all', 
        sport = 'all', 
        limit = '50' 
      } = req.query
      
      console.log('🏆 API Top Reviews appelée avec:', { period, sport, limit })

      // Construire le filtre de date simplement
      let dateFilter = {}
      const now = new Date()
      
      switch (period) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          dateFilter = { createdAt: { gte: weekAgo } }
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          dateFilter = { createdAt: { gte: monthAgo } }
          break
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          dateFilter = { createdAt: { gte: yearAgo } }
          break
        default: // 'all'
          break
      }

      // Construire le filtre de sport
      let matchFilter = {}
      if (sport !== 'all') {
        matchFilter = { sport: sport.toString().toUpperCase() }
      }

      console.log('🔍 Filtres appliqués:', { dateFilter, matchFilter })

      // Récupérer toutes les reviews avec commentaires (sans requête SQL complexe)
      const reviews = await prisma.rating.findMany({
        where: {
          comment: {
            not: null,
            not: ''
          },
          ...dateFilter,
          match: matchFilter
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          },
          match: {
            select: {
              id: true,
              sport: true,
              homeTeam: true,
              awayTeam: true,
              homeScore: true,
              awayScore: true,
              date: true,
              competition: true,
              venue: true,
              homeTeamLogo: true,
              awayTeamLogo: true
            }
          },
          likes: true, // Récupérer tous les likes
          _count: {
            select: { likes: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      console.log(`📊 ${reviews.length} reviews trouvées avec commentaires`)

      // Filtrer et trier par nombre de likes
      const reviewsWithLikes = reviews
        .filter(review => review._count.likes > 0) // Au moins 1 like
        .sort((a, b) => b._count.likes - a._count.likes) // Trier par likes desc
        .slice(0, parseInt(limit as string)) // Limiter les résultats

      console.log(`❤️ ${reviewsWithLikes.length} reviews avec des likes trouvées`)

      // Calculer les stats utilisateur de manière simple
      const userIds = [...new Set(reviewsWithLikes.map(r => r.user.id))]
      const userStatsMap = new Map()

      // Pour chaque utilisateur, calculer ses stats
      for (const userId of userIds) {
        const userRatings = await prisma.rating.findMany({
          where: { userId },
          select: { rating: true }
        })
        
        userStatsMap.set(userId, {
          totalReviews: userRatings.length,
          avgRating: userRatings.length > 0 
            ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length 
            : 0
        })
      }

      // Formater les données finales
      const formattedReviews = reviewsWithLikes.map((review: any) => {
        const userStats = userStatsMap.get(review.user.id) || { totalReviews: 0, avgRating: 0 }

        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          likes: review._count.likes,
          isLiked: false, // On ne peut pas déterminer sans session utilisateur
          user: {
            id: review.user.id,
            name: review.user.name,
            username: review.user.username,
            image: review.user.image,
            totalReviews: userStats.totalReviews,
            avgRating: userStats.avgRating
          },
          match: {
            id: review.match.id,
            sport: review.match.sport.toLowerCase(),
            homeTeam: review.match.homeTeam,
            awayTeam: review.match.awayTeam,
            homeScore: review.match.homeScore,
            awayScore: review.match.awayScore,
            date: review.match.date.toISOString(),
            competition: review.match.competition,
            venue: review.match.venue,
            homeTeamLogo: review.match.homeTeamLogo,
            awayTeamLogo: review.match.awayTeamLogo
          }
        }
      })

      // Calculer les statistiques globales simplement
      const totalReviews = reviews.length
      const totalLikes = reviews.reduce((sum, review) => sum + review._count.likes, 0)
      const activeUsers = new Set(reviews.map(r => r.user.id)).size

      const stats = {
        totalReviews,
        totalLikes,
        activeUsers
      }

      console.log('📈 Stats calculées:', stats)
      console.log('✅ Retour de', formattedReviews.length, 'reviews formatées')

      res.status(200).json({
        success: true,
        reviews: formattedReviews,
        stats,
        meta: {
          period,
          sport,
          total: formattedReviews.length,
          debug: {
            allReviews: reviews.length,
            withLikes: reviewsWithLikes.length,
            userConnected: false
          }
        }
      })

    } catch (error) {
      console.error('❌ Erreur top reviews:', error)
      res.status(500).json({ 
        error: 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}