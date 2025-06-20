#!/bin/bash

# 🚀 FootRate - Installation automatisation temps réel
echo "🚀 Installation de l'automatisation temps réel pour FootRate..."
echo "📦 Création des fichiers nécessaires..."

# 1. Créer la route API pour le cron de synchronisation
mkdir -p pages/api/cron
cat > pages/api/cron/sync-matches.ts << 'SYNCEOF'
import { NextApiRequest, NextApiResponse } from 'next'
import { apiSportsService } from '../../../lib/football-api'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sécurité : vérifier l'authentification
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Synchronisation automatique démarrée...')
    
    // Récupérer les matchs potentiellement terminés
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    
    const activeMatches = await prisma.match.findMany({
      where: {
        status: { in: ['LIVE', '1H', '2H', 'HT', 'ET', 'BT'] },
        date: { gte: threeHoursAgo }
      },
      orderBy: { date: 'desc' },
      take: 10 // Limiter pour économiser le quota
    })

    let updatedCount = 0
    let checkedCount = 0

    console.log(`📊 ${activeMatches.length} matchs actifs à vérifier`)

    // Vérifier chaque match individuellement
    for (const match of activeMatches) {
      try {
        checkedCount++
        
        // Récupérer le statut actuel via l'API
        const response = await fetch(`https://${process.env.RAPIDAPI_HOST}/v3/fixtures?id=${match.apiMatchId}`, {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
          }
        })

        if (!response.ok) {
          console.log(`⚠️ Erreur API pour match ${match.id}`)
          continue
        }

        const data = await response.json()
        const apiMatch = data.response[0]

        if (!apiMatch) continue

        const isFinished = apiMatch.fixture.status.short === 'FT'
        const newStatus = apiMatch.fixture.status.short

        // Mettre à jour si le statut a changé
        if (match.status !== newStatus) {
          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: newStatus,
              homeScore: apiMatch.goals.home,
              awayScore: apiMatch.goals.away,
            }
          })

          updatedCount++
          console.log(`✅ Match mis à jour: ${match.homeTeam} vs ${match.awayTeam} - Status: ${newStatus}`)

          // Si le match vient de se terminer, déclencher les notifications
          if (isFinished && match.status !== 'FT') {
            await triggerMatchEndedNotifications(match.id)
          }
        }

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`❌ Erreur lors de la vérification du match ${match.id}:`, error)
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        checked: checkedCount,
        updated: updatedCount,
        quota: apiSportsService.getQuotaStatus()
      }
    }

    console.log('✅ Synchronisation terminée:', result.stats)
    res.status(200).json(result)

  } catch (error) {
    console.error('❌ Erreur générale de synchronisation:', error)
    res.status(500).json({ 
      error: 'Sync failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function triggerMatchEndedNotifications(matchId: string) {
  try {
    console.log(`🔔 Match ${matchId} terminé - prêt pour notation !`)
    
    await prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() }
    })
    
  } catch (error) {
    console.error('❌ Erreur notifications:', error)
  }
}
SYNCEOF

# 2. Créer la page dashboard admin
mkdir -p pages/admin
cat > pages/admin/sync-dashboard.tsx << 'DASHEOF'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  RefreshCw, Play, Clock, CheckCircle, 
  AlertTriangle, BarChart3, Database, TrendingUp
} from 'lucide-react'
import axios from 'axios'

