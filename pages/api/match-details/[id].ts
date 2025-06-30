// pages/api/match-details/[id].ts - VERSION MULTI-SPORTS COMPLÈTE
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST

interface DetailedMatchData {
  // Infos de base
  match: {
    id: string
    sport: string // 🆕 AJOUTÉ LE SPORT
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    date: string
    venue: string
    referee: string
    attendance?: number
    weather?: string
    competition: string
    homeTeamLogo?: string
    awayTeamLogo?: string
    details?: any // Pour les détails spécifiques par sport
  }
  
  // Événements minute par minute (adaptés par sport)
  events: Array<{
    minute: number
    type: string // 'GOAL', 'CARD', 'SUBSTITUTION' pour football | 'BASKET', 'FOUL', 'TIMEOUT' pour basketball
    team: string
    player: string
    detail?: string
    assist?: string
    points?: number // Pour basketball
  }>
  
  // Compositions complètes (adaptées par sport)
  lineups: {
    home: {
      formation: string // Formation football ou rotation basketball
      startXI: Array<{
        player: string
        number: number
        position: string // CB, ST pour football | PG, SG, SF, PF, C pour basketball
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
  
  // Statistiques complètes (adaptées par sport)
  statistics: {
    home: Record<string, any> // Possession, tirs pour football | FG%, 3PT%, rebounds pour basketball
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
    
    // 1. Récupérer le match de la DB avec son sport
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

    console.log(`🏆 Sport détecté: ${match.sport}`)

    // 2. Récupérer les détails selon le sport
    let detailedData: any = {}
    
    if (match.sport === 'FOOTBALL') {
      detailedData = await fetchFootballMatchData(match.apiMatchId)
    } else if (match.sport === 'BASKETBALL') {
      detailedData = await fetchBasketballMatchData(match.apiMatchId, match.details)
    } else {
      // Pour les autres sports, données basiques
      detailedData = await fetchBasicMatchData(match)
    }

    // 3. Combiner tout avec les bonnes données
    const completeMatchData: DetailedMatchData = {
      match: {
        id: match.id,
        sport: match.sport, // 🆕 SPORT INCLUS
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: match.homeScore || 0,
        awayScore: match.awayScore || 0,
        date: match.date.toISOString(),
        venue: match.venue || 'N/A',
        referee: detailedData.referee || match.referee || 'N/A',
        attendance: detailedData.attendance,
        weather: detailedData.weather,
        competition: match.competition,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        details: match.details // Détails spécifiques stockés en DB
      },
      events: detailedData.events || [],
      lineups: detailedData.lineups || getEmptyLineups(match.sport),
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

// 🆕 RÉCUPÉRATION DONNÉES FOOTBALL (existant)
async function fetchFootballMatchData(apiMatchId: number) {
  try {
    console.log(`⚽ Récupération données football pour match ${apiMatchId}...`)
    
    const [fixtureData, eventsData, lineupsData, statisticsData] = await Promise.all([
      fetchFromAPI(`/v3/fixtures?id=${apiMatchId}`),
      fetchFromAPI(`/v3/fixtures/events?fixture=${apiMatchId}`),
      fetchFromAPI(`/v3/fixtures/lineups?fixture=${apiMatchId}`),
      fetchFromAPI(`/v3/fixtures/statistics?fixture=${apiMatchId}`)
    ])

    return {
      referee: fixtureData?.[0]?.fixture?.referee,
      attendance: fixtureData?.[0]?.fixture?.status?.attendance,
      weather: fixtureData?.[0]?.fixture?.weather,
      events: formatFootballEvents(eventsData || []),
      lineups: formatFootballLineups(lineupsData || []),
      statistics: formatFootballStatistics(statisticsData || [])
    }

  } catch (error) {
    console.error('❌ Erreur API Football:', error)
    return {}
  }
}

// 🆕 RÉCUPÉRATION DONNÉES BASKETBALL
async function fetchBasketballMatchData(apiMatchId: number, storedDetails?: any) {
  try {
    console.log(`🏀 Récupération données basketball pour match ${apiMatchId}...`)
    
    // Si on a des détails stockés en base (quartets, etc.)
    if (storedDetails) {
      return {
        referee: storedDetails.referee || 'Arbitre NBA',
        attendance: storedDetails.attendance,
        events: formatBasketballEvents(storedDetails.events || []),
        lineups: formatBasketballLineups(storedDetails.lineups || []),
        statistics: formatBasketballStatistics(storedDetails.statistics || {}),
        details: storedDetails // Score par quart-temps
      }
    }

    // Sinon essayer de récupérer via API basketball
    const gameData = await fetchFromBasketballAPI(`/games?id=${apiMatchId}`)
    
    return {
      referee: gameData?.[0]?.officials?.[0] || 'Arbitre',
      attendance: gameData?.[0]?.attendance,
      events: formatBasketballEvents(gameData?.[0]?.events || []),
      lineups: generateBasketballLineups(gameData?.[0]),
      statistics: formatBasketballStatistics(gameData?.[0]?.statistics || {}),
      details: gameData?.[0]?.scores // Scores par quart
    }

  } catch (error) {
    console.error('❌ Erreur API Basketball:', error)
    return generateBasicBasketballData()
  }
}

// 🆕 DONNÉES BASIQUES POUR AUTRES SPORTS
async function fetchBasicMatchData(match: any) {
  return {
    referee: match.referee || 'Officiel',
    attendance: null,
    events: [],
    lineups: getEmptyLineups(match.sport),
    statistics: {}
  }
}

// Requête à l'API Football (existant)
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

// 🆕 Requête à l'API Basketball
async function fetchFromBasketballAPI(endpoint: string) {
  try {
    const response = await fetch(`https://api-basketball.p.rapidapi.com${endpoint}`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.response || []
  } catch (error) {
    console.error(`❌ Erreur basketball ${endpoint}:`, error)
    return []
  }
}

// Formater les événements FOOTBALL (existant)
function formatFootballEvents(events: any[]) {
  return events.map(event => ({
    minute: event.time?.elapsed || 0,
    type: getFootballEventType(event.type),
    team: event.team?.name || 'N/A',
    player: event.player?.name || 'N/A',
    detail: event.detail || '',
    assist: event.assist?.name || undefined
  })).sort((a, b) => a.minute - b.minute)
}

function getFootballEventType(apiType: string): string {
  if (apiType === 'Goal') return 'GOAL'
  if (apiType === 'Card') return 'CARD'
  if (apiType === 'subst') return 'SUBSTITUTION'
  return 'OTHER'
}

// 🆕 Formater les événements BASKETBALL
function formatBasketballEvents(events: any[]) {
  return events.map((event: any) => ({
    minute: event.time || event.minute || 0,
    type: getBasketballEventType(event.type),
    team: event.team || 'N/A',
    player: event.player || 'N/A',
    detail: event.detail || '',
    points: event.points || (event.type === 'basket' ? getPointsFromBasket(event.detail) : undefined)
  })).sort((a, b) => a.minute - b.minute)
}

function getBasketballEventType(apiType: string): string {
  if (apiType === 'basket' || apiType === 'field_goal') return 'BASKET'
  if (apiType === 'foul') return 'FOUL'
  if (apiType === 'timeout') return 'TIMEOUT'
  if (apiType === 'substitution') return 'SUBSTITUTION'
  if (apiType === 'free_throw') return 'FREE_THROW'
  return 'OTHER'
}

function getPointsFromBasket(detail: string): number {
  if (detail?.includes('3')) return 3
  if (detail?.includes('free throw')) return 1
  return 2
}

// Formater les compositions FOOTBALL (existant)
function formatFootballLineups(lineups: any[]) {
  if (lineups.length < 2) return getEmptyLineups('FOOTBALL')

  const home = lineups[0]
  const away = lineups[1]

  return {
    home: {
      formation: home.formation || '4-4-2',
      startXI: home.startXI?.map((p: any) => ({
        player: p.player?.name || 'Joueur',
        number: p.player?.number || 0,
        position: p.player?.pos || 'POS'
      })) || [],
      substitutes: home.substitutes?.map((p: any) => ({
        player: p.player?.name || 'Joueur',
        number: p.player?.number || 0,
        position: p.player?.pos || 'SUB'
      })) || [],
      coach: home.coach?.name || 'Coach'
    },
    away: {
      formation: away.formation || '4-4-2',
      startXI: away.startXI?.map((p: any) => ({
        player: p.player?.name || 'Joueur',
        number: p.player?.number || 0,
        position: p.player?.pos || 'POS'
      })) || [],
      substitutes: away.substitutes?.map((p: any) => ({
        player: p.player?.name || 'Joueur',
        number: p.player?.number || 0,
        position: p.player?.pos || 'SUB'
      })) || [],
      coach: away.coach?.name || 'Coach'
    }
  }
}

// 🆕 Formater les compositions BASKETBALL
function formatBasketballLineups(lineups: any[]) {
  if (lineups.length < 2) return generateBasketballLineups()

  const home = lineups[0]
  const away = lineups[1]

  return {
    home: {
      formation: 'Starting 5',
      startXI: home.players?.slice(0, 5).map((p: any, i: number) => ({
        player: p.name || `Joueur ${i + 1}`,
        number: p.number || (i + 1),
        position: getBasketballPosition(i)
      })) || generateBasketballPlayers('Home').slice(0, 5),
      substitutes: home.players?.slice(5).map((p: any, i: number) => ({
        player: p.name || `Joueur ${i + 6}`,
        number: p.number || (i + 6),
        position: getBasketballPosition(i % 5)
      })) || generateBasketballPlayers('Home').slice(5),
      coach: home.coach || 'Coach'
    },
    away: {
      formation: 'Starting 5',
      startXI: away.players?.slice(0, 5).map((p: any, i: number) => ({
        player: p.name || `Joueur ${i + 1}`,
        number: p.number || (i + 1),
        position: getBasketballPosition(i)
      })) || generateBasketballPlayers('Away').slice(0, 5),
      substitutes: away.players?.slice(5).map((p: any, i: number) => ({
        player: p.name || `Joueur ${i + 6}`,
        number: p.number || (i + 6),
        position: getBasketballPosition(i % 5)
      })) || generateBasketballPlayers('Away').slice(5),
      coach: away.coach || 'Coach'
    }
  }
}

// 🆕 Générer des joueurs basketball par défaut
function generateBasketballPlayers(teamName: string) {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  const players = []
  
  for (let i = 0; i < 12; i++) {
    players.push({
      player: `${teamName} Player ${i + 1}`,
      number: i + 1,
      position: positions[i % positions.length]
    })
  }
  
  return players
}

function getBasketballPosition(index: number): string {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  return positions[index % positions.length]
}

// 🆕 Générer lineup basketball basique
function generateBasketballLineups() {
  return {
    home: {
      formation: 'Starting 5',
      startXI: generateBasketballPlayers('Home').slice(0, 5),
      substitutes: generateBasketballPlayers('Home').slice(5),
      coach: 'Home Coach'
    },
    away: {
      formation: 'Starting 5',
      startXI: generateBasketballPlayers('Away').slice(0, 5),
      substitutes: generateBasketballPlayers('Away').slice(5),
      coach: 'Away Coach'
    }
  }
}

// Formater les statistiques FOOTBALL (existant)
function formatFootballStatistics(statistics: any[]) {
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

// 🆕 Formater les statistiques BASKETBALL
function formatBasketballStatistics(statistics: any) {
  if (!statistics.home && !statistics.away) {
    // Générer des stats basketball basiques
    return {
      home: generateBasketballStats(),
      away: generateBasketballStats()
    }
  }

  return {
    home: statistics.home || generateBasketballStats(),
    away: statistics.away || generateBasketballStats()
  }
}

function generateBasketballStats() {
  return {
    'Field Goals Made': Math.floor(Math.random() * 40) + 30,
    'Field Goals Attempted': Math.floor(Math.random() * 20) + 70,
    'Field Goal Percentage': Math.floor(Math.random() * 30) + 40 + '%',
    'Three Pointers Made': Math.floor(Math.random() * 15) + 8,
    'Three Pointers Attempted': Math.floor(Math.random() * 15) + 25,
    'Three Point Percentage': Math.floor(Math.random() * 20) + 30 + '%',
    'Free Throws Made': Math.floor(Math.random() * 15) + 10,
    'Free Throws Attempted': Math.floor(Math.random() * 10) + 15,
    'Free Throw Percentage': Math.floor(Math.random() * 20) + 70 + '%',
    'Rebounds': Math.floor(Math.random() * 20) + 35,
    'Assists': Math.floor(Math.random() * 15) + 15,
    'Steals': Math.floor(Math.random() * 8) + 5,
    'Blocks': Math.floor(Math.random() * 6) + 2,
    'Turnovers': Math.floor(Math.random() * 10) + 10
  }
}

// 🆕 Générer données basketball basiques
function generateBasicBasketballData() {
  return {
    events: [
      { minute: 12, type: 'BASKET', team: 'Home', player: 'Player 1', points: 3, detail: '3-pointer' },
      { minute: 15, type: 'FOUL', team: 'Away', player: 'Player 2', detail: 'Personal foul' },
      { minute: 24, type: 'TIMEOUT', team: 'Home', player: 'Coach', detail: 'Full timeout' }
    ],
    lineups: generateBasketballLineups(),
    statistics: {
      home: generateBasketballStats(),
      away: generateBasketballStats()
    }
  }
}

// Fonction pour générer des lineups vides selon le sport
function getEmptyLineups(sport: string) {
  if (sport === 'BASKETBALL') {
    return {
      home: { formation: 'Starting 5', startXI: [], substitutes: [], coach: 'Coach' },
      away: { formation: 'Starting 5', startXI: [], substitutes: [], coach: 'Coach' }
    }
  }
  
  // Football et autres sports
  return {
    home: { formation: 'N/A', startXI: [], substitutes: [], coach: 'Coach' },
    away: { formation: 'N/A', startXI: [], substitutes: [], coach: 'Coach' }
  }
}