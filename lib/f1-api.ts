// lib/f1-api.ts
// Service pour l'API Formula 1 officielle

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = "api-formula-1.p.rapidapi.com"

interface F1Race {
  id: number
  competition: {
    id: number
    name: string
    location: {
      country: string
      city: string
    }
  }
  circuit: {
    id: number
    name: string
    length: number
    image: string
  }
  date: string
  status: string
  season: number
  fastest_lap?: {
    driver: {
      id: number
      name: string
      abbr: string
    }
    time: string
  }
}

interface F1Driver {
  id: number
  name: string
  abbr: string
  number: number
  image: string
  nationality: string
  country: {
    name: string
    code: string
  }
  birthdate: string
  birthplace: string
  career_points: number
  world_championships: number
  highest_race_finish: number
  teams: Array<{
    team: {
      id: number
      name: string
      logo: string
    }
    season: number
  }>
}

interface F1RaceResult {
  driver: F1Driver
  team: {
    id: number
    name: string
    logo: string
  }
  position: number
  time: string | null
  points: number
  laps: number
  grid: number
  fastest_lap?: {
    lap: number
    time: string
    speed: string
  }
}

interface F1Ranking {
  position: number
  driver: F1Driver
  team: {
    id: number
    name: string
    logo: string
  }
  points: number
  wins: number
  behind: number | null
}

class F1APIService {
  private baseUrl = `https://${RAPIDAPI_HOST}`
  
