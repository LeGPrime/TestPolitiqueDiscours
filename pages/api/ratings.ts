import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'POST') {
    try {
      const { matchId, rating, comment } = req.body

      if (!matchId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Données invalides' })
      }

      // Créer ou mettre à jour la notation
      const userRating = await prisma.rating.upsert({
        where: {
          userId_matchId: {
            userId: session.user.id,
            matchId: matchId,
          }
        },
        update: { rating, comment },
        create: {
          userId: session.user.id,
          matchId: matchId,
          rating,
          comment,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Recalculer la moyenne
      const ratings = await prisma.rating.findMany({
        where: { matchId: matchId }
      })

      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      
      await prisma.match.update({
        where: { id: matchId },
        data: {
          avgRating,
          totalRatings: ratings.length,
        }
      })

      res.status(200).json({ rating: userRating, avgRating, totalRatings: ratings.length })
    } catch (error) {
      console.error('Erreur notation:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
