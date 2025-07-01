// pages/api/profile/delete-account.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    const { password, confirmText } = req.body

    // Vérifications de sécurité
    if (confirmText !== 'SUPPRIMER MON COMPTE') {
      return res.status(400).json({ 
        error: 'Texte de confirmation incorrect',
        field: 'confirmText'
      })
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ratings: true,
        playerRatings: true,
        sentFriendships: true,
        receivedFriendships: true,
        team_follows: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Vérifier le mot de passe si l'utilisateur en a un (compte local)
    if (user.password) {
      if (!password) {
        return res.status(400).json({ 
          error: 'Mot de passe requis pour confirmer la suppression',
          field: 'password'
        })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(400).json({ 
          error: 'Mot de passe incorrect',
          field: 'password'
        })
      }
    }

    console.log(`🗑️ Suppression du compte utilisateur: ${user.email}`)
    console.log(`📊 Données à supprimer:`)
    console.log(`   - ${user.ratings.length} notes de matchs`)
    console.log(`   - ${user.playerRatings.length} notes de joueurs`)
    console.log(`   - ${user.sentFriendships.length + user.receivedFriendships.length} relations d'amitié`)
    console.log(`   - ${user.team_follows.length} équipes suivies`)

    // Supprimer toutes les données liées dans l'ordre
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les notes de joueurs
      await tx.playerRating.deleteMany({
        where: { userId: session.user.id }
      })

      // 2. Supprimer les notes de matchs  
      await tx.rating.deleteMany({
        where: { userId: session.user.id }
      })

      // 3. Supprimer les relations d'amitié (envoyées et reçues)
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id }
          ]
        }
      })

      // 4. Supprimer les équipes suivies
      await tx.teamFollow.deleteMany({
        where: { user_id: session.user.id }
      })

      // 5. Supprimer les comptes liés (OAuth)
      await tx.account.deleteMany({
        where: { userId: session.user.id }
      })

      // 6. Supprimer les sessions
      await tx.session.deleteMany({
        where: { userId: session.user.id }
      })

      // 7. Finalement, supprimer l'utilisateur
      await tx.user.delete({
        where: { id: session.user.id }
      })
    })

    console.log('✅ Compte supprimé avec succès')

    res.status(200).json({ 
      success: true,
      message: 'Compte supprimé avec succès. Vous allez être déconnecté.'
    })

  } catch (error) {
    console.error('❌ Erreur suppression compte:', error)
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du compte',
      details: error.message
    })
  }
}