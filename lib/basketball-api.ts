// lib/basketball-api.ts - Service API Basketball NBA
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const BASKETBALL_API_HOST = 'api-basketball.p.rapidapi.com'

// 🏀 LIGUES BASKETBALL PRINCIPALES
export const BASKETBALL_LEAGUES = {
  NBA: 12, // NBA
  EUROLEAGUE: 120, // EuroLeague
} as const

// 🏀 INTERFACE MATCH BASKETBALL
export interface BasketballMatch {
  id: number
  date: string
  time: string
  timestamp: number
  timezone: string
  stage: string
  week: string | null
  status: {
    long: string
    short: string
    timer: string | null
  }
  league: {
    id: number
    name: string
    type: string
    season: number
    logo: string
  }
  country: {
    id: number
    name: string
    code: string
    flag: string
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
    home: {
      quarter_1: number | null
      quarter_2: number | null
      quarter_3: number | null
      quarter_4: number | null
      over_time: number | null
      total: number | null
    }
    away: {
      quarter_1: number | null
      quarter_2: number | null
      quarter_3: number | null
      quarter_4: number | null
      over_time: number | null
      total: number | null
    }
  }
}

// 🏀 INTERFACE JOUEUR BASKETBALL
export interface BasketballPlayer {
  id: number
  firstname: string
  lastname: string
  birth: {
    country: string
  }
  nba: {
    start: number
    pro: number
  }
  height: {
    meters: string
  }
  weight: {
    kilograms: string
  }
  affiliation: string
  leagues: {
    standard: {
      jersey: number
      active: boolean
      pos: string
    }
  }
}

// 🏀 CLASSE SERVICE API BASKETBALL
class BasketballAPIService {
  private quotaUsed = 0
  private dailyLimit = 100 // Limite quotidienne

  async makeRequest(endpoint: string): Promise<any> {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY non configurée')
    }

    if (this.quotaUsed >= this.dailyLimit) {
      throw new Error('Quota quotidien API Basketball dépassé')
    }

    try {
      console.log(`🏀 API Basketball: ${endpoint}`)
      
      const response = await fetch(`https://${BASKETBALL_API_HOST}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': BASKETBALL_API_HOST,
        }
      })

      this.quotaUsed++

      if (!response.ok) {
        throw new Error(`API Basketball Error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ API Basketball: ${data.response?.length || 0} résultats`)
      
      return data.response || []
    } catch (error) {
      console.error('❌ Erreur API Basketball:', error)
      throw error
    }
  }

  // 🏀 RÉCUPÉRER DÉTAILS COMPLETS D'UN MATCH
  async getMatchDetails(gameId: number): Promise<any> {
    const [gameData, statistics, players] = await Promise.all([
      this.makeRequest(`/games?id=${gameId}`),
      this.makeRequest(`/games/statistics/teams?game=${gameId}`),
      this.makeRequest(`/games/statistics/players?game=${gameId}`)
    ])

    return {
      game: gameData[0] || null,
      statistics: statistics || [],
      players: players || []
    }
  }

  // 🏀 RÉCUPÉRER MATCHS NBA DU JOUR
  async getTodaysNBAGames(): Promise<BasketballMatch[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.makeRequest(`/games?league=${BASKETBALL_LEAGUES.NBA}&season=2024-2025&date=${today}`)
  }

  // 🏀 RÉCUPÉRER MATCHS NBA RÉCENTS TERMINÉS
  async getFinishedNBAGames(days = 7): Promise<BasketballMatch[]> {
    const matches: BasketballMatch[] = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      try {
        const dayMatches = await this.makeRequest(
          `/games?league=${BASKETBALL_LEAGUES.NBA}&season=2024-2025&date=${dateStr}`
        )
        
        // Filtrer seulement les matchs terminés
        const finishedMatches = dayMatches.filter((match: BasketballMatch) => 
          match.status.short === 'FT' || match.status.long.includes('Finished')
        )
        
        matches.push(...finishedMatches)
        
        // Pause pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Erreur récupération matchs ${dateStr}:`, error)
      }
    }

    return matches
  }

  // 🏀 RÉCUPÉRER QUOTA RESTANT
  getQuotaStatus() {
    return {
      used: this.quotaUsed,
      remaining: this.dailyLimit - this.quotaUsed,
      limit: this.dailyLimit,
      percentage: Math.round((this.quotaUsed / this.dailyLimit) * 100)
    }
  }

  // 🏀 RESET QUOTA (à appeler chaque jour)
  resetQuota() {
    this.quotaUsed = 0
    console.log('🔄 Quota API Basketball réinitialisé')
  }

  // 🏀 VÉRIFIER SANTÉ DE L'API
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/status')
      return true
    } catch (error) {
      console.error('❌ API Basketball inaccessible:', error)
      return false
    }
  }
}

// 🏀 EXPORT SINGLETON
export const basketballAPI = new BasketballAPIService()

// 🏀 FONCTIONS UTILITAIRES
export function formatBasketballScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`
}

export function getBasketballGameStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'FT': 'Terminé',
    'Q1': '1er quart-temps',
    'Q2': '2ème quart-temps', 
    'Q3': '3ème quart-temps',
    'Q4': '4ème quart-temps',
    'OT': 'Prolongation',
    'LIVE': 'En cours',
    'HT': 'Mi-temps',
    'NS': 'Pas commencé'
  }
  
  return statusMap[status] || status
}

export function calculatePlayerEfficiency(stats: any): number {
  if (!stats) return 0
  
  const { points = 0, assists = 0, totReb = 0, steals = 0, blocks = 0, turnovers = 0, fgm = 0, fga = 0, ftm = 0, fta = 0 } = stats
  
  // Formule d'efficacité NBA simplifiée
  return points + assists + totReb + steals + blocks - turnovers - (fga - fgm) - (fta - ftm)
}

export default basketballAPI
