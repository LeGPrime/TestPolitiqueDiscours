import { useState } from 'react'
import axios from 'axios'

export default function RugbyImportInterface() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const executeRugbyAction = async (action: string) => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      console.log(`🏉 Exécution action rugby: ${action}`)
      
      const response = await axios.post('/api/rugby-import', { action })
      
      if (response.data.success) {
        setResults(response.data)
        console.log('✅ Action rugby réussie:', response.data)
      } else {
        setError(response.data.error || 'Erreur inconnue')
      }
    } catch (error: any) {
      console.error('❌ Erreur action rugby:', error)
      setError(error.response?.data?.error || error.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Rugby */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            🏉
          </div>
          <div>
            <h1 className="text-3xl font-bold">Import Rugby 2025</h1>
            <p className="text-green-100">Top 14, Champions Cup, Six Nations & Internationaux</p>
          </div>
        </div>
      </div>

      {/* Actions Rugby */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Test Connexion */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              🔍
            </div>
            <h3 className="text-lg font-bold text-gray-900">Test Connexion</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Vérifier l'accès à l'API Rugby et les compétitions disponibles
          </p>
          <button
            onClick={() => executeRugbyAction('test_connection')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
          >
            {loading ? '🔄 Test...' : '🔍 Tester API Rugby'}
          </button>
        </div>

        {/* Import Complet */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              🏉
            </div>
            <h3 className="text-lg font-bold text-gray-900">Import 2025</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Importer tous les matchs rugby depuis janvier 2025
          </p>
          <button
            onClick={() => executeRugbyAction('import_rugby_2025')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50"
          >
            {loading ? '🔄 Import...' : '🏉 Import Rugby 2025'}
          </button>
        </div>

        {/* Import Quotidien */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              📅
            </div>
            <h3 className="text-lg font-bold text-gray-900">Import Quotidien</h3>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            Mettre à jour les matchs récents (test du cron)
          </p>
          <button
            onClick={() => executeRugbyAction('import_daily_rugby')}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-all font-medium disabled:opacity-50"
          >
            {loading ? '🔄 Sync...' : '📅 Sync Quotidien'}
          </button>
        </div>
      </div>

      {/* Compétitions Cibles */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-200">
        <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center space-x-2">
          <span>🎯</span>
          <span>Compétitions Rugby Ciblées</span>
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Compétitions Domestiques */}
          <div className="bg-white/60 rounded-xl p-4">
            <h3 className="font-bold text-green-700 mb-2 flex items-center space-x-1">
              <span>🇫🇷</span>
              <span>Domestiques</span>
            </h3>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• Top 14</li>
              <li>• Gallagher Premiership</li>
            </ul>
          </div>
          
          {/* Compétitions Européennes */}
          <div className="bg-white/60 rounded-xl p-4">
            <h3 className="font-bold text-green-700 mb-2 flex items-center space-x-1">
              <span>🏆</span>
              <span>Européennes</span>
            </h3>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• Champions Cup</li>
              <li>• United Rugby Championship</li>
            </ul>
          </div>
          
          {/* Compétitions Internationales */}
          <div className="bg-white/60 rounded-xl p-4">
            <h3 className="font-bold text-green-700 mb-2 flex items-center space-x-1">
              <span>🌍</span>
              <span>Internationales</span>
            </h3>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• Six Nations</li>
              <li>• Rugby Championship</li>
              <li>• Tests internationaux</li>
            </ul>
          </div>
          
          {/* Période */}
          <div className="bg-white/60 rounded-xl p-4">
            <h3 className="font-bold text-green-700 mb-2 flex items-center space-x-1">
              <span>📅</span>
              <span>Période</span>
            </h3>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• Saison 2025</li>
              <li>• Depuis janvier 2025</li>
              <li>• Matchs terminés uniquement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Zone de Chargement */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xl">🏉</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Import Rugby en cours...</h3>
          <p className="text-gray-600">
            Récupération des matchs depuis l'API Rugby. Cela peut prendre quelques minutes.
          </p>
          <div className="mt-4 bg-green-50 rounded-lg p-3">
            <p className="text-green-700 text-sm">
              💡 L'import inclut automatiquement les logos des équipes et les détails des matchs
            </p>
          </div>
        </div>
      )}

      {/* Zone d'Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              ❌
            </div>
            <h3 className="text-lg font-bold text-red-800">Erreur d'Import Rugby</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          
          <div className="bg-red-100 rounded-lg p-4">
            <h4 className="font-bold text-red-800 mb-2">🔧 Solutions possibles :</h4>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Vérifiez votre clé RAPIDAPI_KEY dans .env</li>
              <li>• Assurez-vous d'être abonné à une API Rugby sur RapidAPI</li>
              <li>• Les APIs rugby peuvent nécessiter un plan premium</li>
              <li>• Vérifiez que votre quota n'est pas dépassé</li>
            </ul>
          </div>
        </div>
      )}

      {/* Zone de Résultats */}
      {results && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Header de résultats */}
          <div className={`p-6 text-white ${
            results.success 
              ? 'bg-gradient-to-r from-green-600 to-green-700' 
              : 'bg-gradient-to-r from-red-600 to-red-700'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{results.success ? '✅' : '❌'}</span>
              <div>
                <h3 className="text-xl font-bold">{results.message}</h3>
                <p className="text-white/90">Action: {results.action}</p>
              </div>
            </div>
          </div>

          {/* Contenu des résultats */}
          <div className="p-6">
            {/* Test de connexion */}
            {results.action === 'test_connection' && results.details && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.details.totalLeagues}</div>
                    <div className="text-blue-700 text-sm">Ligues totales</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{results.details.rugbyLeagues}</div>
                    <div className="text-green-700 text-sm">Ligues rugby</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.details.targetCompetitions}</div>
                    <div className="text-purple-700 text-sm">Compétitions cibles</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">2025</div>
                    <div className="text-orange-700 text-sm">Saison ciblée</div>
                  </div>
                </div>

                {results.details.examples && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-2">🏉 Exemples de ligues trouvées :</h4>
                    <ul className="text-gray-700 space-y-1">
                      {results.details.examples.map((example: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Import complet */}
            {results.action === 'import_rugby_2025' && results.summary && (
              <div className="space-y-6">
                {/* Stats principales */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{results.summary.totalMatches}</div>
                    <div className="text-green-700 font-medium">Matchs importés</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{results.summary.competitions?.length || 0}</div>
                    <div className="text-blue-700 font-medium">Compétitions</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {results.summary.breakdown?.errors || 0}
                    </div>
                    <div className="text-purple-700 font-medium">Erreurs</div>
                  </div>
                </div>

                {/* Breakdown détaillé */}
                {results.summary.breakdown && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3">📊 Détail de l'import :</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">✅ Importés :</span>
                        <span className="font-bold text-green-600">{results.summary.breakdown.imported}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">⚠️ Ignorés :</span>
                        <span className="font-bold text-orange-600">{results.summary.breakdown.skipped}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">❌ Erreurs :</span>
                        <span className="font-bold text-red-600">{results.summary.breakdown.errors}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exemples de matchs */}
                {results.summary.examples && results.summary.examples.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-bold text-green-800 mb-3">🏉 Exemples de matchs importés :</h4>
                    <ul className="space-y-2">
                      {results.summary.examples.slice(0, 5).map((example: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2 text-green-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="font-medium">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Compétitions importées */}
                {results.competitions && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-3">🏆 Compétitions par catégorie :</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {results.competitions.domestic && (
                        <div>
                          <h5 className="font-bold text-blue-700 mb-1">🇫🇷 Domestiques :</h5>
                          <ul className="text-blue-600 space-y-1">
                            {results.competitions.domestic.map((comp: string, index: number) => (
                              <li key={index}>• {comp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {results.competitions.international && (
                        <div>
                          <h5 className="font-bold text-blue-700 mb-1">🌍 Internationales :</h5>
                          <ul className="text-blue-600 space-y-1">
                            {results.competitions.international.map((comp: string, index: number) => (
                              <li key={index}>• {comp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import quotidien */}
            {results.action === 'import_daily_rugby' && results.result && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{results.result.imported}</div>
                    <div className="text-green-700 text-sm">Nouveaux matchs</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.result.updated}</div>
                    <div className="text-blue-700 text-sm">Matchs mis à jour</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{results.result.errors}</div>
                    <div className="text-red-700 text-sm">Erreurs</div>
                  </div>
                </div>
              </div>
            )}

            {/* Prochaines étapes */}
            {results.nextSteps && (
              <div className="bg-yellow-50 rounded-lg p-4 mt-6">
                <h4 className="font-bold text-yellow-800 mb-3">🚀 Prochaines étapes :</h4>
                <ul className="space-y-2">
                  {results.nextSteps.map((step: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 text-yellow-700">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommandations */}
            {results.recommendations && (
              <div className="bg-indigo-50 rounded-lg p-4 mt-4">
                <h4 className="font-bold text-indigo-800 mb-3">💡 Recommandations :</h4>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 text-indigo-700">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <h3 className="font-bold text-gray-800 mb-2">ℹ️ À propos de l'import Rugby</h3>
        <p className="text-gray-600 text-sm mb-4">
          L'import rugby récupère automatiquement les matchs depuis janvier 2025 pour les principales compétitions.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          <span>🏉 Rugby optimisé</span>
          <span>📅 Saison 2025</span>
          <span>🏆 Compétitions élite</span>
          <span>⚡ Import rapide</span>
        </div>
      </div>
    </div>
  )
}