// pages/api/search.ts - MISE À JOUR avec support combattants MMA
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (req.method === 'GET') {
    try {
      const { q, type = 'all', sport } = req.query

      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.status(400).json({ error: 'La recherche doit contenir au moins 2 caractères' })
      }

      console.log(`🔍 Recherche locale pour: "${q}" (sport: ${sport || 'all'}, type: ${type})`)

      const results: any = {
        matches: [],
        users: [],
        fighters: [] // 🆕 NOUVEAU
      }

      // 🆕 Rechercher des combattants MMA si pertinent
      if ((type === 'all' || type === 'fighters') && (!sport || sport === 'all' || sport === 'mma')) {
        try {
          console.log(`🥊 Recherche de combattants MMA...`)
          const fightersResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/fighters/search?q=${encodeURIComponent(q)}&limit=10`)
          
          if (fightersResponse.data.success) {
            results.fighters = fightersResponse.data.fighters || []
            
            // Ajouter aussi les combats trouvés aux résultats de matchs
            if (fightersResponse.data.matches && fightersResponse.data.matches.length > 0) {
              results.matches.push(...fightersResponse.data.matches)
            }
            
            console.log(`✅ ${results.fighters.length} combattants MMA trouvés`)
          }
        } catch (error) {
          console.error('⚠️ Erreur recherche combattants MMA:', error)
          // Continue sans les combattants
        }
      }

      // Rechercher des matchs dans notre base uniquement
      if (type === 'all' || type === 'matches') {
        // Construire le filtre sport
        let sportFilter = {}
        
        if (sport && sport !== 'all') {
          if (sport === 'football') {
            sportFilter = {
              sport: 'FOOTBALL'
            }
          } else if (sport === 'basketball') {
            sportFilter = {
              sport: 'BASKETBALL'
            }
          } else if (sport === 'mma') {
            sportFilter = {
              sport: 'MMA'
            }
          } else {
            // Pour autres sports, essayer de mapper
            sportFilter = {
              sport: sport.toString().toUpperCase()
            }
          }
        }

        const dbMatches = await prisma.match.findMany({
          where: {
            AND: [
              {
                OR: [
                  { homeTeam: { contains: q, mode: 'insensitive' } },
                  { awayTeam: { contains: q, mode: 'insensitive' } },
                  { competition: { contains: q, mode: 'insensitive' } }
                ]
              },
              { status: 'FINISHED' },
              sportFilter // 🆕 Filtre sport ajouté
            ]
          },
          include: {
            ratings: {
              include: {
                user: {
                  select: { id: true, name: true, username: true }
                }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 20
        })

        // Éviter les doublons avec les matchs MMA déjà ajoutés
        const existingMatchIds = new Set(results.matches.map((m: any) => m.id))
        
        const newMatches = dbMatches
          .filter(match => !existingMatchIds.has(match.id))
          .map(match => ({
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeTeamLogo: match.homeTeamLogo,
            awayTeamLogo: match.awayTeamLogo,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            date: match.date.toISOString(),
            status: match.status,
            competition: match.competition,
            venue: match.venue,
            avgRating: match.avgRating,
            totalRatings: match.totalRatings,
            ratings: match.ratings,
            canRate: true,
            sport: getSportFromEnum(match.sport) // 🆕 Conversion enum -> string
          }))

        results.matches.push(...newMatches)

        console.log(`✅ ${newMatches.length} matchs supplémentaires trouvés (sport: ${sport || 'all'})`)
      }

      // Rechercher des utilisateurs (inchangé)
      if (type === 'all' || type === 'users') {
        if (session?.user?.id) {
          const users = await prisma.user.findMany({
            where: {
              AND: [
                { id: { not: session.user.id } },
                {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { username: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } }
                  ]
                }
              ]
            },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              bio: true,
              _count: {
                select: { ratings: true }
              }
            },
            take: 15
          })

          // Vérifier le statut d'amitié
          const usersWithFriendshipStatus = await Promise.all(
            users.map(async (user) => {
              const friendship = await prisma.friendship.findFirst({
                where: {
                  OR: [
                    { senderId: session.user.id, receiverId: user.id },
                    { senderId: user.id, receiverId: session.user.id }
                  ]
                }
              })

              let friendshipStatus = 'none'
              let friendshipId = null

              if (friendship) {
                friendshipId = friendship.id
                if (friendship.status === 'ACCEPTED') {
                  friendshipStatus = 'friends'
                } else if (friendship.senderId === session.user.id) {
                  friendshipStatus = 'sent'
                } else {
                  friendshipStatus = 'received'
                }
              }

              return {
                ...user,
                totalRatings: user._count.ratings,
                friendshipStatus,
                friendshipId
              }
            })
          )

          results.users = usersWithFriendshipStatus
          console.log(`✅ ${results.users.length} utilisateurs trouvés`)
        }
      }

      // 🆕 Log final pour debug
      console.log(`📊 Résultats finaux de recherche:`)
      console.log(`- Matchs: ${results.matches.length}`)
      console.log(`- Combattants MMA: ${results.fighters.length}`)
      console.log(`- Utilisateurs: ${results.users.length}`)

      res.status(200).json(results)
    } catch (error) {
      console.error('Erreur recherche:', error)
      res.status(500).json({ error: 'Erreur serveur', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

// 🆕 Fonction pour convertir l'enum Sport en string
function getSportFromEnum(sportEnum: string): string {
  const sportMap: Record<string, string> = {
    'FOOTBALL': 'football',
    'BASKETBALL': 'basketball', 
    'MMA': 'mma',
    'RUGBY': 'rugby',
    'F1': 'f1'
  }
  
  return sportMap[sportEnum] || sportEnum.toLowerCase()
}