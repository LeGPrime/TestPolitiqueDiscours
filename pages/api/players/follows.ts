// pages/api/players/follows.ts - Version de test ultra simplifiée
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🐛 API players/follows appelée!', req.method, req.body)
  
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    console.log('🐛 Pas de session')
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'GET') {
    console.log('🐛 GET players/follows')
    // Pour l'instant, retourne une liste vide
    return res.status(200).json({ players: [] })
    
  } else if (req.method === 'POST') {
    console.log('🐛 POST players/follows', req.body)
    
    const { action, playerData } = req.body

    if (!playerData) {
      console.log('🐛 Pas de playerData')
      return res.status(400).json({ error: 'Données joueur manquantes' })
    }

    // Pour l'instant, on fait semblant que ça marche
    console.log('🐛 Action:', action, 'Player:', playerData.name)
    
    // TODO: Implémenter la vraie logique de base de données
    return res.status(200).json({ 
      success: true, 
      message: `Joueur ${playerData.name} ${action === 'follow' ? 'suivi' : 'non suivi'}` 
    })
    
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}