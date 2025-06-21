// FICHIER: pages/api/player-ratings.ts
// Créer ce nouveau fichier

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
      const { playerId, matchId, rating, comment } = req.body

      if (!playerId || !matchId || !rating || rating < 1 || rating > 10) {
        return res.status(400).json({ error: 'Données invalides (rating 1-10)' })
      }

      // Créer ou mettre à jour la notation du joueur
      const playerRating = await prisma.playerRating.upsert({
        where: {
          userId_playerId_matchId: {
            userId: session.user.id,
            playerId,
            matchId,
          }
        },
        update: { rating, comment },
        create: {
          userId: session.user.id,
          playerId,
          matchId,
          rating,
          comment,
        },
        include: {
          user: {
            select: { id: true, name: true, username: true }
          },
          player: {
            select: { id: true, name: true, position: true, number: true }
          }
        }
      })

      // Recalculer la moyenne du joueur pour ce match
      const ratings = await prisma.playerRating.findMany({
        where: { playerId, matchId }
      })

      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      
      res.status(200).json({ 
        rating: playerRating, 
        avgRating, 
        totalRatings: ratings.length 
      })
    } catch (error) {
      console.error('Erreur notation joueur:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else if (req.method === 'GET') {
    // Récupérer les notations d'un match
    try {
      const { matchId } = req.query

      const ratings = await prisma.playerRating.findMany({
        where: { matchId: matchId as string },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true }
          },
          player: {
            select: { id: true, name: true, position: true, number: true, team: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      res.status(200).json({ ratings })
    } catch (error) {
      console.error('Erreur récupération ratings:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}