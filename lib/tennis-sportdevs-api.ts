// lib/tennis-sportdevs-api.ts
// 🎾 SERVICE IMPORT TENNIS via SportDevs (RapidAPI)
// OPTIMISÉ pour 300 requêtes/jour max - VERSION FINALE avec vraie API

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const SPORTDEVS_TENNIS_HOST = 'tennis-devs.p.rapidapi.com'

interface TennisMatch {
  id: string
  player1: {
    name: string
    ranking?: number
    country?: string
  }
  player2: {
    name: string
    ranking?: number
    country?: string
  }
  tournament: {
    name: string
    level: string // ATP, WTA, Challenger, etc.
    surface: string // Hard, Clay, Grass
    importance?: number
  }
  venue: {
    name: string
    city: string
    country: string
  }
  date: string
  status: string
  scores: {
    player1: {
      sets: number
      games: number[]
      tiebreaks?: number[]
    }
    player2: {
      sets: number
      games: number[]
      tiebreaks?: number[]
    }
  }
  statistics?: {
    player1: any
    player2: any
  }
  round: string
  surface: string
}

class TennisSportDevsAPI {
  private requestCount = 0
  private readonly MAX_DAILY_REQUESTS = 50 // Garde une marge sur les 300

  private async makeRequest(endpoint: string): Promise<any> {
    if (this.requestCount >= this.MAX_DAILY_REQUESTS) {
      throw new Error(`Quota quotidien atteint (${this.MAX_DAILY_REQUESTS} requêtes max)`)
    }

    console.log(`🎾 Tennis API Request ${this.requestCount + 1}/${this.MAX_DAILY_REQUESTS}: ${endpoint}`)

    try {
      // Utiliser RapidAPI avec le bon host
      const url = `https://${SPORTDEVS_TENNIS_HOST}${endpoint}`
      
      console.log(`🔗 URL appelée: ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': SPORTDEVS_TENNIS_HOST,
        }
      })

      this.requestCount++

      console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Erreur API détaillée: ${errorText}`)
        throw new Error(`Tennis API Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Tennis API Success: ${Array.isArray(data) ? data.length : 'Single'} résultats`)
      
      return data
    } catch (error) {
      console.error('❌ Erreur Tennis API:', error)
      throw error
    }
  }

