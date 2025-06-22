// lib/multi-sports-api.ts
import { prisma } from './prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

// 🌍 CONFIGURATION SPORTS PREMIUM - SAISON 2024-2025 UNIQUEMENT
const SPORTS_APIS = {
  football: {
    host: process.env.RAPIDAPI_HOST_FOOTBALL || 'api-football-v1.p.rapidapi.com',
    endpoint: '/v3',
    season: 2024, // Saison 2024-2025
    leagues: {
      // 🇪🇺 6 LIGUES EUROPÉENNES MAJEURES
      'Premier League': 39,        // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre
      'Ligue 1': 61,              // 🇫🇷 France  
      'Serie A': 135,             // 🇮🇹 Italie
      'Bundesliga': 78,           // 🇩🇪 Allemagne
      'La Liga': 140,             // 🇪🇸 Espagne
      'Primeira Liga': 94,        // 🇵🇹 Portugal
      
      // 🌍 AUTRES LIGUES IMPORTANTES
      'MLS': 253,                 // 🇺🇸 États-Unis
      'Saudi Pro League': 307,    // 🇸🇦 Arabie Saoudite
      
      // 🏆 COMPÉTITIONS EUROPÉENNES
      'Champions League': 2,      // UEFA Champions League
      'Europa League': 3,         // UEFA Europa League
      'Conference League': 848,   // UEFA Conference League
      
      // 🌏 COMPÉTITIONS INTERNATIONALES
      'World Cup': 1,             // Coupe du Monde FIFA
      'Euro Championship': 4,     // Championnat d'Europe
      'Nations League': 5,        // UEFA Nations League
      'World Cup Qualifiers': 14, // Qualifications Coupe du Monde
      'FIFA Club World Cup': 15,  // 🆕 FIFA Club World Cup
    }
  },
  basketball: {
    host: process.env.RAPIDAPI_HOST_BASKETBALL || 'api-basketball.p.rapidapi.com',
    endpoint: '/v1',
    season: '2024-2025',
    leagues: {
      'NBA': 12,                  // 🇺🇸 NBA
      'EuroLeague': 120,          // 🇪🇺 EuroLeague
      'FIBA World Cup': 15,       // 🌍 Coupe du Monde FIBA
      'EuroBasket': 16,           // 🇪🇺 Championnat d'Europe
    }
  },
  mma: {
    host: process.env.RAPIDAPI_HOST_MMA || 'api-football-v1.p.rapidapi.com',
    endpoint: '/v3',
    leagues: {
      'UFC': 1,
    }
  },
  formula1: {
    host: process.env.RAPIDAPI_HOST_FORMULA1 || 'api-formula-1.p.rapidapi.com',
    endpoint: '/v1',
    season: 2024,
    leagues: {
      'Formula 1': 1,
    }
  },
  rugby: {
    host: process.env.RAPIDAPI_HOST_RUGBY || 'api-football-v1.p.rapidapi.com',
    endpoint: '/v3',
    leagues: {
      'Top 14': 1,
      'Six Nations': 2,
      'Rugby World Cup': 3,
      'Champions Cup': 4,
    }
  }
}

type SportType = 'football' | 'basketball' | 'mma' | 'formula1' | 'rugby'

interface UnifiedEvent {
  externalId: string
  sport: SportType
  competition: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  date: Date
  status: string
  venue?: string
  season: string
  eventType: 'match' | 'race' | 'fight' | 'game'
}

class MultiSportsAPI {
  
  // 🌐 REQUÊTE UNIFIÉE VERS TOUTES LES APIs
  private async makeRequest(sport: SportType, endpoint: string, params: any = {}) {
    try {
      const config = SPORTS_APIS[sport]
      const url = new URL(`https://${config.host}${config.endpoint}${endpoint}`)
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })

