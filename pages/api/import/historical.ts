import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { apiSportsService, LEAGUES, APISportsMatch } from '../../../lib/football-api'

// Plan d'import progressif (FREE-friendly)
const IMPORT_PHASES = [
  // 2023
  { league: LEAGUES.PREMIER_LEAGUE, season: 2023, name: 'Premier League 2023' },
  { league: LEAGUES.LIGUE_1, season: 2023, name: 'Ligue 1 2023' },
  { league: LEAGUES.BUNDESLIGA, season: 2023, name: 'Bundesliga 2023' },
  { league: LEAGUES.SERIE_A, season: 2023, name: 'Serie A 2023' },
  { league: LEAGUES.LA_LIGA, season: 2023, name: 'La Liga 2023' },
  { league: LEAGUES.CHAMPIONS_LEAGUE, season: 2023, name: 'Champions League 2023' },
  
  // 2024
  { league: LEAGUES.PREMIER_LEAGUE, season: 2024, name: 'Premier League 2024' },
  { league: LEAGUES.LIGUE_1, season: 2024, name: 'Ligue 1 2024' },
  { league: LEAGUES.BUNDESLIGA, season: 2024, name: 'Bundesliga 2024' },
  { league: LEAGUES.SERIE_A, season: 2024, name: 'Serie A 2024' },
  { league: LEAGUES.LA_LIGA, season: 2024, name: 'La Liga 2024' },
  { league: LEAGUES.CHAMPIONS_LEAGUE, season: 2024, name: 'Champions League 2024' },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method === 'POST') {
    try {
      const { phase, action } = req.body

      if (action === 'status') {
        // Retourner le statut d'import
        const importStatus = await prisma.match.groupBy({
          by: ['competition', 'season'],
          _count: {
            id: true
          }
        })

        const quota = apiSportsService.getQuotaStatus()

        return res.json({
          quota,
          phases: IMPORT_PHASES,
          imported: importStatus,
          totalPhases: IMPORT_PHASES.length
        })
      }

      if (action === 'import_phase') {
        const phaseIndex = parseInt(phase)
        
        if (phaseIndex < 0 || phaseIndex >= IMPORT_PHASES.length) {
          return res.status(400).json({ error: 'Phase invalide' })
        }

        const currentPhase = IMPORT_PHASES[phaseIndex]
        
        console.log(`🚀 Import Phase ${phaseIndex + 1}/${IMPORT_PHASES.length}: ${currentPhase.name}`)

        // Vérifier le quota
        const quota = apiSportsService.getQuotaStatus()
        if (quota.remaining < 1) {
          return res.status(429).json({ 
            error: 'Quota quotidien atteint',
            quota 
          })
        }

        // Récupérer les matchs de cette phase
        const matches = await apiSportsService.getSeasonMatches(
          currentPhase.league, 
          currentPhase.season
        )

        console.log(`📊 ${matches.length} matchs récupérés pour ${currentPhase.name}`)

        // Convertir et sauvegarder en base
        let importedCount = 0
        let skippedCount = 0

        for (const apiMatch of matches) {
          try {
            // Vérifier si le match existe déjà
            const existing = await prisma.match.findUnique({
              where: { apiMatchId: apiMatch.fixture.id }
            })

            if (existing) {
              skippedCount++
              continue
            }

            // Créer le match
            await prisma.match.create({
              data: {
                apiMatchId: apiMatch.fixture.id,
                homeTeam: apiMatch.teams.home.name,
                awayTeam: apiMatch.teams.away.name,
                homeScore: apiMatch.goals.home,
                awayScore: apiMatch.goals.away,
                date: new Date(apiMatch.fixture.date),
                status: apiMatch.fixture.status.short === 'FT' ? 'FINISHED' : apiMatch.fixture.status.short,
                competition: apiMatch.league.name,
                season: currentPhase.season.toString(),
                venue: apiMatch.fixture.venue?.name,
                homeTeamLogo: apiMatch.teams.home.logo,
                awayTeamLogo: apiMatch.teams.away.logo,
              }
            })

            importedCount++
          } catch (error) {
            console.error(`❌ Erreur import match ${apiMatch.fixture.id}:`, error)
          }
        }

        console.log(`✅ Phase ${phaseIndex + 1} terminée: ${importedCount} importés, ${skippedCount} skippés`)

        res.json({
          success: true,
          phase: phaseIndex + 1,
          totalPhases: IMPORT_PHASES.length,
          phaseName: currentPhase.name,
          matchesFound: matches.length,
          imported: importedCount,
          skipped: skippedCount,
          quota: apiSportsService.getQuotaStatus(),
          nextPhase: phaseIndex + 1 < IMPORT_PHASES.length ? phaseIndex + 1 : null
        })

      } else if (action === 'import_daily') {
        // Import quotidien (matchs terminés hier)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const dateStr = yesterday.toISOString().split('T')[0]

        const matches = await apiSportsService.getFinishedMatchesByDate(dateStr)
        
        let importedCount = 0
        for (const apiMatch of matches) {
          try {
            await prisma.match.upsert({
              where: { apiMatchId: apiMatch.fixture.id },
              update: {
                homeScore: apiMatch.goals.home,
                awayScore: apiMatch.goals.away,
                status: 'FINISHED'
              },
              create: {
                apiMatchId: apiMatch.fixture.id,
                homeTeam: apiMatch.teams.home.name,
                awayTeam: apiMatch.teams.away.name,
                homeScore: apiMatch.goals.home,
                awayScore: apiMatch.goals.away,
                date: new Date(apiMatch.fixture.date),
                status: 'FINISHED',
                competition: apiMatch.league.name,
                season: new Date().getFullYear().toString(),
                venue: apiMatch.fixture.venue?.name,
                homeTeamLogo: apiMatch.teams.home.logo,
                awayTeamLogo: apiMatch.teams.away.logo,
              }
            })
            importedCount++
          } catch (error) {
            console.error(`❌ Erreur import quotidien:`, error)
          }
        }

        res.json({
          success: true,
          date: dateStr,
          matchesFound: matches.length,
          imported: importedCount,
          quota: apiSportsService.getQuotaStatus()
        })
      }

    } catch (error: any) {
      console.error('❌ Erreur import historique:', error)
      res.status(500).json({ 
        error: error.message,
        quota: apiSportsService.getQuotaStatus()
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