  // 🎾 RÉCUPÉRER MATCHS ATP OFFICIELS JUILLET (20+ matchs)
  async getRecentATPMatches(limit: number = 25): Promise<TennisMatch[]> {
    try {
      console.log(`🎾 Récupération de ${limit} matchs ATP OFFICIELS de juillet 2025...`)
      console.log('🏆 CIBLE: ATP 250/500, Masters 1000, Grand Chelem UNIQUEMENT')
      
      // Utiliser le filtrage par date pour juillet 2025 (économique)
      console.log('🔍 Filtrage: juillet 2025 + ATP officiel...')
      const matches = await this.makeRequest('/matches?start_time=gte.2025-07-01&start_time=lt.2025-08-01&limit=150')
      
      if (!Array.isArray(matches)) {
        console.log('⚠️ Réponse inattendue de l\'API Tennis:', typeof matches)
        return []
      }

      console.log(`📊 ${matches.length} matchs de juillet récupérés de l'API`)

      // FILTRAGE ULTRA-STRICT POUR ATP OFFICIEL UNIQUEMENT
      let strictATPMatches = matches
        .filter((match: any) => {
          if (!match || !match.home_team_name || !match.away_team_name) {
            return false
          }
          
          const isOfficialATP = this.isStrictATPMatch(match)
          const isFinished = match.status_type === 'finished'
          
          return isOfficialATP && isFinished
        })
        .sort((a: any, b: any) => {
          // Trier par importance du tournoi (plus important en premier)
          const importanceA = a.tournament_importance || 0
          const importanceB = b.tournament_importance || 0
          if (importanceA !== importanceB) {
            return importanceB - importanceA
          }
          
          // Puis par date (plus récent)
          const dateA = new Date(a.start_time || '1970-01-01').getTime()
          const dateB = new Date(b.start_time || '1970-01-01').getTime()
          return dateB - dateA
        })

      console.log(`🔍 ${strictATPMatches.length} matchs ATP OFFICIELS trouvés avant limite`)

      // Si pas assez de matchs ATP officiels, afficher un warning mais continuer
      if (strictATPMatches.length === 0) {
        console.log('⚠️ AUCUN match ATP officiel trouvé en juillet 2025')
        console.log('📋 Exemples de tournois trouvés:')
        matches.slice(0, 10).forEach((match: any, i) => {
          console.log(`  ${i + 1}. ${match.tournament_name} (importance: ${match.tournament_importance || 0})`)
        })
        return []
      }

      // Prendre les X premiers matchs ATP officiels
      strictATPMatches = strictATPMatches
        .slice(0, limit)
        .map((match: any) => this.formatTennisMatchReal(match))

      console.log(`✅ ${strictATPMatches.length} matchs ATP OFFICIELS traités`)
      console.log('🏆 Répartition par niveau de tournoi:')
      
      // Statistiques par niveau
      const byLevel = strictATPMatches.reduce((acc: any, match) => {
        acc[match.tournament.level] = (acc[match.tournament.level] || 0) + 1
        return acc
      }, {})
      
      Object.entries(byLevel).forEach(([level, count]) => {
        console.log(`   ${level}: ${count} matchs`)
      })
      
      if (strictATPMatches.length > 0) {
        console.log('📋 Matchs ATP OFFICIELS confirmés:')
        strictATPMatches.slice(0, 8).forEach((match, i) => {
          console.log(`  ${i + 1}. ${match.player1.name} vs ${match.player2.name}`)
          console.log(`      🏆 ${match.tournament.name} (${match.tournament.level})`)
          console.log(`      🎾 ${match.surface} - ${match.scores.player1.sets}-${match.scores.player2.sets}`)
        })
      }
      
      return strictATPMatches

    } catch (error) {
      console.error('❌ Erreur récupération matchs ATP officiels juillet:', error)
      return []
    }
  }

