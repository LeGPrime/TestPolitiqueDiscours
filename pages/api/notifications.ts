import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { 
  getUserNotifications, 
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification 
} from '../../lib/notifications'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'GET') {
    try {
      const { limit = '20', unread_count = 'false' } = req.query

      // Si on veut juste le count des non lues
      if (unread_count === 'true') {
        const count = await getUnreadNotificationsCount(session.user.id)
        return res.status(200).json({ unreadCount: count })
      }

      // Récupérer les notifications
      const notifications = await getUserNotifications(
        session.user.id, 
        parseInt(limit as string)
      )

      // Formater les dates pour le frontend
      const formattedNotifications = notifications.map(notif => ({
        ...notif,
        date: notif.createdAt,
        actionUrl: getActionUrlFromNotification(notif)
      }))

      res.status(200).json({ 
        notifications: formattedNotifications,
        total: notifications.length
      })
    } catch (error) {
      console.error('Erreur récupération notifications:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { notificationId, markAllRead } = req.body

      if (markAllRead) {
        // Marquer toutes les notifications comme lues
        await markAllNotificationsAsRead(session.user.id)
        console.log(`✅ Toutes les notifications marquées comme lues pour ${session.user.name}`)
        return res.status(200).json({ success: true, message: 'Toutes les notifications marquées comme lues' })
      } else if (notificationId) {
        // Marquer une notification spécifique comme lue
        const result = await markNotificationAsRead(notificationId, session.user.id)
        if (result) {
          console.log(`✅ Notification ${notificationId} marquée comme lue`)
          return res.status(200).json({ success: true, message: 'Notification marquée comme lue' })
        } else {
          return res.status(404).json({ error: 'Notification non trouvée' })
        }
      } else {
        return res.status(400).json({ error: 'Données invalides' })
      }
    } catch (error) {
      console.error('Erreur mise à jour notification:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { notificationId } = req.body

      if (!notificationId) {
        return res.status(400).json({ error: 'ID notification requis' })
      }

      const result = await deleteNotification(notificationId, session.user.id)
      if (result) {
        console.log(`🗑️ Notification ${notificationId} supprimée`)
        res.status(200).json({ success: true, message: 'Notification supprimée' })
      } else {
        res.status(404).json({ error: 'Notification non trouvée' })
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

// Helper pour générer l'URL d'action en fonction du type de notification
function getActionUrlFromNotification(notification: any) {
  const data = notification.data

  switch (notification.type) {
    case 'friend_request':
      return '/friends'
    
    case 'friend_activity':
      return data?.matchId ? `/match/${data.matchId}` : '/friends'
    
    case 'trending_match':
      return data?.matchId ? `/match/${data.matchId}` : '/'
    
    case 'team_match':
      return data?.matchId ? `/match/${data.matchId}` : '/'
    
    default:
      return '/'
  }
}

// 🏆 NOTIFICATION DEMANDE DE RIVALITÉ
export async function notifyRivalryRequest(
  senderId: string, 
  receiverId: string, 
  senderName: string, 
  sport: string,
  rivalryId: string
) {
  const sportEmojis: Record<string, string> = {
    'tennis': '🎾',
    'football': '⚽',
    'basketball': '🏀',
    'pingpong': '🏓',
    'badminton': '🏸',
    'running': '🏃',
    'swimming': '🏊',
    'cycling': '🚴',
    'golf': '⛳',
    'chess': '♟️',
    'boxing': '🥊',
    'mma': '🥋',
    'other': '🏆'
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

// ✅ NOTIFICATION RIVALITÉ ACCEPTÉE
export async function notifyRivalryAccepted(
  acceptedById: string,
  creatorId: string,
  acceptedByName: string,
  sport: string,
  rivalryId: string
) {
  const sportEmojis: Record<string, string> = {
    'tennis': '🎾',
    'football': '⚽',
    'basketball': '🏀',
    'pingpong': '🏓',
    'badminton': '🏸',
    'running': '🏃',
    'swimming': '🏊',
    'cycling': '🚴',
    'golf': '⛳',
    'chess': '♟️',
    'boxing': '🥊',
    'mma': '🥋',
    'other': '🏆'
  }

  const emoji = sportEmojis[sport] || '🏆'
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1)

  return createNotification({
    userId: creatorId,
    type: 'rivalry_accepted',
    title: 'Rivalité acceptée ! 🎉',
    message: `${acceptedByName} a accepté votre défi en ${sportName} ${emoji}`,
    actionUrl: `/personal-matches?tab=rivalries`,
    data: { acceptedById, acceptedByName, sport, rivalryId, emoji }
  })
}

// 🎯 NOTIFICATION NOUVEAU MATCH AJOUTÉ
export async function notifyMatchAdded(
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
    'tennis': '🎾',
    'football': '⚽',
    'basketball': '🏀',
    'pingpong': '🏓',
    'badminton': '🏸',
    'running': '🏃',
    'swimming': '🏊',
    'cycling': '🚴',
    'golf': '⛳',
    'chess': '♟️',
    'boxing': '🥊',
    'mma': '🥋',
    'other': '🏆'
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
    actionUrl: `/personal-matches?rivalry=${rivalryId}`,
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

// 🔥 NOTIFICATION SÉRIE DE VICTOIRES
export async function notifyWinStreak(
  userId: string,
  opponentId: string,
  winnerName: string,
  sport: string,
  streakCount: number,
  rivalryId: string
) {
  if (streakCount < 3) return // Notifier seulement à partir de 3 victoires consécutives

  const sportEmojis: Record<string, string> = {
    'tennis': '🎾',
    'football': '⚽',
    'basketball': '🏀',
    'pingpong': '🏓',
    'badminton': '🏸',
    'running': '🏃',
    'swimming': '🏊',
    'cycling': '🚴',
    'golf': '⛳',
    'chess': '♟️',
    'boxing': '🥊',
    'mma': '🥋',
    'other': '🏆'
  }

  const emoji = sportEmojis[sport] || '🏆'
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1)
  
  const streakEmoji = streakCount >= 5 ? '🔥🔥🔥' : streakCount >= 4 ? '🔥🔥' : '🔥'

  return createNotification({
    userId: opponentId,
    type: 'win_streak',
    title: `Série de victoires ${streakEmoji}`,
    message: `${winnerName} enchaîne ${streakCount} victoires d'affilée en ${sportName} ${emoji}`,
    actionUrl: `/personal-matches?rivalry=${rivalryId}`,
    data: { 
      winnerId: userId,
      winnerName, 
      sport, 
      streakCount, 
      rivalryId,
      emoji
    }
  })
}

// 🏆 NOTIFICATION MILESTONE (ex: 10e victoire, 50e match)
export async function notifyMilestone(
  userId: string,
  opponentId: string,
  achieverName: string,
  milestoneType: 'matches' | 'wins' | 'rivalry_anniversary',
  milestoneValue: number,
  sport: string,
  rivalryId: string
) {
  const sportEmojis: Record<string, string> = {
    'tennis': '🎾',
    'football': '⚽',
    'basketball': '🏀',
    'pingpong': '🏓',
    'badminton': '🏸',
    'running': '🏃',
    'swimming': '🏊',
    'cycling': '🚴',
    'golf': '⛳',
    'chess': '♟️',
    'boxing': '🥊',
    'mma': '🥋',
    'other': '🏆'
  }

  const emoji = sportEmojis[sport] || '🏆'
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1)

  let title = ''
  let message = ''

  switch (milestoneType) {
    case 'matches':
      title = 'Milestone atteint ! 🎯'
      message = `${milestoneValue}e match de votre rivalité en ${sportName} ${emoji}`
      break
    case 'wins':
      title = 'Milestone de victoires ! 🏆'
      message = `${achieverName} atteint ${milestoneValue} victoires en ${sportName} ${emoji}`
      break
    case 'rivalry_anniversary':
      title = 'Anniversaire de rivalité ! 🎂'
      message = `${milestoneValue} an${milestoneValue > 1 ? 's' : ''} de rivalité en ${sportName} ${emoji}`
      break
  }

  // Notifier les deux participants
  const notifications = [
    createNotification({
      userId: userId,
      type: 'milestone',
      title,
      message,
      actionUrl: `/personal-matches?rivalry=${rivalryId}`,
      data: { 
        milestoneType, 
        milestoneValue, 
        sport, 
        rivalryId,
        emoji,
        achieverName
      }
    }),
    createNotification({
      userId: opponentId,
      type: 'milestone',
      title,
      message,
      actionUrl: `/personal-matches?rivalry=${rivalryId}`,
      data: { 
        milestoneType, 
        milestoneValue, 
        sport, 
        rivalryId,
        emoji,
        achieverName
      }
    })
  ]

  return Promise.all(notifications)
}

// 📊 FONCTION HELPER POUR VÉRIFIER LES MILESTONES
export async function checkAndNotifyMilestones(rivalryId: string, addedById: string) {
  try {
    const rivalry = await prisma.personalRivalry.findUnique({
      where: { id: rivalryId },
      include: {
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
        matches: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!rivalry) return

    const totalMatches = rivalry.matches.length
    const isUser1 = rivalry.user1Id === addedById
    const addedByName = isUser1 ? rivalry.user1.name : rivalry.user2.name
    const opponentId = isUser1 ? rivalry.user2Id : rivalry.user1Id

    // Vérifier milestone de matchs totaux
    const matchMilestones = [10, 25, 50, 100, 200]
    if (matchMilestones.includes(totalMatches)) {
      await notifyMilestone(
        addedById,
        opponentId,
        addedByName || 'Utilisateur',
        'matches',
        totalMatches,
        rivalry.sport,
        rivalryId
      )
    }

    // Calculer les victoires de celui qui a ajouté le match
    let addedByWins = 0
    rivalry.matches.forEach(match => {
      const addedByScore = isUser1 ? match.user1Score : match.user2Score
      const opponentScore = isUser1 ? match.user2Score : match.user1Score
      
      const addedByNumeric = parseInt(addedByScore.match(/\d+/)?.[0] || '0')
      const opponentNumeric = parseInt(opponentScore.match(/\d+/)?.[0] || '0')
      
      if (addedByNumeric > opponentNumeric) {
        addedByWins++
      }
    })

    // Vérifier milestone de victoires
    const winMilestones = [5, 10, 25, 50, 100]
    if (winMilestones.includes(addedByWins)) {
      await notifyMilestone(
        addedById,
        opponentId,
        addedByName || 'Utilisateur',
        'wins',
        addedByWins,
        rivalry.sport,
        rivalryId
      )
    }

    // Vérifier série de victoires
    let currentStreak = 0
    for (const match of rivalry.matches) {
      const addedByScore = isUser1 ? match.user1Score : match.user2Score
      const opponentScore = isUser1 ? match.user2Score : match.user1Score
      
      const addedByNumeric = parseInt(addedByScore.match(/\d+/)?.[0] || '0')
      const opponentNumeric = parseInt(opponentScore.match(/\d+/)?.[0] || '0')
      
      if (addedByNumeric > opponentNumeric) {
        currentStreak++
      } else {
        break
      }
    }

    // Notifier série de victoires
    if (currentStreak >= 3) {
      await notifyWinStreak(
        addedById,
        opponentId,
        addedByName || 'Utilisateur',
        rivalry.sport,
        currentStreak,
        rivalryId
      )
    }

  } catch (error) {
    console.error('❌ Erreur vérification milestones:', error)
  }
}