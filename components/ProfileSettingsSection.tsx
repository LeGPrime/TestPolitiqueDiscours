// components/ProfileSettingsSection.tsx - Section paramètres pour le profil
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  BellOff, 
  Shield, 
  LogOut, 
  Globe, 
  Eye, 
  EyeOff,
  Smartphone,
  Monitor,
  Palette,
  ChevronRight,
  User,
  Mail,
  Download,
  Trash2,
  HelpCircle,
  MessageSquare,
  Star
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../lib/theme-context'

interface ProfileSettingsSectionProps {
  userEmail: string
  onDeleteAccount: () => void
  userHasPassword: boolean
}

export default function ProfileSettingsSection({ 
  userEmail, 
  onDeleteAccount, 
  userHasPassword 
}: ProfileSettingsSectionProps) {
  const { data: session } = useSession()
  const { theme } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false)

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      signOut({ callbackUrl: '/' })
    }
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
          rightText: 'Hebdomadaire'
        }
      ]
    },
    {
      title: 'Confidentialité',
      icon: Shield,
      items: [
        {
          icon: showPrivacyOptions ? Eye : EyeOff,
          label: 'Visibilité du profil',
          description: 'Contrôler qui peut voir votre profil',
          action: 'privacy-settings',
          rightText: 'Public'
        },
        {
          icon: User,
          label: 'Données personnelles',
          description: 'Gérer vos informations personnelles',
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
        window.location.href = `mailto:support@sporating.com?subject=Support Sporating&body=Bonjour,\n\nUtilisateur: ${userEmail}\n\n`
        break
      case 'rate-app':
        // Détecter la plateforme et rediriger vers le bon store
        const userAgent = navigator.userAgent
        if (/iPad|iPhone|iPod/.test(userAgent)) {
          window.open('https://apps.apple.com/app/sporating/id123456789', '_blank')
        } else if (/Android/.test(userAgent)) {
          window.open('https://play.google.com/store/apps/details?id=com.sporating.app', '_blank')
        } else {
          alert('Merci de nous noter sur votre store d\'applications mobile !')
        }
        break
      case 'help-center':
        window.open('https://help.sporating.com', '_blank')
        break
      case 'export-data':
        if (confirm('Voulez-vous télécharger toutes vos données ? Cela peut prendre quelques minutes.')) {
          // TODO: Implémenter l'export de données
          alert('Export en cours... Vous recevrez un email avec vos données.')
        }
        break
      case 'privacy-settings':
        setShowPrivacyOptions(!showPrivacyOptions)
        break
      case 'personal-data':
        // Ouvrir modal de gestion des données personnelles
        alert('Fonctionnalité en cours de développement')
        break
      case 'email-notifications':
        // Ouvrir modal de configuration email
        alert('Configuration des emails en cours de développement')
        break
      default:
        console.log('Action non gérée:', action)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header de la section */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Personnalisez votre expérience</p>
        </div>
      </div>

      {/* Sections de paramètres */}
      {settingsSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Header de section */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center space-x-2">
              <section.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">{section.title}</h3>
            </div>
          </div>

          {/* Items de la section */}
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
                    {/* Toggle switch */}
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

                    {/* Custom component (comme ThemeToggle) */}
                    {item.component && item.component}

                    {/* Texte à droite */}
                    {item.rightText && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.rightText}
                      </span>
                    )}

                    {/* Bouton d'action */}
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
          {/* Déconnexion */}
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

          {/* Suppression de compte */}
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
  )
}