      console.log(`🔍 API Request: ${sport} - ${endpoint}`)
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': config.host,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${sport}`)
      }

      const data = await response.json()
      return data.response || data.results || data || []
    } catch (error) {
      console.error(`❌ Erreur API ${sport}:`, error)
      return []
    }
  }

  // ⚽ FOOTBALL - SAISON 2024-2025 SEULEMENT
  async importFootball(): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    const season = SPORTS_APIS.football.season
    
    console.log(`⚽ Import Football saison ${season}-${season + 1}...`)
    
    for (const [leagueName, leagueId] of Object.entries(SPORTS_APIS.football.leagues)) {
      try {
        console.log(`  📊 ${leagueName}...`)
        
        const fixtures = await this.makeRequest('football', '/fixtures', {
          league: leagueId,
          season: season,
          status: 'FT' // Seulement les matchs terminés
        })

        console.log(`    ✅ ${fixtures.length} matchs trouvés`)

        for (const fixture of fixtures) {
          events.push({
            externalId: `football_${leagueId}_${fixture.fixture.id}`,
            sport: 'football',
            competition: leagueName,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            date: new Date(fixture.fixture.date),
            status: 'FINISHED',
            venue: fixture.fixture.venue?.name,
            season: `${season}-${season + 1}`,
            eventType: 'match'
          })
        }
      } catch (error) {
        console.error(`❌ Erreur ${leagueName}:`, error)
      }
    }
    
    return events
  }

  // 🏀 BASKETBALL - SAISON 2024-2025 SEULEMENT
  async importBasketball(): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    const season = SPORTS_APIS.basketball.season
    
    console.log(`🏀 Import Basketball saison ${season}...`)
    
    for (const [leagueName, leagueId] of Object.entries(SPORTS_APIS.basketball.leagues)) {
      try {
        console.log(`  📊 ${leagueName}...`)
        
        const games = await this.makeRequest('basketball', '/games', {
          league: leagueId,
          season: season
        })

        const finishedGames = games.filter((game: any) => game.status?.short === 'FT')
        console.log(`    ✅ ${finishedGames.length} matchs terminés trouvés`)

        for (const game of finishedGames) {
          events.push({
            externalId: `basketball_${leagueId}_${game.id}`,
            sport: 'basketball',
            competition: leagueName,
            homeTeam: game.teams?.home?.name || 'Home',
            awayTeam: game.teams?.away?.name || 'Away',
            homeScore: game.scores?.home?.total || 0,
            awayScore: game.scores?.away?.total || 0,
            date: new Date(game.date),
            status: 'FINISHED',
            venue: game.venue,
            season: season,
            eventType: 'game'
          })
        }
      } catch (error) {
        console.error(`❌ Erreur ${leagueName}:`, error)
      }
    }
    
    return events
  }

  // 🥊 MMA - AUCUNE DONNÉE SIMULÉE
  async importMMA(): Promise<UnifiedEvent[]> {
    console.log('🥊 Import UFC réels uniquement...')
    
    // Pas de données simulées - seulement de vraies données API quand disponibles
    console.log('🥊 API UFC non disponible - aucun match importé')
    return []
  }

  // 🏎️ FORMULA 1 - SAISON 2024 SEULEMENT
  async importFormula1(): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    const season = SPORTS_APIS.formula1.season
    
    console.log(`🏎️ Import Formula 1 saison ${season}...`)
    
    try {
      const races = await this.makeRequest('formula1', '/races', {
        season: season
      })

      const finishedRaces = races.filter((race: any) => race.status === 'finished')
      console.log(`    ✅ ${finishedRaces.length} courses terminées trouvées`)

      for (const race of finishedRaces) {
        // En F1, on prend le vainqueur vs le 2ème
        const winner = race.results?.[0]
        const second = race.results?.[1]

        if (winner && second) {
          events.push({
            externalId: `f1_${race.id}`,
            sport: 'formula1',
            competition: 'Formula 1',
            homeTeam: `${winner.driver.firstname} ${winner.driver.lastname}`,
            awayTeam: `${second.driver.firstname} ${second.driver.lastname}`,
            homeScore: 1, // Vainqueur
            awayScore: 0, // 2ème
            date: new Date(race.date),
            status: 'FINISHED',
            venue: race.circuit.name,
            season: season.toString(),
            eventType: 'race'
          })
        }
      }
    } catch (error) {
      console.error('❌ Erreur Formula 1:', error)
    }
    
    return events
  }

  // 🏉 RUGBY - AUCUNE DONNÉE SIMULÉE
  async importRugby(): Promise<UnifiedEvent[]> {
    console.log('🏉 Import Rugby réels uniquement...')
    
    // Pas de données simulées - seulement de vraies données API quand disponibles
    console.log('🏉 API Rugby non disponible - aucun match importé')
    return []
  }

  // 📅 IMPORT QUOTIDIEN - SEULEMENT LES MATCHS D'AUJOURD'HUI
  async importTodaysMatches(): Promise<{
    total: number
    saved: number
    breakdown: Record<SportType, number>
  }> {
    console.log('📅 IMPORT QUOTIDIEN - MATCHS D\'AUJOURD\'HUI')
    
    const today = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    console.log(`🗓️ Date: ${today}`)
    
    let totalSaved = 0
    const breakdown: Record<SportType, number> = {} as any

    // Import des matchs d'aujourd'hui pour chaque sport
    const todaysEvents = await Promise.all([
      this.importTodaysFootball(today),
      this.importTodaysBasketball(today),
      // MMA et Rugby seulement si APIs disponibles
    ])

    const allEvents = todaysEvents.flat()

    // Sauvegarder en base
    for (const event of allEvents) {
      try {
        const saved = await this.saveEvent(event)
        if (saved) {
          totalSaved++
          breakdown[event.sport] = (breakdown[event.sport] || 0) + 1
        }
      } catch (error) {
        console.error(`❌ Erreur sauvegarde ${event.sport}:`, error)
      }
    }

    console.log(`\n📊 IMPORT QUOTIDIEN TERMINÉ`)
    console.log(`✅ ${totalSaved} nouveaux matchs ajoutés`)
    
    return {
      total: allEvents.length,
      saved: totalSaved,
      breakdown
    }
  }

  // ⚽ FOOTBALL AUJOURD'HUI
  private async importTodaysFootball(date: string): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    
    try {
      console.log(`⚽ Recherche matchs football du ${date}...`)
      
      const fixtures = await this.makeRequest('football', '/fixtures', {
        date: date,
        status: 'FT'
      })

      console.log(`    ✅ ${fixtures.length} matchs football terminés trouvés`)

      for (const fixture of fixtures) {
        // Vérifier si c'est une compétition qui nous intéresse
        const competition = Object.keys(SPORTS_APIS.football.leagues).find(
          comp => SPORTS_APIS.football.leagues[comp] === fixture.league.id
        )

        if (competition) {
          events.push({
            externalId: `football_${fixture.league.id}_${fixture.fixture.id}`,
            sport: 'football',
            competition: competition,
            homeTeam: fixture.teams.home.name,
            awayTeam: fixture.teams.away.name,
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            date: new Date(fixture.fixture.date),
            status: 'FINISHED',
            venue: fixture.fixture.venue?.name,
            season: '2024-2025',
            eventType: 'match'
          })
        }
      }
    } catch (error) {
      console.error('❌ Erreur football aujourd\'hui:', error)
    }
    
    return events
  }

  // 🏀 BASKETBALL AUJOURD'HUI
  private async importTodaysBasketball(date: string): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    
    try {
      console.log(`🏀 Recherche matchs basketball du ${date}...`)
      
      const games = await this.makeRequest('basketball', '/games', {
        date: date
      })

      const finishedGames = games.filter((game: any) => game.status?.short === 'FT')
      console.log(`    ✅ ${finishedGames.length} matchs basketball terminés trouvés`)

      for (const game of finishedGames) {
        // Vérifier si c'est une compétition qui nous intéresse
        const competition = Object.keys(SPORTS_APIS.basketball.leagues).find(
          comp => SPORTS_APIS.basketball.leagues[comp] === game.league.id
        )

        if (competition) {
          events.push({
            externalId: `basketball_${game.league.id}_${game.id}`,
            sport: 'basketball',
            competition: competition,
            homeTeam: game.teams?.home?.name || 'Home',
            awayTeam: game.teams?.away?.name || 'Away',
            homeScore: game.scores?.home?.total || 0,
            awayScore: game.scores?.away?.total || 0,
            date: new Date(game.date),
            status: 'FINISHED',
            venue: game.venue,
            season: '2024-2025',
            eventType: 'game'
          })
        }
      }
    } catch (error) {
      console.error('❌ Erreur basketball aujourd\'hui:', error)
    }
    
    return events
  }

  // 🚀 IMPORT HISTORIQUE - SAISON 2024-2025 COMPLÈTE
  async importAllSports(): Promise<{
    total: number
    saved: number
    breakdown: Record<SportType, number>
  }> {
    console.log('🌟 IMPORT HISTORIQUE - SAISON 2024-2025 COMPLÈTE')
    console.log('⚽ Football: 6 Ligues EU + MLS + Saudi + International + FIFA Club World Cup')
    console.log('🏀 Basketball: NBA + EuroLeague + FIBA')
    console.log('🥊 MMA: UFC (si API disponible)')
    console.log('🏎️ Formula 1: Saison 2024')
    console.log('🏉 Rugby: Top compétitions (si API disponible)')
    
    const startTime = Date.now()
    let totalSaved = 0
    const breakdown: Record<SportType, number> = {} as any

    // Import parallèle des sports avec APIs réelles
    const [
      footballEvents,
      basketballEvents,
      mmaEvents,
      f1Events,
      rugbyEvents
    ] = await Promise.all([
      this.importFootball(),
      this.importBasketball(),
      this.importMMA(),
      this.importFormula1(),
      this.importRugby()
    ])

    const allEvents = [
      ...footballEvents,
      ...basketballEvents,
      ...mmaEvents,
      ...f1Events,
      ...rugbyEvents
    ]

    // Sauvegarder en base
    for (const event of allEvents) {
      try {
        const saved = await this.saveEvent(event)
        if (saved) {
          totalSaved++
          breakdown[event.sport] = (breakdown[event.sport] || 0) + 1
        }
      } catch (error) {
        console.error(`❌ Erreur sauvegarde ${event.sport}:`, error)
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)

    console.log(`\n🎉 IMPORT HISTORIQUE TERMINÉ en ${duration}s !`)
    console.log(`📊 TOTAL: ${totalSaved} événements sur ${allEvents.length}`)
    
    Object.entries(breakdown).forEach(([sport, count]) => {
      const emoji = this.getSportEmoji(sport as SportType)
      console.log(`  ${emoji} ${sport}: ${count} événements`)
    })

    return {
      total: allEvents.length,
      saved: totalSaved,
      breakdown
    }
  }

  // 💾 SAUVEGARDER UN ÉVÉNEMENT
  private async saveEvent(event: UnifiedEvent): Promise<boolean> {
    try {
      const existing = await prisma.match.findFirst({
        where: {
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          competition: event.competition,
          date: {
            gte: new Date(event.date.getTime() - 24*60*60*1000),
            lte: new Date(event.date.getTime() + 24*60*60*1000)
          }
        }
      })

      if (existing) return false

      await prisma.match.create({
        data: {
          apiMatchId: Math.floor(Math.random() * 900000) + 100000,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          homeScore: event.homeScore,
          awayScore: event.awayScore,
          date: event.date,
          status: event.status,
          competition: event.competition,
          season: event.season,
          venue: event.venue,
          homeTeamLogo: this.getTeamLogo(event.homeTeam, event.sport),
          awayTeamLogo: this.getTeamLogo(event.awayTeam, event.sport),
        }
      })

      return true
    } catch (error) {
      return false
    }
  }

  // 🎨 HELPERS
  private getSportEmoji(sport: SportType): string {
    const emojis = {
      football: '⚽',
      basketball: '🏀',
      mma: '🥊',
      formula1: '🏎️',
      rugby: '🏉'
    }
    return emojis[sport] || '🏆'
  }

  private getTeamLogo(teamName: string, sport: SportType): string {
    const sportColors = {
      football: '007ACC',
      basketball: 'FF6B35', 
      mma: 'DC143C',
      formula1: 'FF1E00',
      rugby: '228B22'
    }
    
    return `https://via.placeholder.com/50x50/${sportColors[sport]}/ffffff?text=${teamName.charAt(0)}`
  }
}

export const multiSportsAPI = new MultiSportsAPI()