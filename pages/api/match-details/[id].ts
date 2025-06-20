// pages/api/match-details/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

interface DetailedMatchData {
  // Infos de base
  match: {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    date: string
    venue: string
    referee: string
    attendance?: number
    weather?: string
  }
  
  // Événements minute par minute
  events: Array<{
    minute: number
    type: 'GOAL' | 'CARD' | 'SUBSTITUTION'
    team: string
    player: string
    detail?: string
    assist?: string
  }>
  
  // Compositions complètes
  lineups: {
    home: {
      formation: string
      startXI: Array<{
        player: string
        number: number
        position: string
      }>
      substitutes: Array<{
        player: string
        number: number
        position: string
      }>
      coach: string
    }
    away: {
      formation: string
      startXI: Array<{
        player: string
        number: number
        position: string
      }>
      substitutes: Array<{
        player: string
        number: number
        position: string
      }>
      coach: string
    }
  }
  
  // Statistiques complètes
  statistics: {
    home: Record<string, any>
    away: Record<string, any>
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log(`🔍 Récupération détails complets pour match ${id}...`)
    
    // 1. Récupérer le match de la DB
    const match = await prisma.match.findUnique({
      where: { id: id as string },
      include: {
        ratings: {
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true }
            }
          }
        }
      }
    })

    if (!match) {
      return res.status(404).json({ error: 'Match non trouvé' })
    }

    // 2. Récupérer TOUS les détails via l'API
    const detailedData = await fetchCompleteMatchData(match.apiMatchId)

    // 3. Combiner tout
    const completeMatchData: DetailedMatchData = {
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore || 0,
        awayScore: match.awayScore || 0,
        date: match.date.toISOString(),
        venue: match.venue || 'N/A',
        referee: detailedData.referee || 'N/A',
        attendance: detailedData.attendance,
        weather: detailedData.weather
      },
      events: detailedData.events || [],
      lineups: detailedData.lineups || getEmptyLineups(),
      statistics: detailedData.statistics || {}
    }

    res.status(200).json({
      success: true,
      data: completeMatchData,
      ratings: match.ratings,
      avgRating: match.avgRating,
      totalRatings: match.totalRatings
    })

  } catch (error) {
    console.error('❌ Erreur détails match:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match details',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Récupérer TOUTES les données possibles de l'API
async function fetchCompleteMatchData(apiMatchId: number) {
  try {
    console.log(`📡 Récupération données API pour match ${apiMatchId}...`)
    
    // Requêtes parallèles pour récupérer tout
    const [fixtureData, eventsData, lineupsData, statisticsData] = await Promise.all([
      // 1. Détails de base du match
      fetchFromAPI(`/v3/fixtures?id=${apiMatchId}`),
      
      // 2. Événements (buts, cartons, remplacements)
      fetchFromAPI(`/v3/fixtures/events?fixture=${apiMatchId}`),
      
      // 3. Compositions d'équipes
      fetchFromAPI(`/v3/fixtures/lineups?fixture=${apiMatchId}`),
      
      // 4. Statistiques complètes
      fetchFromAPI(`/v3/fixtures/statistics?fixture=${apiMatchId}`)
    ])

    console.log(`✅ Données récupérées:`)
    console.log(`  📋 Événements: ${eventsData?.length || 0}`)
    console.log(`  👥 Lineups: ${lineupsData?.length || 0} équipes`)
    console.log(`  📊 Stats: ${statisticsData?.length || 0} groupes`)

    return {
      // Détails de base
      referee: fixtureData?.[0]?.fixture?.referee,
      attendance: fixtureData?.[0]?.fixture?.status?.attendance,
      weather: fixtureData?.[0]?.fixture?.weather,
      
      // Événements formatés
      events: formatEvents(eventsData || []),
      
      // Compositions formatées
      lineups: formatLineups(lineupsData || []),
      
      // Statistiques formatées
      statistics: formatStatistics(statisticsData || [])
    }

  } catch (error) {
    console.error('❌ Erreur API:', error)
    return {}
  }
}

// Requête à l'API
async function fetchFromAPI(endpoint: string) {
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': RAPIDAPI_HOST!,
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.response || []
  } catch (error) {
    console.error(`❌ Erreur ${endpoint}:`, error)
    return []
  }
}

// Formater les événements
function formatEvents(events: any[]) {
  return events.map(event => ({
    minute: event.time?.elapsed || 0,
    type: getEventType(event.type),
    team: event.team?.name || 'N/A',
    player: event.player?.name || 'N/A',
    detail: event.detail || '',
    assist: event.assist?.name || undefined
  })).sort((a, b) => a.minute - b.minute)
}

function getEventType(apiType: string): 'GOAL' | 'CARD' | 'SUBSTITUTION' {
  if (apiType === 'Goal') return 'GOAL'
  if (apiType === 'Card') return 'CARD'
  if (apiType === 'subst') return 'SUBSTITUTION'
  return 'GOAL' // Default
}

// Formater les compositions
function formatLineups(lineups: any[]) {
  if (lineups.length < 2) return getEmptyLineups()

  const home = lineups[0]
  const away = lineups[1]

  return {
    home: {
      formation: home.formation || 'N/A',
      startXI: home.startXI?.map((p: any) => ({
        player: p.player?.name || 'N/A',
        number: p.player?.number || 0,
        position: p.player?.pos || 'N/A'
      })) || [],
      substitutes: home.substitutes?.map((p: any) => ({
        player: p.player?.name || 'N/A',
        number: p.player?.number || 0,
        position: p.player?.pos || 'N/A'
      })) || [],
      coach: home.coach?.name || 'N/A'
    },
    away: {
      formation: away.formation || 'N/A',
      startXI: away.startXI?.map((p: any) => ({
        player: p.player?.name || 'N/A',
        number: p.player?.number || 0,
        position: p.player?.pos || 'N/A'
      })) || [],
      substitutes: away.substitutes?.map((p: any) => ({
        player: p.player?.name || 'N/A',
        number: p.player?.number || 0,
        position: p.player?.pos || 'N/A'
      })) || [],
      coach: away.coach?.name || 'N/A'
    }
  }
}

// Formater les statistiques
function formatStatistics(statistics: any[]) {
  if (statistics.length < 2) return {}

  const homeStats = statistics[0]?.statistics || []
  const awayStats = statistics[1]?.statistics || []

  const formatTeamStats = (stats: any[]) => {
    const formatted: Record<string, any> = {}
    stats.forEach((stat: any) => {
      formatted[stat.type] = stat.value
    })
    return formatted
  }

  return {
    home: formatTeamStats(homeStats),
    away: formatTeamStats(awayStats)
  }
}

function getEmptyLineups() {
  return {
    home: { formation: 'N/A', startXI: [], substitutes: [], coach: 'N/A' },
    away: { formation: 'N/A', startXI: [], substitutes: [], coach: 'N/A' }
  }
}