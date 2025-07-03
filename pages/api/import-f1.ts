// pages/api/import-f1.ts - VERSION COMPLÈTE avec toutes les actions
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, season = 2024 } = req.body

  try {
    console.log(`🏁 Import F1: ${action}`)
    
    if (action === 'test_connection') {
      // 🔍 TEST DE CONNEXION (déjà fonctionnel)
      console.log('🔍 Test de connexion API F1...')
      
      const rapidApiKey = process.env.RAPIDAPI_KEY
      
      if (!rapidApiKey) {
        return res.status(500).json({
          success: false,
          error: 'RAPIDAPI_KEY manquante',
          message: 'La variable d\'environnement RAPIDAPI_KEY n\'est pas définie'
        })
      }

      // Test avec l'endpoint qui marche (Courses 2024)
      try {
        const testResponse = await fetch(`https://api-formula-1.p.rapidapi.com/races?season=2024`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'api-formula-1.p.rapidapi.com',
          }
        })

        if (testResponse.ok) {
          const data = await testResponse.json()
          const races = data.response || data || []
          
          return res.status(200).json({
            success: true,
            action: 'test_connection',
            message: `✅ API F1 connectée via Courses 2024`,
            data: {
              endpoint: 'Courses 2024',
              total: races.length,
              examples: races.slice(0, 3).map((item: any) => 
                item.competition?.name || item.name || 'Élément F1'
              )
            }
          })
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Erreur API',
          message: error.message
        })
      }
    }

    if (action === 'import_races') {
      // 🏁 IMPORT DES COURSES F1
      console.log(`🏁 Import des courses F1 ${season}...`)
      
      const rapidApiKey = process.env.RAPIDAPI_KEY
      if (!rapidApiKey) {
        return res.status(500).json({
          success: false,
          error: 'RAPIDAPI_KEY manquante'
        })
      }

      try {
        // Récupérer les courses depuis l'API
        const response = await fetch(`https://api-formula-1.p.rapidapi.com/races?season=${season}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'api-formula-1.p.rapidapi.com',
          }
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data = await response.json()
        const races = data.response || data || []
        
        // Filtrer pour garder seulement les Grands Prix (pas les essais/qualifs)
        const grandPrix = races.filter((race: any) => {
          const name = race.competition?.name || race.name || ''
          return name.includes('Grand Prix') && 
                 !name.includes('Practice') && 
                 !name.includes('Qualifying') &&
                 !name.includes('Sprint')
        })

        console.log(`📊 ${races.length} courses trouvées, ${grandPrix.length} Grands Prix filtrés`)

        // Importer en base
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        let imported = 0
        let skipped = 0
        let errors = 0
        const examples: string[] = []

        for (const race of grandPrix) {
          try {
            const raceName = race.competition?.name || race.name || 'Unknown GP'
            const circuitName = race.circuit?.name || 'Unknown Circuit'
            
            // Vérifier si existe déjà
            const existing = await prisma.match.findFirst({
              where: {
                homeTeam: raceName,
                awayTeam: circuitName,
                sport: 'F1',
                season: season.toString()
              }
            })

            if (existing) {
              skipped++
              continue
            }

            // Créer le GP
            await prisma.match.create({
              data: {
                apiMatchId: race.id,
                sport: 'F1',
                homeTeam: raceName,
                awayTeam: circuitName,
                homeScore: null,
                awayScore: null,
                date: new Date(race.date),
                status: race.status === 'Completed' ? 'FINISHED' : 'SCHEDULED',
                competition: `Formula 1 ${season}`,
                season: season.toString(),
                venue: circuitName,
                referee: null,
                homeTeamLogo: race.circuit?.image || null,
                awayTeamLogo: null,
                details: {
                  circuit: race.circuit,
                  location: race.competition?.location,
                  type: 'F1_GRAND_PRIX',
                  raceId: race.id
                }
              }
            })

            imported++
            if (examples.length < 3) {
              examples.push(`${raceName} (${circuitName})`)
            }

          } catch (error) {
            console.error(`Erreur import course ${race.id}:`, error)
            errors++
          }
        }

        await prisma.$disconnect()

        return res.status(200).json({
          success: true,
          action: 'import_races',
          imported,
          skipped,
          errors,
          examples,
          message: `🏁 ${imported} Grands Prix importés pour ${season}`,
          details: {
            total: grandPrix.length,
            new: imported,
            existing: skipped,
            failed: errors
          }
        })

      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: 'Erreur import courses',
          message: error.message
        })
      }
    }

    if (action === 'import_drivers') {
      // 👨‍✈️ IMPORT DES PILOTES F1
      console.log(`👨‍✈️ Import des pilotes F1 ${season}...`)
      
      const rapidApiKey = process.env.RAPIDAPI_KEY
      if (!rapidApiKey) {
        return res.status(500).json({
          success: false,
          error: 'RAPIDAPI_KEY manquante'
        })
      }

      try {
        // Récupérer les pilotes depuis l'API
        const response = await fetch(`https://api-formula-1.p.rapidapi.com/drivers?season=${season}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'api-formula-1.p.rapidapi.com',
          }
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const data = await response.json()
        const drivers = data.response || data || []
        
        console.log(`📊 ${drivers.length} pilotes trouvés pour ${season}`)

        // Importer en base
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        let imported = 0
        let skipped = 0
        let errors = 0
        const examples: string[] = []

        for (const driver of drivers) {
          try {
            const driverName = driver.name || `${driver.firstname} ${driver.lastname}` || 'Unknown Driver'
            const driverNumber = driver.number || Math.floor(Math.random() * 99) + 1
            const currentTeam = driver.teams?.find((t: any) => t.season === season)
            const teamName = currentTeam?.team?.name || 'Formula 1'
            
            const playerId = `f1_driver_${season}_${driver.id}`
            
            // Vérifier si existe déjà
            const existing = await prisma.player.findUnique({
              where: { id: playerId }
            })

            if (existing) {
              skipped++
              continue
            }

            // Créer le pilote
            await prisma.player.create({
              data: {
                id: playerId,
                name: driverName,
                number: driverNumber,
                position: 'DRIVER',
                team: teamName,
                sport: 'F1'
              }
            })

            imported++
            if (examples.length < 3) {
              examples.push(`${driverName} (${teamName})`)
            }

          } catch (error) {
            console.error(`Erreur import pilote ${driver.id}:`, error)
            errors++
          }
        }

        await prisma.$disconnect()

        return res.status(200).json({
          success: true,
          action: 'import_drivers',
          imported,
          skipped,
          errors,
          examples,
          message: `👨‍✈️ ${imported} pilotes importés pour ${season}`,
          details: {
            total: drivers.length,
            new: imported,
            existing: skipped,
            failed: errors
          }
        })

      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: 'Erreur import pilotes',
          message: error.message
        })
      }
    }

    if (action === 'import_complete') {
      // 🚀 IMPORT COMPLET (COURSES + PILOTES)
      console.log(`🚀 Import complet F1 ${season}...`)
      
      const startTime = Date.now()
      const rapidApiKey = process.env.RAPIDAPI_KEY
      
      if (!rapidApiKey) {
        return res.status(500).json({
          success: false,
          error: 'RAPIDAPI_KEY manquante'
        })
      }

      try {
        // 1. Import des courses
        console.log('1️⃣ Import des courses...')
        
        const racesResponse = await fetch(`https://api-formula-1.p.rapidapi.com/races?season=${season}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'api-formula-1.p.rapidapi.com',
          }
        })

        let racesImported = 0
        let racesSkipped = 0
        let racesErrors = 0
        const racesExamples: string[] = []

        if (racesResponse.ok) {
          const racesData = await racesResponse.json()
          const races = racesData.response || racesData || []
          
          // Filtrer les Grands Prix
          const grandPrix = races.filter((race: any) => {
            const name = race.competition?.name || race.name || ''
            return name.includes('Grand Prix') && 
                   !name.includes('Practice') && 
                   !name.includes('Qualifying') &&
                   !name.includes('Sprint')
          })

          console.log(`📊 ${races.length} courses trouvées, ${grandPrix.length} GP filtrés`)

          // Importer les GP
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()
          
          for (const race of grandPrix) {
            try {
              const raceName = race.competition?.name || race.name || 'Unknown GP'
              const circuitName = race.circuit?.name || 'Unknown Circuit'
              
              const existing = await prisma.match.findFirst({
                where: {
                  homeTeam: raceName,
                  awayTeam: circuitName,
                  sport: 'F1',
                  season: season.toString()
                }
              })

              if (existing) {
                racesSkipped++
                continue
              }

              await prisma.match.create({
                data: {
                  apiMatchId: race.id,
                  sport: 'F1',
                  homeTeam: raceName,
                  awayTeam: circuitName,
                  homeScore: null,
                  awayScore: null,
                  date: new Date(race.date),
                  status: race.status === 'Completed' ? 'FINISHED' : 'SCHEDULED',
                  competition: `Formula 1 ${season}`,
                  season: season.toString(),
                  venue: circuitName,
                  details: {
                    circuit: race.circuit,
                    location: race.competition?.location,
                    type: 'F1_GRAND_PRIX',
                    raceId: race.id
                  }
                }
              })

              racesImported++
              if (racesExamples.length < 3) {
                racesExamples.push(`${raceName}`)
              }

            } catch (error) {
              console.error(`Erreur GP ${race.id}:`, error)
              racesErrors++
            }
          }

          await prisma.$disconnect()
        }

        // 2. Import des pilotes
        console.log('2️⃣ Import des pilotes...')
        
        const driversResponse = await fetch(`https://api-formula-1.p.rapidapi.com/drivers?season=${season}`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'api-formula-1.p.rapidapi.com',
          }
        })

        let driversImported = 0
        let driversSkipped = 0
        let driversErrors = 0
        const driversExamples: string[] = []

        if (driversResponse.ok) {
          const driversData = await driversResponse.json()
          const drivers = driversData.response || driversData || []
          
          console.log(`📊 ${drivers.length} pilotes trouvés`)

          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()
          
          for (const driver of drivers) {
            try {
              const driverName = driver.name || `${driver.firstname} ${driver.lastname}` || 'Unknown Driver'
              const driverNumber = driver.number || Math.floor(Math.random() * 99) + 1
              const currentTeam = driver.teams?.find((t: any) => t.season === season)
              const teamName = currentTeam?.team?.name || 'Formula 1'
              
              const playerId = `f1_driver_${season}_${driver.id}`
              
              const existing = await prisma.player.findUnique({
                where: { id: playerId }
              })

              if (existing) {
                driversSkipped++
                continue
              }

              await prisma.player.create({
                data: {
                  id: playerId,
                  name: driverName,
                  number: driverNumber,
                  position: 'DRIVER',
                  team: teamName,
                  sport: 'F1'
                }
              })

              driversImported++
              if (driversExamples.length < 3) {
                driversExamples.push(`${driverName}`)
              }

            } catch (error) {
              console.error(`Erreur pilote ${driver.id}:`, error)
              driversErrors++
            }
          }

          await prisma.$disconnect()
        }

        const duration = Math.round((Date.now() - startTime) / 1000)
        
        return res.status(200).json({
          success: true,
          action: 'import_complete',
          season,
          message: `🚀 Import F1 ${season} terminé !`,
          duration: `${duration}s`,
          results: {
            races: {
              imported: racesImported,
              skipped: racesSkipped,
              errors: racesErrors,
              examples: racesExamples
            },
            drivers: {
              imported: driversImported,
              skipped: driversSkipped,
              errors: driversErrors,
              examples: driversExamples
            },
            total: {
              imported: racesImported + driversImported,
              skipped: racesSkipped + driversSkipped,
              errors: racesErrors + driversErrors
            }
          },
          recommendations: [
            'Actualisez votre page d\'accueil pour voir les GP F1',
            'Filtrez par sport "F1" pour voir uniquement les courses',
            'Cliquez sur un GP pour accéder à l\'interface F1 dédiée',
            `${racesImported} GP et ${driversImported} pilotes importés avec succès`
          ]
        })

      } catch (error: any) {
        console.error('❌ Erreur import complet:', error)
        return res.status(500).json({
          success: false,
          error: 'Erreur import complet',
          message: error.message,
          troubleshooting: [
            'Vérifiez votre connexion internet',
            'Vérifiez que l\'API F1 est disponible',
            'Essayez d\'importer les courses et pilotes séparément'
          ]
        })
      }
    }

    if (action === 'import_mock') {
      // 🎭 IMPORT MOCK (déjà fonctionnel dans la version précédente)
      console.log('🎭 Génération de données F1 MOCK...')
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        const mockGPs = [
          { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", date: "2024-03-02" },
          { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", date: "2024-03-09" },
          { name: "Australian Grand Prix", circuit: "Albert Park Circuit", date: "2024-03-24" },
          { name: "Japanese Grand Prix", circuit: "Suzuka Circuit", date: "2024-04-07" },
          { name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", date: "2024-04-21" },
          { name: "Miami Grand Prix", circuit: "Miami International Autodrome", date: "2024-05-05" },
          { name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", date: "2024-05-19" },
          { name: "Monaco Grand Prix", circuit: "Circuit de Monaco", date: "2024-05-26" },
          { name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", date: "2024-06-09" },
          { name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", date: "2024-06-23" },
          { name: "Austrian Grand Prix", circuit: "Red Bull Ring", date: "2024-06-30" },
          { name: "British Grand Prix", circuit: "Silverstone Circuit", date: "2024-07-07" },
          { name: "Hungarian Grand Prix", circuit: "Hungaroring", date: "2024-07-21" },
          { name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", date: "2024-07-28" },
          { name: "Dutch Grand Prix", circuit: "Circuit Zandvoort", date: "2024-08-25" },
          { name: "Italian Grand Prix", circuit: "Autodromo Nazionale di Monza", date: "2024-09-01" },
          { name: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", date: "2024-09-15" },
          { name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", date: "2024-09-22" },
          { name: "United States Grand Prix", circuit: "Circuit of the Americas", date: "2024-10-20" },
          { name: "Mexico City Grand Prix", circuit: "Autodromo Hermanos Rodriguez", date: "2024-10-27" },
          { name: "Brazilian Grand Prix", circuit: "Autodromo Jose Carlos Pace", date: "2024-11-03" },
          { name: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", date: "2024-11-23" },
          { name: "Qatar Grand Prix", circuit: "Lusail International Circuit", date: "2024-12-01" },
          { name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", date: "2024-12-08" }
        ]

        let imported = 0
        let skipped = 0

        for (const gp of mockGPs) {
          try {
            const existing = await prisma.match.findFirst({
              where: {
                homeTeam: gp.name,
                awayTeam: gp.circuit,
                sport: 'F1'
              }
            })

            if (existing) {
              skipped++
              continue
            }

            await prisma.match.create({
              data: {
                apiMatchId: Math.floor(Math.random() * 10000),
                sport: 'F1',
                homeTeam: gp.name,
                awayTeam: gp.circuit,
                homeScore: null,
                awayScore: null,
                date: new Date(gp.date),
                status: 'FINISHED',
                competition: 'Formula 1 2024',
                season: '2024',
                venue: gp.circuit,
                details: {
                  type: 'MOCK_F1_GP',
                  source: 'generated'
                }
              }
            })

            imported++
          } catch (error) {
            console.error(`Erreur GP ${gp.name}:`, error)
          }
        }

        await prisma.$disconnect()

        return res.status(200).json({
          success: true,
          action: 'import_mock',
          message: `🎭 ${imported} Grands Prix MOCK importés`,
          imported,
          skipped,
          examples: mockGPs.slice(0, 3).map(gp => gp.name)
        })

      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: 'Erreur import mock',
          message: error.message
        })
      }
    }

    return res.status(400).json({
      error: 'Action inconnue',
      availableActions: ['test_connection', 'import_races', 'import_drivers', 'import_complete', 'import_mock'],
      example: {
        action: 'import_complete',
        season: 2024
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur générale import F1:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erreur générale',
      message: error.message
    })
  }
}