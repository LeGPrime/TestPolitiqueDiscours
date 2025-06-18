import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Trophy, Download, Play, Pause, CheckCircle, 
  AlertCircle, BarChart3, Clock, Database, RefreshCw
} from 'lucide-react'
import axios from 'axios'

interface ImportStatus {
  quota: {
    used: number
    remaining: number
    total: number
  }
  phases: Array<{
    league: number
    season: number
    name: string
  }>
  imported: Array<{
    competition: string
    season: string
    _count: { id: number }
  }>
  totalPhases: number
}

export default function ImportDashboard() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<ImportStatus | null>(null)
  const [importing, setImporting] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [autoImport, setAutoImport] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await axios.post('/api/import/historical', {
        action: 'status'
      })
      setStatus(response.data)
    } catch (error) {
      console.error('Erreur fetch status:', error)
    }
  }

  const importPhase = async (phaseIndex: number) => {
    if (!status || importing) return

    setImporting(true)
    addLog(`🚀 Début import phase ${phaseIndex + 1}/${status.totalPhases}`)

    try {
      const response = await axios.post('/api/import/historical', {
        action: 'import_phase',
        phase: phaseIndex
      })

      if (response.data.success) {
        addLog(`✅ Phase ${phaseIndex + 1} terminée: ${response.data.imported} matchs importés`)
        
        // Auto-passer à la phase suivante si activé
        if (autoImport && response.data.nextPhase !== null) {
          setTimeout(() => {
            setCurrentPhase(response.data.nextPhase)
            importPhase(response.data.nextPhase)
          }, 2000) // Pause 2 sec entre phases
        } else {
          setImporting(false)
        }
      } else {
        addLog(`❌ Erreur phase ${phaseIndex + 1}`)
        setImporting(false)
      }

      await fetchStatus() // Refresh status
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.response?.data?.error || error.message}`)
      setImporting(false)
    }
  }

  const importDaily = async () => {
    setImporting(true)
    addLog('📅 Import quotidien en cours...')

    try {
      const response = await axios.post('/api/import/historical', {
        action: 'import_daily'
      })

      if (response.data.success) {
        addLog(`✅ Import quotidien terminé: ${response.data.imported} nouveaux matchs`)
      }

      await fetchStatus()
    } catch (error: any) {
      addLog(`❌ Erreur import quotidien: ${error.response?.data?.error || error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const startAutoImport = () => {
    setAutoImport(true)
    setCurrentPhase(0)
    importPhase(0)
  }

  const stopAutoImport = () => {
    setAutoImport(false)
    setImporting(false)
    addLog('⏸️ Import automatique arrêté')
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
              <span>Import Historique</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Récupération progressive des matchs européens (Plan FREE)
            </p>
          </div>
          
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Retour à l'app
          </Link>
        </div>

        {status && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quota Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Quota API</span>
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Utilisé aujourd'hui</span>
                    <span className="text-sm font-medium">
                      {status.quota.used}/{status.quota.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status.quota.used > 80 ? 'bg-red-500' : 
                        status.quota.used > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(status.quota.used / status.quota.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {status.quota.remaining}
                    </div>
                    <div className="text-sm text-green-700">Restantes</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {status.imported.reduce((sum, item) => sum + item._count.id, 0)}
                    </div>
                    <div className="text-sm text-blue-700">Matchs importés</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Contrôles</span>
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={importDaily}
                  disabled={importing || status.quota.remaining < 1}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Import Quotidien</span>
                </button>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Import historique automatique :</p>
                  
                  {!autoImport ? (
                    <button
                      onClick={startAutoImport}
                      disabled={importing || status.quota.remaining < 1}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span>Démarrer Auto-Import</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopAutoImport}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Arrêter Auto-Import</span>
                    </button>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Import manuel par phase :</p>
                  <select
                    value={currentPhase}
                    onChange={(e) => setCurrentPhase(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md mb-3"
                    disabled={importing}
                  >
                    {status.phases.map((phase, index) => (
                      <option key={index} value={index}>
                        Phase {index + 1}: {phase.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => importPhase(currentPhase)}
                    disabled={importing || status.quota.remaining < 1}
                    className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Importer Phase</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress & Logs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Activité</span>
              </h2>
              
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Progression globale</span>
                  <span className="text-sm font-medium">
                    {status.imported.length}/{status.totalPhases} phases
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(status.imported.length / status.totalPhases) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Logs */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Logs temps réel :</h3>
                <div className="bg-gray-50 rounded-lg p-3 h-40 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucune activité récente</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-gray-700">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Summary */}
        {status && status.imported.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Résumé des imports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {status.imported.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{item.competition}</h3>
                  <p className="text-sm text-gray-600">Saison {item.season}</p>
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    {item._count.id} matchs
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
