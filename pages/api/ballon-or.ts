// pages/api/ballon-or.ts - Version avec fusion intelligente des joueurs
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

interface BallonOrPlayer {
  id: string
  name: string
  normalizedName: string
  positions: string[]
  teams: string[]
  sport: string
  avgRating: number
  totalRatings: number
  totalMatches: number
  bestMatch: {
    id: string
    rating: number
    homeTeam: string
    awayTeam: string
    date: string
    competition: string
    team: string
  }
  recentMatches: Array<{
    matchId: string
    rating: number
    comment?: string
    homeTeam: string
    awayTeam: string
    date: string
    competition: string
    team: string
  }>
  ratingHistory: Array<{
    month: string
    avgRating: number
    matchCount: number
  }>
  teamBreakdown: Array<{
    team: string
    avgRating: number
    matchCount: number
    ratingCount: number
  }>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      sport = 'all',
      position = 'all', 
      minMatches = '3',
      limit = '50',
      period = 'all-time',
      excludeF1 = 'false' // 🆕 Paramètre pour exclure F1
    } = req.query

    console.log(`🏆 Calcul Ballon d'Or avec fusion joueurs - Sport: ${sport}, Min matchs: ${minMatches}`)

    // 1. Construire les filtres
    let sportFilter = {}
    if (sport !== 'all') {
      sportFilter = { sport: sport.toString().toUpperCase() }
    } else if (excludeF1 === 'true') {
      // 🚫 Exclure F1 du Ballon d'Or classique
      sportFilter = { 
        sport: { 
          not: 'F1' 
        } 
      }
    }

    let positionFilter = {}
    if (position !== 'all') {
      positionFilter = { position: position.toString() }
    }

    // 2. Filtre par période
    let dateFilter = {}
    const now = new Date()
    
    switch (period) {
      case 'this-year':
        const yearAgo = new Date()
        yearAgo.setFullYear(now.getFullYear() - 1)
        dateFilter = { createdAt: { gte: yearAgo } }
        break
      case 'this-season':
        const seasonStart = new Date()
        seasonStart.setMonth(8) // Septembre
        if (now.getMonth() < 8) {
          seasonStart.setFullYear(now.getFullYear() - 1)
        }
        dateFilter = { createdAt: { gte: seasonStart } }
        break
      case 'last-6-months':
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(now.getMonth() - 6)
        dateFilter = { createdAt: { gte: sixMonthsAgo } }
        break
      default: // 'all-time'
        break
    }

    // 3. Récupérer TOUS les joueurs avec leurs notes
    const playersWithRatings = await prisma.player.findMany({
      where: {
        ...sportFilter,
        ratings: {
          some: {
            ...dateFilter
          }
        }
      },
      include: {
        ratings: {
          where: dateFilter,
          include: {
            match: {
              select: {
                id: true,
                homeTeam: true,
                awayTeam: true,
                date: true,
                competition: true,
                sport: true
              }
            },
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    console.log(`👥 ${playersWithRatings.length} joueurs bruts récupérés`)

    // 4. 🧠 FUSION INTELLIGENTE DES JOUEURS
    const fusedPlayers = new Map<string, any>()

    for (const player of playersWithRatings) {
      if (player.ratings.length === 0) continue

      // Normaliser le nom pour la fusion
      const normalizedName = normalizePlayerName(player.name)
      
      // Si le joueur existe déjà (même nom normalisé), fusionner
      if (fusedPlayers.has(normalizedName)) {
        const existingPlayer = fusedPlayers.get(normalizedName)
        
        // Fusionner les données
        existingPlayer.ratings.push(...player.ratings)
        existingPlayer.teams.add(player.team)
        if (player.position) {
          existingPlayer.positions.add(player.position)
        }
        
        console.log(`🔗 Fusion: ${player.name} (${player.team}) avec ${existingPlayer.name}`)
      } else {
        // Nouveau joueur
        fusedPlayers.set(normalizedName, {
          originalId: player.id,
          name: player.name, // Garder le nom original du premier
          normalizedName,
          sport: player.sport,
          teams: new Set([player.team]),
          positions: new Set(player.position ? [player.position] : []),
          ratings: [...player.ratings]
        })
      }
    }

    console.log(`🔗 Après fusion: ${fusedPlayers.size} joueurs uniques`)

    // 5. Calculer les statistiques pour chaque joueur fusionné
    const ballonOrCandidates: BallonOrPlayer[] = []

    for (const [normalizedName, fusedPlayer] of fusedPlayers.entries()) {
      const ratings = fusedPlayer.ratings
      
      if (ratings.length < parseInt(minMatches.toString())) {
        continue
      }

      // Filtre position après fusion
      if (position !== 'all' && !fusedPlayer.positions.has(position)) {
        continue
      }

      // Calculer la moyenne globale
      const avgRating = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      
      // Trouver le meilleur match
      const bestRating = ratings.reduce((best: any, current: any) => 
        current.rating > best.rating ? current : best
      )

      // Récupérer les matchs uniques avec moyenne par match
      const uniqueMatches = new Map()
      ratings.forEach((rating: any) => {
        const matchId = rating.match.id
        if (!uniqueMatches.has(matchId)) {
          uniqueMatches.set(matchId, {
            match: rating.match,
            ratings: []
          })
        }
        uniqueMatches.get(matchId).ratings.push(rating)
      })

      const totalMatches = uniqueMatches.size

      // Calculer les 5 matchs les plus récents
      const recentMatches = Array.from(uniqueMatches.values())
        .sort((a: any, b: any) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime())
        .slice(0, 5)
        .map((matchData: any) => {
          const matchAvgRating = matchData.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / matchData.ratings.length
          const bestComment = matchData.ratings.find((r: any) => r.comment)?.comment
          
          // Déterminer l'équipe du joueur pour ce match
          const playerTeam = getPlayerTeamForMatch(matchData.match, Array.from(fusedPlayer.teams))
          
          return {
            matchId: matchData.match.id,
            rating: Number(matchAvgRating.toFixed(1)),
            comment: bestComment,
            homeTeam: matchData.match.homeTeam,
            awayTeam: matchData.match.awayTeam,
            date: matchData.match.date,
            competition: matchData.match.competition,
            team: playerTeam
          }
        })

      // Calculer l'historique mensuel
      const ratingHistory = calculateMonthlyHistory(ratings)

      // Calculer la répartition par équipe
      const teamBreakdown = calculateTeamBreakdown(ratings, Array.from(fusedPlayer.teams))

      // Déterminer l'équipe du meilleur match
      const bestMatchTeam = getPlayerTeamForMatch(bestRating.match, Array.from(fusedPlayer.teams))

      ballonOrCandidates.push({
        id: `fused_${normalizedName}`,
        name: fusedPlayer.name,
        normalizedName,
        positions: Array.from(fusedPlayer.positions),
        teams: Array.from(fusedPlayer.teams),
        sport: fusedPlayer.sport,
        avgRating: Number(avgRating.toFixed(2)),
        totalRatings: ratings.length,
        totalMatches,
        bestMatch: {
          id: bestRating.match.id,
          rating: bestRating.rating,
          homeTeam: bestRating.match.homeTeam,
          awayTeam: bestRating.match.awayTeam,
          date: bestRating.match.date,
          competition: bestRating.match.competition,
          team: bestMatchTeam
        },
        recentMatches,
        ratingHistory,
        teamBreakdown
      })
    }

    // 6. Trier par moyenne des notes
    ballonOrCandidates.sort((a, b) => {
      if (Math.abs(a.avgRating - b.avgRating) < 0.01) {
        return b.totalMatches - a.totalMatches
      }
      return b.avgRating - a.avgRating
    })

    // 7. Limiter les résultats
    const topPlayers = ballonOrCandidates.slice(0, parseInt(limit.toString()))

    // 8. Statistiques globales
    const globalStats = {
      totalPlayers: ballonOrCandidates.length,
      totalRatings: ballonOrCandidates.reduce((sum, p) => sum + p.totalRatings, 0),
      totalMatches: ballonOrCandidates.reduce((sum, p) => sum + p.totalMatches, 0),
      avgRatingGlobal: ballonOrCandidates.length > 0 
        ? ballonOrCandidates.reduce((sum, p) => sum + p.avgRating, 0) / ballonOrCandidates.length 
        : 0,
      topRating: topPlayers[0]?.avgRating || 0,
      sportBreakdown: calculateSportBreakdown(ballonOrCandidates),
      fusionStats: {
        originalPlayers: playersWithRatings.length,
        fusedPlayers: ballonOrCandidates.length,
        fusionReduction: playersWithRatings.length - ballonOrCandidates.length
      }
    }

    console.log(`🏆 Ballon d'Or avec fusion calculé:`)
    console.log(`   - ${playersWithRatings.length} joueurs originaux`)
    console.log(`   - ${ballonOrCandidates.length} joueurs après fusion`)
    console.log(`   - Leader: ${topPlayers[0]?.name} (${topPlayers[0]?.avgRating}/10)`)
    console.log(`   - Équipes: ${topPlayers[0]?.teams.join(', ')}`)

    res.status(200).json({
      success: true,
      ballonOr: topPlayers,
      stats: globalStats,
      filters: {
        sport,
        position,
        period,
        minMatches: parseInt(minMatches.toString())
      }
    })

  } catch (error) {
    console.error('❌ Erreur Ballon d\'Or avec fusion:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}

// 🧠 Fonction de normalisation intelligente des noms
function normalizePlayerName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    // Supprimer les accents
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Supprimer les caractères spéciaux sauf espaces et tirets
    .replace(/[^a-z\s-]/g, '')
    // Supprimer les doubles espaces
    .replace(/\s+/g, ' ')
    // Supprimer les espaces en début/fin
    .trim()

  // 🔍 Normalisation spéciale pour les noms avec initiales
  // "K. Mbappé" -> "kylian mbappe"  
  // "R. Cherki" -> "rayan cherki"
  const initialMappings = {
    'k mbappe': 'kylian mbappe',
    'k. mbappe': 'kylian mbappe',
    'kylian mbappe': 'kylian mbappe',
    'r cherki': 'rayan cherki', 
    'r. cherki': 'rayan cherki',
    'rayan cherki': 'rayan cherki',
    'a griezmann': 'antoine griezmann',
    'a. griezmann': 'antoine griezmann',
    'antoine griezmann': 'antoine griezmann',
    'l james': 'lebron james',
    'l. james': 'lebron james',
    'lebron james': 'lebron james'
  }

  // Vérifier si on a une correspondance dans les mappings
  if (initialMappings[normalized]) {
    normalized = initialMappings[normalized]
  }

  console.log(`🔍 Normalisation: "${name}" -> "${normalized}"`)
  return normalized
}

// Fonction pour déterminer l'équipe du joueur dans un match
function getPlayerTeamForMatch(match: any, playerTeams: string[]): string {
  // Essayer de faire correspondre avec les équipes du match
  const homeTeam = match.homeTeam.toLowerCase()
  const awayTeam = match.awayTeam.toLowerCase()
  
  for (const team of playerTeams) {
    const teamLower = team.toLowerCase()
    
    // Correspondance exacte ou partielle
    if (homeTeam.includes(teamLower) || teamLower.includes(homeTeam.split(' ')[0])) {
      return match.homeTeam
    }
    if (awayTeam.includes(teamLower) || teamLower.includes(awayTeam.split(' ')[0])) {
      return match.awayTeam
    }
    
    // Pour les équipes nationales
    if (team.includes('France') && (homeTeam.includes('france') || awayTeam.includes('france'))) {
      return homeTeam.includes('france') ? match.homeTeam : match.awayTeam
    }
  }
  
  // Si aucune correspondance, retourner la première équipe connue
  return playerTeams[0] || 'Équipe inconnue'
}

// Calculer la répartition par équipe
function calculateTeamBreakdown(ratings: any[], teams: string[]) {
  const teamStats = new Map()
  
  // Initialiser les stats pour chaque équipe
  teams.forEach(team => {
    teamStats.set(team, {
      team,
      ratings: [],
      matches: new Set()
    })
  })
  
  // Répartir les ratings par équipe (basé sur le match)
  ratings.forEach(rating => {
    const playerTeam = getPlayerTeamForMatch(rating.match, teams)
    const normalizedTeam = teams.find(t => 
      t.toLowerCase().includes(playerTeam.toLowerCase()) || 
      playerTeam.toLowerCase().includes(t.toLowerCase())
    ) || teams[0]
    
    if (teamStats.has(normalizedTeam)) {
      teamStats.get(normalizedTeam).ratings.push(rating.rating)
      teamStats.get(normalizedTeam).matches.add(rating.match.id)
    }
  })
  
  // Calculer les moyennes
  return Array.from(teamStats.values())
    .filter(stats => stats.ratings.length > 0)
    .map(stats => ({
      team: stats.team,
      avgRating: Number((stats.ratings.reduce((sum: number, r: number) => sum + r, 0) / stats.ratings.length).toFixed(2)),
      matchCount: stats.matches.size,
      ratingCount: stats.ratings.length
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
}

// Fonctions utilitaires existantes (inchangées)
function calculateMonthlyHistory(ratings: any[]): Array<{month: string, avgRating: number, matchCount: number}> {
  const monthlyData = new Map()
  
  ratings.forEach(rating => {
    const date = new Date(rating.createdAt)
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        ratings: [],
        matches: new Set()
      })
    }
    
    monthlyData.get(monthKey).ratings.push(rating.rating)
    monthlyData.get(monthKey).matches.add(rating.match.id)
  })

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      avgRating: Number((data.ratings.reduce((sum: number, r: number) => sum + r, 0) / data.ratings.length).toFixed(2)),
      matchCount: data.matches.size
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
}

function calculateSportBreakdown(players: BallonOrPlayer[]) {
  const breakdown = new Map()
  
  players.forEach(player => {
    if (!breakdown.has(player.sport)) {
      breakdown.set(player.sport, {
        count: 0,
        totalRatings: 0
      })
    }
    
    const data = breakdown.get(player.sport)
    data.count++
    data.totalRatings += player.totalRatings
  })

  return Array.from(breakdown.entries()).map(([sport, data]) => ({
    sport,
    playerCount: data.count,
    avgRating: players
      .filter(p => p.sport === sport)
      .reduce((sum, p) => sum + p.avgRating, 0) / data.count,
    totalRatings: data.totalRatings
  }))
}