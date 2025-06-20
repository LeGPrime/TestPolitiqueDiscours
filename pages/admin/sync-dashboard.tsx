import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  RefreshCw, Play, Clock, Database, Trophy, 
  Calendar, BarChart3
} from 'lucide-react'

export default function SyncDashboard() {
  const { data: session } = useSession()
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/matches?type=recent&limit=100')
      const data = await response.json()
      
      // Calculer les stats par sport
      const matches = data.matches || []
      const footballMatches = matches.filter((m: any) => 
        ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League'].includes(m.competition)
      )
      const basketballMatches = matches.filter((m: any) => 
        ['NBA', 'EuroLeague'].includes(m.competition)
      )
      const tennisMatches = matches.filter((m: any) => 
        ['ATP Masters', 'WTA'].includes(m.competition)
      )

      setStats({
        total: matches.length,
        football: footballMatches.length,
        basketball: basketballMatches.length,
        tennis: tennisMatches.length,
        lastUpdate: new Date().toLocaleString()
      })
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const runAutoImport = async () => {
    setImporting(true)
    addLog('🚀 Démarrage import multi-sports...')

    try {
      const response = await fetch('/api/auto-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        addLog('✅ Import réussi !')
        addLog(`📊 ${data.imported} nouveaux matchs importés`)
        addLog(`🏆 Sports: ${data.sports?.join(', ')}`)
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

  const runSync = async () => {
    setSyncing(true)
    addLog('🔄 Synchronisation des matchs live...')

    try {
      const response = await fetch('/api/cron/sync-matches', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer footrate_secret_key_2024',
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        addLog('✅ Sync réussie !')
        addLog(`📊 Vérifiés: ${data.checked || 0}, Mis à jour: ${data.updated || 0}`)
      } else {
        addLog('❌ Erreur sync: ' + JSON.stringify(data))
      }
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`)
    } finally {
      setSyncing(false)
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
              <span>Multi-Sports Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Football • Basketball • Tennis - Import et synchronisation automatiques
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/admin/import"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Import Historique
            </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Matchs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Trophy className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">⚽ Football</p>
                  <p className="text-3xl font-bold text-green-600">{stats.football}</p>
                </div>
                <div className="text-2xl">⚽</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">🏀 Basketball</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.basketball}</p>
                </div>
                <div className="text-2xl">🏀</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">🎾 Tennis</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.tennis}</p>
                </div>
                <div className="text-2xl">🎾</div>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contrôles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={runAutoImport}
              disabled={importing}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span>{importing ? 'Import en cours...' : 'Import Multi-Sports'}</span>
            </button>

            <button
              onClick={runSync}
              disabled={syncing}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{syncing ? 'Sync en cours...' : 'Sync Live'}</span>
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p><strong>Import Multi-Sports :</strong> Ajoute de nouveaux matchs de foot, basket et tennis</p>
            <p><strong>Sync Live :</strong> Met à jour le statut des matchs en cours</p>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Logs Temps Réel</span>
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500">
                <p className="text-sm italic mb-4">
                  Aucune activité récente
                </p>
                <div className="space-y-2">
                  <p className="text-xs">🚀 Clique sur "Import Multi-Sports" pour ajouter des matchs</p>
                  <p className="text-xs">🔄 Clique sur "Sync Live" pour mettre à jour les statuts</p>
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
      </div>
    </div>
  )
}