import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { notifyFriendActivity, checkAndNotifyTrendingMatch } from '../../lib/notifications'

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

      // Vérifier si l'utilisateur avait déjà noté (pour savoir si c'est une création ou update)
      const existingRating = await prisma.rating.findUnique({
        where: {
          userId_matchId: {
            userId: session.user.id,
            matchId: matchId,
          }
        }
      })

      const isNewRating = !existingRating

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
          },
          match: {
            select: { 
              id: true, 
              homeTeam: true, 
              awayTeam: true, 
              totalRatings: true 
            }
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

      // 🔔 NOTIFICATIONS ASYNCHRONES (ne bloque pas la réponse)
      if (isNewRating) {
        // Lancer les notifications en arrière-plan
        Promise.all([
          // 1. Notifier les amis de l'activité (seulement pour les nouvelles notes)
          notifyFriendActivity(
            session.user.id,
            session.user.name || session.user.email || 'Un utilisateur',
            `${userRating.match.homeTeam} vs ${userRating.match.awayTeam}`,
            rating,
            matchId,
            !!comment
          ),
          
          // 2. Vérifier si le match devient trending
          checkAndNotifyTrendingMatch(matchId)
        ]).catch(error => {
          console.error('❌ Erreur notifications asynchrones:', error)
        })
      }

      console.log(`✅ ${isNewRating ? 'Nouvelle' : 'Mise à jour'} notation: ${session.user.name} → ${userRating.match.homeTeam} vs ${userRating.match.awayTeam} (${rating}⭐)`)

      res.status(200).json({ 
        rating: userRating, 
        avgRating, 
        totalRatings: ratings.length,
        isNewRating 
      })
    } catch (error) {
      console.error('Erreur notation:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}