import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'GET') {
    try {
      const { limit = '50' } = req.query

      // Récupérer les IDs des amis
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { senderId: session.user.id, status: 'ACCEPTED' },
            { receiverId: session.user.id, status: 'ACCEPTED' }
          ]
        }
      })

      const friendIds = friendships.map(friendship =>
        friendship.senderId === session.user.id
          ? friendship.receiverId
          : friendship.senderId
      )

      // Ajouter l'utilisateur actuel pour voir ses propres ratings
      friendIds.push(session.user.id)

      // Récupérer les ratings récents des amis + soi-même
      const recentActivity = await prisma.rating.findMany({
        where: {
          userId: { in: friendIds }
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true }
          },
          match: {
            select: {
              id: true,
              homeTeam: true,
              awayTeam: true,
              homeTeamLogo: true,
              awayTeamLogo: true,
              homeScore: true,
              awayScore: true,
              date: true,
              competition: true,
              venue: true,
              avgRating: true,
              totalRatings: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      })

      // Enrichir avec le contexte (est-ce un ami ou soi-même ?)
      const enrichedActivity = recentActivity.map(activity => {
        const isOwnRating = activity.userId === session.user.id
        const isFriend = friendIds.includes(activity.userId) && !isOwnRating

        return {
          ...activity,
          context: isOwnRating ? 'own' : isFriend ? 'friend' : 'other'
        }
      })

      res.status(200).json({ activities: enrichedActivity })
    } catch (error) {
      console.error('Erreur feed:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
