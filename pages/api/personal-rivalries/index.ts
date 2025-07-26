// pages/api/personal-rivalries/index.ts - VERSION COMPLÈTE FONCTIONNELLE
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

// Import des fonctions de notification pour les rivalités
async function createNotification(data: any) {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
        read: false
      }
    })
  } catch (error) {
    console.error('❌ Erreur création notification:', error)
    return null
  }
}

async function notifyRivalryRequest(senderId: string, receiverId: string, senderName: string, sport: string, rivalryId: string) {
  const sportEmojis: Record<string, string> = {
    'tennis': '🎾', 'football': '⚽', 'basketball': '🏀', 'pingpong': '🏓',
    'badminton': '🏸', 'running': '🏃', 'swimming': '🏊', 'cycling': '🚴',
    'golf': '⛳', 'chess': '♟️', 'boxing': '🥊', 'mma': '🥋', 'other': '🏆'
  }

  const emoji = sportEmojis[sport] || '🏆'
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1)

  return createNotification({
    userId: receiverId,
    type: 'rivalry_request',
    title: 'Nouvelle demande de rivalité',
    message: `${senderName} vous défie en ${sportName} ${emoji}`,
    actionUrl: `/personal-matches?tab=requests`,
    data: { senderId, senderName, sport, rivalryId, emoji }
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🎯 API rivalités appelée - méthode:', req.method, 'query:', req.query)
  
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      console.log('❌ Pas de session')
      return res.status(401).json({ message: 'Non autorisé' })
    }

    // Récupérer l'utilisateur complet depuis la DB
    const userEmail = session.user?.email
    if (!userEmail) {
      console.log('❌ Pas d\'email dans la session')
      return res.status(401).json({ message: 'Email non trouvé dans la session' })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé en DB avec email:', userEmail)
      return res.status(401).json({ message: 'Utilisateur non trouvé' })
    }

    const userId = user.id
    console.log('✅ UserId récupéré:', userId, '- Utilisateur:', user.name)

    switch (req.method) {
      case 'GET':
        const { type } = req.query
        console.log('📖 GET rivalités - type:', type)

        if (type === 'requests') {
          // 📥 DEMANDES REÇUES
          const receivedRequests = await prisma.personalRivalry.findMany({
            where: {
              user2Id: userId, // L'utilisateur actuel est le destinataire
              status: 'PENDING'
            },
            include: {
              user1: {
                select: { id: true, name: true, username: true, image: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })

          console.log(`📥 ${receivedRequests.length} demandes reçues trouvées`)

          const formattedRequests = receivedRequests.map(rivalry => ({
            id: rivalry.id,
            sport: rivalry.sport,
            friend: {
              id: rivalry.user1.id,
              name: rivalry.user1.name,
              username: rivalry.user1.username,
              image: rivalry.user1.image,
              email: rivalry.user1.email
            },
            message: rivalry.message,
            createdAt: rivalry.createdAt.toISOString()
          }))

          return res.status(200).json({ rivalries: formattedRequests })

        } else if (type === 'sent') {
          // 📤 DEMANDES ENVOYÉES
          const sentRequests = await prisma.personalRivalry.findMany({
            where: {
              user1Id: userId, // L'utilisateur actuel est l'expéditeur
              status: 'PENDING'
            },
            include: {
              user2: {
                select: { id: true, name: true, username: true, image: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })

          console.log(`📤 ${sentRequests.length} demandes envoyées trouvées`)

          const formattedSent = sentRequests.map(rivalry => ({
            id: rivalry.id,
            sport: rivalry.sport,
            friend: {
              id: rivalry.user2.id,
              name: rivalry.user2.name,
              username: rivalry.user2.username,
              image: rivalry.user2.image,
              email: rivalry.user2.email
            },
            message: rivalry.message,
            createdAt: rivalry.createdAt.toISOString(),
            isSent: true
          }))

          return res.status(200).json({ rivalries: formattedSent })

        } else {
          // 🏆 RIVALITÉS ACTIVES
          const activeRivalries = await prisma.personalRivalry.findMany({
            where: {
              OR: [
                { user1Id: userId, status: 'ACTIVE' },
                { user2Id: userId, status: 'ACTIVE' }
              ]
            },
            include: {
              user1: {
                select: { id: true, name: true, username: true, image: true, email: true }
              },
              user2: {
                select: { id: true, name: true, username: true, image: true, email: true }
              },
              matches: {
                orderBy: { date: 'desc' },
                take: 5 // Les 5 derniers matchs
              }
            },
            orderBy: { updatedAt: 'desc' }
          })

          console.log(`🏆 ${activeRivalries.length} rivalités actives trouvées`)

          // Formater les rivalités avec statistiques
          const formattedRivalries = activeRivalries.map(rivalry => {
            const isUser1 = rivalry.user1Id === userId
            const friend = isUser1 ? rivalry.user2 : rivalry.user1
            
            // Calculer les stats
            let myWins = 0, myLosses = 0, draws = 0
            
            rivalry.matches.forEach(match => {
              const myScore = isUser1 ? match.user1Score : match.user2Score
              const friendScore = isUser1 ? match.user2Score : match.user1Score
              
              // Extraire les scores numériques (format libre mais on essaie)
              const myNumeric = parseInt(myScore.match(/\d+/)?.[0] || '0')
              const friendNumeric = parseInt(friendScore.match(/\d+/)?.[0] || '0')
              
              if (myNumeric > friendNumeric) myWins++
              else if (friendNumeric > myNumeric) myLosses++
              else draws++
            })

            // Calculer la série actuelle
            let currentStreak = 0
            let streakType: 'wins' | 'losses' | 'none' = 'none'
            
            if (rivalry.matches.length > 0) {
              const lastResult = rivalry.matches[0] // Le plus récent
              const myLastScore = isUser1 ? lastResult.user1Score : lastResult.user2Score
              const friendLastScore = isUser1 ? lastResult.user2Score : lastResult.user1Score
              
              const myLastNumeric = parseInt(myLastScore.match(/\d+/)?.[0] || '0')
              const friendLastNumeric = parseInt(friendLastScore.match(/\d+/)?.[0] || '0')
              
              if (myLastNumeric > friendLastNumeric) {
                streakType = 'wins'
                // Compter les victoires consécutives
                for (const match of rivalry.matches) {
                  const myScore = isUser1 ? match.user1Score : match.user2Score
                  const friendScore = isUser1 ? match.user2Score : match.user1Score
                  const myNum = parseInt(myScore.match(/\d+/)?.[0] || '0')
                  const friendNum = parseInt(friendScore.match(/\d+/)?.[0] || '0')
                  
                  if (myNum > friendNum) currentStreak++
                  else break
                }
              } else if (friendLastNumeric > myLastNumeric) {
                streakType = 'losses'
                // Compter les défaites consécutives
                for (const match of rivalry.matches) {
                  const myScore = isUser1 ? match.user1Score : match.user2Score
                  const friendScore = isUser1 ? match.user2Score : match.user1Score
                  const myNum = parseInt(myScore.match(/\d+/)?.[0] || '0')
                  const friendNum = parseInt(friendScore.match(/\d+/)?.[0] || '0')
                  
                  if (friendNum > myNum) currentStreak++
                  else break
                }
              }
            }

            return {
              id: rivalry.id,
              sport: rivalry.sport,
              status: rivalry.status,
              createdAt: rivalry.createdAt.toISOString(),
              friend: {
                id: friend.id,
                name: friend.name,
                username: friend.username,
                image: friend.image,
                email: friend.email
              },
              myStats: {
                wins: myWins,
                losses: myLosses,
                totalMatches: rivalry.matches.length,
                currentStreak,
                streakType
              },
              friendStats: {
                wins: myLosses, // Les défaites de l'utilisateur = victoires de l'ami
                losses: myWins,
                totalMatches: rivalry.matches.length
              },
              recentMatches: rivalry.matches.map(match => ({
                id: match.id,
                date: match.date.toISOString(),
                myScore: isUser1 ? match.user1Score : match.user2Score,
                friendScore: isUser1 ? match.user2Score : match.user1Score,
                location: match.location,
                comment: match.comment,
                addedBy: match.addedBy,
                winner: (() => {
                  const myScore = isUser1 ? match.user1Score : match.user2Score
                  const friendScore = isUser1 ? match.user2Score : match.user1Score
                  const myNum = parseInt(myScore.match(/\d+/)?.[0] || '0')
                  const friendNum = parseInt(friendScore.match(/\d+/)?.[0] || '0')
                  
                  if (myNum > friendNum) return 'me'
                  if (friendNum > myNum) return 'friend'
                  return 'draw'
                })()
              }))
            }
          })

          return res.status(200).json({ rivalries: formattedRivalries })
        }
        
      case 'POST':
        console.log('➕ POST nouvelle rivalité')
        console.log('Body reçu:', req.body)
        
        const { friendId, sport, message } = req.body
        
        // Validation
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

        // 🎯 CRÉER LA RIVALITÉ
        const rivalry = await prisma.personalRivalry.create({
          data: {
            user1Id: userId,    // Créateur
            user2Id: friendId,  // Destinataire
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

        // 🔔 ENVOYER LA NOTIFICATION
        try {
          await notifyRivalryRequest(
            userId,
            friendId,
            user.name || 'Un ami',
            sport,
            rivalry.id
          )
          console.log('✅ Notification envoyée à', friend.name)
        } catch (error) {
          console.error('❌ Erreur notification:', error)
          // On continue même si la notification échoue
        }

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

      case 'PUT':
        // 🎯 ACCEPTER/REFUSER UNE DEMANDE DE RIVALITÉ
        console.log('✅ PUT - Accepter/Refuser rivalité')
        const { rivalryId, action } = req.body

        if (!rivalryId || !action) {
          return res.status(400).json({ message: 'rivalryId et action sont requis' })
        }

        const targetRivalry = await prisma.personalRivalry.findFirst({
          where: {
            id: rivalryId,
            user2Id: userId, // Seulement le destinataire peut accepter/refuser
            status: 'PENDING'
          },
          include: {
            user1: { select: { id: true, name: true } }
          }
        })

        if (!targetRivalry) {
          return res.status(404).json({ message: 'Demande de rivalité non trouvée' })
        }

        if (action === 'accept') {
          // Accepter la rivalité
          const updatedRivalry = await prisma.personalRivalry.update({
            where: { id: rivalryId },
            data: { status: 'ACTIVE' }
          })

          // TODO: Envoyer notification d'acceptation au créateur
          console.log(`✅ Rivalité acceptée par ${user.name}`)

          return res.status(200).json({ 
            message: 'Rivalité acceptée !',
            rivalry: updatedRivalry
          })

        } else if (action === 'decline') {
          // Refuser et supprimer la rivalité
          await prisma.personalRivalry.delete({
            where: { id: rivalryId }
          })

          console.log(`❌ Rivalité refusée par ${user.name}`)

          return res.status(200).json({ message: 'Rivalité refusée' })

        } else {
          return res.status(400).json({ message: 'Action invalide' })
        }
        
      default:
        return res.status(405).json({ message: 'Méthode non autorisée' })
    }
  } catch (error) {
    console.error('💥 ERREUR SERVEUR:', error)
    return res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message
    })
  }
}