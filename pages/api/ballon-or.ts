// pages/api/ballon-or.ts - VERSION MISE À JOUR avec séparation stricte des sports
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
      sport = 'FOOTBALL', // Sport spécifique maintenant
      position = 'all', 
      minMatches = '3',
      limit = '50',
      period = 'all-time',
      excludeF1 = 'false',
      excludeTennis = 'false'
    } = req.query

    console.log(`🏆 Calcul classement - Sport: ${sport}, Min matchs: ${minMatches}`)

    // 🔒 FILTRAGE STRICT PAR SPORT
    let sportFilter = {}
    
    if (sport === 'FOOTBALL') {
      // Pour le Ballon d'Or : STRICTEMENT football, exclu tennis et F1
      sportFilter = { 
        sport: 'FOOTBALL'
      }
      console.log('🔒 Mode Ballon d\'Or - Football uniquement')
      
    } else if (sport === 'TENNIS') {
      // Pour Tennis GOAT : STRICTEMENT tennis
      sportFilter = { 
        sport: 'TENNIS'
      }
      console.log('🎾 Mode Tennis GOAT - Tennis uniquement')
      
    } else if (sport === 'F1') {
      // Pour Driver of the Fans : STRICTEMENT F1
      sportFilter = { 
        sport: 'F1'
      }
      console.log('🏎️ Mode Driver of the Fans - F1 uniquement')
      
    } else {
      // Mode générique (pour autres sports)
      sportFilter = { sport: sport.toString().toUpperCase() }
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

    // 3. 🚫 EXCLURE EXPLICITEMENT LES COACHS et filtres supplémentaires
    let additionalFilters = {}
    
    // Toujours exclure les coachs
    additionalFilters.position = { not: 'COACH' }

    const playersWithRatings = await prisma.player.findMany({
      where: {
        ...sportFilter,
        ...additionalFilters,
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

    console.log(`👥 ${playersWithRatings.length} entités récupérées pour ${sport} (SANS COACHS)`)

    // 🔒 DOUBLE FILTRAGE côté serveur pour être absolument sûr
    const filteredPlayers = playersWithRatings.filter(player => {
      // Filtrage strict par sport
      if (sport === 'FOOTBALL') {
        return player.sport === 'FOOTBALL' && 
               !isPlayerFromOtherSport(player.name)
      } else if (sport === 'TENNIS') {
        return player.sport === 'TENNIS' || 
               isTennisPlayer(player.name)
      } else if (sport === 'F1') {
        return player.sport === 'F1' || 
               isF1Driver(player.name)
      } else {
        return player.sport === sport.toString().toUpperCase()
      }
    })

    console.log(`🔒 Après filtrage strict: ${filteredPlayers.length} entités pour ${sport}`)

    // 4. 🧠 FUSION INTELLIGENTE
    const fusedPlayers = new Map<string, any>()

    for (const player of filteredPlayers) {
      if (player.ratings.length === 0) continue

      // Normaliser le nom selon le sport
      const normalizedName = sport === 'F1' ? 
        normalizeDriverName(player.name) : 
        sport === 'TENNIS' ? 
        normalizeTennisName(player.name) :
        normalizePlayerName(player.name)
      
      // Si le joueur existe déjà, fusionner
      if (fusedPlayers.has(normalizedName)) {
        const existingPlayer = fusedPlayers.get(normalizedName)
        
        existingPlayer.ratings.push(...player.ratings)
        existingPlayer.teams.add(player.team)
        if (player.position) {
          existingPlayer.positions.add(player.position)
        }
        
        console.log(`🔗 Fusion réussie: ${player.name} (${player.team}) avec ${existingPlayer.name}`)
      } else {
        // Nouveau joueur
        fusedPlayers.set(normalizedName, {
          originalId: player.id,
          name: chooseBestName(player.name, normalizedName, sport),
          normalizedName,
          sport: player.sport,
          teams: new Set([player.team]),
          positions: new Set(player.position ? [player.position] : []),
          ratings: [...player.ratings]
        })
        
        console.log(`🆕 Nouvelle entité: ${player.name} (${player.team})`)
      }
    }

    console.log(`🔗 Après fusion intelligente: ${fusedPlayers.size} entités uniques pour ${sport}`)

    // 5. Calculer les statistiques
    const candidates: BallonOrPlayer[] = []

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

      // Récupérer les matchs uniques
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

      const bestMatchTeam = getPlayerTeamForMatch(bestRating.match, Array.from(fusedPlayer.teams))

      candidates.push({
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
    candidates.sort((a, b) => {
      if (Math.abs(a.avgRating - b.avgRating) < 0.01) {
        return b.totalMatches - a.totalMatches
      }
      return b.avgRating - a.avgRating
    })

    // 7. Limiter les résultats
    const topPlayers = candidates.slice(0, parseInt(limit.toString()))

    // 8. Statistiques globales
    const globalStats = {
      totalPlayers: candidates.length,
      totalRatings: candidates.reduce((sum, p) => sum + p.totalRatings, 0),
      totalMatches: candidates.reduce((sum, p) => sum + p.totalMatches, 0),
      avgRatingGlobal: candidates.length > 0 
        ? candidates.reduce((sum, p) => sum + p.avgRating, 0) / candidates.length 
        : 0,
      topRating: topPlayers[0]?.avgRating || 0,
      sportBreakdown: calculateSportBreakdown(candidates),
      fusionStats: {
        originalPlayers: playersWithRatings.length,
        fusedPlayers: candidates.length,
        fusionReduction: playersWithRatings.length - candidates.length
      }
    }

    // 🏆 Nom du classement selon le sport
    const classementName = sport === 'FOOTBALL' ? 'Ballon d\'Or' :
                          sport === 'TENNIS' ? 'Tennis GOAT' :
                          sport === 'F1' ? 'Driver of the Fans' :
                          `Top ${sport}`

    console.log(`🏆 ${classementName} calculé:`)
    console.log(`   - ${playersWithRatings.length} entités originales`)
    console.log(`   - ${candidates.length} entités après fusion intelligente`)
    console.log(`   - Leader: ${topPlayers[0]?.name} (${topPlayers[0]?.avgRating}/10)`)
    console.log(`   - Équipes: ${topPlayers[0]?.teams.join(', ')}`)

    res.status(200).json({
      success: true,
      ballonOr: topPlayers, // Nom générique pour compatibilité
      stats: globalStats,
      filters: {
        sport,
        position,
        period,
        minMatches: parseInt(minMatches.toString()),
        playersOnly: true,
        excludeCoaches: true,
        classementName
      }
    })

  } catch (error) {
    console.error('❌ Erreur classement:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}

// ============================================================================
// 🔒 FONCTIONS DE FILTRAGE STRICT PAR SPORT
// ============================================================================

// Détecter si un joueur appartient à un autre sport (pour exclure du foot)
function isPlayerFromOtherSport(name: string): boolean {
  const lowerName = name.toLowerCase()
  
  // Joueurs de tennis célèbres
  const tennisPlayers = [
    'djokovic', 'novak djokovic', 'nadal', 'rafael nadal', 'federer', 'roger federer',
    'murray', 'andy murray', 'wawrinka', 'stan wawrinka', 'tsitsipas', 'stefanos tsitsipas',
    'alcaraz', 'carlos alcaraz', 'sinner', 'jannik sinner', 'rublev', 'andrey rublev',
    'zverev', 'alexander zverev', 'medvedev', 'daniil medvedev', 'thiem', 'dominic thiem'
  ]
  
  // Pilotes F1 célèbres
  const f1Drivers = [
    'verstappen', 'max verstappen', 'hamilton', 'lewis hamilton', 'leclerc', 'charles leclerc',
    'norris', 'lando norris', 'russell', 'george russell', 'sainz', 'carlos sainz',
    'alonso', 'fernando alonso', 'perez', 'sergio perez', 'checo perez', 'vettel',
    'bottas', 'valtteri bottas', 'ricciardo', 'daniel ricciardo'
  ]
  
  return [...tennisPlayers, ...f1Drivers].some(player => 
    lowerName.includes(player) || player.includes(lowerName)
  )
}

// Détecter les joueurs de tennis
function isTennisPlayer(name: string): boolean {
  const lowerName = name.toLowerCase()
  
  const tennisPlayers = [
    'djokovic', 'novak djokovic', 'nadal', 'rafael nadal', 'federer', 'roger federer',
    'murray', 'andy murray', 'wawrinka', 'stan wawrinka', 'tsitsipas', 'stefanos tsitsipas',
    'alcaraz', 'carlos alcaraz', 'sinner', 'jannik sinner', 'rublev', 'andrey rublev',
    'zverev', 'alexander zverev', 'medvedev', 'daniil medvedev', 'thiem', 'dominic thiem',
    'kyrgios', 'nick kyrgios', 'shapovalov', 'denis shapovalov', 'auger-aliassime', 'felix auger-aliassime'
  ]
  
  return tennisPlayers.some(player => 
    lowerName.includes(player) || player.includes(lowerName)
  )
}

// Détecter les pilotes F1
function isF1Driver(name: string): boolean {
  const lowerName = name.toLowerCase()
  
  const f1Drivers = [
    'verstappen', 'max verstappen', 'hamilton', 'lewis hamilton', 'leclerc', 'charles leclerc',
    'norris', 'lando norris', 'russell', 'george russell', 'sainz', 'carlos sainz',
    'alonso', 'fernando alonso', 'perez', 'sergio perez', 'checo perez', 'vettel',
    'bottas', 'valtteri bottas', 'ricciardo', 'daniel ricciardo', 'gasly', 'pierre gasly',
    'ocon', 'esteban ocon', 'stroll', 'lance stroll', 'tsunoda', 'yuki tsunoda'
  ]
  
  return f1Drivers.some(driver => 
    lowerName.includes(driver) || driver.includes(lowerName)
  )
}

// ============================================================================
// 🧠 FONCTIONS DE NORMALISATION PAR SPORT
// ============================================================================

// Normalisation pour le football
function normalizePlayerName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const footballMappings = {
    'l messi': 'lionel messi',
    'l. messi': 'lionel messi',
    'leo messi': 'lionel messi',
    'lionel messi': 'lionel messi',
    'messi': 'lionel messi',
    
    'k mbappe': 'kylian mbappe',
    'k. mbappe': 'kylian mbappe',
    'kylian mbappe': 'kylian mbappe',
    'mbappe': 'kylian mbappe',
    
    'c ronaldo': 'cristiano ronaldo',
    'c. ronaldo': 'cristiano ronaldo',
    'cristiano ronaldo': 'cristiano ronaldo',
    'ronaldo': 'cristiano ronaldo',
    'cr7': 'cristiano ronaldo',
    
    'r cherki': 'rayan cherki', 
    'r. cherki': 'rayan cherki',
    'rayan cherki': 'rayan cherki',
    'cherki': 'rayan cherki',
    
    'a griezmann': 'antoine griezmann',
    'a. griezmann': 'antoine griezmann',
    'antoine griezmann': 'antoine griezmann',
    'griezmann': 'antoine griezmann',
    
    'neymar jr': 'neymar',
    'neymar junior': 'neymar',
    'neymar': 'neymar',
    
    'e haaland': 'erling haaland',
    'e. haaland': 'erling haaland',
    'erling haaland': 'erling haaland',
    'haaland': 'erling haaland',
    
    'vinicius jr': 'vinicius junior',
    'vinicius junior': 'vinicius junior',
    'vini jr': 'vinicius junior',
    'vinicius': 'vinicius junior'
  }

  if (footballMappings[normalized]) {
    normalized = footballMappings[normalized]
    console.log(`⭐ Star football détectée: "${name}" -> "${normalized}"`)
  }

  return normalized
}

// 🎾 Normalisation pour le tennis
function normalizeTennisName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const tennisMappings = {
    'n djokovic': 'novak djokovic',
    'n. djokovic': 'novak djokovic',
    'novak djokovic': 'novak djokovic',
    'djokovic': 'novak djokovic',
    
    'r nadal': 'rafael nadal',
    'r. nadal': 'rafael nadal',
    'rafael nadal': 'rafael nadal',
    'rafa nadal': 'rafael nadal',
    'nadal': 'rafael nadal',
    
    'r federer': 'roger federer',
    'r. federer': 'roger federer',
    'roger federer': 'roger federer',
    'federer': 'roger federer',
    
    'a murray': 'andy murray',
    'a. murray': 'andy murray',
    'andy murray': 'andy murray',
    'murray': 'andy murray',
    
    'c alcaraz': 'carlos alcaraz',
    'c. alcaraz': 'carlos alcaraz',
    'carlos alcaraz': 'carlos alcaraz',
    'alcaraz': 'carlos alcaraz',
    
    'd medvedev': 'daniil medvedev',
    'd. medvedev': 'daniil medvedev',
    'daniil medvedev': 'daniil medvedev',
    'medvedev': 'daniil medvedev',
    
    's tsitsipas': 'stefanos tsitsipas',
    's. tsitsipas': 'stefanos tsitsipas',
    'stefanos tsitsipas': 'stefanos tsitsipas',
    'tsitsipas': 'stefanos tsitsipas'
  }

  if (tennisMappings[normalized]) {
    normalized = tennisMappings[normalized]
    console.log(`🎾 Star tennis détectée: "${name}" -> "${normalized}"`)
  }

  return normalized
}

// 🏎️ Normalisation pour la F1
function normalizeDriverName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const driverMappings = {
    'm verstappen': 'max verstappen',
    'm. verstappen': 'max verstappen',
    'max verstappen': 'max verstappen',
    'verstappen': 'max verstappen',
    
    'l hamilton': 'lewis hamilton',
    'l. hamilton': 'lewis hamilton',
    'lewis hamilton': 'lewis hamilton',
    'hamilton': 'lewis hamilton',
    
    'c leclerc': 'charles leclerc',
    'c. leclerc': 'charles leclerc',
    'charles leclerc': 'charles leclerc',
    'leclerc': 'charles leclerc',
    
    'l norris': 'lando norris',
    'l. norris': 'lando norris',
    'lando norris': 'lando norris',
    'norris': 'lando norris',
    
    'g russell': 'george russell',
    'g. russell': 'george russell',
    'george russell': 'george russell',
    'russell': 'george russell',
    
    'c sainz': 'carlos sainz',
    'c. sainz': 'carlos sainz',
    'carlos sainz': 'carlos sainz',
    'sainz': 'carlos sainz',
    
    'f alonso': 'fernando alonso',
    'f. alonso': 'fernando alonso',
    'fernando alonso': 'fernando alonso',
    'alonso': 'fernando alonso',
    
    's perez': 'sergio perez',
    's. perez': 'sergio perez',
    'sergio perez': 'sergio perez',
    'checo perez': 'sergio perez',
    'perez': 'sergio perez'
  }

  if (driverMappings[normalized]) {
    normalized = driverMappings[normalized]
    console.log(`🏎️ Pilote détecté: "${name}" -> "${normalized}"`)
  }

  return normalized
}

// 🎯 Fonction pour choisir le meilleur nom d'affichage selon le sport
function chooseBestName(originalName: string, normalizedName: string, sport: string): string {
  if (sport === 'FOOTBALL') {
    const canonicalNames = {
      'lionel messi': 'Lionel Messi',
      'cristiano ronaldo': 'Cristiano Ronaldo',
      'kylian mbappe': 'Kylian Mbappé',
      'neymar': 'Neymar Jr',
      'erling haaland': 'Erling Haaland',
      'vinicius junior': 'Vinicius Jr',
      'rayan cherki': 'Rayan Cherki',
      'antoine griezmann': 'Antoine Griezmann'
    }
    
    if (canonicalNames[normalizedName]) {
      return canonicalNames[normalizedName]
    }
  } else if (sport === 'TENNIS') {
    const canonicalTennisNames = {
      'novak djokovic': 'Novak Djokovic',
      'rafael nadal': 'Rafael Nadal',
      'roger federer': 'Roger Federer',
      'andy murray': 'Andy Murray',
      'carlos alcaraz': 'Carlos Alcaraz',
      'daniil medvedev': 'Daniil Medvedev',
      'stefanos tsitsipas': 'Stefanos Tsitsipas'
    }
    
    if (canonicalTennisNames[normalizedName]) {
      return canonicalTennisNames[normalizedName]
    }
  } else if (sport === 'F1') {
    const canonicalDriverNames = {
      'max verstappen': 'Max Verstappen',
      'lewis hamilton': 'Lewis Hamilton',
      'charles leclerc': 'Charles Leclerc',
      'lando norris': 'Lando Norris',
      'george russell': 'George Russell',
      'carlos sainz': 'Carlos Sainz',
      'fernando alonso': 'Fernando Alonso',
      'sergio perez': 'Sergio Pérez'
    }
    
    if (canonicalDriverNames[normalizedName]) {
      return canonicalDriverNames[normalizedName]
    }
  }
  
  // Capitalisation par défaut
  return originalName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ============================================================================
// FONCTIONS UTILITAIRES (inchangées)
// ============================================================================

function getPlayerTeamForMatch(match: any, playerTeams: string[]): string {
  const homeTeam = match.homeTeam.toLowerCase()
  const awayTeam = match.awayTeam.toLowerCase()
  
  for (const team of playerTeams) {
    const teamLower = team.toLowerCase()
    
    if (homeTeam.includes(teamLower) || teamLower.includes(homeTeam.split(' ')[0])) {
      return match.homeTeam
    }
    if (awayTeam.includes(teamLower) || teamLower.includes(awayTeam.split(' ')[0])) {
      return match.awayTeam
    }
    
    if (team.includes('France') && (homeTeam.includes('france') || awayTeam.includes('france'))) {
      return homeTeam.includes('france') ? match.homeTeam : match.awayTeam
    }
  }
  
  return playerTeams[0] || 'Équipe inconnue'
}

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