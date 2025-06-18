import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type = 'recent', search, days = '14' } = req.query

      console.log(`📊 Recherche dans la base de données locale...`)

      // Récupérer tous les matchs de notre base de données
      const whereClause: any = {
        status: 'FINISHED'
      }

      // Filtrer par recherche si nécessaire
      if (search && typeof search === 'string') {
        whereClause.OR = [
          { homeTeam: { contains: search, mode: 'insensitive' } },
          { awayTeam: { contains: search, mode: 'insensitive' } },
          { competition: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Filtrer par date si c'est "today"
      if (type === 'today') {
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(endOfDay.getDate() + 1)
        
        whereClause.date = {
          gte: startOfDay,
          lt: endOfDay
        }
      }

      const dbMatches = await prisma.match.findMany({
        where: whereClause,
        include: {
          ratings: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: { ratings: true }
          }
        },
        orderBy: { date: 'desc' },
        take: 50
      })

      console.log(`✅ Trouvé ${dbMatches.length} matchs dans la base locale`)

      // Convertir au format attendu
      const formattedMatches = dbMatches.map(match => ({
        id: match.id,
        apiId: match.apiMatchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: match.date.toISOString(),
        status: match.status,
        competition: match.competition,
        venue: match.venue,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        avgRating: match.avgRating,
        totalRatings: match.totalRatings,
        ratings: match.ratings,
        canRate: true
      }))

      res.status(200).json({ matches: formattedMatches })
    } catch (error) {
      console.error('Erreur API matchs:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
