// lib/enhanced-multi-sports-api.ts
// Implémentation complète pour F1, MMA et Rugby avec de vraies APIs

import { prisma } from './prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

// 🌍 CONFIGURATION APIS RÉELLES
const ENHANCED_SPORTS_APIS = {
  football: {
    host: 'api-football-v1.p.rapidapi.com',
    endpoint: '/v3',
    // Déjà configuré
  },
  basketball: {
    host: 'api-basketball.p.rapidapi.com',
    endpoint: '/v1',
    // Déjà configuré
  },
  
  // 🏎️ FORMULE 1 - API-Sports
  formula1: {
    host: 'api-formula-1.p.rapidapi.com',
    endpoint: '/v1',
    leagues: {
      'Formula 1': 1 // ID principal F1
    }
  },
  
  // 🥊 MMA - UFC Data + API-Sports MMA
  mma: {
    host: 'api-sports.p.rapidapi.com', // ou 'ufc-data1.p.rapidapi.com'
    endpoint: '/v1',
    leagues: {
      'UFC': 1,
      'Bellator': 2,
      'ONE Championship': 3
    }
  },
  
  // 🏉 RUGBY - Ton API existante
  rugby: {
    host: 'api-rugby.p.rapidapi.com', // Remplace par ton host
    endpoint: '/v1',
    leagues: {
      'Top 14': 1,
      'Six Nations': 2,
      'Rugby World Cup': 3,
      'Champions Cup': 4,
      'Premiership': 5,
      'URC': 6
    }
  }
}

interface UnifiedEvent {
  externalId: string
  sport: 'football' | 'basketball' | 'mma' | 'rugby' | 'f1'
  competition: string
  homeTeam: string
  awayTeam: string
  homeScore: number | string | null
  awayScore: number | string | null
  date: Date
  status: string
  venue?: string
  season: string
  eventType: 'match' | 'race' | 'fight'
  details?: any
}

class EnhancedMultiSportsAPI {
  
  private async makeRequest(sport: keyof typeof ENHANCED_SPORTS_APIS, endpoint: string, params: any = {}) {
    try {
      const config = ENHANCED_SPORTS_APIS[sport]
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

  // 🏎️ FORMULE 1 - Import complet avec vraie API
  async importFormula1(): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    console.log('🏎️ Import Formula 1 2024-2025...')
    
    for (const season of [2024, 2025]) {
      try {
        console.log(`📅 Saison F1 ${season}...`)
        
        // Récupérer toutes les courses de la saison
        const races = await this.makeRequest('formula1', '/races', { season })
        
        console.log(`🏁 ${races.length} courses trouvées pour ${season}`)
        
        for (const race of races) {
          // Si la course est terminée, récupérer les résultats
          if (race.status && race.status.short === 'FT') {
            try {
              // Récupérer les résultats détaillés
              const results = await this.makeRequest('formula1', '/races/results', { 
                race: race.id 
              })
              
              if (results.length > 0) {
                const winner = results[0]
                const podium = results.slice(0, 3)
                
                events.push({
                  externalId: `f1_${season}_${race.id}`,
                  sport: 'f1',
                  competition: 'Formula 1',
                  homeTeam: winner.driver?.name || 'Winner',
                  awayTeam: 'Field', // Le reste du plateau
                  homeScore: '1st', // Position gagnante
                  awayScore: results.length.toString(), // Nombre total participants
                  date: new Date(race.date),
                  status: 'FINISHED',
                  venue: race.circuit?.name || race.venue,
                  season: season.toString(),
                  eventType: 'race',
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
                    fastestLap: race.fastestLap,
                    weather: race.weather
                  }
                })
                
                console.log(`  ✅ ${race.name} - Vainqueur: ${winner.driver?.name}`)
              }
            } catch (error) {
              console.error(`❌ Erreur résultats course ${race.id}:`, error)
            }
          }
        }
        
        // Pause entre saisons
        await this.sleep(2000)
      } catch (error) {
        console.error(`❌ Erreur F1 ${season}:`, error)
      }
    }
    
    console.log(`🏎️ F1 terminé: ${events.length} courses importées`)
    return events
  }

  // 🥊 MMA - Import complet UFC, Bellator, etc.
  async importMMA(): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    console.log('🥊 Import MMA 2024-2025...')
    
    const organizations = ['UFC', 'Bellator', 'ONE Championship']
    
