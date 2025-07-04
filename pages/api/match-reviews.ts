// pages/api/match-reviews.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { matchId, sort = 'popular', limit = '20' } = req.query
      const session = await getServerSession(req, res, authOptions)

      if (!matchId) {
        return res.status(400).json({ error: 'Match ID requis' })
      }

      // Construire l'ordre selon le tri demandé
      let orderBy: any = {}
      switch (sort) {
        case 'recent':
          orderBy = { createdAt: 'desc' }
          break
        case 'rating':
          orderBy = { rating: 'desc' }
          break
        case 'popular':
        default:
          orderBy = { likes: 'desc' }
          break
      }

      // Récupérer les reviews avec leurs likes
      const reviews = await prisma.rating.findMany({
        where: {
          matchId: matchId as string,
          comment: {
            not: null,
            not: ''
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              // Calculer les stats utilisateur
              _count: {
                select: {
                  ratings: true
                }
              },
              ratings: {
                select: { rating: true },
                take: 100 // Pour calculer la moyenne
              }
            }
          },
          // Inclure les likes
          likes: session?.user?.id ? {
            where: { userId: session.user.id }
          } : false,
          _count: {
            select: { likes: true, replies: true }
          },
          // Inclure les réponses
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true
                }
              },
              likes: session?.user?.id ? {
                where: { userId: session.user.id }
              } : false,
              _count: {
                select: { likes: true }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 5 // Limiter les réponses affichées
          }
        },
        orderBy,
        take: parseInt(limit as string)
      })

      // Formater les données
      const formattedReviews = reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        spoilerFree: review.spoilerFree ?? true,
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
            : null
        },
        replies: review.replies.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          user: {
            id: reply.user.id,
            name: reply.user.name,
            username: reply.user.username,
            image: reply.user.image
          },
          likes: reply._count.likes,
          isLiked: reply.likes && reply.likes.length > 0
        }))
      }))

      res.status(200).json({
        success: true,
        reviews: formattedReviews,
        total: formattedReviews.length
      })

    } catch (error) {
      console.error('Erreur récupération reviews:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}