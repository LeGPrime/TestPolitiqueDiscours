// pages/api/man-of-match.ts - API pour voter pour l'homme du match
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
      const { playerId, matchId, comment } = req.body

      console.log('🏆 Vote homme du match reçu:', { playerId, matchId, comment })

      if (!playerId || !matchId) {
        return res.status(400).json({ 
          error: 'Données invalides (playerId et matchId requis)',
          received: { playerId, matchId, comment }
        })
      }

      // Vérifier que c'est bien un joueur (pas un coach)
      const player = await prisma.player.findUnique({
        where: { id: playerId }
      })

      if (!player) {
        return res.status(404).json({ error: 'Joueur non trouvé' })
      }

      if (player.position === 'COACH') {
        return res.status(400).json({ error: 'Impossible de voter pour un coach comme homme du match' })
      }

      // Vérifier que le match existe et est terminé
      const match = await prisma.match.findUnique({
        where: { id: matchId }
      })

      if (!match) {
        return res.status(404).json({ error: 'Match non trouvé' })
      }

      if (match.status !== 'FINISHED') {
        return res.status(400).json({ error: 'Le match doit être terminé pour voter' })
      }

      // Supprimer l'ancien vote de l'utilisateur pour ce match (un seul vote par match)
      await prisma.manOfMatchVote.deleteMany({
        where: {
          userId: session.user.id,
          matchId: matchId
        }
      })

      // Créer le nouveau vote
      const vote = await prisma.manOfMatchVote.create({
        data: {
          userId: session.user.id,
          playerId: playerId,
          matchId: matchId,
          comment: comment || null,
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true }
          },
          player: {
            select: { id: true, name: true, position: true, number: true, team: true }
          }
        }
      })

      console.log(`✅ Vote homme du match créé:`, vote)

      // Calculer les stats mises à jour
      const allVotes = await prisma.manOfMatchVote.findMany({
        where: { matchId },
        include: {
          player: {
            select: { id: true, name: true, position: true, number: true, team: true }
          },
          user: {
            select: { id: true, name: true, username: true, image: true }
          }
        }
      })

      // Grouper par joueur
      const playerVotes = allVotes.reduce((acc, vote) => {
        const playerId = vote.playerId
        if (!acc[playerId]) {
          acc[playerId] = {
            player: vote.player,
            votes: [],
            count: 0
          }
        }
        acc[playerId].votes.push(vote)
        acc[playerId].count++
        return acc
      }, {} as Record<string, any>)

      // Trouver le leader actuel
      const sortedPlayers = Object.values(playerVotes).sort((a: any, b: any) => b.count - a.count)
      const leader = sortedPlayers[0] || null

      res.status(200).json({ 
        success: true,
        vote, 
        stats: {
          totalVotes: allVotes.length,
          playerVotes,
          leader: leader ? {
            player: leader.player,
            votes: leader.count,
            percentage: leader.count > 0 ? Math.round((leader.count / allVotes.length) * 100) : 0
          } : null,
          topThree: sortedPlayers.slice(0, 3).map((p: any) => ({
            player: p.player,
            votes: p.count,
            percentage: p.count > 0 ? Math.round((p.count / allVotes.length) * 100) : 0
          }))
        },
        message: `${player.name} voté comme homme du match !`
      })

    } catch (error) {
      console.error('❌ Erreur vote homme du match:', error)
      res.status(500).json({ 
        error: 'Erreur serveur', 
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

  } else if (req.method === 'GET') {
    // Récupérer les votes d'un match
    try {
      const { matchId, includeComments = 'true' } = req.query

      console.log('📖 Récupération votes homme du match:', { matchId, includeComments })

      if (!matchId) {
        return res.status(400).json({ error: 'matchId requis' })
      }

      const votes = await prisma.manOfMatchVote.findMany({
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

      // Grouper par joueur
      const playerVotes = votes.reduce((acc, vote) => {
        const playerId = vote.playerId
        if (!acc[playerId]) {
          acc[playerId] = {
            player: vote.player,
            votes: [],
            count: 0
          }
        }
        
        // Inclure ou non les commentaires selon le paramètre
        const voteData = {
          id: vote.id,
          userId: vote.userId,
          createdAt: vote.createdAt,
          user: vote.user,
          ...(includeComments === 'true' && { comment: vote.comment })
        }
        
        acc[playerId].votes.push(voteData)
        acc[playerId].count++
        return acc
      }, {} as Record<string, any>)

      // Trier par nombre de votes
      const sortedPlayers = Object.values(playerVotes).sort((a: any, b: any) => b.count - a.count)
      
      // Vote de l'utilisateur actuel
      const userVote = votes.find(v => v.userId === session.user.id)

      console.log(`📊 ${votes.length} votes trouvés pour ${Object.keys(playerVotes).length} joueurs`)

      res.status(200).json({ 
        success: true,
        votes,
        playerVotes,
        userVote: userVote ? {
          playerId: userVote.playerId,
          player: userVote.player,
          comment: includeComments === 'true' ? userVote.comment : undefined,
          createdAt: userVote.createdAt
        } : null,
        stats: {
          totalVotes: votes.length,
          uniquePlayers: Object.keys(playerVotes).length,
          leader: sortedPlayers[0] || null,
          topThree: sortedPlayers.slice(0, 3).map((p: any) => ({
            player: p.player,
            votes: p.count,
            percentage: votes.length > 0 ? Math.round((p.count / votes.length) * 100) : 0,
            recentVoters: p.votes.slice(0, 3).map((v: any) => v.user) // 3 derniers votants
          }))
        }
      })

    } catch (error) {
      console.error('❌ Erreur récupération votes:', error)
      res.status(500).json({ 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

  } else if (req.method === 'DELETE') {
    // Supprimer son vote
    try {
      const { matchId } = req.query

      if (!matchId) {
        return res.status(400).json({ error: 'matchId requis' })
      }

      const deletedVote = await prisma.manOfMatchVote.deleteMany({
        where: {
          userId: session.user.id,
          matchId: matchId as string
        }
      })

      console.log(`🗑️ Vote supprimé pour l'utilisateur ${session.user.id} sur le match ${matchId}`)

      res.status(200).json({ 
        success: true,
        message: 'Vote supprimé avec succès',
        deletedCount: deletedVote.count
      })

    } catch (error) {
      console.error('❌ Erreur suppression vote:', error)
      res.status(500).json({ 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}