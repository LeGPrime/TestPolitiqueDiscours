// pages/api/filter-stats.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Récupération des statistiques de filtres...')

    // Récupérer toutes les compétitions avec leurs comptes
    const competitionStats = await prisma.match.groupBy({
      by: ['competition', 'sport'],
      where: {
        status: 'FINISHED'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Récupérer les statistiques par sport
    const sportStats = await prisma.match.groupBy({
      by: ['sport'],
      where: {
        status: 'FINISHED'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Compter le total de matchs terminés
    const totalMatches = await prisma.match.count({
      where: {
        status: 'FINISHED'
      }
    })

    // Formatter les données pour l'interface
    const competitions = competitionStats.map(stat => ({
      competition: stat.competition,
      sport: stat.sport.toLowerCase(),
      count: stat._count.id
    }))

    const sports = sportStats.map(stat => ({
      sport: stat.sport.toLowerCase(),
      count: stat._count.id
    }))

    console.log(`✅ Stats calculées: ${totalMatches} matchs, ${competitions.length} compétitions, ${sports.length} sports`)

    res.status(200).json({
      success: true,
      total: totalMatches,
      competitions,
      sports,
      summary: {
        totalCompetitions: competitions.length,
        totalSports: sports.length,
        mostPopularCompetition: competitions[0] || null,
        mostPopularSport: sports[0] || null
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération stats filtres:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}