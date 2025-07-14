import { useState } from 'react'
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Star,
  Users,
  List,
  Camera,
  Settings,
  Shield,
  Mail,
  HelpCircle,
  MessageSquare,
  PlayCircle,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Download,
  Trash2,
  FileText,
  Calendar,
  Clock,
  User,
  Bell,
  Target,
  Share2,
  Trophy,
  Zap,
  Heart,
  TrendingUp
} from 'lucide-react'

// Types pour les FAQ
interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  difficulty: 'facile' | 'moyen' | 'avancé'
}

interface FAQCategory {
  id: string
  name: string
  icon: any
  description: string
  color: string
}

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  // Catégories des FAQ
  const categories: FAQCategory[] = [
    {
      id: 'all',
      name: 'Toutes les questions',
      icon: BookOpen,
      description: 'Voir toutes les FAQ',
      color: 'blue'
    },
    {
      id: 'getting-started',
      name: 'Premiers pas',
      icon: PlayCircle,
      description: 'Comment commencer sur Sporating',
      color: 'green'
    },
    {
      id: 'rating',
      name: 'Notation',
      icon: Star,
      description: 'Noter des matchs et joueurs',
      color: 'yellow'
    },
    {
      id: 'social',
      name: 'Social',
      icon: Users,
      description: 'Amis et interactions',
      color: 'purple'
    },
    {
      id: 'lists',
      name: 'Listes',
      icon: List,
      description: 'Créer et gérer vos listes',
      color: 'pink'
    },
    {
      id: 'profile',
      name: 'Profil',
      icon: Camera,
      description: 'Personnaliser votre profil',
      color: 'indigo'
    },
    {
      id: 'technical',
      name: 'Technique',
      icon: Settings,
      description: 'Problèmes et solutions',
      color: 'gray'
    },
    {
      id: 'privacy',
      name: 'Confidentialité',
      icon: Shield,
      description: 'Vie privée et sécurité',
      color: 'red'
    }
  ]

  // Base de données des FAQ améliorée
  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Qu\'est-ce que Sporating exactement ?',
      answer: `Sporating est votre œil sur le sport - une plateforme communautaire où vous pouvez :

✨ Noter les événements sportifs que vous regardez
🎯 Partager vos avis avec d'autres passionnés  
🏆 Découvrir les meilleures performances grâce aux classements communautaires
🤝 Connecter avec des fans qui partagent vos goûts sportifs

Notre mission est simple : donner la parole aux vrais fans pour évaluer le spectacle sportif !`,
      category: 'getting-started',
      tags: ['sporating', 'plateforme', 'communauté', 'sport'],
      difficulty: 'facile'
    },
    {
      id: '2',
      question: 'Quels sports sont disponibles sur Sporating ?',
      answer: `Sporating couvre 5 sports majeurs avec des fonctionnalités spécialisées :

⚽ Football
Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Champions League, International, MLS et Saudi League

🏀 Basketball  
NBA, EuroLeague, FIBA et Betclic Elite

🥊 MMA
UFC

🏉 Rugby
Six Nations, Top 14, Champions Cup et World Rugby

🏎️ Formule 1
Tous les Grands Prix et pilotes

Chaque sport a ses propres classements spécialisés comme le Ballon d'Or des Fans pour le football !`,
      category: 'getting-started',
      tags: ['sports', 'football', 'basketball', 'mma', 'rugby', 'f1'],
      difficulty: 'facile'
    },
    {
      id: '3',
      question: 'Comment créer un compte ?',
      answer: `Plusieurs options pour vous inscrire :

🚀 Méthode rapide
Cliquez sur "Se connecter avec GitHub" pour une inscription instantanée

📧 Méthode classique
1. Cliquez sur "Créer un compte"
2. Entrez votre email et créez un mot de passe
3. Confirmez votre email
4. Complétez votre profil (nom, bio, équipes favorites)

📱 Sur mobile
Même processus dans l'application iOS/Android

Une fois inscrit, vous pouvez immédiatement commencer à noter !`,
      category: 'getting-started',
      tags: ['inscription', 'compte', 'github', 'email'],
      difficulty: 'facile'
    },
    {
      id: '4',
      question: 'Comment noter un match ?',
      answer: `La notation est au cœur de Sporating !

📝 Processus simple
1. Trouvez votre match dans la liste ou via la recherche
2. Cliquez sur "Noter ce match"
3. Donnez une note de 1 à 5 étoiles :
   • ⭐ Très décevant
   • ⭐⭐ Décevant  
   • ⭐⭐⭐ Correct
   • ⭐⭐⭐⭐ Bon spectacle
   • ⭐⭐⭐⭐⭐ Exceptionnel
4. Ajoutez un commentaire (fortement recommandé)
5. Publiez votre évaluation

⚠️ Important : Seuls les matchs terminés peuvent être notés pour garantir l'objectivité !`,
      category: 'rating',
      tags: ['noter', 'match', 'étoiles', 'commentaire'],
      difficulty: 'facile'
    },
    {
      id: '5',
      question: 'Comment noter des joueurs individuels ?',
      answer: `Évaluez les performances individuelles avec notre système de notation !

⚡ Processus
1. Ouvrez la page d'un match terminé
2. Allez dans l'onglet "Joueurs"
3. Sélectionnez les joueurs à évaluer
4. Donnez une note de 1 à 10 pour chaque joueur
5. Ajoutez un commentaire sur leur performance

💡 Conseils de notation
• Évaluez la performance du match uniquement
• Considérez l'impact réel sur le résultat
• Soyez objectif malgré vos préférences d'équipe

🎯 Utilité
Vos notes alimentent nos classements comme le Ballon d'Or des Fans !`,
      category: 'rating',
      tags: ['joueurs', 'performance', 'individuel', 'ballon-or'],
      difficulty: 'moyen'
    },
    {
      id: '6',
      question: 'Qu\'est-ce que l\'Homme du Match ?',
      answer: `Désignez le joueur qui vous a le plus impressionné !

🗳️ Comment voter
1. Après un match terminé, cliquez sur "Homme du Match"
2. Choisissez le joueur qui a été décisif selon vous
3. Ajoutez un commentaire optionnel
4. Validez votre vote

📋 Règles
• Un seul vote par match et par utilisateur
• Vous pouvez changer d'avis avant la fin du vote
• Les résultats sont visibles après vote

🎖️ Impact
Les joueurs élus Homme du Match gagnent des points bonus dans nos classements !`,
      category: 'rating',
      tags: ['homme-du-match', 'vote', 'décisif', 'classement'],
      difficulty: 'facile'
    },
    {
      id: '7',
      question: 'Comment fonctionne le Ballon d\'Or des Fans ?',
      answer: `Notre classement exclusif football basé sur VOS votes !

⚙️ Fonctionnement
• Basé sur vos notes de joueurs (1-10)
• Fusion intelligente des profils multi-clubs
• Filtres par position : gardien, défenseur, milieu, attaquant
• Périodes configurables : saison, année, tous temps

✨ Spécialités
• Prend en compte la régularité sur la saison
• Pondère selon l'importance des matchs
• Évite les biais de popularité

🔄 Mise à jour
Classement actualisé en temps réel après chaque notation !

🎯 Objectif
Donner la vraie opinion des fans sur les meilleurs joueurs.`,
      category: 'rating',
      tags: ['ballon-or', 'classement', 'football', 'fusion', 'position'],
      difficulty: 'moyen'
    },
    {
      id: '8',
      question: 'Comment gérer mes amis sur Sporating ?',
      answer: `Connectez-vous avec des fans qui partagent votre passion !

👥 Ajouter des amis
1. Recherche par nom d'utilisateur
2. Via les commentaires de matchs
3. Suggestions basées sur vos goûts
4. Depuis les profils des utilisateurs actifs

📨 Gestion des demandes
• Recevez des notifications pour les nouvelles demandes
• Acceptez ou refusez selon vos préférences
• Bloquez les utilisateurs indésirables

📺 Activité des amis
• Voir leurs dernières notes et commentaires
• Découvrir leurs recommandations
• Être notifié de leurs matchs 5 étoiles

🔒 Confidentialité
Contrôlez qui peut vous voir et vous contacter.`,
      category: 'social',
      tags: ['amis', 'demandes', 'notifications', 'découverte'],
      difficulty: 'facile'
    },
    {
      id: '9',
      question: 'Comment utiliser Sporating sur mobile ?',
      answer: `Sporating est optimisé mobile avec une app native !

📱 Application mobile
• Disponible iOS et Android
• Interface tactile optimisée
• Notifications push en temps réel
• Mode hors-ligne pour consultation

⚡ Fonctionnalités mobile
• Navigation par gestes fluides
• Boutons tactiles adaptés
• Support des encoches iPhone
• Design responsive parfait

🔋 Performance
• Chargement rapide des matchs
• Synchronisation automatique
• Cache intelligent
• Optimisation batterie

📲 Installation
Téléchargez "Sporating" sur l'App Store ou Google Play !`,
      category: 'technical',
      tags: ['mobile', 'app', 'ios', 'android', 'tactile'],
      difficulty: 'facile'
    },
    {
      id: '10',
      question: 'Comment contacter le support Sporating ?',
      answer: `Notre équipe support est là pour vous aider !

📧 Canaux de contact
Email : support@sporating.com
Réponse : Sous 24h en moyenne
Langues : Français, Anglais, Espagnol

📝 Informations à fournir
• Description détaillée du problème
• Votre navigateur et version
• Captures d'écran si pertinentes
• Votre email de compte

🎫 Types de demandes
• Problèmes techniques
• Questions sur les fonctionnalités
• Récupération de données
• Suggestions d'amélioration

💡 Avant de contacter
Consultez cette FAQ, 90% des questions ont déjà leur réponse !`,
      category: 'technical',
      tags: ['support', 'contact', 'aide', 'email'],
      difficulty: 'facile'
    }
  ]

  // Filtrage des FAQ
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      pink: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
      gray: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
      red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    }
    return colors[color] || colors.blue
  }

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      facile: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
      moyen: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertCircle },
      avancé: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: Info }
    }
    return badges[difficulty] || badges.facile
  }

  const formatAnswer = (answer: string) => {
    return answer.split('\n\n').map((section, sectionIdx) => (
      <div key={sectionIdx} className="mb-6 last:mb-0">
        {section.split('\n').map((line, lineIdx) => {
          const trimmedLine = line.trim()
          
          // Titre de section (emojis + texte)
          if (trimmedLine.match(/^[🎯🚀📧📱⚡📝⚠️💡🗳️📋🎖️⚙️✨🔄👥📨📺🔒📧📝🎫💡]/)) {
            const [emoji, ...textParts] = trimmedLine.split(' ')
            return (
              <div key={lineIdx} className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{emoji}</span>
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {textParts.join(' ')}
                </h4>
              </div>
            )
          }
          
          // Liste avec emojis
          if (trimmedLine.match(/^[•⭐🏆🤝✨🎯⚽🏀🥊🏉🏎️]/)) {
            return (
              <div key={lineIdx} className="flex items-start gap-3 mb-2 ml-4">
                <span className="text-lg mt-0.5">{trimmedLine.charAt(0)}</span>
                <span className="flex-1">{trimmedLine.slice(2)}</span>
              </div>
            )
          }
          
          // Étapes numérotées
          if (trimmedLine.match(/^\d+\./)) {
            return (
              <div key={lineIdx} className="flex items-start gap-3 mb-2 ml-4">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {trimmedLine.charAt(0)}
                </span>
                <span className="flex-1">{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
              </div>
            )
          }
          
          // Ligne vide
          if (trimmedLine === '') return null
          
          // Paragraphe normal
          return (
            <p key={lineIdx} className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              {trimmedLine}
            </p>
          )
        })}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header mobile-friendly */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  Centre d'aide
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  Trouvez rapidement les réponses à vos questions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span>{filteredFAQs.length}</span>
              <span className="hidden sm:inline">question{filteredFAQs.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Recherche - Always visible on mobile */}
        <div className="mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {filteredFAQs.length} résultat{filteredFAQs.length !== 1 ? 's' : ''} pour "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar - Hidden on mobile, shown in drawer */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 sm:p-6 hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Catégories
              </h2>
              <div className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon
                  const isSelected = selectedCategory === category.id
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all text-left ${
                        isSelected
                          ? getColorClasses(category.color)
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{category.name}</div>
                        <div className="text-xs opacity-75 hidden xl:block">{category.description}</div>
                      </div>
                      {category.id !== 'all' && (
                        <span className="text-xs bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                          {faqItems.filter(item => item.category === category.id).length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mobile categories - Horizontal scroll */}
            <div className="lg:hidden mb-6">
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(category => {
                  const Icon = category.icon
                  const isSelected = selectedCategory === category.id
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Support card - Hidden on mobile */}
            <div className="hidden lg:block bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mt-6 text-white">
              <div className="flex items-center space-x-3 mb-3">
                <MessageSquare className="w-6 h-6" />
                <h3 className="font-semibold">Besoin d'aide ?</h3>
              </div>
              <p className="text-sm mb-4 opacity-90">
                Notre équipe est là pour vous aider !
              </p>
              <a
                href="mailto:support@sporating.com"
                className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </a>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 sm:p-12 text-center">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune question trouvée
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Essayez un autre terme de recherche ou sélectionnez une catégorie différente.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Voir toutes les questions
                  </button>
                </div>
              ) : (
                filteredFAQs.map(item => {
                  const isExpanded = expandedItem === item.id
                  const difficultyBadge = getDifficultyBadge(item.difficulty)
                  const DifficultyIcon = difficultyBadge.icon
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="w-full p-4 sm:p-6 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 leading-snug">
                              {item.question}
                            </h3>
                            <div className="flex items-center flex-wrap gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyBadge.color}`}>
                                <DifficultyIcon className="w-3 h-3 mr-1" />
                                {item.difficulty}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-block px-2 py-1 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {item.tags.length > 2 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                                    +{item.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
                          <div className="pt-4 sm:pt-6">
                            <div className="prose prose-sm max-w-none">
                              {formatAnswer(item.answer)}
                            </div>
                            
                            {/* Actions rapides */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Cette réponse vous a-t-elle aidé ?
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="inline-flex items-center px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors text-sm font-medium">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Oui
                                  </button>
                                  <button className="inline-flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm font-medium">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    Non
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Section Contact en bas - Responsive */}
            {filteredFAQs.length > 0 && (
              <div className="mt-8 sm:mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 sm:p-8 text-white text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Toujours besoin d'aide ?</h2>
                <p className="text-blue-100 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                  Notre équipe support est là pour vous accompagner. 
                  Nous répondons généralement sous 24h !
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <a
                    href="mailto:support@sporating.com?subject=Question depuis la FAQ"
                    className="inline-flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 px-4 sm:px-6 py-3 rounded-lg transition-colors font-medium text-sm sm:text-base"
                  >
                    <Mail className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span className="hidden sm:inline">support@sporating.com</span>
                    <span className="sm:hidden">Email</span>
                  </a>
                  <button className="inline-flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 px-4 sm:px-6 py-3 rounded-lg transition-colors font-medium text-sm sm:text-base">
                    <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5" />
                    <span>Formulaire de contact</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating action button for mobile support */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <a
          href="mailto:support@sporating.com"
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <MessageSquare className="w-6 h-6" />
        </a>
      </div>
    </div>
  )
}