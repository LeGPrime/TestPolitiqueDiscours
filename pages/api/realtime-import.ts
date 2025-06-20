// pages/api/realtime-import.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { realTimeScraper } from '../../lib/sports-scraper-advanced'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type = 'recent' } = req.body

  try {
    console.log(`🚀 Import ${type} en cours...`)
    
    let result

    if (type === 'historical') {
      // Import des 2 dernières années
      console.log('📅 Import historique (2 ans) démarré...')
      result = await realTimeScraper.importHistoricalMatches()
      
      res.status(200).json({
        success: true,
        type: 'historical',
        message: `📅 Import historique terminé !`,
        total: result.total,
        saved: result.saved,
        period: '2 dernières années',
        sports: ['football', 'basketball', 'tennis']
      })

    } else {
      // Import récent (derniers matchs)
      console.log('🔄 Import temps réel des derniers matchs...')
      const matches = await realTimeScraper.scrapeAllRecentMatches()
      const saved = await realTimeScraper.saveMatchesToDB(matches)
      
      // Stats par sport
      const stats = {
        tennis: matches.filter(m => m.sport === 'tennis').length,
        football: matches.filter(m => m.sport === 'football').length,
        basketball: matches.filter(m => m.sport === 'basketball').length
      }

      res.status(200).json({
        success: true,
        type: 'recent',
        message: `🔄 Import temps réel terminé !`,
        total: matches.length,
        saved,
        stats,
        examples: matches.slice(0, 3).map(m => 
          `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} (${m.competition})`
        )
      })
    }

  } catch (error) {
    console.error('❌ Erreur import temps réel:', error)
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      type
    })
  }
}