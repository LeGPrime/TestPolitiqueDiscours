import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (req.method === 'GET') {
    try {
      const { q, type = 'all' } = req.query

      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.status(400).json({ error: 'La recherche doit contenir au moins 2 caractères' })
      }

      console.log(`🔍 Recherche locale pour: "${q}"`)

      const results: any = {
        matches: [],
        users: []
      }

      // Rechercher des matchs dans notre base uniquement
      if (type === 'all' || type === 'matches') {
        const dbMatches = await prisma.match.findMany({
          where: {
            OR: [
              { homeTeam: { contains: q, mode: 'insensitive' } },
              { awayTeam: { contains: q, mode: 'insensitive' } },
              { competition: { contains: q, mode: 'insensitive' } }
            ],
            status: 'FINISHED'
          },
          include: {
            ratings: {
              include: {
                user: {
                  select: { id: true, name: true, username: true }
                }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 20
        })

        results.matches = dbMatches.map(match => ({
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeTeamLogo: match.homeTeamLogo,
          awayTeamLogo: match.awayTeamLogo,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          date: match.date.toISOString(),
          status: match.status,
          competition: match.competition,
          venue: match.venue,
          avgRating: match.avgRating,
          totalRatings: match.totalRatings,
          ratings: match.ratings,
          canRate: true
        }))

        console.log(`✅ ${results.matches.length} matchs trouvés`)
      }

      // Rechercher des utilisateurs (inchangé)
      if (type === 'all' || type === 'users') {
        if (session?.user?.id) {
          const users = await prisma.user.findMany({
            where: {
              AND: [
                { id: { not: session.user.id } },
                {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { username: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                  ]
                }
              ]
            },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              bio: true,
              _count: {
                select: { ratings: true }
              }
            },
            take: 15
          })

          // Vérifier le statut d'amitié
          const usersWithFriendshipStatus = await Promise.all(
            users.map(async (user) => {
              const friendship = await prisma.friendship.findFirst({
                where: {
                  OR: [
                    { senderId: session.user.id, receiverId: user.id },
                    { senderId: user.id, receiverId: session.user.id }
                  ]
                }
              })

              let friendshipStatus = 'none'
              let friendshipId = null

              if (friendship) {
                friendshipId = friendship.id
                if (friendship.status === 'ACCEPTED') {
                  friendshipStatus = 'friends'
                } else if (friendship.senderId === session.user.id) {
                  friendshipStatus = 'sent'
                } else {
                  friendshipStatus = 'received'
                }
              }

              return {
                ...user,
                totalRatings: user._count.ratings,
                friendshipStatus,
                friendshipId
              }
            })
          )

          results.users = usersWithFriendshipStatus
          console.log(`✅ ${results.users.length} utilisateurs trouvés`)
        }
      }

      res.status(200).json(results)
    } catch (error) {
      console.error('Erreur recherche:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
