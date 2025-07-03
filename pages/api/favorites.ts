// pages/api/favorites.ts - VERSION AVEC DEBUGGING COMPLET
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🚀 API Favorites appelée')
  console.log('Method:', req.method)
  console.log('Body:', req.body)

  try {
    const session = await getServerSession(req, res, authOptions)
    console.log('Session:', session ? 'OK' : 'NONE')

    if (!session?.user?.id) {
      console.log('❌ Pas de session')
      return res.status(401).json({ error: 'Non connecté' })
    }

    console.log('✅ Utilisateur connecté:', session.user.id)

    if (req.method === 'GET') {
      console.log('📖 GET Favorites')
      
      try {
        // Test simple : vérifier si la table existe
        const testQuery = await prisma.$queryRaw`SELECT 1 as test`
        console.log('✅ Base de données accessible:', testQuery)

        // Test : vérifier si le modèle Favorite existe
        const favoriteCount = await prisma.favorite.count()
        console.log('✅ Modèle Favorite accessible, total:', favoriteCount)

        // Récupérer les favoris
        const favorites = await prisma.favorite.findMany({
          where: {
            userId: session.user.id
          },
          take: 10 // Limite pour le debug
        })

        console.log('✅ Favoris trouvés:', favorites.length)

        res.status(200).json({
          favoriteMatches: [],
          favoritePlayers: [],
          counts: { matches: 0, players: 0 },
          debug: {
            totalFavorites: favorites.length,
            userId: session.user.id
          }
        })

      } catch (dbError: any) {
        console.error('❌ Erreur base de données:', dbError)
        return res.status(500).json({
          error: 'Erreur base de données',
          details: dbError.message,
          code: dbError.code,
          favoriteMatches: [],
          favoritePlayers: [],
          counts: { matches: 0, players: 0 }
        })
      }

    } else if (req.method === 'POST') {
      console.log('✏️ POST Favorites')
      
      const { action, type, matchId, playerId } = req.body
      console.log('Action data:', { action, type, matchId, playerId })

      if (!action || !type) {
        console.log('❌ Données manquantes')
        return res.status(400).json({ error: 'Action et type requis' })
      }

      try {
        if (action === 'add') {
          console.log('➕ Ajout favori')

          if (type === 'MATCH' && matchId) {
            console.log('🎯 Ajout match favori:', matchId)

            // Vérifier si le match existe
            const match = await prisma.match.findUnique({
              where: { id: matchId }
            })

            if (!match) {
              console.log('❌ Match non trouvé:', matchId)
              return res.status(404).json({ error: 'Match non trouvé' })
            }

            console.log('✅ Match trouvé:', match.homeTeam, 'vs', match.awayTeam)

            // Créer le favori
            const favorite = await prisma.favorite.create({
              data: {
                userId: session.user.id,
                type: 'MATCH',
                matchId: matchId
              }
            })

            console.log('✅ Favori créé:', favorite.id)
            res.status(200).json({ success: true, message: 'Match ajouté aux favoris', favoriteId: favorite.id })

          } else if (type === 'PLAYER' && playerId) {
            console.log('👤 Ajout joueur favori:', playerId)

            // Vérifier si le joueur existe
            const player = await prisma.player.findUnique({
              where: { id: playerId }
            })

            if (!player) {
              console.log('❌ Joueur non trouvé:', playerId)
              return res.status(404).json({ error: 'Joueur non trouvé' })
            }

            console.log('✅ Joueur trouvé:', player.name)

            // Créer le favori
            const favorite = await prisma.favorite.create({
              data: {
                userId: session.user.id,
                type: 'PLAYER',
                playerId: playerId
              }
            })

            console.log('✅ Favori créé:', favorite.id)
            res.status(200).json({ success: true, message: 'Joueur ajouté aux favoris', favoriteId: favorite.id })

          } else {
            console.log('❌ Données invalides pour ajout')
            return res.status(400).json({ error: 'Données invalides' })
          }

        } else if (action === 'remove') {
          console.log('➖ Suppression favori')

          if (type === 'MATCH' && matchId) {
            const deleted = await prisma.favorite.deleteMany({
              where: {
                userId: session.user.id,
                type: 'MATCH',
                matchId: matchId
              }
            })
            console.log('✅ Matchs supprimés:', deleted.count)
          } else if (type === 'PLAYER' && playerId) {
            const deleted = await prisma.favorite.deleteMany({
              where: {
                userId: session.user.id,
                type: 'PLAYER',
                playerId: playerId
              }
            })
            console.log('✅ Joueurs supprimés:', deleted.count)
          }

          res.status(200).json({ success: true, message: 'Favori supprimé' })

        } else {
          console.log('❌ Action non supportée:', action)
          return res.status(400).json({ error: 'Action non supportée' })
        }

      } catch (actionError: any) {
        console.error('❌ Erreur action:', actionError)
        return res.status(500).json({
          error: 'Erreur lors de l\'action',
          details: actionError.message,
          code: actionError.code,
          action,
          type
        })
      }

    } else {
      console.log('❌ Méthode non autorisée:', req.method)
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }

  } catch (globalError: any) {
    console.error('💥 ERREUR GLOBALE API FAVORITES:', globalError)
    console.error('Stack:', globalError.stack)
    
    res.status(500).json({
      error: 'Erreur serveur globale',
      details: globalError.message,
      code: globalError.code || 'UNKNOWN'
    })
  }
}