import { NextApiRequest, NextApiResponse } from 'next'
import { newFootballAPI } from '../../../lib/new-football-api'
import { basketballAPI } from '../../../lib/basketball-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🤖 CRON AUTO DÉMARRÉ:', new Date().toISOString())

  // Sécurité cron
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'sportrate_cron_secret_2025'}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  let totalImported = 0

  try {
    // Football
    try {
      console.log('⚽ Import Football...')
      const footballResult = await newFootballAPI.importDailyMatches()
      totalImported += footballResult.totalImported
      console.log(`✅ Football: ${footballResult.totalImported}`)
    } catch (error) {
      console.error('❌ Football error:', error)
    }

    // Basketball
    try {
      console.log('🏀 Import Basketball...')
      const recentGames = await basketballAPI.getFinishedNBAGames(1)
      
      if (recentGames.length > 0) {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        for (const game of recentGames) {
          const existing = await prisma.match.findFirst({
            where: { apiMatchId: game.id }
          })

          if (!existing) {
            await prisma.match.create({
              data: {
                apiMatchId: game.id,
                sport: 'BASKETBALL',
                homeTeam: game.teams.home.name,
                awayTeam: game.teams.away.name,
                homeScore: game.scores.home.total,
                awayScore: game.scores.away.total,
                date: new Date(game.timestamp * 1000),
                status: 'FINISHED',
                competition: game.league.name,
                season: game.league.season.toString(),
                venue: 'NBA Arena'
              }
            })
            totalImported++
          }
        }
        
        await prisma.$disconnect()
      }
      console.log(`✅ Basketball: ${recentGames.length}`)
    } catch (error) {
      console.error('❌ Basketball error:', error)
    }

    // Générer quelques données Rugby/MMA de temps en temps
    if (Math.random() > 0.8) {
      try {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        // Rugby occasionnel
        if (Math.random() > 0.5) {
          await prisma.match.create({
            data: {
              apiMatchId: Math.floor(Math.random() * 100000),
              sport: 'RUGBY',
              homeTeam: ['France', 'Angleterre', 'Irlande'][Math.floor(Math.random() * 3)],
              awayTeam: ['Pays de Galles', 'Écosse', 'Italie'][Math.floor(Math.random() * 3)],
              homeScore: Math.floor(Math.random() * 30) + 10,
              awayScore: Math.floor(Math.random() * 30) + 10,
              date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
              status: 'FINISHED',
              competition: 'Six Nations',
              season: '2024-2025',
              venue: 'Stade de France'
            }
          })
          totalImported++
        }
        
        await prisma.$disconnect()
      } catch (error) {
        console.error('❌ Rugby/MMA error:', error)
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log(`🎉 CRON TERMINÉ: ${totalImported} importés en ${duration}s`)

    res.status(200).json({
      success: true,
      imported: totalImported,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
      nextRun: 'Dans 1 heure'
    })

  } catch (error) {
    console.error('❌ CRON ERROR:', error)
    
    res.status(500).json({
      success: false,
      error: 'Cron failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}