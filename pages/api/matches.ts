// pages/api/matches.ts - CORRIGÉ pour supporter MMA
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        type = 'recent', 
        search, 
        days = '14', 
        sport = 'all',
        competition = 'all',
        limit = '50' 
      } = req.query

      console.log(`📊 Recherche dans la base de données locale...`)
      console.log(`🏆 Sport: ${sport}, Compétition: ${competition}, Type: ${type}`)

      // Construire le filtre de base
      const whereClause: any = {
        status: 'FINISHED'
      }

      // 🆕 FILTRE PAR SPORT - CORRECTION MAJEURE
      if (sport && sport !== 'all') {
        // Convertir le sport en format ENUM Prisma (UPPERCASE)
        const sportUpper = sport.toString().toUpperCase()
        console.log(`🔍 Filtrage sport: ${sport} -> ${sportUpper}`)
        whereClause.sport = sportUpper
      }

      // 🆕 FILTRE PAR COMPÉTITION
      if (competition && competition !== 'all') {
        whereClause.competition = competition.toString()
      }

      // Filtrer par recherche si nécessaire
      if (search && typeof search === 'string') {
        console.log(`🔍 Recherche: "${search}"`)
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

      console.log('🔍 Clause WHERE finale:', JSON.stringify(whereClause, null, 2))

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
        take: parseInt(limit as string)
      })

      console.log(`✅ Trouvé ${dbMatches.length} événements dans la base locale`)

      // 🆕 DEBUG - Montrer les sports trouvés
      const sportsFound = [...new Set(dbMatches.map(m => m.sport))]
      console.log(`🏆 Sports trouvés en base:`, sportsFound)

      // Convertir au format attendu avec support multi-sports
      const formattedMatches = dbMatches.map(match => ({
        id: match.id,
        apiId: match.apiMatchId,
        sport: match.sport.toLowerCase(), // 🆕 CONVERSION EN MINUSCULE POUR L'INTERFACE
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
        canRate: true,
        // 🆕 DÉTAILS ENRICHIS PAR SPORT
        details: match.details || null
      }))

      // 🆕 STATISTIQUES PAR SPORT ET COMPÉTITION
      const sportStats = await prisma.match.groupBy({
        by: ['sport'],
        _count: {
          id: true
        },
        where: { 
          status: 'FINISHED',
          ...(competition !== 'all' ? { competition: competition.toString() } : {})
        }
      })

      const competitionStats = await prisma.match.groupBy({
        by: ['competition'],
        _count: {
          id: true
        },
        where: { 
          status: 'FINISHED',
          ...(sport !== 'all' ? { sport: sport.toString().toUpperCase() } : {})
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 20
      })

      // 🆕 DEBUG FINAL
      console.log(`📊 Stats finales:`)
      console.log(`- Total matches: ${formattedMatches.length}`)
      console.log(`- Sports stats:`, sportStats.map(s => `${s.sport}: ${s._count.id}`))
      console.log(`- Sport filter: ${sport}`)
      console.log(`- Matches trouvés par sport:`, formattedMatches.reduce((acc, m) => {
        acc[m.sport] = (acc[m.sport] || 0) + 1
        return acc
      }, {} as Record<string, number>))

      res.status(200).json({ 
        matches: formattedMatches,
        stats: {
          total: formattedMatches.length,
          bySport: sportStats.map(stat => ({
            sport: stat.sport.toLowerCase(), // 🆕 CONVERSION POUR L'INTERFACE
            count: stat._count.id
          })),
          byCompetition: competitionStats.map(stat => ({
            competition: stat.competition,
            count: stat._count.id
          }))
        },
        debug: {
          whereClause,
          foundSports: sportsFound,
          requestedSport: sport
        }
      })
    } catch (error) {
      console.error('❌ Erreur API matchs:', error)
      res.status(500).json({ error: 'Erreur serveur', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}