// lib/new-football-api.ts
// 🏆 NOUVEAU SYSTÈME D'IMPORT FOOTBALL 2025 AVEC ABONNEMENT UPGRADÉ

import { prisma } from './prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com'
const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3'

// 🏆 CONFIGURATION DES COMPÉTITIONS CIBLÉES
const FOOTBALL_COMPETITIONS_2025 = {
  // 🇪🇺 TOP 5 LIGUES EUROPÉENNES
  european_leagues: {
    'Premier League': { id: 39, country: 'England', priority: 1 },
    'Ligue 1': { id: 61, country: 'France', priority: 1 },
    'La Liga': { id: 140, country: 'Spain', priority: 1 },
    'Serie A': { id: 135, country: 'Italy', priority: 1 },
    'Bundesliga': { id: 78, country: 'Germany', priority: 1 }
  },
  
  // 🌍 LIGUES INTERNATIONALES
  international_leagues: {
    'MLS': { id: 253, country: 'USA', priority: 2 },
    'Saudi Pro League': { id: 307, country: 'Saudi Arabia', priority: 2 },
    'Eredivisie': { id: 88, country: 'Netherlands', priority: 3 } // 🆕 BONUS
  },
  
  // 🏆 COMPÉTITIONS EUROPÉENNES
  european_competitions: {
    'UEFA Champions League': { id: 2, country: 'Europe', priority: 1 },
    'UEFA Europa League': { id: 3, country: 'Europe', priority: 2 },
    'UEFA Conference League': { id: 848, country: 'Europe', priority: 3 },
    'UEFA Nations League': { id: 5, country: 'Europe', priority: 2 }
  },
  
  // 🌍 COMPÉTITIONS MONDIALES
  world_competitions: {
    'FIFA World Cup': { id: 1, country: 'World', priority: 1 },
    'FIFA Club World Cup': { id: 15, country: 'World', priority: 2 },
    'UEFA European Championship': { id: 4, country: 'Europe', priority: 1 }
  },
  
  // 🇫🇷 MATCHS ÉQUIPE DE FRANCE (et autres grandes nations)
  international_teams: {
    'France National Team': { team_id: 2, priority: 1 },
    'England National Team': { team_id: 10, priority: 2 },
    'Spain National Team': { team_id: 9, priority: 2 },
    'Germany National Team': { team_id: 25, priority: 2 },
    'Brazil National Team': { team_id: 6, priority: 2 },
    'Argentina National Team': { team_id: 26, priority: 2 }
  }
}

interface ImportStats {
  competition: string
  imported: number
  skipped: number
  errors: number
  examples: string[]
  dateRange: { start: string, end: string }
}

interface ImportResult {
  totalImported: number
  totalSkipped: number
  totalErrors: number
  competitionsProcessed: number
  duration: number
  byCompetition: ImportStats[]
  summary: {
    topMatches: string[]
    dateRange: { start: string, end: string }
    countries: string[]
  }
}

class NewFootballAPI {
  private requestCount = 0
  private readonly MAX_REQUESTS_PER_MINUTE = 300 // Abonnement upgradé !
  private readonly SEASON = 2024 // Saison actuelle

  // 🔧 REQUÊTE API SÉCURISÉE AVEC GESTION D'ERREUR
  private async makeAPIRequest(endpoint: string): Promise<any> {
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      console.log('⏸️ Pause 60s pour respecter les quotas API...')
      await this.sleep(60000)
      this.requestCount = 0
    }

