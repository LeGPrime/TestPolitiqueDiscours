import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { apiSportsService } from '../../lib/football-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Import RÉEL avec API-Sports...')
    
    // Récupérer de VRAIS matchs d'hier via ton API-Sports
    const realMatches = await apiSportsService.getYesterdayMatches()
    console.log(`📊 ${realMatches.length} vrais matchs trouvés`)
    
    let imported = 0
    for (const match of realMatches) {
      try {
        // Vérifier si le match existe déjà
        const existing = await prisma.match.findUnique({
          where: { apiMatchId: match.fixture.id }
        })

        if (!existing) {
          await prisma.match.create({
            data: {
              apiMatchId: match.fixture.id,
              homeTeam: match.teams.home.name,
              awayTeam: match.teams.away.name,
              homeScore: match.goals.home || 0,
              awayScore: match.goals.away || 0,
              date: new Date(match.fixture.date),
              status: 'FINISHED',
              competition: match.league.name,
              season: new Date().getFullYear().toString(),
              venue: match.fixture.venue?.name,
              homeTeamLogo: match.teams.home.logo,
              awayTeamLogo: match.teams.away.logo,
            }
          })
          
          imported++
          console.log(`✅ VRAI match importé: ${match.teams.home.name} vs ${match.teams.away.name}`)
        }
      } catch (error) {
        console.error(`❌ Erreur import match:`, error)
      }
    }

    console.log(`✅ Import terminé: ${imported} VRAIS matchs importés`)

    res.status(200).json({
      success: true,
      imported,
      total: realMatches.length,
      message: `✅ ${imported} VRAIS matchs importés depuis API-Sports !`,
      examples: realMatches.slice(0, 3).map(m => 
        `${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}`
      )
    })

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}