  // 🎾 FILTRAGE ULTRA-STRICT POUR ATP OFFICIEL UNIQUEMENT  
  private isStrictATPMatch(match: any): boolean {
    const tournamentName = String(match.tournament_name || '').toLowerCase()
    const leagueName = String(match.league_name || '').toLowerCase()
    const seasonName = String(match.season_name || '').toLowerCase()
    const importance = match.tournament_importance || 0
    
    console.log(`🔍 ANALYSE STRICTE: "${tournamentName}" - Importance: ${importance}`)
    
    // EXCLUSIONS STRICTES (tout ce qui N'EST PAS ATP officiel)
    const strictExclusions = [
      'wta',
      'women',
      'ladies',
      'junior',
      'youth',
      'doubles',
      'mixed',
      'wheelchair',
      'legends',
      'senior',
      'exhibition',
      'challenger',  // 🚫 CHALLENGER = PAS ATP
      'futures',     // 🚫 FUTURES = PAS ATP
      'itf',         // 🚫 ITF = PAS ATP
      'atp challenger', // 🚫 ATP CHALLENGER = PAS ATP TOUR
      'qualifying',  // 🚫 QUALIFICATIONS
      'wildcard'
    ]
    
    // Exclure immédiatement si contient des exclusions
    const hasExclusion = strictExclusions.some(exclusion => 
      tournamentName.includes(exclusion) || 
      leagueName.includes(exclusion) ||
      seasonName.includes(exclusion)
    )
    
    if (hasExclusion) {
      const foundExclusion = strictExclusions.find(e => 
        tournamentName.includes(e) || leagueName.includes(e) || seasonName.includes(e)
      )
      console.log(`❌ EXCLU (${foundExclusion}): ${tournamentName}`)
      return false
    }

    // LISTE OFFICIELLE DES TOURNOIS ATP VALIDES UNIQUEMENT
    const officialATPTournaments = [
      // 🏆 GRAND CHELEM (2000 points)
      'wimbledon',
      'us open',
      'french open', 
      'australian open',
      'roland garros',
      
      // 🥇 MASTERS 1000 (1000 points)
      'indian wells',           // BNP Paribas Open
      'miami open',             // Miami Open
      'monte carlo masters',    // Monte-Carlo Masters
      'madrid open',            // Mutua Madrid Open
      'rome masters',           // Italian Open
      'rogers cup',             // Canadian Open
      'cincinnati masters',     // Western & Southern Open
      'shanghai masters',       // Shanghai Masters
      'paris masters',          // Paris Masters
      
      // 🥈 ATP 500 (500 points)
      'barcelona open',         // Barcelona Open
      'hamburg open',          // Hamburg Open
      'halle open',            // Halle Open
      'queens club',           // Queen's Club Championships
      'stuttgart open',        
      'geneva open',
      'lyon open',
      'rotterdam open',
      'dubai open',
      'acapulco open',
      'rio open',
      'memphis open',
      'delray beach open',
      'washington open',
      'tokyo open',
      'vienna open',
      'basel open',
      
      // 🥉 ATP 250 (250 points) - Principaux
      'adelaide international',
      'auckland open',
      'doha open',
      'pune open',
      'cordoba open',
      'buenos aires open',
      'santiago open',
      'houston open',
      'marrakech open',
      'budapest open',
      'munich open',
      'estoril open',
      'geneva open',
      'lyon open',
      'eastbourne international',
      'newport open',
      'los cabos open',
      'kitzbuhel open',
      'gstaad open',
      'umag open',
      'atlanta open',
      'winston-salem open'
    ]
    
    // Vérifier si c'est dans la liste officielle ATP
    const isOfficialATP = officialATPTournaments.some(tournament => 
      tournamentName.includes(tournament)
    )
    
    // Vérifier par importance (système ATP)
    const hasATPImportance = (
      importance >= 2000 ||  // Grand Chelem
      importance >= 1000 ||  // Masters 1000
      importance >= 500 ||   // ATP 500
      importance >= 250      // ATP 250
    )
    
    // Vérifier par mots-clés ATP officiels
    const hasOfficialATPKeywords = (
      tournamentName.includes('atp masters') ||
      tournamentName.includes('atp 1000') ||
      tournamentName.includes('atp 500') ||
      tournamentName.includes('atp 250') ||
      (tournamentName.includes('atp') && !tournamentName.includes('challenger'))
    )
    
    const result = isOfficialATP || (hasATPImportance && hasOfficialATPKeywords)
    
    if (result) {
      console.log(`✅ ATP OFFICIEL CONFIRMÉ: ${tournamentName} (importance: ${importance})`)
    } else {
      console.log(`❌ PAS ATP OFFICIEL: ${tournamentName} (importance: ${importance})`)
    }
    
    return result
  }

  // 🎾 FORMATER MATCH TENNIS (avec vraie structure)
  private formatTennisMatchReal(rawMatch: any): TennisMatch {
    return {
      id: rawMatch.id?.toString() || `tennis_${Date.now()}_${Math.random()}`,
      player1: {
        name: rawMatch.home_team_name || 'Player 1',
        ranking: null, // Pas disponible dans cette API
        country: null
      },
      player2: {
        name: rawMatch.away_team_name || 'Player 2',
        ranking: null,
        country: null
      },
      tournament: {
        name: rawMatch.tournament_name || 'Tennis Tournament',
        level: this.extractTournamentLevelReal(rawMatch),
        surface: rawMatch.ground_type || this.guessSurface(rawMatch.tournament_name),
        importance: rawMatch.tournament_importance
      },
      venue: {
        name: rawMatch.arena_name || 'Tennis Court',
        city: 'Unknown City', // Pas dans l'API
        country: 'Unknown Country'
      },
      date: rawMatch.start_time || rawMatch.specific_start_time || new Date().toISOString(),
      status: this.mapTennisStatusReal(rawMatch.status_type),
      scores: this.extractTennisScoresReal(rawMatch),
      round: rawMatch.round?.name || rawMatch.round || 'Round',
      surface: rawMatch.ground_type || 'Hard'
    }
  }

