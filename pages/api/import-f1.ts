// pages/api/import-f1.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { f1API } from '../../lib/f1-api'

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
      // 🔍 TESTER LA CONNEXION À L'API F1
      console.log('🔍 Test de connexion à l\'API F1...')
      
      const connectionTest = await f1API.testConnection()
      
      return res.status(200).json({
        success: connectionTest.success,
        action: 'test_connection',
        message: connectionTest.message,
        data: connectionTest.data
      })
    }

    if (action === 'import_races') {
      // 🏁 IMPORT DES COURSES F1
      console.log(`🏁 Import des courses F1 ${season}...`)
      
      const result = await f1API.importF1Races(season)
      
      return res.status(200).json({
        success: true,
        action: 'import_races',
        season,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        examples: result.examples,
        message: `🏁 ${result.imported} courses F1 importées pour ${season}`,
        details: {
          total: result.imported + result.skipped,
          new: result.imported,
          existing: result.skipped,
          failed: result.errors
        }
      })
    }

    if (action === 'import_drivers') {
      // 👨‍✈️ IMPORT DES PILOTES F1
      console.log(`👨‍✈️ Import des pilotes F1 ${season}...`)
      
      const result = await f1API.importF1Drivers(season)
      
      return res.status(200).json({
        success: true,
        action: 'import_drivers',
        season,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        examples: result.examples,
        message: `👨‍✈️ ${result.imported} pilotes F1 importés pour ${season}`,
        details: {
          total: result.imported + result.skipped,
          new: result.imported,
          existing: result.skipped,
          failed: result.errors
        }
      })
    }

    if (action === 'import_complete') {
      // 🚀 IMPORT COMPLET F1 (COURSES + PILOTES)
      console.log(`🚀 Import complet F1 ${season}...`)
      
      const startTime = Date.now()
      
      // Import des courses
      console.log('1️⃣ Import des courses...')
      const racesResult = await f1API.importF1Races(season)
      
      // Import des pilotes
      console.log('2️⃣ Import des pilotes...')
      const driversResult = await f1API.importF1Drivers(season)
      
      const duration = Math.round((Date.now() - startTime) / 1000)
      
      return res.status(200).json({
        success: true,
        action: 'import_complete',
        season,
        message: `🚀 Import F1 ${season} terminé !`,
        duration: `${duration}s`,
        results: {
          races: {
            imported: racesResult.imported,
            skipped: racesResult.skipped,
            errors: racesResult.errors,
            examples: racesResult.examples
          },
          drivers: {
            imported: driversResult.imported,
            skipped: driversResult.skipped,
            errors: driversResult.errors,
            examples: driversResult.examples
          },
          total: {
            imported: racesResult.imported + driversResult.imported,
            skipped: racesResult.skipped + driversResult.skipped,
            errors: racesResult.errors + driversResult.errors
          }
        },
        recommendations: [
          'Actualisez votre page d\'accueil pour voir les GP F1',
          'Filtrez par sport "F1" pour voir uniquement les courses',
          'Cliquez sur un GP pour accéder à l\'interface F1 dédiée',
          'Vous pouvez maintenant noter chaque pilote sur 10'
        ]
      })
    }

    return res.status(400).json({
      error: 'Action inconnue',
      availableActions: ['test_connection', 'import_races', 'import_drivers', 'import_complete'],
      example: {
        action: 'import_complete',
        season: 2024
      }
    })

  } catch (error) {
    console.error('❌ Erreur import F1:', error)
    
    // Diagnostic d'erreur détaillé
    let errorMessage = 'Erreur inconnue'
    let troubleshooting = []
    
    if (error.message.includes('RAPIDAPI_KEY')) {
      errorMessage = 'Clé API F1 manquante ou invalide'
      troubleshooting = [
        'Vérifiez que RAPIDAPI_KEY est définie dans votre .env',
        'Vérifiez que vous êtes abonné à l\'API Formula 1 sur RapidAPI',
        'Vérifiez que votre clé RapidAPI est valide'
      ]
    } else if (error.message.includes('401')) {
      errorMessage = 'Accès non autorisé à l\'API F1'
      troubleshooting = [
        'Vérifiez votre abonnement à l\'API Formula 1 sur RapidAPI',
        'Vérifiez que votre clé RapidAPI a les bonnes permissions',
        'Essayez de régénérer votre clé RapidAPI'
      ]
    } else if (error.message.includes('429')) {
      errorMessage = 'Quota API F1 dépassé'
      troubleshooting = [
        'Attendez la réinitialisation de votre quota',
        'Vérifiez vos limites sur RapidAPI',
        'Considérez upgrader votre plan RapidAPI'
      ]
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Erreur de connexion à l\'API F1'
      troubleshooting = [
        'Vérifiez votre connexion internet',
        'L\'API Formula 1 pourrait être temporairement indisponible',
        'Réessayez dans quelques minutes'
      ]
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      originalError: error.message,
      action,
      troubleshooting,
      help: {
        rapidapi: 'Visitez https://rapidapi.com/api-sports/api/api-formula-1',
        documentation: 'Documentation API Formula 1 sur RapidAPI',
        support: 'Contactez le support RapidAPI si le problème persiste'
      }
    })
  }
}