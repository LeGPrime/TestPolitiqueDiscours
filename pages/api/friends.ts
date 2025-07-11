import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { notifyFriendRequest } from '../../lib/notifications'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'GET') {
    try {
      const { type = 'friends' } = req.query

      if (type === 'friends') {
        // Récupérer les amis acceptés
        const friendships = await prisma.friendship.findMany({
          where: {
            OR: [
              { senderId: session.user.id, status: 'ACCEPTED' },
              { receiverId: session.user.id, status: 'ACCEPTED' }
            ]
          },
          include: {
            sender: {
              select: { 
                id: true, name: true, username: true, image: true,
                _count: { select: { ratings: true } }
              }
            },
            receiver: {
              select: { 
                id: true, name: true, username: true, image: true,
                _count: { select: { ratings: true } }
              }
            }
          }
        })

        const friends = friendships.map(friendship => {
          const friend = friendship.senderId === session.user.id
            ? friendship.receiver
            : friendship.sender
          
          return {
            ...friend,
            friendshipId: friendship.id,
            friendsSince: friendship.createdAt
          }
        })

        res.status(200).json({ friends })
      } else if (type === 'requests') {
        // Demandes reçues
        const requests = await prisma.friendship.findMany({
          where: {
            receiverId: session.user.id,
            status: 'PENDING'
          },
          include: {
            sender: {
              select: { 
                id: true, name: true, username: true, image: true,
                _count: { select: { ratings: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        res.status(200).json({ requests })
      } else if (type === 'sent') {
        // Demandes envoyées
        const sent = await prisma.friendship.findMany({
          where: {
            senderId: session.user.id,
            status: 'PENDING'
          },
          include: {
            receiver: {
              select: { 
                id: true, name: true, username: true, image: true,
                _count: { select: { ratings: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        res.status(200).json({ sent })
      } else if (type === 'suggestions') {
        // Suggestions d'amis (utilisateurs populaires non amis)
        const currentFriendIds = await prisma.friendship.findMany({
          where: {
            OR: [
              { senderId: session.user.id },
              { receiverId: session.user.id }
            ]
          },
          select: { senderId: true, receiverId: true }
        })

        const excludeIds = new Set([
          session.user.id,
          ...currentFriendIds.flatMap(f => [f.senderId, f.receiverId])
        ])

        const suggestions = await prisma.user.findMany({
          where: {
            id: { notIn: Array.from(excludeIds) }
          },
          select: {
            id: true, name: true, username: true, image: true,
            _count: { select: { ratings: true } }
          },
          orderBy: { ratings: { _count: 'desc' } },
          take: 10
        })

        res.status(200).json({ suggestions })
      }
    } catch (error) {
      console.error('Erreur amis:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else if (req.method === 'POST') {
    try {
      const { action, userId, friendshipId } = req.body

      if (action === 'send_request') {
        // Envoyer demande d'ami
        if (!userId || userId === session.user.id) {
          return res.status(400).json({ error: 'ID utilisateur invalide' })
        }

        // Vérifier qu'une relation n'existe pas déjà
        const existing = await prisma.friendship.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: userId },
              { senderId: userId, receiverId: session.user.id }
            ]
          }
        })

        if (existing) {
          return res.status(400).json({ error: 'Relation d\'amitié déjà existante' })
        }

        const friendship = await prisma.friendship.create({
          data: {
            senderId: session.user.id,
            receiverId: userId,
            status: 'PENDING'
          },
          include: {
            receiver: {
              select: { id: true, name: true, username: true, image: true }
            }
          }
        })

        // 🔔 NOTIFICATION DEMANDE D'AMI
        await notifyFriendRequest(
          session.user.id,
          userId,
          session.user.name || session.user.email || 'Un utilisateur'
        ).catch(error => {
          console.error('❌ Erreur notification demande ami:', error)
        })

        console.log(`✅ Demande d'ami envoyée: ${session.user.name} → ${friendship.receiver.name}`)

        res.status(200).json({ friendship })
      } else if (action === 'accept_request') {
        // Accepter demande
        const friendship = await prisma.friendship.update({
          where: {
            id: friendshipId,
            receiverId: session.user.id,
            status: 'PENDING'
          },
          data: { status: 'ACCEPTED' },
          include: {
            sender: {
              select: { id: true, name: true, username: true, image: true }
            }
          }
        })

        console.log(`✅ Demande d'ami acceptée: ${friendship.sender.name} ↔ ${session.user.name}`)

        res.status(200).json({ friendship })
      } else if (action === 'decline_request') {
        // Refuser demande
        await prisma.friendship.delete({
          where: {
            id: friendshipId,
            receiverId: session.user.id,
            status: 'PENDING'
          }
        })

        console.log(`❌ Demande d'ami refusée par ${session.user.name}`)

        res.status(200).json({ success: true })
      } else if (action === 'remove_friend') {
        // Supprimer ami
        await prisma.friendship.deleteMany({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: userId },
              { senderId: userId, receiverId: session.user.id }
            ],
            status: 'ACCEPTED'
          }
        })

        console.log(`💔 Amitié supprimée: ${session.user.name} ↔ ${userId}`)

        res.status(200).json({ success: true })
      } else if (action === 'cancel_request') {
        // Annuler demande envoyée
        await prisma.friendship.delete({
          where: {
            id: friendshipId,
            senderId: session.user.id,
            status: 'PENDING'
          }
        })

        console.log(`🚫 Demande d'ami annulée par ${session.user.name}`)

        res.status(200).json({ success: true })
      }
    } catch (error) {
      console.error('Erreur action ami:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}