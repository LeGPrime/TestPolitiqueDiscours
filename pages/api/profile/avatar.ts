// pages/api/profile/avatar.ts - API corrigée pour gérer les avatars prédéfinis
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

// Pour l'instant, on définit les constantes ici en attendant que le fichier avatar-constants.ts soit créé
const VALID_PRESET_AVATARS = [
  // Sports
  'avatar_sport_1', 'avatar_sport_2', 'avatar_sport_3', 'avatar_sport_4', 'avatar_sport_5', 'avatar_sport_6',
  // Trophées
  'avatar_trophy_1', 'avatar_trophy_2', 'avatar_trophy_3', 'avatar_trophy_4', 'avatar_trophy_5', 'avatar_trophy_6',
  // Animaux
  'avatar_animal_1', 'avatar_animal_2', 'avatar_animal_3', 'avatar_animal_4', 'avatar_animal_5', 'avatar_animal_6',
  // Expressions
  'avatar_face_1', 'avatar_face_2', 'avatar_face_3', 'avatar_face_4', 'avatar_face_5', 'avatar_face_6'
]

const isValidPresetAvatar = (id: string) => {
  return VALID_PRESET_AVATARS.includes(id)
}

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

    // Validation selon le type d'avatar
    let validatedImageData = imageData

    if (imageData === null) {
      // Suppression de l'avatar - OK
      validatedImageData = null
      console.log(`✅ Suppression d'avatar pour utilisateur: ${session.user.id}`)
    } else if (isValidPresetAvatar(imageData)) {
      // Avatar prédéfini - OK, on garde l'ID tel quel
      validatedImageData = imageData
      console.log(`✅ Avatar prédéfini sélectionné: ${imageData} pour utilisateur: ${session.user.id}`)
    } else if (imageData.startsWith('data:image/')) {
      // Image uploadée en base64 - valider le format
      const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/
      if (!base64Pattern.test(imageData)) {
        return res.status(400).json({ error: 'Format d\'image invalide' })
      }
      
      // Vérifier la taille approximative (base64 = ~1.33x la taille originale)
      const base64Size = imageData.length * 0.75 // Approximation
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (base64Size > maxSize) {
        return res.status(400).json({ error: 'Image trop volumineuse (max 5MB)' })
      }
      
      validatedImageData = imageData
      console.log(`✅ Image personnalisée uploadée (taille: ~${Math.round(base64Size / 1024)}KB) pour utilisateur: ${session.user.id}`)
    } else {
      console.error(`❌ Type d'avatar non reconnu: ${typeof imageData} - ${imageData?.substring(0, 50)}...`)
      return res.status(400).json({ 
        error: 'Type d\'avatar non reconnu',
        receivedType: typeof imageData,
        validPresetIds: VALID_PRESET_AVATARS.slice(0, 5) // Afficher quelques exemples
      })
    }

    // Mettre à jour l'avatar dans la base
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: validatedImageData }
    })

    console.log(`✅ Avatar mis à jour en base pour utilisateur: ${session.user.id}`)

    // Message de succès personnalisé
    const successMessage = validatedImageData === null 
      ? 'Avatar supprimé avec succès!' 
      : isValidPresetAvatar(validatedImageData)
        ? 'Avatar prédéfini sélectionné avec succès!'
        : 'Photo d\'avatar uploadée avec succès!'

    res.status(200).json({ 
      success: true, 
      message: successMessage,
      avatarType: validatedImageData === null 
        ? 'default'
        : isValidPresetAvatar(validatedImageData)
          ? 'preset'
          : 'upload',
      debugInfo: {
        received: typeof imageData,
        validated: typeof validatedImageData,
        isPreset: isValidPresetAvatar(validatedImageData || ''),
        userId: session.user.id
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur sauvegarde avatar:', error)
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    })
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