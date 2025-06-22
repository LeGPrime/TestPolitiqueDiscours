// pages/api/cron/daily-import.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { multiSportsAPI } from '../../../lib/multi-sports-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sécurité - Vérifier le secret CRON
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📅 IMPORT QUOTIDIEN AUTOMATIQUE DÉMARRÉ')
    console.log(`🗓️ Date: ${new Date().toISOString().split('T')[0]}`)
    
    const startTime = Date.now()
    
    // Import des matchs d'aujourd'hui seulement
    const result = await multiSportsAPI.importTodaysMatches()
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    // Log détaillé
    console.log(`\n✅ IMPORT QUOTIDIEN TERMINÉ en ${duration}s`)
    console.log(`📊 Résultats:`)
    console.log(`  - Total trouvé: ${result.total} matchs`)
    console.log(`  - Nouveaux ajoutés: ${result.saved} matchs`)
    
    Object.entries(result.breakdown).forEach(([sport, count]) => {
      console.log(`  - ${sport}: ${count} nouveaux matchs`)
    })

    // Réponse API
    res.status(200).json({
      success: true,
      message: '📅 Import quotidien terminé avec succès',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      duration: `${duration}s`,
      stats: {
        totalFound: result.total,
        newMatches: result.saved,
        breakdown: result.breakdown
      },
      nextRun: 'Demain à la même heure'
    })

  } catch (error) {
    console.error('❌ Erreur import quotidien:', error)
    
    res.status(500).json({
      success: false,
      error: 'Import quotidien échoué',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    })
  }
}