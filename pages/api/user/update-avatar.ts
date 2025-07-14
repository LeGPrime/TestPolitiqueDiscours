// pages/api/user/update-avatar.ts - Version corrigée
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Méthode non autorisée' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Non authentifié' })
    }

    const { image } = req.body

    if (image !== null && typeof image !== 'string') {
      return res.status(400).json({ message: 'Format d\'image invalide' })
    }

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

    // 🔥 CORRECTION 1: Mettre à jour l'utilisateur ET son compte
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image }
    })

    // 🔥 CORRECTION 2: Mettre à jour aussi la table Account si elle existe
    try {
      await prisma.account.updateMany({
        where: { userId: session.user.id },
        data: { 
          // Forcer la mise à jour pour déclencher un refresh de session
          updatedAt: new Date()
        }
      })
    } catch (error) {
      // Ignorer si la table Account n'a pas ce champ
      console.log('Table Account mise à jour optionnelle')
    }

    console.log('✅ Avatar mis à jour:', image)

    // 🔥 CORRECTION 3: Retourner un signal pour forcer le refresh
    res.status(200).json({ 
      message: 'Avatar mis à jour avec succès',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image
      },
      forceSessionRefresh: true // 🆕 Signal pour le frontend
    })

  } catch (error) {
    console.error('❌ Erreur mise à jour avatar:', error)
    res.status(500).json({ message: 'Erreur interne du serveur' })
  }
}