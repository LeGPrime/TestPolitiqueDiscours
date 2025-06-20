import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sécurité basique
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer footrate_secret_key_2024`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('📅 Import quotidien automatique démarré...')
    
    // Appeler notre API d'import
    const importResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auto-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const importData = await importResponse.json()

    if (importData.success) {
      console.log(`✅ Import quotidien réussi: ${importData.imported} matchs`)
      
      res.status(200).json({
        success: true,
        message: '📅 Import quotidien terminé',
        data: importData
      })
    } else {
      throw new Error('Import failed')
    }

  } catch (error) {
    console.error('❌ Erreur import quotidien:', error)
    res.status(500).json({
      success: false,
      error: 'Daily import failed'
    })
  }
}