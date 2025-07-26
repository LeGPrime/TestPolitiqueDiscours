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

