// lib/notifications.ts - Système de notifications centralisé
import { prisma } from './prisma'

export interface NotificationData {
  userId: string
  type: 'friend_request' | 'friend_activity' | 'trending_match' | 'team_match'
  title: string
  message: string
  actionUrl?: string
  data?: any
}

// 🔔 CRÉER UNE NOTIFICATION
export async function createNotification({
  userId,
  type,
  title,
  message,
  actionUrl,
  data
}: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        read: false
      }
    })

    console.log(`✅ Notification créée pour ${userId}: ${title}`)
    return notification
  } catch (error) {
    console.error('❌ Erreur création notification:', error)
    return null
  }
}

// 🎯 NOTIFICATION DEMANDE D'AMI (FACILE)
export async function notifyFriendRequest(senderId: string, receiverId: string, senderName: string) {
  return createNotification({
    userId: receiverId,
    type: 'friend_request',
    title: 'Nouvelle demande d\'ami',
    message: `${senderName} veut être votre ami`,
    actionUrl: '/friends',
    data: { senderId, senderName }
  })
}

// ⭐ NOTIFICATION ACTIVITÉ AMI (MOYEN)
export async function notifyFriendActivity(userId: string, friendName: string, matchName: string, rating: number, matchId: string, hasComment: boolean = false) {
  try {
    // Récupérer tous les amis de l'utilisateur actif
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    })

    // Notifier chaque ami
    for (const friendship of friendships) {
      const friendId = friendship.senderId === userId 
        ? friendship.receiverId 
        : friendship.senderId

      const action = hasComment ? 'a commenté' : 'a noté'
      const ratingText = hasComment ? `(${rating}⭐)` : `${rating}⭐`

      await createNotification({
        userId: friendId,
        type: 'friend_activity',
        title: 'Activité d\'un ami',
        message: `${friendName} ${action} ${matchName} ${ratingText}`,
        actionUrl: `/match/${matchId}`,
        data: { friendId: userId, friendName, matchName, rating, matchId, hasComment }
      })
    }

    console.log(`👥 ${friendships.length} amis notifiés pour l'activité de ${friendName}`)
  } catch (error) {
    console.error('❌ Erreur notification ami:', error)
  }
}

// 🔥 NOTIFICATION MATCH POPULAIRE (MOYEN-DIFFICILE)
export async function checkAndNotifyTrendingMatch(matchId: string) {
  try {
    // Récupérer les stats du match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        totalRatings: true,
        createdAt: true,
        date: true,
        competition: true
      }
    })

    if (!match) return

    const matchName = `${match.homeTeam} vs ${match.awayTeam}`
    const ratingsCount = match.totalRatings

    // 🎯 LOGIQUE TRENDING : 
    // - Minimum 15 notes pour être trending
    // - Match récent (moins de 7 jours depuis sa date de création dans la DB)
    // - Pas déjà notifié pour ce match (éviter spam)
    const isRecent = (Date.now() - new Date(match.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    const isTrending = ratingsCount >= 15 && isRecent

    if (!isTrending) return

    // Vérifier qu'on n'a pas déjà notifié pour ce match
    const existingNotif = await prisma.notification.findFirst({
      where: {
        type: 'trending_match',
        data: {
          contains: `"matchId":"${matchId}"`
        }
      }
    })

    if (existingNotif) return // Déjà notifié

    // Notifier tous les utilisateurs actifs récents (pas tous pour éviter le spam)
    const activeUsers = await prisma.user.findMany({
      where: {
        ratings: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Actifs dans les 14 derniers jours
            }
          }
        }
      },
      select: { id: true },
      take: 50 // Limiter à 50 utilisateurs max
    })

    const notificationPromises = activeUsers.map(user => 
      createNotification({
        userId: user.id,
        type: 'trending_match',
        title: 'Match tendance 🔥',
        message: `${matchName} devient viral ! (${ratingsCount} avis)`,
        actionUrl: `/match/${matchId}`,
        data: { matchId, matchName, ratingsCount, competition: match.competition }
      })
    )

    await Promise.all(notificationPromises)
    console.log(`🔥 Match trending notifié: ${matchName} (${ratingsCount} notes) → ${activeUsers.length} utilisateurs`)
  } catch (error) {
    console.error('❌ Erreur notification trending:', error)
  }
}

