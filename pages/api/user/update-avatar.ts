// pages/api/user/update-avatar.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Méthode non autorisée' })
  }

  try {
    // Vérifier l'authentification
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Non authentifié' })
    }

    const { image } = req.body

    // Validation basique
    if (image !== null && typeof image !== 'string') {
      return res.status(400).json({ message: 'Format d\'image invalide' })
    }

    // Si c'est un avatar prédéfini, valider l'ID
    if (image && !image.startsWith('data:') && !image.startsWith('http')) {
      const validAvatarIds = [
        'avatar_sport_1', 'avatar_sport_2', 'avatar_sport_3', 'avatar_sport_4', 'avatar_sport_5', 'avatar_sport_6',
        'avatar_trophy_1', 'avatar_trophy_2', 'avatar_trophy_3', 'avatar_trophy_4', 'avatar_trophy_5', 'avatar_trophy_6',
        'avatar_animal_1', 'avatar_animal_2', 'avatar_animal_3', 'avatar_animal_4', 'avatar_animal_5', 'avatar_animal_6',
        'avatar_face_1', 'avatar_face_2', 'avatar_face_3', 'avatar_face_4', 'avatar_face_5', 'avatar_face_6'
      ]
      
      if (!validAvatarIds.includes(image)) {
        return res.status(400).json({ message: 'ID d\'avatar prédéfini invalide' })
      }
    }

    // Mettre à jour l'utilisateur dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true
      }
    })

    console.log('✅ Avatar mis à jour en DB pour:', session.user.email, '| Nouvel avatar:', image)

    res.status(200).json({ 
      message: 'Avatar mis à jour avec succès',
      user: updatedUser
    })

  } catch (error) {
    console.error('❌ Erreur mise à jour avatar:', error)
    res.status(500).json({ message: 'Erreur interne du serveur' })
  }
}