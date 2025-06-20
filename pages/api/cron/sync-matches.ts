import { NextApiRequest, NextApiResponse } from 'next'
import { apiSportsService } from '../../../lib/football-api'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Synchronisation automatique démarrée...')
    
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    
    const activeMatches = await prisma.match.findMany({
      where: {
        status: { in: ['LIVE', '1H', '2H', 'HT', 'ET', 'BT'] },
        date: { gte: threeHoursAgo }
      },
      orderBy: { date: 'desc' },
      take: 10
    })

    let updatedCount = 0

    for (const match of activeMatches) {
      try {
        const response = await fetch(`https://${process.env.RAPIDAPI_HOST}/v3/fixtures?id=${match.apiMatchId}`, {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
          }
        })

        if (!response.ok) continue

        const data = await response.json()
        const apiMatch = data.response[0]
        if (!apiMatch) continue

        const newStatus = apiMatch.fixture.status.short

        if (match.status !== newStatus) {
          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: newStatus,
              homeScore: apiMatch.goals.home,
              awayScore: apiMatch.goals.away,
              updatedAt: new Date()
            }
          })

          updatedCount++
          console.log(`✅ Match mis à jour: ${match.homeTeam} vs ${match.awayTeam}`)
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`❌ Erreur match ${match.id}:`, error)
      }
    }

    res.status(200).json({
      success: true,
      updated: updatedCount,
      checked: activeMatches.length,
      quota: apiSportsService.getQuotaStatus()
    })

  } catch (error) {
    console.error('❌ Erreur sync:', error)
    res.status(500).json({ error: 'Sync failed' })
  }
}