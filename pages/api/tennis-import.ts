// pages/api/tennis-import.ts
// 🎾 ENDPOINT IMPORT TENNIS ATP via SportDevs

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { tennisSportDevsAPI } from '../../lib/tennis-sportdevs-api'

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
    console.log(`🎾 Tennis Import: ${action}`)
    
    if (action === 'test_connection') {
      // 🔍 TESTER LA CONNEXION TENNIS API
      console.log('🔍 Test connexion Tennis SportDevs API...')
      
      const connectionTest = await tennisSportDevsAPI.testConnection()
      const quotaStatus = tennisSportDevsAPI.getQuotaStatus()
      
      return res.status(200).json({
        success: connectionTest.success,
        action: 'test_connection',
        message: connectionTest.message,
        details: {
          ...connectionTest.sampleData,
          quota: quotaStatus,
          api: 'Tennis SportDevs via RapidAPI',
          host: 'tennis-devs.p.rapidapi.com'
        },
        recommendations: connectionTest.success 
          ? [
              '✅ Tennis API SportDevs connectée avec succès',
              '🎾 Accès aux matchs ATP récents disponible',
              `📊 Quota: ${quotaStatus.remaining}/${quotaStatus.dailyLimit} requêtes restantes`,
              '⚡ Optimisé pour économiser les requêtes',
              '🏆 Prêt pour import ATP matches'
            ]
          : [
              '❌ Vérifiez votre RAPIDAPI_KEY dans .env',
              '💳 Assurez-vous d\'être abonné à Tennis Devs sur RapidAPI',
              '🎾 L\'API Tennis Devs doit être activée sur votre compte',
              '📊 Plan gratuit: 300 requêtes/jour disponibles'
            ]
      })
    }

    if (action === 'import_atp_july_2025') {
      // 🎾 IMPORT ATP JUILLET 2025 STRICT
      console.log('🎾 IMPORT ATP JUILLET 2025 - FILTRAGE STRICT')
      console.log('🎯 Cible: Matchs ATP masculins de juillet 2025 uniquement')
      
      // Vérifier le quota avant import
      const quotaBefore = tennisSportDevsAPI.getQuotaStatus()
      
      if (quotaBefore.remaining < 3) {
        return res.status(429).json({
          success: false,
          error: 'Quota insuffisant',
          message: `Seulement ${quotaBefore.remaining} requêtes restantes. Import nécessite au moins 3 requêtes.`,
          quota: quotaBefore
        })
      }

      const result = await tennisSportDevsAPI.importTennisMatches()
      
      return res.status(200).json({
        success: result.imported > 0,
        action: 'import_atp_july_2025',
        message: result.imported > 0 
          ? `🎾 IMPORT ATP JUILLET RÉUSSI! ${result.imported} matchs ATP importés`
          : `⚠️ Import terminé mais aucun match ATP trouvé en juillet 2025`,
        result,
        summary: {
          totalMatches: result.imported,
          sport: 'Tennis ATP Masculin',
          period: 'Juillet 2025',
          source: 'SportDevs Tennis API via RapidAPI',
          strict: true,
          examples: result.examples,
          quota: {
            used: result.requestsUsed,
            remaining: result.quotaRemaining,
            efficiency: `${result.imported} matches ATP pour ${result.requestsUsed} requêtes`
          },
          breakdown: {
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors
          }
        },
        nextSteps: result.imported > 0 ? [
          '✅ Vérifie la page d\'accueil pour voir les matchs ATP de juillet',
          '🎾 Filtre par sport "Tennis" pour voir tous les matchs ATP',
          '🏆 Les matchs importés sont exclusivement du circuit ATP masculin',
          '📊 Surface, tournoi et scores disponibles pour chaque match',
          `🔄 ${result.quotaRemaining} requêtes restantes pour aujourd'hui`
        ] : [
          '🔍 Aucun match ATP trouvé pour juillet 2025',
          '📅 Vérifiez que l\'API a des données pour cette période',
          '🔧 Utilisez "Debug API" pour voir les matchs disponibles',
          '🎾 Les filtres ATP sont très stricts (masculin uniquement)',
          '📞 Période peut être trop récente ou future'
        ],
        strictFiltering: {
          enabled: true,
          dateRange: 'Juillet 2025 (2025-07-01 à 2025-07-31)',
          exclusions: ['WTA', 'Junior', 'Doubles', 'Mixed', 'Exhibition'],
          inclusions: ['ATP Tour', 'Masters', 'Grand Slam masculin'],
          statusFilter: 'Matchs terminés uniquement'
        }
      })
    }

    if (action === 'import_atp_matches') {
      // 🎾 IMPORT ATP MATCHES ÉCONOMIQUE
      console.log('🎾 IMPORT ATP - Matches récents')
      console.log('🎯 Stratégie économique: max 50 matches, <5 requêtes')
      
      // Vérifier le quota avant import
      const quotaBefore = tennisSportDevsAPI.getQuotaStatus()
      
      if (quotaBefore.remaining < 5) {
        return res.status(429).json({
          success: false,
          error: 'Quota insuffisant',
          message: `Seulement ${quotaBefore.remaining} requêtes restantes. Import nécessite au moins 5 requêtes.`,
          quota: quotaBefore
        })
      }

      const result = await tennisSportDevsAPI.importTennisMatches()
      
      return res.status(200).json({
        success: result.imported > 0,
        action: 'import_atp_matches',
        message: result.imported > 0 
          ? `🎾 IMPORT TENNIS RÉUSSI! ${result.imported} matchs ATP importés`
          : `⚠️ Import terminé mais aucun match importé`,
        result,
        summary: {
          totalMatches: result.imported,
          sport: 'Tennis ATP',
          source: 'SportDevs Tennis API via RapidAPI',
          economical: true,
          examples: result.examples,
          quota: {
            used: result.requestsUsed,
            remaining: result.quotaRemaining,
            efficiency: `${result.imported} matches pour ${result.requestsUsed} requêtes`
          },
          breakdown: {
            imported: result.imported,
            skipped: result.skipped,
            errors: result.errors
          }
        },
        nextSteps: result.imported > 0 ? [
          '✅ Consulte la page d\'accueil pour voir les nouveaux matchs tennis',
          '🎾 Filtre par sport "Tennis" pour voir tous les matchs ATP',
          '🏆 Teste la notation de quelques matchs de tennis',
          '📊 Explore les détails: scores par set, surface, tournoi',
          '⏰ Les données sont importées depuis l\'API SportDevs officielle',
          `🔄 ${result.quotaRemaining} requêtes restantes pour aujourd'hui`
        ] : [
          '🔍 Vérifie les logs serveur pour voir les détails',
          '📅 L\'API peut ne pas avoir de matchs ATP récents',
          '🔧 Essaie "test_connection" pour vérifier l\'accès',
          '💳 Assure-toi que ton abonnement RapidAPI est actif',
          '📞 Contacte le support SportDevs si le problème persiste'
        ],
        dataInfo: {
          realData: true,
          source: 'SportDevs Tennis API officielle',
          coverage: 'Matchs ATP récents terminés',
          updateFrequency: 'Temps réel via API',
          dataFields: [
            'Noms des joueurs et classements',
            'Scores détaillés par set',
            'Informations tournoi (nom, niveau, surface)',
            'Lieu et date du match',
            'Statut du match',
            'Round et surface de jeu'
          ],
          quotaFriendly: 'Import optimisé pour économiser les requêtes'
        }
      })
    }

    if (action === 'debug_api_response') {
      // 🧪 DEBUG - VOIR CE QUE RETOURNE LA VRAIE API
      console.log('🧪 Debug API Tennis SportDevs (vraie structure)...')
      
      try {
        const testData = await tennisSportDevsAPI.testConnection()
        
        // Récupérer quelques matchs bruts pour analyse avec vraie API
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
        const SPORTDEVS_TENNIS_HOST = 'tennis-devs.p.rapidapi.com'
        
        const response = await fetch(`https://tennis.sportdevs.com/matches?limit=5`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY!,
            'X-RapidAPI-Host': SPORTDEVS_TENNIS_HOST,
          }
        })
        
        const rawData = await response.json()
        
        return res.status(200).json({
          success: true,
          action: 'debug_api_response',
          message: '🧪 Debug API terminé avec vraie structure',
          debug: {
            testConnection: testData,
            rawApiResponse: {
              status: response.status,
              dataType: Array.isArray(rawData) ? 'array' : typeof rawData,
              count: Array.isArray(rawData) ? rawData.length : 'N/A',
              realStructure: Array.isArray(rawData) && rawData.length > 0 ? {
                id: rawData[0].id,
                name: rawData[0].name,
                home_team_name: rawData[0].home_team_name,
                away_team_name: rawData[0].away_team_name,
                tournament_name: rawData[0].tournament_name,
                status_type: rawData[0].status_type,
                ground_type: rawData[0].ground_type,
                start_time: rawData[0].start_time,
                arena_name: rawData[0].arena_name,
                home_team_score: rawData[0].home_team_score,
                away_team_score: rawData[0].away_team_score
              } : null,
              sampleMatches: Array.isArray(rawData) ? rawData.slice(0, 3).map((match: any) => ({
                id: match.id,
                players: `${match.home_team_name} vs ${match.away_team_name}`,
                tournament: match.tournament_name,
                status: match.status_type,
                surface: match.ground_type,
                scores: {
                  home: match.home_team_score,
                  away: match.away_team_score
                },
                date: match.start_time,
                venue: match.arena_name
              })) : []
            }
          },
          analysis: {
            apiEndpoint: 'https://tennis.sportdevs.com/matches',
            realStructure: 'Structure SportDevs confirmée',
            playersField: 'home_team_name / away_team_name',
            tournamentField: 'tournament_name',
            statusField: 'status_type',
            scoresField: 'home_team_score / away_team_score (JSONB)',
            surfaceField: 'ground_type',
            dateField: 'start_time'
          },
          recommendations: [
            '✅ Structure API réelle identifiée',
            '🎾 Champs joueurs: home_team_name / away_team_name',
            '🏆 Tournoi dans: tournament_name',
            '📊 Statut dans: status_type (finished/live/upcoming)',
            '🏟️ Surface dans: ground_type',
            '📅 Filtrage possible avec: status_type=eq.finished'
          ]
        })
        
      } catch (error) {
        return res.status(500).json({
          success: false,
          action: 'debug_api_response',
          error: error.message,
          message: '❌ Erreur lors du debug'
        })
      }
    }

    if (action === 'get_quota_status') {
      // 📊 VÉRIFIER LE QUOTA
      const quotaStatus = tennisSportDevsAPI.getQuotaStatus()
      
      return res.status(200).json({
        success: true,
        action: 'get_quota_status',
        message: '📊 Statut du quota Tennis API',
        quota: quotaStatus,
        recommendation: quotaStatus.percentage > 80 
          ? `⚠️ Quota bientôt épuisé (${quotaStatus.remaining} requêtes restantes)`
          : quotaStatus.percentage > 50
          ? `🔶 Quota à moitié utilisé (${quotaStatus.remaining} requêtes restantes)`
          : `✅ Quota disponible (${quotaStatus.remaining} requêtes restantes)`,
        tips: [
          'Le quota se remet à zéro chaque jour',
          'Import ATP optimisé pour <5 requêtes',
          'Évite les tests répétés pour économiser',
          'Plan SportDevs: 300 requêtes/jour gratuites'
        ]
      })
    }

    return res.status(400).json({
      error: 'Action non supportée',
      availableActions: [
        'test_connection - Tester la connexion API Tennis',
        'import_atp_matches - Import matchs ATP récents (économique)',
        'get_quota_status - Vérifier le quota restant',
        'debug_api_response - Debug de la réponse API brute'
      ],
      examples: {
        test: { action: 'test_connection' },
        import: { action: 'import_atp_matches' },
        quota: { action: 'get_quota_status' },
        debug: { action: 'debug_api_response' }
      },
      note: 'Utilise import_atp_matches pour récupérer ~50 matchs ATP récents'
    })

  } catch (error) {
    console.error('❌ Erreur import tennis:', error)
    
    // Diagnostic d'erreur spécifique tennis
    let errorMessage = 'Erreur inconnue'
    let troubleshooting = []
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion à l\'API Tennis'
        troubleshooting = [
          'Vérifiez votre connexion internet',
          'Vérifiez que RAPIDAPI_KEY est définie dans .env',
          'Vérifiez votre abonnement Tennis Devs sur RapidAPI',
          'L\'API Tennis Devs peut avoir des limitations temporaires'
        ]
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        errorMessage = 'Quota API Tennis dépassé'
        troubleshooting = [
          'Vous avez dépassé vos 300 requêtes quotidiennes',
          'Le quota se remet à zéro à minuit (UTC)',
          'Utilisez get_quota_status pour surveiller l\'usage',
          'Plan gratuit SportDevs: 300 requêtes/jour'
        ]
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Accès refusé à l\'API Tennis'
        troubleshooting = [
          'Vérifiez votre RAPIDAPI_KEY dans .env',
          'Assurez-vous d\'être abonné à Tennis Devs sur RapidAPI',
          'Votre clé API peut être expirée ou invalide',
          'Vérifiez que l\'API Tennis Devs est activée'
        ]
      } else if (error.message.includes('TENNIS') || error.message.includes('sport')) {
        errorMessage = 'Erreur base de données - Sport TENNIS manquant'
        troubleshooting = [
          'Il faut d\'abord ajouter TENNIS à l\'enum Sport dans Prisma',
          'Modifiez prisma/schema.prisma et ajoutez TENNIS',
          'Puis exécutez: npx prisma db push',
          'Redémarrez le serveur après la migration'
        ]
      } else if (error.message.includes('Prisma') || error.message.includes('database')) {
        errorMessage = 'Erreur base de données'
        troubleshooting = [
          'Vérifiez que PostgreSQL est démarré',
          'Vérifiez DATABASE_URL dans .env',
          'Assurez-vous que le sport TENNIS est supporté',
          'Essayez: npx prisma db push'
        ]
      } else {
        errorMessage = error.message
        troubleshooting = [
          'Vérifiez les logs du serveur pour plus de détails',
          'Utilisez test_connection pour diagnostiquer',
          'Vérifiez que tous les champs requis sont présents',
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
        documentation: 'https://docs.sportdevs.com/docs/getting_started_tennis',
        rapidapi: 'https://rapidapi.com/sportdevs-sportdevs-default/api/tennis-devs',
        quota: 'Plan gratuit: 300 requêtes/jour, reset quotidien',
        support: 'Contactez SportDevs: support@sportdevs.com'
      },
      nextSteps: [
        '1. Vérifiez d\'abord que TENNIS est ajouté dans prisma/schema.prisma',
        '2. Utilisez test_connection pour voir si l\'API fonctionne',
        '3. Vérifiez votre quota avec get_quota_status',
        '4. Si quota OK, relancez import_atp_matches'
      ],
      schemaUpdate: {
        required: true,
        file: 'prisma/schema.prisma',
        change: 'Ajoutez TENNIS à l\'enum Sport',
        example: `enum Sport {
  FOOTBALL
  BASKETBALL
  MMA
  RUGBY
  F1
  TENNIS  // 🆕 Ajoutez cette ligne
}`
      },
      apiInfo: {
        name: 'Tennis Devs API',
        provider: 'SportDevs via RapidAPI',
        endpoint: 'tennis-devs.p.rapidapi.com',
        plan: 'Gratuit (300 requêtes/jour)',
        features: [
          'Matchs ATP en temps réel',
          'Scores détaillés par set',
          'Informations tournoi complètes',
          'Classements joueurs',
          'Surfaces et lieux'
        ],
        limitations: [
          '300 requêtes/jour (plan gratuit)',
          'Reset quotidien à minuit UTC',
          'Optimisation requise pour économiser'
        ]
      }
    })
  }
}