// pages/api/new-football-import.ts
// 🏆 API ENDPOINT POUR NOUVEAUX IMPORTS FOOTBALL 2025

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { newFootballAPI } from '../../lib/new-football-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, competitions } = req.body

  try {
    console.log(`🚀 Nouveau import football: ${action}`)
    
    if (action === 'test_connection') {
      // 🔍 TESTER LA CONNEXION API
      console.log('🔍 Test de connexion au nouveau système...')
      
      const connectionTest = await newFootballAPI.testConnection()
      
      return res.status(200).json({
        success: connectionTest.success,
        action: 'test_connection',
        message: connectionTest.message,
        details: connectionTest.details,
        recommendations: connectionTest.success 
          ? [
              '✅ API Football connectée avec abonnement upgradé',
              '🚀 Prêt pour import complet des 15+ compétitions',
              '⚡ 300 requêtes/minute disponibles',
              '📊 Import optimisé pour les 3 derniers mois'
            ]
          : [
              '❌ Vérifiez votre RAPIDAPI_KEY dans .env',
              '💳 Vérifiez que votre abonnement est actif',
              '🔑 Assurez-vous d\'être abonné à API-Football sur RapidAPI'
            ]
      })
    }

    if (action === 'import_all_competitions') {
      // 🏆 IMPORT COMPLET TOUTES LES COMPÉTITIONS
      console.log('🏆 IMPORT COMPLET - Toutes les compétitions football 2025')
      console.log('🎯 Cibles: TOP 5 Europe + Internationales + Coupes + Équipes nationales')
      
      const result = await newFootballAPI.importAllCompetitions()
      
      return res.status(200).json({
        success: true,
        action: 'import_all_competitions',
        message: '🎉 IMPORT COMPLET TERMINÉ !',
        result,
        summary: {
          totalMatches: result.totalImported,
          competitions: result.competitionsProcessed,
          duration: `${Math.floor(result.duration / 60)}min ${result.duration % 60}s`,
          topMatches: result.summary.topMatches,
          dateRange: result.summary.dateRange,
          breakdown: {
            imported: result.totalImported,
            skipped: result.totalSkipped,
            errors: result.totalErrors
          }
        },
        details: {
          byCompetition: result.byCompetition.map(comp => ({
            name: comp.competition,
            imported: comp.imported,
            examples: comp.examples.slice(0, 2)
          }))
        },
        nextSteps: [
          '✅ Vérifie la page d\'accueil pour voir les nouveaux matchs',
          '🎯 Teste la notation de quelques événements',
          '📊 Explore les différentes compétitions',
          '⏰ Configure ensuite l\'automatisation quotidienne'
        ]
      })
    }

    if (action === 'import_specific_competitions' && competitions) {
      // 🎯 IMPORT COMPÉTITIONS SPÉCIFIQUES
      console.log('🎯 Import de compétitions spécifiques:', competitions)
      
      // Pour l'instant, utilise l'import complet
      // Plus tard on peut ajouter la logique pour des compétitions spécifiques
      const result = await newFootballAPI.importAllCompetitions()
      
      return res.status(200).json({
        success: true,
        action: 'import_specific_competitions',
        message: `🎯 Import des compétitions sélectionnées terminé`,
        result: {
          imported: result.totalImported,
          competitions: competitions.length,
          details: result.byCompetition
        }
      })
    }

    if (action === 'import_daily') {
      // 📅 IMPORT QUOTIDIEN (pour tester le cron)
      console.log('📅 Test import quotidien...')
      
      const result = await newFootballAPI.importDailyMatches()
      
      return res.status(200).json({
        success: true,
        action: 'import_daily',
        message: '📅 Import quotidien terminé',
        result: {
          imported: result.totalImported,
          skipped: result.totalSkipped,
          newMatches: result.byCompetition.filter(c => c.imported > 0)
        }
      })
    }

    return res.status(400).json({
      error: 'Action non supportée',
      availableActions: [
        'test_connection',
        'import_all_competitions', 
        'import_specific_competitions',
        'import_daily'
      ],
      note: 'Utilise import_all_competitions pour démarrer'
    })

  } catch (error) {
    console.error('❌ Erreur nouveau import football:', error)
    
    // Diagnostic d'erreur avancé
    let errorMessage = 'Erreur inconnue'
    let troubleshooting = []
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion à l\'API Football'
        troubleshooting = [
          'Vérifiez votre connexion internet',
          'Vérifiez que RAPIDAPI_KEY est définie dans .env',
          'Vérifiez votre abonnement RapidAPI (doit être upgradé)',
          'L\'API Football doit être active sur votre compte RapidAPI'
        ]
      } else if (error.message.includes('429')) {
        errorMessage = 'Quota API dépassé malgré l\'upgrade'
        troubleshooting = [
          'Votre abonnement est peut-être insuffisant',
          'Attendez quelques minutes et réessayez',
          'Vérifiez votre plan sur RapidAPI',
          'Contactez le support RapidAPI si le problème persiste'
        ]
      } else if (error.message.includes('401')) {
        errorMessage = 'Clé API invalide ou abonnement inactif'
        troubleshooting = [
          'Vérifiez votre RAPIDAPI_KEY dans .env',
          'Vérifiez que votre abonnement API Football est actif',
          'Régénérez votre clé RapidAPI si nécessaire',
          'Assurez-vous d\'être abonné à "API-Football" pas "Football-Data"'
        ]
      } else if (error.message.includes('Prisma') || error.message.includes('database')) {
        errorMessage = 'Erreur base de données'
        troubleshooting = [
          'Vérifiez que PostgreSQL est démarré',
          'Vérifiez DATABASE_URL dans .env',
          'Essayez: npx prisma db push',
          'Vérifiez l\'espace disque disponible'
        ]
      } else {
        errorMessage = error.message
        troubleshooting = [
          'Vérifiez les logs du serveur pour plus de détails',
          'Assurez-vous que tous les services sont démarrés',
          'Redémarrez le serveur Next.js si nécessaire'
        ]
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      originalError: error instanceof Error ? error.message : 'Erreur inconnue',
      action,
      troubleshooting,
      help: {
        documentation: 'Consultez la documentation API-Football sur RapidAPI',
        support: 'Contactez le support RapidAPI si problème de quota',
        configuration: 'Vérifiez votre fichier .env et votre abonnement',
        apiStatus: 'Vérifiez le statut de l\'API sur status.rapidapi.com'
      },
      nextSteps: [
        '1. Vérifiez votre connexion et configuration',
        '2. Testez d\'abord test_connection',
        '3. Si ça marche, relancez import_all_competitions',
        '4. Consultez les logs pour plus de détails'
      ]
    })
  }
}