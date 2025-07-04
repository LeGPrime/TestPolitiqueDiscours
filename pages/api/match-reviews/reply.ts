// pages/api/match-reviews/reply.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'POST') {
    try {
      const { reviewId, content, matchId } = req.body

      if (!reviewId || !content?.trim()) {
        return res.status(400).json({ error: 'Données invalides' })
      }

      // Vérifier que la review existe
      const review = await prisma.rating.findUnique({
        where: { id: reviewId }
      })

      if (!review) {
        return res.status(404).json({ error: 'Review non trouvée' })
      }

      // Créer la réponse
      const reply = await prisma.reviewReply.create({
        data: {
          content: content.trim(),
          userId: session.user.id,
          reviewId: reviewId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      })

      // Notification à l'auteur de la review originale (optionnel)
      if (review.userId !== session.user.id) {
        try {
          await prisma.notification.create({
            data: {
              userId: review.userId,
              type: 'REPLY',
              title: 'Nouvelle réponse à votre commentaire',
              message: `${session.user.name} a répondu à votre commentaire sur le match`,
              data: {
                matchId: matchId,
                reviewId: reviewId,
                replyId: reply.id
              }
            }
          })
        } catch (notifError) {
          // Ignore si table notifications n'existe pas encore
          console.log('⚠️ Notifications non disponibles:', notifError)
        }
      }

      res.status(200).json({
        success: true,
        reply: {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          user: reply.user,
          likes: 0,
          isLiked: false
        },
        message: 'Réponse ajoutée !'
      })

    } catch (error) {
      console.error('Erreur réponse review:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}