    for (const org of organizations) {
      try {
        console.log(`🥊 Import ${org}...`)
        
        for (const year of [2024, 2025]) {
          // Récupérer les événements de l'organisation
          const mmaEvents = await this.makeRequest('mma', '/events', {
            organization: org,
            season: year
          })
          
          console.log(`  📊 ${mmaEvents.length} événements ${org} trouvés pour ${year}`)
          
          for (const event of mmaEvents) {
            try {
              // Récupérer les combats de l'événement
              const fights = await this.makeRequest('mma', '/fights', {
                event: event.id
              })
              
              // Traiter les combats terminés
              const finishedFights = fights.filter((fight: any) => 
                fight.status === 'finished' || fight.status === 'FT'
              )
              
              for (const fight of finishedFights.slice(0, 5)) { // Top 5 combats par event
                events.push({
                  externalId: `mma_${org.toLowerCase()}_${event.id}_${fight.id}`,
                  sport: 'mma',
                  competition: org,
                  homeTeam: fight.fighters?.fighter1?.name || fight.redCorner?.name || 'Fighter 1',
                  awayTeam: fight.fighters?.fighter2?.name || fight.blueCorner?.name || 'Fighter 2',
                  homeScore: fight.result?.winner === 1 ? 'W' : 'L',
                  awayScore: fight.result?.winner === 2 ? 'W' : 'L',
                  date: new Date(event.date || fight.date),
                  status: 'FINISHED',
                  venue: event.venue || 'MMA Arena',
                  season: year.toString(),
                  eventType: 'fight',
                  details: {
                    eventName: event.name,
                    weightClass: fight.weightClass || fight.category,
                    method: fight.result?.method,
                    round: fight.result?.round,
                    time: fight.result?.time,
                    referee: fight.referee,
                    titleFight: fight.titleFight || fight.title || false,
                    fighter1: {
                      name: fight.fighters?.fighter1?.name,
                      record: fight.fighters?.fighter1?.record,
                      nationality: fight.fighters?.fighter1?.country
                    },
                    fighter2: {
                      name: fight.fighters?.fighter2?.name,
                      record: fight.fighters?.fighter2?.record,
                      nationality: fight.fighters?.fighter2?.country
                    }
                  }
                })
                
                console.log(`    ✅ ${fight.fighters?.fighter1?.name || 'Fighter 1'} vs ${fight.fighters?.fighter2?.name || 'Fighter 2'}`)
              }
            } catch (error) {
              console.error(`❌ Erreur combats event ${event.id}:`, error)
            }
          }
          
          await this.sleep(1500) // Pause entre années
        }
      } catch (error) {
        console.error(`❌ Erreur ${org}:`, error)
      }
    }
    
