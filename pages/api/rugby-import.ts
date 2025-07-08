// pages/api/rugby-import.ts
// 🏉 API ENDPOINT POUR IMPORT RUGBY 2025

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { rugbyAPI } from '../../lib/rugby-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body

  try {
    console.log(`🏉 Import Rugby: ${action}`)
    
    if (action === 'test_connection') {
      // 🔍 TESTER LA CONNEXION API RUGBY
      console.log('🔍 Test de connexion API Rugby...')
      
      const connectionTest = await rugbyAPI.testConnection()
      
      return res.status(200).json({
        success: connectionTest.success,
        action: 'test_connection',
        message: connectionTest.message,
        details: connectionTest.data,
        recommendations: connectionTest.success 
          ? [
              '✅ API Rugby connectée et opérationnelle',
              '🏉 Compétitions cibles : Top 14, Champions Cup, Six Nations',
              '📅 Prêt pour import saison 2025 (depuis janvier)',
              '⚡ Import optimisé pour éviter le rate limiting'
            ]
          : [
              '❌ Vérifiez votre RAPIDAPI_KEY dans .env',
              '💳 Vérifiez que votre abonnement RapidAPI est actif',
              '🔑 Assurez-vous d\'être abonné à API-Rugby sur RapidAPI',
              '🏉 Certaines APIs rugby peuvent nécessiter un plan premium'
            ]
      })
    }

    if (action === 'import_rugby_2025') {
      // 🏉 IMPORT COMPLET RUGBY 2025
      console.log('🏉 IMPORT COMPLET - Rugby 2025')
      console.log('🎯 Cibles: Top 14, Champions Cup, Six Nations, Internationaux')
      
      const result = await rugbyAPI.importRugbyMatches2025()
      
      return res.status(200).json({
        success: true,
        action: 'import_rugby_2025',
        message: '🏉 IMPORT RUGBY TERMINÉ !',
        result,
        summary: {
          totalMatches: result.imported,
          competitions: result.competitions,
          examples: result.examples,
          breakdown: {
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors
          }
        },
        competitions: {
          domestic: ['Top 14', 'Gallagher Premiership'],
          european: ['European Rugby Champions Cup'],
          international: ['Six Nations Championship', 'Rugby Championship', 'International Friendlies'],
          other: ['United Rugby Championship']
        },
        nextSteps: [
          '✅ Vérifie la page d\'accueil pour voir les nouveaux matchs rugby',
          '🏉 Filtre par sport "Rugby" pour voir tous les matchs',
          '🎯 Teste la notation de quelques matchs de rugby',
          '📊 Explore les différentes compétitions (Top 14, Champions Cup...)',
          '⏰ Configure l\'import quotidien pour les mises à jour automatiques'
        ]
      })
    }

    if (action === 'import_daily_rugby') {
      // 📅 IMPORT QUOTIDIEN RUGBY (pour tester le cron)
      console.log('📅 Test import quotidien rugby...')
      
      const result = await rugbyAPI.importDailyRugbyMatches()
      
      return res.status(200).json({
        success: true,
        action: 'import_daily_rugby',
        message: '📅 Import quotidien rugby terminé',
        result: {
          imported: result.imported,
          updated: result.updated,
          errors: result.errors
        }
      })
    }

    return res.status(400).json({
      error: 'Action non supportée',
      availableActions: [
        'test_connection',
        'import_rugby_2025',
        'import_daily_rugby'
      ],
      note: 'Utilise import_rugby_2025 pour démarrer'
    })

  } catch (error) {
    console.error('❌ Erreur import rugby:', error)
    
    // Diagnostic d'erreur avancé pour le rugby
    let errorMessage = 'Erreur inconnue'
    let troubleshooting = []
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion à l\'API Rugby'
        troubleshooting = [
          'Vérifiez votre connexion internet',
          'Vérifiez que RAPIDAPI_KEY est définie dans .env',
          'Vérifiez votre abonnement RapidAPI',
          'L\'API Rugby peut nécessiter un plan premium selon le provider'
        ]
      } else if (error.message.includes('429')) {
        errorMessage = 'Quota API Rugby dépassé'
        troubleshooting = [
          'L\'API Rugby a des limites strictes',
          'Attendez quelques minutes et réessayez',
          'Vérifiez votre plan RapidAPI',
          'Considérez un upgrade si nécessaire'
        ]
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Accès refusé à l\'API Rugby'
        troubleshooting = [
          'Vérifiez votre RAPIDAPI_KEY dans .env',
          'Assurez-vous d\'être abonné à l\'API Rugby',
          'Certaines APIs rugby nécessitent une approbation manuelle',
          'Vérifiez que votre abonnement couvre le rugby'
        ]
      } else if (error.message.includes('Prisma') || error.message.includes('database')) {
        errorMessage = 'Erreur base de données'
        troubleshooting = [
          'Vérifiez que PostgreSQL est démarré',
          'Vérifiez DATABASE_URL dans .env',
          'Essayez: npx prisma db push',
          'Vérifiez que le modèle Match supporte RUGBY'
        ]
      } else {
        errorMessage = error.message
        troubleshooting = [
          'Vérifiez les logs du serveur pour plus de détails',
          'L\'API Rugby peut avoir des spécificités',
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
        documentation: 'Consultez la documentation de l\'API Rugby sur RapidAPI',
        rugby_specifics: 'Les APIs rugby peuvent avoir des limitations spéciales',
        competitions: 'Vérifiez que Top 14, Champions Cup sont disponibles',
        season: 'Assurez-vous que la saison 2025 est disponible'
      },
      nextSteps: [
        '1. Vérifiez votre accès à l\'API Rugby sur RapidAPI',
        '2. Testez d\'abord test_connection',
        '3. Si ça marche, relancez import_rugby_2025',
        '4. Les APIs rugby peuvent nécessiter un plan premium'
      ]
    })
  }
}