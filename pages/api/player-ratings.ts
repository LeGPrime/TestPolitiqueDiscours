// pages/api/player-ratings.ts - VERSION AVEC SUPPORT DES COACHS
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

      console.log('📝 Notation reçue:', { playerId, matchId, rating, comment })

      if (!playerId || !matchId || !rating || rating < 1 || rating > 10) {
        return res.status(400).json({ 
          error: 'Données invalides (rating 1-10 requis)',
          received: { playerId, matchId, rating, comment }
        })
      }

      // 🔧 DÉTECTION COACH vs JOUEUR
      const isCoach = playerId.startsWith('COACH_')
      
      // 🔧 EXTRACTION DES INFOS SELON LE TYPE
      let playerName = playerId
      let teamName = 'Unknown Team'
      let position = 'PLAYER'
      
      if (isCoach) {
        // Format coach: "COACH_Nom_Coach_Equipe"
        const coachParts = playerId.replace('COACH_', '').split('_')
        if (coachParts.length >= 2) {
          playerName = coachParts.slice(0, -1).join(' ').replace(/_/g, ' ')
          teamName = coachParts[coachParts.length - 1].replace(/_/g, ' ')
          position = 'COACH'
        }
        console.log('👨‍💼 Coach détecté:', { playerName, teamName, originalId: playerId })
      } else {
        // Format joueur: "Nom_Joueur_Equipe"
        const playerIdParts = playerId.split('_')
        if (playerIdParts.length >= 3) {
          playerName = playerIdParts.slice(0, -1).join(' ').replace(/_/g, ' ')
          teamName = playerIdParts[playerIdParts.length - 1].replace(/_/g, ' ')
        }
        console.log('👤 Joueur détecté:', { playerName, teamName, originalId: playerId })
      }

      // 1. Vérifier/créer la personne dans la base
      let player = await prisma.player.findFirst({
        where: { 
          OR: [
            { id: playerId },
            { 
              name: playerName,
              team: teamName,
              position: isCoach ? 'COACH' : undefined
            }
          ]
        }
      })

      if (!player) {
        console.log(`🆕 Création ${isCoach ? 'coach' : 'joueur'}:`, { playerId, playerName, teamName, position })
        player = await prisma.player.create({
          data: {
            id: playerId,
            name: playerName,
            team: teamName,
            position: position,
            sport: 'FOOTBALL'
          }
        })
      }

      console.log(`${isCoach ? '👨‍💼' : '👤'} ${isCoach ? 'Coach' : 'Joueur'} trouvé/créé:`, player)

      // 2. Créer ou mettre à jour la notation
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

      console.log(`✅ Notation ${isCoach ? 'coach' : 'joueur'} créée/mise à jour:`, playerRating)

      // 3. Recalculer la moyenne
      const allPlayerRatings = await prisma.playerRating.findMany({
        where: { playerId: player.id, matchId }
      })

      const avgRating = allPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / allPlayerRatings.length
      
      console.log(`📊 Nouvelle moyenne pour ${player.name} (${isCoach ? 'coach' : 'joueur'}): ${avgRating.toFixed(1)} (${allPlayerRatings.length} votes)`)

      res.status(200).json({ 
        success: true,
        rating: playerRating, 
        avgRating: Number(avgRating.toFixed(1)), 
        totalRatings: allPlayerRatings.length,
        message: `${player.name} ${isCoach ? '(coach)' : ''} noté ${rating}/10 avec succès !`,
        type: isCoach ? 'coach' : 'player'
      })

    } catch (error) {
      console.error('❌ Erreur notation:', error)
      res.status(500).json({ 
        error: 'Erreur serveur', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }

  } else if (req.method === 'GET') {
    // Récupérer les notations d'un match
    try {
      const { matchId, playerId, type } = req.query

      console.log('📖 Récupération ratings:', { matchId, playerId, type })

      let whereClause: any = {}
      
      if (matchId) {
        whereClause.matchId = matchId as string
      }
      
      if (playerId) {
        whereClause.playerId = playerId as string
      }

      // 🆕 FILTRER PAR TYPE (joueurs vs coachs)
      if (type === 'coaches') {
        whereClause.player = {
          position: 'COACH'
        }
      } else if (type === 'players') {
        whereClause.player = {
          position: {
            not: 'COACH'
          }
        }
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

      // 🔧 SÉPARER JOUEURS ET COACHS DANS LA RÉPONSE
      const playerRatings = ratings.filter(r => r.player.position !== 'COACH')
      const coachRatings = ratings.filter(r => r.player.position === 'COACH')

      console.log(`📊 ${ratings.length} ratings trouvés (${playerRatings.length} joueurs, ${coachRatings.length} coachs)`)

      res.status(200).json({ 
        success: true,
        ratings,
        playerRatings,
        coachRatings,
        count: ratings.length,
        stats: {
          players: playerRatings.length,
          coaches: coachRatings.length,
          total: ratings.length
        }
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