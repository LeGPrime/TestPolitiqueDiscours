// lib/rugby-api.ts - SERVICE API RUGBY 2025
// 🏉 Import Rugby : Top 14, Champions Cup, Internationaux

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = "api-rugby.p.rapidapi.com"

interface RugbyMatch {
  id: number
  country: {
    name: string
    code: string
    flag: string
  }
  league: {
    id: number
    name: string
    type: string
    logo: string
  }
  season: string
  stage: string
  date: string
  status: {
    long: string
    short: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
    }
    away: {
      id: number
      name: string
      logo: string
    }
  }
  scores: {
    home: number | null
    away: number | null
  }
  venue: {
    id: number
    name: string
    city: string
    capacity: number
  }
}

interface RugbyTeam {
  id: number
  name: string
  logo: string
  founded: number
  country: {
    name: string
    code: string
    flag: string
  }
}

class RugbyAPIService {
  private baseUrl = `https://${RAPIDAPI_HOST}`
  
  // 🏉 COMPÉTITIONS CIBLES 2025
  private readonly targetCompetitions = [
    // 🇫🇷 TOP 14 (Elite française)
    { id: 16, name: "Top 14", priority: 1, type: "DOMESTIC" },
    
    // 🏆 EUROPEAN RUGBY CHAMPIONS CUP (ex-Heineken Cup)
    { id: 54, name: "European Rugby Champions Cup", priority: 1, type: "EUROPEAN" },
    
    // 🌍 INTERNATIONAUX (Six Nations + Rugby Championship + Tests)
    { id: 51, name: "Six Nations Championship", priority: 1, type: "INTERNATIONAL" },
    { id: 84, name: "International Friendlies", priority: 2, type: "INTERNATIONAL" },
    
    
  ]

