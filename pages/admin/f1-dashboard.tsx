// pages/admin/f1-dashboard.tsx - VERSION COMPLÈTE CORRIGÉE
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Car, RefreshCw, Trophy, Users, Database, 
  CheckCircle, XCircle, AlertTriangle, Clock,
  Download, Play, BarChart3, Flag, Timer, Trash2
} from 'lucide-react'
import axios from 'axios'

interface F1Stats {
  totalRaces: number
  totalDrivers: number
  season: string
  lastUpdate: string
}

export default function F1Dashboard() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<F1Stats | null>(null)
  const [selectedSeason, setSelectedSeason] = useState(2025)

  useEffect(() => {
    if (session) {
      fetchF1Stats()
    }
  }, [session])

  const fetchF1Stats = async () => {
    try {
      const response = await axios.get('/api/matches?sport=f1&limit=1000')
      const f1Matches = response.data.matches || []
      
      setStats({
        totalRaces: f1Matches.length,
        totalDrivers: 0,
        season: '2025',
        lastUpdate: new Date().toLocaleString()
      })
    } catch (error) {
      console.error('Erreur stats F1:', error)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  // 🆕 FONCTION TEST API CORRIGÉE
  const testF1Connection = async () => {
    setTesting(true)
    addLog('🔍 Test de connexion à l\'API Formula 1...')

    try {
      const response = await axios.post('/api/import-f1', {
        action: 'test_connection'
      })

      console.log('Réponse API test:', response.data) // Debug

      if (response.data.success) {
        setConnectionStatus({
          success: true,
          message: response.data.message,
          data: response.data.data
        })
        addLog('✅ ' + response.data.message)
        
        if (response.data.data?.examples) {
          addLog(`🏁 Exemples: ${response.data.data.examples.join(', ')}`)
        }
      } else {
        setConnectionStatus({
          success: false,
          message: response.data.message || 'Erreur de connexion'
        })
        addLog('❌ ' + response.data.message)
      }
    } catch (error: any) {
      console.error('Erreur test F1:', error)
      
      let errorMsg = 'Erreur inconnue'
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      } else if (error.message) {
        errorMsg = error.message
      }
      
      setConnectionStatus({
        success: false,
        message: errorMsg
      })
      addLog('❌ Erreur: ' + errorMsg)
      
      // 🆕 DIAGNOSTIC DÉTAILLÉ
      if (error.response?.status === 500) {
        addLog('🔧 Diagnostic: Problème serveur - vérifiez votre clé RAPIDAPI_KEY')
      } else if (error.response?.status === 401) {
        addLog('🔧 Diagnostic: Clé API invalide ou expirée')
      } else if (!process.env.RAPIDAPI_KEY) {
        addLog('🔧 Diagnostic: Variable RAPIDAPI_KEY manquante dans .env')
      }
      
    } finally {
      setTesting(false)
    }
  }

  // 🆕 FONCTION NETTOYAGE
  const cleanF1Duplicates = async () => {
    if (!confirm('🧹 Supprimer tous les doublons F1 ?\n\nCette action est irréversible mais garde au moins 1 exemplaire de chaque GP.')) {
      return
    }
    
    setCleaning(true)
    addLog('🧹 Démarrage du nettoyage F1...')

    try {
      const response = await axios.post('/api/cleanup-f1-duplicates')
      
      if (response.data.success) {
        addLog('✅ ' + response.data.message)
        addLog(`📊 Statistiques de nettoyage :`)
        addLog(`  • GP trouvés initialement : ${response.data.stats.initialCount}`)
        addLog(`  • Doublons supprimés : ${response.data.stats.duplicatesDeleted}`)
        addLog(`  • GP uniques restants : ${response.data.stats.finalCount}`)
        
        if (response.data.recommendations) {
          addLog('💡 Recommandations :')
          response.data.recommendations.forEach((rec: string) => addLog(`   • ${rec}`))
        }
        
        // Actualiser les stats
        await fetchF1Stats()
      } else {
        addLog('❌ Erreur nettoyage : ' + response.data.error)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message
      addLog('❌ Erreur nettoyage : ' + errorMsg)
    } finally {
      setCleaning(false)
    }
  }

  // 🆕 FONCTION SUPPRESSION COMPLÈTE  
  const deleteAllF1 = async () => {
    if (!confirm('🚨 ATTENTION : Supprimer TOUT F1 ?\n\n• Tous les Grands Prix\n• Tous les pilotes\n• Toutes les notes F1\n\nCette action est IRRÉVERSIBLE !')) {
      return
    }
    
    if (!confirm('🚨 DERNIÈRE CHANCE !\n\nÊtes-vous SÛR de vouloir tout supprimer ?\n\nTapez "SUPPRIMER" dans la prochaine boîte pour confirmer.')) {
      return
    }
    
    const confirmation = prompt('Tapez "SUPPRIMER" en majuscules pour confirmer :')
    if (confirmation !== 'SUPPRIMER') {
      addLog('❌ Suppression annulée')
      return
    }
    
    setCleaning(true)
    addLog('🚨 SUPPRESSION COMPLÈTE F1 EN COURS...')

    try {
      // Appeler l'API de suppression complète (à créer)
      const response = await axios.post('/api/delete-all-f1')
      
      if (response.data.success) {
        addLog('✅ ' + response.data.message)
        addLog(`📊 Supprimé :`)
        addLog(`  • ${response.data.stats.matchesDeleted} Grands Prix`)
        addLog(`  • ${response.data.stats.driversDeleted} pilotes`)
        addLog(`  • ${response.data.stats.ratingsDeleted} notes`)
        
        await fetchF1Stats()
      } else {
        addLog('❌ Erreur suppression : ' + response.data.error)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message
      addLog('❌ Erreur suppression : ' + errorMsg)
    } finally {
      setCleaning(false)
    }
  }

  const runF1Import = async (action: string) => {
    setLoading(true)
    addLog(`🚀 Démarrage ${action} F1...`)

    try {
      const response = await axios.post('/api/import-f1', {
        action,
        season: selectedSeason
      })

      if (response.data.success) {
        addLog('✅ Import F1 réussi !')
        
        const result = response.data
        
        if (action === 'import_complete' && result.results) {
          addLog(`🏁 RÉSULTATS COMPLETS F1 ${selectedSeason}:`)
          addLog(`  🏆 Courses: ${result.results.races?.imported || 0} importées, ${result.results.races?.skipped || 0} existantes`)
          addLog(`  👨‍✈️ Pilotes: ${result.results.drivers?.imported || 0} importés, ${result.results.drivers?.skipped || 0} existants`)
          addLog(`  📊 TOTAL: ${result.results.total?.imported || 0} éléments ajoutés`)
          addLog(`  ⏱️ Durée: ${response.data.duration}`)
          
          if (result.recommendations) {
            addLog('💡 Recommandations:')
            result.recommendations.forEach((rec: string) => addLog(`   • ${rec}`))
          }
        } else {
          addLog(`📊 ${result.message}`)
          addLog(`  Importé: ${response.data.imported}`)
          addLog(`  Ignoré: ${response.data.skipped}`)
          if (response.data.examples) {
            addLog(`  Exemples: ${response.data.examples.slice(0, 3).join(', ')}`)
          }
        }
        
        await fetchF1Stats()
      } else {
        addLog('❌ Erreur import: ' + response.data.error)
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message
      addLog('❌ Erreur: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h1>
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Car className="w-8 h-8 text-red-600" />
              <span>🏁 Dashboard Formula 1</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion des Grands Prix et pilotes F1 • API Formula 1 officielle
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/admin/sports-dashboard-2025"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              ← Dashboard Multi-Sports
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Retour App
            </Link>
          </div>
        </div>

        {/* Stats F1 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600">{stats.totalRaces}</div>
                  <div className="text-sm font-medium text-red-700">🏁 Grands Prix</div>
                </div>
                <Trophy className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{stats.totalDrivers}</div>
                  <div className="text-sm font-medium text-blue-700">👨‍✈️ Pilotes</div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">{stats.season}</div>
                  <div className="text-sm font-medium text-green-700">📅 Saison</div>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-600">API F1</div>
                  <div className="text-sm font-medium text-gray-700">🔌 Connexion</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus?.success ? 'bg-green-500' : 
                  connectionStatus?.success === false ? 'bg-red-500' : 'bg-gray-400'
                }`} />
              </div>
            </div>
          </div>
        )}

        {/* Test de connexion F1 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Flag className="w-5 h-5 text-red-600" />
              <span>🔌 Test API Formula 1</span>
            </h2>
            <button
              onClick={testF1Connection}
              disabled={testing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Car className="w-4 h-4" />
              )}
              <span>Tester API F1</span>
            </button>
          </div>

          {connectionStatus && (
            <div className={`p-4 rounded-lg border-2 ${
              connectionStatus.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {connectionStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{connectionStatus.message}</span>
              </div>
              
              {connectionStatus.data && connectionStatus.success && (
                <div className="text-sm text-green-700 mt-2">
                  📊 {connectionStatus.data.races || connectionStatus.data.weekends} éléments disponibles
                  {connectionStatus.data.examples && (
                    <div className="mt-1">
                      🎯 Exemples: {connectionStatus.data.examples.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🆕 SECTION NETTOYAGE */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-orange-600" />
            <span>🧹 Nettoyage des données F1</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nettoyage doublons */}
            <button
              onClick={cleanF1Duplicates}
              disabled={cleaning}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 transition-all"
            >
              {cleaning ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Trash2 className="w-8 h-8" />
              )}
              <span className="font-semibold text-lg">Nettoyer doublons</span>
              <span className="text-sm opacity-90">🧹 Garde 1 exemplaire par GP</span>
              <span className="text-xs opacity-75">Recommandé avant import</span>
            </button>

            {/* Suppression complète */}
            <button
              onClick={deleteAllF1}
              disabled={cleaning}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-xl hover:from-red-700 hover:to-red-900 disabled:opacity-50 transition-all border-2 border-red-400"
            >
              {cleaning ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
              <span className="font-semibold text-lg">TOUT supprimer</span>
              <span className="text-sm opacity-90">🚨 SUPPRIME TOUT F1</span>
              <span className="text-xs opacity-75">IRRÉVERSIBLE !</span>
            </button>
          </div>
        </div>

        {/* Contrôles d'import F1 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-600" />
            <span>🏁 Import des données F1</span>
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saison Formula 1
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Import Complet F1 */}
            <button
              onClick={() => runF1Import('import_complete')}
              disabled={loading || !connectionStatus?.success}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-red-500 to-orange-600 text-white p-6 rounded-xl hover:from-red-600 hover:to-orange-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Car className="w-8 h-8" />
              )}
              <span className="font-semibold text-lg">Import Complet F1</span>
              <span className="text-sm opacity-90">🏁 Courses + 👨‍✈️ Pilotes</span>
              <span className="text-xs opacity-75">Saison {selectedSeason}</span>
            </button>

            {/* Import Courses seulement */}
            <button
              onClick={() => runF1Import('import_races')}
              disabled={loading || !connectionStatus?.success}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Trophy className="w-6 h-6" />
              )}
              <span className="font-semibold">Courses F1</span>
              <span className="text-sm opacity-90">🏁 Grands Prix uniquement</span>
            </button>

            {/* Import Pilotes seulement */}
            <button
              onClick={() => runF1Import('import_drivers')}
              disabled={loading || !connectionStatus?.success}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Users className="w-6 h-6" />
              )}
              <span className="font-semibold">Pilotes F1</span>
              <span className="text-sm opacity-90">👨‍✈️ Pilotes uniquement</span>
            </button>

            {/* 🆕 Import Mode MOCK */}
            <button
              onClick={() => runF1Import('import_mock')}
              disabled={loading}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all border-2 border-purple-300"
            >
              {loading ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Trophy className="w-8 h-8" />
              )}
              <span className="font-semibold text-lg">Mode MOCK</span>
              <span className="text-sm opacity-90">🎭 24 GP de test</span>
              <span className="text-xs opacity-75">Si API ne marche pas</span>
            </button>
          </div>
        </div>

        {/* Logs temps réel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>📋 Logs Formula 1</span>
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <Clock className="w-8 h-8 mx-auto mb-4" />
                <p className="mb-4">Aucune activité F1 récente</p>
                <div className="space-y-2 text-xs">
                  <p>🔍 Testez votre connexion API F1</p>
                  <p>🧹 Nettoyez vos données F1</p>
                  <p>🏁 Importez les Grands Prix et pilotes</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.includes('✅') ? 'text-green-400' :
                      log.includes('❌') ? 'text-red-400' :
                      log.includes('🚀') ? 'text-blue-400' :
                      log.includes('🏁') ? 'text-red-400' :
                      log.includes('🧹') ? 'text-orange-400' :
                      log.includes('👨‍✈️') ? 'text-purple-400' :
                      log.includes('📊') ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}