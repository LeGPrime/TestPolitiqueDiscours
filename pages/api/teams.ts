// pages/api/teams.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non connecté' })
  }

  if (req.method === 'GET') {
    try {
      const { sport = 'all', search, followed } = req.query

      // Si on veut seulement les équipes suivies
      if (followed === 'true') {
        try {
          const followedTeams = await prisma.$queryRaw`
            SELECT tf.created_at as followed_since, t.* 
            FROM team_follows tf
            JOIN teams t ON tf.team_id = t.id
            WHERE tf.user_id = ${session.user.id}
            ORDER BY tf.created_at DESC
          `

          const teamsWithFollowersCount = await Promise.all(
            (followedTeams as any[]).map(async (team) => {
              const followersResult = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM team_follows WHERE team_id = ${team.id}
              ` as any[]
              
              return {
                id: team.id,
                name: team.name,
                logo: team.logo,
                sport: team.sport.toLowerCase(),
                league: team.league,
                country: team.country,
                founded: team.founded,
                website: team.website,
                followersCount: parseInt(followersResult[0]?.count || '0'),
                isFollowed: true,
                followedSince: team.followed_since
              }
            })
          )

          return res.status(200).json({ teams: teamsWithFollowersCount })
        } catch (error) {
          console.log('⚠️ Tables équipes pas disponibles:', error)
          return res.status(200).json({ teams: [] })
        }
      }

      // Construire la query pour toutes les équipes
      let whereClause = ``
      const params: any[] = []

      if (sport && sport !== 'all') {
        whereClause += ` WHERE sport = $1`
        params.push(sport.toString().toUpperCase())
      }

      if (search) {
        if (whereClause) {
          whereClause += ` AND name ILIKE $${params.length + 1}`
        } else {
          whereClause += ` WHERE name ILIKE $${params.length + 1}`
        }
        params.push(`%${search}%`)
      }

      try {
        const teams = await prisma.$queryRawUnsafe(`
          SELECT t.*, 
                 COALESCE(tf_count.followers_count, 0) as followers_count,
                 CASE WHEN tf_user.user_id IS NOT NULL THEN true ELSE false END as is_followed
          FROM teams t
          LEFT JOIN (
            SELECT team_id, COUNT(*) as followers_count 
            FROM team_follows 
            GROUP BY team_id
          ) tf_count ON t.id = tf_count.team_id
          LEFT JOIN team_follows tf_user ON t.id = tf_user.team_id AND tf_user.user_id = $${params.length + 1}
          ${whereClause}
          ORDER BY COALESCE(tf_count.followers_count, 0) DESC, t.name ASC
          LIMIT 50
        `, ...params, session.user.id) as any[]

        const formattedTeams = teams.map(team => ({
          id: team.id,
          name: team.name,
          logo: team.logo,
          sport: team.sport.toLowerCase(),
          league: team.league,
          country: team.country,
          founded: team.founded,
          website: team.website,
          followersCount: parseInt(team.followers_count || '0'),
          isFollowed: team.is_followed
        }))

        res.status(200).json({ teams: formattedTeams })
      } catch (error) {
        console.log('⚠️ Tables équipes pas disponibles:', error)
        res.status(200).json({ teams: [] })
      }
    } catch (error) {
      console.error('Erreur teams:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else if (req.method === 'POST') {
    try {
      const { action, teamId } = req.body

      if (action === 'follow') {
        // Suivre une équipe
        await prisma.$queryRaw`
          INSERT INTO team_follows (user_id, team_id, created_at)
          VALUES (${session.user.id}, ${teamId}, NOW())
          ON CONFLICT (user_id, team_id) DO NOTHING
        `
        res.status(200).json({ success: true, message: 'Équipe suivie' })
      } else if (action === 'unfollow') {
        // Ne plus suivre une équipe
        await prisma.$queryRaw`
          DELETE FROM team_follows
          WHERE user_id = ${session.user.id} AND team_id = ${teamId}
        `
        res.status(200).json({ success: true, message: 'Équipe non suivie' })
      } else {
        res.status(400).json({ error: 'Action non supportée' })
      }
    } catch (error) {
      console.error('Erreur action team:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}