export default function SyncDashboard() {
  const { data: session } = useSession()
  const [syncing, setSyncing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const runManualSync = async () => {
    setSyncing(true)
    addLog('🚀 Démarrage synchronisation manuelle...')

    try {
      const response = await fetch('/api/cron/sync-matches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test'}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        addLog('✅ Synchronisation réussie !')
        addLog(`📊 Stats: ${JSON.stringify(data.stats)}`)
      } else {
        addLog('❌ Erreur synchronisation')
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Database className="w-8 h-8" />
              <span>Sync Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Monitoring et contrôle de la synchronisation temps réel
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contrôles</h2>
          
          <button
            onClick={runManualSync}
            disabled={syncing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{syncing ? 'Synchronisation...' : 'Sync Manuel'}</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Logs Temps Réel</span>
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune activité récente</p>
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
DASHEOF

# 3. Créer GitHub Actions
mkdir -p .github/workflows
cat > .github/workflows/sync-matches.yml << 'GHEOF'
name: 🔄 Sync Live Matches

on:
  schedule:
    - cron: '*/2 14-23 * * *'  # Toutes les 2 minutes pendant les heures de match
    - cron: '*/5 0-13 * * *'   # Toutes les 5 minutes le reste du temps
  
  workflow_dispatch:

jobs:
  sync-matches:
    runs-on: ubuntu-latest
    
    steps:
      - name: 🔄 Synchroniser les matchs
        run: |
          echo "🚀 Démarrage sync FootRate..."
          
          response=$(curl -s -w "%{http_code}" \
            -X POST "${{ secrets.VERCEL_URL }}/api/cron/sync-matches" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json")
          
          http_code="${response: -3}"
          body="${response%???}"
          
          if [ "$http_code" -eq 200 ]; then
            echo "✅ Synchronisation réussie !"
            echo "$body"
          else
            echo "❌ Erreur synchronisation (HTTP $http_code)"
            echo "$body"
            exit 1
          fi
GHEOF

# 4. Créer le hook pour notifications
mkdir -p hooks
cat > hooks/useMatchNotifications.ts << 'HOOKEOF'
import { useEffect, useState } from 'react'

interface MatchNotification {
  type: 'match_ended'
  matchId: string
  message: string
  timestamp: number
}

export function useMatchNotifications() {
  const [notifications, setNotifications] = useState<MatchNotification[]>([])
  
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/matches?type=recent&limit=5')
        const data = await response.json()
        
        const recentFinished = data.matches?.filter((match: any) => 
          match.status === 'FINISHED' && 
          new Date(match.updatedAt) > new Date(Date.now() - 2 * 60 * 1000)
        )

        if (recentFinished?.length > 0) {
          recentFinished.forEach((match: any) => {
            const notification: MatchNotification = {
              type: 'match_ended',
              matchId: match.id,
              message: `${match.homeTeam} vs ${match.awayTeam} terminé !`,
              timestamp: Date.now()
            }

            setNotifications(prev => [notification, ...prev.slice(0, 9)])

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⚽ Match terminé !', {
                body: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
                icon: '/favicon.ico',
                tag: `match-${match.id}`,
              })
            }
          })
        }
      } catch (error) {
        console.error('Erreur notifications:', error)
      }
    }

    const interval = setInterval(checkForUpdates, 30000)
    checkForUpdates()

    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    clearNotifications: () => setNotifications([]),
    removeNotification: (timestamp: number) => {
      setNotifications(prev => prev.filter(n => n.timestamp !== timestamp))
    },
    hasNewNotifications: notifications.length > 0
  }
}
HOOKEOF

# 5. Créer le composant notifications
mkdir -p components
cat > components/MatchNotifications.tsx << 'COMPEOF'
import { useState } from 'react'
import { Bell, X, Clock } from 'lucide-react'
import { useMatchNotifications } from '../hooks/useMatchNotifications'

