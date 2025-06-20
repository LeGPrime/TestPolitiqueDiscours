import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { apiSportsService, LEAGUES } from '../../lib/football-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 IMPORT MEGA HISTORIQUE - 4 ANS DE DONNÉES...')
    console.log('📅 Saisons: 2021, 2022, 2023, 2024')
    console.log('🏆 Toutes les grandes compétitions européennes + internationales')
    console.log('⏱️  Temps estimé: 45-60 minutes (soyez patient !)')
    
    // Toutes les compétitions à importer
    const targetLeagues = {
      // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
      'Premier League': LEAGUES.PREMIER_LEAGUE,      // 39
      
      // 🇪🇸 La Liga
      'La Liga': LEAGUES.LA_LIGA,                    // 140
      
      // 🇮🇹 Serie A
      'Serie A': LEAGUES.SERIE_A,                    // 135
      
      // 🇩🇪 Bundesliga
      'Bundesliga': LEAGUES.BUNDESLIGA,              // 78
      
      // 🇫🇷 Ligue 1
      'Ligue 1': LEAGUES.LIGUE_1,                    // 61
      
      // 🏆 Compétitions européennes
      'Champions League': LEAGUES.CHAMPIONS_LEAGUE,  // 2
      'Europa League': LEAGUES.EUROPA_LEAGUE,        // 3
      
      // 🌍 International
      'Euro Championship': LEAGUES.EURO,            // 4
      'World Cup': LEAGUES.WORLD_CUP,               // 1
      
      // 🇺🇸🇸🇦 Autres grandes ligues
      'MLS': LEAGUES.MLS,                           // 253
      'Saudi Pro League': LEAGUES.LIGUE_ARABE       // 307
    }

    // 5 saisons complètes
    const seasons = [2021, 2022, 2023, 2024, 2025]
    
    let totalImported = 0
    const summary = {}
    const errors = []
    
    // Pour chaque saison
    for (const season of seasons) {
      console.log(`\n🗓️  === SAISON ${season} ===`)
      summary[season] = {}
      
      // Pour chaque compétition
      for (const [leagueName, leagueId] of Object.entries(targetLeagues)) {
        try {
          console.log(`\n📊 Import ${leagueName} ${season}...`)
          
          // Récupérer TOUS les matchs de cette saison/compétition
          const matches = await apiSportsService.getSeasonMatches(leagueId, season)
          console.log(`  📈 ${matches.length} matchs trouvés`)
          
          let leagueSeasonImported = 0
          let processed = 0
          
          for (const match of matches) {
            processed++
            
            try {
              // Vérifier si le match existe déjà
              const existing = await prisma.match.findUnique({
                where: { apiMatchId: match.fixture.id }
              })

              // Importer seulement les matchs terminés et non existants
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
                    season: season.toString(),
                    venue: match.fixture.venue?.name,
                    homeTeamLogo: match.teams.home.logo,
                    awayTeamLogo: match.teams.away.logo,
                  }
                })
                
                leagueSeasonImported++
                
                // Log des gros matchs pour suivre le progrès
                if (isImportantMatch(match.teams.home.name, match.teams.away.name)) {
                  console.log(`      ⭐ ${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name} (${new Date(match.fixture.date).toLocaleDateString()})`)
                }
              }
              
              // Progress indicator
              if (processed % 50 === 0) {
                console.log(`    📊 Progression: ${processed}/${matches.length} (${leagueSeasonImported} importés)`)
              }
              
            } catch (matchError) {
              console.error(`    ❌ Erreur match ${match.fixture.id}:`, matchError)
              errors.push(`${leagueName} ${season}: Match ${match.fixture.id}`)
            }
          }
          
          summary[season][leagueName] = leagueSeasonImported
          totalImported += leagueSeasonImported
          console.log(`  ✅ ${leagueName} ${season}: ${leagueSeasonImported} matchs importés`)
          
          // Pause entre compétitions pour ménager l'API
          console.log(`  ⏱️  Pause 3 secondes...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
          
        } catch (leagueError) {
          console.error(`❌ Erreur ${leagueName} ${season}:`, leagueError)
          summary[season][leagueName] = 0
          errors.push(`${leagueName} ${season}: ${leagueError.message}`)
        }
      }
      
      console.log(`\n📊 BILAN SAISON ${season}:`)
      const seasonTotal = Object.values(summary[season]).reduce((sum: number, count: any) => sum + count, 0)
      console.log(`  🎯 Total saison: ${seasonTotal} matchs`)
      
      // Pause plus longue entre saisons
      if (season < seasons[seasons.length - 1]) {
        console.log(`  💤 Pause 10 secondes avant saison suivante...`)
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }
    
    // Statistiques finales complètes
    console.log(`\n🎉 IMPORT MEGA HISTORIQUE TERMINÉ !`)
    console.log(`🏆 TOTAL FINAL: ${totalImported} matchs sur 4 ans`)
    
    console.log(`\n📈 BILAN PAR SAISON:`)
    seasons.forEach(season => {
      const seasonTotal = Object.values(summary[season]).reduce((sum: number, count: any) => sum + count, 0)
      console.log(`  ${season}: ${seasonTotal} matchs`)
    })
    
    console.log(`\n🏟️  BILAN PAR COMPÉTITION (toutes saisons):`)
    Object.keys(targetLeagues).forEach(league => {
      const leagueTotal = seasons.reduce((sum, season) => sum + (summary[season][league] || 0), 0)
      console.log(`  ${getLeagueEmoji(league)} ${league}: ${leagueTotal} matchs`)
    })
    
    // Calculer des stats impressionnantes
    const finalStats = await calculateMegaStats()
    
    res.status(200).json({
      success: true,
      message: '🎉 IMPORT MEGA HISTORIQUE TERMINÉ !',
      totalImported,
      breakdown: {
        bySeason: summary,
        byCompetition: calculateByCompetition(summary, Object.keys(targetLeagues))
      },
      timespan: '2021-2024 (4 saisons complètes)',
      competitions: Object.keys(targetLeagues),
      stats: finalStats,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Max 10 erreurs
      note: 'Base de données complète ! Tous les matchs du Real Madrid, Barcelona, Arsenal, PSG, Bayern Munich etc. depuis 4 ans sont disponibles !'
    })

  } catch (error) {
    console.error('❌ Erreur générale import mega:', error)
    res.status(500).json({
      success: false,
      error: 'Mega import failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Calculer stats par compétition
function calculateByCompetition(summary: any, competitions: string[]) {
  const result = {}
  competitions.forEach(comp => {
    result[comp] = Object.values(summary).reduce((total: number, season: any) => {
      return total + (season[comp] || 0)
    }, 0)
  })
  return result
}

// Détecter les gros matchs pour le suivi
function isImportantMatch(homeTeam: string, awayTeam: string): boolean {
  const bigTeams = [
    // Espagne
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla',
    
    // Angleterre  
    'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham',
    
    // France
    'Paris Saint-Germain', 'Olympique de Marseille', 'AS Monaco', 'Olympique Lyonnais',
    
    // Allemagne
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
    
    // Italie
    'Inter Milan', 'AC Milan', 'Juventus', 'AS Roma', 'Napoli', 'Atalanta',
    
    // MLS
    'Inter Miami', 'LA Galaxy', 'LAFC', 'New York City FC',
    
    // Saudi
    'Al-Nassr', 'Al-Hilal', 'Al-Ittihad', 'Al-Ahli'
  ]
  
  return bigTeams.some(team => homeTeam.includes(team) || awayTeam.includes(team))
}

function getLeagueEmoji(league: string): string {
  const emojis = {
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹', 
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
    'Champions League': '🏆',
    'Europa League': '🥈',
    'Euro Championship': '🇪🇺',
    'World Cup': '🌍',
    'MLS': '🇺🇸',
    'Saudi Pro League': '🇸🇦'
  }
  return emojis[league] || '⚽'
}

// Calculer des statistiques impressionnantes
async function calculateMegaStats() {
  try {
    const [
      totalMatches,
      totalTeams,
      biggestWin,
      mostRatedMatch,
      competitionCounts
    ] = await Promise.all([
      // Total matches
      prisma.match.count(),
      
      // Nombre d'équipes uniques
      prisma.match.groupBy({
        by: ['homeTeam'],
        _count: true
      }),
      
      // Plus grosse victoire
      prisma.match.findFirst({
        where: {
          homeScore: { not: null },
          awayScore: { not: null }
        },
        orderBy: [
          { homeScore: 'desc' },
          { awayScore: 'asc' }
        ],
        select: {
          homeTeam: true,
          awayTeam: true,
          homeScore: true,
          awayScore: true,
          competition: true,
          date: true
        }
      }),
      
      // Match le mieux noté
      prisma.match.findFirst({
        where: { totalRatings: { gt: 0 } },
        orderBy: [
          { avgRating: 'desc' },
          { totalRatings: 'desc' }
        ],
        select: {
          homeTeam: true,
          awayTeam: true,
          homeScore: true,
          awayScore: true,
          avgRating: true,
          totalRatings: true,
          competition: true
        }
      }),
      
      // Répartition par compétition
      prisma.match.groupBy({
        by: ['competition'],
        _count: true,
        orderBy: { _count: { competition: 'desc' } }
      })
    ])

    const goalDifference = biggestWin ? Math.abs((biggestWin.homeScore || 0) - (biggestWin.awayScore || 0)) : 0

    return {
      totalMatches,
      totalTeams: totalTeams.length,
      biggestWin: biggestWin ? {
        match: `${biggestWin.homeTeam} ${biggestWin.homeScore}-${biggestWin.awayScore} ${biggestWin.awayTeam}`,
        difference: goalDifference,
        competition: biggestWin.competition,
        date: biggestWin.date
      } : null,
      bestRatedMatch: mostRatedMatch ? {
        match: `${mostRatedMatch.homeTeam} ${mostRatedMatch.homeScore}-${mostRatedMatch.awayScore} ${mostRatedMatch.awayTeam}`,
        rating: mostRatedMatch.avgRating,
        totalRatings: mostRatedMatch.totalRatings,
        competition: mostRatedMatch.competition
      } : null,
      topCompetitions: competitionCounts.slice(0, 5).map(c => ({
        competition: c.competition,
        matches: c._count
      }))
    }
  } catch (error) {
    console.error('Erreur calcul stats:', error)
    return { error: 'Could not calculate mega stats' }
  }
}