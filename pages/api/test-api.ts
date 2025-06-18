import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { apiSportsService } from '../../lib/football-api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method === 'POST') {
    try {
      const { action } = req.body

      if (action === 'test_connection') {
        console.log('🧪 Test de connexion API-Sports...')
        
        // Vérifier les variables d'environnement
        const hasRapidApiKey = !!process.env.RAPIDAPI_KEY
        const hasRapidApiHost = !!process.env.RAPIDAPI_HOST
        
        if (!hasRapidApiKey || !hasRapidApiHost) {
          return res.status(400).json({
            error: 'Variables d\'environnement manquantes',
            details: {
              RAPIDAPI_KEY: hasRapidApiKey ? '✅ Présente' : '❌ Manquante',
              RAPIDAPI_HOST: hasRapidApiHost ? '✅ Présente' : '❌ Manquante'
            },
            help: 'Va sur https://rapidapi.com/api-sports/api/api-football pour obtenir ta clé'
          })
        }

        // Tester la connexion
        const connectionOk = await apiSportsService.testConnection()
        
        if (!connectionOk) {
          return res.status(500).json({
            error: 'Échec de connexion à API-Sports',
            quota: apiSportsService.getQuotaStatus()
          })
        }

        return res.json({
          success: true,
          message: '✅ Connexion API-Sports réussie !',
          quota: apiSportsService.getQuotaStatus(),
          config: {
            RAPIDAPI_KEY: '✅ Configurée',
            RAPIDAPI_HOST: process.env.RAPIDAPI_HOST
          }
        })

      } else if (action === 'test_yesterday') {
        console.log('🧪 Test récupération matchs d\'hier...')
        
        const matches = await apiSportsService.getYesterdayMatches()
        
        return res.json({
          success: true,
          message: `✅ ${matches.length} matchs trouvés hier`,
          matches: matches.slice(0, 5).map(match => ({
            id: match.fixture.id,
            homeTeam: match.teams.home.name,
            awayTeam: match.teams.away.name,
            score: `${match.goals.home || 0} - ${match.goals.away || 0}`,
            competition: match.league.name,
            status: match.fixture.status.long
          })),
          quota: apiSportsService.getQuotaStatus(),
          totalFound: matches.length
        })

      } else {
        return res.status(400).json({ error: 'Action inconnue' })
      }

    } catch (error: any) {
      console.error('❌ Erreur test API:', error)
      
      return res.status(500).json({
        error: error.message,
        quota: apiSportsService.getQuotaStatus(),
        help: error.message.includes('401') 
          ? 'Clé API invalide - vérifie ta RAPIDAPI_KEY'
          : error.message.includes('429')
          ? 'Quota dépassé - attends demain ou upgrade ton plan'
          : 'Erreur de connexion - vérifie ta configuration'
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}