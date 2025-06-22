// lib/unified-sports-api.ts
import { prisma } from './prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

// 🏆 APIs SPORTS COMPLÈTES - RapidAPI
const SPORT_APIS = {
  football: 'api-football-v1.p.rapidapi.com',     // ⚽ Football
  basketball: 'api-basketball.p.rapidapi.com',   // 🏀 Basketball  
  mma: 'mma-stats.p.rapidapi.com',              // 🥊 MMA/UFC
  rugby: 'api-rugby.p.rapidapi.com',            // 🏉 Rugby
  f1: 'api-formula-1.p.rapidapi.com'            // 🏎️ Formule 1
}

// 🏆 COMPÉTITIONS PRINCIPALES PAR SPORT
const SPORT_LEAGUES = {
  football: {
    'Premier League': 39,
    'La Liga': 140,
    'Serie A': 135,
    'Bundesliga': 78,
    'Ligue 1': 61,
    'Champions League': 2,
    'Europa League': 3,
    'Euro 2024': 4,
    'World Cup': 1
  },
  basketball: {
    'NBA': 12,
    'EuroLeague': 120,
    'WNBA': 2,
    'NBA Playoffs': 12, // Même ID mais saison playoffs
    'EuroCup': 121
  },
  mma: {
    'UFC': 1,
    'Bellator': 2,
    'ONE Championship': 3,
    'PFL': 4
  },
  rugby: {
    'Six Nations': 1,
    'Rugby World Cup': 2,
    'Top 14': 3,
    'Premiership': 4,
    'URC': 5
  },
  f1: {
    'Formula 1': 1  // Une seule série principale
  }
}

interface UnifiedMatch {
  externalId: string
  sport: 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'
  competition: string
  homeTeam: string
  awayTeam: string
  homeScore: number | string
  awayScore: number | string
  date: Date
  status: string
  venue?: string
  season: string
  // Données enrichies par sport
  details?: any
}

class UnifiedSportsAPI {

