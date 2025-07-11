// pages/api/fighters/search.ts - NOUVELLE API pour recherche de combattants
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { q, limit = '20' } = req.query

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ 
        error: 'Recherche trop courte', 
        message: 'Au moins 2 caractères requis' 
      })
    }

    console.log(`🥊 Recherche combattant MMA: "${q}"`)

    // 1. Rechercher directement dans les matchs MMA
    const mmaMatches = await prisma.match.findMany({
      where: {
        sport: 'MMA',
        status: 'FINISHED',
        OR: [
          { homeTeam: { contains: q, mode: 'insensitive' } },
          { awayTeam: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: {
        ratings: {
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string)
    })

    console.log(`🔍 Trouvé ${mmaMatches.length} combats MMA`)

    // 2. Extraire les combattants uniques
    const fighters: any = {}

    mmaMatches.forEach(match => {
      // Analyser homeTeam (combattant 1)
      const fighter1 = match.homeTeam
      const fighter2 = match.awayTeam

      // Vérifier si l'un des combattants correspond à la recherche
      const fighter1Match = fighter1.toLowerCase().includes(q.toLowerCase())
      const fighter2Match = fighter2.toLowerCase().includes(q.toLowerCase())

      if (fighter1Match) {
        if (!fighters[fighter1]) {
          fighters[fighter1] = {
            id: `fighter_${fighter1.replace(/\s+/g, '_').toLowerCase()}`,
            name: fighter1,
            fights: [],
            wins: 0,
            losses: 0,
            totalFights: 0,
            avgRating: 0,
            totalRatings: 0
          }
        }
        fighters[fighter1].fights.push({
          ...match,
          opponent: fighter2,
          isWin: match.homeScore === 1,
          sport: match.sport.toLowerCase()
        })
        fighters[fighter1].totalFights++
        if (match.homeScore === 1) fighters[fighter1].wins++
        if (match.awayScore === 1) fighters[fighter1].losses++
      }

      if (fighter2Match) {
        if (!fighters[fighter2]) {
          fighters[fighter2] = {
            id: `fighter_${fighter2.replace(/\s+/g, '_').toLowerCase()}`,
            name: fighter2,
            fights: [],
            wins: 0,
            losses: 0,
            totalFights: 0,
            avgRating: 0,
            totalRatings: 0
          }
        }
        fighters[fighter2].fights.push({
          ...match,
          opponent: fighter1,
          isWin: match.awayScore === 1,
          sport: match.sport.toLowerCase()
        })
        fighters[fighter2].totalFights++
        if (match.awayScore === 1) fighters[fighter2].wins++
        if (match.homeScore === 1) fighters[fighter2].losses++
      }
    })

    // 3. Calculer les statistiques pour chaque combattant
    Object.values(fighters).forEach((fighter: any) => {
      // Trier les combats par date (plus récent en premier)
      fighter.fights.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      // Calculer la note moyenne (basée sur toutes les notes de ses combats)
      let totalRating = 0
      let totalRatings = 0
      
      fighter.fights.forEach((fight: any) => {
        if (fight.totalRatings > 0) {
          totalRating += fight.avgRating * fight.totalRatings
          totalRatings += fight.totalRatings
        }
      })
      
      fighter.avgRating = totalRatings > 0 ? totalRating / totalRatings : 0
      fighter.totalRatings = totalRatings
      
      // Calculer le record
      fighter.record = `${fighter.wins}-${fighter.losses}`
      if (fighter.totalFights - fighter.wins - fighter.losses > 0) {
        fighter.record += `-${fighter.totalFights - fighter.wins - fighter.losses}` // Draws
      }
      
      // Dernière activité
      fighter.lastFight = fighter.fights[0]?.date || null
      
      // Streak actuel (victoires/défaites consécutives)
      fighter.streak = calculateStreak(fighter.fights, fighter.name)
    })

    const fightersArray = Object.values(fighters)

    console.log(`✅ ${fightersArray.length} combattants trouvés`)

    // 4. Retourner aussi les matchs bruts pour l'affichage
    const formattedMatches = mmaMatches.map(match => ({
      id: match.id,
      apiId: match.apiMatchId,
      sport: match.sport.toLowerCase(),
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      date: match.date.toISOString(),
      status: match.status,
      competition: match.competition,
      venue: match.venue,
      avgRating: match.avgRating,
      totalRatings: match.totalRatings,
      ratings: match.ratings,
      canRate: true,
      details: match.details
    }))

    res.status(200).json({
      success: true,
      query: q,
      fighters: fightersArray,
      matches: formattedMatches,
      stats: {
        totalFighters: fightersArray.length,
        totalMatches: mmaMatches.length,
        searchQuery: q
      }
    })

  } catch (error) {
    console.error('❌ Erreur recherche combattants:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}

// Fonction pour calculer le streak actuel
function calculateStreak(fights: any[], fighterName: string): { type: 'win' | 'loss' | 'draw', count: number } {
  if (fights.length === 0) return { type: 'win', count: 0 }
  
  const sortedFights = fights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  let streak = 0
  let streakType: 'win' | 'loss' | 'draw' = 'win'
  
  for (const fight of sortedFights) {
    const isWin = fight.isWin
    const isDraw = fight.homeScore === fight.awayScore
    
    if (streak === 0) {
      // Premier combat, définir le type de streak
      if (isDraw) {
        streakType = 'draw'
      } else if (isWin) {
        streakType = 'win'
      } else {
        streakType = 'loss'
      }
      streak = 1
    } else {
      // Vérifier si le streak continue
      const currentResult = isDraw ? 'draw' : (isWin ? 'win' : 'loss')
      
      if (currentResult === streakType) {
        streak++
      } else {
        break // Le streak s'arrête
      }
    }
  }
  
  return { type: streakType, count: streak }
}