    try {
      const url = `${BASE_URL}${endpoint}`
      console.log(`🔍 API Request: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
          'Accept': 'application/json'
        }
      })

      this.requestCount++

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.response) {
        return data.response
      }
      
      return data.results || []
    } catch (error) {
      console.error(`❌ API Error: ${error}`)
      throw error
    }
  }

  // 🏆 IMPORT COMPLET TOUTES COMPÉTITIONS
  async importAllCompetitions(): Promise<ImportResult> {
    const startTime = Date.now()
    console.log('🚀 DÉMARRAGE IMPORT COMPLET FOOTBALL 2025')
    console.log('🎯 Compétitions ciblées: 8 ligues + 7 coupes + équipes nationales')
    
    const result: ImportResult = {
      totalImported: 0,
      totalSkipped: 0,
      totalErrors: 0,
      competitionsProcessed: 0,
      duration: 0,
      byCompetition: [],
      summary: {
        topMatches: [],
        dateRange: { start: '', end: '' },
        countries: []
      }
    }

    try {
      // 1️⃣ LIGUES EUROPÉENNES (priorité 1)
      console.log('🇪🇺 Import des TOP 5 ligues européennes...')
      for (const [name, config] of Object.entries(FOOTBALL_COMPETITIONS_2025.european_leagues)) {
        const stats = await this.importLeagueMatches(name, config.id, config.country)
        result.byCompetition.push(stats)
        result.totalImported += stats.imported
        result.totalSkipped += stats.skipped
        result.totalErrors += stats.errors
        result.competitionsProcessed++
      }

      // 2️⃣ LIGUES INTERNATIONALES (priorité 2)
      console.log('🌍 Import des ligues internationales...')
      for (const [name, config] of Object.entries(FOOTBALL_COMPETITIONS_2025.international_leagues)) {
        const stats = await this.importLeagueMatches(name, config.id, config.country)
        result.byCompetition.push(stats)
        result.totalImported += stats.imported
        result.totalSkipped += stats.skipped
        result.totalErrors += stats.errors
        result.competitionsProcessed++
      }

      // 3️⃣ COMPÉTITIONS EUROPÉENNES (priorité 1-3)
      console.log('🏆 Import des compétitions européennes...')
      for (const [name, config] of Object.entries(FOOTBALL_COMPETITIONS_2025.european_competitions)) {
        const stats = await this.importLeagueMatches(name, config.id, config.country)
        result.byCompetition.push(stats)
        result.totalImported += stats.imported
        result.totalSkipped += stats.skipped
        result.totalErrors += stats.errors
        result.competitionsProcessed++
      }

      // 4️⃣ COMPÉTITIONS MONDIALES (priorité 1-2)
      console.log('🌍 Import des compétitions mondiales...')
      for (const [name, config] of Object.entries(FOOTBALL_COMPETITIONS_2025.world_competitions)) {
        const stats = await this.importLeagueMatches(name, config.id, config.country)
        result.byCompetition.push(stats)
        result.totalImported += stats.imported
        result.totalSkipped += stats.skipped
        result.totalErrors += stats.errors
        result.competitionsProcessed++
      }

      // 5️⃣ MATCHS DES ÉQUIPES NATIONALES
      console.log('🇫🇷 Import des matchs des équipes nationales...')
      for (const [name, config] of Object.entries(FOOTBALL_COMPETITIONS_2025.international_teams)) {
        const stats = await this.importNationalTeamMatches(name, config.team_id)
        if (stats.imported > 0) {
          result.byCompetition.push(stats)
          result.totalImported += stats.imported
          result.totalSkipped += stats.skipped
          result.totalErrors += stats.errors
          result.competitionsProcessed++
        }
      }

      result.duration = Math.round((Date.now() - startTime) / 1000)
      
      // Générer le résumé
      result.summary = this.generateSummary(result.byCompetition)
      
      console.log(`🎉 IMPORT TERMINÉ en ${Math.floor(result.duration / 60)}min ${result.duration % 60}s !`)
      console.log(`📊 RÉSULTATS: ${result.totalImported} matchs importés, ${result.competitionsProcessed} compétitions`)
      
      return result

    } catch (error) {
      console.error('❌ Erreur import global:', error)
      throw error
    }
  }

  // 🏆 IMPORT D'UNE LIGUE SPÉCIFIQUE
  private async importLeagueMatches(leagueName: string, leagueId: number, country: string): Promise<ImportStats> {
    console.log(`📊 Import ${leagueName} (ID: ${leagueId})...`)
    
    const stats: ImportStats = {
      competition: leagueName,
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: [],
      dateRange: { start: '', end: '' }
    }

    try {
      // Récupérer les matchs des 3 derniers mois + 1 mois à venir
      const fixtures = await this.makeAPIRequest(`/fixtures?league=${leagueId}&season=${this.SEASON}&last=90`)
      
      console.log(`   📋 ${fixtures.length} matchs trouvés pour ${leagueName}`)
      
      if (fixtures.length === 0) {
        console.log(`   ⚠️ Aucun match trouvé pour ${leagueName}`)
        return stats
      }

      // Trier par date pour traiter les plus récents
      fixtures.sort((a: any, b: any) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
      
      for (const fixture of fixtures) {
        try {
          const existingMatch = await prisma.match.findFirst({
            where: { apiMatchId: fixture.fixture.id }
          })

          if (existingMatch) {
            stats.skipped++
            continue
          }

          // Créer le match
          await prisma.match.create({
            data: {
              apiMatchId: fixture.fixture.id,
              sport: 'FOOTBALL',
              homeTeam: fixture.teams.home.name,
              awayTeam: fixture.teams.away.name,
              homeScore: fixture.goals.home || 0,
              awayScore: fixture.goals.away || 0,
              date: new Date(fixture.fixture.date),
              status: this.mapStatus(fixture.fixture.status.short),
              competition: leagueName,
              season: this.SEASON.toString(),
              venue: fixture.fixture.venue?.name || 'Stadium',
              referee: fixture.fixture.referee || 'Referee',
              homeTeamLogo: fixture.teams.home.logo,
              awayTeamLogo: fixture.teams.away.logo,
              details: {
                fixtureId: fixture.fixture.id,
                round: fixture.league.round,
                country: country,
                timezone: fixture.fixture.timezone,
                halftime: fixture.score.halftime,
                fulltime: fixture.score.fulltime,
                extratime: fixture.score.extratime,
                penalty: fixture.score.penalty
              }
            }
          })

          stats.imported++
          
          // Ajouter des exemples
          if (stats.examples.length < 3) {
            stats.examples.push(
              `${fixture.teams.home.name} ${fixture.goals.home || 0}-${fixture.goals.away || 0} ${fixture.teams.away.name}`
            )
          }

          // Suivre la plage de dates
          const matchDate = fixture.fixture.date.split('T')[0]
          if (!stats.dateRange.start || matchDate < stats.dateRange.start) {
            stats.dateRange.start = matchDate
          }
          if (!stats.dateRange.end || matchDate > stats.dateRange.end) {
            stats.dateRange.end = matchDate
          }

          // Log de progression
          if (stats.imported % 50 === 0) {
            console.log(`     ✅ ${stats.imported} matchs importés pour ${leagueName}...`)
          }
          
        } catch (error) {
          stats.errors++
          console.error(`     ❌ Erreur match ${fixture.fixture.id}:`, error)
        }
      }
      
      console.log(`   ✅ ${leagueName} terminé: ${stats.imported} importés, ${stats.skipped} existants`)
      
      // Pause entre ligues pour être gentil avec l'API
      await this.sleep(2000)
      
      return stats
      
    } catch (error) {
      stats.errors++
      console.error(`❌ Erreur ${leagueName}:`, error)
      return stats
    }
  }

  // 🇫🇷 IMPORT MATCHS ÉQUIPE NATIONALE
  private async importNationalTeamMatches(teamName: string, teamId: number): Promise<ImportStats> {
    console.log(`🇫🇷 Import ${teamName}...`)
    
    const stats: ImportStats = {
      competition: teamName,
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: [],
      dateRange: { start: '', end: '' }
    }

    try {
      // Récupérer les matchs de l'équipe nationale
      const fixtures = await this.makeAPIRequest(`/fixtures?team=${teamId}&last=50`)
      
      console.log(`   📋 ${fixtures.length} matchs trouvés pour ${teamName}`)
      
      for (const fixture of fixtures) {
        try {
          const existingMatch = await prisma.match.findFirst({
            where: { apiMatchId: fixture.fixture.id }
          })

          if (existingMatch) {
            stats.skipped++
            continue
          }

          // Déterminer la compétition
          let competitionName = fixture.league.name
          if (competitionName.includes('Friendlies')) {
            competitionName = 'International Friendlies'
          } else if (competitionName.includes('Nations League')) {
            competitionName = 'UEFA Nations League'
          } else if (competitionName.includes('World Cup')) {
            competitionName = 'FIFA World Cup Qualifiers'
          } else if (competitionName.includes('Euro')) {
            competitionName = 'UEFA Euro Qualifiers'
          }

          await prisma.match.create({
            data: {
              apiMatchId: fixture.fixture.id,
              sport: 'FOOTBALL',
              homeTeam: fixture.teams.home.name,
              awayTeam: fixture.teams.away.name,
              homeScore: fixture.goals.home || 0,
              awayScore: fixture.goals.away || 0,
              date: new Date(fixture.fixture.date),
              status: this.mapStatus(fixture.fixture.status.short),
              competition: competitionName,
              season: this.SEASON.toString(),
              venue: fixture.fixture.venue?.name || 'Stadium',
              referee: fixture.fixture.referee || 'Referee',
              homeTeamLogo: fixture.teams.home.logo,
              awayTeamLogo: fixture.teams.away.logo,
              details: {
                fixtureId: fixture.fixture.id,
                round: fixture.league.round,
                country: 'International',
                isNationalTeam: true,
                targetTeam: teamName
              }
            }
          })

          stats.imported++
          
          if (stats.examples.length < 2) {
            stats.examples.push(
              `${fixture.teams.home.name} ${fixture.goals.home || 0}-${fixture.goals.away || 0} ${fixture.teams.away.name}`
            )
          }

        } catch (error) {
          stats.errors++
          console.error(`     ❌ Erreur match ${fixture.fixture.id}:`, error)
        }
      }
      
      console.log(`   ✅ ${teamName}: ${stats.imported} matchs importés`)
      await this.sleep(1500)
      
      return stats
      
    } catch (error) {
      stats.errors++
      console.error(`❌ Erreur ${teamName}:`, error)
      return stats
    }
  }

  // 🔧 MAPPAGE DES STATUTS
  private mapStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'FT': 'FINISHED',
      'AET': 'FINISHED',
      'PEN': 'FINISHED',
      'NS': 'SCHEDULED',
      'TBD': 'SCHEDULED',
      '1H': 'LIVE',
      '2H': 'LIVE',
      'HT': 'LIVE',
      'ET': 'LIVE',
      'P': 'LIVE',
      'PST': 'POSTPONED',
      'CANC': 'CANCELLED',
      'ABD': 'CANCELLED',
      'AWD': 'FINISHED',
      'WO': 'FINISHED'
    }
    return statusMap[apiStatus] || 'SCHEDULED'
  }

  // 📊 GÉNÉRER RÉSUMÉ
  private generateSummary(competitions: ImportStats[]) {
    const allExamples = competitions.flatMap(c => c.examples)
    const countries = [...new Set(competitions.map(c => c.competition))]
    
    const allDates = competitions.flatMap(c => [c.dateRange.start, c.dateRange.end]).filter(Boolean)
    const dateRange = {
      start: allDates.length > 0 ? allDates.sort()[0] : '',
      end: allDates.length > 0 ? allDates.sort().reverse()[0] : ''
    }

    return {
      topMatches: allExamples.slice(0, 5),
      dateRange,
      countries: countries.slice(0, 10)
    }
  }

  // 🛠️ UTILITAIRES
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 🔍 TEST DE CONNEXION
  async testConnection(): Promise<{ success: boolean, message: string, details?: any }> {
    try {
      console.log('🔍 Test connexion API Football...')
      
      const leagues = await this.makeAPIRequest('/leagues?current=true')
      
      if (leagues && leagues.length > 0) {
        return {
          success: true,
          message: `✅ API Football connectée - ${leagues.length} ligues disponibles`,
          details: {
            totalLeagues: leagues.length,
            sampleLeague: leagues[0]?.league?.name,
            rateLimitRemaining: this.MAX_REQUESTS_PER_MINUTE - this.requestCount
          }
        }
      } else {
        return {
          success: false,
          message: '❌ API Football: Aucune ligue disponible'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Erreur API Football: ${error.message}`
      }
    }
  }

  // 📅 IMPORT QUOTIDIEN (pour le cron)
  async importDailyMatches(): Promise<ImportResult> {
    console.log('📅 Import quotidien des nouveaux matchs...')
    
    // Logique similaire mais seulement pour les matchs d'aujourd'hui/demain
    const today = new Date().toISOString().split('T')[0]
    
    // Pour le cron quotidien, on peut implémenter une version allégée
    // qui ne récupère que les matchs récents
    
    return this.importAllCompetitions() // Pour l'instant, utilise la méthode complète
  }
}

export const newFootballAPI = new NewFootballAPI()