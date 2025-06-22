import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  RefreshCw, Play, Clock, Database, Trophy, 
  Calendar, BarChart3, Target, Zap, Car
} from 'lucide-react'

export default function SportsDashboard() {
  const { data: session } = useSession()
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/matches?limit=1000&sport=all')
      const data = await response.json()
      
      // Calculer les stats par sport
      const matches = data.matches || []
      const sportStats = {
        football: matches.filter((m: any) => m.sport === 'football').length,
        basketball: matches.filter((m: any) => m.sport === 'basketball').length,
        mma: matches.filter((m: any) => m.sport === 'mma').length,
        rugby: matches.filter((m: any) => m.sport === 'rugby').length,
        f1: matches.filter((m: any) => m.sport === 'f1').length
      }

      setStats({
        total: matches.length,
        ...sportStats,
        lastUpdate: new Date().toLocaleString()
      })
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const runImport = async (action: string, sport?: string) => {
    setImporting(true)
    addLog(`🚀 Démarrage ${action}${sport ? ` (${sport})` : ''}...`)

    try {
      const response = await fetch('/api/import-all-sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sport })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        addLog('✅ Import réussi !')
        if (data.result) {
          addLog(`📊 Résultats:`)
          addLog(`  ⚽ Football: ${data.result.football}`)
          addLog(`  🏀 Basketball: ${data.result.basketball}`)
          addLog(`  🥊 MMA: ${data.result.mma}`)
          addLog(`  🏉 Rugby: ${data.result.rugby}`)
          addLog(`  🏎️ F1: ${data.result.f1}`)
          addLog(`  📊 TOTAL: ${data.result.total}`)
        } else {
          addLog(`📊 ${data.imported} événements importés`)
          addLog(`🏆 Sports: ${data.sports?.join(', ') || sport}`)
        }
        await fetchStats() // Refresh stats
      } else {
        addLog('❌ Erreur import: ' + JSON.stringify(data))
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const runAutoUpdate = async () => {
    setImporting(true)
    addLog('🔄 Auto-update des dernières 24h...')

    try {
      const response = await fetch('/api/cron/auto-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer footrate_secret_key_2024`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        addLog('✅ Auto-update réussi !')
        addLog(`📊 ${data.imported} nouveaux événements`)
        addLog(`🏆 Sports: ${data.sports?.join(', ')}`)
        await fetchStats()
      } else {
        addLog('❌ Erreur auto-update: ' + JSON.stringify(data))
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
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
              <Database className="w-8 h-8" />
              <span>Dashboard Multi-Sports</span>
            </h1>
            <p className="text-gray-600 mt-1">
              ⚽ Football • 🏀 Basketball • 🥊 MMA • 🏉 Rugby • 🏎️ F1
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Retour App
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">⚽ Football</p>
                  <p className="text-2xl font-bold text-green-600">{stats.football}</p>
                </div>
                <div className="text-2xl">⚽</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">🏀 Basketball</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.basketball}</p>
                </div>
                <div className="text-2xl">🏀</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">🥊 MMA</p>
                  <p className="text-2xl font-bold text-red-600">{stats.mma}</p>
                </div>
                <div className="text-2xl">🥊</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">🏉 Rugby</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.rugby}</p>
                </div>
                <div className="text-2xl">🏉</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">🏎️ F1</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.f1}</p>
                </div>
                <div className="text-2xl">🏎️</div>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles Import */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Import Complet 2024-2025</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Import TOUT */}
            <button
              onClick={() => runImport('import_all')}
              disabled={importing}
              className="flex flex-col items-center space-y-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Trophy className="w-6 h-6" />
              )}
              <span className="font-semibold">Import COMPLET</span>
              <span className="text-xs opacity-90">Tous les sports 2024-2025</span>
            </button>

            {/* Auto-Update */}
            <button
              onClick={runAutoUpdate}
              disabled={importing}
              className="flex flex-col items-center space-y-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Zap className="w-6 h-6" />
              )}
              <span className="font-semibold">Auto-Update</span>
              <span className="text-xs opacity-90">Dernières 24h</span>
            </button>

            {/* Import Récent */}
            <button
              onClick={() => runImport('import_recent')}
              disabled={importing}
              className="flex flex-col items-center space-y-2 bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 rounded-lg hover:from-orange-600 hover:to-red-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
              <span className="font-semibold">Import Récent</span>
              <span className="text-xs opacity-90">Événements récents</span>
            </button>
          </div>

          {/* Import par Sport */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import par Sport Individuel</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { sport: 'football', name: '⚽ Football', color: 'bg-green-500 hover:bg-green-600' },
                { sport: 'basketball', name: '🏀 Basketball', color: 'bg-orange-500 hover:bg-orange-600' },
                { sport: 'mma', name: '🥊 MMA', color: 'bg-red-500 hover:bg-red-600' },
                { sport: 'rugby', name: '🏉 Rugby', color: 'bg-purple-500 hover:bg-purple-600' },
                { sport: 'f1', name: '🏎️ F1', color: 'bg-blue-500 hover:bg-blue-600' }
              ].map((sportInfo) => (
                <button
                  key={sportInfo.sport}
                  onClick={() => runImport('import_sport', sportInfo.sport)}
                  disabled={importing}
                  className={`${sportInfo.color} text-white px-3 py-2 rounded-lg disabled:opacity-50 transition-colors text-sm font-medium`}
                >
                  {sportInfo.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>Import Complet :</strong> Récupère TOUTES les données 2024-2025 (20-30 min)</p>
            <p><strong>Auto-Update :</strong> Vérifie les nouveaux événements terminés</p>
            <p><strong>Import par Sport :</strong> Import individuel d'un sport spécifique</p>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Logs Temps Réel</span>
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500">
                <p className="text-sm italic mb-4">
                  Aucune activité récente
                </p>
                <div className="space-y-2">
                  <p className="text-xs">🚀 Clique sur "Import COMPLET" pour récupérer toutes les données</p>
                  <p className="text-xs">🔄 Clique sur "Auto-Update" pour les derniers événements</p>
                  <p className="text-xs">⚽🏀🥊🏉🏎️ Ou import un sport spécifique</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guide de démarrage */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Guide de Démarrage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">1️⃣ Premier Import</h4>
              <p className="text-blue-700">Clique sur "Import COMPLET" pour récupérer toutes les données 2024-2025 des 5 sports</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">2️⃣ Auto-Update</h4>
              <p className="text-blue-700">GitHub Actions lance automatiquement l'auto-update toutes les 2h</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">3️⃣ Navigation</h4>
              <p className="text-blue-700">Retourne à l'app pour voir tous les événements et commencer à noter !</p>
            </div>
          </div>
        </div>

        {/* Stats techniques */}
        {stats && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistiques Techniques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Dernière mise à jour</p>
                <p className="font-medium">{stats.lastUpdate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Sport le plus populaire</p>
                <p className="font-medium">
                  {stats.football > 0 ? '⚽ Football' : 
                   stats.basketball > 0 ? '🏀 Basketball' : 
                   stats.mma > 0 ? '🥊 MMA' : 
                   stats.rugby > 0 ? '🏉 Rugby' : 
                   stats.f1 > 0 ? '🏎️ F1' : 'Aucun'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Sports actifs</p>
                <p className="font-medium">
                  {[stats.football, stats.basketball, stats.mma, stats.rugby, stats.f1].filter(n => n > 0).length}/5
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Base de données</p>
                <p className="font-medium">PostgreSQL</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}