export default function MatchNotifications() {
  const { notifications, clearNotifications, removeNotification, hasNewNotifications } = useMatchNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {hasNewNotifications && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b flex items-center justify-between"><h3 className="font-semibold text-gray-900">Notifications</h3>
           {notifications.length > 0 && (
             <button
               onClick={clearNotifications}
               className="text-sm text-blue-600 hover:text-blue-700"
             >
               Tout effacer
             </button>
           )}
         </div>

         <div className="max-h-64 overflow-y-auto">
           {notifications.length === 0 ? (
             <div className="p-4 text-center text-gray-500">
               <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
               <p className="text-sm">Aucune nouvelle notification</p>
             </div>
           ) : (
             <div className="divide-y divide-gray-100">
               {notifications.map((notification) => (
                 <div key={notification.timestamp} className="p-4 hover:bg-gray-50">
                   <div className="flex items-start justify-between">
                     <div className="flex-1">
                       <p className="text-sm font-medium text-gray-900">
                         {notification.message}
                       </p>
                       <div className="flex items-center mt-1 text-xs text-gray-500">
                         <Clock className="w-3 h-3 mr-1" />
                         {new Date(notification.timestamp).toLocaleTimeString('fr-FR')}
                       </div>
                     </div>
                     <button
                       onClick={() => removeNotification(notification.timestamp)}
                       className="ml-2 text-gray-400 hover:text-gray-600"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>
     )}

     {isOpen && (
       <div
         className="fixed inset-0 z-40"
         onClick={() => setIsOpen(false)}
       />
     )}
   </div>
 )
}
COMPEOF

# 6. Ajouter les méthodes à l'API football
cat >> lib/football-api.ts << 'APIEOF'

 // Récupérer un match spécifique par ID
 async getFixtureById(fixtureId: number): Promise<APISportsMatch[]> {
   return this.makeRequest('/fixtures', {
     id: fixtureId,
     timezone: 'Europe/Paris'
   })
 }

 // Récupérer les matchs live actuels
 async getLiveMatches(): Promise<APISportsMatch[]> {
   return this.makeRequest('/fixtures', {
     live: 'all',
     timezone: 'Europe/Paris'
   })
 }
APIEOF

# 7. Ajouter les variables d'environnement
CRON_SECRET=$(openssl rand -hex 32)
echo "" >> .env
echo "# 🔄 Automatisation Sync" >> .env
echo "CRON_SECRET=\"$CRON_SECRET\"" >> .env

# 8. Créer script de test
cat > test-automation.sh << 'TESTEOF'
#!/bin/bash

echo "🧪 Test de l'automatisation FootRate"

if [ -z "$RAPIDAPI_KEY" ] || [ -z "$CRON_SECRET" ]; then
   echo "❌ Variables d'environnement manquantes"
   echo "Assure-toi que RAPIDAPI_KEY et CRON_SECRET sont définis dans .env"
   exit 1
fi

echo "✅ Variables d'environnement OK"
echo "�� Démarre le serveur et teste la sync..."

npm run dev &
SERVER_PID=$!

sleep 10

echo "📡 Test de l'endpoint de sync..."
response=$(curl -s -o /dev/null -w "%{http_code}" \
 -X POST "http://localhost:3000/api/cron/sync-matches" \
 -H "Authorization: Bearer $CRON_SECRET" \
 -H "Content-Type: application/json")

if [ "$response" -eq 200 ]; then
   echo "✅ Endpoint de synchronisation fonctionnel !"
else
   echo "❌ Erreur endpoint (HTTP $response)"
fi

kill $SERVER_PID

echo "🎉 Tests terminés !"
echo ""
echo "🚀 PROCHAINES ÉTAPES :"
echo "1. npm run dev"
echo "2. Va sur http://localhost:3000/admin/sync-dashboard"
echo "3. Teste le bouton 'Sync Manuel'"
echo "4. Déploie sur Vercel et configure GitHub Actions"
TESTEOF

chmod +x test-automation.sh

# 9. Créer script de monitoring
cat > monitor.sh << 'MONEOF'
#!/bin/bash

echo "📊 FootRate - Monitoring Automatisation"
echo "========================================="

echo "🌐 Test connectivité..."
if curl -s -f http://localhost:3000 > /dev/null; then
   echo "✅ Serveur local actif"
else
   echo "❌ Serveur local inactif - Lance 'npm run dev'"
fi

echo ""
echo "📈 Stats base de données:"
echo "------------------------"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
 try {
   const totalMatches = await prisma.match.count();
   const liveMatches = await prisma.match.count({ 
     where: { status: { in: ['LIVE', '1H', '2H', 'HT'] } } 
   });
   const todayFinished = await prisma.match.count({
     where: { 
       status: 'FINISHED',
       date: { gte: new Date(new Date().setHours(0,0,0,0)) }
     }
   });
   
   console.log(\`📊 Total matchs: \${totalMatches}\`);
   console.log(\`🔴 Matchs live: \${liveMatches}\`);
   console.log(\`✅ Terminés aujourd'hui: \${todayFinished}\`);
 } catch(e) {
   console.log('❌ Erreur DB:', e.message);
 } finally {
   await prisma.\$disconnect();
 }
})();
" 2>/dev/null || echo "❌ Erreur accès base de données"

echo ""
echo "🔧 Commandes utiles:"
echo "   npm run dev              # Démarrer le serveur"
echo "   ./test-automation.sh     # Tester l'automatisation"
echo "   ./monitor.sh             # Ce script"
echo ""
echo "🌐 URLs importantes:"
echo "   http://localhost:3000/admin/sync-dashboard"
echo "   http://localhost:3000/admin/import"
MONEOF

chmod +x monitor.sh

echo ""
echo "🎉 INSTALLATION TERMINÉE !"
echo "=========================="
echo ""
echo "📁 Fichiers créés :"
echo "  ✅ pages/api/cron/sync-matches.ts"
echo "  ✅ pages/admin/sync-dashboard.tsx"
echo "  ✅ .github/workflows/sync-matches.yml"
echo "  ✅ hooks/useMatchNotifications.ts"
echo "  ✅ components/MatchNotifications.tsx"
echo "  ✅ test-automation.sh"
echo "  ✅ monitor.sh"
echo ""
echo "🔐 Variable ajoutée à .env :"
echo "  CRON_SECRET=\"$CRON_SECRET\""
echo ""
echo "🚀 PROCHAINES ÉTAPES :"
echo "====================="
echo ""
echo "1️⃣ TESTER LOCALEMENT :"
echo "   ./test-automation.sh"
echo ""
echo "2️⃣ AJOUTER NOTIFICATIONS AU HEADER (pages/index.tsx) :"
echo "   Ajoute en haut :"
echo "   import MatchNotifications from '../components/MatchNotifications'"
echo ""
echo "   Dans le header, remplace la section user par :"
echo "   <div className=\"flex items-center space-x-3\">"
echo "     <MatchNotifications />"
echo "     <Link href=\"/profile\">"
echo "       👋 {session.user?.name?.split(' ')[0] || 'Profil'}"
echo "     </Link>"
echo "     <button onClick={() => signOut()}>"
echo "       <LogOut className=\"w-4 h-4\" />"
echo "     </button>"
echo "   </div>"
echo ""
echo "3️⃣ DÉMARRER :"
echo "   npm run dev"
echo "   # Puis va sur http://localhost:3000/admin/sync-dashboard"
echo ""
echo "4️⃣ DÉPLOYER :"
echo "   git add ."
echo "   git commit -m '🚀 Add real-time automation'"
echo "   git push"
echo "   vercel --prod"
echo ""
echo "5️⃣ GITHUB ACTIONS (optionnel) :"
echo "   Ajoute ces secrets dans GitHub :"
echo "   VERCEL_URL=https://ton-app.vercel.app"
echo "   CRON_SECRET=$CRON_SECRET"
echo ""
echo "📊 MONITORING :"
echo "   ./monitor.sh"
echo ""
echo "🔥 TON FOOTRATE SERA AUTOMATISÉ ! 🔥"
echo "Les matchs se mettront à jour automatiquement 🚀"
