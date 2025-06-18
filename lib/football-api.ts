import axios from 'axios'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
  console.warn('⚠️ Variables API-Sports manquantes dans .env')
}

const apiSports = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}/v3`,
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  },
})

// Tracking des requêtes pour respecter le quota FREE
let dailyRequestCount = 0
const MAX_DAILY_REQUESTS = 95 // Garde 5 en sécurité sur 100

export interface APISportsMatch {
  fixture: {
    id: number
    date: string
    status: {
      short: string
      long: string
    }
    venue?: {
      id: number
      name: string
      city: string
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    season: number
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
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

// IDs des compétitions principales API-Sports
export const LEAGUES = {
  PREMIER_LEAGUE: 39,        // Premier League
  LIGUE_1: 61,              // Ligue 1
  BUNDESLIGA: 78,           // Bundesliga
  SERIE_A: 135,             // Serie A
  LA_LIGA: 140,             // La Liga
  CHAMPIONS_LEAGUE: 2,      // UEFA Champions League
  EUROPA_LEAGUE: 3,         // UEFA Europa League
  MLS: 253,                 // MLS
  LIGUE_ARABE: 307,         // Saudi Pro League
  EURO: 4,                  // Euro Championship
  WORLD_CUP: 1,             // FIFA World Cup
}

class APISportsService {
  private async makeRequest(endpoint: string, params: any = {}) {
    if (dailyRequestCount >= MAX_DAILY_REQUESTS) {
      console.log(`⚠️ Quota quotidien atteint (${dailyRequestCount}/${MAX_DAILY_REQUESTS})`)
      throw new Error('Quota quotidien API atteint')
    }

    try {
      console.log(`🔍 API Request ${dailyRequestCount + 1}/${MAX_DAILY_REQUESTS}: ${endpoint}`)
      console.log(`📋 Params:`, params)
      
      const response = await apiSports.get(endpoint, { params })
      
      dailyRequestCount++
      console.log(`✅ Requête réussie. Quota: ${dailyRequestCount}/${MAX_DAILY_REQUESTS}`)
      console.log(`📊 ${response.data.response?.length || 0} résultats reçus`)
      
      return response.data.response
    } catch (error: any) {
      console.error(`❌ Erreur API:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        endpoint,
        params
      })
      throw error
    }
  }

  // Récupérer matchs finis d'une date (format: YYYY-MM-DD)
  async getFinishedMatchesByDate(date: string): Promise<APISportsMatch[]> {
    const leagueIds = Object.values(LEAGUES).join('-')
    
    return this.makeRequest('/fixtures', {
      date: date,
      status: 'FT',
      league: leagueIds,
      timezone: 'Europe/Paris'
    })
  }

  // Récupérer matchs d'une saison complète
  async getSeasonMatches(leagueId: number, season: number): Promise<APISportsMatch[]> {
    return this.makeRequest('/fixtures', {
      league: leagueId,
      season: season,
      status: 'FT',
      timezone: 'Europe/Paris'
    })
  }

  // Récupérer matchs d'aujourd'hui
  async getTodayMatches(): Promise<APISportsMatch[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getFinishedMatchesByDate(today)
  }

  // Récupérer matchs d'hier (pour import quotidien)
  async getYesterdayMatches(): Promise<APISportsMatch[]> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]
    return this.getFinishedMatchesByDate(dateStr)
  }

  // Test de connexion API
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Test de connexion API-Sports...')
      
      // Test simple : récupérer les ligues disponibles
      const response = await this.makeRequest('/leagues', {
        current: true
      })
      
      console.log(`✅ Connexion OK ! ${response.length} ligues disponibles`)
      return true
    } catch (error) {
      console.error('❌ Test de connexion échoué:', error)
      return false
    }
  }

  // Reset du compteur quotidien (à appeler à minuit)
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