    console.log(`🥊 MMA terminé: ${events.length} combats importés`)
    return events
  }

  // 🏉 RUGBY - Import avec ton API existante
  async importRugby(): Promise<UnifiedEvent[]> {
    const events: UnifiedEvent[] = []
    console.log('🏉 Import Rugby 2024-2025...')
    
    const competitions = Object.entries(ENHANCED_SPORTS_APIS.rugby.leagues)
    
    for (const [competitionName, leagueId] of competitions) {
      try {
        console.log(`🏉 Import ${competitionName}...`)
        
        for (const season of ['2024', '2024-2025', '2025']) {
          // Récupérer les matchs de la compétition
          const matches = await this.makeRequest('rugby', '/games', {
            league: leagueId,
            season: season
          })
          
          // Filtrer les matchs terminés
          const finishedMatches = matches.filter((match: any) => 
            match.status?.short === 'FT' || match.status === 'FINISHED'
          )
          
          console.log(`  📊 ${finishedMatches.length} matchs ${competitionName} terminés pour ${season}`)
          
          for (const match of finishedMatches) {
            events.push({
              externalId: `rugby_${competitionName.toLowerCase().replace(' ', '_')}_${match.id}`,
              sport: 'rugby',
              competition: competitionName,
              homeTeam: match.teams?.home?.name || match.homeTeam,
              awayTeam: match.teams?.away?.name || match.awayTeam,
              homeScore: match.scores?.home || match.homeScore || 0,
              awayScore: match.scores?.away || match.awayScore || 0,
              date: new Date(match.date),
              status: 'FINISHED',
              venue: match.venue,
              season: season,
              eventType: 'match',
              details: {
                halftimeScore: match.halftime || {},
                tries: match.tries || [],
                conversions: match.conversions || [],
                penalties: match.penalties || [],
                cards: match.cards || [],
                referee: match.referee,
                attendance: match.attendance,
                weather: match.weather,
                logos: {
                  home: match.teams?.home?.logo,
                  away: match.teams?.away?.logo
                }
              }
            })
            
            console.log(`    ✅ ${match.teams?.home?.name || 'Home'} ${match.scores?.home || 0}-${match.scores?.away || 0} ${match.teams?.away?.name || 'Away'}`)
          }
          
          await this.sleep(1000)
        }
      } catch (error) {
        console.error(`❌ Erreur ${competitionName}:`, error)
      }
    }
    
    console.log(`🏉 Rugby terminé: ${events.length} matchs importés`)
    return events
  }

  // 🚀 IMPORT COMPLET NOUVEAUX SPORTS 2024-2025
  async importNewSports2024_2025(): Promise<{
    f1: number
    mma: number  
    rugby: number
    total: number
  }> {
    console.log('🚀 IMPORT COMPLET NOUVEAUX SPORTS 2024-2025')
    console.log('🏎️ F1 + 🥊 MMA + 🏉 Rugby')
    
    const startTime = Date.now()
    let totalSaved = 0
    
    // Import en parallèle pour optimiser
    const [f1Events, mmaEvents, rugbyEvents] = await Promise.all([
      this.importFormula1(),
      this.importMMA(), 
      this.importRugby()
    ])
    
    const allEvents = [...f1Events, ...mmaEvents, ...rugbyEvents]
    console.log(`📊 Total événements récupérés: ${allEvents.length}`)
    
    // Sauvegarder en base
    const breakdown = { f1: 0, mma: 0, rugby: 0 }
    
    for (const event of allEvents) {
      try {
        const saved = await this.saveEvent(event)
        if (saved) {
          totalSaved++
          breakdown[event.sport]++
        }
      } catch (error) {
        console.error(`❌ Erreur sauvegarde ${event.sport}:`, error)
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log(`\n🎉 IMPORT NOUVEAUX SPORTS TERMINÉ en ${duration}s !`)
    console.log(`🏎️ F1: ${breakdown.f1} courses`)
    console.log(`🥊 MMA: ${breakdown.mma} combats`) 
    console.log(`🏉 Rugby: ${breakdown.rugby} matchs`)
    console.log(`📊 TOTAL: ${totalSaved} événements sauvegardés`)
    
    return {
      f1: breakdown.f1,
      mma: breakdown.mma,
      rugby: breakdown.rugby,
      total: totalSaved
    }
  }

  // 💾 SAUVEGARDER UN ÉVÉNEMENT - MÉTHODE PUBLIQUE  
  async saveEvent(event: UnifiedEvent): Promise<boolean> {
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
          sport: event.sport.toUpperCase() as any,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          homeScore: typeof event.homeScore === 'number' ? event.homeScore : 
                    event.homeScore === 'W' ? 1 : 
                    event.homeScore === 'L' ? 0 : 
                    parseInt(String(event.homeScore)) || 0,
          awayScore: typeof event.awayScore === 'number' ? event.awayScore :
                    event.awayScore === 'W' ? 1 :
                    event.awayScore === 'L' ? 0 :
                    parseInt(String(event.awayScore)) || 0,
          date: event.date,
          status: event.status,
          competition: event.competition,
          season: event.season,
          venue: event.venue,
          homeTeamLogo: this.getTeamLogo(event.homeTeam, event.sport),
          awayTeamLogo: this.getTeamLogo(event.awayTeam, event.sport),
          details: event.details ? JSON.stringify(event.details) : null
        }
      })

      return true
    } catch (error) {
      console.error(`❌ Erreur sauvegarde:`, error)
      return false
    }
  }

  private getTeamLogo(teamName: string, sport: string): string {
    const sportColors = {
      f1: 'FF1E00',      // Rouge F1
      mma: 'DC143C',     // Rouge combat  
      rugby: '228B22'    // Vert rugby
    }
    
    return `https://via.placeholder.com/50x50/${sportColors[sport] || '007ACC'}/ffffff?text=${teamName.charAt(0)}`
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const enhancedMultiSportsAPI = new EnhancedMultiSportsAPI()