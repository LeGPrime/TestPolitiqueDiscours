// pages/api/profile/delete-account.ts - Version améliorée
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      error: 'Méthode non autorisée',
      field: 'method'
    })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ 
        error: 'Non connecté',
        field: 'auth'
      })
    }

    const { password, confirmText } = req.body

    // Validation stricte du texte de confirmation
    if (confirmText !== 'SUPPRIMER MON COMPTE') {
      return res.status(400).json({ 
        error: 'Vous devez taper exactement "SUPPRIMER MON COMPTE"',
        field: 'confirmText'
      })
    }

    // Récupérer l'utilisateur avec toutes ses relations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ratings: true,
        playerRatings: true,
        sentFriendships: true,
        receivedFriendships: true,
        team_follows: true,
        accounts: true,
        sessions: true,
        // Nouvelles relations pour les reviews
        reviewLikes: true,
        reviewReplies: true,
        replyLikes: true,
        notifications: true
      }
    })

    if (!user) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        field: 'user'
      })
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

    console.log(`🗑️ Début suppression du compte utilisateur: ${user.email}`)
    console.log(`📊 Données à supprimer:`)
    console.log(`   - ${user.ratings.length} notes de matchs`)
    console.log(`   - ${user.playerRatings.length} notes de joueurs`)
    console.log(`   - ${user.sentFriendships.length + user.receivedFriendships.length} relations d'amitié`)
    console.log(`   - ${user.team_follows.length} équipes suivies`)
    console.log(`   - ${user.reviewLikes.length} likes de reviews`)
    console.log(`   - ${user.reviewReplies.length} réponses aux reviews`)
    console.log(`   - ${user.replyLikes.length} likes de réponses`)
    console.log(`   - ${user.notifications.length} notifications`)

    // Supprimer toutes les données liées dans l'ordre correct
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les likes de réponses
      await tx.replyLike.deleteMany({
        where: { userId: session.user.id }
      })

      // 2. Supprimer les réponses aux reviews (les likes seront supprimés en cascade)
      const replyIds = user.reviewReplies.map(reply => reply.id)
      if (replyIds.length > 0) {
        await tx.replyLike.deleteMany({
          where: { replyId: { in: replyIds } }
        })
        await tx.reviewReply.deleteMany({
          where: { userId: session.user.id }
        })
      }

      // 3. Supprimer les likes de reviews
      await tx.reviewLike.deleteMany({
        where: { userId: session.user.id }
      })

      // 4. Supprimer les likes et réponses sur les reviews de l'utilisateur
      const userReviewIds = user.ratings.map(rating => rating.id)
      if (userReviewIds.length > 0) {
        await tx.replyLike.deleteMany({
          where: { 
            reply: {
              reviewId: { in: userReviewIds }
            }
          }
        })
        await tx.reviewReply.deleteMany({
          where: { reviewId: { in: userReviewIds } }
        })
        await tx.reviewLike.deleteMany({
          where: { reviewId: { in: userReviewIds } }
        })
      }

      // 5. Supprimer les notifications
      await tx.notification.deleteMany({
        where: { userId: session.user.id }
      })

      // 6. Supprimer les notes de joueurs
      await tx.playerRating.deleteMany({
        where: { userId: session.user.id }
      })

      // 7. Supprimer les notes de matchs  
      await tx.rating.deleteMany({
        where: { userId: session.user.id }
      })

      // 8. Supprimer les relations d'amitié (envoyées et reçues)
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id }
          ]
        }
      })

      // 9. Supprimer les équipes suivies
      await tx.teamFollow.deleteMany({
        where: { user_id: session.user.id }
      })

      // 10. Supprimer les comptes liés (OAuth)
      await tx.account.deleteMany({
        where: { userId: session.user.id }
      })

      // 11. Supprimer les sessions
      await tx.session.deleteMany({
        where: { userId: session.user.id }
      })

      // 12. Finalement, supprimer l'utilisateur
      await tx.user.delete({
        where: { id: session.user.id }
      })
    })

    console.log('✅ Compte et toutes les données associées supprimés avec succès')

    res.status(200).json({ 
      success: true,
      message: 'Compte supprimé avec succès. Vous allez être déconnecté.',
      deletedData: {
        ratings: user.ratings.length,
        playerRatings: user.playerRatings.length,
        friendships: user.sentFriendships.length + user.receivedFriendships.length,
        teams: user.team_follows.length,
        reviewInteractions: user.reviewLikes.length + user.reviewReplies.length + user.replyLikes.length,
        notifications: user.notifications.length
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur suppression compte:', error)
    
    // Gestion d'erreurs spécifiques
    if (error.code === 'P2003') {
      return res.status(500).json({ 
        error: 'Impossible de supprimer le compte : contraintes de base de données',
        details: 'Certaines données sont encore liées à votre compte',
        field: 'database'
      })
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé ou déjà supprimé',
        field: 'user'
      })
    }

    res.status(500).json({ 
      error: 'Erreur interne lors de la suppression du compte',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Contactez le support',
      field: 'server'
    })
  }
}