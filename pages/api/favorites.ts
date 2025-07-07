// pages/api/favorites.ts - VERSION COMPLÈTE AVEC GESTION DES MATCHS FAVORIS
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
        // Récupérer les matchs favoris avec toutes les infos
        const favoriteMatches = await prisma.favorite.findMany({
          where: {
            userId: session.user.id,
            type: 'MATCH'
          },
          include: {
            match: {
              select: {
                id: true,
                sport: true,
                homeTeam: true,
                awayTeam: true,
                homeScore: true,
                awayScore: true,
                date: true,
                competition: true,
                venue: true,
                homeTeamLogo: true,
                awayTeamLogo: true,
                avgRating: true,
                totalRatings: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        // Récupérer les joueurs favoris
        const favoritePlayers = await prisma.favorite.findMany({
          where: {
            userId: session.user.id,
            type: 'PLAYER'
          },
          include: {
            player: {
              select: {
                id: true,
                name: true,
                number: true,
                position: true,
                team: true,
                sport: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        console.log('✅ Favoris récupérés:', {
          matches: favoriteMatches.length,
          players: favoritePlayers.length
        })

        res.status(200).json({
          favoriteMatches: favoriteMatches.map(fav => ({
            id: fav.id,
            addedAt: fav.createdAt,
            match: fav.match
          })),
          favoritePlayers: favoritePlayers.map(fav => ({
            id: fav.id,
            addedAt: fav.createdAt,
            player: fav.player
          })),
          counts: { 
            matches: favoriteMatches.length, 
            players: favoritePlayers.length 
          }
        })

      } catch (dbError: any) {
        console.error('❌ Erreur base de données:', dbError)
        return res.status(500).json({
          error: 'Erreur base de données',
          details: dbError.message,
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

            // Vérifier la limite de matchs favoris (5 max)
            const currentFavoriteMatches = await prisma.favorite.count({
              where: {
                userId: session.user.id,
                type: 'MATCH'
              }
            })

            if (currentFavoriteMatches >= 5) {
              console.log('❌ Limite de 5 matchs favoris atteinte')
              return res.status(400).json({ 
                error: 'Vous ne pouvez avoir que 5 matchs favoris maximum. Supprimez-en un avant d\'en ajouter un nouveau.',
                code: 'LIMIT_REACHED',
                limit: 5,
                current: currentFavoriteMatches
              })
            }

            // Vérifier si le match existe
            const match = await prisma.match.findUnique({
              where: { id: matchId },
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                competition: true,
                date: true
              }
            })

            if (!match) {
              console.log('❌ Match non trouvé:', matchId)
              return res.status(404).json({ error: 'Match non trouvé' })
            }

            console.log('✅ Match trouvé:', match.homeTeam, 'vs', match.awayTeam)

            // Vérifier si déjà en favori
            const existingFavorite = await prisma.favorite.findFirst({
              where: {
                userId: session.user.id,
                type: 'MATCH',
                matchId: matchId
              }
            })

            if (existingFavorite) {
              console.log('❌ Match déjà en favori')
              return res.status(400).json({ 
                error: 'Ce match est déjà dans vos favoris',
                code: 'ALREADY_FAVORITE'
              })
            }

            // Créer le favori
            const favorite = await prisma.favorite.create({
              data: {
                userId: session.user.id,
                type: 'MATCH',
                matchId: matchId
              },
              include: {
                match: {
                  select: {
                    homeTeam: true,
                    awayTeam: true,
                    competition: true
                  }
                }
              }
            })

            console.log('✅ Favori créé:', favorite.id)
            res.status(200).json({ 
              success: true, 
              message: `${favorite.match?.homeTeam} vs ${favorite.match?.awayTeam} ajouté aux favoris ! ⭐`,
              favoriteId: favorite.id,
              remainingSlots: 5 - (currentFavoriteMatches + 1)
            })

          } else if (type === 'PLAYER' && playerId) {
            console.log('👤 Ajout joueur favori:', playerId)

            // Vérifier si le joueur existe
            const player = await prisma.player.findUnique({
              where: { id: playerId },
              select: {
                id: true,
                name: true,
                team: true,
                sport: true
              }
            })

            if (!player) {
              console.log('❌ Joueur non trouvé:', playerId)
              return res.status(404).json({ error: 'Joueur non trouvé' })
            }

            console.log('✅ Joueur trouvé:', player.name)

            // Vérifier si déjà en favori
            const existingFavorite = await prisma.favorite.findFirst({
              where: {
                userId: session.user.id,
                type: 'PLAYER',
                playerId: playerId
              }
            })

            if (existingFavorite) {
              console.log('❌ Joueur déjà en favori')
              return res.status(400).json({ 
                error: 'Ce joueur est déjà dans vos favoris',
                code: 'ALREADY_FAVORITE'
              })
            }

            // Créer le favori
            const favorite = await prisma.favorite.create({
              data: {
                userId: session.user.id,
                type: 'PLAYER',
                playerId: playerId
              },
              include: {
                player: {
                  select: {
                    name: true,
                    team: true
                  }
                }
              }
            })

            console.log('✅ Favori créé:', favorite.id)
            res.status(200).json({ 
              success: true, 
              message: `${favorite.player?.name} (${favorite.player?.team}) ajouté aux favoris ! ⭐`, 
              favoriteId: favorite.id 
            })

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
            
            const remainingFavorites = await prisma.favorite.count({
              where: {
                userId: session.user.id,
                type: 'MATCH'
              }
            })

            res.status(200).json({ 
              success: true, 
              message: 'Match retiré des favoris',
              remainingSlots: 5 - remainingFavorites
            })

          } else if (type === 'PLAYER' && playerId) {
            const deleted = await prisma.favorite.deleteMany({
              where: {
                userId: session.user.id,
                type: 'PLAYER',
                playerId: playerId
              }
            })
            console.log('✅ Joueurs supprimés:', deleted.count)
            res.status(200).json({ success: true, message: 'Joueur retiré des favoris' })

          } else {
            console.log('❌ Données invalides pour suppression')
            return res.status(400).json({ error: 'Données invalides pour la suppression' })
          }

        } else {
          console.log('❌ Action non supportée:', action)
          return res.status(400).json({ error: 'Action non supportée' })
        }

      } catch (actionError: any) {
        console.error('❌ Erreur action:', actionError)
        
        // Gestion des erreurs spécifiques
        if (actionError.code === 'P2002') {
          return res.status(400).json({
            error: 'Ce favori existe déjà',
            code: 'DUPLICATE_FAVORITE'
          })
        }
        
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