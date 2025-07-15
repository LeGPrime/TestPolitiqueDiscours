// pages/api/man-of-match.ts - API avec création automatique des joueurs
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
      const { playerId, playerData, matchId, comment } = req.body

      console.log('🏆 Vote homme du match reçu:', { playerId, playerData, matchId, comment })

      if (!playerId || !matchId) {
        return res.status(400).json({ 
          error: 'Données invalides (playerId et matchId requis)',
          received: { playerId, matchId, comment }
        })
      }

      // 🆕 NOUVELLE LOGIQUE : Vérifier si le joueur existe, sinon le créer
      let player = await prisma.player.findUnique({
        where: { id: playerId }
      })

      if (!player && playerData) {
        console.log('🔧 Joueur non trouvé, création automatique...', playerData)
        
        try {
          // Créer le joueur avec les données fournies
          player = await prisma.player.create({
            data: {
              id: playerId, // Utiliser l'ID fourni
              name: playerData.name,
              position: playerData.position || null,
              number: playerData.number || null,
              team: playerData.team,
              sport: playerData.sport || 'FOOTBALL'
            }
          })
          console.log('✅ Joueur créé:', player)
        } catch (createError) {
          console.error('❌ Erreur création joueur:', createError)
          
          // Si la création échoue (ex: ID déjà pris), essayer de le trouver à nouveau
          player = await prisma.player.findFirst({
            where: {
              name: playerData.name,
              team: playerData.team,
              sport: playerData.sport || 'FOOTBALL'
            }
          })
          
          if (!player) {
            return res.status(400).json({ 
              error: 'Impossible de créer ou trouver le joueur',
              details: createError instanceof Error ? createError.message : 'Erreur inconnue'
            })
          }
        }
      }

      if (!player) {
        return res.status(404).json({ 
          error: 'Joueur non trouvé et aucune donnée fournie pour le créer',
          playerId 
        })
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
          playerId: player.id, // Utiliser l'ID du joueur trouvé/créé
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

      // Grouper par joueur avec structure corrigée
      const playerVotesMap = new Map<string, {
        player: typeof vote.player
        votes: typeof allVotes
        count: number
        percentage: number
        recentVoters: Array<{ id: string; name?: string; username?: string }>
      }>()

      allVotes.forEach(vote => {
        const playerId = vote.playerId
        if (!playerVotesMap.has(playerId)) {
          playerVotesMap.set(playerId, {
            player: vote.player,
            votes: [],
            count: 0,
            percentage: 0,
            recentVoters: []
          })
        }
        
        const playerData = playerVotesMap.get(playerId)!
        playerData.votes.push(vote)
        playerData.count++
        playerData.percentage = allVotes.length > 0 ? Math.round((playerData.count / allVotes.length) * 100) : 0
        
        // Ajouter aux votants récents (3 derniers)
        if (playerData.recentVoters.length < 3) {
          playerData.recentVoters.push({
            id: vote.user.id,
            name: vote.user.name || undefined,
            username: vote.user.username || undefined
          })
        }
      })

      // Convertir Map en objet pour l'API
      const playerVotes = Object.fromEntries(playerVotesMap)

      // Trier par nombre de votes pour le top 3
      const sortedPlayers = Array.from(playerVotesMap.values()).sort((a, b) => b.count - a.count)
      const leader = sortedPlayers[0] || null
      const topThree = sortedPlayers.slice(0, Math.min(10, sortedPlayers.length))

      res.status(200).json({ 
        success: true,
        vote, 
        stats: {
          totalVotes: allVotes.length,
          uniquePlayers: playerVotesMap.size,
          leader: leader ? {
            player: leader.player,
            count: leader.count,
            percentage: leader.percentage
          } : null,
          topThree: topThree.map(p => ({
            player: p.player,
            count: p.count,
            percentage: p.percentage,
            recentVoters: p.recentVoters
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
    // ... (reste du code GET inchangé)
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

      // Grouper par joueur avec la même structure que POST
      const playerVotesMap = new Map<string, {
        player: (typeof votes)[0]['player']
        votes: Array<{
          id: string
          userId: string
          createdAt: Date
          user: (typeof votes)[0]['user']
          comment?: string
        }>
        count: number
        percentage: number
        recentVoters: Array<{ id: string; name?: string; username?: string }>
      }>()

      votes.forEach(vote => {
        const playerId = vote.playerId
        if (!playerVotesMap.has(playerId)) {
          playerVotesMap.set(playerId, {
            player: vote.player,
            votes: [],
            count: 0,
            percentage: 0,
            recentVoters: []
          })
        }
        
        const playerData = playerVotesMap.get(playerId)!
        
        // Ajouter le vote avec ou sans commentaire selon le paramètre
        const voteData = {
          id: vote.id,
          userId: vote.userId,
          createdAt: vote.createdAt,
          user: vote.user,
          ...(includeComments === 'true' && { comment: vote.comment })
        }
        
        playerData.votes.push(voteData)
        playerData.count++
        playerData.percentage = votes.length > 0 ? Math.round((playerData.count / votes.length) * 100) : 0
        
        // Ajouter aux votants récents (3 derniers)
        if (playerData.recentVoters.length < 3) {
          playerData.recentVoters.push({
            id: vote.user.id,
            name: vote.user.name || undefined,
            username: vote.user.username || undefined
          })
        }
      })

      // Convertir Map en objet
      const playerVotes = Object.fromEntries(playerVotesMap)

      // Trier par nombre de votes
      const sortedPlayers = Array.from(playerVotesMap.values()).sort((a, b) => b.count - a.count)
      
      // Vote de l'utilisateur actuel
      const userVote = votes.find(v => v.userId === session.user.id)

      console.log(`📊 ${votes.length} votes trouvés pour ${playerVotesMap.size} joueurs`)

      res.status(200).json({ 
        success: true,
        votes,
        playerVotes,
        userVote: userVote ? {
          id: userVote.id,
          playerId: userVote.playerId,
          player: userVote.player,
          comment: includeComments === 'true' ? userVote.comment : undefined,
          createdAt: userVote.createdAt
        } : null,
        stats: {
          totalVotes: votes.length,
          uniquePlayers: playerVotesMap.size,
          leader: sortedPlayers[0] || null,
          topThree: sortedPlayers.slice(0, 10).map(p => ({
            player: p.player,
            count: p.count,
            percentage: p.percentage,
            recentVoters: p.recentVoters
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
    // ... (reste du code DELETE inchangé)
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