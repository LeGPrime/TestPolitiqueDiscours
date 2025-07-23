// pages/admin/tennis-import.tsx
// 🎾 PAGE ADMIN IMPORT TENNIS ATP

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

interface ImportResult {
  success: boolean
  message: string
  result?: {
    imported: number
    skipped: number
    errors: number
    examples: string[]
    requestsUsed: number
    quotaRemaining: number
  }
  quota?: {
    used: number
    remaining: number
    dailyLimit: number
    percentage: number
  }
}

export default function TennisImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResult | null>(null)
  const [quotaStatus, setQuotaStatus] = useState<any>(null)

  // Redirection si pas connecté
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/api/auth/signin')
    }
  }, [session, status, router])

  // Loading state pendant l'authentification
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Pas de session = redirection en cours
  if (!session) {
    return null
  }

  // Action générique pour appeler l'API
  const handleAction = async (action: string, actionName: string) => {
    setLoading(true)
    const toastId = toast.loading(`${actionName}...`)
    
    try {
      const response = await fetch('/api/tennis-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      setResults(data)

      if (data.success) {
        toast.success(data.message, { id: toastId })
      } else {
        toast.error(data.error || data.message, { id: toastId })
      }

      // Mettre à jour le quota si disponible
      if (data.quota) {
        setQuotaStatus(data.quota)
      }

    } catch (error) {
      toast.error('Erreur de connexion', { id: toastId })
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                🎾 Import Tennis ATP
                <span className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                  SportDevs API
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Import optimisé des matchs ATP récents via SportDevs (RapidAPI)
              </p>
            </div>
            
            {quotaStatus && (
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Quota quotidien</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {quotaStatus.remaining}/{quotaStatus.dailyLimit}
                </div>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${quotaStatus.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleAction('test_connection', 'Test de connexion')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '🔍'
            )}
            Test Connexion
          </button>

          <button
            onClick={() => handleAction('import_atp_july_2025', 'Import ATP Juillet 2025')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '🎾'
            )}
            Import ATP Juillet (Strict)
          </button>
        </div>

        {/* Actions secondaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handleAction('import_atp_matches', 'Import ATP général')}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '⚠️'
            )}
            Import ATP (~50 matchs)
          </button>

          <button
            onClick={() => handleAction('get_quota_status', 'Vérification quota')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '📊'
            )}
            Vérifier Quota
          </button>

          <button
            onClick={() => handleAction('debug_api_response', 'Debug API')}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '🧪'
            )}
            Debug API
          </button>
        </div>

        {/* Avertissement Schéma */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Prérequis : Mise à jour Prisma Schema
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                Avant le premier import, vous devez ajouter TENNIS à l'enum Sport :
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded border text-sm font-mono">
                <div className="text-yellow-800 dark:text-yellow-200">
                  enum Sport {'{'}
                  <br />
                  &nbsp;&nbsp;FOOTBALL
                  <br />
                  &nbsp;&nbsp;BASKETBALL
                  <br />
                  &nbsp;&nbsp;MMA
                  <br />
                  &nbsp;&nbsp;RUGBY
                  <br />
                  &nbsp;&nbsp;F1
                  <br />
                  &nbsp;&nbsp;<span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">TENNIS  // 🆕 Ajoutez cette ligne</span>
                  <br />
                  {'}'}
                </div>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                Puis exécutez : <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded text-xs">npx prisma db push</code>
              </p>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {results.success ? '✅' : '❌'} Résultats
            </h2>
            
            <div className="space-y-4">
              {/* Message principal */}
              <div className={`p-4 rounded-lg ${
                results.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                {results.message}
              </div>

              {/* Statistiques d'import */}
              {results.result && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results.result.imported}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Importés</div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {results.result.skipped}
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">Ignorés</div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {results.result.errors}
                    </div>
                    <div className="text-sm text-red-800 dark:text-red-300">Erreurs</div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {results.result.requestsUsed}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-300">Requêtes</div>
                  </div>
                </div>
              )}

              {/* Exemples de matchs */}
              {results.result?.examples && results.result.examples.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    🎾 Exemples de matchs importés
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    {results.result.examples.map((example, index) => (
                      <div key={index} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                        • {example}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quota restant */}
              {results.result?.quotaRemaining !== undefined && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                      Quota restant aujourd'hui
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {results.result.quotaRemaining}/300 requêtes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informations utiles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ℹ️ Informations Tennis API
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">✅ Avantages</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Vrais matchs ATP avec scores détaillés</li>
                <li>• Informations tournoi (surface, niveau)</li>
                <li>• Classements et pays des joueurs</li>
                <li>• Import économique (≤5 requêtes pour 50 matchs)</li>
                <li>• Plan gratuit : 300 requêtes/jour</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">📊 Données récupérées</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Noms des joueurs ATP</li>
                <li>• Scores par set (6-4, 7-6, etc.)</li>
                <li>• Surface (Hard, Clay, Grass)</li>
                <li>• Tournoi et niveau (Grand Chelem, Masters)</li>
                <li>• Lieu et date du match</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>💡 Conseil :</strong> Après le premier import réussi, vous pourrez voir les matchs tennis 
              sur la page d'accueil en filtrant par sport "Tennis". L'import récupère les matchs ATP 
              récemment terminés avec toutes leurs informations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}