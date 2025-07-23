// pages/api/matches.ts - AVEC PAGINATION POUR MOBILE
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
        days = '365',
        limit = '10', // 🆕 DEFAULT À 10 POUR MOBILE
        page = '1',   // 🆕 NOUVEAU PARAMÈTRE PAGE
        search,
        competition,
        sortBy = 'date'
      } = req.query

      // 🆕 CALCUL PAGINATION
      const limitNum = parseInt(limit as string)
      const pageNum = parseInt(page as string)
      const skip = (pageNum - 1) * limitNum

      console.log(`🔍 API Matches - Filtres reçus:`, { 
        type, sport, days, limit: limitNum, page: pageNum, skip, search, competition, sortBy 
      })

      // Construction du filtre sport
      let sportFilter = {}
      
      if (sport && sport !== 'all') {
        const sportMapping: Record<string, string> = {
          'football': 'FOOTBALL',
          'basketball': 'BASKETBALL',
          'mma': 'MMA',
          'rugby': 'RUGBY',
          'f1': 'F1',
          'tennis': 'TENNIS'
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

      // Filtre par date
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
        const daysBack = parseInt(days as string)
        
        if (daysBack > 0) {
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - daysBack)
          baseFilters.date = {
            gte: daysAgo
          }
          console.log(`📅 Filtre date: depuis ${daysAgo.toLocaleDateString()} (${daysBack} jours)`)
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

      // 🆕 CONFIGURATION DU TRI
      let orderBy: any = { date: 'desc' } // Par défaut : par date
      
      if (sortBy === 'popularity') {
        orderBy = [
          { totalRatings: 'desc' },
          { avgRating: 'desc' },
          { date: 'desc' }
        ]
        console.log(`📊 Tri par popularité activé`)
      } else if (sortBy === 'rating') {
        orderBy = [
          { avgRating: 'desc' },
          { totalRatings: 'desc' },
          { date: 'desc' }
        ]
        console.log(`⭐ Tri par note moyenne activé`)
      } else if (sortBy === 'date') {
        orderBy = { date: 'desc' }
        console.log(`📅 Tri par date activé`)
      }

      // 🆕 REQUÊTE PRINCIPALE AVEC PAGINATION
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
        orderBy,
        skip: skip,        // 🆕 SKIP POUR PAGINATION
        take: limitNum     // 🆕 TAKE POUR LIMIT
      })

      console.log(`✅ ${matches.length} matchs trouvés (page ${pageNum}, skip ${skip}) avec tri: ${sortBy}`)

      // 🆕 COMPTER LE TOTAL POUR SAVOIR S'IL Y A PLUS DE RÉSULTATS
      const totalMatches = await prisma.match.count({
        where: baseFilters
      })

      const hasMore = skip + matches.length < totalMatches
      console.log(`📊 Total: ${totalMatches}, Récupérés: ${matches.length}, HasMore: ${hasMore}`)

      // Debug: Afficher les top matchs selon le tri choisi
      if (sortBy === 'popularity' && matches.length > 0) {
        const top3 = matches.slice(0, 3).map(m => ({
          teams: `${m.homeTeam} vs ${m.awayTeam}`,
          totalRatings: m.totalRatings,
          avgRating: m.avgRating.toFixed(1)
        }))
        console.log(`🏆 Top 3 page ${pageNum} par popularité:`, top3)
      }

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

      // 🆕 STATS SEULEMENT POUR LA PREMIÈRE PAGE (OPTIMISATION)
      let stats = null
      if (pageNum === 1) {
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

        stats = {
          total: totalMatches,
          bySport: convertedSportStats,
          byCompetition: limitedCompetitionStats
        }
      }

      // 🆕 RÉPONSE AVEC PAGINATION
      res.status(200).json({
        matches: formattedMatches,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalMatches / limitNum),
          totalItems: totalMatches,
          itemsPerPage: limitNum,
          hasMore: hasMore,
          hasNext: hasMore,
          hasPrevious: pageNum > 1
        },
        stats: stats, // Null pour les pages > 1
        sortBy: sortBy
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
    'F1': 'f1',
    'TENNIS': 'tennis'
  }
  
  return sportMap[sportEnum] || sportEnum.toLowerCase()
}