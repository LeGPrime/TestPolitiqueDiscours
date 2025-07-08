// pages/api/cholismo.ts - Classement des meilleurs coachs
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

interface CholismoCoach {
  id: string
  name: string
  normalizedName: string
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
  tacticalInsights: {
    strongestTeam: string
    averageByCompetition: Array<{
      competition: string
      avgRating: number
      matchCount: number
    }>
    winRate: number // Basé sur les matchs avec notes >= 7
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      sport = 'FOOTBALL', // Par défaut football pour Cholismo
      minMatches = '3',
      limit = '50',
      period = 'all-time'
    } = req.query

    console.log(`🏆 Calcul Cholismo du Peuple - Sport: ${sport}, Min matchs: ${minMatches}`)

    // 1. Construire les filtres pour COACHS UNIQUEMENT
    let sportFilter = { sport: sport.toString().toUpperCase() }
    
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

    // 3. Récupérer UNIQUEMENT LES COACHS avec leurs notes
    const coachesWithRatings = await prisma.player.findMany({
      where: {
        ...sportFilter,
        position: 'COACH', // 🔑 UNIQUEMENT LES COACHS
        ratings: {
          some: dateFilter
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
                sport: true,
                homeScore: true,
                awayScore: true
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

    console.log(`👨‍💼 ${coachesWithRatings.length} coachs bruts récupérés`)

    // 4. 🧠 FUSION INTELLIGENTE DES COACHS (même logique que joueurs)
    const fusedCoaches = new Map<string, any>()

    for (const coach of coachesWithRatings) {
      if (coach.ratings.length === 0) continue

      // Normaliser le nom pour la fusion
      const normalizedName = normalizeCoachName(coach.name)
      
      // Si le coach existe déjà (même nom normalisé), fusionner
      if (fusedCoaches.has(normalizedName)) {
        const existingCoach = fusedCoaches.get(normalizedName)
        
        // Fusionner les données
        existingCoach.ratings.push(...coach.ratings)
        existingCoach.teams.add(coach.team)
        
        console.log(`🔗 Fusion coach: ${coach.name} (${coach.team}) avec ${existingCoach.name}`)
      } else {
        // Nouveau coach
        fusedCoaches.set(normalizedName, {
          originalId: coach.id,
          name: coach.name, // Garder le nom original du premier
          normalizedName,
          sport: coach.sport,
          teams: new Set([coach.team]),
          ratings: [...coach.ratings]
        })
      }
    }

    console.log(`🔗 Après fusion: ${fusedCoaches.size} coachs uniques`)

    // 5. Calculer les statistiques pour chaque coach fusionné
    const cholismoCandidates: CholismoCoach[] = []

    for (const [normalizedName, fusedCoach] of fusedCoaches.entries()) {
      const ratings = fusedCoach.ratings
      
      if (ratings.length < parseInt(minMatches.toString())) {
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
          
          // Déterminer l'équipe du coach pour ce match
          const coachTeam = getCoachTeamForMatch(matchData.match, Array.from(fusedCoach.teams))
          
          return {
            matchId: matchData.match.id,
            rating: Number(matchAvgRating.toFixed(1)),
            comment: bestComment,
            homeTeam: matchData.match.homeTeam,
            awayTeam: matchData.match.awayTeam,
            date: matchData.match.date,
            competition: matchData.match.competition,
            team: coachTeam
          }
        })

      // Calculer l'historique mensuel
      const ratingHistory = calculateMonthlyHistory(ratings)

      // Calculer la répartition par équipe
      const teamBreakdown = calculateTeamBreakdown(ratings, Array.from(fusedCoach.teams))

      // 🧠 INSIGHTS TACTIQUES SPÉCIFIQUES AUX COACHS
      const tacticalInsights = calculateTacticalInsights(ratings, Array.from(fusedCoach.teams), uniqueMatches)

      // Déterminer l'équipe du meilleur match
      const bestMatchTeam = getCoachTeamForMatch(bestRating.match, Array.from(fusedCoach.teams))

      cholismoCandidates.push({
        id: `coach_fused_${normalizedName}`,
        name: fusedCoach.name,
        normalizedName,
        teams: Array.from(fusedCoach.teams),
        sport: fusedCoach.sport,
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
        teamBreakdown,
        tacticalInsights
      })
    }

    // 6. Trier par moyenne des notes (avec bonus pour l'expérience)
    cholismoCandidates.sort((a, b) => {
      // Bonus léger pour l'expérience (plus de matchs)
      const aScore = a.avgRating + (Math.log(a.totalMatches) * 0.05)
      const bScore = b.avgRating + (Math.log(b.totalMatches) * 0.05)
      
      if (Math.abs(aScore - bScore) < 0.01) {
        return b.totalMatches - a.totalMatches
      }
      return bScore - aScore
    })

    // 7. Limiter les résultats
    const topCoaches = cholismoCandidates.slice(0, parseInt(limit.toString()))

    // 8. Statistiques globales
    const globalStats = {
      totalCoaches: cholismoCandidates.length,
      totalRatings: cholismoCandidates.reduce((sum, c) => sum + c.totalRatings, 0),
      totalMatches: cholismoCandidates.reduce((sum, c) => sum + c.totalMatches, 0),
      avgRatingGlobal: cholismoCandidates.length > 0 
        ? cholismoCandidates.reduce((sum, c) => sum + c.avgRating, 0) / cholismoCandidates.length 
        : 0,
      topRating: topCoaches[0]?.avgRating || 0,
      tacticalStylesBreakdown: calculateTacticalStylesBreakdown(topCoaches),
      fusionStats: {
        originalCoaches: coachesWithRatings.length,
        fusedCoaches: cholismoCandidates.length,
        fusionReduction: coachesWithRatings.length - cholismoCandidates.length
      }
    }

    console.log(`👨‍💼 Cholismo du Peuple calculé:`)
    console.log(`   - ${coachesWithRatings.length} coachs originaux`)
    console.log(`   - ${cholismoCandidates.length} coachs après fusion`)
    console.log(`   - Leader: ${topCoaches[0]?.name} (${topCoaches[0]?.avgRating}/10)`)
    console.log(`   - Équipes: ${topCoaches[0]?.teams.join(', ')}`)

    res.status(200).json({
      success: true,
      cholismo: topCoaches,
      stats: globalStats,
      filters: {
        sport,
        period,
        minMatches: parseInt(minMatches.toString())
      }
    })

  } catch (error) {
    console.error('❌ Erreur Cholismo du Peuple:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}

// 🧠 Fonction de normalisation des noms de coachs
function normalizeCoachName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Mappings spéciaux pour les coachs célèbres
  const coachMappings = {
    'p guardiola': 'pep guardiola',
    'pep guardiola': 'pep guardiola',
    'j mourinho': 'jose mourinho',
    'jose mourinho': 'jose mourinho',
    'c ancelotti': 'carlo ancelotti',
    'carlo ancelotti': 'carlo ancelotti',
    'j klopp': 'jurgen klopp',
    'jurgen klopp': 'jurgen klopp',
    'd simeone': 'diego simeone',
    'diego simeone': 'diego simeone'
  }

  if (coachMappings[normalized]) {
    normalized = coachMappings[normalized]
  }

  console.log(`🔍 Normalisation coach: "${name}" -> "${normalized}"`)
  return normalized
}

// Fonction pour déterminer l'équipe du coach dans un match
function getCoachTeamForMatch(match: any, coachTeams: string[]): string {
  const homeTeam = match.homeTeam.toLowerCase()
  const awayTeam = match.awayTeam.toLowerCase()
  
  for (const team of coachTeams) {
    const teamLower = team.toLowerCase()
    
    if (homeTeam.includes(teamLower) || teamLower.includes(homeTeam.split(' ')[0])) {
      return match.homeTeam
    }
    if (awayTeam.includes(teamLower) || teamLower.includes(awayTeam.split(' ')[0])) {
      return match.awayTeam
    }
  }
  
  return coachTeams[0] || 'Équipe inconnue'
}

// 🧠 Calcul des insights tactiques spécifiques aux coachs
function calculateTacticalInsights(ratings: any[], teams: string[], uniqueMatches: Map<any, any>) {
  // Équipe la plus forte (meilleure moyenne)
  const teamStats = new Map()
  teams.forEach(team => {
    teamStats.set(team, { ratings: [], wins: 0, total: 0 })
  })
  
  // Analyser chaque match
  Array.from(uniqueMatches.values()).forEach((matchData: any) => {
    const match = matchData.match
    const matchRatings = matchData.ratings
    const avgMatchRating = matchRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / matchRatings.length
    
    const coachTeam = getCoachTeamForMatch(match, teams)
    const normalizedTeam = teams.find(t => 
      t.toLowerCase().includes(coachTeam.toLowerCase()) || 
      coachTeam.toLowerCase().includes(t.toLowerCase())
    ) || teams[0]
    
    if (teamStats.has(normalizedTeam)) {
      teamStats.get(normalizedTeam).ratings.push(avgMatchRating)
      teamStats.get(normalizedTeam).total++
      
      // Considérer comme "victoire tactique" si note >= 7
      if (avgMatchRating >= 7) {
        teamStats.get(normalizedTeam).wins++
      }
    }
  })

  // Trouver l'équipe la plus forte
  let strongestTeam = teams[0]
  let bestAvg = 0
  
  for (const [team, stats] of teamStats.entries()) {
    if (stats.ratings.length > 0) {
      const avg = stats.ratings.reduce((sum: number, r: number) => sum + r, 0) / stats.ratings.length
      if (avg > bestAvg) {
        bestAvg = avg
        strongestTeam = team
      }
    }
  }

  // Moyenne par compétition
  const competitionStats = new Map()
  ratings.forEach(rating => {
    const comp = rating.match.competition
    if (!competitionStats.has(comp)) {
      competitionStats.set(comp, { ratings: [], matches: new Set() })
    }
    competitionStats.get(comp).ratings.push(rating.rating)
    competitionStats.get(comp).matches.add(rating.match.id)
  })

  const averageByCompetition = Array.from(competitionStats.entries())
    .map(([competition, data]) => ({
      competition,
      avgRating: Number((data.ratings.reduce((sum: number, r: number) => sum + r, 0) / data.ratings.length).toFixed(2)),
      matchCount: data.matches.size
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5)

  // Taux de "victoires tactiques" global
  const totalGoodMatches = Array.from(uniqueMatches.values()).filter((matchData: any) => {
    const avgRating = matchData.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / matchData.ratings.length
    return avgRating >= 7
  }).length
  
  const winRate = uniqueMatches.size > 0 ? (totalGoodMatches / uniqueMatches.size) * 100 : 0

  return {
    strongestTeam,
    averageByCompetition,
    winRate: Number(winRate.toFixed(1))
  }
}

// Calculer la répartition par équipe (réutilisé)
function calculateTeamBreakdown(ratings: any[], teams: string[]) {
  const teamStats = new Map()
  
  teams.forEach(team => {
    teamStats.set(team, {
      team,
      ratings: [],
      matches: new Set()
    })
  })
  
  ratings.forEach(rating => {
    const coachTeam = getCoachTeamForMatch(rating.match, teams)
    const normalizedTeam = teams.find(t => 
      t.toLowerCase().includes(coachTeam.toLowerCase()) || 
      coachTeam.toLowerCase().includes(t.toLowerCase())
    ) || teams[0]
    
    if (teamStats.has(normalizedTeam)) {
      teamStats.get(normalizedTeam).ratings.push(rating.rating)
      teamStats.get(normalizedTeam).matches.add(rating.match.id)
    }
  })
  
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

// Calculer l'historique mensuel (réutilisé)
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

// 🆕 Analyser les styles tactiques
function calculateTacticalStylesBreakdown(coaches: CholismoCoach[]) {
  return {
    totalCoaches: coaches.length,
    experienceBreakdown: {
      veterans: coaches.filter(c => c.totalMatches >= 10).length,
      experienced: coaches.filter(c => c.totalMatches >= 5 && c.totalMatches < 10).length,
      emerging: coaches.filter(c => c.totalMatches < 5).length
    },
    ratingBreakdown: {
      elite: coaches.filter(c => c.avgRating >= 8.5).length,
      excellent: coaches.filter(c => c.avgRating >= 8 && c.avgRating < 8.5).length,
      good: coaches.filter(c => c.avgRating >= 7 && c.avgRating < 8).length,
      developing: coaches.filter(c => c.avgRating < 7).length
    },
    multiClubCoaches: coaches.filter(c => c.teams.length > 1).length
  }
}