  // 🎾 EXTRAIRE SCORES TENNIS (structure réelle)
  private extractTennisScoresReal(rawMatch: any): TennisMatch['scores'] {
    const defaultScores = {
      player1: { sets: 0, games: [] },
      player2: { sets: 0, games: [] }
    }

    try {
      const homeScore = rawMatch.home_team_score
      const awayScore = rawMatch.away_team_score
      
      if (homeScore && awayScore) {
        // Les scores sont en JSONB, essayer de les parser
        return {
          player1: {
            sets: homeScore.sets || homeScore.current || 0,
            games: homeScore.games || homeScore.series || [],
            tiebreaks: homeScore.tiebreaks || []
          },
          player2: {
            sets: awayScore.sets || awayScore.current || 0,
            games: awayScore.games || awayScore.series || [],
            tiebreaks: awayScore.tiebreaks || []
          }
        }
      }

      return defaultScores
    } catch (error) {
      console.log('⚠️ Erreur extraction scores, utilisation par défaut')
      return defaultScores
    }
  }

  // 🎾 MAPPER STATUTS TENNIS (structure réelle)
  private mapTennisStatusReal(statusType: string): string {
    if (!statusType) return 'SCHEDULED'
    
    const status = statusType.toLowerCase()
    
    if (status === 'finished') return 'FINISHED'
    if (status === 'live') return 'LIVE'
    if (status === 'upcoming') return 'SCHEDULED'
    if (status === 'postponed') return 'POSTPONED'
    if (status === 'canceled' || status === 'cancelled') return 'CANCELLED'
    if (status === 'suspended') return 'POSTPONED'
    
    return 'SCHEDULED'
  }

  // 🎾 EXTRAIRE NIVEAU TOURNOI (structure réelle avec classification ATP)
  private extractTournamentLevelReal(rawMatch: any): string {
    const tournamentName = String(rawMatch.tournament_name || '').toLowerCase()
    const importance = rawMatch.tournament_importance || 0
    
    // Classification par importance ATP officielle
    if (importance >= 2000) {
      return 'Grand Chelem'
    }
    
    if (importance >= 1000) {
      return 'ATP Masters 1000'
    }
    
    if (importance >= 500) {
      return 'ATP 500'
    }
    
    if (importance >= 250) {
      return 'ATP 250'
    }
    
    // Classification par nom si importance pas disponible
    if (tournamentName.includes('grand slam') || 
        tournamentName.includes('wimbledon') || 
        tournamentName.includes('us open') || 
        tournamentName.includes('french open') || 
        tournamentName.includes('australian open') ||
        tournamentName.includes('roland garros')) {
      return 'Grand Chelem'
    }
    
    if (tournamentName.includes('masters') || 
        tournamentName.includes('1000') ||
        tournamentName.includes('indian wells') ||
        tournamentName.includes('miami') ||
        tournamentName.includes('madrid') ||
        tournamentName.includes('rome') ||
        tournamentName.includes('shanghai') ||
        tournamentName.includes('paris masters')) {
      return 'ATP Masters 1000'
    }
    
    if (tournamentName.includes('500') ||
        tournamentName.includes('barcelona') ||
        tournamentName.includes('hamburg') ||
        tournamentName.includes('halle') ||
        tournamentName.includes('queens')) {
      return 'ATP 500'
    }
    
    if (tournamentName.includes('250') ||
        tournamentName.includes('atp')) {
      return 'ATP 250'
    }
    
    return 'ATP Tournament'
  }

