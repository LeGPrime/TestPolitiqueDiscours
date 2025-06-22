// pages/admin/sports-dashboard.tsx - VERSION MISE À JOUR
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  RefreshCw, Play, Clock, Database, Trophy, 
  Calendar, BarChart3, Target, Zap, Car, Flame, Shield
} from 'lucide-react'

export default function UpdatedSportsDashboard() {
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
      
      const matches = data.matches || []
      const sportStats = {
        football: matches.filter((m: any) => m.sport === 'football').length,
        basketball: matches.filter((m: any) => m.sport === 'basketball').length,
        f1: matches.filter((m: any) => m.sport === 'f1').length,           // 🆕
        mma: matches.filter((m: any) => m.sport === 'mma').length,         // 🆕
        rugby: matches.filter((m: any) => m.sport === 'rugby').length      // 🆕
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
      let endpoint = '/api/import-all-sports'
      let body = { action, sport }
      
      // 🆕 Utiliser le nouvel endpoint pour les nouveaux sports
      if (['f1', 'mma', 'rugby'].includes(sport || '') || action === 'import_new_sports') {
        endpoint = '/api/import-new-sports'
        body = { action: sport ? 'import_sport' : 'import_all', sport }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        addLog('✅ Import réussi !')
        if (data.result) {
          addLog(`📊 Résultats COMPLETS:`)
          addLog(`  ⚽ Football: ${data.result.football || 0}`)
          addLog(`  🏀 Basketball: ${data.result.basketball || 0}`)
          addLog(`  🏎️ F1: ${data.result.f1 || 0}`)
          addLog(`  🥊 MMA: ${data.result.mma || 0}`)
          addLog(`  🏉 Rugby: ${data.result.rugby || 0}`)
          addLog(`  📊 TOTAL: ${data.result.total}`)
        } else {
          addLog(`📊 ${data.imported} événements importés`)
          addLog(`🏆 Sport: ${data.sport || sport}`)
          if (data.examples) {
            addLog(`🎯 Exemples: ${data.examples.slice(0, 2).map((e: any) => 
              typeof e === 'string' ? e : `${e.event} (${e.competition})`
            ).join(', ')}`)
          }
        }
        await fetchStats()
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
              <span>Dashboard Multi-Sports 2024-2025</span>
            </h1>
            <p className="text-gray-600 mt-1">
              ⚽ Football • 🏀 Basketball • 🏎️ F1 • 🥊 MMA • 🏉 Rugby
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

        {/* Stats Cards - MISE À JOUR avec 5 sports */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm font-medium text-gray-700">Total</div>
                </div>
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.football}</div>
                  <div className="text-sm font-medium text-green-700">⚽ Football</div>
                </div>
                <div className="text-2xl">⚽</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.basketball}</div>
                  <div className="text-sm font-medium text-orange-700">🏀 Basketball</div>
                </div>
                <div className="text-2xl">🏀</div>
              </div>
            </div>

            {/* 🆕 NOUVELLES CARDS */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.f1}</div>
                  <div className="text-sm font-medium text-red-700">🏎️ Formule 1</div>
                </div>
                <div className="text-2xl">🏎️</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.mma}</div>
                  <div className="text-sm font-medium text-purple-700">🥊 MMA</div>
                </div>
                <div className="text-2xl">🥊</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{stats.rugby}</div>
                  <div className="text-sm font-medium text-emerald-700">🏉 Rugby</div>
                </div>
                <div className="text-2xl">🏉</div>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 SECTION IMPORT COMPLET 2024-2025 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Import Complet 2024-2025</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Import TOUT (foot + basket existant) */}
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
              <span className="font-semibold">Import EXISTANTS</span>
              <span className="text-xs opacity-90">⚽ Football + 🏀 Basketball</span>
            </button>

            {/* 🆕 Import NOUVEAUX SPORTS */}
            <button
              onClick={() => runImport('import_new_sports')}
              disabled={importing}
              className="flex flex-col items-center space-y-2 bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Flame className="w-6 h-6" />
              )}
              <span className="font-semibold">NOUVEAUX SPORTS</span>
              <span className="text-xs opacity-90">🏎️ F1 + 🥊 MMA + 🏉 Rugby</span>
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
          </div>
        </div>

        {/* 🆕 SECTION IMPORTS INDIVIDUELS NOUVEAUX SPORTS */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Import par Sport (Nouveaux)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { sport: 'f1', name: '🏎️ Formule 1', color: 'bg-red-500 hover:bg-red-600', desc: 'Grands Prix 2024-2025' },
              { sport: 'mma', name: '🥊 MMA', color: 'bg-purple-500 hover:bg-purple-600', desc: 'UFC + Bellator + ONE' },
              { sport: 'rugby', name: '🏉 Rugby', color: 'bg-emerald-500 hover:bg-emerald-600', desc: 'Top 14 + Six Nations' }
            ].map((sportInfo) => (
              <button
                key={sportInfo.sport}
                onClick={() => runImport('import_sport', sportInfo.sport)}
                disabled={importing}
                className={`${sportInfo.color} text-white p-4 rounded-lg disabled:opacity-50 transition-colors font-medium text-left`}
              >
                <div className="text-lg font-bold">{sportInfo.name}</div>
                <div className="text-sm opacity-90">{sportInfo.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section imports existants */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">⚽🏀 Sports Existants</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {[
              { sport: 'football', name: '⚽ Football', color: 'bg-green-500 hover:bg-green-600' },
              { sport: 'basketball', name: '🏀 Basketball', color: 'bg-orange-500 hover:bg-orange-600' }
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
          
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>🆕 Nouveaux Sports :</strong> Import F1, MMA et Rugby avec vraies APIs 2024-2025</p>
            <p><strong>Sports Existants :</strong> Football et Basketball déjà configurés</p>
            <p><strong>Auto-Update :</strong> Vérifie les nouveaux événements terminés (tous sports)</p>
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
                  <p className="text-xs">🆕 Clique sur "NOUVEAUX SPORTS" pour F1 + MMA + Rugby</p>
                  <p className="text-xs">⚽🏀 Clique sur "Import EXISTANTS" pour Football + Basketball</p>
                  <p className="text-xs">🔄 Clique sur "Auto-Update" pour les derniers événements</p>
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

        {/* Guide de démarrage MISE À JOUR */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Guide de Démarrage 2024-2025</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">1️⃣ Nouveaux Sports</h4>
              <p className="text-blue-700">Clique sur "NOUVEAUX SPORTS" pour importer F1, MMA et Rugby 2024-2025</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">2️⃣ Sports Existants</h4>
              <p className="text-blue-700">Clique sur "Import EXISTANTS" pour Football et Basketball déjà configurés</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">3️⃣ Profiter !</h4>
              <p className="text-blue-700">5 sports complets pour créer le vrai "Letterboxd du sport" !</p>
            </div>
          </div>
        </div>

        {/* Stats techniques MISE À JOUR */}
        {stats && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistiques Techniques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Dernière mise à jour</p>
                <p className="font-medium">{stats.lastUpdate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Sports disponibles</p>
                <p className="font-medium">5 sports complets</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Période couverte</p>
                <p className="font-medium">2024-2025</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Base de données</p>
                <p className="font-medium">PostgreSQL</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">🎉 Nouveautés 2024-2025</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>🏎️ <strong>Formule 1</strong> : Tous les Grands Prix avec résultats complets</li>
                <li>🥊 <strong>MMA</strong> : UFC, Bellator, ONE Championship avec détails combats</li>
                <li>🏉 <strong>Rugby</strong> : Top 14, Six Nations, World Cup, Champions Cup</li>
                <li>⚡ <strong>APIs réelles</strong> : Données officielles via RapidAPI</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}