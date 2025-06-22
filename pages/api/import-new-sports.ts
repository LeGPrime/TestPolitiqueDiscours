// pages/api/import-new-sports.ts
// Endpoint principal pour importer F1, MMA et Rugby 2024-2025

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { enhancedMultiSportsAPI } from '../../lib/enhanced-multi-sports-api'

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
    console.log(`🚀 Import nouveaux sports: ${action}`)
    
    if (action === 'import_all') {
      // 🌍 IMPORT COMPLET F1 + MMA + Rugby 2024-2025
      console.log('🎯 IMPORT COMPLET NOUVEAUX SPORTS 2024-2025')
      console.log('🏎️ Formule 1 + 🥊 MMA + 🏉 Rugby')
      
      const result = await enhancedMultiSportsAPI.importNewSports2024_2025()
      
      res.status(200).json({
        success: true,
        action: 'import_all_new_sports',
        message: '🎉 IMPORT NOUVEAUX SPORTS TERMINÉ !',
        result,
        summary: {
          total: `${result.total} événements importés`,
          f1: `🏎️ ${result.f1} courses F1 (Grands Prix 2024-2025)`,
          mma: `🥊 ${result.mma} combats MMA (UFC, Bellator...)`,
          rugby: `🏉 ${result.rugby} matchs Rugby (Top 14, Six Nations...)`
        },
        period: '2024-2025',
        note: 'Tous les nouveaux sports sont maintenant disponibles pour notation !'
      })

    } else if (action === 'import_sport' && sport) {
      // Import d'un sport spécifique
      let imported = 0
      let sportName = ''
      let events = []
      
      switch(sport) {
        case 'f1':
          events = await enhancedMultiSportsAPI.importFormula1()
          imported = events.length
          sportName = '🏎️ Formule 1'
          break
        case 'mma':
          events = await enhancedMultiSportsAPI.importMMA()
          imported = events.length
          sportName = '🥊 MMA'
          break
        case 'rugby':
          events = await enhancedMultiSportsAPI.importRugby()
          imported = events.length
          sportName = '🏉 Rugby'
          break
        default:
          return res.status(400).json({ error: 'Sport non supporté' })
      }
      
      // Sauvegarder les événements
      let saved = 0
      for (const event of events) {
        const wasSaved = await enhancedMultiSportsAPI.saveEvent(event)
        if (wasSaved) saved++
      }
      
      res.status(200).json({
        success: true,
        action: 'import_sport',
        sport: sportName,
        imported: saved,
        message: `${sportName} : ${saved} événements importés`,
        period: '2024-2025',
        examples: events.slice(0, 3).map(e => `${e.homeTeam} vs ${e.awayTeam}`)
      })

    } else {
      return res.status(400).json({
        error: 'Action inconnue',
        availableActions: ['import_all', 'import_sport'],
        availableSports: ['f1', 'mma', 'rugby']
      })
    }

  } catch (error) {
    console.error('❌ Erreur import nouveaux sports:', error)
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      action,
      help: 'Vérifie que RAPIDAPI_KEY est configurée dans .env'
    })
  }
}