  private async request(endpoint: string): Promise<any> {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY non configurée pour l\'API F1')
    }

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

  // Récupérer les courses d'une saison
  async getRaces(season: number = 2024): Promise<F1Race[]> {
    try {
      console.log(`🏁 Récupération des courses F1 ${season}...`)
      const races = await this.request(`/races?season=${season}`)
      console.log(`✅ ${races.length} courses trouvées pour ${season}`)
      return races
    } catch (error) {
      console.error('❌ Erreur getRaces:', error)
      return []
    }
  }

  // Récupérer les détails d'une course spécifique
  async getRaceDetails(raceId: number): Promise<F1Race | null> {
    try {
      console.log(`🏁 Récupération détails course ${raceId}...`)
      const race = await this.request(`/races/${raceId}`)
      return race
    } catch (error) {
      console.error('❌ Erreur getRaceDetails:', error)
      return null
    }
  }

  // Récupérer les résultats d'une course
  async getRaceResults(raceId: number): Promise<F1RaceResult[]> {
    try {
      console.log(`🏁 Récupération résultats course ${raceId}...`)
      const results = await this.request(`/races/${raceId}/results`)
      console.log(`✅ ${results.length} résultats trouvés`)
      return results
    } catch (error) {
      console.error('❌ Erreur getRaceResults:', error)
      return []
    }
  }

  // Récupérer tous les pilotes d'une saison
  async getDrivers(season: number = 2024): Promise<F1Driver[]> {
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

  // Récupérer le classement des pilotes
  async getDriversRanking(season: number = 2024): Promise<F1Ranking[]> {
    try {
      console.log(`🏆 Récupération classement pilotes ${season}...`)
      const ranking = await this.request(`/rankings/drivers?season=${season}`)
      console.log(`✅ Classement de ${ranking.length} pilotes récupéré`)
      return ranking
    } catch (error) {
      console.error('❌ Erreur getDriversRanking:', error)
      return []
    }
  }

  // Récupérer les qualifications d'une course
  async getQualifying(raceId: number): Promise<F1RaceResult[]> {
    try {
      console.log(`⏱️ Récupération qualifications course ${raceId}...`)
      const qualifying = await this.request(`/races/${raceId}/qualifying`)
      return qualifying
    } catch (error) {
      console.error('❌ Erreur getQualifying:', error)
      return []
    }
  }

  // Récupérer les séances d'entraînement
  async getPractice(raceId: number, practiceNumber: 1 | 2 | 3): Promise<F1RaceResult[]> {
    try {
      console.log(`🏃 Récupération Practice ${practiceNumber} course ${raceId}...`)
      const practice = await this.request(`/races/${raceId}/practice-${practiceNumber}`)
      return practice
    } catch (error) {
      console.error(`❌ Erreur getPractice${practiceNumber}:`, error)
      return []
    }
  }

  // Importer les courses F1 dans la base
  async importF1Races(season: number = 2024): Promise<{
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
      const races = await this.getRaces(season)
      console.log(`🏁 ${races.length} courses trouvées pour ${season}`)
      
      // Créer une seule instance Prisma
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      for (const race of races) {
        try {
          console.log(`🔍 Traitement course: ${race.competition.name} (ID: ${race.id})`)
          
          // Vérifier si la course existe déjà avec un identifiant unique
          const uniqueKey = `${race.id}_${season}`
          const existing = await prisma.match.findFirst({
            where: {
              OR: [
                { apiMatchId: race.id },
                { 
                  homeTeam: race.competition.name,
                  awayTeam: race.circuit.name,
                  season: season.toString()
                }
              ]
            }
          })

          if (existing) {
            console.log(`⚠️ Course déjà existante: ${race.competition.name}`)
            result.skipped++
            continue
          }

          // Convertir la course F1 au format Match
          const matchData = {
            apiMatchId: race.id,
            sport: 'F1' as const,
            homeTeam: race.competition.name, // Nom du GP
            awayTeam: race.circuit.name, // Nom du circuit
            homeScore: null, // Pas de score en F1
            awayScore: null,
            date: new Date(race.date),
            status: this.convertF1Status(race.status),
            competition: `Formula 1 ${season}`,
            season: season.toString(),
            venue: `${race.circuit.name}, ${race.competition.location.city}`,
            referee: null,
            homeTeamLogo: race.circuit.image,
            awayTeamLogo: null,
            details: {
              circuit: race.circuit,
              location: race.competition.location,
              fastest_lap: race.fastest_lap,
              type: 'F1_GRAND_PRIX',
              raceId: race.id
            }
          }

          await prisma.match.create({ data: matchData })
          result.imported++
          result.examples.push(`${race.competition.name} (${race.circuit.name})`)
          console.log(`✅ Course importée: ${race.competition.name}`)

        } catch (error) {
          console.error(`❌ Erreur import course ${race.id}:`, error)
          result.errors++
        }
      }

      await prisma.$disconnect()

    } catch (error) {
      console.error('❌ Erreur importF1Races:', error)
      result.errors++
    }

    return result
  }

  // Importer les pilotes F1 comme joueurs
  async importF1Drivers(season: number = 2024): Promise<{
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
      const drivers = await this.getDrivers(season)
      
      for (const driver of drivers) {
        try {
          const currentTeam = driver.teams.find(t => t.season === season)
          
          const playerData = {
            id: `f1_driver_${driver.id}`,
            name: driver.name,
            number: driver.number,
            position: 'DRIVER',
            team: currentTeam?.team.name || 'Formula 1',
            sport: 'F1' as const
          }

          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()
          
          const existing = await prisma.player.findUnique({
            where: { id: playerData.id }
          })

          if (existing) {
            result.skipped++
            continue
          }

          await prisma.player.create({ data: playerData })
          result.imported++
          result.examples.push(`${driver.name} (${currentTeam?.team.name || 'F1'})`)

        } catch (error) {
          console.error(`❌ Erreur import pilote ${driver.id}:`, error)
          result.errors++
        }
      }

    } catch (error) {
      console.error('❌ Erreur importF1Drivers:', error)
      result.errors++
    }

    return result
  }

  // Convertir le statut F1 vers notre format
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

  // Test de connexion
  async testConnection(): Promise<{
    success: boolean
    message: string
    data?: any
  }> {
    try {
      console.log('🔍 Test connexion API F1...')
      const races = await this.getRaces(2024)
      
      return {
        success: true,
        message: `✅ API F1 connectée - ${races.length} courses trouvées pour 2024`,
        data: {
          races: races.length,
          examples: races.slice(0, 3).map(r => r.competition.name)
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur test F1:', error)
      return {
        success: false,
        message: `❌ Erreur API F1: ${error.message}`
      }
    }
  }
}

export const f1API = new F1APIService()
export type { F1Race, F1Driver, F1RaceResult, F1Ranking }