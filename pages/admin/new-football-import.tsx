// pages/admin/new-football-import.tsx
// 🏆 DASHBOARD NOUVEAUX IMPORTS FOOTBALL 2025
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Trophy, Download, RefreshCw, CheckCircle, XCircle, 
  Clock, Globe, Flag, Users, Target, Zap, Crown,
  BarChart3, Calendar, MapPin, Eye, Star
} from 'lucide-react'

export default function NewFootballImportDashboard() {
  const { data: session } = useSession()
  const [testing, setTesting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  const testConnection = async () => {
    setTesting(true)
    addLog('🔍 Test de connexion au nouveau système...')

    try {
      const response = await fetch('/api/new-football-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      })

      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus(data)
        addLog('✅ ' + data.message)
        addLog(`📊 ${data.details?.totalLeagues || 0} ligues disponibles`)
        addLog(`⚡ ${data.details?.rateLimitRemaining || 0} requêtes restantes`)
      } else {
        setConnectionStatus(data)
        addLog('❌ ' + data.message)
        if (data.recommendations) {
          data.recommendations.forEach((rec: string) => addLog(`   ${rec}`))
        }
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
      setConnectionStatus({ success: false, message: error.message })
    } finally {
      setTesting(false)
    }
  }

  const startImport = async () => {
    setImporting(true)
    addLog('🚀 DÉMARRAGE IMPORT COMPLET FOOTBALL 2025...')
    addLog('🎯 Import de toutes les compétitions ciblées')

    try {
      const response = await fetch('/api/new-football-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_all_competitions' })
      })

      const data = await response.json()
      
      if (data.success) {
        setImportResult(data.result)
        addLog('🎉 ' + data.message)
        addLog(`📊 RÉSULTATS: ${data.summary.totalMatches} matchs importés`)
        addLog(`🏆 ${data.summary.competitions} compétitions traitées`)
        addLog(`⏱️ Durée: ${data.summary.duration}`)
        addLog(`📅 Période: ${data.summary.dateRange.start} → ${data.summary.dateRange.end}`)
        
        if (data.details?.byCompetition) {
          addLog('🏆 Top compétitions:')
          data.details.byCompetition.slice(0, 3).forEach((comp: any) => {
            addLog(`   ${comp.name}: ${comp.imported} matchs`)
          })
        }
        
        if (data.nextSteps) {
          addLog('📋 Prochaines étapes:')
          data.nextSteps.forEach((step: string) => addLog(`   ${step}`))
        }
      } else {
        addLog('❌ Erreur import: ' + data.error)
        if (data.troubleshooting) {
          addLog('🛠️ Solutions:')
          data.troubleshooting.forEach((tip: string) => addLog(`   ${tip}`))
        }
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Configuration des compétitions
  const competitions = {
    'Ligues Européennes TOP 5': [
      { name: 'Premier League', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 1, country: 'Angleterre' },
      { name: 'Ligue 1', emoji: '🇫🇷', priority: 1, country: 'France' },
      { name: 'La Liga', emoji: '🇪🇸', priority: 1, country: 'Espagne' },
      { name: 'Serie A', emoji: '🇮🇹', priority: 1, country: 'Italie' },
      { name: 'Bundesliga', emoji: '🇩🇪', priority: 1, country: 'Allemagne' }
    ],
    'Ligues Internationales': [
      { name: 'MLS', emoji: '🇺🇸', priority: 2, country: 'États-Unis' },
      { name: 'Saudi Pro League', emoji: '🇸🇦', priority: 2, country: 'Arabie Saoudite' },
      { name: 'Eredivisie', emoji: '🇳🇱', priority: 3, country: 'Pays-Bas' }
    ],
    'Compétitions Européennes': [
      { name: 'UEFA Champions League', emoji: '🏆', priority: 1, country: 'Europe' },
      { name: 'UEFA Europa League', emoji: '🥈', priority: 2, country: 'Europe' },
      { name: 'UEFA Conference League', emoji: '🥉', priority: 3, country: 'Europe' },
      { name: 'UEFA Nations League', emoji: '🌍', priority: 2, country: 'Europe' }
    ],
    'Compétitions Mondiales': [
      { name: 'FIFA World Cup', emoji: '🏆', priority: 1, country: 'Monde' },
      { name: 'FIFA Club World Cup', emoji: '🌐', priority: 2, country: 'Monde' },
      { name: 'UEFA European Championship', emoji: '🇪🇺', priority: 1, country: 'Europe' }
    ],
    'Équipes Nationales': [
      { name: 'France National Team', emoji: '🇫🇷', priority: 1, country: 'International' },
      { name: 'England National Team', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 2, country: 'International' },
      { name: 'Spain National Team', emoji: '🇪🇸', priority: 2, country: 'International' },
      { name: 'Germany National Team', emoji: '🇩🇪', priority: 2, country: 'International' },
      { name: 'Brazil National Team', emoji: '🇧🇷', priority: 2, country: 'International' },
      { name: 'Argentina National Team', emoji: '🇦🇷', priority: 2, country: 'International' }
    ]
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <span>Nouveaux Imports Football 2025</span>
            </h1>
            <p className="text-gray-600 mt-2">
              🏆 Étape 2/3 : Import des bonnes compétitions avec abonnement upgradé
            </p>
            <p className="text-sm text-gray-500 mt-1">
              15+ compétitions • 3 derniers mois • Équipes nationales • Coupes européennes
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/admin/cleanup-football"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Étape 1
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voir l'app
            </Link>
          </div>
        </div>

        {/* Status de connexion */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🔌 Test de connexion</h2>
            <button
              onClick={testConnection}
              disabled={testing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>Tester API Football</span>
            </button>
          </div>

          {connectionStatus && (
            <div className={`p-4 rounded-lg border-2 ${
              connectionStatus.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                {connectionStatus.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <span className="font-medium text-lg">{connectionStatus.message}</span>
              </div>
              
              {connectionStatus.success && connectionStatus.details && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{connectionStatus.details.totalLeagues}</div>
                    <div className="text-sm text-green-700">Ligues disponibles</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{connectionStatus.details.rateLimitRemaining}</div>
                    <div className="text-sm text-blue-700">Requêtes restantes</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">300</div>
                    <div className="text-sm text-purple-700">Requêtes/minute max</div>
                  </div>
                </div>
              )}

              {connectionStatus.recommendations && (
                <div className="mt-4 text-sm">
                  {connectionStatus.recommendations.map((rec: string, index: number) => (
                    <div key={index} className={`mb-1 ${
                      connectionStatus.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration des compétitions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🏆 Compétitions à importer</h2>
          
          <div className="space-y-6">
            {Object.entries(competitions).map(([category, comps]) => (
              <div key={category} className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>{category}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                    {comps.length}
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {comps.map((comp, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-2xl">{comp.emoji}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{comp.name}</div>
                        <div className="text-sm text-gray-600">{comp.country}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        comp.priority === 1 ? 'bg-red-100 text-red-800' :
                        comp.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        P{comp.priority}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">📋 Stratégie d'import</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <p>• <strong>P1 (Rouge)</strong> : Compétitions prioritaires - Importées en premier</p>
              <p>• <strong>P2 (Jaune)</strong> : Compétitions importantes - Importées ensuite</p>
              <p>• <strong>P3 (Vert)</strong> : Compétitions bonus - Importées si quotas suffisants</p>
              <p>• <strong>Période</strong> : 3 derniers mois + 1 mois à venir</p>
              <p>• <strong>Équipes nationales</strong> : 50 derniers matchs par équipe</p>
            </div>
          </div>
        </div>

        {/* Section d'import */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🚀 Import des données</h2>

          {!importing ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Prêt à importer toutes les compétitions ?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Cette action va importer tous les matchs des 15+ compétitions configurées 
                pour les 3 derniers mois. Avec ton abonnement upgradé, ça devrait prendre 
                quelques minutes.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">15+</div>
                  <div className="text-sm text-gray-600">Compétitions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">~3000</div>
                  <div className="text-sm text-gray-600">Matchs estimés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-sm text-gray-600">Mois de données</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">6</div>
                  <div className="text-sm text-gray-600">Équipes nationales</div>
                </div>
              </div>

              <button
                onClick={startImport}
                disabled={!connectionStatus?.success}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                🚀 Démarrer l'import complet
              </button>
              
              {!connectionStatus?.success && (
                <p className="text-red-600 text-sm mt-3">
                  ⚠️ Testez d'abord la connexion API avant d'importer
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Import en cours...
              </h3>
              <p className="text-gray-600 mb-4">
                Import des 15+ compétitions avec ton abonnement upgradé
              </p>
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  ⏱️ Peut prendre 3-5 minutes selon le nombre de matchs
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Résultats de l'import */}
        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-bold text-green-800">🎉 Import terminé avec succès !</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{importResult.totalImported}</div>
                <div className="text-sm text-gray-600">Matchs importés</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{importResult.competitionsProcessed}</div>
                <div className="text-sm text-gray-600">Compétitions</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{Math.floor(importResult.duration / 60)}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{importResult.totalSkipped}</div>
                <div className="text-sm text-gray-600">Déjà existants</div>
              </div>
            </div>

            {/* Top compétitions */}
            {importResult.byCompetition && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">🏆 Top compétitions importées</h4>
                <div className="space-y-2">
                  {importResult.byCompetition
                    .filter((comp: any) => comp.imported > 0)
                    .sort((a: any, b: any) => b.imported - a.imported)
                    .slice(0, 5)
                    .map((comp: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{comp.competition}</span>
                      <span className="font-bold text-blue-600">{comp.imported} matchs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-green-100 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-3">
                ✅ Import terminé ! Prochaines étapes :
              </p>
              <div className="space-y-2 text-green-700 text-sm">
                <Link href="/" className="block hover:underline">
                  🏠 Voir la page d'accueil avec les nouveaux matchs
                </Link>
                <Link href="/search" className="block hover:underline">
                  🔍 Tester la recherche de matchs
                </Link>
                <p>⏰ Configurer l'automatisation quotidienne (étape 3)</p>
              </div>
            </div>
          </div>
        )}

        {/* Logs temps réel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>📋 Logs temps réel</span>
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <Eye className="w-8 h-8 mx-auto mb-4" />
                <p className="mb-4">Aucune activité récente</p>
                <div className="space-y-2 text-xs">
                  <p>🔍 Testez d'abord la connexion API</p>
                  <p>🚀 Puis lancez l'import complet</p>
                  <p>📊 Les logs apparaîtront ici en temps réel</p>
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
                      log.includes('🎉') ? 'text-yellow-400' :
                      log.includes('📊') ? 'text-purple-400' :
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

        {/* Prochaines étapes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">📋 Plan complet en 3 étapes</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">🧹 Nettoyage complet</div>
                <div className="text-sm text-gray-600">Suppression des anciens matchs ✅</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                importResult ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                2
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">📥 Import des bonnes compétitions</div>
                <div className="text-sm text-gray-600">
                  15+ compétitions avec abonnement upgradé
                  {importResult && ` • ${importResult.totalImported} matchs importés ✅`}
                </div>
              </div>
              {importResult ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600" />
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                importResult ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                3
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">⏰ Automatisation quotidienne</div>
                <div className="text-sm text-gray-600">Cron job 23h45 pour nouveaux matchs</div>
              </div>
              {importResult ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300"></div>
              )}
            </div>
          </div>
          
          {importResult && (
            <div className="mt-6 p-4 bg-blue-100 rounded-lg">
              <p className="text-blue-800 font-medium">
                🎉 Étape 2 terminée ! Prêt pour l'automatisation quotidienne
              </p>
              <Link
                href="/admin/automation-setup"
                className="inline-flex items-center space-x-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Clock className="w-4 h-4" />
                <span>Configurer l'automatisation →</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}