// 🏟️ NOTIFICATION MATCH ÉQUIPE SUIVIE (DIFFICILE)
export async function notifyTeamMatchAdded(match: any) {
  try {
    console.log(`🏟️ Vérification notifications équipes pour: ${match.homeTeam} vs ${match.awayTeam}`)

    // Rechercher les utilisateurs qui suivent l'équipe à domicile
    const homeTeamFollows = await prisma.$queryRaw`
      SELECT DISTINCT tf.user_id, u.name as user_name, t.name as team_name
      FROM team_follows tf
      JOIN teams t ON tf.team_id = t.id  
      JOIN users u ON tf.user_id = u.id
      WHERE LOWER(t.name) LIKE LOWER(${`%${match.homeTeam}%`})
         OR LOWER(${match.homeTeam.toLowerCase()}) LIKE LOWER(CONCAT('%', t.name, '%'))
    ` as any[]

    // Rechercher les utilisateurs qui suivent l'équipe à l'extérieur
    const awayTeamFollows = await prisma.$queryRaw`
      SELECT DISTINCT tf.user_id, u.name as user_name, t.name as team_name  
      FROM team_follows tf
      JOIN teams t ON tf.team_id = t.id
      JOIN users u ON tf.user_id = u.id  
      WHERE LOWER(t.name) LIKE LOWER(${`%${match.awayTeam}%`})
         OR LOWER(${match.awayTeam.toLowerCase()}) LIKE LOWER(CONCAT('%', t.name, '%'))
    ` as any[]

    const allFollows = [...homeTeamFollows, ...awayTeamFollows]
    const uniqueUsers = new Map()

    // Dédupliquer les utilisateurs
    allFollows.forEach(follow => {
      if (!uniqueUsers.has(follow.user_id)) {
        uniqueUsers.set(follow.user_id, {
          userId: follow.user_id,
          userName: follow.user_name,
          teamName: follow.team_name
        })
      }
    })

    // Notifier chaque utilisateur
    const notificationPromises = Array.from(uniqueUsers.values()).map(userData => 
      createNotification({
        userId: userData.userId,
        type: 'team_match',
        title: `Nouveau match de ${userData.teamName} !`,
        message: `${match.homeTeam} vs ${match.awayTeam} - ${new Date(match.date).toLocaleDateString('fr-FR')}`,
        actionUrl: `/match/${match.id}`,
        data: { 
          matchId: match.id, 
          homeTeam: match.homeTeam, 
          awayTeam: match.awayTeam,
          followedTeam: userData.teamName,
          competition: match.competition
        }
      })
    )

    await Promise.all(notificationPromises)
    console.log(`🏟️ ${uniqueUsers.size} utilisateurs notifiés pour ${match.homeTeam} vs ${match.awayTeam}`)
  } catch (error) {
    console.error('❌ Erreur notification équipe:', error)
  }
}

// 📱 HELPERS POUR L'API
export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Parser les données JSON
    return notifications.map(notif => ({
      ...notif,
      data: notif.data ? JSON.parse(notif.data as string) : null
    }))
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error)
    return []
  }
}

export async function getUnreadNotificationsCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: { userId, read: false }
    })
  } catch (error) {
    console.error('❌ Erreur count notifications:', error)
    return 0
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    return await prisma.notification.update({
      where: { 
        id: notificationId,
        userId // Sécurité : only owner can mark as read
      },
      data: { read: true }
    })
  } catch (error) {
    console.error('❌ Erreur mark as read:', error)
    return null
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })
  } catch (error) {
    console.error('❌ Erreur mark all as read:', error)
    return null
  }
}

export async function deleteNotification(notificationId: string, userId: string) {
  try {
    return await prisma.notification.delete({
      where: { 
        id: notificationId,
        userId // Sécurité : only owner can delete
      }
    })
  } catch (error) {
    console.error('❌ Erreur delete notification:', error)
    return null
  }
}