  // 🎾 DEVINER LA SURFACE SELON LE TOURNOI
  private guessSurface(tournamentName?: string): string {
    if (!tournamentName) return 'Hard'
    
    const name = tournamentName.toLowerCase()
    
    if (name.includes('wimbledon')) return 'Grass'
    if (name.includes('roland garros') || name.includes('french open') || name.includes('clay')) return 'Clay'
    if (name.includes('us open') || name.includes('australian open') || name.includes('masters')) return 'Hard'
    
    return 'Hard' // Par défaut
  }

  // 🎾 IMPORT TENNIS EN BASE AVEC ÉCONOMIE DE REQUÊTES
  async importTennisMatches(): Promise<{
    imported: number
    skipped: number
    errors: number
    examples: string[]
    requestsUsed: number
    quotaRemaining: number
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: [] as string[],
      requestsUsed: 0,
      quotaRemaining: 0
    }

    try {
      console.log('🎾 DÉBUT IMPORT TENNIS ATP - Économique')
      
      // Récupérer matchs ATP récents (1 seule requête)
      const matches = await this.getRecentATPMatches(50)
      
      if (matches.length === 0) {
        console.log('❌ Aucun match ATP trouvé')
        return result
      }

      console.log(`🎾 ${matches.length} matchs ATP à importer`)

      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      // Ajouter TENNIS à l'enum Sport si pas déjà fait
      // Note: Il faut d'abord mettre à jour le schema Prisma

      for (const match of matches) {
        try {
          // Vérifier si existe déjà
          const existing = await prisma.match.findFirst({
            where: {
              OR: [
                { apiMatchId: parseInt(match.id) },
                {
                  AND: [
                    { homeTeam: match.player1.name },
                    { awayTeam: match.player2.name },
                    { sport: 'TENNIS' as any }, // Cast pour éviter erreur TypeScript
                    { date: new Date(match.date) }
                  ]
                }
              ]
            }
          })

          if (existing) {
            result.skipped++
            continue
          }

          // Créer le match tennis
          const matchData = {
            apiMatchId: parseInt(match.id) || Math.floor(Math.random() * 1000000),
            sport: 'TENNIS' as any, // Cast temporaire
            homeTeam: match.player1.name,
            awayTeam: match.player2.name,
            homeScore: match.scores.player1.sets,
            awayScore: match.scores.player2.sets,
            date: new Date(match.date),
            status: match.status,
            competition: match.tournament.name,
            season: new Date(match.date).getFullYear().toString(),
            venue: `${match.venue.name}, ${match.venue.city}`,
            referee: null,
            homeTeamLogo: null,
            awayTeamLogo: null,
            details: {
              type: 'TENNIS_MATCH',
              tournament: match.tournament,
              venue: match.venue,
              surface: match.surface,
              round: match.round,
              scores: match.scores,
              player1: match.player1,
              player2: match.player2,
              source: 'SportDevs Tennis API'
            }
          }

          await prisma.match.create({ data: matchData })
          result.imported++
          
          if (result.examples.length < 5) {
            result.examples.push(`${match.player1.name} vs ${match.player2.name} (${match.tournament.name})`)
          }

          console.log(`✅ Match tennis importé: ${match.player1.name} vs ${match.player2.name}`)

        } catch (error) {
          console.error(`❌ Erreur import match ${match.id}:`, error)
          result.errors++
        }
      }

      await prisma.$disconnect()

      result.requestsUsed = this.requestCount
      result.quotaRemaining = 300 - this.requestCount

      console.log(`🎾 Import tennis terminé: ${result.imported} importés, ${result.requestsUsed} requêtes utilisées`)

    } catch (error) {
      console.error('❌ Erreur import tennis:', error)
      result.errors++
    }

