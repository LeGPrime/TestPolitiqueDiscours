// pages/api/unified-import.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { unifiedSportsAPI } from '../../lib/unified-sports-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action = 'import_all' } = req.body

  try {
    console.log(`🚀 Import unifié ${action} démarré...`)
    
    if (action === 'import_all') {
      // IMPORT COMPLET DE TOUS LES SPORTS
      console.log('🌍 IMPORT COMPLET : Football + Basketball + Tennis')
      console.log('⏱️  Temps estimé : 10-15 minutes')
      console.log('📊 Données : Real Madrid, Alcaraz, Lakers... TOUT !')
      
      const result = await unifiedSportsAPI.importEverything()
      
      res.status(200).json({
        success: true,
        action: 'import_all',
        message: '🎉 IMPORT COMPLET TERMINÉ !',
        result,
        summary: {
          total: `${result.total} matchs importés`,
          football: `⚽ ${result.football} matchs (Premier League, Liga, Champions League...)`,
          basketball: `🏀 ${result.basketball} matchs (NBA, EuroLeague...)`,
          tennis: `🎾 ${result.tennis} matchs (ATP, WTA, tous les tournois...)`
        },
        examples: {
          football: 'Real Madrid vs Barcelona, Liverpool vs Arsenal...',
          basketball: 'Lakers vs Celtics, Warriors vs Heat...',
          tennis: 'Alcaraz vs Djokovic, Swiatek vs Gauff...'
        },
        period: '2021-2024 (3-4 ans de données)',
        note: 'Tous les matchs du Real, Alcaraz, Lakers etc. sont maintenant disponibles !'
      })

    } else if (action === 'import_football') {
      // Import football uniquement
      const footballCount = await unifiedSportsAPI.importAllFootball()
      
      res.status(200).json({
        success: true,
        action: 'import_football',
        imported: footballCount,
        message: `⚽ ${footballCount} matchs de football importés`,
        competitions: 'Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League',
        period: '2021-2024',
        examples: 'Real Madrid, Barcelona, Arsenal, Liverpool, PSG...'
      })

    } else if (action === 'import_basketball') {
      // Import basketball uniquement
      const basketballCount = await unifiedSportsAPI.importAllBasketball()
      
      res.status(200).json({
        success: true,
        action: 'import_basketball', 
        imported: basketballCount,
        message: `🏀 ${basketballCount} matchs de basketball importés`,
        competitions: 'NBA, EuroLeague',
        period: '2022-2024',
        examples: 'Lakers, Celtics, Warriors, Heat...'
      })

    } else if (action === 'import_tennis') {
      // Import tennis uniquement
      const tennisCount = await unifiedSportsAPI.importAllTennis()
      
      res.status(200).json({
        success: true,
        action: 'import_tennis',
        imported: tennisCount,
        message: `🎾 ${tennisCount} matchs de tennis importés`,
        competitions: 'ATP Tour, WTA Tour, Grand Slams',
        period: '2023-2024',
        examples: 'Alcaraz, Djokovic, Swiatek, Gauff...'
      })

    } else {
      return res.status(400).json({
        error: 'Action inconnue',
        availableActions: ['import_all', 'import_football', 'import_basketball', 'import_tennis']
      })
    }

  } catch (error) {
    console.error('❌ Erreur import unifié:', error)
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      action,
      help: 'Vérifie que RAPIDAPI_KEY est configurée dans .env'
    })
  }
}