// pages/api/personal-matches/index.ts - API pour ajouter des matchs
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

// Import des fonctions de notification
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

async function notifyMatchAdded(
  addedById: string,
  receiverId: string,
  addedByName: string,
  sport: string,
  myScore: string,
  friendScore: string,
  rivalryId: string,
  matchId: string
) {
  const sportEmojis: Record<string, string> = {
    'tennis': '🎾', 'football': '⚽', 'basketball': '🏀', 'pingpong': '🏓',
    'badminton': '🏸', 'running': '🏃', 'swimming': '🏊', 'cycling': '🚴',
    'golf': '⛳', 'chess': '♟️', 'boxing': '🥊', 'mma': '🥋', 'other': '🏆'
  }

  const emoji = sportEmojis[sport] || '🏆'
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1)
  
  // Déterminer qui a gagné pour le message
  const addedByScore = parseInt(myScore.match(/\d+/)?.[0] || '0')
  const receiverScore = parseInt(friendScore.match(/\d+/)?.[0] || '0')
  
  let resultMessage = ''
  if (addedByScore > receiverScore) {
    resultMessage = `${addedByName} gagne ${myScore}-${friendScore}`
  } else if (receiverScore > addedByScore) {
    resultMessage = `Vous gagnez ${friendScore}-${myScore} !`
  } else {
    resultMessage = `Match nul ${myScore}-${friendScore}`
  }

  return createNotification({
    userId: receiverId,
    type: 'match_added',
    title: `Nouveau match ${emoji}`,
    message: `${sportName}: ${resultMessage}`,
    actionUrl: `/personal-matches?tab=rivalries`,
    data: { 
      addedById, 
      addedByName, 
      sport, 
      myScore, 
      friendScore, 
      rivalryId, 
      matchId,
      emoji,
      result: addedByScore > receiverScore ? 'loss' : receiverScore > addedByScore ? 'win' : 'draw'
    }
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🎯 API personal-matches appelée - méthode:', req.method)
  
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

    if (req.method === 'POST') {
      console.log('➕ POST nouveau match')
      console.log('Body reçu:', req.body)
      
      const { rivalryId, myScore, friendScore, date, location, comment } = req.body
      
      // Validation
      if (!rivalryId || !myScore || !friendScore || !date) {
        console.log('❌ Validation échouée')
        return res.status(400).json({ message: 'rivalryId, myScore, friendScore et date sont requis' })
      }
      
      // Vérifier que la rivalité existe et que l'utilisateur en fait partie
      const rivalry = await prisma.personalRivalry.findFirst({
        where: {
          id: rivalryId,
          status: 'ACTIVE',
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        include: {
          user1: { select: { id: true, name: true } },
          user2: { select: { id: true, name: true } }
        }
      })

      if (!rivalry) {
        console.log('❌ Rivalité non trouvée ou utilisateur non autorisé')
        return res.status(404).json({ message: 'Rivalité non trouvée ou vous n\'êtes pas autorisé' })
      }

      console.log('✅ Rivalité trouvée:', rivalry.id)

      // Déterminer qui est user1 et user2 pour ce match
      const isUser1 = rivalry.user1Id === userId
      const friendId = isUser1 ? rivalry.user2Id : rivalry.user1Id
      const friendName = isUser1 ? rivalry.user2.name : rivalry.user1.name

      // Créer le match dans la DB
      const match = await prisma.personalRivalryMatch.create({
        data: {
          rivalryId: rivalryId,
          user1Score: isUser1 ? myScore : friendScore,
          user2Score: isUser1 ? friendScore : myScore,
          date: new Date(date),
          location: location || null,
          comment: comment || null,
          addedBy: userId
        }
      })

      console.log('🎉 MATCH CRÉÉ EN DB:', match.id)

      // Envoyer notification au friend
      try {
        await notifyMatchAdded(
          userId,
          friendId,
          user.name || 'Un ami',
          rivalry.sport,
          myScore,
          friendScore,
          rivalryId,
          match.id
        )
        console.log('✅ Notification envoyée à', friendName)
      } catch (error) {
        console.error('❌ Erreur notification:', error)
        // On continue même si la notification échoue
      }

      return res.status(201).json({ 
        message: 'Match ajouté avec succès',
        match: {
          id: match.id,
          myScore,
          friendScore,
          date: match.date,
          location: match.location,
          comment: match.comment,
          addedBy: userId,
          rivalryId
        }
      })
      
    } else {
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