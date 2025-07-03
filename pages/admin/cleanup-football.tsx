// pages/admin/cleanup-football.tsx
// 🧹 DASHBOARD NETTOYAGE FOOTBALL
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Trash2, AlertTriangle, RefreshCw, Database, 
  BarChart3, Calendar, Trophy, Target, Users,
  CheckCircle, XCircle, Eye, Clock
} from 'lucide-react'

export default function CleanupFootballDashboard() {
  const { data: session } = useSession()
  const [analyzing, setAnalyzing] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [confirmText, setConfirmText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (session) {
      analyzeDatabase()
    }
  }, [session])

  const analyzeDatabase = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/cleanup-football', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      })

      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        console.log('📊 Analyse terminée:', data.stats)
      } else {
        alert('❌ Erreur analyse: ' + JSON.stringify(data))
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error)
      alert('Erreur réseau: ' + error.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const cleanupDatabase = async () => {
    if (confirmText !== 'DELETE_ALL_FOOTBALL') {
      alert('❌ Confirmation incorrecte. Tapez exactement "DELETE_ALL_FOOTBALL"')
      return
    }

    setCleaning(true)
    try {
      const response = await fetch('/api/cleanup-football', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cleanup', 
          confirm: 'DELETE_ALL_FOOTBALL' 
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCleanupResult(data.result)
        setStats(null)
        setShowConfirm(false)
        setConfirmText('')
        alert('🎉 ' + data.message)
        
        setTimeout(() => {
          analyzeDatabase()
        }, 1000)
      } else {
        alert('❌ Erreur nettoyage: ' + JSON.stringify(data))
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error)
      alert('Erreur réseau: ' + error.message)
    } finally {
      setCleaning(false)
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
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Trash2 className="w-8 h-8 text-red-600" />
              <span>Nettoyage Base Football</span>
            </h1>
            <p className="text-gray-600 mt-2">
              🧹 Étape 1/3 : Supprimer tous les matchs football existants
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Préparer la base pour les nouveaux imports avec ton abonnement upgradé
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href="/admin/sports-dashboard-2025"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Dashboard Principal
            </Link>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 mb-2">⚠️ ATTENTION - Action irréversible</h3>
              <div className="text-red-700 space-y-1 text-sm">
                <p>• Cette action va supprimer <strong>TOUS</strong> les matchs de football</p>
                <p>• Toutes les notations, événements et statistiques seront perdus</p>
                <p>• Cette action est <strong>irréversible</strong></p>
                <p>• Assure-toi d'avoir analysé les données avant de procéder</p>
              </div>
              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                <p className="text-red-800 font-medium text-sm">
                  💡 Après nettoyage, on passera à l'étape 2 : Import des vraies compétitions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>📊 Analyse de la base actuelle</span>
            </h2>
            <button
              onClick={analyzeDatabase}
              disabled={analyzing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {analyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>Analyser la base</span>
            </button>
          </div>

          {analyzing && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Analyse en cours...</p>
            </div>
          )}

          {stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Trophy className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700">{stats.totalMatches}</div>
                  <div className="text-sm text-blue-600">Matchs Football</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">{stats.totalRatings}</div>
                  <div className="text-sm text-green-600">Notations</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-700">{stats.totalPlayerRatings}</div>
                  <div className="text-sm text-purple-600">Notes Joueurs</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <Database className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-700">{stats.totalEvents}</div>
                  <div className="text-sm text-orange-600">Événements</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Période couverte</span>
                </h3>
                <p className="text-gray-700">{stats.summary.matchesRange}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🏆 Compétitions actuelles ({stats.competitions.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stats.competitions.slice(0, 10).map((comp: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3">
                      <span className="font-medium text-gray-900">{comp.name}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                        {comp.count}
                      </span>
                    </div>
                  ))}
                </div>
                {stats.competitions.length > 10 && (
                  <p className="text-sm text-gray-500 mt-3">
                    ... et {stats.competitions.length - 10} autres compétitions
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-800 mb-3">⚠️ Problèmes détectés</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-700">Compétitions non standard</span>
                    <span className="text-yellow-800 font-bold">
                      {stats.competitions.filter((c: any) => 
                        !['Premier League', 'Ligue 1', 'La Liga', 'Serie A', 'Bundesliga', 'MLS', 'Saudi Pro League', 'Champions League', 'Europa League'].includes(c.name)
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-700">Saisons multiples</span>
                    <span className="text-yellow-800 font-bold">{stats.seasons.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-700">Statuts différents</span>
                    <span className="text-yellow-800 font-bold">{stats.statuses.length}</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-yellow-800 text-sm font-medium">
                    ✅ Raison du nettoyage : Restructurer avec les bonnes compétitions et ton nouvel abonnement API
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <span>🧹 Nettoyage complet</span>
          </h2>

          {!showConfirm ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Prêt à nettoyer la base ?
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Cette action va supprimer tous les {stats?.totalMatches || 0} matchs de football 
                et leurs données associées pour faire place aux nouveaux imports.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!stats || stats.totalMatches === 0}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Procéder au nettoyage
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Confirmation requise
                </h3>
                <p className="text-red-700 text-sm">
                  Tapez exactement <code className="bg-red-100 px-2 py-1 rounded font-mono">DELETE_ALL_FOOTBALL</code> pour confirmer
                </p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE_ALL_FOOTBALL"
                  className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={cleanupDatabase}
                    disabled={cleaning || confirmText !== 'DELETE_ALL_FOOTBALL'}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {cleaning ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Nettoyage...
                      </div>
                    ) : (
                      '🗑️ Confirmer la suppression'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm(false)
                      setConfirmText('')
                    }}
                    disabled={cleaning}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {cleanupResult && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-800">🎉 Nettoyage terminé !</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{cleanupResult.deleted.matches}</div>
                <div className="text-sm text-gray-600">Matchs supprimés</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{cleanupResult.deleted.ratings}</div>
                <div className="text-sm text-gray-600">Notations supprimées</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{cleanupResult.deleted.playerRatings}</div>
                <div className="text-sm text-gray-600">Notes joueurs supprimées</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-gray-900">{cleanupResult.deleted.events}</div>
                <div className="text-sm text-gray-600">Événements supprimés</div>
              </div>
            </div>
            
            <div className="bg-green-100 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ Base nettoyée en {cleanupResult.duration}s • Prêt pour l'étape 2 : Import des bonnes compétitions !
              </p>
              <div className="mt-3">
                <Link
                  href="/admin/new-football-import"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Passer à l'étape 2 : Nouveaux imports</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">📋 Plan complet en 3 étapes</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                cleanupResult ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                1
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">🧹 Nettoyage complet</div>
                <div className="text-sm text-gray-600">Supprimer tous les matchs football existants</div>
              </div>
              {cleanupResult ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : stats ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300"></div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                cleanupResult ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                2
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">📥 Import des bonnes compétitions</div>
                <div className="text-sm text-gray-600">
                  Ligue 1, Premier League, La Liga, Serie A, Bundesliga, MLS, Saudi Pro League, 
                  Champions League, Europa League, Coupe du Monde des Clubs, Matchs internationaux
                </div>
              </div>
              {cleanupResult ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300"></div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">⏰ Automatisation quotidienne</div>
                <div className="text-sm text-gray-600">Cron job tous les soirs à 23h45 pour importer les nouveaux matchs</div>
              </div>
              <div className="w-5 h-5 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}