import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CheckCircle, XCircle, Play, Loader } from 'lucide-react'

export default function TestAPI() {
  const { data: session } = useSession()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testConnection = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
      } else {
        setError(data.error || 'Erreur inconnue')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testYesterdayMatches = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_yesterday' })
      })

      const data = await response.json()
      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 Test API-Sports</h1>
          
          <div className="space-y-4 mb-8">
            <button
              onClick={testConnection}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Tester la connexion</span>
            </button>

            <button
              onClick={testYesterdayMatches}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Tester matchs d'hier</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">Erreur</span>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
            </div>
          )}

          {results && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">Résultats</span>
              </div>
              <pre className="text-sm bg-white p-4 rounded border overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}