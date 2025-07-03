// pages/api/f1-weekend-details/[id].ts - NOUVEAU endpoint pour week-end complet
import { NextApiRequest, NextApiResponse } from 'next'
import { f1API } from '../../../lib/f1-api'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log(`🏁 Récupération détails week-end F1 pour ${id}...`)
    
    // 1. Récupérer le week-end F1 de la DB
    const match = await prisma.match.findUnique({
      where: { id: id as string }
    })

    if (!match || match.sport !== 'F1') {
      return res.status(404).json({ error: 'Week-end F1 non trouvé' })
    }

    console.log(`🏁 Week-end trouvé: ${match.homeTeam} (${match.awayTeam})`)

    // 2. Récupérer les données complètes du week-end
    let weekendData = null

    try {
      console.log(`🔍 Récupération données week-end depuis l'API...`)
      weekendData = await f1API.getWeekendDetails(match.id)
      console.log(`✅ Données API récupérées`)
    } catch (apiError) {
      console.error('⚠️ Erreur API, génération données mock:', apiError)
      weekendData = generateMockWeekendData(match)
    }

    // 3. Retourner les données
    res.status(200).json({
      success: true,
      weekend: {
        id: match.id,
        name: match.homeTeam,
        circuit: match.awayTeam,
        date: match.date,
        venue: match.venue,
        details: match.details,
        apiId: match.apiMatchId
      },
      sessions: weekendData.sessions || {},
      source: weekendData.source || 'mock'
    })

  } catch (error) {
    console.error('❌ Erreur détails week-end F1:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des détails du week-end F1',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Fonction pour générer des données mock réalistes
function generateMockWeekendData(match: any) {
  const drivers = [
    { name: "Max Verstappen", number: 1, team: "Red Bull Racing", nationality: "NED" },
    { name: "Sergio Pérez", number: 11, team: "Red Bull Racing", nationality: "MEX" },
    { name: "Lando Norris", number: 4, team: "McLaren", nationality: "GBR" },
    { name: "Oscar Piastri", number: 81, team: "McLaren", nationality: "AUS" },
    { name: "Charles Leclerc", number: 16, team: "Ferrari", nationality: "MON" },
    { name: "Carlos Sainz", number: 55, team: "Ferrari", nationality: "ESP" },
    { name: "Lewis Hamilton", number: 44, team: "Mercedes", nationality: "GBR" },
    { name: "George Russell", number: 63, team: "Mercedes", nationality: "GBR" },
    { name: "Fernando Alonso", number: 14, team: "Aston Martin", nationality: "ESP" },
    { name: "Lance Stroll", number: 18, team: "Aston Martin", nationality: "CAN" },
    { name: "Pierre Gasly", number: 10, team: "Alpine", nationality: "FRA" },
    { name: "Esteban Ocon", number: 31, team: "Alpine", nationality: "FRA" },
    { name: "Alex Albon", number: 23, team: "Williams", nationality: "THA" },
    { name: "Logan Sargeant", number: 2, team: "Williams", nationality: "USA" },
    { name: "Yuki Tsunoda", number: 22, team: "RB", nationality: "JPN" },
    { name: "Daniel Ricciardo", number: 3, team: "RB", nationality: "AUS" },
    { name: "Valtteri Bottas", number: 77, team: "Kick Sauber", nationality: "FIN" },
    { name: "Zhou Guanyu", number: 24, team: "Kick Sauber", nationality: "CHN" },
    { name: "Kevin Magnussen", number: 20, team: "Haas", nationality: "DEN" },
    { name: "Nico Hülkenberg", number: 27, team: "Haas", nationality: "GER" }
  ]

  // Points F1 2025
  const racePoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const sprintPoints = [8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  // ========== GÉNÉRER LES QUALIFICATIONS ==========
  const qualifyingOrder = [...drivers].sort(() => Math.random() - 0.5)
  const qualifying = qualifyingOrder.map((driver, index) => ({
    id: `qualifying_${driver.number}`,
    driver: {
      id: driver.number,
      name: driver.name,
      abbr: driver.name.split(' ').map(n => n[0]).join(''),
      number: driver.number,
      team: driver.team,
      nationality: driver.nationality
    },
    position: index + 1,
    time: `1:${(18 + Math.floor(index / 6)).toString().padStart(2, '0')}.${(200 + index * 50 + Math.floor(Math.random() * 200)).toString().padStart(3, '0')}`,
    gap: index === 0 ? null : `+${(index * 0.15 + Math.random() * 0.3).toFixed(3)}`,
    q1_time: index < 15 ? `1:${(19 + Math.floor(index / 8)).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}` : null,
    q2_time: index < 10 ? `1:${(18 + Math.floor(index / 6)).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}` : null,
    q3_time: index < 10 ? `1:${(18 + Math.floor(index / 6)).toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}` : null
  }))

  // ========== GÉNÉRER LA COURSE SPRINT (optionnel) ==========
  const hasSprint = Math.random() > 0.6 // 40% de chance d'avoir un sprint
  let sprint = null
  
  if (hasSprint) {
    const sprintOrder = [...drivers].sort(() => Math.random() - 0.5)
    sprint = sprintOrder.slice(0, 20).map((driver, index) => ({
      id: `sprint_${driver.number}`,
      driver: {
        id: driver.number,
        name: driver.name,
        abbr: driver.name.split(' ').map(n => n[0]).join(''),
        number: driver.number,
        team: driver.team,
        nationality: driver.nationality
      },
      position: index + 1,
      time: index === 0 ? "32:45.123" : `+${(index * 8 + Math.random() * 5).toFixed(3)}`,
      points: sprintPoints[index] || 0,
      laps: 17, // Sprint = course courte
      grid: Math.floor(Math.random() * 20) + 1,
      fastest_lap: index === Math.floor(Math.random() * 3) ? {
        time: "1:42.567",
        lap: Math.floor(Math.random() * 17) + 1
      } : null
    }))
  }

  // ========== GÉNÉRER LA COURSE PRINCIPALE ==========
  // Utiliser l'ordre des qualifications avec quelques changements
  const raceOrder = [...qualifying]
    .sort((a, b) => {
      // 70% de chance de garder l'ordre des qualifs, 30% de mélanger
      if (Math.random() > 0.3) {
        return a.position - b.position
      }
      return Math.random() - 0.5
    })

  const race = raceOrder.map((qualResult, index) => ({
    id: `race_${qualResult.driver.number}`,
    driver: qualResult.driver,
    position: index + 1,
    time: index === 0 ? "1:45:23.456" : `+${(index * 12 + Math.random() * 8).toFixed(3)}`,
    points: racePoints[index] || 0,
    laps: 70,
    grid: qualResult.position, // Position de départ = position en qualifs
    fastest_lap: index === Math.floor(Math.random() * 5) ? {
      time: "1:18.234",
      lap: Math.floor(Math.random() * 70) + 1,
      speed: "320.5 km/h"
    } : null,
    status: index < 18 ? "Finished" : ["DNF", "DNF", "DNS"][index - 18] || "Finished"
  }))

  return {
    sessions: {
      qualifying,
      sprint,
      race
    },
    source: 'mock',
    weekend: {
      name: match.homeTeam,
      circuit: match.awayTeam,
      hasSprint
    }
  }
}