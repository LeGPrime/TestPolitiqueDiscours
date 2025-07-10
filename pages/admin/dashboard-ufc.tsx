import { useState } from 'react'
import axios from 'axios'

export default function SimpleUFCDashboard() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')

  const executeAction = async (action: string) => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      console.log(`Action: ${action}`)
      
      const response = await axios.post('/api/ufc-import', { action })
      
      setResults(response.data)
      console.log('Résultat:', response.data)
    } catch (error: any) {
      console.error('Erreur:', error)
      setError(error.response?.data?.error || error.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Import UFC Simple</h1>

      {/* 2 boutons seulement */}
      <div className="space-y-4 mb-8">
        <button
          onClick={() => executeAction('test_connection')}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded font-medium disabled:opacity-50"
        >
          {loading ? '⏳ Test...' : '🔍 Tester API UFC'}
        </button>

        <button
          onClick={() => executeAction('import_ufc_2025')}
          disabled={loading}
          className="w-full bg-red-600 text-white py-4 px-6 rounded font-medium disabled:opacity-50"
        >
          {loading ? '⏳ Import...' : '🥊 Importer Combats UFC'}
        </button>

        <button
          onClick={() => executeAction('debug_api_response')}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-4 px-6 rounded font-medium disabled:opacity-50"
        >
          {loading ? '⏳ Debug...' : '🧪 Debug API (voir réponses brutes)'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Résultats */}
      {results && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">
            {results.success ? '✅ Succès' : '❌ Échec'}: {results.message}
          </h3>
          
          {/* Test connexion */}
          {results.action === 'test_connection' && results.details && (
            <div>
              <p><strong>API:</strong> {results.details.endpoint}</p>
              <p><strong>Quota:</strong> {results.details.quota}</p>
              <p><strong>Tests:</strong> {JSON.stringify(results.details.tests)}</p>
            </div>
          )}

          {/* Import */}
          {results.action === 'import_ufc_2025' && results.summary && (
            <div>
              <p><strong>Combats importés:</strong> {results.summary.totalCombats}</p>
              <p><strong>Trouvés:</strong> {results.summary.verification}</p>
              <p><strong>Erreurs:</strong> {results.summary.breakdown?.errors || 0}</p>
              
              {results.summary.examples && results.summary.examples.length > 0 && (
                <div className="mt-2">
                  <strong>Exemples:</strong>
                  <ul className="list-disc ml-6">
                    {results.summary.examples.slice(0, 5).map((ex: string, i: number) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.summary.diagnostics && (
                <div className="mt-2">
                  <strong>Diagnostic:</strong>
                  <ul className="list-disc ml-6 text-sm">
                    {results.summary.diagnostics.slice(-5).map((diag: string, i: number) => (
                      <li key={i}>{diag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Debug */}
          {results.action === 'debug_api_response' && results.results && (
            <div>
              <p><strong>Tests réussis:</strong> {results.summary.successful}/{results.summary.total}</p>
              
              <div className="mt-2 space-y-2">
                {results.results.map((test: any, i: number) => (
                  <div key={i} className="border p-2 rounded">
                    <strong>{test.test}:</strong> {test.success ? '✅' : '❌'}
                    {test.success && (
                      <div className="text-sm">
                        Type: {test.dataType}, Count: {test.count}, Has Data: {test.hasData ? 'Oui' : 'Non'}
                      </div>
                    )}
                    {!test.success && <div className="text-red-600 text-sm">{test.error}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quota */}
          {results.quota && (
            <div className="mt-4 p-3 bg-yellow-100 rounded">
              <strong>Quota:</strong> {results.quota.used}/{results.quota.limit} ({results.quota.percentage}%)
            </div>
          )}

          {/* Données brutes (pour debug) */}
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">Voir données brutes</summary>
            <pre className="bg-black text-green-400 p-3 rounded mt-2 text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}