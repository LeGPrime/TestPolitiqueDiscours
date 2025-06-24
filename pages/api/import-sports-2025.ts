// pages/api/import-sports-2025.ts
// Endpoint principal pour import des données sportives 2025

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { workingSportsAPI } from '../../lib/working-sports-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action = 'import_all', sport } = req.body

  try {
    console.log(`🚀 Import Sports 2025: ${action}`)
    
    if (action === 'test_connection') {
      // 🔍 TESTER LA CONNEXION AUX APIS
      console.log('🔍 Test de connexion aux APIs...')
      
      const connectionTest = await workingSportsAPI.testAPIConnection()
      
      return res.status(200).json({
        success: true,
        action: 'test_connection',
        results: connectionTest,
        message: connectionTest.football && connectionTest.basketball 
          ? '✅ Toutes les APIs sont connectées !'
          : connectionTest.football || connectionTest.basketball
          ? '⚠️ Certaines APIs sont disponibles'
          : '❌ Aucune API n\'est disponible',
        recommendations: {
          football: connectionTest.football 
            ? '✅ API Football OK - Prêt pour import' 
            : '❌ Vérifiez votre RAPIDAPI_KEY et les permissions',
          basketball: connectionTest.basketball 
            ? '✅ API Basketball OK - Prêt pour import' 
            : '❌ Vérifiez votre RAPIDAPI_KEY et les permissions'
        }
      })
    }

    if (action === 'import_all') {
      // 🌍 IMPORT COMPLET FOOTBALL + BASKETBALL 2025
      console.log('🏆 IMPORT COMPLET 2025 : Football + Basketball')
      console.log('📅 Données saison 2024-2025 avec vraies APIs')
      
      const result = await workingSportsAPI.importAllSports2025()
      
      return res.status(200).json({
        success: true,
        action: 'import_all',
        message: '🎉 IMPORT COMPLET TERMINÉ !',
        result,
        summary: {
          duration: `${result.duration}s`,
          total: `${result.total} événements importés`,
          football: `⚽ ${result.football.imported} matchs (${result.football.examples.join(', ')})`,
          basketball: `🏀 ${result.basketball.imported} matchs (${result.basketball.examples.join(', ')})`
        },
        stats: {
          football: {
            imported: result.football.imported,
            skipped: result.football.skipped,
            errors: result.football.errors,
            examples: result.football.examples
          },
          basketball: {
            imported: result.basketball.imported,
            skipped: result.basketball.skipped,
            errors: result.basketball.errors,
            examples: result.basketball.examples
          }
        },
        period: '2024-2025',
        note: 'Données réelles importées avec succès ! Actualisez la page d\'accueil.'
      })
    }

    if (action === 'import_sport' && sport) {
      // Import d'un sport spécifique
      let result: any
      let sportName = ''
      
      switch(sport) {
        case 'football':
          result = await workingSportsAPI.importFootball2025()
          sportName = '⚽ Football'
          break
        case 'basketball':
          result = await workingSportsAPI.importBasketball2025()
          sportName = '🏀 Basketball'
          break
        default:
          return res.status(400).json({ 
            error: 'Sport non supporté',
            availableSports: ['football', 'basketball']
          })
      }
      
      return res.status(200).json({
        success: true,
        action: 'import_sport',
        sport: sportName,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        examples: result.examples,
        message: `${sportName} : ${result.imported} événements importés`,
        period: '2024-2025'
      })
    }

    if (action === 'import_daily') {
      // 📅 Import quotidien des matchs d'aujourd'hui
      console.log('📅 Import quotidien des matchs terminés aujourd\'hui...')
      
      const result = await workingSportsAPI.importTodaysMatches()
      
      return res.status(200).json({
        success: true,
        action: 'import_daily',
        imported: result.imported,
        sports: result.sports,
        examples: result.examples,
        message: `📅 ${result.imported} nouveaux matchs d'aujourd'hui`,
        period: 'Aujourd\'hui'
      })
    }

    return res.status(400).json({
      error: 'Action inconnue',
      availableActions: ['test_connection', 'import_all', 'import_sport', 'import_daily'],
      availableSports: ['football', 'basketball']
    })

  } catch (error) {
    console.error('❌ Erreur import sports 2025:', error)
    
    // Diagnostic d'erreur détaillé
    let errorMessage = 'Erreur inconnue'
    let troubleshooting = []
    
    if (error.message.includes('fetch')) {
      errorMessage = 'Erreur de connexion à l\'API'
      troubleshooting = [
        'Vérifiez votre connexion internet',
        'Vérifiez que RAPIDAPI_KEY est définie dans .env',
        'Vérifiez que vous avez un abonnement RapidAPI actif'
      ]
    } else if (error.message.includes('429')) {
      errorMessage = 'Quota API dépassé'
      troubleshooting = [
        'Attendez 1 minute et réessayez',
        'Vérifiez vos quotas sur RapidAPI',
        'Considérez upgrader votre plan RapidAPI'
      ]
    } else if (error.message.includes('401')) {
      errorMessage = 'Clé API invalide'
      troubleshooting = [
        'Vérifiez votre RAPIDAPI_KEY dans .env',
        'Assurez-vous d\'être abonné aux APIs sur RapidAPI',
        'Régénérez votre clé si nécessaire'
      ]
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      originalError: error.message,
      action,
      troubleshooting,
      help: {
        rapidapi: 'Visitez https://rapidapi.com pour gérer vos abonnements',
        apis: [
          'API-Football: https://rapidapi.com/api-sports/api/api-football',
          'API-Basketball: https://rapidapi.com/api-sports/api/api-basketball'
        ]
      }
    })
  }
}