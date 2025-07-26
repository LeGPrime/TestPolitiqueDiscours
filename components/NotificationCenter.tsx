// components/NotificationCenter.tsx - Version avec support rivalités
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Bell, X, Check, Users, Star, Trophy, Calendar, Eye, TrendingUp, UserPlus, 
  ExternalLink, Target, Flame, Crown, Swords
} from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_activity' | 'trending_match' | 'team_match' | 
        'rivalry_request' | 'rivalry_accepted' | 'match_added' | 'win_streak' | 'milestone'
  title: string
  message: string
  date: Date
  read: boolean
  actionUrl?: string
  data?: any
}

interface NotificationCenterProps {
  userId: string
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculer la position du dropdown quand on l'ouvre
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [isOpen])

  // Charger le count des notifications non lues au montage
  useEffect(() => {
    fetchUnreadCount()
  }, [])

  // Charger les notifications quand on ouvre le dropdown
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications()
    }
  }, [isOpen])

  // Poll pour les nouvelles notifications toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications?unread_count=true')
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Erreur chargement count notifications:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/notifications?limit=20')
      const notifs = response.data.notifications || []
      
      // Convertir les dates
      const formattedNotifs = notifs.map((notif: any) => ({
        ...notif,
        date: new Date(notif.createdAt)
      }))
      
      setNotifications(formattedNotifs)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      toast.error('Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.put('/api/notifications', { notificationId })
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
      
      // Mettre à jour le count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur marquer comme lu:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', { markAllRead: true })
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
      setUnreadCount(0)
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete('/api/notifications', { 
        data: { notificationId } 
      })
      
      setNotifications(prev => {
        const deletedNotif = prev.find(n => n.id === notificationId)
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount(count => Math.max(0, count - 1))
        }
        return prev.filter(notif => notif.id !== notificationId)
      })
      
      toast.success('Notification supprimée')
    } catch (error) {
      console.error('Erreur suppression notification:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔍 DEBUG: Clic sur notification:', notification)
    console.log('🔍 DEBUG: ActionURL:', notification.actionUrl)
    
    // Marquer comme lu si pas encore lu
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    // Fermer le dropdown
    setIsOpen(false)
    
    // La navigation se fera via le Link
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-5 h-5 text-blue-500" />
      case 'friend_activity': return <Users className="w-5 h-5 text-green-500" />
      case 'trending_match': return <TrendingUp className="w-5 h-5 text-red-500" />
      case 'team_match': return <Calendar className="w-5 h-5 text-purple-500" />
      
      // 🆕 Nouveaux types pour les rivalités
      case 'rivalry_request': return <Swords className="w-5 h-5 text-orange-500" />
      case 'rivalry_accepted': return <Trophy className="w-5 h-5 text-yellow-500" />
      case 'match_added': return <Target className="w-5 h-5 text-green-600" />
      case 'win_streak': return <Flame className="w-5 h-5 text-red-600" />
      case 'milestone': return <Crown className="w-5 h-5 text-purple-600" />
      
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request': return 'border-l-blue-500'
      case 'friend_activity': return 'border-l-green-500'
      case 'trending_match': return 'border-l-red-500'
      case 'team_match': return 'border-l-purple-500'
      
      // 🆕 Couleurs pour les rivalités
      case 'rivalry_request': return 'border-l-orange-500'
      case 'rivalry_accepted': return 'border-l-yellow-500'
      case 'match_added': return 'border-l-green-600'
      case 'win_streak': return 'border-l-red-600'
      case 'milestone': return 'border-l-purple-600'
      
      default: return 'border-l-gray-500'
    }
  }

  return (
    <div className="relative" style={{ position: 'relative' }}>
      {/* Bouton cloche */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
        title={unreadCount > 0 ? `${unreadCount} nouvelle(s) notification(s)` : 'Notifications'}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge avec nombre de notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications avec Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 max-h-96 overflow-hidden"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            zIndex: 9999
          }}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
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
                <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune notification</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">
                  Les notifications apparaîtront ici
                </p>
                
                {/* Bouton "Voir mes notifications" dans l'état vide */}
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <Bell className="w-4 h-4" />
                  <span>Voir mes notifications</span>
                </Link>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.read 
                        ? 'bg-blue-50 dark:bg-blue-900/10' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    } transition-colors`}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Icône */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Rendre tout le contenu cliquable */}
                              {notification.actionUrl ? (
                                <Link
                                  href={notification.actionUrl}
                                  onClick={() => handleNotificationClick(notification)}
                                  className="block hover:bg-gray-50 dark:hover:bg-slate-600/50 rounded-lg p-2 -m-2 transition-colors"
                                >
                                  <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                                    !notification.read ? 'font-semibold' : ''
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center space-x-3 mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTime(notification.date)}
                                    </span>
                                    {!notification.read && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    )}
                                  </div>
                                </Link>
                              ) : (
                                <div>
                                  <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                                    !notification.read ? 'font-semibold' : ''
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center space-x-3 mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTime(notification.date)}
                                    </span>
                                    {!notification.read && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Actions - Simplifiées car le contenu principal est cliquable */}
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  title="Marquer comme lu"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Supprimer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer avec bouton "Voir toutes les notifications" plus visible */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-blue-200 dark:border-blue-800"
              >
                <Bell className="w-4 h-4" />
                <span>Voir toutes mes notifications</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}