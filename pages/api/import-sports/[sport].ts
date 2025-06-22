// pages/api/import-sports/[sport].ts
// Endpoints individuels pour chaque sport

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { enhancedMultiSportsAPI } from '../../../lib/enhanced-multi-sports-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { sport } = req.query

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let events = []
    let sportName = ''
    
    switch(sport) {
      case 'f1':
        console.log('🏎️ Import Formule 1 2024-2025...')
        events = await enhancedMultiSportsAPI.importFormula1()
        sportName = '🏎️ Formule 1'
        break
        
      case 'mma':
        console.log('🥊 Import MMA 2024-2025...')
        events = await enhancedMultiSportsAPI.importMMA()
        sportName = '🥊 MMA'
        break
        
      case 'rugby':
        console.log('🏉 Import Rugby 2024-2025...')
        events = await enhancedMultiSportsAPI.importRugby()
        sportName = '🏉 Rugby'
        break
        
      default:
        return res.status(400).json({ 
          error: 'Sport non supporté',
          availableSports: ['f1', 'mma', 'rugby']
        })
    }
    
    res.status(200).json({
      success: true,
      sport: sportName,
      imported: events.length,
      message: `${sportName} : ${events.length} événements récupérés`,
      period: '2024-2025',
      examples: events.slice(0, 5).map(e => ({
        competition: e.competition,
        event: `${e.homeTeam} vs ${e.awayTeam}`,
        date: e.date,
        venue: e.venue
      }))
    })

  } catch (error) {
    console.error(`❌ Erreur import ${sport}:`, error)
    res.status(500).json({
      success: false,
      error: `Import ${sport} failed`,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}