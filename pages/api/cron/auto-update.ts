// pages/api/cron/auto-update.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { unifiedSportsAPI } from '../../../lib/unified-sports-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔐 Sécurité - Vérifier le secret
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Auto-update multi-sports démarré...')
    console.log(`🕐 ${new Date().toISOString()}`)
    
    // 📊 Import des événements terminés des dernières 24h
    const result = await unifiedSportsAPI.importRecentFinished()
    
    // 📝 Log détaillé
    console.log(`✅ Auto-update terminé:`)
    console.log(`  📊 ${result.imported} nouveaux événements`)
    console.log(`  🏆 Sports: ${result.sports.join(', ')}`)
    
    // 🎯 Réponse structurée
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      imported: result.imported,
      sports: result.sports,
      message: `🔄 Auto-update réussi: ${result.imported} nouveaux événements`,
      details: {
        period: 'Dernières 24 heures',
        nextUpdate: 'Dans 2 heures',
        sportsChecked: ['football', 'basketball', 'mma', 'rugby', 'f1']
      }
    })

  } catch (error) {
    console.error('❌ Erreur auto-update:', error)
    
    res.status(500).json({
      success: false,
      error: 'Auto-update failed',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}