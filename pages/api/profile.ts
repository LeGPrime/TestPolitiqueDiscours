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
      const { userId } = req.query
      const targetUserId = userId as string || session.user.id

      // Récupérer l'utilisateur avec ses ratings
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          ratings: {
            include: {
              match: true
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              ratings: true,
              sentFriendships: { where: { status: 'ACCEPTED' } },
              receivedFriendships: { where: { status: 'ACCEPTED' } }
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' })
      }

      // Calculer les statistiques
      const totalRatings = user.ratings.length
      const avgRating = totalRatings > 0 
        ? user.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      // Matches les mieux notés par l'utilisateur
      const topMatches = user.ratings
        .filter(r => r.rating >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      // Répartition des notes
      const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1
        const count = user.ratings.filter(r => r.rating === rating).length
        return { rating, count, percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0 }
      })

      // Compétition préférée
      const competitionCounts: Record<string, number> = {}
      user.ratings.forEach(rating => {
        const comp = rating.match.competition
        competitionCounts[comp] = (competitionCounts[comp] || 0) + 1
      })
      
      const favoriteCompetition = Object.entries(competitionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null

      // Activité récente (derniers 6 mois)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const recentActivity = user.ratings
        .filter(r => new Date(r.createdAt) > sixMonthsAgo)
        .length

      const stats = {
        totalRatings,
        avgRating: Number(avgRating.toFixed(1)),
        totalFriends: user._count.sentFriendships + user._count.receivedFriendships,
        favoriteCompetition,
        recentActivity,
        topMatches,
        ratingDistribution,
        joinDate: user.createdAt
      }

      const profileData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          bio: user.bio,
          image: user.image,
          createdAt: user.createdAt
        },
        stats,
        recentRatings: user.ratings.slice(0, 20)
      }

      res.status(200).json(profileData)
    } catch (error) {
      console.error('Erreur profil:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else if (req.method === 'PUT') {
    // Mettre à jour le profil
    try {
      const { name, username, bio } = req.body

      // Vérifier que le username est unique
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            id: { not: session.user.id }
          }
        })

        if (existingUser) {
          return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { name, username, bio },
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          email: true,
          image: true
        }
      })

      res.status(200).json({ user: updatedUser })
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
