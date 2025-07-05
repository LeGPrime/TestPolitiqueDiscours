// ================================================================
// pages/api/profile/avatar.ts - API pour sauvegarder l'avatar
// ================================================================

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    const { imageData } = req.body

    if (!imageData && imageData !== null) {
      return res.status(400).json({ error: 'Image data required' })
    }

    // Valider le format base64
    if (imageData && !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Format d\'image invalide' })
    }

    // Mettre à jour l'avatar dans la base
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageData }
    })

    console.log('✅ Avatar mis à jour pour:', session.user.id)

    res.status(200).json({ 
      success: true, 
      message: 'Avatar mis à jour avec succès!' 
    })

  } catch (error) {
    console.error('❌ Erreur sauvegarde avatar:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Configuration Next.js pour augmenter la limite de taille
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Limite à 10MB pour les images
    },
  },
}

