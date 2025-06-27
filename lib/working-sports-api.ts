// lib/working-sports-api.ts
// Version modifiée avec tes ligues exactes et sans limites

import { prisma } from './prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

// 🏆 TES LIGUES EXACTES POUR 2025
const WORKING_SPORTS_CONFIG = {
  football: {
    host: 'api-football-v1.p.rapidapi.com',
    baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
    // 🆕 CHANGÉ POUR 2025
    season: 2025,
    leagues: {
      // 🇪🇺 TES 5 LIGUES EUROPÉENNES
      'Ligue 1': 61,
      'La Liga': 140,
      'Premier League': 39,
      'Bundesliga': 78,
      'Serie A': 135,
      
      // 🏆 COMPÉTITIONS EUROPÉENNES
      'Champions League': 2,
      'Europa League': 3,
      
      // 🌍 AUTRES LIGUES
      'MLS': 253,
      'Saudi Pro League': 307,
      
      // 🌏 INTERNATIONAL
      'Nations League': 5,
      'World Cup': 15
      'Euro' : 4
    }
  },
  basketball: {
    host: 'api-basketball.p.rapidapi.com',
    baseUrl: 'https://api-basketball.p.rapidapi.com',
    season: '2024-2025',
    leagues: {
      'NBA': 12,
      'EuroLeague': 120,
      'LNB Pro A': 113,
      'EuroBasket': 16,
      'FIBA World Cup': 15
    }
  }
}

interface ImportStats {
  sport: string
  imported: number
  skipped: number
  errors: number
  examples: string[]
}

class WorkingSportsAPI {
  private requestCount = 0
  private readonly MAX_REQUESTS_PER_MINUTE = 50

  // 🔧 REQUÊTE API SÉCURISÉE
  private async makeAPIRequest(url: string, host: string): Promise<any> {
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      console.log('⏸️ Pause 60s pour respecter les quotas API...')
      await this.sleep(60000)
      this.requestCount = 0
    }

