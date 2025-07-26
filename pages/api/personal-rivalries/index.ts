// pages/api/personal-rivalries/index.ts - Version debug avec userId corrigé via DB
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🎯 API rivalités appelée - méthode:', req.method)
  
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      console.log('❌ Pas de session')
      return res.status(401).json({ message: 'Non autorisé' })
    }

    // 🔧 CORRECTION: récupérer le vrai userId depuis la DB avec l'email
    const userEmail = session.user?.email
    if (!userEmail) {
      console.log('❌ Pas d\'email dans la session')
      return res.status(401).json({ message: 'Email non trouvé dans la session' })
    }

    console.log('📧 Email utilisateur:', userEmail)

    // Récupérer l'utilisateur complet depuis la DB
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé en DB avec email:', userEmail)
      return res.status(401).json({ message: 'Utilisateur non trouvé' })
    }

    const userId = user.id
    console.log('✅ UserId récupéré:', userId)
    console.log('👤 Utilisateur:', user.name, '(' + user.email + ')')

    switch (req.method) {
      case 'GET':
        console.log('📖 GET rivalités pour userId:', userId)
        // Pour l'instant, retourner un tableau vide
        return res.status(200).json({ rivalries: [] })
        
      case 'POST':
        console.log('➕ POST nouvelle rivalité')
        console.log('Body reçu:', req.body)
        
        const { friendId, sport, message } = req.body
        
        // Validation basique
        if (!friendId || !sport) {
          console.log('❌ Validation échouée')
          return res.status(400).json({ message: 'friendId et sport sont requis' })
        }
        
        if (friendId === userId) {
          console.log('❌ Tentative rivalité avec soi-même')
          return res.status(400).json({ message: 'Vous ne pouvez pas créer une rivalité avec vous-même' })
        }
        
        // Vérifier que l'ami existe
        const friend = await prisma.user.findUnique({
          where: { id: friendId },
          select: { id: true, name: true, email: true }
        })

        if (!friend) {
          console.log('❌ Ami non trouvé avec ID:', friendId)
          return res.status(404).json({ message: 'Ami non trouvé' })
        }

        console.log('👫 Ami trouvé:', friend.name, '(' + friend.email + ')')
        console.log('✅ Validation OK')
        console.log(`🏆 Création rivalité: ${user.name} vs ${friend.name} en ${sport}`)
        
        // Maintenant on peut tester la vraie création en DB
        try {
          // Vérifier qu'ils sont amis
          const friendship = await prisma.friendship.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: friendId, status: 'ACCEPTED' },
                { receiverId: userId, senderId: friendId, status: 'ACCEPTED' }
              ]
            }
          })

          if (!friendship) {
            console.log('❌ Pas d\'amitié trouvée entre', user.name, 'et', friend.name)
            return res.status(403).json({ message: 'Vous devez être amis pour créer une rivalité' })
          }

          console.log('✅ Amitié confirmée')

          // Vérifier qu'une rivalité n'existe pas déjà
          const existingRivalry = await prisma.personalRivalry.findFirst({
            where: {
              OR: [
                { user1Id: userId, user2Id: friendId, sport },
                { user1Id: friendId, user2Id: userId, sport }
              ]
            }
          })

          if (existingRivalry) {
            console.log('❌ Rivalité déjà existante:', existingRivalry.id)
            return res.status(400).json({ 
              message: `Une rivalité en ${sport} existe déjà avec cet ami`,
              existingRivalry: {
                id: existingRivalry.id,
                status: existingRivalry.status
              }
            })
          }

          // 🎯 CRÉER LA VRAIE RIVALITÉ
          const rivalry = await prisma.personalRivalry.create({
            data: {
              user1Id: userId,
              user2Id: friendId,
              sport,
              message,
              createdBy: userId,
              status: 'PENDING'
            },
            include: {
              user1: {
                select: { id: true, name: true, username: true, image: true }
              },
              user2: {
                select: { id: true, name: true, username: true, image: true }
              }
            }
          })

          console.log('🎉 RIVALITÉ CRÉÉE EN DB:', rivalry.id)

          return res.status(201).json({ 
            message: 'Demande de rivalité envoyée avec succès',
            rivalry: {
              id: rivalry.id,
              sport: rivalry.sport,
              status: rivalry.status,
              friend: {
                id: rivalry.user2.id,
                name: rivalry.user2.name,
                username: rivalry.user2.username,
                image: rivalry.user2.image
              },
              isCreator: true,
              message: rivalry.message,
              createdAt: rivalry.createdAt
            }
          })

        } catch (dbError) {
          console.error('💥 ERREUR DB:', dbError)
          return res.status(500).json({ 
            message: 'Erreur base de données', 
            error: dbError.message 
          })
        }
        
      default:
        return res.status(405).json({ message: 'Méthode non autorisée' })
    }
  } catch (error) {
    console.error('💥 ERREUR SERVEUR:', error)
    return res.status(500).json({ 
      message: 'Erreur serveur debug', 
      error: error.message,
      stack: error.stack
    })
  }
}