import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        period = 'all-time', 
        sortBy = 'rating', 
        limit = '50' 
      } = req.query

      // Filtre par période
      let dateFilter = {}
      const now = new Date()
      
      switch (period) {
        case 'this-week':
          const weekAgo = new Date()
          weekAgo.setDate(now.getDate() - 7)
          dateFilter = { date: { gte: weekAgo } }
          break
        case 'this-month':
          const monthAgo = new Date()
          monthAgo.setMonth(now.getMonth() - 1)
          dateFilter = { date: { gte: monthAgo } }
          break
        case 'this-year':
          const yearAgo = new Date()
          yearAgo.setFullYear(now.getFullYear() - 1)
          dateFilter = { date: { gte: yearAgo } }
          break
        default: // 'all-time'
          break
      }

      // Construire l'ordre de tri
      let orderBy: any = {}
      switch (sortBy) {
        case 'popularity':
          orderBy = [
            { totalRatings: 'desc' },
            { avgRating: 'desc' }
          ]
          break
        case 'recent':
          orderBy = [
            { date: 'desc' },
            { avgRating: 'desc' }
          ]
          break
        default: // 'rating'
          orderBy = [
            { avgRating: 'desc' },
            { totalRatings: 'desc' }
          ]
          break
      }

      const topMatches = await prisma.match.findMany({
        where: {
          ...dateFilter,
          totalRatings: { gte: 1 }, // Au moins une note
          status: 'FINISHED'
        },
        include: {
          ratings: {
            include: {
              user: {
                select: { id: true, name: true, username: true, image: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Dernières 5 notes pour preview
          }
        },
        orderBy,
        take: parseInt(limit as string)
      })

      res.status(200).json({ matches: topMatches })
    } catch (error) {
      console.error('Erreur top matchs:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
