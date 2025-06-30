// components/NotificationCenter.tsx - Système de notifications complet
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, Users, Star, Trophy, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface Notification {
  id: string
  type: 'friend_request' | 'match_rated' | 'achievement' | 'match_reminder' | 'trending_match'
  title: string
  message: string
  date: Date
  read: boolean
  actionUrl?: string
  actionData?: any
}

interface NotificationCenterProps {
  userId: string
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Charger les notifications
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications()
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/notifications')
      setNotifications(response.data.notifications || generateMockNotifications())
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      // En attendant l'API, utiliser des données de test
      setNotifications(generateMockNotifications())
    } finally {
      setLoading(false)
    }
  }

  // Données de test en attendant l'API
  const generateMockNotifications = (): Notification[] => {
    return [
      {
        id: '1',
        type: 'friend_request',
        title: 'Nouvelle demande d\'ami',
        message: 'Thomas Martin veut être votre ami',
        date: new Date(Date.now() - 1000 * 60 * 30), // 30min ago
        read: false,
        actionUrl: '/friends',
        actionData: { userId: 'thomas123' }
      },
      {
        id: '2', 
        type: 'match_rated',
        title: 'Nouveau avis',
        message: 'Sarah a noté PSG vs Real Madrid 5⭐',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        read: false,
        actionUrl: '/match/psg-real-123'
      },
      {
        id: '3',
        type: 'achievement',
        title: 'Nouveau badge !',
        message: 'Vous avez débloqué "Expert Football" (50 matchs notés)',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        actionUrl: '/profile'
      },
      {
        id: '4',
        type: 'trending_match',
        title: 'Match tendance',
        message: 'Liverpool vs Manchester City devient viral sur Sporating !',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: true,
        actionUrl: '/match/liverpool-city-456'
      },
      {
        id: '5',
        type: 'match_reminder',
        title: 'Match à venir',
        message: 'Barcelone vs Arsenal commence dans 1 heure',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        read: true,
        actionUrl: '/match/barca-arsenal-789'
      }
    ]
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.put(`/api/notifications/${notificationId}`, { read: true })
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      // En attendant l'API, juste mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read')
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    } catch (error) {
      // En attendant l'API
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    } catch (error) {
      // En attendant l'API
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <Users className="w-5 h-5 text-blue-500" />
      case 'match_rated': return <Star className="w-5 h-5 text-yellow-500" />
      case 'achievement': return <Trophy className="w-5 h-5 text-purple-500" />
      case 'match_reminder': return <Calendar className="w-5 h-5 text-green-500" />
      case 'trending_match': return <TrendingUp className="w-5 h-5 text-red-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `${minutes}min`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title={unreadCount > 0 ? `${unreadCount} nouvelle(s) notification(s)` : 'Notifications'}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge avec nombre de notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune notification</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Les notifications apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icône */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-3 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(notification.date)}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {notification.actionUrl && (
                              <Link
                                href={notification.actionUrl}
                                onClick={() => {
                                  markAsRead(notification.id)
                                  setIsOpen(false)
                                }}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 rounded"
                                title="Marquer comme lu"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded"
                              title="Supprimer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Hook pour les notifications en temps réel (optionnel)
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Simuler des notifications en temps réel
    const interval = setInterval(() => {
      const randomNotifications = [
        {
          id: Date.now().toString(),
          type: 'friend_request' as const,
          title: 'Nouvelle demande d\'ami',
          message: 'Alex Martin veut être votre ami',
          date: new Date(),
          read: false
        },
        {
          id: Date.now().toString(),
          type: 'match_rated' as const,
          title: 'Nouveau avis',
          message: 'Julie a noté le match que vous suivez',
          date: new Date(),
          read: false
        }
      ]

      // 20% de chance d'avoir une nouvelle notification toutes les 30s
      if (Math.random() < 0.2) {
        const newNotif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
        setNotifications(prev => [newNotif, ...prev.slice(0, 9)]) // Garder max 10 notifications
        setUnreadCount(prev => prev + 1)
      }
    }, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [userId])

  return { notifications, unreadCount, setNotifications, setUnreadCount }
}