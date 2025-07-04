// pages/api/match-reviews/like.ts
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
      const { reviewId, isReply = false } = req.body

      if (!reviewId) {
        return res.status(400).json({ error: 'Review ID requis' })
      }

      // Vérifier si l'utilisateur a déjà liké
      const existingLike = await prisma.reviewLike.findUnique({
        where: {
          userId_reviewId: {
            userId: session.user.id,
            reviewId: reviewId
          }
        }
      })

      if (existingLike) {
        // Retirer le like
        await prisma.reviewLike.delete({
          where: { id: existingLike.id }
        })

        res.status(200).json({ 
          success: true, 
          action: 'unliked',
          message: 'Like retiré' 
        })
      } else {
        // Ajouter le like
        await prisma.reviewLike.create({
          data: {
            userId: session.user.id,
            reviewId: reviewId
          }
        })

        res.status(200).json({ 
          success: true, 
          action: 'liked',
          message: 'Review likée !' 
        })
      }

    } catch (error) {
      console.error('Erreur like review:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}