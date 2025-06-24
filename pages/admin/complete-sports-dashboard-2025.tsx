// pages/admin/complete-sports-dashboard-2025.tsx
// Dashboard complet avec Football, Basketball, F1, MMA et Rugby

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  RefreshCw, Play, Clock, Database, Trophy, 
  Zap, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff,
  Car, Users, Shield, Gamepad2
} from 'lucide-react'

interface ConnectionStatus {
  football: boolean
  basketball: boolean
  f1: boolean
  mma: boolean
  rugby: boolean
  details: {
    football?: any
    basketball?: any
    f1?: any
    mma?: any
    rugby?: any
  }
}

interface Stats {
  football: number
  basketball: number
  f1: number
  mma: number
  rugby: number
  total: number
  lastUpdate: string
  bySport?: any[]
}

export default function CompleteSportsDashboard2025() {
  const { data: session } = useSession()
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/matches?limit=2000&sport=all')
      const data = await response.json()
      
      const matches = data.matches || []
      const sportStats: Stats = {
        football: matches.filter((m: any) => m.sport === 'FOOTBALL').length,
        basketball: matches.filter((m: any) => m.sport === 'BASKETBALL').length,
        f1: matches.filter((m: any) => m.sport === 'F1').length,
        mma: matches.filter((m: any) => m.sport === 'MMA').length,
        rugby: matches.filter((m: any) => m.sport === 'RUGBY').length,
        total: matches.length,
        lastUpdate: new Date().toLocaleString(),
        bySport: data.stats?.bySport || []
      }

      setStats(sportStats)
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    addLog('🔍 Test de connexion aux 5 APIs...')

    try {
      const response = await fetch('/api/import-complete-sports-2025', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_all_connections' })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setConnectionStatus(data.results)
        addLog('✅ Test de connexion terminé !')
        addLog(`⚽ Football API: ${data.results.football ? '✅ OK' : '❌ Erreur'}`)
        addLog(`🏀 Basketball API: ${data.results.basketball ? '✅ OK' : '❌ Erreur'}`)
        addLog(`🏁 F1 API (OpenF1): ${data.results.f1 ? '✅ OK' : '❌ Erreur'}`)
        addLog(`🥊 MMA API: ${data.results.mma ? '✅ OK' : '❌ Erreur'}`)
        addLog(`🏉 Rugby API: ${data.results.rugby ? '✅ OK' : '❌ Erreur'}`)
        
        if (data.recommendations) {
          addLog('📋 Recommandations:')
          Object.entries(data.recommendations).forEach(([sport, rec]: [string, any]) => {
            addLog(`   ${sport}: ${rec}`)
          })
        }
      } else {
        addLog('❌ Erreur test: ' + JSON.stringify(data))
        setConnectionStatus({ 
          football: false, 
          basketball: false, 
          f1: false, 
          mma: false, 
          rugby: false,
          details: {}
        })
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
      setConnectionStatus({ 
        football: false, 
        basketball: false, 
        f1: false, 
        mma: false, 
        rugby: false,
        details: {}
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const runImport = async (action: string, sport?: string) => {
    setImporting(true)
    addLog(`🚀 Démarrage ${action}${sport ? ` (${sport})` : ''}...`)

    try {
      const response = await fetch('/api/import-complete-sports-2025', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sport })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        addLog('✅ Import réussi !')
        
        if (data.result && action === 'import_all_sports') {
          addLog(`📊 Résultats COMPLETS:`)
          addLog(`  ⚽ Football: ${data.result.football?.imported || 0} matchs`)
          addLog(`  🏀 Basketball: ${data.result.basketball?.imported || 0} matchs`)
          addLog(`  🏁 F1: ${data.result.f1?.imported || 0} événements`)
          addLog(`  🥊 MMA: ${data.result.mma?.imported || 0} combats`)
          addLog(`  🏉 Rugby: ${data.result.rugby?.imported || 0} matchs`)
          addLog(`  📊 TOTAL: ${data.result.total || 0}`)
          addLog(`  ⏱️ Durée: ${Math.floor(data.result.duration / 60)}min ${data.result.duration % 60}s`)
        } else {
          addLog(`📊 ${data.imported || 0} événements importés`)
          addLog(`🏆 Sport: ${data.sport || sport}`)
          if (data.examples) {
            addLog(`🎯 Exemples: ${data.examples.slice(0, 2).join(', ')}`)
          }
        }
        
        await fetchStats()
      } else {
        addLog('❌ Erreur import: ' + JSON.stringify(data))
        if (data.troubleshooting) {
          addLog('🛠️ Solutions:')
          data.troubleshooting.forEach((tip: string) => addLog(`   • ${tip}`))
        }
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 29)])
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
              <span>Dashboard Sports Complet 2025</span>
            </h1>
            <p className="text-gray-600 mt-1">
              ⚽ Football • 🏀 Basketball • 🏁 F1 • 🥊 MMA • 🏉 Rugby
            </p>
            <p className="text-sm text-gray-500 mt-1">
              5 sports, APIs en temps réel, données complètes 2025
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

        {/* Stats Cards - 5 Sports */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            
            {/* Total */}
            <div className="bg-white rounded-xl shadow-lg p-6 col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm font-medium text-gray-700">Total Événements</div>
                </div>
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            {/* Football */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-green-600">{stats.football}</div>
                  <div className="text-sm font-medium text-green-700">⚽ Football</div>
                  <div className="text-xs text-gray-500">11 compétitions</div>
                </div>
                <div className="text-2xl">⚽</div>
              </div>
            </div>

            {/* Basketball */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-orange-600">{stats.basketball}</div>
                  <div className="text-sm font-medium text-orange-700">🏀 Basketball</div>
                  <div className="text-xs text-gray-500">NBA, EuroLeague</div>
                </div>
                <div className="text-2xl">🏀</div>
              </div>
            </div>

            {/* F1 */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-red-600">{stats.f1}</div>
                  <div className="text-sm font-medium text-red-700">🏁 Formule 1</div>
                  <div className="text-xs text-gray-500">Saison 2025</div>
                </div>
                <Car className="w-5 h-5 text-red-600" />
              </div>
            </div>

            {/* MMA */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-purple-600">{stats.mma}</div>
                  <div className="text-sm font-medium text-purple-700">🥊 MMA</div>
                  <div className="text-xs text-gray-500">UFC, Bellator</div>
                </div>
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            {/* Rugby */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-indigo-600">{stats.rugby}</div>
                  <div className="text-sm font-medium text-indigo-700">🏉 Rugby</div>
                  <div className="text-xs text-gray-500">Six Nations</div>
                </div>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        )}

        {/* Connection Status - 5 APIs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🔌 État des 5 APIs</h2>
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testingConnection ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              <span>Tester Toutes les APIs</span>
            </button>
          </div>

          {connectionStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* Football */}
              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.football 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">⚽ Football</span>
                  {connectionStatus.football ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {connectionStatus.details?.football?.status === 'OK' 
                    ? `✅ ${connectionStatus.details.football.leagues} ligues`
                    : `❌ Erreur API`
                  }
                </div>
              </div>

              {/* Basketball */}
              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.basketball 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">🏀 Basketball</span>
                  {connectionStatus.basketball ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {connectionStatus.details?.basketball?.status === 'OK' 
                    ? `✅ ${connectionStatus.details.basketball.leagues} ligues`
                    : `❌ Erreur API`
                  }
                </div>
              </div>

              {/* F1 */}
              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.f1 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">🏁 F1</span>
                  {connectionStatus.f1 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {connectionStatus.details?.f1?.status === 'OK' 
                    ? `✅ OpenF1 - ${connectionStatus.details.f1.meetings} GPs`
                    : `❌ OpenF1 indisponible`
                  }
                </div>
              </div>

              {/* MMA */}
              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.mma 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">🥊 MMA</span>
                  {connectionStatus.mma ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {connectionStatus.details?.mma?.status === 'OK' 
                    ? `✅ ${connectionStatus.details.mma.leagues} ligues`
                    : `❌ Erreur API`
                  }
                </div>
              </div>

              {/* Rugby */}
              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.rugby 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">🏉 Rugby</span>
                  {connectionStatus.rugby ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {connectionStatus.details?.rugby?.status === 'OK' 
                    ? `✅ ${connectionStatus.details.rugby.leagues} ligues`
                    : `❌ Erreur API`
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <WifiOff className="w-8 h-8 mx-auto mb-2" />
              <p>Cliquez sur "Tester Toutes les APIs" pour vérifier les connexions</p>
            </div>
          )}
        </div>

        {/* Import Controls - 5 Sports */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🚀 Import de Données 2025 - 5 Sports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            
            {/* Import Complet TOUS SPORTS */}
            <div className="md:col-span-2 lg:col-span-3">
              <button
                onClick={() => runImport('import_all_sports')}
                disabled={importing}
                className="w-full flex flex-col items-center space-y-3 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white p-8 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-red-700 disabled:opacity-50 transition-all"
              >
                {importing ? (
                  <RefreshCw className="w-10 h-10 animate-spin" />
                ) : (
                  <Trophy className="w-10 h-10" />
                )}
                <span className="font-bold text-2xl">Import Complet - 5 Sports</span>
                <span className="text-lg opacity-90">⚽ Football + 🏀 Basketball + 🏁 F1 + 🥊 MMA + 🏉 Rugby</span>
                <span className="text-sm opacity-75">Saison complète 2024-2025</span>
              </button>
            </div>

            {/* Import Sports individuels */}
            <button
              onClick={() => runImport('import_sport', 'football')}
              disabled={importing}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
            >
              <span className="text-3xl">⚽</span>
              <span className="font-semibold">Football</span>
              <span className="text-sm opacity-90">11 compétitions</span>
            </button>

            <button
              onClick={() => runImport('import_sport', 'basketball')}
              disabled={importing}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 transition-all"
            >
              <span className="text-3xl">🏀</span>
              <span className="font-semibold">Basketball</span>
              <span className="text-sm opacity-90">NBA, EuroLeague</span>
            </button>

            <button
              onClick={() => runImport('import_sport', 'f1')}
              disabled={importing}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-xl hover:from-red-600 hover:to-pink-700 disabled:opacity-50 transition-all"
            >
              <Car className="w-6 h-6" />
              <span className="font-semibold">Formule 1</span>
              <span className="text-sm opacity-90">OpenF1 gratuit</span>
            </button>

            <button
              onClick={() => runImport('import_sport', 'mma')}
              disabled={importing}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              <Shield className="w-6 h-6" />
              <span className="font-semibold">MMA</span>
              <span className="text-sm opacity-90">UFC, Bellator</span>
            </button>

            <button
              onClick={() => runImport('import_sport', 'rugby')}
              disabled={importing}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-6 rounded-xl hover:from-indigo-600 hover:to-blue-700 disabled:opacity-50 transition-all"
            >
              <Users className="w-6 h-6" />
              <span className="font-semibold">Rugby</span>
              <span className="text-sm opacity-90">Six Nations, Top 14</span>
            </button>
          </div>

          {/* Aide rapide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-2">💡 Guide API - 5 Sports</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
                  <div>
                    <p className="font-medium mb-1">APIs RapidAPI (4/5 sports) :</p>
                    <ul className="space-y-1 text-xs">
                      <li>• ⚽ Football : API-Sports</li>
                      <li>• 🏀 Basketball : API-Sports</li>
                      <li>• 🥊 MMA : API-Sports</li>
                      <li>• 🏉 Rugby : API-Sports</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">API Gratuite (1/5 sports) :</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 🏁 F1 : OpenF1 (pas de clé requise)</li>
                      <li>• ✅ Données temps réel</li>
                      <li>• ✅ Historique complet</li>
                      <li>• ✅ Pas de limites</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs temps réel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Logs Temps Réel - 5 Sports</span>
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <Clock className="w-8 h-8 mx-auto mb-4" />
                <p className="mb-4">Aucune activité récente</p>
                <div className="space-y-2 text-xs">
                  <p>🔍 Testez vos 5 APIs</p>
                  <p>🚀 Lancez un import pour voir les logs</p>
                  <p>📊 Import complet recommandé pour débuter</p>
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
                      log.includes('📊') ? 'text-yellow-400' :
                      log.includes('🏁') ? 'text-red-400' :
                      log.includes('🥊') ? 'text-purple-400' :
                      log.includes('🏉') ? 'text-indigo-400' :
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

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🏆 SportRate Dashboard 2025 - Intégration Complète 5 Sports</p>
          <p className="mt-1">
            ⚽ Football • 🏀 Basketball • 🏁 F1 • 🥊 MMA • 🏉 Rugby
          </p>
        </div>
      </div>
    </div>
  )
}