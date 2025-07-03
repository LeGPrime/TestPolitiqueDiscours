// lib/f1-api.ts - VERSION INTELLIGENTE
// 1 GP importé = toutes les sessions dynamiques

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = "api-formula-1.p.rapidapi.com"

interface F1Session {
  id: number
  type: 'race' | 'qualifying' | 'sprint' | 'practice'
  name: string
  date: string
  status: string
  results?: F1SessionResult[]
}

interface F1SessionResult {
  driver: {
    id: number
    name: string
    abbr: string
    number: number
    team: string
  }
  position: number
  time?: string
  gap?: string
  points?: number
  grid?: number
  laps?: number
  fastest_lap?: {
    time: string
    lap: number
  }
}

interface F1Weekend {
  id: number
  name: string // "Spanish Grand Prix"
  circuit: {
    id: number
    name: string
    length: number
    image?: string
  }
  location: {
    country: string
    city: string
  }
  date: string
  status: string
  sessions: F1Session[]
}

class F1APIService {
  private baseUrl = `https://${RAPIDAPI_HOST}`
  
  private async request(endpoint: string): Promise<any> {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY non configurée pour l\'API F1')
    }

    console.log(`🏁 API F1 Request: ${endpoint}`)

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API F1: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || data
  }

  // 🎯 RÉCUPÉRER SEULEMENT LES WEEK-ENDS GP 2025
  async getF1Weekends2025(): Promise<F1Weekend[]> {
    try {
      console.log(`🏁 Récupération des week-ends F1 2025...`)
      
      // Récupérer toutes les courses 2025
      const allRaces = await this.request(`/races?season=2025`)
      console.log(`📊 Total événements trouvés: ${allRaces.length}`)
      
      // 🔍 GROUPER par week-end de GP
      const weekendMap = new Map<string, F1Weekend>()
      
      allRaces.forEach((race: any) => {
        // Identifier le nom du GP principal (sans "Practice", "Qualifying", etc.)
        let gpName = race.competition?.name || ''
        
        // Nettoyer le nom pour grouper
        gpName = gpName
          .replace(/Practice \d+/g, '')
          .replace(/Qualifying/g, '')
          .replace(/Sprint.*$/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        
        // Si c'est un vrai GP (contient "Grand Prix" ou "GP")
        if (gpName.includes('Grand Prix') || gpName.includes(' GP')) {
          const weekendKey = `${gpName}_${race.circuit?.name}`
          
          if (!weekendMap.has(weekendKey)) {
            weekendMap.set(weekendKey, {
              id: race.id,
              name: gpName,
              circuit: race.circuit || {},
              location: race.competition?.location || {},
              date: race.date,
              status: race.status,
              sessions: []
            })
          }
          
          // Ajouter cette session au week-end
          const weekend = weekendMap.get(weekendKey)!
          const sessionType = this.getSessionType(race.competition?.name || '')
          
          weekend.sessions.push({
            id: race.id,
            type: sessionType,
            name: race.competition?.name || '',
            date: race.date,
            status: race.status
          })
        }
      })
      
      const weekends = Array.from(weekendMap.values())
      console.log(`✅ ${weekends.length} week-ends GP trouvés`)
      
      // Afficher les week-ends trouvés
      weekends.forEach((weekend, index) => {
        console.log(`${index + 1}. ${weekend.name} - ${weekend.circuit.name}`)
        console.log(`   Sessions: ${weekend.sessions.map(s => s.type).join(', ')}`)
      })
      
      return weekends
      
    } catch (error) {
      console.error('❌ Erreur getF1Weekends2025:', error)
      return []
    }
  }

  // 🔍 DÉTERMINER LE TYPE DE SESSION
  private getSessionType(sessionName: string): F1Session['type'] {
    const name = sessionName.toLowerCase()
    
    if (name.includes('practice') || name.includes('free practice')) {
      return 'practice'
    }
    if (name.includes('qualifying')) {
      return 'qualifying'
    }
    if (name.includes('sprint')) {
      return 'sprint'
    }
    return 'race' // Course principale par défaut
  }

  // 🏁 RÉCUPÉRER TOUTES LES SESSIONS D'UN WEEK-END
  async getWeekendDetails(weekendId: string): Promise<{
    weekend: F1Weekend
    sessions: {
      race?: F1SessionResult[]
      qualifying?: F1SessionResult[]
      sprint?: F1SessionResult[]
      practice?: F1SessionResult[]
    }
  }> {
    try {
      console.log(`🏁 Récupération détails week-end ${weekendId}...`)
      
      // Récupérer le week-end depuis la base
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const match = await prisma.match.findUnique({
        where: { id: weekendId }
      })
      
      if (!match || match.sport !== 'F1') {
        throw new Error('Week-end F1 non trouvé')
      }
      
      // Récupérer les détails depuis l'API si on a l'ID API
      if (match.apiMatchId) {
        return await this.getWeekendSessionsFromAPI(match.apiMatchId)
      }
      
      // Sinon générer des données mock
      return this.generateMockWeekendData(match)
      
    } catch (error) {
      console.error('❌ Erreur getWeekendDetails:', error)
      throw error
    }
  }

  // 📡 RÉCUPÉRER LES SESSIONS DEPUIS L'API
  private async getWeekendSessionsFromAPI(apiRaceId: number): Promise<any> {
    try {
      const sessions = {
        race: null,
        qualifying: null,
        sprint: null,
        practice: null
      }
      
      // Essayer de récupérer chaque type de session
      try {
        sessions.race = await this.request(`/races/${apiRaceId}/results`)
        console.log(`✅ Course principale: ${sessions.race?.length || 0} résultats`)
      } catch (e) {
        console.log('⚠️ Pas de résultats de course')
      }
      
      try {
        sessions.qualifying = await this.request(`/races/${apiRaceId}/qualifying`)
        console.log(`✅ Qualifications: ${sessions.qualifying?.length || 0} résultats`)
      } catch (e) {
        console.log('⚠️ Pas de résultats de qualifications')
      }
      
      try {
        sessions.sprint = await this.request(`/races/${apiRaceId}/sprint`)
        console.log(`✅ Sprint: ${sessions.sprint?.length || 0} résultats`)
      } catch (e) {
        console.log('⚠️ Pas de course sprint')
      }
      
      // Note: On ignore les essais libres pour éviter le spam
      
      return { sessions }
      
    } catch (error) {
      console.error('❌ Erreur API sessions:', error)
      return { sessions: {} }
    }
  }

  // 🎭 GÉNÉRER DES DONNÉES MOCK POUR TEST
  private generateMockWeekendData(match: any): any {
    const mockDrivers = [
      { name: "Max Verstappen", number: 1, team: "Red Bull Racing" },
      { name: "Sergio Pérez", number: 11, team: "Red Bull Racing" },
      { name: "Lando Norris", number: 4, team: "McLaren" },
      { name: "Oscar Piastri", number: 81, team: "McLaren" },
      { name: "Charles Leclerc", number: 16, team: "Ferrari" },
      { name: "Carlos Sainz", number: 55, team: "Ferrari" },
      { name: "Lewis Hamilton", number: 44, team: "Mercedes" },
      { name: "George Russell", number: 63, team: "Mercedes" },
      { name: "Fernando Alonso", number: 14, team: "Aston Martin" },
      { name: "Lance Stroll", number: 18, team: "Aston Martin" },
      // ... autres pilotes
    ]

    const shuffled = [...mockDrivers].sort(() => Math.random() - 0.5)
    
    // Générer résultats de course
    const raceResults = shuffled.map((driver, index) => ({
      driver: {
        id: index + 1,
        name: driver.name,
        abbr: driver.name.split(' ').map(n => n[0]).join(''),
        number: driver.number,
        team: driver.team
      },
      position: index + 1,
      time: index === 0 ? "1:45:23.456" : `+${(index * 15 + Math.random() * 10).toFixed(3)}`,
      points: [25,18,15,12,10,8,6,4,2,1,0,0,0,0,0,0,0,0,0,0][index] || 0,
      laps: 70,
      grid: Math.floor(Math.random() * 20) + 1
    }))

    // Générer qualifications (ordre différent)
    const qualifyingResults = [...shuffled].sort(() => Math.random() - 0.5).map((driver, index) => ({
      driver: {
        id: index + 1,
        name: driver.name,
        abbr: driver.name.split(' ').map(n => n[0]).join(''),
        number: driver.number,
        team: driver.team
      },
      position: index + 1,
      time: `1:${(18 + Math.floor(index / 5)).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      gap: index === 0 ? null : `+${(index * 0.2 + Math.random() * 0.3).toFixed(3)}`
    }))

    return {
      sessions: {
        race: raceResults,
        qualifying: qualifyingResults,
        sprint: Math.random() > 0.5 ? raceResults.slice(0, 10) : null // Parfois pas de sprint
      }
    }
  }

  // 🆕 IMPORT OPTIMISÉ : 1 WEEK-END = 1 ENTRÉE
  async importF1Weekends2025(): Promise<{
    imported: number
    skipped: number
    errors: number
    examples: string[]
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: 0,
      examples: [] as string[]
    }

    try {
      const weekends = await this.getF1Weekends2025()
      console.log(`🏁 ${weekends.length} week-ends F1 trouvés pour 2025`)
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      for (const weekend of weekends) {
        try {
          console.log(`🔍 Traitement week-end: ${weekend.name}`)
          
          // Vérifier si ce week-end existe déjà
          const existing = await prisma.match.findFirst({
            where: {
              homeTeam: weekend.name,
              awayTeam: weekend.circuit.name,
              season: "2025",
              sport: "F1"
            }
          })

          if (existing) {
            console.log(`⚠️ Week-end déjà existant: ${weekend.name}`)
            result.skipped++
            continue
          }

          // Créer le week-end F1
          const weekendData = {
            apiMatchId: weekend.id,
            sport: 'F1' as const,
            homeTeam: weekend.name, // "Spanish Grand Prix"
            awayTeam: weekend.circuit.name, // "Circuit de Barcelona-Catalunya"
            homeScore: null,
            awayScore: null,
            date: new Date(weekend.date),
            status: this.convertF1Status(weekend.status),
            competition: "Formula 1 2025",
            season: "2025",
            venue: `${weekend.circuit.name}, ${weekend.location.city}`,
            referee: null,
            homeTeamLogo: weekend.circuit.image || null,
            awayTeamLogo: null,
            details: {
              type: 'F1_WEEKEND',
              circuit: weekend.circuit,
              location: weekend.location,
              sessions: weekend.sessions,
              totalSessions: weekend.sessions.length,
              hasRace: weekend.sessions.some(s => s.type === 'race'),
              hasQualifying: weekend.sessions.some(s => s.type === 'qualifying'),
              hasSprint: weekend.sessions.some(s => s.type === 'sprint')
            }
          }

          await prisma.match.create({ data: weekendData })
          result.imported++
          result.examples.push(`${weekend.name} (${weekend.sessions.length} sessions)`)
          console.log(`✅ Week-end importé: ${weekend.name}`)

        } catch (error) {
          console.error(`❌ Erreur import week-end ${weekend.id}:`, error)
          result.errors++
        }
      }

      await prisma.$disconnect()

    } catch (error) {
      console.error('❌ Erreur importF1Weekends2025:', error)
      result.errors++
    }

    return result
  }

  private convertF1Status(f1Status: string): string {
    const statusMap: Record<string, string> = {
      'Completed': 'FINISHED',
      'Finished': 'FINISHED',
      'Cancelled': 'CANCELLED',
      'Postponed': 'POSTPONED',
      'Scheduled': 'SCHEDULED'
    }
    
    return statusMap[f1Status] || f1Status
  }

  // Autres méthodes inchangées...
  async getDrivers(season: number = 2025): Promise<any[]> {
    try {
      console.log(`👨‍✈️ Récupération pilotes F1 ${season}...`)
      const drivers = await this.request(`/drivers?season=${season}`)
      console.log(`✅ ${drivers.length} pilotes trouvés pour ${season}`)
      return drivers
    } catch (error) {
      console.error('❌ Erreur getDrivers:', error)
      return []
    }
  }

  async testConnection2025(): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      console.log('🔍 Test connexion API F1 2025 - Week-ends...')
      const weekends = await this.getF1Weekends2025()
      
      return {
        success: true,
        message: `✅ API F1 connectée - ${weekends.length} week-ends GP trouvés pour 2025`,
        data: {
          weekends: weekends.length,
          examples: weekends.slice(0, 3).map(w => `${w.name} (${w.sessions.length} sessions)`),
          details: 'Regroupement intelligent par week-end de GP'
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur test F1 2025:', error)
      return {
        success: false,
        message: `❌ Erreur API F1: ${error.message}`
      }
    }
  }
}

export const f1API = new F1APIService()
export type { F1Weekend, F1Session, F1SessionResult }