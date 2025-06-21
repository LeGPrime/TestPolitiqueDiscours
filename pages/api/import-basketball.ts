import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { apiBasketballService, BASKETBALL_LEAGUES } from '../../lib/basketball-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🏀 Import Basketball démarré...')
    
    const targetLeagues = {
      'NBA': BASKETBALL_LEAGUES.NBA,
      'EuroLeague': BASKETBALL_LEAGUES.EUROLEAGUE,
      'WNBA': BASKETBALL_LEAGUES.WNBA
    }

    const seasons = ['2023-2024', '2024-2025']
    let totalImported = 0

    for (const season of seasons) {
      for (const [leagueName, leagueId] of Object.entries(targetLeagues)) {
        console.log(`🏀 Import ${leagueName} ${season}...`)
        
        const games = await apiBasketballService.getSeasonGames(leagueId, season)
        
        for (const game of games) {
          try {
            const existing = await prisma.match.findUnique({
              where: { apiMatchId: game.id }
            })

            if (!existing && game.status.short === 'FT') {
              await prisma.match.create({
                data: {
                  apiMatchId: game.id,
                  homeTeam: game.teams.home.name,
                  awayTeam: game.teams.away.name,
                  homeScore: game.scores.home.total || 0,
                  awayScore: game.scores.away.total || 0,
                  date: new Date(game.date),
                  status: 'FINISHED',
                  competition: game.league.name,
                  season: game.league.season,
                  venue: `${game.teams.home.name} Arena`,
                  homeTeamLogo: game.teams.home.logo,
                  awayTeamLogo: game.teams.away.logo,
                }
              })
              totalImported++
            }
          } catch (error) {
            console.error(`Erreur match ${game.id}:`, error)
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `🏀 ${totalImported} matchs basketball importés !`,
      totalImported,
      competitions: Object.keys(targetLeagues),
      note: 'Lakers, Celtics, Warriors disponibles pour notation !'
    })

  } catch (error) {
    console.error('Erreur import basketball:', error)
    res.status(500).json({
      success: false,
      error: 'Basketball import failed'
    })
  }
}