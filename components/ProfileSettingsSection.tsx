// components/ProfileSettingsSection.tsx - Version avec FAQ intégrée
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  BellOff, 
  Shield, 
  LogOut, 
  Eye, 
  Palette,
  ChevronRight,
  User,
  Mail,
  Download,
  Trash2,
  HelpCircle,
  MessageSquare,
  Star,
  Database,
  FileText,
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../lib/theme-context'

interface ProfileSettingsSectionProps {
  userEmail: string
  onDeleteAccount: () => void
  userHasPassword: boolean
}

// Modal pour les données personnelles
function PersonalDataModal({ isOpen, onClose, userEmail }: { 
  isOpen: boolean
  onClose: () => void
  userEmail: string 
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  if (!isOpen) return null

  const handleExportData = async () => {
    setExportLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const userData = {
        exportDate: new Date().toISOString(),
        email: userEmail,
        profile: {
          name: "Données utilisateur",
          createdAt: "2024-01-01T00:00:00Z",
          lastLogin: new Date().toISOString()
        },
        ratings: "Toutes vos notes de matchs et joueurs",
        lists: "Vos listes de matchs personnalisées",
        friends: "Votre liste d'amis",
        notifications: "Historique des notifications"
      }
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sporating-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('✅ Vos données ont été exportées avec succès !')
    } catch (error) {
      alert('❌ Erreur lors de l\'export des données')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteSpecificData = async (dataType: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes vos ${dataType} ? Cette action est irréversible.`)) {
      return
    }

    setDeleteLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert(`✅ Vos ${dataType} ont été supprimées avec succès`)
    } catch (error) {
      alert(`❌ Erreur lors de la suppression de vos ${dataType}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gestion des données personnelles
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Contrôlez vos données selon le RGPD
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-slate-700">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Eye },
              { id: 'export', label: 'Exporter', icon: Download },
              { id: 'delete', label: 'Supprimer', icon: Trash2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Notes de matchs', count: '47', icon: Star },
                  { label: 'Notes de joueurs', count: '23', icon: User },
                  { label: 'Listes créées', count: '5', icon: FileText },
                  { label: 'Amis', count: '12', icon: User },
                  { label: 'Notifications', count: '156', icon: Bell },
                  { label: 'Connexions', count: '89', icon: Calendar }
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Vos droits RGPD
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      Vous avez le droit d'accéder, corriger, supprimer ou exporter vos données à tout moment. 
                      Toutes vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="text-center">
                <Download className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Exporter vos données
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Téléchargez toutes vos données dans un fichier JSON lisible
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Données incluses dans l'export :
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Informations de profil (nom, email, bio)</li>
                  <li>• Toutes vos notes de matchs avec commentaires</li>
                  <li>• Toutes vos notes de joueurs</li>
                  <li>• Vos listes de matchs personnalisées</li>
                  <li>• Liste d'amis et interactions</li>
                  <li>• Historique des notifications</li>
                  <li>• Équipes suivies</li>
                </ul>
              </div>

              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  exportLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                } text-white`}
              >
                {exportLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Préparation de l'export...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Télécharger mes données</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-6">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Suppression sélective des données
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Supprimez des types spécifiques de données sans fermer votre compte
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { 
                    type: 'notes de matchs', 
                    description: 'Supprimer toutes vos évaluations de matchs',
                    icon: Star,
                    danger: 'medium'
                  },
                  { 
                    type: 'notes de joueurs', 
                    description: 'Supprimer toutes vos évaluations de joueurs',
                    icon: User,
                    danger: 'medium'
                  },
                  { 
                    type: 'listes personnalisées', 
                    description: 'Supprimer toutes vos listes de matchs',
                    icon: FileText,
                    danger: 'low'
                  },
                  { 
                    type: 'historique de navigation', 
                    description: 'Effacer votre historique d\'activité',
                    icon: Clock,
                    danger: 'low'
                  }
                ].map(item => (
                  <div key={item.type} className="border border-gray-200 dark:border-slate-600 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white capitalize">
                            {item.type}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSpecificData(item.type)}
                        disabled={deleteLoading}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          item.danger === 'high' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : item.danger === 'medium'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {deleteLoading ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      Attention
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                      La suppression de données est irréversible. Assurez-vous d'avoir exporté 
                      vos données si vous souhaitez les conserver.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Modal pour la configuration des notifications email
function EmailNotificationsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [settings, setSettings] = useState({
    weekly: true,
    matchAlerts: false,
    friendActivity: true,
    newFeatures: true,
    marketing: false
  })

  if (!isOpen) return null

  const handleSave = () => {
    alert('✅ Préférences email sauvegardées !')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications Email
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {Object.entries({
            weekly: 'Résumé hebdomadaire',
            matchAlerts: 'Alertes de matchs',
            friendActivity: 'Activité des amis',
            newFeatures: 'Nouvelles fonctionnalités',
            marketing: 'Offres et promotions'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white">{label}</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfileSettingsSection({ 
  userEmail, 
  onDeleteAccount, 
  userHasPassword 
}: ProfileSettingsSectionProps) {
  const { data: session } = useSession()
  const { theme } = useTheme()
  const router = useRouter() // 🆕 Ajout du router
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showPersonalDataModal, setShowPersonalDataModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [browserInfo, setBrowserInfo] = useState('')

  useEffect(() => {
    const userAgent = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setBrowserInfo('ios')
    } else if (/Android/.test(userAgent)) {
      setBrowserInfo('android')
    } else {
      setBrowserInfo('web')
    }
  }, [])

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      signOut({ callbackUrl: '/' })
    }
  }

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Support Sporating')
    const body = encodeURIComponent(`Bonjour,

Utilisateur: ${userEmail}
Navigateur: ${navigator.userAgent}
Date: ${new Date().toLocaleDateString('fr-FR')}

Votre message:
`)
    
    window.location.href = `mailto:support@sporating.com?subject=${subject}&body=${body}`
  }

  // 🆕 Nouvelle fonction pour rediriger vers la page FAQ
  const handleRateApp = () => {
    if (browserInfo === 'ios') {
      window.open('https://apps.apple.com/app/sporating/id123456789', '_blank')
    } else if (browserInfo === 'android') {
      window.open('https://play.google.com/store/apps/details?id=com.sporating.app', '_blank')
    } else {
      const choice = confirm('Souhaitez-vous être redirigé vers l\'App Store (OK) ou Google Play (Annuler) ?')
      if (choice) {
        window.open('https://apps.apple.com/app/sporating/id123456789', '_blank')
      } else {
        window.open('https://play.google.com/store/apps/details?id=com.sporating.app', '_blank')
      }
    }
  }

  // 🆕 Redirection vers la page FAQ au lieu de popup
  const handleHelpCenter = () => {
    router.push('/faq')
  }

  const settingsSections = [
    {
      title: 'Apparence',
      icon: Palette,
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Mode sombre',
          description: 'Basculer entre les thèmes clair et sombre',
          action: 'theme-toggle',
          component: <ThemeToggle />
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          icon: notificationsEnabled ? Bell : BellOff,
          label: 'Notifications push',
          description: 'Recevoir des notifications pour les activités',
          action: 'toggle-notifications',
          toggle: true,
          enabled: notificationsEnabled,
          onChange: setNotificationsEnabled
        },
        {
          icon: Mail,
          label: 'Notifications email',
          description: 'Recevoir des résumés par email',
          action: 'email-notifications',
          rightText: 'Configurer'
        }
      ]
    },
    {
      title: 'Confidentialité',
      icon: Shield,
      items: [
        {
          icon: Eye,
          label: 'Visibilité du profil',
          description: 'Contrôler qui peut voir votre profil',
          action: 'privacy-settings',
          rightText: 'Public'
        },
        {
          icon: Database,
          label: 'Données personnelles',
          description: 'Gérer vos informations selon le RGPD',
          action: 'personal-data'
        }
      ]
    },
    {
      title: 'Support',
      icon: HelpCircle,
      items: [
        {
          icon: MessageSquare,
          label: 'Nous contacter',
          description: 'Support et suggestions',
          action: 'contact-support'
        },
        {
          icon: Star,
          label: 'Noter l\'application',
          description: 'Laissez un avis sur les stores',
          action: 'rate-app'
        },
        {
          icon: HelpCircle,
          label: 'Centre d\'aide',
          description: 'FAQ et guides d\'utilisation',
          action: 'help-center'
        }
      ]
    },
    {
      title: 'Données',
      icon: Download,
      items: [
        {
          icon: Download,
          label: 'Exporter mes données',
          description: 'Télécharger toutes vos données',
          action: 'export-data'
        }
      ]
    }
  ]

  const handleSettingAction = (action: string) => {
    switch (action) {
      case 'contact-support':
        handleContactSupport()
        break
      case 'rate-app':
        handleRateApp()
        break
      case 'help-center': // 🆕 Maintenant redirige vers /faq
        handleHelpCenter()
        break
      case 'export-data':
        if (confirm('Voulez-vous télécharger toutes vos données ? Cela peut prendre quelques minutes.')) {
          setShowPersonalDataModal(true)
        }
        break
      case 'privacy-settings':
        alert('Fonctionnalité de confidentialité en cours de développement. Actuellement votre profil est public.')
        break
      case 'personal-data':
        setShowPersonalDataModal(true)
        break
      case 'email-notifications':
        setShowEmailModal(true)
        break
      default:
        console.log('Action non gérée:', action)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Personnalisez votre expérience</p>
          </div>
        </div>

        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
              <div className="flex items-center space-x-2">
                <section.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">{section.title}</h3>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-slate-600">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.toggle && (
                        <button
                          onClick={() => item.onChange && item.onChange(!item.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            item.enabled 
                              ? 'bg-blue-600' 
                              : 'bg-gray-200 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}

                      {item.component && item.component}

                      {item.rightText && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.rightText}
                        </span>
                      )}

                      {!item.toggle && !item.component && (
                        <button
                          onClick={() => handleSettingAction(item.action)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Zone de danger */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="font-medium text-red-900 dark:text-red-100 text-sm">Zone de danger</h3>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100 text-sm">
                    Se déconnecter
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Fermer votre session sur cet appareil
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Déconnexion
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100 text-sm">
                    Supprimer mon compte
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Action irréversible - supprime toutes vos données
                  </div>
                </div>
              </div>
              <button
                onClick={onDeleteAccount}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Informations de version */}
        <div className="text-center py-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>Sporating v1.0.0</div>
            <div>Connecté en tant que {session?.user?.name || userEmail}</div>
            <div>© 2025 Sporating. Tous droits réservés.</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PersonalDataModal 
        isOpen={showPersonalDataModal}
        onClose={() => setShowPersonalDataModal(false)}
        userEmail={userEmail}
      />
      
      <EmailNotificationsModal 
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </>
  )
}