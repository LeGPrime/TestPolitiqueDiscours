// pages/notifications.tsx - Page dédiée aux notifications avec section du jour
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  Bell, Check, X, Users, Star, TrendingUp, Calendar, UserPlus,
  ArrowLeft, Filter, MoreVertical, Trash2, CheckCheck, Clock, History
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Navbar from '../components/Navbar'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_activity' | 'trending_match' | 'team_match'
  title: string
  message: string
  date: Date
  read: boolean
  actionUrl?: string
  data?: any
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'friends' | 'matches'>('all')
  const [selectedNotifs, setSelectedNotifs] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/notifications?limit=50')
      const notifs = response.data.notifications || []
      
      const formattedNotifs = notifs.map((notif: any) => ({
        ...notif,
        date: new Date(notif.createdAt)
      }))
      
      setNotifications(formattedNotifs)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      toast.error('Erreur lors du chargement')
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
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications', { markAllRead: true })
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete('/api/notifications', { 
        data: { notificationId } 
      })
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      setSelectedNotifs(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
      toast.success('Notification supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const deleteSelectedNotifications = async () => {
    if (selectedNotifs.size === 0) return

    try {
      const promises = Array.from(selectedNotifs).map(id => 
        axios.delete('/api/notifications', { data: { notificationId: id } })
      )
      
      await Promise.all(promises)
      
      setNotifications(prev => prev.filter(notif => !selectedNotifs.has(notif.id)))
      setSelectedNotifs(new Set())
      toast.success(`${selectedNotifs.size} notification(s) supprimée(s)`)
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-6 h-6 text-blue-500" />
      case 'friend_activity': return <Users className="w-6 h-6 text-green-500" />
      case 'trending_match': return <TrendingUp className="w-6 h-6 text-red-500" />
      case 'team_match': return <Calendar className="w-6 h-6 text-purple-500" />
      default: return <Bell className="w-6 h-6 text-gray-500" />
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
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const formatFullTime = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Séparer les notifications par période
  const getNotificationsByPeriod = () => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const todayNotifs = notifications.filter(n => n.date >= startOfToday)
    const olderNotifs = notifications.filter(n => n.date < startOfToday)
    
    return { todayNotifs, olderNotifs }
  }

  const getFilteredNotifications = (notifList: Notification[]) => {
    switch (filter) {
      case 'unread':
        return notifList.filter(n => !n.read)
      case 'friends':
        return notifList.filter(n => n.type === 'friend_request' || n.type === 'friend_activity')
      case 'matches':
        return notifList.filter(n => n.type === 'trending_match' || n.type === 'team_match')
      default:
        return notifList
    }
  }

  const { todayNotifs, olderNotifs } = getNotificationsByPeriod()
  const filteredTodayNotifs = getFilteredNotifications(todayNotifs)
  const filteredOlderNotifs = getFilteredNotifications(olderNotifs)
  const unreadCount = notifications.filter(n => !n.read).length

  // Composant pour afficher une notification
  const NotificationItem = ({ notification, showDate = false }: { notification: Notification, showDate?: boolean }) => (
    <div
      key={notification.id}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md ${
        !notification.read ? 'ring-2 ring-blue-500/20' : ''
      } ${
        selectedNotifs.has(notification.id) ? 'ring-2 ring-purple-500/20 bg-purple-50 dark:bg-purple-900/10' : ''
      }`}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Checkbox */}
          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              checked={selectedNotifs.has(notification.id)}
              onChange={() => toggleSelection(notification.id)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Icône */}
          <div className="flex-shrink-0 pt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                  !notification.read ? 'font-semibold' : ''
                }`}>
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {showDate ? formatFullTime(notification.date) : formatTime(notification.date)}
                  </span>
                  {!notification.read && (
                    <span className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Non lu</span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {notification.actionUrl && (
                  <Link
                    href={notification.actionUrl}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    Voir
                  </Link>
                )}
                
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    title="Marquer comme lu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
  )

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connexion requise
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connectez-vous pour voir vos notifications
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar activeTab="notifications" />
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout lu'}
                  {filteredTodayNotifs.length > 0 && (
                    <span className="ml-2">• {filteredTodayNotifs.length} aujourd'hui</span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {selectedNotifs.size > 0 && (
                <button
                  onClick={deleteSelectedNotifications}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Supprimer ({selectedNotifs.size})</span>
                </button>
              )}
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Tout marquer lu</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtres */}
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {[
              { id: 'all', label: 'Tout', count: notifications.length },
              { id: 'unread', label: 'Non lues', count: unreadCount },
              { id: 'friends', label: 'Amis', count: notifications.filter(n => n.type === 'friend_request' || n.type === 'friend_activity').length },
              { id: 'matches', label: 'Matchs', count: notifications.filter(n => n.type === 'trending_match' || n.type === 'team_match').length }
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === filterOption.id
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{filterOption.label}</span>
                {filterOption.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    filter === filterOption.id
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucune notification
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Les notifications apparaîtront ici quand vous en recevrez
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Notifications d'aujourd'hui */}
            {filteredTodayNotifs.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Aujourd'hui
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({filteredTodayNotifs.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredTodayNotifs.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              </section>
            )}

            {/* Notifications plus anciennes */}
            {filteredOlderNotifs.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <History className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Plus ancien
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({filteredOlderNotifs.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredOlderNotifs.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} showDate />
                  ))}
                </div>
              </section>
            )}

            {/* État vide filtré */}
            {filteredTodayNotifs.length === 0 && filteredOlderNotifs.length === 0 && filter !== 'all' && (
              <div className="text-center py-16">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aucune notification {filter === 'unread' ? 'non lue' : filter}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Changez de filtre pour voir d'autres notifications
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Spacer pour mobile */}
      <div className="h-20 md:hidden"></div>
    </div>
  )
}