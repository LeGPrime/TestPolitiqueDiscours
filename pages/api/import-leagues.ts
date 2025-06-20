import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { apiSportsService, LEAGUES } from '../../lib/football-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 IMPORT COMPLET DES GRANDES LIGUES EUROPÉENNES 2024...')
    console.log('⚽ Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League')
    console.log('⏱️  Cela peut prendre 10-15 minutes...')
    
    // Les 6 grandes compétitions
    const targetLeagues = {
      'Premier League': LEAGUES.PREMIER_LEAGUE,      // 39
      'La Liga': LEAGUES.LA_LIGA,                    // 140
      'Serie A': LEAGUES.SERIE_A,                    // 135
      'Bundesliga': LEAGUES.BUNDESLIGA,              // 78
      'Ligue 1': LEAGUES.LIGUE_1,                    // 61
      'Champions League': LEAGUES.CHAMPIONS_LEAGUE   // 2
    }
    
    let totalImported = 0
    const summary = {}
    
    for (const [leagueName, leagueId] of Object.entries(targetLeagues)) {
      try {
        console.log(`\n📊 Import ${leagueName} (ID: ${leagueId})...`)
        
        // Récupérer TOUS les matchs de la saison 2024
        const matches = await apiSportsService.getSeasonMatches(leagueId, 2024)
        console.log(`  📅 ${matches.length} matchs trouvés pour ${leagueName}`)
        
        let leagueImported = 0
        for (const match of matches) {
          try {
            // Vérifier si le match existe déjà
            const existing = await prisma.match.findUnique({
              where: { apiMatchId: match.fixture.id }
            })

            if (!existing && match.fixture.status.short === 'FT') {
              await prisma.match.create({
                data: {
                  apiMatchId: match.fixture.id,
                  homeTeam: match.teams.home.name,
                  awayTeam: match.teams.away.name,
                  homeScore: match.goals.home || 0,
                  awayScore: match.goals.away || 0,
                  date: new Date(match.fixture.date),
                  status: 'FINISHED',
                  competition: leagueName,
                  season: '2024',
                  venue: match.fixture.venue?.name,
                  homeTeamLogo: match.teams.home.logo,
                  awayTeamLogo: match.teams.away.logo,
                }
              })
              
              leagueImported++
              
              // Log des gros matchs
              if (isImportantMatch(match.teams.home.name, match.teams.away.name)) {
                console.log(`    ⭐ ${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name}`)
              }
            }
          } catch (error) {
            console.error(`    ❌ Erreur match ${match.fixture.id}:`, error)
          }
        }
        
        summary[leagueName] = leagueImported
        totalImported += leagueImported
        console.log(`  ✅ ${leagueName}: ${leagueImported} matchs importés`)
        
        // Pause entre ligues pour respecter les limites API
        console.log(`  ⏱️  Pause 2 secondes...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`❌ Erreur ${leagueName}:`, error)
        summary[leagueName] = 0
      }
    }
    
    // Statistiques finales
    console.log(`\n🎉 IMPORT TERMINÉ !`)
    console.log(`📊 TOTAL: ${totalImported} matchs importés`)
    Object.entries(summary).forEach(([league, count]) => {
      console.log(`  ${getLeagueEmoji(league)} ${league}: ${count} matchs`)
    })
    
    // Calculer quelques stats intéressantes
    const stats = await calculateStats()
    
    res.status(200).json({
      success: true,
      message: '🎉 Import complet des grandes ligues terminé !',
      totalImported,
      breakdown: summary,
      stats,
      competitions: Object.keys(targetLeagues),
      season: '2024',
      note: 'Tous les matchs du Real Madrid, Arsenal, PSG, Bayern etc. sont maintenant disponibles !'
    })

  } catch (error) {
    console.error('❌ Erreur générale import:', error)
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Détecter les gros matchs pour le log
function isImportantMatch(homeTeam: string, awayTeam: string): boolean {
  const bigTeams = [
    'Real Madrid', 'Barcelona', 'Atletico Madrid',
    'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham',
    'Paris Saint-Germain', 'Olympique de Marseille', 'AS Monaco',
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig',
    'Inter Milan', 'AC Milan', 'Juventus', 'AS Roma', 'Napoli'
  ]
  
  return bigTeams.includes(homeTeam) || bigTeams.includes(awayTeam)
}

function getLeagueEmoji(league: string): string {
  const emojis = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹', 
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
    'Champions League': '🏆'
  }
  return emojis[league] || '⚽'
}

// Calculer des statistiques intéressantes
async function calculateStats() {
  try {
    const totalMatches = await prisma.match.count()
    const totalTeams = await prisma.match.groupBy({
      by: ['homeTeam'],
      _count: true
    })
    
    const topScorers = await prisma.match.findMany({
      orderBy: [
        { homeScore: 'desc' },
        { awayScore: 'desc' }
      ],
      take: 5,
      select: {
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        competition: true,
        date: true
      }
    })
    
    return {
      totalMatches,
      totalTeams: totalTeams.length,
      topMatches: topScorers.map(m => 
        `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} (${m.competition})`
      )
    }
  } catch (error) {
    return { error: 'Could not calculate stats' }
  }
}