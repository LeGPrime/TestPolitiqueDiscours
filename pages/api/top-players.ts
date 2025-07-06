import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        period = 'all-time', 
        sortBy = 'rating', 
        limit = '50',
        sport = 'all'
      } = req.query

      // Filtre par période pour les ratings
      let dateFilter = {}
      const now = new Date()
      
      switch (period) {
        case 'this-week':
          const weekAgo = new Date()
          weekAgo.setDate(now.getDate() - 7)
          dateFilter = { createdAt: { gte: weekAgo } }
          break
        case 'this-month':
          const monthAgo = new Date()
          monthAgo.setMonth(now.getMonth() - 1)
          dateFilter = { createdAt: { gte: monthAgo } }
          break
        case 'this-year':
          const yearAgo = new Date()
          yearAgo.setFullYear(now.getFullYear() - 1)
          dateFilter = { createdAt: { gte: yearAgo } }
          break
        default: // 'all-time'
          break
      }

      // Filtre par sport
      let sportFilter = {}
      if (sport !== 'all') {
        sportFilter = { sport: sport.toString().toUpperCase() }
      }

      // Récupérer les joueurs avec leurs ratings moyens
      const playersWithRatings = await prisma.player.findMany({
        where: {
          ...sportFilter,
          ratings: {
            some: dateFilter // Au moins un rating dans la période
          }
        },
        include: {
          ratings: {
            where: dateFilter,
            include: {
              user: {
                select: { id: true, name: true, username: true, image: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Derniers 5 ratings pour preview
          }
        }
      })

      // Calculer les stats pour chaque joueur
      const playersWithStats = playersWithRatings.map(player => {
        const ratings = player.ratings
        const totalRatings = ratings.length
        const avgRating = totalRatings > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
          : 0

        return {
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          sport: player.sport,
          avgRating: Math.round(avgRating * 10) / 10, // Arrondir à 1 décimale
          totalRatings,
          ratings: ratings.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            user: r.user
          }))
        }
      })

      // Filtrer les joueurs avec au moins 1 rating
      const validPlayers = playersWithStats.filter(p => p.totalRatings > 0)

      // Trier selon le critère
      let sortedPlayers = [...validPlayers]
      switch (sortBy) {
        case 'popularity':
          sortedPlayers.sort((a, b) => {
            if (b.totalRatings !== a.totalRatings) {
              return b.totalRatings - a.totalRatings
            }
            return b.avgRating - a.avgRating
          })
          break
        case 'recent':
          // Trier par rating le plus récent
          sortedPlayers.sort((a, b) => {
            const aLatest = a.ratings[0]?.createdAt || 0
            const bLatest = b.ratings[0]?.createdAt || 0
            return bLatest - aLatest
          })
          break
        default: // 'rating'
          sortedPlayers.sort((a, b) => {
            if (Math.abs(b.avgRating - a.avgRating) < 0.1) {
              return b.totalRatings - a.totalRatings
            }
            return b.avgRating - a.avgRating
          })
          break
      }

      // Limiter les résultats
      const topPlayers = sortedPlayers.slice(0, parseInt(limit as string))

      // Stats globales
      const totalPlayersCount = validPlayers.length
      const totalVotes = validPlayers.reduce((sum, p) => sum + p.totalRatings, 0)
      const averageRating = validPlayers.length > 0 
        ? validPlayers.reduce((sum, p) => sum + p.avgRating, 0) / validPlayers.length 
        : 0

      console.log(`⭐ Top Players API called:`)
      console.log(`   Period: ${period}`)
      console.log(`   Sport: ${sport}`)
      console.log(`   Sort: ${sortBy}`)
      console.log(`   Found: ${topPlayers.length} players`)
      console.log(`   Total votes: ${totalVotes}`)

      res.status(200).json({ 
        players: topPlayers,
        stats: {
          totalPlayers: totalPlayersCount,
          totalVotes: totalVotes,
          averageRating: Math.round(averageRating * 10) / 10
        }
      })
    } catch (error) {
      console.error('❌ Erreur top joueurs:', error)
      res.status(500).json({ 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}