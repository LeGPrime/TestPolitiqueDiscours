import { useState, useEffect } from 'react'
import axios from 'axios'

export default function MMADebugPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  const checkMMAImports = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.get('/api/debug-mma-imports')
      setData(response.data.data)
      console.log('Debug MMA:', response.data)
    } catch (error: any) {
      console.error('Erreur debug:', error)
      setError(error.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkMMAImports()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug MMA Imports</h1>

      <button
        onClick={checkMMAImports}
        disabled={loading}
        className="bg-blue-600 text-white py-2 px-4 rounded mb-6 disabled:opacity-50"
      >
        {loading ? '⏳ Vérification...' : '🔍 Vérifier les imports MMA'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Stats générales */}
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">📊 Statistiques de la base</h3>
            <p><strong>Total combats:</strong> {data.totalMatches}</p>
            <p><strong>Combats MMA:</strong> {data.mmaCount}</p>
            
            <div className="mt-2">
              <strong>Sports présents:</strong>
              <ul className="list-disc ml-6">
                {data.sportStats.map((stat: any) => (
                  <li key={stat.sport}>
                    <strong>{stat.sport}:</strong> {stat._count.sport} combats
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Analyse */}
          <div className={`p-4 rounded ${data.mmaCount > 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <h3 className="font-bold mb-2">🔍 Analyse</h3>
            <ul className="list-disc ml-6">
              {data.analysis.possibleIssues.map((issue: string, i: number) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>

          {/* Combats MMA récents */}
          {data.recentMMAMatches && data.recentMMAMatches.length > 0 && (
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-bold mb-2">🥊 Derniers combats MMA importés</h3>
              <div className="space-y-2">
                {data.recentMMAMatches.map((match: any) => (
                  <div key={match.id} className="border p-3 rounded bg-white">
                    <div className="font-medium">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>Sport: {match.sport}</span> • 
                      <span>Compétition: {match.competition}</span> • 
                      <span>Date: {new Date(match.date).toLocaleDateString()}</span> • 
                      <span>Status: {match.status}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {match.id} • Créé: {new Date(match.createdAt).toLocaleString()}
                    </div>
                    {match.homeScore !== null && match.awayScore !== null && (
                      <div className="text-sm font-medium text-green-600">
                        Score: {match.homeScore} - {match.awayScore}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solutions */}
          <div className="bg-yellow-50 p-4 rounded">
            <h3 className="font-bold mb-2">🔧 Solutions possibles</h3>
            
            {data.mmaCount === 0 ? (
              <ul className="list-disc ml-6 space-y-1">
                <li>Aucun combat MMA n'a été importé - relancez l'import UFC</li>
                <li>Vérifiez que l'API fonctionne avec le debug</li>
                <li>Vérifiez les logs serveur pour les erreurs d'import</li>
              </ul>
            ) : (
              <ul className="list-disc ml-6 space-y-1">
                <li>Les combats MMA sont bien en base ({data.mmaCount} trouvés)</li>
                <li>Le problème vient de l'interface de filtrage</li>
                <li>Vérifiez que votre page d'accueil filtre bien sur sport: 'MMA'</li>
                <li>Vérifiez que votre enum Sport inclut 'MMA' dans Prisma</li>
                <li>Redémarrez votre serveur Next.js</li>
              </ul>
            )}
          </div>

          {/* Données brutes */}
          <details className="bg-gray-50 p-4 rounded">
            <summary className="cursor-pointer font-medium">Voir toutes les données brutes</summary>
            <pre className="bg-black text-green-400 p-3 rounded mt-2 text-xs overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}