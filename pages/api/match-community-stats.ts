// pages/api/match-community-stats.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { matchId } = req.query

      if (!matchId) {
        return res.status(400).json({ error: 'Match ID requis' })
      }

      // 1. Répartition des notes
      const ratingDistribution = await prisma.$queryRaw`
        SELECT 
          rating,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
        FROM ratings 
        WHERE match_id = ${matchId}
        GROUP BY rating
        ORDER BY rating DESC
      ` as any[]

      // 2. Total des commentaires avec contenu
      const totalComments = await prisma.rating.count({
        where: {
          matchId: matchId as string,
          comment: {
            not: null,
            not: ''
          }
        }
      })

      // 3. Total des likes sur les reviews de ce match
      const totalLikesResult = await prisma.$queryRaw`
        SELECT COUNT(*) as total
        FROM review_likes rl
        JOIN ratings r ON rl.review_id = r.id
        WHERE r.match_id = ${matchId}
      ` as any[]

      // 4. Top reviewer (utilisateur avec le plus de likes sur ce match)
      const topReviewerResult = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.username,
          u.image,
          COUNT(rl.id) as likes,
          r.rating,
          r.comment
        FROM users u
        JOIN ratings r ON u.id = r.user_id
        LEFT JOIN review_likes rl ON r.id = rl.review_id
        WHERE r.match_id = ${matchId} 
          AND r.comment IS NOT NULL 
          AND r.comment != ''
        GROUP BY u.id, u.name, u.username, u.image, r.rating, r.comment
        ORDER BY likes DESC, r.rating DESC
        LIMIT 1
      ` as any[]

      // 5. Activité récente (reviews des dernières 24h)
      const recentActivity = await prisma.rating.count({
        where: {
          matchId: matchId as string,
          comment: {
            not: null,
            not: ''
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      // 6. Statistiques par période (pour le graphique d'activité)
      const activityByHour = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as comments
        FROM ratings
        WHERE match_id = ${matchId}
          AND comment IS NOT NULL 
          AND comment != ''
          AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      ` as any[]

      // 7. Mots-clés populaires dans les commentaires (simple analyse)
      const popularWords = await prisma.$queryRaw`
        SELECT 
          word,
          COUNT(*) as frequency
        FROM (
          SELECT UNNEST(
            STRING_TO_ARRAY(
              REGEXP_REPLACE(
                LOWER(comment), 
                '[^a-záàâäéèêëïîôöùûüç\s]', 
                '', 
                'g'
              ), 
              ' '
            )
          ) as word
          FROM ratings 
          WHERE match_id = ${matchId}
            AND comment IS NOT NULL 
            AND comment != ''
        ) words
        WHERE LENGTH(word) > 3
          AND word NOT IN ('avec', 'dans', 'pour', 'cette', 'plus', 'très', 'tout', 'bien', 'mais', 'comme', 'sans', 'alors')
        GROUP BY word
        HAVING COUNT(*) > 1
        ORDER BY frequency DESC
        LIMIT 10
      ` as any[]

      const stats = {
        ratingDistribution: ratingDistribution.map(item => ({
          rating: parseInt(item.rating),
          count: parseInt(item.count),
          percentage: parseFloat(item.percentage)
        })),
        totalComments,
        totalLikes: parseInt(totalLikesResult[0]?.total || '0'),
        topReviewer: topReviewerResult[0] ? {
          id: topReviewerResult[0].id,
          name: topReviewerResult[0].name,
          username: topReviewerResult[0].username,
          image: topReviewerResult[0].image,
          likes: parseInt(topReviewerResult[0].likes),
          rating: topReviewerResult[0].rating,
          comment: topReviewerResult[0].comment
        } : null,
        recentActivity,
        activityByHour: activityByHour.map(item => ({
          hour: parseInt(item.hour),
          comments: parseInt(item.comments)
        })),
        popularWords: popularWords.map(item => ({
          word: item.word,
          frequency: parseInt(item.frequency)
        })),
        // Quelques métriques calculées
        avgRating: ratingDistribution.length > 0 
          ? ratingDistribution.reduce((sum, item) => sum + (parseInt(item.rating) * parseInt(item.count)), 0) / 
            ratingDistribution.reduce((sum, item) => sum + parseInt(item.count), 0)
          : 0,
        engagementRate: totalComments > 0 
          ? ((parseInt(totalLikesResult[0]?.total || '0') + recentActivity) / totalComments * 100).toFixed(1)
          : 0
      }

      res.status(200).json({
        success: true,
        stats
      })

    } catch (error) {
      console.error('Erreur stats communauté:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}