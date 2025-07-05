// pages/api/profile/debug.ts - API de debug pour voir les données
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    const { userId } = req.query
    const targetUserId = userId as string || session.user.id

    console.log('🔍 Debug pour utilisateur:', targetUserId)

    // 1. Vérifier l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true
      }
    })

    console.log('👤 Utilisateur trouvé:', user)

    // 2. Compter les ratings de matchs
    const matchRatingsCount = await prisma.rating.count({
      where: { userId: targetUserId }
    })

    console.log('⚽ Ratings de matchs:', matchRatingsCount)

    // 3. Récupérer quelques ratings de matchs
    const matchRatings = await prisma.rating.findMany({
      where: { userId: targetUserId },
      include: {
        match: {
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            competition: true,
            date: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log('📋 Derniers ratings de matchs:', matchRatings)

    // 4. Compter les ratings de joueurs
    const playerRatingsCount = await prisma.playerRating.count({
      where: { userId: targetUserId }
    })

    console.log('👥 Ratings de joueurs:', playerRatingsCount)

    // 5. Récupérer quelques ratings de joueurs
    const playerRatings = await prisma.playerRating.findMany({
      where: { userId: targetUserId },
      include: {
        player: true,
        match: {
          select: {
            id: true,
            homeTeam: true,
            awayTeam: true,
            competition: true,
            date: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log('📋 Derniers ratings de joueurs:', playerRatings)

    // 6. Calculer la moyenne des notes de matchs
    const avgMatchRating = matchRatingsCount > 0 
      ? await prisma.rating.aggregate({
          where: { userId: targetUserId },
          _avg: { rating: true }
        })
      : null

    console.log('📊 Moyenne ratings matchs:', avgMatchRating?._avg?.rating)

    // 7. Calculer la moyenne des notes de joueurs
    const avgPlayerRating = playerRatingsCount > 0 
      ? await prisma.playerRating.aggregate({
          where: { userId: targetUserId },
          _avg: { rating: true }
        })
      : null

    console.log('📊 Moyenne ratings joueurs:', avgPlayerRating?._avg?.rating)

    // 8. Compter les amis
    const friendsCount = await prisma.friendship.count({
      where: {
        OR: [
          { senderId: targetUserId, status: 'ACCEPTED' },
          { receiverId: targetUserId, status: 'ACCEPTED' }
        ]
      }
    })

    console.log('👥 Nombre d\'amis:', friendsCount)

    // Retourner toutes les infos de debug
    res.status(200).json({
      user,
      debug: {
        matchRatingsCount,
        playerRatingsCount,
        avgMatchRating: avgMatchRating?._avg?.rating || 0,
        avgPlayerRating: avgPlayerRating?._avg?.rating || 0,
        friendsCount,
        recentMatchRatings: matchRatings,
        recentPlayerRatings: playerRatings
      }
    })

  } catch (error) {
    console.error('💥 Erreur debug profile:', error)
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message 
    })
  }
}