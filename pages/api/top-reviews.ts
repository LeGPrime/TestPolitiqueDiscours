// pages/api/top-reviews.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        period = 'all', 
        sport = 'all', 
        limit = '50' 
      } = req.query
      
      const session = await getServerSession(req, res, authOptions)

      // Construire le filtre de date
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

      // Seuil minimum de likes pour apparaître dans le Hall of Fame
      const MIN_LIKES_THRESHOLD = 3 // 🆕 Minimum 3 likes pour être visible

      // Récupérer les reviews avec le plus de likes
      const topReviews = await prisma.rating.findMany({
        where: {
          comment: {
            not: null,
            not: ''
          },
          ...dateFilter,
          match: matchFilter,
          // 🆕 Filtre par nombre de likes minimum
          likes: {
            _count: {
              gte: MIN_LIKES_THRESHOLD
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              _count: {
                select: { ratings: true }
              },
              ratings: {
                select: { rating: true },
                take: 100
              }
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
          likes: session?.user?.id ? {
            where: { userId: session.user.id }
          } : false,
          _count: {
            select: { likes: true }
          }
        },
        orderBy: {
          likes: {
            _count: 'desc'
          }
        },
        take: parseInt(limit as string)
      })

      // Formater les données
      const formattedReviews = topReviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        likes: review._count.likes,
        isLiked: review.likes && review.likes.length > 0,
        user: {
          id: review.user.id,
          name: review.user.name,
          username: review.user.username,
          image: review.user.image,
          totalReviews: review.user._count.ratings,
          avgRating: review.user.ratings.length > 0 
            ? review.user.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / review.user.ratings.length
            : 0
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
      }))

      // Calculer les statistiques globales
      const statsPromises = [
        // Total reviews avec commentaires
        prisma.rating.count({
          where: {
            comment: { not: null, not: '' },
            ...dateFilter,
            match: matchFilter
          }
        }),
        
        // Total likes
        prisma.$queryRaw`
          SELECT COUNT(*) as total
          FROM review_likes rl
          JOIN ratings r ON rl.review_id = r.id
          JOIN matches m ON r.match_id = m.id
          WHERE r.comment IS NOT NULL 
            AND r.comment != ''
            ${sport !== 'all' ? `AND m.sport = '${sport.toString().toUpperCase()}'` : ''}
            ${period !== 'all' ? getDateFilterSQL(period) : ''}
        ` as any[],
        
        // Utilisateurs actifs
        prisma.$queryRaw`
          SELECT COUNT(DISTINCT r.user_id) as total
          FROM ratings r
          JOIN matches m ON r.match_id = m.id
          WHERE r.comment IS NOT NULL 
            AND r.comment != ''
            ${sport !== 'all' ? `AND m.sport = '${sport.toString().toUpperCase()}'` : ''}
            ${period !== 'all' ? getDateFilterSQL(period) : ''}
        ` as any[]
      ]

      const [totalReviews, totalLikesResult, activeUsersResult] = await Promise.all(statsPromises)

      const stats = {
        totalReviews,
        totalLikes: parseInt(totalLikesResult[0]?.total || '0'),
        activeUsers: parseInt(activeUsersResult[0]?.total || '0')
      }

      res.status(200).json({
        success: true,
        reviews: formattedReviews,
        stats,
        meta: {
          period,
          sport,
          total: formattedReviews.length
        }
      })

    } catch (error) {
      console.error('Erreur top reviews:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

// Helper pour construire le filtre SQL de date
function getDateFilterSQL(period: string): string {
  switch (period) {
    case 'week':
      return `AND r.created_at >= NOW() - INTERVAL '7 days'`
    case 'month':
      return `AND r.created_at >= NOW() - INTERVAL '30 days'`
    case 'year':
      return `AND r.created_at >= NOW() - INTERVAL '365 days'`
    default:
      return ''
  }
}