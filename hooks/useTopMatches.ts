// hooks/useTopMatches.ts
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  homeScore?: number
  awayScore?: number
  date: string
  competition: string
  sport: string
  venue?: string
  avgRating: number
  totalRatings: number
  trendDirection?: 'up' | 'down' | 'stable'
  ratings: Array<{
    id: string
    rating: number
    comment?: string
    user: { name?: string; username?: string }
  }>
}

interface TopMatchesData {
  topOfAllTime: Match[]
  hotThisWeek: Match[]
  byLeague: Record<string, Match[]>
  bySport: Record<string, {
    total: number
    matches: Match[]
    topRated: Match
    avgRating: number
  }>
  stats: {
    totalMatches: number
    totalRatings: number
    averageRating: number
    mostActiveWeek: string
  }
}

type Period = 'all-time' | 'year' | 'month' | 'week'

interface UseTopMatchesReturn {
  data: TopMatchesData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  period: Period
  setPeriod: (period: Period) => void
}

export function useTopMatches(): UseTopMatchesReturn {
  const [data, setData] = useState<TopMatchesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('all-time')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔄 Chargement top matches - période: ${period}`)
      
      const response = await axios.get(`/api/top-matches-enhanced?period=${period}`)
      setData(response.data)
      
      console.log(`✅ Top matches chargés:`, {
        topOfAllTime: response.data.topOfAllTime?.length || 0,
        hotThisWeek: response.data.hotThisWeek?.length || 0,
        sports: Object.keys(response.data.bySport || {}).length,
        leagues: Object.keys(response.data.byLeague || {}).length
      })
      
    } catch (err) {
      console.error('❌ Erreur chargement top matches:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [period])

  // Charger les données au montage et quand la période change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    period,
    setPeriod
  }
}

// Hook spécialisé pour une vue par sport
export function useTopMatchesBySport(sport?: string) {
  const { data, loading, error, refetch } = useTopMatches()
  
  const sportData = sport && data?.bySport[sport] ? data.bySport[sport] : null
  
  return {
    sportData,
    loading,
    error,
    refetch,
    availableSports: data ? Object.keys(data.bySport) : []
  }
}

// Hook pour les tendances
export function useTrendingMatches() {
  const { data, loading, error, refetch } = useTopMatches()
  
  const trendingUp = data?.hotThisWeek.filter(match => match.trendDirection === 'up') || []
  const trendingDown = data?.hotThisWeek.filter(match => match.trendDirection === 'down') || []
  
  return {
    trendingUp,
    trendingDown,
    loading,
    error,
    refetch
  }
}

// Fonctions utilitaires
export const topMatchesUtils = {
  // Formater le score selon le sport
  formatScore: (homeScore?: number, awayScore?: number, sport?: string) => {
    if (sport === 'F1') return '🏁'
    if (sport === 'MMA') return 'VS'
    return `${homeScore ?? '?'} - ${awayScore ?? '?'}`
  },

  // Configuration par sport
  getSportConfig: (sport: string) => {
    const configs = {
      'FOOTBALL': { 
        emoji: '⚽', 
        name: 'Football', 
        color: 'text-green-600', 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        border: 'border-green-200 dark:border-green-800' 
      },
      'BASKETBALL': { 
        emoji: '🏀', 
        name: 'Basketball', 
        color: 'text-orange-600', 
        bg: 'bg-orange-50 dark:bg-orange-900/20', 
        border: 'border-orange-200 dark:border-orange-800' 
      },
      'F1': { 
        emoji: '🏎️', 
        name: 'Formule 1', 
        color: 'text-red-600', 
        bg: 'bg-red-50 dark:bg-red-900/20', 
        border: 'border-red-200 dark:border-red-800' 
      },
      'MMA': { 
        emoji: '🥊', 
        name: 'MMA', 
        color: 'text-purple-600', 
        bg: 'bg-purple-50 dark:bg-purple-900/20', 
        border: 'border-purple-200 dark:border-purple-800' 
      },
      'RUGBY': { 
        emoji: '🏉', 
        name: 'Rugby', 
        color: 'text-blue-600', 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-200 dark:border-blue-800' 
      }
    }
    return configs[sport as keyof typeof configs] || configs['FOOTBALL']
  },

  // Obtenir le rang d'un match dans une liste
  getMatchRank: (match: Match, matches: Match[]) => {
    return matches.findIndex(m => m.id === match.id) + 1
  },

  // Filtrer par note minimum
  filterByMinRating: (matches: Match[], minRating: number) => {
    return matches.filter(match => match.avgRating >= minRating)
  },

  // Filtrer par nombre minimum de votes
  filterByMinVotes: (matches: Match[], minVotes: number) => {
    return matches.filter(match => match.totalRatings >= minVotes)
  },

  // Grouper par mois
  groupByMonth: (matches: Match[]) => {
    const groups: Record<string, Match[]> = {}
    
    matches.forEach(match => {
      const monthKey = new Date(match.date).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      })
      
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(match)
    })
    
    return groups
  },

  // Calculer les statistiques pour un ensemble de matchs
  calculateStats: (matches: Match[]) => {
    if (matches.length === 0) {
      return {
        totalMatches: 0,
        totalRatings: 0,
        averageRating: 0,
        topRated: null,
        mostPopular: null
      }
    }

    const totalRatings = matches.reduce((sum, match) => sum + match.totalRatings, 0)
    const averageRating = matches.reduce((sum, match) => sum + (match.avgRating * match.totalRatings), 0) / totalRatings
    const topRated = [...matches].sort((a, b) => b.avgRating - a.avgRating)[0]
    const mostPopular = [...matches].sort((a, b) => b.totalRatings - a.totalRatings)[0]

    return {
      totalMatches: matches.length,
      totalRatings,
      averageRating: Number(averageRating.toFixed(2)),
      topRated,
      mostPopular
    }
  }
}