  private async request(endpoint: string): Promise<any> {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY non configurée pour l\'API Rugby')
    }

    console.log(`🏉 API Rugby Request: ${endpoint}`)

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API Rugby: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || data
  }

  // 🏉 RÉCUPÉRER TOUS LES MATCHS RUGBY 2025
  async getRugbyMatches2025(): Promise<RugbyMatch[]> {
    try {
      console.log(`🏉 Récupération matchs rugby 2025...`)
      
      let allMatches: RugbyMatch[] = []
      
      // Récupérer les matchs pour chaque compétition cible
      for (const competition of this.targetCompetitions) {
        try {
          console.log(`🔍 Récupération ${competition.name}...`)
          
          // Récupérer les matchs depuis janvier 2025
          const matches = await this.request(`/games?league=${competition.id}&season=2025`)
          
          if (matches && matches.length > 0) {
            // Filtrer seulement les matchs depuis janvier 2025
            const filteredMatches = matches.filter((match: any) => {
              const matchDate = new Date(match.date)
              const startDate = new Date('2025-01-01')
              return matchDate >= startDate
            })
            
            console.log(`📊 ${competition.name}: ${filteredMatches.length} matchs trouvés`)
            allMatches.push(...filteredMatches)
          }
          
          // Délai pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 300))
          
        } catch (error) {
          console.warn(`⚠️ Erreur pour ${competition.name}:`, error)
        }
      }
      
      console.log(`✅ Total matchs rugby 2025: ${allMatches.length}`)
      return allMatches
      
    } catch (error) {
      console.error('❌ Erreur getRugbyMatches2025:', error)
      return []
    }
  }

  // 🏉 IMPORT COMPLET RUGBY 2025
  async importRugbyMatches2025(): Promise<{
    imported: number
    skipped: number
    errors: number
    examples: string[]
    competitions: string[]
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: [] as string[],
      competitions: [] as string[]
    }

    try {
      const matches = await this.getRugbyMatches2025()
      console.log(`🏉 ${matches.length} matchs rugby trouvés pour import`)
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const competitionsSet = new Set<string>()
      
      for (const match of matches) {
        try {
          console.log(`🔍 Traitement match: ${match.teams.home.name} vs ${match.teams.away.name}`)
          
          // Vérifier si le match existe déjà
          const existing = await prisma.match.findFirst({
            where: {
              apiMatchId: match.id,
              sport: "RUGBY"
            }
          })

          if (existing) {
            console.log(`⚠️ Match déjà existant: ${match.id}`)
            result.skipped++
            continue
          }

          // Convertir le statut
          const status = this.convertRugbyStatus(match.status.short)
          
          // Ajouter la compétition aux stats
          competitionsSet.add(match.league.name)

          // Créer le match rugby
          const matchData = {
            apiMatchId: match.id,
            sport: 'RUGBY' as const,
            homeTeam: match.teams.home.name,
            awayTeam: match.teams.away.name,
            homeScore: match.scores.home,
            awayScore: match.scores.away,
            date: new Date(match.date),
            status: status,
            competition: match.league.name,
            season: "2025",
            venue: match.venue ? `${match.venue.name}, ${match.venue.city}` : null,
            referee: null, // À compléter si disponible dans l'API
            homeTeamLogo: match.teams.home.logo || null,
            awayTeamLogo: match.teams.away.logo || null,
            details: {
              type: 'RUGBY_MATCH',
              league: match.league,
              country: match.country,
              stage: match.stage,
              venue: match.venue,
              originalStatus: match.status
            }
          }

          await prisma.match.create({ data: matchData })
          result.imported++
          
          // Ajouter aux exemples
          if (result.examples.length < 5) {
            result.examples.push(`${match.teams.home.name} vs ${match.teams.away.name} (${match.league.name})`)
          }
          
          console.log(`✅ Match rugby importé: ${match.teams.home.name} vs ${match.teams.away.name}`)

        } catch (error) {
          console.error(`❌ Erreur import match ${match.id}:`, error)
          result.errors++
        }
      }

      result.competitions = Array.from(competitionsSet)
      await prisma.$disconnect()

    } catch (error) {
      console.error('❌ Erreur importRugbyMatches2025:', error)
      result.errors++
    }

    return result
  }

  // 🏉 CONVERTIR STATUTS RUGBY
  private convertRugbyStatus(rugbyStatus: string): string {
    const statusMap: Record<string, string> = {
      'FT': 'FINISHED',      // Full Time
      'HT': 'LIVE',          // Half Time  
      'LIVE': 'LIVE',        // En cours
      'NS': 'SCHEDULED',     // Not Started
      'CANC': 'CANCELLED',   // Cancelled
      'POSTP': 'POSTPONED',  // Postponed
      'ABD': 'ABANDONED',    // Abandoned
      'AWD': 'FINISHED',     // Awarded (victoire sur tapis vert)
      'WO': 'FINISHED'       // Walkover
    }
    
    return statusMap[rugbyStatus] || rugbyStatus
  }

  // 🏉 RÉCUPÉRER ÉQUIPES RUGBY
  async getRugbyTeams(): Promise<RugbyTeam[]> {
    try {
      console.log(`🏉 Récupération équipes rugby...`)
      
      let allTeams: RugbyTeam[] = []
      
      // Récupérer les équipes des compétitions principales
      for (const competition of this.targetCompetitions.slice(0, 3)) { // Top 3 compétitions
        try {
          const teams = await this.request(`/teams?league=${competition.id}&season=2025`)
          if (teams && teams.length > 0) {
            allTeams.push(...teams)
            console.log(`📊 ${competition.name}: ${teams.length} équipes`)
          }
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error) {
          console.warn(`⚠️ Erreur équipes ${competition.name}:`, error)
        }
      }
      
      console.log(`✅ Total équipes rugby: ${allTeams.length}`)
      return allTeams
      
    } catch (error) {
      console.error('❌ Erreur getRugbyTeams:', error)
      return []
    }
  }

  // 🏉 TEST DE CONNEXION API RUGBY
  async testConnection(): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      console.log('🔍 Test connexion API Rugby...')
      
      // Tester avec une requête simple
      const testData = await this.request('/leagues?season=2025')
      
      if (testData && testData.length > 0) {
        const rugbyLeagues = testData.filter((league: any) => 
          league.sport === 'Rugby' || 
          league.name.toLowerCase().includes('rugby') ||
          this.targetCompetitions.some(comp => comp.name.includes(league.name))
        )
        
        return {
          success: true,
          message: `✅ API Rugby connectée - ${rugbyLeagues.length} ligues rugby trouvées`,
          data: {
            totalLeagues: testData.length,
            rugbyLeagues: rugbyLeagues.length,
            targetCompetitions: this.targetCompetitions.length,
            examples: rugbyLeagues.slice(0, 3).map((l: any) => l.name),
            competitions: this.targetCompetitions.map(c => c.name)
          }
        }
      } else {
        return {
          success: false,
          message: '❌ API Rugby: Aucune ligue trouvée'
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erreur test rugby:', error)
      return {
        success: false,
        message: `❌ Erreur API Rugby: ${error.message}`
      }
    }
  }

  // 🏉 IMPORT QUOTIDIEN RUGBY (pour le cron)
  async importDailyRugbyMatches(): Promise<{
    imported: number
    updated: number
    errors: number
  }> {
    const result = {
      imported: 0,
      updated: 0,
      errors: 0
    }

    try {
      console.log('🏉 Import quotidien rugby...')
      
      // Récupérer seulement les matchs récents (7 derniers jours)
      const matches = await this.getRugbyMatches2025()
      const recentMatches = matches.filter(match => {
        const matchDate = new Date(match.date)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return matchDate >= weekAgo
      })
      
      console.log(`🔍 ${recentMatches.length} matchs rugby récents à traiter`)
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      for (const match of recentMatches) {
        try {
          const existing = await prisma.match.findFirst({
            where: {
              apiMatchId: match.id,
              sport: "RUGBY"
            }
          })

          if (existing) {
            // Mettre à jour si nécessaire (scores, statut)
            if (existing.homeScore !== match.scores.home || 
                existing.awayScore !== match.scores.away ||
                existing.status !== this.convertRugbyStatus(match.status.short)) {
              
              await prisma.match.update({
                where: { id: existing.id },
                data: {
                  homeScore: match.scores.home,
                  awayScore: match.scores.away,
                  status: this.convertRugbyStatus(match.status.short)
                }
              })
              result.updated++
            }
          } else {
            // Nouveau match à importer
            const matchData = {
              apiMatchId: match.id,
              sport: 'RUGBY' as const,
              homeTeam: match.teams.home.name,
              awayTeam: match.teams.away.name,
              homeScore: match.scores.home,
              awayScore: match.scores.away,
              date: new Date(match.date),
              status: this.convertRugbyStatus(match.status.short),
              competition: match.league.name,
              season: "2025",
              venue: match.venue ? `${match.venue.name}, ${match.venue.city}` : null,
              referee: null,
              homeTeamLogo: match.teams.home.logo || null,
              awayTeamLogo: match.teams.away.logo || null,
              details: {
                type: 'RUGBY_MATCH',
                league: match.league,
                country: match.country,
                stage: match.stage,
                venue: match.venue,
                originalStatus: match.status
              }
            }

            await prisma.match.create({ data: matchData })
            result.imported++
          }
        } catch (error) {
          console.error(`❌ Erreur traitement match rugby ${match.id}:`, error)
          result.errors++
        }
      }
      
      await prisma.$disconnect()
      console.log(`✅ Import quotidien rugby terminé: ${result.imported} nouveaux, ${result.updated} mis à jour`)
      
    } catch (error) {
      console.error('❌ Erreur import quotidien rugby:', error)
      result.errors++
    }

    return result
  }
}

export const rugbyAPI = new RugbyAPIService()
export type { RugbyMatch, RugbyTeam }