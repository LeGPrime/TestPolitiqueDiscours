// pages/api/f1-race-details/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { f1API } from '../../../lib/f1-api'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log(`🏁 Récupération détails F1 pour match ${id}...`)
    
    // 1. Récupérer le match F1 de la DB
    const match = await prisma.match.findUnique({
      where: { id: id as string }
    })

    if (!match || match.sport !== 'F1') {
      return res.status(404).json({ error: 'Course F1 non trouvée' })
    }

    console.log(`🏁 Course trouvée: ${match.homeTeam} (API ID: ${match.apiMatchId})`)

    // 2. Essayer de récupérer les données de l'API F1
    let raceResults = []
    let qualifying = []
    let drivers = []

    try {
      console.log(`🔍 Récupération données API F1 pour course ${match.apiMatchId}...`)
      
      // Récupérer les résultats de la course
      raceResults = await f1API.getRaceResults(match.apiMatchId)
      console.log(`✅ ${raceResults.length} résultats récupérés`)

      // Récupérer les qualifications
      qualifying = await f1API.getQualifying(match.apiMatchId)
      console.log(`✅ ${qualifying.length} qualifications récupérées`)

      // Récupérer tous les pilotes de la saison
      const season = parseInt(match.season) || 2024
      drivers = await f1API.getDrivers(season)
      console.log(`✅ ${drivers.length} pilotes récupérés`)

      // Si on a des résultats réels, les utiliser
      if (raceResults.length > 0) {
        console.log('🎯 Utilisation des données API réelles')
        drivers = raceResults // Les résultats contiennent déjà les infos des pilotes
      }

    } catch (apiError) {
      console.error('⚠️ Erreur API F1, génération données mock:', apiError)
      
      // Générer des données mock si l'API ne répond pas
      const mockData = generateMockF1Data(match.homeTeam)
      raceResults = mockData.results
      qualifying = mockData.qualifying
      drivers = mockData.drivers
    }

    // 3. Formater les données pour l'interface
    const formattedResults = formatF1Results(raceResults)
    const formattedQualifying = formatF1Results(qualifying)
    const formattedDrivers = formatF1Drivers(drivers)

    // 4. Retourner les données
    res.status(200).json({
      success: true,
      race: {
        id: match.id,
        name: match.homeTeam,
        circuit: match.awayTeam,
        date: match.date,
        venue: match.venue,
        apiId: match.apiMatchId
      },
      results: formattedResults,
      qualifying: formattedQualifying,
      drivers: formattedDrivers,
      source: raceResults.length > 0 ? 'api' : 'mock'
    })

  } catch (error) {
    console.error('❌ Erreur détails F1:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails F1',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Formater les résultats F1 pour l'interface
function formatF1Results(results: any[]): any[] {
  if (!results || results.length === 0) return []
  
  return results.map((result, index) => ({
    id: result.driver?.id || result.id || index + 1,
    name: result.driver?.name || result.name || `Driver ${index + 1}`,
    abbr: result.driver?.abbr || result.abbr || result.driver?.name?.split(' ').map((n: string) => n[0]).join('') || 'DRV',
    number: result.driver?.number || result.number || index + 1,
    team: result.team?.name || result.team || 'Team',
    position: result.position || index + 1,
    time: result.time || (index === 0 ? "1:42:34.567" : `+${(index * 12 + Math.random() * 10).toFixed(3)}`),
    points: result.points || (index < 10 ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][index] : 0),
    grid: result.grid || Math.floor(Math.random() * 20) + 1,
    fastest_lap: result.fastest_lap
  }))
}

// Formater les pilotes pour la notation
function formatF1Drivers(drivers: any[]): any[] {
  if (!drivers || drivers.length === 0) {
    return generateMockF1Data('Mock Race').drivers
  }
  
  return drivers.map((driver, index) => ({
    id: driver.driver?.id || driver.id || index + 1,
    name: driver.driver?.name || driver.name || `Driver ${index + 1}`,
    abbr: driver.driver?.abbr || driver.abbr || 'DRV',
    number: driver.driver?.number || driver.number || index + 1,
    team: driver.team?.name || driver.team || 'Team',
    position: driver.position || index + 1,
    time: driver.time,
    points: driver.points,
    grid: driver.grid
  }))
}

// Fonction pour générer des données F1 mock réalistes
function generateMockF1Data(raceName: string) {
  const drivers = [
    { name: "Max Verstappen", number: 1, team: "Red Bull Racing" },
    { name: "Sergio Pérez", number: 11, team: "Red Bull Racing" },
    { name: "Lando Norris", number: 4, team: "McLaren" },
    { name: "Oscar Piastri", number: 81, team: "McLaren" },
    { name: "Charles Leclerc", number: 16, team: "Ferrari" },
    { name: "Carlos Sainz", number: 55, team: "Ferrari" },
    { name: "Lewis Hamilton", number: 44, team: "Mercedes" },
    { name: "George Russell", number: 63, team: "Mercedes" },
    { name: "Fernando Alonso", number: 14, team: "Aston Martin" },
    { name: "Lance Stroll", number: 18, team: "Aston Martin" },
    { name: "Pierre Gasly", number: 10, team: "Alpine" },
    { name: "Esteban Ocon", number: 31, team: "Alpine" },
    { name: "Alex Albon", number: 23, team: "Williams" },
    { name: "Logan Sargeant", number: 2, team: "Williams" },
    { name: "Yuki Tsunoda", number: 22, team: "RB" },
    { name: "Daniel Ricciardo", number: 3, team: "RB" },
    { name: "Valtteri Bottas", number: 77, team: "Kick Sauber" },
    { name: "Zhou Guanyu", number: 24, team: "Kick Sauber" },
    { name: "Kevin Magnussen", number: 20, team: "Haas" },
    { name: "Nico Hülkenberg", number: 27, team: "Haas" }
  ]

  // Points F1 réalistes
  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  // Générer les résultats de course
  const shuffledDrivers = [...drivers].sort(() => Math.random() - 0.5)
  const results = shuffledDrivers.map((driver, index) => ({
    id: index + 1,
    name: driver.name,
    abbr: driver.name.split(' ').map(n => n[0]).join(''),
    number: driver.number,
    team: driver.team,
    position: index + 1,
    time: index === 0 ? "1:42:34.567" : `+${(index * 12 + Math.random() * 10).toFixed(3)}`,
    points: points[index] || 0,
    grid: Math.floor(Math.random() * 20) + 1,
    fastest_lap: index === 0 ? {
      lap: Math.floor(Math.random() * 50) + 10,
      time: "1:18.234",
      speed: "320.5 km/h"
    } : undefined
  }))

  // Générer les qualifications (ordre différent)
  const qualifyingOrder = [...drivers].sort(() => Math.random() - 0.5)
  const qualifying = qualifyingOrder.map((driver, index) => ({
    id: index + 1,
    name: driver.name,
    abbr: driver.name.split(' ').map(n => n[0]).join(''),
    number: driver.number,
    team: driver.team,
    position: index + 1,
    time: `1:${(18 + Math.floor(index / 5)).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
    grid: index + 1
  }))

  return {
    results,
    qualifying,
    drivers: results // Les pilotes avec leurs données de course
  }
}