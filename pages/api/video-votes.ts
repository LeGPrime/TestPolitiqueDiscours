// pages/api/video-votes.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  try {
    const { suggestionId, voteType } = req.body

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ error: 'Type de vote invalide' })
    }

    // Vérifier si la suggestion existe
    const suggestion = await prisma.videoSuggestion.findUnique({
      where: { id: suggestionId }
    })

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion non trouvée' })
    }

    // Chercher le vote existant
    const existingVote = await prisma.videoVote.findUnique({
      where: {
        userId_suggestionId: {
          userId: session.user.id,
          suggestionId
        }
      }
    })

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Supprimer le vote (toggle)
        await prisma.videoVote.delete({
          where: { id: existingVote.id }
        })
        
        return res.status(200).json({
          success: true,
          action: 'removed',
          voteType: null
        })
      } else {
        // Changer le vote
        await prisma.videoVote.update({
          where: { id: existingVote.id },
          data: { voteType }
        })
        
        return res.status(200).json({
          success: true,
          action: 'changed',
          voteType
        })
      }
    } else {
      // Créer un nouveau vote
      await prisma.videoVote.create({
        data: {
          userId: session.user.id,
          suggestionId,
          voteType
        }
      })
      
      return res.status(200).json({
        success: true,
        action: 'added',
        voteType
      })
    }

  } catch (error) {
    console.error('❌ Erreur vote:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process vote'
    })
  }
}