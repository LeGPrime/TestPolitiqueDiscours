// pages/api/top-matches-enhanced.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

interface TopMatchesResponse {
  topOfAllTime: any[]
  hotThisWeek: any[]
  byLeague: Record<string, any[]>
  bySport: Record<string, {
    total: number
    matches: any[]
    topRated: any
  }>
  stats: {
    totalMatches: number
    totalRatings: number
    averageRating: number
    mostActiveWeek: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { period = 'all-time' } = req.query

    // Calculer les dates selon la période
    const now = new Date()
    let startDate: Date | undefined

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all-time':
      default:
        startDate = undefined
        break
    }

    // Construire la clause WHERE pour la période
    const periodFilter = startDate ? {
      date: {
        gte: startDate
      }
    } : {}

    // 1. TOP DE TOUS LES TEMPS (ou de la période)
    const topOfAllTime = await prisma.match.findMany({
      where: {
        totalRatings: { gte: 3 }, // Au moins 3 notes
        avgRating: { gte: 3.0 }, // Note moyenne décente
        ...periodFilter
      },
      orderBy: [
        { avgRating: 'desc' },
        { totalRatings: 'desc' }
      ],
      take: 10,
      include: {
        ratings: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, username: true, image: true }
            }
          }
        }
      }
    })

    // 2. HOT CETTE SEMAINE (par activité récente)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const hotThisWeek = await prisma.match.findMany({
      where: {
        ratings: {
          some: {
            createdAt: {
              gte: oneWeekAgo
            }
          }
        }
      },
      orderBy: [
        { totalRatings: 'desc' },
        { avgRating: 'desc' }
      ],
      take: 8,
      include: {
        ratings: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, username: true, image: true }
            }
          }
        }
      }
    })

    // 3. GROUPER PAR SPORT
    const allMatchesBySport = await prisma.match.groupBy({
      by: ['sport'],
      where: {
        totalRatings: { gte: 1 },
        ...periodFilter
      },
      _count: { sport: true },
      _avg: { avgRating: true }
    })

    const bySport: Record<string, any> = {}

    for (const sportGroup of allMatchesBySport) {
      const sport = sportGroup.sport
      
      // Récupérer les meilleurs matchs pour ce sport
      const sportMatches = await prisma.match.findMany({
        where: {
          sport: sport,
          totalRatings: { gte: 2 },
          ...periodFilter
        },
        orderBy: [
          { avgRating: 'desc' },
          { totalRatings: 'desc' }
        ],
        take: 6,
        include: {
          ratings: {
            take: 2,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, username: true }
              }
            }
          }
        }
      })

      bySport[sport] = {
        total: sportGroup._count.sport,
        matches: sportMatches,
        topRated: sportMatches[0] || null,
        avgRating: sportGroup._avg.avgRating || 0
      }
    }

    // 4. GROUPER PAR LIGUE/COMPÉTITION
    const byLeagueData = await prisma.match.groupBy({
      by: ['competition'],
      where: {
        totalRatings: { gte: 2 },
        ...periodFilter
      },
      _count: { competition: true },
      _avg: { avgRating: true },
      orderBy: {
        _avg: {
          avgRating: 'desc'
        }
      },
      take: 10
    })

    const byLeague: Record<string, any[]> = {}

    for (const leagueGroup of byLeagueData) {
      const competition = leagueGroup.competition
      
      const leagueMatches = await prisma.match.findMany({
        where: {
          competition: competition,
          totalRatings: { gte: 2 },
          ...periodFilter
        },
        orderBy: [
          { avgRating: 'desc' },
          { totalRatings: 'desc' }
        ],
        take: 6,
        include: {
          ratings: {
            take: 2,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, username: true }
              }
            }
          }
        }
      })

      if (leagueMatches.length > 0) {
        byLeague[competition] = leagueMatches
      }
    }

    // 5. STATS GLOBALES
    const totalMatchesCount = await prisma.match.count({
      where: {
        totalRatings: { gte: 1 },
        ...periodFilter
      }
    })

    const totalRatingsSum = await prisma.rating.count({
      where: {
        match: periodFilter.date ? {
          date: periodFilter.date
        } : undefined
      }
    })

    const avgRatingData = await prisma.match.aggregate({
      where: {
        totalRatings: { gte: 1 },
        ...periodFilter
      },
      _avg: {
        avgRating: true
      }
    })

    // Ajouter les tendances (nouveau vs ancien)
    const addTrendDirection = (matches: any[]) => {
      return matches.map((match) => {
        // Simple logique : si plus de notes récentes, c'est "up"
        const recentRatings = match.ratings?.filter((r: any) => 
          new Date(r.createdAt) > oneWeekAgo
        ).length || 0
        
        const trendDirection = 
          recentRatings >= 2 ? 'up' : 
          recentRatings === 1 ? 'stable' : 
          'down'
        
        return {
          ...match,
          trendDirection
        }
      })
    }

    const result: TopMatchesResponse = {
      topOfAllTime: addTrendDirection(topOfAllTime),
      hotThisWeek: addTrendDirection(hotThisWeek),
      bySport,
      byLeague,
      stats: {
        totalMatches: totalMatchesCount,
        totalRatings: totalRatingsSum,
        averageRating: avgRatingData._avg.avgRating || 0,
        mostActiveWeek: 'Cette semaine' // Placeholder
      }
    }

    console.log(`📊 Top Matches API - ${period}:`)
    console.log(`   Top all time: ${result.topOfAllTime.length}`)
    console.log(`   Hot this week: ${result.hotThisWeek.length}`)
    console.log(`   Sports: ${Object.keys(result.bySport).length}`)
    console.log(`   Leagues: ${Object.keys(result.byLeague).length}`)
    console.log(`   Total matches: ${result.stats.totalMatches}`)
    console.log(`   Total ratings: ${result.stats.totalRatings}`)

    res.status(200).json(result)

  } catch (error) {
    console.error('❌ Erreur API top-matches-enhanced:', error)
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}