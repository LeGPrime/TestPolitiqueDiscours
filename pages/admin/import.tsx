// pages/admin/import.tsx
// 🎯 DASHBOARD SIMPLE POUR IMPORTS

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function ImportDashboard() {
  const { data: session } = useSession()
  const [importing, setImporting] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 10)])
  }

  const runImport = async (sport: string) => {
    setImporting(sport)
    addLog(`🚀 Import ${sport.toUpperCase()} démarré...`)

    try {
      const response = await fetch('/api/import-real-sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        addLog(`✅ ${data.message}`)
        addLog(`📊 Résultat: ${data.imported}/${data.total} événements`)
      } else {
        addLog(`❌ Erreur: ${data.error}`)
      }
    } catch (error: any) {
      addLog(`❌ Erreur réseau: ${error.message}`)
    } finally {
      setImporting(null)
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

  const sports = [
    { 
      id: 'football', 
      name: 'Football', 
      emoji: '⚽', 
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Premier League, Ligue 1, La Liga...' 
    },
    { 
      id: 'basketball', 
      name: 'Basketball', 
      emoji: '🏀', 
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'NBA 2024-2025' 
    },
    { 
      id: 'f1', 
      name: 'Formule 1', 
      emoji: '🏎️', 
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Saison F1 2024' 
    },
    { 
      id: 'mma', 
      name: 'MMA', 
      emoji: '🥊', 
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'UFC (données exemple)' 
    },
    { 
      id: 'rugby', 
      name: 'Rugby', 
      emoji: '🏉', 
      color: 'bg-emerald-500 hover:bg-emerald-600',
      description: 'Six Nations, Top 14 (données exemple)' 
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Import Sports 2025</h1>
            <p className="text-gray-600 mt-1">
              Importer les données réelles sport par sport
            </p>
          </div>
          
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Retour App
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Instructions</h3>
          <div className="text-blue-800 text-sm space-y-1">
            <p>• <strong>Football & Basketball</strong> : Données réelles via API</p>
            <p>• <strong>F1</strong> : Données réelles F1 2024</p>
            <p>• <strong>MMA & Rugby</strong> : Données exemple (en attendant vraies APIs)</p>
            <p>• Assure-toi que <code className="bg-blue-100 px-1 rounded">RAPIDAPI_KEY</code> est dans ton .env</p>
          </div>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sports.map((sport) => (
            <div key={sport.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl">{sport.emoji}</div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{sport.name}</h3>
                  <p className="text-sm text-gray-600">{sport.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => runImport(sport.id)}
                disabled={importing !== null}
                className={`w-full px-4 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${sport.color}`}
              >
                {importing === sport.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Import en cours...</span>
                  </div>
                ) : (
                  `Importer ${sport.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Logs d'Import</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm italic">Aucune activité récente</p>
                <p className="text-xs mt-2">Clique sur un sport pour commencer l'import</p>
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

        {/* Aide */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">🔧 Après l'import</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>1. Va sur <Link href="/" className="text-blue-600 hover:text-blue-700">l'accueil</Link> pour voir les événements</p>
            <p>2. Vérifie que les filtres par sport affichent les bons compteurs</p>
            <p>3. Teste la notation d'un événement</p>
            <p>4. Ouvre <code className="bg-gray-200 px-1 rounded">npx prisma studio</code> pour voir la base</p>
          </div>
        </div>
      </div>
    </div>
  )
}