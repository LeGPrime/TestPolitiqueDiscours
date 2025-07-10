// pages/api/ufc-import.ts
// 🥊 API ENDPOINT POUR IMPORT UFC COMPLET AVEC DIAGNOSTIC

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { ufcAPI } from '../../lib/mma-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier l'authentification
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body

  try {
    console.log(`🥊 Import UFC: ${action}`)
    
    if (action === 'test_connection') {
      // 🔍 TESTER LA CONNEXION API UFC
      console.log('🔍 Test de connexion API UFC...')
      
      const connectionTest = await ufcAPI.testConnection()
      
      return res.status(200).json({
        success: connectionTest.success,
        action: 'test_connection',
        message: connectionTest.message,
        details: connectionTest.data,
        recommendations: connectionTest.success 
          ? [
              '✅ API UFC MMA Stats connectée avec succès',
              '🥊 Accès aux vrais combats UFC par date et année',
              '📅 Données 2024/2023 disponibles',
              '⚡ Plan PRO: 2500 requêtes/mois',
              '🔍 Recherche par combattant disponible'
            ]
          : [
              '❌ Vérifiez votre RAPIDAPI_KEY dans .env',
              '💳 Vérifiez votre abonnement RapidAPI Plan PRO',
              '🔑 Assurez-vous d\'être abonné à MMA Stats API',
              '🥊 API: "mma-stats" par "chirikutsikuda"',
              '📊 Plan PRO nécessaire pour quota élevé'
            ]
      })
    }

    if (action === 'import_ufc_2025') {
      // 🥊 IMPORT COMPLET UFC AVEC DIAGNOSTIC AVANCÉ
      console.log('🥊 IMPORT UFC COMPLET - DIAGNOSTIC AVANCÉ')
      console.log('📅 Stratégies: 2024 → 2023 → Dates spécifiques')
      console.log('🎯 Plan PRO: 2500 requêtes/mois')
      
      const result = await ufcAPI.importRealUFCFights2025()
      
      return res.status(200).json({
        success: result.imported > 0,
        action: 'import_ufc_2025',
        message: result.imported > 0 
          ? `🥊 IMPORT UFC RÉUSSI! ${result.imported} combats importés`
          : `⚠️ Import terminé mais aucun combat importé`,
        result,
        summary: {
          totalCombats: result.imported,
          source: 'MMA Stats API (RapidAPI)',
          period: result.summary.period,
          verification: `${result.summary.totalEvents} combats trouvés`,
          examples: result.examples.slice(0, 10),
          diagnostics: result.diagnostics,
          breakdown: {
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors
          }
        },
        quota: ufcAPI.getQuotaStatus(),
        nextSteps: result.imported > 0 ? [
          '✅ Consulte la page d\'accueil pour voir les nouveaux combats UFC',
          '🥊 Filtre par sport "MMA" pour voir tous les combats',
          '🎯 Teste la notation de quelques combats UFC',
          '📊 Explore les détails: gagnant, méthode, stats complètes',
          '⏰ Les données sont importées depuis l\'API officielle'
        ] : [
          '🔍 Utilise "Debug API" pour voir les réponses brutes',
          '📅 Vérifie si l\'API a des données pour les années ciblées',
          '🔧 Vérifie les logs serveur pour les erreurs détaillées',
          '💳 Assure-toi que ton plan RapidAPI est actif',
          '📞 Contacte le support si le problème persiste'
        ],
        dataInfo: {
          realData: true,
          source: 'API officielle MMA Stats',
          coverage: 'Événements UFC 2024/2023 + dates spécifiques',
          updateFrequency: 'En temps réel via API',
          dataFields: [
            'Nom des combattants et surnoms',
            'Tale of the tape complet (stats)',
            'Résultat avec gagnant et perdant',
            'Cotes de paris (odds)',
            'Records des combattants',
            'Statistiques de performance',
            'Informations d\'événement'
          ]
        }
      })
    }

    if (action === 'search_fighter') {
      // 🔍 RECHERCHER UN COMBATTANT SPÉCIFIQUE
      const { fighterName } = req.body
      
      if (!fighterName) {
        return res.status(400).json({
          error: 'Nom du combattant requis',
          example: 'Ex: "Jones", "McGregor", "Nunes"'
        })
      }

      console.log(`🔍 Recherche combattant UFC: "${fighterName}"`)
      
      const fighterData = await ufcAPI.searchUFCFighter(fighterName)
      
      return res.status(200).json({
        success: true,
        action: 'search_fighter',
        message: `🔍 Recherche "${fighterName}" terminée`,
        data: {
          fighter: fighterName,
          found: !!fighterData,
          fighterProfile: fighterData,
          hasUFCHistory: fighterData && Array.isArray(fighterData) && fighterData.length > 0 && fighterData[0]?.['UFC History']?.length > 0,
          dataType: Array.isArray(fighterData) ? 'array' : typeof fighterData,
          recordsFound: fighterData && Array.isArray(fighterData) ? fighterData.length : 0
        },
        recommendation: fighterData 
          ? `✅ Profil trouvé pour ${fighterName}` 
          : `❌ Aucun profil trouvé pour ${fighterName}. Vérifiez l'orthographe.`
      })
    }

    if (action === 'import_specific_date') {
      // 📅 IMPORTER UN ÉVÉNEMENT UFC D'UNE DATE SPÉCIFIQUE
      const { date } = req.body
      
      if (!date) {
        return res.status(400).json({
          error: 'Date requise au format YYYY-MM-DD',
          example: '2024-07-27 (pour UFC 304 du 27 juillet 2024)'
        })
      }

      console.log(`📅 Import UFC pour la date: ${date}`)
      
      const fights = await ufcAPI.getUFCFightsByDate(date)
      
      if (fights.length === 0) {
        return res.status(200).json({
          success: true,
          action: 'import_specific_date',
          message: `📅 Aucun événement UFC trouvé le ${date}`,
          data: {
            date,
            fights: [],
            suggestion: 'Les événements UFC ont lieu certains samedis. Essayez des dates comme 2024-07-27, 2024-04-13, etc.'
          }
        })
      }

      // Importer les combats trouvés
      let imported = 0
      let skipped = 0
      let errors = 0
      const examples: string[] = []

      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      for (const fight of fights) {
        try {
          const existing = await prisma.match.findFirst({
            where: {
              OR: [
                {
                  AND: [
                    { homeTeam: fight.matchup[0] },
                    { awayTeam: fight.matchup[1] },
                    { sport: 'MMA' }
                  ]
                },
                {
                  AND: [
                    { homeTeam: fight.matchup[1] },
                    { awayTeam: fight.matchup[0] },
                    { sport: 'MMA' }
                  ]
                }
              ]
            }
          })

          if (existing) {
            skipped++
            continue
          }

          const fightData = {
            apiMatchId: parseInt(fight.id) || Math.floor(Math.random() * 1000000),
            sport: 'MMA' as const,
            homeTeam: fight.matchup[0],
            awayTeam: fight.matchup[1],
            homeScore: fight.processed.result?.winner === 'fighter1' ? 1 : 
                      fight.processed.result?.winner === 'fighter2' ? 0 : null,
            awayScore: fight.processed.result?.winner === 'fighter2' ? 1 : 
                      fight.processed.result?.winner === 'fighter1' ? 0 : null,
            date: new Date(fight.date),
            status: (fight.winner || fight.loser) ? 'FINISHED' : 'SCHEDULED',
            competition: fight.event,
            season: fight.date.includes('2024') ? '2024' : '2023',
            venue: "UFC Arena",
            referee: null,
            homeTeamLogo: null,
            awayTeamLogo: null,
            details: {
              type: 'UFC_FIGHT',
              matchup: fight.matchup,
              tale_of_the_tape: fight.tale_of_the_tape,
              winner: fight.winner,
              loser: fight.loser,
              odds: fight.odds,
              processed: fight.processed,
              api_data: fight
            }
          }

          await prisma.match.create({ data: fightData })
          imported++
          examples.push(`${fight.matchup[0]} vs ${fight.matchup[1]}`)

        } catch (error) {
          console.error('❌ Erreur import combat:', error)
          errors++
        }
      }

      await prisma.$disconnect()

      return res.status(200).json({
        success: true,
        action: 'import_specific_date',
        message: `📅 Import ${date} terminé`,
        data: {
          date,
          totalFights: fights.length,
          imported,
          skipped,
          errors,
          examples
        }
      })
    }

    if (action === 'get_quota_status') {
      // 📊 VÉRIFIER LE QUOTA API
      const quotaStatus = ufcAPI.getQuotaStatus()
      
      return res.status(200).json({
        success: true,
        action: 'get_quota_status',
        message: '📊 Statut du quota API UFC',
        quota: quotaStatus,
        recommendation: quotaStatus.percentage > 80 
          ? '⚠️ Quota bientôt épuisé pour ce mois'
          : quotaStatus.percentage > 50
          ? '🔶 Quota à moitié utilisé ce mois'
          : '✅ Quota disponible, vous pouvez continuer les imports'
      })
    }

    if (action === 'debug_api_response') {
      // 🧪 DEBUG - VOIR CE QUE RETOURNE VRAIMENT L'API
      console.log('🧪 Debug direct de l\'API UFC...')
      
      try {
        const debugResults = await ufcAPI.debugAPIResponses()
        
        return res.status(200).json({
          success: true,
          action: 'debug_api_response',
          message: '🧪 Debug API terminé',
          ...debugResults,
          analysis: {
            hasWorkingEndpoints: debugResults.summary.successful > 0,
            dataAvailable: debugResults.results.some((r: any) => r.hasData),
            recommendations: debugResults.summary.successful === 0 
              ? [
                  '❌ Aucun endpoint ne fonctionne',
                  '🔑 Vérifiez votre clé API et abonnement',
                  '📞 Contactez le support RapidAPI'
                ]
              : debugResults.results.some((r: any) => r.hasData)
              ? [
                  '✅ API fonctionne et a des données',
                  '🔄 Relancez l\'import principal',
                  '📊 Les données sont disponibles'
                ]
              : [
                  '⚠️ API fonctionne mais données limitées',
                  '📅 Essayez d\'autres années/dates',
                  '🔍 Vérifiez les endpoints disponibles'
                ]
          }
        })
        
      } catch (error) {
        return res.status(500).json({
          success: false,
          action: 'debug_api_response',
          error: error.message
        })
      }
    }

    if (action === 'reset_quota') {
      // 🔄 RESET QUOTA (pour debug)
      ufcAPI.resetQuota()
      
      return res.status(200).json({
        success: true,
        action: 'reset_quota',
        message: '🔄 Quota réinitialisé',
        quota: ufcAPI.getQuotaStatus()
      })
    }

    return res.status(400).json({
      error: 'Action non supportée',
      availableActions: [
        'test_connection - Tester la connexion API UFC',
        'import_ufc_2025 - Import complet UFC avec diagnostic',
        'search_fighter - Rechercher un combattant par nom',
        'import_specific_date - Importer les combats d\'une date',
        'get_quota_status - Vérifier le quota API',
        'debug_api_response - Debug des réponses API brutes',
        'reset_quota - Reset quota (debug)'
      ],
      examples: {
        test_connection: { action: 'test_connection' },
        import_complete: { action: 'import_ufc_2025' },
        search: { action: 'search_fighter', fighterName: 'Jones' },
        specific_date: { action: 'import_specific_date', date: '2024-07-27' },
        quota: { action: 'get_quota_status' },
        debug: { action: 'debug_api_response' },
        reset: { action: 'reset_quota' }
      },
      note: 'Utilisez debug_api_response pour voir les réponses brutes si import_ufc_2025 ne trouve rien'
    })

  } catch (error) {
    console.error('❌ Erreur import UFC:', error)
    
    // Diagnostic d'erreur avancé
    let errorMessage = 'Erreur inconnue'
    let troubleshooting = []
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion à l\'API UFC'
        troubleshooting = [
          'Vérifiez votre connexion internet',
          'Vérifiez que RAPIDAPI_KEY est définie dans .env',
          'Vérifiez votre abonnement RapidAPI Plan PRO',
          'L\'API MMA Stats peut avoir des limitations temporaires'
        ]
      } else if (error.message.includes('429')) {
        errorMessage = 'Quota API UFC dépassé'
        troubleshooting = [
          'Vous avez dépassé vos 2500 requêtes mensuelles',
          'Attendez le mois prochain ou upgradez votre plan',
          'Utilisez get_quota_status pour surveiller l\'usage',
          'Plan PRO: 2500 requêtes/mois'
        ]
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Accès refusé à l\'API UFC'
        troubleshooting = [
          'Vérifiez votre RAPIDAPI_KEY dans .env',
          'Assurez-vous d\'être abonné à MMA Stats API sur RapidAPI',
          'Votre clé API peut être expirée ou invalide',
          'Vérifiez que votre plan PRO est actif'
        ]
      } else if (error.message.includes('Prisma') || error.message.includes('database')) {
        errorMessage = 'Erreur base de données'
        troubleshooting = [
          'Vérifiez que PostgreSQL est démarré',
          'Vérifiez DATABASE_URL dans .env',
          'Essayez: npx prisma db push',
          'Vérifiez que le modèle Match supporte MMA'
        ]
      } else {
        errorMessage = error.message
        troubleshooting = [
          'Vérifiez les logs du serveur pour plus de détails',
          'Utilisez debug_api_response pour diagnostiquer',
          'Redémarrez le serveur Next.js si nécessaire',
          'Vérifiez que tous les champs requis sont présents'
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
        documentation: 'Consultez la documentation MMA Stats API sur RapidAPI',
        ufc_specifics: 'Cette API fournit des vrais événements UFC par date',
        quota: 'Plan PRO: 2500 requêtes/mois, reset mensuel',
        support: 'Contactez le support RapidAPI si le problème persiste'
      },
      nextSteps: [
        '1. Utilisez debug_api_response pour voir les réponses brutes',
        '2. Vérifiez votre accès à MMA Stats API sur RapidAPI',
        '3. Testez d\'abord test_connection',
        '4. Surveillez votre quota avec get_quota_status'
      ],
      apiInfo: {
        name: 'MMA Stats API',
        provider: 'RapidAPI (chirikutsikuda)',
        endpoint: 'mma-stats.p.rapidapi.com',
        plan: 'PRO (2500 requêtes/mois)',
        features: [
          'Combats UFC réels par date',
          'Recherche par combattant',
          'Tale of the tape complet',
          'Cotes de paris',
          'Données historiques'
        ],
        limitations: [
          '2500 requêtes/mois (Plan PRO)',
          'Données disponibles selon les événements réels',
          'Format spécifique pour les dates (Month_Day_Year)'
        ]
      }
    })
  }
}