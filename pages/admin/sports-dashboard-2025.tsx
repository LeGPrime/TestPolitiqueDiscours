// pages/admin/sports-dashboard-2025.tsx
// Dashboard sports amélioré avec diagnostics et imports fonctionnels + F1

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

import {
  RefreshCw, Play, Clock, Database, Trophy, 
  Zap, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff,
  Car // ← AJOUTÉ POUR F1
} from 'lucide-react'

export default function SportsDashboard2025() {
  const { data: session } = useSession()
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  // 🏁 NOUVEAUX STATES POUR F1
  const [testingF1, setTestingF1] = useState(false)
  const [importingF1, setImportingF1] = useState(false)
  const [f1ConnectionStatus, setF1ConnectionStatus] = useState<any>(null)
  const [f1ImportResult, setF1ImportResult] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/matches?limit=1000&sport=all')
      const data = await response.json()
      
      const matches = data.matches || []
      const sportStats = {
        football: matches.filter((m: any) => m.sport === 'football').length,
        basketball: matches.filter((m: any) => m.sport === 'basketball').length,
        f1: matches.filter((m: any) => m.sport === 'F1').length, // ← AJOUTÉ F1
        total: matches.length
      }

      setStats({
        ...sportStats,
        lastUpdate: new Date().toLocaleString(),
        bySport: data.stats?.bySport || []
      })
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    addLog('🔍 Test de connexion aux APIs...')

    try {
      const response = await fetch('/api/import-sports-2025', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setConnectionStatus(data.results)
        addLog('✅ Test de connexion terminé !')
        addLog(`⚽ Football API: ${data.results.football ? '✅ OK' : '❌ Erreur'}`)
        addLog(`🏀 Basketball API: ${data.results.basketball ? '✅ OK' : '❌ Erreur'}`)
        
        if (data.recommendations) {
          addLog('📋 Recommandations:')
          addLog(`   ${data.recommendations.football}`)
          addLog(`   ${data.recommendations.basketball}`)
        }
      } else {
        addLog('❌ Erreur test: ' + JSON.stringify(data))
        setConnectionStatus({ football: false, basketball: false })
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
      setConnectionStatus({ football: false, basketball: false })
    } finally {
      setTestingConnection(false)
    }
  }

  const runImport = async (action: string, sport?: string) => {
    setImporting(true)
    addLog(`🚀 Démarrage ${action}${sport ? ` (${sport})` : ''}...`)

    try {
      const response = await fetch('/api/import-sports-2025', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sport })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        addLog('✅ Import réussi !')
        
        if (data.result) {
          addLog(`📊 Résultats COMPLETS:`)
          addLog(`  ⚽ Football: ${data.result.football?.imported || 0} matchs`)
          addLog(`  🏀 Basketball: ${data.result.basketball?.imported || 0} matchs`)
          addLog(`  📊 TOTAL: ${data.result.total || 0}`)
          addLog(`  ⏱️ Durée: ${data.result.duration}s`)
        } else {
          addLog(`📊 ${data.imported || 0} événements importés`)
          addLog(`🏆 Sport: ${data.sport || sport}`)
          if (data.examples) {
            addLog(`🎯 Exemples: ${data.examples.slice(0, 2).join(', ')}`)
          }
        }
        
        // Actualiser les stats
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

  // 🏁 NOUVELLES FONCTIONS POUR F1
  const testF1Connection = async () => {
    setTestingF1(true)
    addLog('🔍 Test connexion F1 (OpenF1)...')

    try {
      const response = await fetch('/api/test-f1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      })

      const data = await response.json()
      
      if (data.success) {
        setF1ConnectionStatus({ success: true, message: data.message, details: data.data })
        addLog('✅ ' + data.message)
      } else {
        setF1ConnectionStatus({ success: false, message: data.message })
        addLog('❌ ' + data.message)
      }
    } catch (error: any) {
      setF1ConnectionStatus({ success: false, message: error.message })
      addLog('❌ Erreur F1: ' + error.message)
    } finally {
      setTestingF1(false)
    }
  }

  const importF1Data = async () => {
    setImportingF1(true)
    addLog('🏁 Import F1 2025 démarré...')

    try {
      const response = await fetch('/api/test-f1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_f1_2025_only' })
      })

      const data = await response.json()
      
      if (data.success) {
        setF1ImportResult(data.data)
        addLog(`✅ ${data.message}`)
        addLog(`📊 2025: ${data.data.imported} importés, ${data.data.skipped} ignorés`)
        if (data.data.examples.length > 0) {
          addLog(`🎯 Exemples: ${data.data.examples.slice(0, 2).join(', ')}`)
        }
        // Actualiser les stats
        await fetchStats()
      } else {
        addLog('❌ ' + data.message)
      }
    } catch (error: any) {
      addLog('❌ Erreur F1: ' + error.message)
    } finally {
      setImportingF1(false)
    }
  }

  const importF1Complete = async () => {
    setImportingF1(true)
    addLog('🏁 Import F1 COMPLET démarré (2024 + 2025)...')

    try {
      const response = await fetch('/api/test-f1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_f1_complete' })
      })

      const data = await response.json()
      
      if (data.success) {
        setF1ImportResult(data.data)
        addLog(`✅ ${data.message}`)
        addLog(`📊 COMPLET: ${data.data.imported} importés, ${data.data.skipped} ignorés`)
        if (data.data.examples.length > 0) {
          addLog(`🎯 Exemples: ${data.data.examples.slice(0, 3).join(', ')}`)
        }
        // Actualiser les stats
        await fetchStats()
      } else {
        addLog('❌ ' + data.message)
      }
    } catch (error: any) {
      addLog('❌ Erreur F1 COMPLET: ' + error.message)
    } finally {
      setImportingF1(false)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 24)])
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
              <span>Dashboard Sports 2025 + F1</span> {/* ← MODIFIÉ */}
            </h1>
            <p className="text-gray-600 mt-1">
              ⚽ Football • 🏀 Basketball • 🏁 F1 • APIs en temps réel {/* ← MODIFIÉ */}
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

        {/* Stats Cards - MODIFIÉ DE 3 À 4 COLONNES */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> {/* ← MODIFIÉ */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm font-medium text-gray-700">Total Événements</div>
                </div>
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.football}</div>
                  <div className="text-sm font-medium text-green-700">⚽ Football</div>
                  <div className="text-xs text-gray-500">Premier League, Ligue 1...</div>
                </div>
                <div className="text-2xl">⚽</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.basketball}</div>
                  <div className="text-sm font-medium text-orange-700">🏀 Basketball</div>
                  <div className="text-xs text-gray-500">NBA, EuroLeague</div>
                </div>
                <div className="text-2xl">🏀</div>
              </div>
            </div>

            {/* 🏁 NOUVELLE CARD F1 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.f1}</div>
                  <div className="text-sm font-medium text-red-700">🏁 Formule 1</div>
                  <div className="text-xs text-gray-500">OpenF1 gratuit</div>
                </div>
                <Car className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🔌 État des Connexions API</h2>
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
              <span>Tester Connexions</span>
            </button>
          </div>

          {connectionStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.football 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">⚽ API Football</span>
                  {connectionStatus.football ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {connectionStatus.details?.football?.status === 'OK' 
                    ? `✅ Connecté - ${connectionStatus.details.football.leagues} ligues`
                    : `❌ ${connectionStatus.details?.football?.error || 'Non connecté'}`
                  }
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                connectionStatus.basketball 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">🏀 API Basketball</span>
                  {connectionStatus.basketball ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {connectionStatus.details?.basketball?.status === 'OK' 
                    ? `✅ Connecté - ${connectionStatus.details.basketball.leagues} ligues`
                    : `❌ ${connectionStatus.details?.basketball?.error || 'Non connecté'}`
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <WifiOff className="w-8 h-8 mx-auto mb-2" />
              <p>Cliquez sur "Tester Connexions" pour vérifier les APIs</p>
            </div>
          )}
        </div>

        {/* 🏁 NOUVELLE SECTION F1 - AJOUTÉE ICI */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Car className="w-6 h-6 text-red-600" />
            <span>🏁 Test Formule 1 (OpenF1 - Gratuit)</span>
          </h2>

          {/* Status de connexion F1 */}
          {f1ConnectionStatus && (
            <div className={`p-4 rounded-lg border-2 mb-4 ${
              f1ConnectionStatus.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {f1ConnectionStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{f1ConnectionStatus.message}</span>
              </div>
              {f1ConnectionStatus.details && (
                <div className="mt-2 text-sm text-gray-600">
                  📊 {f1ConnectionStatus.details.meetings} Grands Prix disponibles
                </div>
              )}
            </div>
          )}

          {/* Résultat import F1 */}
          {f1ImportResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-800 mb-2">📊 Résultat Import F1</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-green-600">{f1ImportResult.imported}</div>
                  <div className="text-green-700">Importés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{f1ImportResult.skipped}</div>
                  <div className="text-gray-700">Ignorés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{f1ImportResult.errors}</div>
                  <div className="text-red-700">Erreurs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{f1ImportResult.examples.length}</div>
                  <div className="text-blue-700">Exemples</div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action F1 */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={testF1Connection}
              disabled={testingF1}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testingF1 ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Car className="w-4 h-4" />
              )}
              <span>Tester F1</span>
            </button>

            <button
              onClick={importF1Data}
              disabled={importingF1 || !f1ConnectionStatus?.success}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {importingF1 ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Car className="w-4 h-4" />
              )}
              <span>Import F1 2025</span>
            </button>

            <button
              onClick={importF1Complete}
              disabled={importingF1 || !f1ConnectionStatus?.success}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {importingF1 ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Car className="w-4 h-4" />
              )}
              <span>Import F1 COMPLET</span>
            </button>
          </div>

          {/* Info F1 */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <div className="font-medium text-yellow-800 mb-1">💡 À propos de F1</div>
            <ul className="text-yellow-700 space-y-1">
              <li>• OpenF1 est <strong>100% gratuit</strong> (pas de clé requise)</li>
              <li>• <strong>F1 2025</strong> : Seulement la saison 2025</li>
              <li>• <strong>F1 COMPLET</strong> : 2024 + 2025 (tous les Grands Prix !)</li>
              <li>• Compatible avec ton schéma de base existant</li>
              <li>• Sessions: Practice, Qualifying, Sprint, Race</li>
            </ul>
          </div>
        </div>

        {/* Import Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🚀 Import de Données 2025</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Import Complet */}
            <button
              onClick={() => runImport('import_all')}
              disabled={importing || !connectionStatus?.football}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Trophy className="w-8 h-8" />
              )}
              <span className="font-semibold text-lg">Import Complet</span>
              <span className="text-sm opacity-90">⚽ Football + 🏀 Basketball</span>
              <span className="text-xs opacity-75">Saison 2024-2025</span>
            </button>

            {/* Import Football */}
            <button
              onClick={() => runImport('import_sport', 'football')}
              disabled={importing || !connectionStatus?.football}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <span className="text-3xl">⚽</span>
              )}
              <span className="font-semibold">Football Seul</span>
              <span className="text-sm opacity-90">Premier League, Ligue 1...</span>
            </button>

            {/* Import Basketball */}
            <button
              onClick={() => runImport('import_sport', 'basketball')}
              disabled={importing || !connectionStatus?.basketball}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <span className="text-3xl">🏀</span>
              )}
              <span className="font-semibold">Basketball Seul</span>
              <span className="text-sm opacity-90">NBA, EuroLeague</span>
            </button>

            {/* Import Quotidien */}
            <button
              onClick={() => runImport('import_daily')}
              disabled={importing}
              className="flex flex-col items-center space-y-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {importing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
              <span className="font-semibold">Import Quotidien</span>
              <span className="text-sm opacity-90">Matchs d'aujourd'hui</span>
            </button>
          </div>

          {/* Aide et statut */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">💡 Aide Import</p>
                <ul className="text-yellow-700 space-y-1">
                  <li>• <strong>Test Connexions</strong> : Vérifiez vos APIs avant import</li>
                  <li>• <strong>Import Complet</strong> : Importe tout Football + Basketball 2025</li>
                  <li>• <strong>Import Quotidien</strong> : Seulement les nouveaux matchs d'aujourd'hui</li>
                  <li>• <strong>F1 Séparé</strong> : Test F1 dans sa section dédiée (gratuit !)</li>
                  <li>• <strong>Problème ?</strong> : Vérifiez RAPIDAPI_KEY dans .env</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Logs temps réel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Logs Temps Réel</span>
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <Clock className="w-8 h-8 mx-auto mb-4" />
                <p className="mb-4">Aucune activité récente</p>
                <div className="space-y-2 text-xs">
                  <p>🔍 Testez vos connexions API</p>
                  <p>🏁 Testez F1 (gratuit, sans clé !)</p>
                  <p>🚀 Lancez un import pour voir les logs</p>
                  <p>📊 Les données apparaîtront en temps réel</p>
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

        {/* Configuration et aide */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuration</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">RAPIDAPI_KEY</span>
                <span className={`font-mono ${process.env.RAPIDAPI_KEY ? 'text-green-600' : 'text-red-600'}`}>
                  {process.env.RAPIDAPI_KEY ? '✅ Configurée' : '❌ Manquante'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base de données</span>
                <span className="text-green-600">✅ PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sports disponibles</span>
                <span className="text-blue-600">⚽ Football, 🏀 Basketball, 🏁 F1</span> {/* ← MODIFIÉ */}
              </div>
            </div>
          </div>

          {/* Aide rapide */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🆘 Aide Rapide</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-700">APIs manquantes ?</p>
                <p className="text-gray-600">Inscrivez-vous sur RapidAPI et abonnez-vous aux APIs gratuites</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">F1 ne marche pas ?</p>
                <p className="text-gray-600">OpenF1 est gratuit et sans clé - vérifiez votre connexion</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Erreur 401 ?</p>
                <p className="text-gray-600">Vérifiez votre RAPIDAPI_KEY dans .env</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Quota dépassé ?</p>
                <p className="text-gray-600">Attendez 24h ou upgrader votre plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats techniques */}
        {stats && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistiques Techniques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Dernière MAJ</p>
                <p className="font-medium">{stats.lastUpdate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Période</p>
                <p className="font-medium">2024-2025</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">APIs</p>
                <p className="font-medium">RapidAPI + OpenF1</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600">Version</p>
                <p className="font-medium">2025.1 + F1</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}