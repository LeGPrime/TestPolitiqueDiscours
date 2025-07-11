// pages/api/matches.ts - CORRECTION FILTRE DE DATES
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method === 'GET') {
    try {
      const { 
        type = 'recent', 
        sport = 'all', 
        days = '365', // 🔧 AUGMENTÉ À 365 JOURS PAR DÉFAUT
        limit = '50',
        search,
        competition 
      } = req.query

      console.log(`🔍 API Matches - Filtres reçus:`, { type, sport, days, limit, search, competition })

      // Construction du filtre sport
      let sportFilter = {}
      
      if (sport && sport !== 'all') {
        const sportMapping: Record<string, string> = {
          'football': 'FOOTBALL',
          'basketball': 'BASKETBALL',
          'mma': 'MMA',
          'rugby': 'RUGBY',
          'f1': 'F1'
        }
        
        const mappedSport = sportMapping[sport as string]
        if (mappedSport) {
          sportFilter = { sport: mappedSport }
          console.log(`🎯 Filtre sport appliqué: ${sport} -> ${mappedSport}`)
        }
      }

      // Construction du filtre de base
      const baseFilters: any = {
        status: 'FINISHED',
        ...sportFilter
      }

      // 🔧 FILTRE PAR DATE AMÉLIORÉ
      if (type === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        baseFilters.date = {
          gte: today,
          lt: tomorrow
        }
      } else {
        // 🔧 STRATÉGIE ADAPTATIVE POUR LES DATES
        const daysBack = parseInt(days as string)
        
        if (daysBack > 0) {
          // Si on demande des jours spécifiques, les appliquer
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - daysBack)
          baseFilters.date = {
            gte: daysAgo
          }
          console.log(`📅 Filtre date: depuis ${daysAgo.toLocaleDateString()} (${daysBack} jours)`)
        } else {
          // Si days = 0 ou négatif, ne pas filtrer par date
          console.log(`📅 Pas de filtre date (days=${daysBack})`)
        }
      }

      // Filtre par recherche
      if (search && typeof search === 'string') {
        baseFilters.OR = [
          { homeTeam: { contains: search, mode: 'insensitive' } },
          { awayTeam: { contains: search, mode: 'insensitive' } },
          { competition: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Filtre par compétition
      if (competition && competition !== 'all') {
        baseFilters.competition = competition
      }

      console.log(`🔍 Filtres Prisma appliqués:`, JSON.stringify(baseFilters, null, 2))

      // Requête principale
      const matches = await prisma.match.findMany({
        where: baseFilters,
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
        take: parseInt(limit as string)
      })

      console.log(`✅ ${matches.length} matchs trouvés`)

      // 🔧 DEBUG: Afficher la répartition par sport des résultats
      const sportBreakdown = matches.reduce((acc: any, match) => {
        acc[match.sport] = (acc[match.sport] || 0) + 1
        return acc
      }, {})
      console.log(`📊 Répartition résultats:`, sportBreakdown)

      // Conversion des matchs
      const formattedMatches = matches.map(match => ({
        id: match.id,
        apiId: match.apiMatchId,
        sport: getSportFromEnum(match.sport),
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: match.date.toISOString(),
        status: match.status,
        competition: match.competition,
        venue: match.venue,
        avgRating: match.avgRating,
        totalRatings: match.totalRatings,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        canRate: true,
        ratings: match.ratings,
        details: match.details
      }))

      // Statistiques
      const bySportStats = await prisma.match.groupBy({
        by: ['sport'],
        where: { status: 'FINISHED' },
        _count: { sport: true }
      })

      const byCompetitionStats = await prisma.match.groupBy({
        by: ['competition', 'sport'],
        where: { status: 'FINISHED' },
        _count: { competition: true }
      })

      // Convertir les stats des sports
      const convertedSportStats = bySportStats.map(stat => ({
        sport: getSportFromEnum(stat.sport),
        count: stat._count.sport
      }))

      const limitedCompetitionStats = byCompetitionStats
        .slice(0, 50)
        .map(stat => ({
          competition: stat.competition,
          sport: getSportFromEnum(stat.sport),
          count: stat._count.competition
        }))

      const stats = {
        total: formattedMatches.length,
        bySport: convertedSportStats,
        byCompetition: limitedCompetitionStats
      }

      console.log(`📊 Stats générées:`, stats.bySport)

      res.status(200).json({
        matches: formattedMatches,
        stats
      })

    } catch (error) {
      console.error('❌ Erreur API matches:', error)
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

// Fonction pour convertir l'enum Sport en string
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