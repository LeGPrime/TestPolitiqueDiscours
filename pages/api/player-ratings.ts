// pages/api/player-ratings.ts - VERSION CORRIGÉE
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

      console.log('📝 Notation joueur reçue:', { playerId, matchId, rating, comment })

      if (!playerId || !matchId || !rating || rating < 1 || rating > 10) {
        return res.status(400).json({ 
          error: 'Données invalides (rating 1-10 requis)',
          received: { playerId, matchId, rating, comment }
        })
      }

      // 🔧 EXTRACTION DES INFOS DU PLAYER ID
      // Format attendu: "Nom_Joueur_Equipe" ex: "L._Messi_Inter_Miami"
      const playerIdParts = playerId.split('_')
      let playerName = playerId
      let teamName = 'Unknown Team'
      
      if (playerIdParts.length >= 3) {
        // Prendre tout sauf le dernier élément comme nom
        playerName = playerIdParts.slice(0, -1).join(' ').replace(/_/g, ' ')
        // Le dernier élément est l'équipe
        teamName = playerIdParts[playerIdParts.length - 1].replace(/_/g, ' ')
      }

      console.log('👤 Infos extraites:', { playerName, teamName, originalId: playerId })

      // 1. Vérifier/créer le joueur dans la base
      let player = await prisma.player.findFirst({
        where: { 
          OR: [
            { id: playerId },
            { 
              name: playerName,
              team: teamName 
            }
          ]
        }
      })

      if (!player) {
        // Créer le joueur s'il n'existe pas
        console.log('🆕 Création du joueur:', { playerId, playerName, teamName })
        player = await prisma.player.create({
          data: {
            id: playerId,
            name: playerName,
            team: teamName, // 🔧 CORRECTION: Ajouter le team
            sport: 'FOOTBALL'
          }
        })
      }

      console.log('👤 Joueur trouvé/créé:', player)

      // 2. Créer ou mettre à jour la notation du joueur
      const playerRating = await prisma.playerRating.upsert({
        where: {
          userId_playerId_matchId: {
            userId: session.user.id,
            playerId: player.id,
            matchId: matchId,
          }
        },
        update: { 
          rating, 
          comment: comment || null,
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          playerId: player.id,
          matchId: matchId,
          rating,
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

      console.log('✅ Notation créée/mise à jour:', playerRating)

      // 3. Recalculer la moyenne du joueur pour ce match
      const allPlayerRatings = await prisma.playerRating.findMany({
        where: { playerId: player.id, matchId }
      })

      const avgRating = allPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / allPlayerRatings.length
      
      console.log(`📊 Nouvelle moyenne pour ${player.name}: ${avgRating.toFixed(1)} (${allPlayerRatings.length} votes)`)

      res.status(200).json({ 
        success: true,
        rating: playerRating, 
        avgRating: Number(avgRating.toFixed(1)), 
        totalRatings: allPlayerRatings.length,
        message: `${player.name} noté ${rating}/10 avec succès !`
      })

    } catch (error) {
      console.error('❌ Erreur notation joueur:', error)
      res.status(500).json({ 
        error: 'Erreur serveur', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }

  } else if (req.method === 'GET') {
    // Récupérer les notations d'un match
    try {
      const { matchId, playerId } = req.query

      console.log('📖 Récupération ratings:', { matchId, playerId })

      let whereClause: any = {}
      
      if (matchId) {
        whereClause.matchId = matchId as string
      }
      
      if (playerId) {
        whereClause.playerId = playerId as string
      }

      const ratings = await prisma.playerRating.findMany({
        where: whereClause,
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

      console.log(`📊 ${ratings.length} ratings trouvés`)

      res.status(200).json({ 
        success: true,
        ratings,
        count: ratings.length
      })

    } catch (error) {
      console.error('❌ Erreur récupération ratings:', error)
      res.status(500).json({ 
        error: 'Erreur serveur',
        details: error.message
      })
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}