    try {
      console.log(`🔍 API Request: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': host,
          'Accept': 'application/json'
        }
      })

      this.requestCount++

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Structure standardisée de réponse API-Football
      if (data.response) {
        return data.response
      }
      
      // Structure alternative
      if (data.results) {
        return data.results
      }
      
      return data
    } catch (error) {
      console.error(`❌ API Error: ${error.message}`)
      throw error
    }
  }

  // ⚽ IMPORT FOOTBALL 2025 SANS LIMITES
  async importFootball2025(): Promise<ImportStats> {
    const stats: ImportStats = {
      sport: 'football',
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: []
    }

    console.log('⚽ IMPORT FOOTBALL 2025 DÉMARRÉ')
    console.log('🎯 TES 11 LIGUES: Ligue 1, Premier League, La Liga, Bundesliga, Serie A, Champions League, Europa League, MLS, Saudi Pro League, Nations League, World Cup Qualifiers')
    
    const config = WORKING_SPORTS_CONFIG.football
    
    for (const [leagueName, leagueId] of Object.entries(config.leagues)) {
      try {
        console.log(`📊 Import ${leagueName} (ID: ${leagueId})...`)
        
        // Récupérer TOUS les matchs de 2025 pour cette ligue
        const url = `${config.baseUrl}/fixtures?league=${leagueId}&season=${config.season}`
        const fixtures = await this.makeAPIRequest(url, config.host)
        
        console.log(`   📋 ${fixtures.length} matchs trouvés pour ${leagueName} en ${config.season}`)
        
        // 🆕 TRAITER TOUS LES MATCHS (PLUS DE .slice(0, 20))
        for (const fixture of fixtures) {
          try {
            const existingMatch = await prisma.match.findFirst({
              where: { apiMatchId: fixture.fixture.id }
            })

            if (existingMatch) {
              stats.skipped++
              continue
            }

            // Créer le match en base
            await prisma.match.create({
              data: {
                apiMatchId: fixture.fixture.id,
                sport: 'FOOTBALL',
                homeTeam: fixture.teams.home.name,
                awayTeam: fixture.teams.away.name,
                homeScore: fixture.goals.home || 0,
                awayScore: fixture.goals.away || 0,
                date: new Date(fixture.fixture.date),
                status: fixture.fixture.status.short === 'FT' ? 'FINISHED' : fixture.fixture.status.short,
                competition: leagueName,
                season: '2025',
                venue: fixture.fixture.venue?.name || 'Stadium',
                referee: fixture.fixture.referee || 'Unknown',
                homeTeamLogo: fixture.teams.home.logo,
                awayTeamLogo: fixture.teams.away.logo,
                details: {
                  fixtureId: fixture.fixture.id,
                  round: fixture.league.round,
                  halftime: fixture.score.halftime,
                  fulltime: fixture.score.fulltime,
                  extratime: fixture.score.extratime,
                  penalty: fixture.score.penalty
                }
              }
            })

            stats.imported++
            
            // Ajouter un exemple
            if (stats.examples.length < 3) {
              stats.examples.push(
                `${fixture.teams.home.name} ${fixture.goals.home || 0}-${fixture.goals.away || 0} ${fixture.teams.away.name}`
              )
            }

            // Log périodique pour voir l'avancement
            if (stats.imported % 50 === 0) {
              console.log(`     ✅ ${stats.imported} matchs importés pour ${leagueName}...`)
            }
            
          } catch (error) {
            stats.errors++
            console.error(`     ❌ Erreur match ${fixture.fixture.id}:`, error.message)
          }
        }
        
        console.log(`   ✅ ${leagueName} terminé: ${stats.imported} importés, ${stats.skipped} existants`)
        
        // Pause entre ligues
        await this.sleep(2000)
        
      } catch (error) {
        stats.errors++
        console.error(`❌ Erreur ${leagueName}:`, error.message)
      }
    }

    console.log(`⚽ Football terminé: ${stats.imported} matchs importés`)
    return stats
  }

  // 🏀 IMPORT BASKETBALL 2025 SANS LIMITES
  async importBasketball2025(): Promise<ImportStats> {
    const stats: ImportStats = {
      sport: 'basketball',
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: []
    }

    console.log('🏀 IMPORT BASKETBALL 2025 DÉMARRÉ')
    console.log('🎯 TES 5 LIGUES: NBA, EuroLeague, LNB Pro A, EuroBasket, FIBA World Cup')
    
    const config = WORKING_SPORTS_CONFIG.basketball
    
    for (const [leagueName, leagueId] of Object.entries(config.leagues)) {
      try {
        console.log(`📊 Import ${leagueName} (ID: ${leagueId})...`)
        
        // URL pour récupérer tous les matchs
        const url = `${config.baseUrl}/games?league=${leagueId}&season=${config.season}`
        const games = await this.makeAPIRequest(url, config.host)
        
        console.log(`   📋 ${games.length} matchs trouvés pour ${leagueName}`)
        
        // 🆕 TRAITER TOUS LES MATCHS (PLUS DE .slice(0, 15))
        for (const game of games) {
          try {
            const existingMatch = await prisma.match.findFirst({
              where: { apiMatchId: game.id }
            })

            if (existingMatch) {
              stats.skipped++
              continue
            }

            await prisma.match.create({
              data: {
                apiMatchId: game.id,
                sport: 'BASKETBALL',
                homeTeam: game.teams?.home?.name || 'Home Team',
                awayTeam: game.teams?.away?.name || 'Away Team',
                homeScore: game.scores?.home?.total || 0,
                awayScore: game.scores?.away?.total || 0,
                date: new Date(game.date),
                status: (game.status?.short === 'FT' || game.status?.long === 'Finished') ? 'FINISHED' : game.status?.short || 'SCHEDULED',
                competition: leagueName,
                season: '2025',
                venue: game.venue || 'Arena',
                details: {
                  gameId: game.id,
                  quarter1: {
                    home: game.scores?.home?.quarter_1 || 0,
                    away: game.scores?.away?.quarter_1 || 0
                  },
                  quarter2: {
                    home: game.scores?.home?.quarter_2 || 0,
                    away: game.scores?.away?.quarter_2 || 0
                  },
                  quarter3: {
                    home: game.scores?.home?.quarter_3 || 0,
                    away: game.scores?.away?.quarter_3 || 0
                  },
                  quarter4: {
                    home: game.scores?.home?.quarter_4 || 0,
                    away: game.scores?.away?.quarter_4 || 0
                  },
                  overtime: game.scores?.home?.over_time ? {
                    home: game.scores.home.over_time,
                    away: game.scores.away.over_time
                  } : null
                }
              }
            })

            stats.imported++
            
            if (stats.examples.length < 3) {
              stats.examples.push(
                `${game.teams?.home?.name || 'Home'} ${game.scores?.home?.total || 0}-${game.scores?.away?.total || 0} ${game.teams?.away?.name || 'Away'}`
              )
            }

            if (stats.imported % 25 === 0) {
              console.log(`     ✅ ${stats.imported} matchs importés pour ${leagueName}...`)
            }
            
          } catch (error) {
            stats.errors++
            console.error(`     ❌ Erreur match ${game.id}:`, error.message)
          }
        }
        
        console.log(`   ✅ ${leagueName} terminé: ${stats.imported} importés, ${stats.skipped} existants`)
        await this.sleep(3000)
        
      } catch (error) {
        stats.errors++
        console.error(`❌ Erreur ${leagueName}:`, error.message)
      }
    }

    console.log(`🏀 Basketball terminé: ${stats.imported} matchs importés`)
    return stats
  }

  // 🚀 IMPORT COMPLET 2025
  async importAllSports2025(): Promise<{
    football: ImportStats
    basketball: ImportStats
    total: number
    duration: number
  }> {
    const startTime = Date.now()
    
    console.log('🚀 IMPORT COMPLET 2025 DÉMARRÉ')
    console.log('⚽ Football: 11 compétitions')
    console.log('🏀 Basketball: 5 compétitions')
    console.log('📊 TOUTES LES DONNÉES (plus de limites)')
    
    try {
      // Import en séquence pour éviter les limites de rate
      const football = await this.importFootball2025()
      await this.sleep(5000) // Pause entre sports
      const basketball = await this.importBasketball2025()
      
      const total = football.imported + basketball.imported
      const duration = Math.round((Date.now() - startTime) / 1000)
      
      console.log(`\n🎉 IMPORT TERMINÉ en ${Math.floor(duration / 60)}min ${duration % 60}s !`)
      console.log(`⚽ Football: ${football.imported} matchs`)
      console.log(`🏀 Basketball: ${basketball.imported} matchs`)
      console.log(`📊 TOTAL: ${total} événements importés`)
      
      return {
        football,
        basketball,
        total,
        duration
      }
      
    } catch (error) {
      console.error('❌ Erreur import global:', error)
      throw error
    }
  }

  // 📅 IMPORT QUOTIDIEN OPTIMISÉ
  async importTodaysMatches(): Promise<{
    imported: number
    sports: string[]
    examples: string[]
  }> {
    console.log('📅 Import des matchs d\'aujourd\'hui...')
    
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    let totalImported = 0
    const sportsUpdated: string[] = []
    const examples: string[] = []
    
    try {
      // Football aujourd'hui
      const footballUrl = `${WORKING_SPORTS_CONFIG.football.baseUrl}/fixtures?date=${today}&status=FT`
      const footballMatches = await this.makeAPIRequest(footballUrl, WORKING_SPORTS_CONFIG.football.host)
      
      for (const match of footballMatches.slice(0, 10)) {
        try {
          const existing = await prisma.match.findFirst({
            where: { apiMatchId: match.fixture.id }
          })
          
          if (!existing) {
            await prisma.match.create({
              data: {
                apiMatchId: match.fixture.id,
                sport: 'FOOTBALL',
                homeTeam: match.teams.home.name,
                awayTeam: match.teams.away.name,
                homeScore: match.goals.home || 0,
                awayScore: match.goals.away || 0,
                date: new Date(match.fixture.date),
                status: 'FINISHED',
                competition: match.league.name,
                season: '2025',
                venue: match.fixture.venue?.name || 'Stadium',
                homeTeamLogo: match.teams.home.logo,
                awayTeamLogo: match.teams.away.logo
              }
            })
            
            totalImported++
            examples.push(`${match.teams.home.name} ${match.goals.home}-${match.goals.away} ${match.teams.away.name}`)
          }
        } catch (error) {
          console.error('Erreur match football:', error.message)
        }
      }
      
      if (footballMatches.length > 0) sportsUpdated.push('football')
      
      console.log(`✅ Import quotidien terminé: ${totalImported} nouveaux matchs`)
      
      return {
        imported: totalImported,
        sports: sportsUpdated,
        examples: examples.slice(0, 3)
      }
      
    } catch (error) {
      console.error('❌ Erreur import quotidien:', error)
      return { imported: 0, sports: [], examples: [] }
    }
  }

  // 🔍 TEST DE CONNEXION API
  async testAPIConnection(): Promise<{
    football: boolean
    basketball: boolean
    details: any
  }> {
    console.log('🔍 Test de connexion aux APIs...')
    
    const results = {
      football: false,
      basketball: false,
      details: {
        football: null,
        basketball: null
      }
    }
    
    try {
      // Test API Football
      const footballUrl = `${WORKING_SPORTS_CONFIG.football.baseUrl}/leagues?current=true`
      const footballData = await this.makeAPIRequest(footballUrl, WORKING_SPORTS_CONFIG.football.host)
      
      if (footballData && footballData.length > 0) {
        results.football = true
        results.details.football = {
          status: 'OK',
          leagues: footballData.length,
          example: footballData[0]?.league?.name
        }
        console.log('✅ API Football connectée')
      }
    } catch (error) {
      results.details.football = { status: 'ERROR', error: error.message }
      console.log('❌ API Football non disponible:', error.message)
    }
    
    try {
      // Test API Basketball
      const basketballUrl = `${WORKING_SPORTS_CONFIG.basketball.baseUrl}/leagues`
      const basketballData = await this.makeAPIRequest(basketballUrl, WORKING_SPORTS_CONFIG.basketball.host)
      
      if (basketballData && basketballData.length > 0) {
        results.basketball = true
        results.details.basketball = {
          status: 'OK',
          leagues: basketballData.length,
          example: basketballData[0]?.name
        }
        console.log('✅ API Basketball connectée')
      }
    } catch (error) {
      results.details.basketball = { status: 'ERROR', error: error.message }
      console.log('❌ API Basketball non disponible:', error.message)
    }
    
    return results
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const workingSportsAPI = new WorkingSportsAPI()