  // 🌍 REQUÊTE UNIFIÉE vers toutes les APIs
  private async makeRequest(sport: keyof typeof SPORT_APIS, endpoint: string, params: any = {}) {
    try {
      const host = SPORT_APIS[sport]
      const url = new URL(`https://${host}${endpoint}`)
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })

      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': host,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.response || data.results || data
    } catch (error) {
      console.error(`❌ Erreur API ${sport} (${SPORT_APIS[sport]}):`, error)
      return []
    }
  }

  // ⚽ FOOTBALL COMPLET - Toutes les données
  async importAllFootball(): Promise<number> {
    let total = 0
    console.log('⚽ Import COMPLET Football 2024-2025...')

    for (const [competitionName, leagueId] of Object.entries(SPORT_LEAGUES.football)) {
      console.log(`📊 Import ${competitionName}...`)
      
      for (const season of [2024, 2025]) {
        try {
          console.log(`  📅 Saison ${season}...`)
          
          // 🎯 Récupérer TOUS les matchs avec détails complets
          const fixtures = await this.makeRequest('football', '/v3/fixtures', {
            league: leagueId,
            season: season,
            status: 'FT'
          })

          let imported = 0
          for (const fixture of fixtures.slice(0, 100)) { // Limite pour éviter le spam
            try {
              // 📊 Récupérer les détails complets du match
              const [events, lineups, statistics] = await Promise.all([
                this.makeRequest('football', '/v3/fixtures/events', { fixture: fixture.fixture.id }),
                this.makeRequest('football', '/v3/fixtures/lineups', { fixture: fixture.fixture.id }),
                this.makeRequest('football', '/v3/fixtures/statistics', { fixture: fixture.fixture.id })
              ])

              const match: UnifiedMatch = {
                externalId: `football_${leagueId}_${fixture.fixture.id}`,
                sport: 'football',
                competition: competitionName,
                homeTeam: fixture.teams.home.name,
                awayTeam: fixture.teams.away.name,
                homeScore: fixture.goals.home || 0,
                awayScore: fixture.goals.away || 0,
                date: new Date(fixture.fixture.date),
                status: 'FINISHED',
                venue: fixture.fixture.venue?.name,
                season: season.toString(),
                details: {
                  referee: fixture.fixture.referee,
                  attendance: fixture.fixture.status?.attendance,
                  events: events || [],
                  lineups: lineups || [],
                  statistics: statistics || [],
                  logos: {
                    home: fixture.teams.home.logo,
                    away: fixture.teams.away.logo
                  }
                }
              }

              const saved = await this.saveMatch(match)
              if (saved) imported++
            } catch (error) {
              console.error(`Erreur match football:`, error)
            }
          }

          console.log(`    ✅ ${imported} matchs football importés`)
          total += imported
          await this.sleep(2000) // Pause API
        } catch (error) {
          console.error(`❌ Erreur ${competitionName} ${season}:`, error)
        }
      }
    }

    return total
  }

  // 🏀 BASKETBALL COMPLET - CORRIGÉ avec vraie API
  async importAllBasketball(): Promise<number> {
    let total = 0
    console.log('🏀 Import COMPLET Basketball NBA 2024-2025...')

    // Utiliser les vraies données NBA
    const seasons = ['2023-2024', '2024-2025']
    
    for (const season of seasons) {
      try {
        console.log(`  📅 NBA Saison ${season}...`)
        
        // 🎯 Requête avec la vraie structure API
        const games = await this.makeRequest('basketball', '/games', {
          league: 12, // NBA ID confirmé
          season: season
        })

        console.log(`    📊 ${games.length} matchs NBA trouvés pour ${season}`)

        let imported = 0
        for (const game of games) {
          try {
            // Vérifier que le match est terminé
            if (game.status?.short === 'FT') {
              const match: UnifiedMatch = {
                externalId: `basketball_nba_${game.id}`,
                sport: 'basketball',
                competition: 'NBA',
                homeTeam: game.teams?.home?.name || 'Home',
                awayTeam: game.teams?.away?.name || 'Away',
                homeScore: game.scores?.home?.total || 0,
                awayScore: game.scores?.away?.total || 0,
                date: new Date(game.date),
                status: 'FINISHED',
                venue: game.venue || 'NBA Arena',
                season: season,
                details: {
                  // 📊 Quarters détaillés
                  quarters: {
                    q1: {
                      home: game.scores?.home?.quarter_1 || 0,
                      away: game.scores?.away?.quarter_1 || 0
                    },
                    q2: {
                      home: game.scores?.home?.quarter_2 || 0,
                      away: game.scores?.away?.quarter_2 || 0
                    },
                    q3: {
                      home: game.scores?.home?.quarter_3 || 0,
                      away: game.scores?.away?.quarter_3 || 0
                    },
                    q4: {
                      home: game.scores?.home?.quarter_4 || 0,
                      away: game.scores?.away?.quarter_4 || 0
                    },
                    overtime: game.scores?.home?.over_time ? {
                      home: game.scores.home.over_time,
                      away: game.scores.away.over_time
                    } : null
                  },
                  // 🏀 Logos des équipes
                  logos: {
                    home: game.teams?.home?.logo,
                    away: game.teams?.away?.logo
                  },
                  // ⏰ Infos du match
                  gameTime: game.time,
                  timestamp: game.timestamp,
                  leagueInfo: {
                    name: game.league?.name,
                    logo: game.league?.logo,
                    country: game.league?.country?.name
                  }
                }
              }

              const saved = await this.saveMatch(match)
              if (saved) {
                imported++
                console.log(`      ✅ ${game.teams.home.name} ${game.scores.home.total}-${game.scores.away.total} ${game.teams.away.name}`)
              }
            }
          } catch (error) {
            console.error(`Erreur match basketball ${game.id}:`, error)
          }
        }

        console.log(`    ✅ ${imported} matchs NBA importés pour ${season}`)
        total += imported
        
        // Pause entre saisons
        await this.sleep(3000)
      } catch (error) {
        console.error(`❌ Erreur NBA ${season}:`, error)
      }
    }

    console.log(`🏀 Basketball terminé: ${total} matchs NBA importés`)
    return total
  }


  // 🥊 MMA COMPLET
  async importAllMMA(): Promise<number> {
    let total = 0
    console.log('🥊 Import COMPLET MMA 2024-2025...')

    for (const [organizationName, orgId] of Object.entries(SPORT_LEAGUES.mma)) {
      console.log(`📊 Import ${organizationName}...`)
      
      for (const year of [2024, 2025]) {
        try {
          console.log(`  📅 Année ${year}...`)
          
          const events = await this.makeRequest('mma', '/v1/events', {
            organization: orgId,
            year: year
          })

          let imported = 0
          for (const event of events.slice(0, 30)) {
            try {
              // Récupérer détails des combats
              const fights = await this.makeRequest('mma', '/v1/fights', {
                event: event.id
              })

              for (const fight of fights.slice(0, 5)) { // Top 5 combats par event
                if (fight.status === 'finished') {
                  const match: UnifiedMatch = {
                    externalId: `mma_${orgId}_${fight.id}`,
                    sport: 'mma',
                    competition: organizationName,
                    homeTeam: fight.fighter1?.name || 'Fighter 1',
                    awayTeam: fight.fighter2?.name || 'Fighter 2',
                    homeScore: fight.result?.winner === 1 ? 'W' : 'L',
                    awayScore: fight.result?.winner === 2 ? 'W' : 'L',
                    date: new Date(event.date),
                    status: 'FINISHED',
                    venue: event.venue,
                    season: year.toString(),
                    details: {
                      weightClass: fight.weightClass,
                      method: fight.result?.method,
                      round: fight.result?.round,
                      time: fight.result?.time,
                      referee: fight.referee,
                      titleFight: fight.titleFight || false,
                      fighter1: {
                        ...fight.fighter1,
                        record: fight.fighter1?.record
                      },
                      fighter2: {
                        ...fight.fighter2,
                        record: fight.fighter2?.record
                      }
                    }
                  }

                  const saved = await this.saveMatch(match)
                  if (saved) imported++
                }
              }
            } catch (error) {
              console.error(`Erreur event MMA:`, error)
            }
          }

          console.log(`    ✅ ${imported} combats MMA importés`)
          total += imported
          await this.sleep(3000)
        } catch (error) {
          console.error(`❌ Erreur ${organizationName} ${year}:`, error)
        }
      }
    }

    return total
  }

  // 🏉 RUGBY COMPLET
  async importAllRugby(): Promise<number> {
    let total = 0
    console.log('🏉 Import COMPLET Rugby 2024-2025...')

    for (const [competitionName, leagueId] of Object.entries(SPORT_LEAGUES.rugby)) {
      console.log(`📊 Import ${competitionName}...`)
      
      for (const season of [2024, 2025]) {
        try {
          console.log(`  📅 Saison ${season}...`)
          
          const fixtures = await this.makeRequest('rugby', '/v1/fixtures', {
            league: leagueId,
            season: season,
            status: 'FT'
          })

          let imported = 0
          for (const fixture of fixtures.slice(0, 40)) {
            try {
              // Récupérer détails match rugby
              const matchDetails = await this.makeRequest('rugby', '/v1/fixtures/details', {
                id: fixture.id
              })

              const match: UnifiedMatch = {
                externalId: `rugby_${leagueId}_${fixture.id}`,
                sport: 'rugby',
                competition: competitionName,
                homeTeam: fixture.teams?.home?.name || 'Home',
                awayTeam: fixture.teams?.away?.name || 'Away',
                homeScore: fixture.scores?.home || 0,
                awayScore: fixture.scores?.away || 0,
                date: new Date(fixture.date),
                status: 'FINISHED',
                venue: fixture.venue,
                season: season.toString(),
                details: {
                  halftimeScore: fixture.halftime || {},
                  tries: matchDetails?.tries || [],
                  conversions: matchDetails?.conversions || [],
                  penalties: matchDetails?.penalties || [],
                  cards: matchDetails?.cards || [],
                  referee: fixture.referee,
                  attendance: fixture.attendance,
                  weather: fixture.weather
                }
              }

              const saved = await this.saveMatch(match)
              if (saved) imported++
            } catch (error) {
              console.error(`Erreur match rugby:`, error)
            }
          }

          console.log(`    ✅ ${imported} matchs rugby importés`)
          total += imported
          await this.sleep(2500)
        } catch (error) {
          console.error(`❌ Erreur ${competitionName} ${season}:`, error)
        }
      }
    }

    return total
  }

  // 🏎️ FORMULE 1 COMPLÈTE
  async importAllF1(): Promise<number> {
    let total = 0
    console.log('🏎️ Import COMPLET Formule 1 2024-2025...')

    for (const season of [2024, 2025]) {
      try {
        console.log(`📅 Saison F1 ${season}...`)
        
        // Récupérer toutes les courses
        const races = await this.makeRequest('f1', '/v1/races', {
          season: season
        })

        let imported = 0
        for (const race of races) {
          try {
            // Récupérer résultats détaillés
            const [results, qualifying, practices] = await Promise.all([
              this.makeRequest('f1', '/v1/races/results', { race: race.id }),
              this.makeRequest('f1', '/v1/qualifying', { race: race.id }),
              this.makeRequest('f1', '/v1/practice', { race: race.id })
            ])

            if (results.length > 0) {
              const winner = results[0]
              const podium = results.slice(0, 3)

              const match: UnifiedMatch = {
                externalId: `f1_${season}_${race.id}`,
                sport: 'f1',
                competition: 'Formula 1',
                homeTeam: winner.driver?.name || 'Winner',
                awayTeam: 'Field', // Le reste du plateau
                homeScore: '1st', // Position
                awayScore: `${results.length}`, // Nombre total participants
                date: new Date(race.date),
                status: 'FINISHED',
                venue: race.circuit?.name,
                season: season.toString(),
                details: {
                  grandPrix: race.name,
                  circuit: race.circuit,
                  laps: race.laps,
                  distance: race.distance,
                  podium: podium.map((r: any) => ({
                    position: r.position,
                    driver: r.driver?.name,
                    team: r.team?.name,
                    time: r.time,
                    points: r.points
                  })),
                  fullResults: results.slice(0, 20), // Top 20
                  qualifying: qualifying || [],
                  practices: practices || [],
                  fastestLap: race.fastestLap,
                  weather: race.weather
                }
              }

              const saved = await this.saveMatch(match)
              if (saved) imported++
            }
          } catch (error) {
            console.error(`Erreur course F1:`, error)
          }
        }

        console.log(`    ✅ ${imported} courses F1 importées`)
        total += imported
        await this.sleep(3000)
      } catch (error) {
        console.error(`❌ Erreur F1 ${season}:`, error)
      }
    }

    return total
  }

  // 🚀 IMPORT COMPLET DE TOUS LES SPORTS
  async importEverything(): Promise<{ football: number, basketball: number, mma: number, rugby: number, f1: number, total: number }> {
    console.log('🚀 IMPORT COMPLET - TOUS LES SPORTS 2024-2025')
    console.log('⏱️  Temps estimé : 20-30 minutes...')
    console.log('🏆 Football + Basketball + MMA + Rugby + F1')

    const startTime = Date.now()

    // Import en parallèle pour optimiser
    const [football, basketball, mma, rugby, f1] = await Promise.all([
      this.importAllFootball(),
      this.importAllBasketball(),
      this.importAllMMA(),
      this.importAllRugby(),
      this.importAllF1()
    ])

    const total = football + basketball + mma + rugby + f1
    const duration = Math.round((Date.now() - startTime) / 1000)

    console.log(`\n🎉 IMPORT TERMINÉ en ${duration}s !`)
    console.log(`⚽ Football: ${football} matchs`)
    console.log(`🏀 Basketball: ${basketball} matchs`)
    console.log(`🥊 MMA: ${mma} combats`)
    console.log(`🏉 Rugby: ${rugby} matchs`)
    console.log(`🏎️ F1: ${f1} courses`)
    console.log(`📊 TOTAL: ${total} événements`)

    return { football, basketball, mma, rugby, f1, total }
  }

  // 💾 SAUVEGARDER UN MATCH
  private async saveMatch(match: UnifiedMatch): Promise<boolean> {
    try {
      const existing = await prisma.match.findFirst({
        where: {
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          competition: match.competition,
          date: {
            gte: new Date(match.date.getTime() - 24*60*60*1000),
            lte: new Date(match.date.getTime() + 24*60*60*1000)
          }
        }
      })

      if (existing) return false

      await prisma.match.create({
        data: {
          apiMatchId: Math.floor(Math.random() * 900000) + 100000,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore: typeof match.homeScore === 'number' ? match.homeScore : 0,
          awayScore: typeof match.awayScore === 'number' ? match.awayScore : 0,
          date: match.date,
          status: match.status,
          competition: match.competition,
          season: match.season,
          venue: match.venue,
          homeTeamLogo: match.details?.logos?.home || this.getDefaultLogo(match.homeTeam),
          awayTeamLogo: match.details?.logos?.away || this.getDefaultLogo(match.awayTeam),
          // Stocker les détails en JSON si besoin
          // details: JSON.stringify(match.details)
        }
      })

      return true
    } catch (error) {
      return false
    }
  }

  private getDefaultLogo(teamName: string): string {
    return `https://via.placeholder.com/50x50/007ACC/ffffff?text=${teamName.charAt(0)}`
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 🔄 IMPORT QUOTIDIEN AUTOMATIQUE (dernières 24h)
  async importRecentFinished(): Promise<{ imported: number, sports: string[] }> {
    console.log('🔄 Import automatique des dernières 24h...')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    let totalImported = 0
    const sportsImported: string[] = []

    // Vérifier chaque sport
    try {
      // Football récent
      const footballRecent = await this.makeRequest('football', '/v3/fixtures', {
        date: yesterday.toISOString().split('T')[0],
        status: 'FT'
      })
      
      for (const match of footballRecent.slice(0, 20)) {
        const unified: UnifiedMatch = {
          externalId: `auto_football_${match.fixture.id}`,
          sport: 'football',
          competition: match.league.name,
          homeTeam: match.teams.home.name,
          awayTeam: match.teams.away.name,
          homeScore: match.goals.home || 0,
          awayScore: match.goals.away || 0,
          date: new Date(match.fixture.date),
          status: 'FINISHED',
          venue: match.fixture.venue?.name,
          season: '2024'
        }
        
        if (await this.saveMatch(unified)) {
          totalImported++
          if (!sportsImported.includes('football')) sportsImported.push('football')
        }
      }

      // Même logique pour autres sports...
      // Basketball, MMA, Rugby, F1 récents
      
    } catch (error) {
      console.error('❌ Erreur import automatique:', error)
    }

    return { imported: totalImported, sports: sportsImported }
  }
}

export const unifiedSportsAPI = new UnifiedSportsAPI()