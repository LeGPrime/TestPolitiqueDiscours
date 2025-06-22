// pages/api/import-all-sports.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { unifiedSportsAPI } from '../../lib/unified-sports-api'

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
    console.log(`🚀 Import multi-sports ${action} démarré...`)
    
    if (action === 'import_all') {
      // 🌍 IMPORT COMPLET DE TOUS LES SPORTS
      console.log('🏆 IMPORT COMPLET : Football + Basketball + MMA + Rugby + F1')
      console.log('📅 Données 2024-2025 avec détails complets')
      console.log('⏱️  Temps estimé : 20-30 minutes')
      
      const result = await unifiedSportsAPI.importEverything()
      
      res.status(200).json({
        success: true,
        action: 'import_all',
        message: '🎉 IMPORT COMPLET TERMINÉ !',
        result,
        summary: {
          total: `${result.total} événements importés`,
          football: `⚽ ${result.football} matchs (Premier League, Liga, Champions League...)`,
          basketball: `🏀 ${result.basketball} matchs (NBA, EuroLeague...)`,
          mma: `🥊 ${result.mma} combats (UFC, Bellator...)`,
          rugby: `🏉 ${result.rugby} matchs (Six Nations, Top 14...)`,
          f1: `🏎️ ${result.f1} courses (Formule 1 complète)`
        },
        examples: {
          football: 'Real Madrid vs Barcelona, Liverpool vs Arsenal...',
          basketball: 'Lakers vs Celtics, Warriors vs Heat...',
          mma: 'UFC fights avec méthodes et rounds...',
          rugby: 'Six Nations avec essais et cartons...',
          f1: 'GP Monaco, Silverstone avec podiums...'
        },
        period: '2024-2025 (2 ans de données)',
        note: 'Tous les événements avec détails complets disponibles pour notation !'
      })

    } else if (action === 'import_sport' && sport) {
      // Import d'un sport spécifique
      let imported = 0
      let sportName = ''
      
      switch(sport) {
        case 'football':
          imported = await unifiedSportsAPI.importAllFootball()
          sportName = '⚽ Football'
          break
        case 'basketball':
          imported = await unifiedSportsAPI.importAllBasketball()
          sportName = '🏀 Basketball'
          break
        case 'mma':
          imported = await unifiedSportsAPI.importAllMMA()
          sportName = '🥊 MMA'
          break
        case 'rugby':
          imported = await unifiedSportsAPI.importAllRugby()
          sportName = '🏉 Rugby'
          break
        case 'f1':
          imported = await unifiedSportsAPI.importAllF1()
          sportName = '🏎️ F1'
          break
        default:
          return res.status(400).json({ error: 'Sport non supporté' })
      }
      
      res.status(200).json({
        success: true,
        action: 'import_sport',
        sport: sportName,
        imported,
        message: `${sportName} : ${imported} événements importés`,
        period: '2024-2025'
      })

    } else if (action === 'import_recent') {
      // Import automatique des dernières 24h
      console.log('🔄 Import automatique des dernières 24h...')
      
      const result = await unifiedSportsAPI.importRecentFinished()
      
      res.status(200).json({
        success: true,
        action: 'import_recent',
        imported: result.imported,
        sports: result.sports,
        message: `🔄 ${result.imported} nouveaux événements des dernières 24h`,
        period: 'Dernières 24 heures'
      })

    } else {
      return res.status(400).json({
        error: 'Action inconnue',
        availableActions: ['import_all', 'import_sport', 'import_recent']
      })
    }

  } catch (error) {
    console.error('❌ Erreur import multi-sports:', error)
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      action,
      help: 'Vérifie que RAPIDAPI_KEY est configurée dans .env'
    })
  }
}