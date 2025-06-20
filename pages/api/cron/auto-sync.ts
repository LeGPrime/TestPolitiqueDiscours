// pages/api/cron/auto-sync.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sécurité
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer footrate_secret_key_2024`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('🔄 Auto-sync quotidien démarré...')
    
    // Appeler l'import temps réel
    const importResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/realtime-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'recent' })
    })

    const importData = await importResponse.json()

    if (importData.success) {
      console.log(`✅ Auto-sync réussi: ${importData.saved} nouveaux matchs`)
      
      // Log des nouveaux matchs
      if (importData.examples && importData.examples.length > 0) {
        console.log('🆕 Nouveaux matchs détectés:')
        importData.examples.forEach((match: string) => {
          console.log(`  - ${match}`)
        })
      }

      res.status(200).json({
        success: true,
        message: '🔄 Auto-sync quotidien terminé',
        timestamp: new Date().toISOString(),
        newMatches: importData.saved,
        totalScraped: importData.total,
        sports: importData.stats,
        examples: importData.examples
      })
    } else {
      throw new Error('Import failed')
    }

  } catch (error) {
    console.error('❌ Erreur auto-sync:', error)
    res.status(500).json({
      success: false,
      error: 'Auto-sync failed',
      timestamp: new Date().toISOString()
    })
  }
}