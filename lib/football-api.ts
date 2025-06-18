import axios from 'axios'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

const apiSports = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}/v3`,
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  },
})

// Tracking des requêtes pour respecter le quota FREE
let dailyRequestCount = 0
const MAX_DAILY_REQUESTS = 95 // Garde 5 en sécurité

export interface APISportsMatch {
  fixture: {
    id: number
    date: string
    status: {
      short: string
    }
    venue?: {
      name: string
    }
  }
  league: {
    id: number
    name: string
    logo: string
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
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

// IDs des compétitions principales
export const LEAGUES = {
  PREMIER_LEAGUE: 39,
  LIGUE_1: 61,
  BUNDESLIGA: 78,
  SERIE_A: 135,
  LA_LIGA: 140,
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3
}

class APISportsService {
  private async makeRequest(endpoint: string, params: any = {}) {
    if (dailyRequestCount >= MAX_DAILY_REQUESTS) {
      console.log(`⚠️ Quota quotidien atteint (${dailyRequestCount}/${MAX_DAILY_REQUESTS})`)
      throw new Error('Quota quotidien API atteint')
    }

    try {
      console.log(`🔍 API Request ${dailyRequestCount + 1}/${MAX_DAILY_REQUESTS}: ${endpoint}`)
      const response = await apiSports.get(endpoint, { params })
      
      dailyRequestCount++
      console.log(`✅ Requête réussie. Quota: ${dailyRequestCount}/${MAX_DAILY_REQUESTS}`)
      
      return response.data.response
    } catch (error: any) {
      console.error(`❌ Erreur API:`, error.response?.status, error.response?.data)
      throw error
    }
  }

  // Récupérer matchs finis d'une date
  async getFinishedMatchesByDate(date: string): Promise<APISportsMatch[]> {
    return this.makeRequest('/fixtures', {
      date: date,
      status: 'FT',
      league: Object.values(LEAGUES).join(',')
    })
  }

  // Récupérer matchs d'une compétition pour une saison
  async getSeasonMatches(leagueId: number, season: number): Promise<APISportsMatch[]> {
    return this.makeRequest('/fixtures', {
      league: leagueId,
      season: season,
      status: 'FT'
    })
  }

  // Récupérer matchs d'une compétition pour un mois spécifique
  async getMonthlyMatches(leagueId: number, season: number, startDate: string, endDate: string): Promise<APISportsMatch[]> {
    return this.makeRequest('/fixtures', {
      league: leagueId,
      season: season,
      from: startDate,
      to: endDate,
      status: 'FT'
    })
  }

  // Rechercher matchs par équipe
  async searchMatchesByTeam(teamName: string, limit: number = 20): Promise<APISportsMatch[]> {
    // Pour économiser les requêtes, on cherche d'abord dans notre base
    console.log(`�� Recherche "${teamName}" (économie de quota)`)
    return []
  }

  // Reset du compteur quotidien (à minuit)
  resetDailyCount() {
    dailyRequestCount = 0
    console.log('🔄 Compteur quotidien remis à zéro')
  }

  // Statut actuel du quota
  getQuotaStatus() {
    return {
      used: dailyRequestCount,
      remaining: MAX_DAILY_REQUESTS - dailyRequestCount,
      total: MAX_DAILY_REQUESTS
    }
  }
}

export const apiSportsService = new APISportsService()