    return result
  }

  // 🎾 TEST CONNEXION TENNIS API
  async testConnection(): Promise<{
    success: boolean
    message: string
    sampleData?: any
    requestsUsed: number
  }> {
    try {
      console.log('🔍 Test connexion Tennis SportDevs API via RapidAPI...')
      
      // Test avec endpoint simple d'abord
      const testMatches = await this.makeRequest('/matches?limit=3')
      
      if (Array.isArray(testMatches) && testMatches.length > 0) {
        const sampleMatch = testMatches[0]
        
        console.log('📋 Échantillon de match reçu:', {
          id: sampleMatch.id,
          home: sampleMatch.home_team_name,
          away: sampleMatch.away_team_name,
          tournament: sampleMatch.tournament_name
        })
        
        return {
          success: true,
          message: `✅ Tennis API connectée via RapidAPI - ${testMatches.length} matchs de test récupérés`,
          sampleData: {
            totalMatches: testMatches.length,
            sampleMatch: {
              id: sampleMatch.id,
              player1: sampleMatch.home_team_name,
              player2: sampleMatch.away_team_name,
              tournament: sampleMatch.tournament_name,
              status: sampleMatch.status_type,
              surface: sampleMatch.ground_type,
              venue: sampleMatch.arena_name,
              date: sampleMatch.start_time
            },
            apiStructure: {
              hasPlayers: !!(sampleMatch.home_team_name && sampleMatch.away_team_name),
              hasTournament: !!sampleMatch.tournament_name,
              hasStatus: !!sampleMatch.status_type,
              hasScores: !!(sampleMatch.home_team_score || sampleMatch.away_team_score),
              hasSurface: !!sampleMatch.ground_type
            }
          },
          requestsUsed: this.requestCount
        }
      } else {
        return {
          success: false,
          message: '❌ API connectée mais aucun match trouvé ou format inattendu',
          sampleData: {
            responseType: typeof testMatches,
            responseContent: testMatches
          },
          requestsUsed: this.requestCount
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur test connexion:', error)
      return {
        success: false,
        message: `❌ Erreur Tennis API: ${error.message}`,
        sampleData: {
          errorDetails: error.message,
          rapidAPIHost: SPORTDEVS_TENNIS_HOST,
          hasAPIKey: !!RAPIDAPI_KEY
        },
        requestsUsed: this.requestCount
      }
    }
  }

  // 🎾 OBTENIR STATUT QUOTA
  getQuotaStatus() {
    return {
      used: this.requestCount,
      remaining: this.MAX_DAILY_REQUESTS - this.requestCount,
      dailyLimit: this.MAX_DAILY_REQUESTS,
      globalLimit: 300,
      percentage: Math.round((this.requestCount / this.MAX_DAILY_REQUESTS) * 100)
    }
  }
}

// 🎾 EXPORT SINGLETON
export const tennisSportDevsAPI = new TennisSportDevsAPI()

// 🎾 TYPES D'EXPORT
export type { TennisMatch }

// 🎾 FONCTIONS UTILITAIRES
export function formatTennisScore(scores: TennisMatch['scores']): string {
  const sets1 = scores.player1.sets
  const sets2 = scores.player2.sets
  
  if (scores.player1.games.length > 0 && scores.player2.games.length > 0) {
    const gameScores = scores.player1.games
      .map((g, i) => `${g}-${scores.player2.games[i] || 0}`)
      .join(', ')
    return `${sets1}-${sets2} (${gameScores})`
  }
  
  return `${sets1}-${sets2}`
}

export function getTennisMatchResult(match: TennisMatch): string {
  if (match.status !== 'FINISHED') {
    return 'Match en cours ou à venir'
  }
  
  const winner = match.scores.player1.sets > match.scores.player2.sets 
    ? match.player1.name 
    : match.player2.name
    
  const score = formatTennisScore(match.scores)
  
  return `${winner} gagne ${score}`
}

export default tennisSportDevsAPI