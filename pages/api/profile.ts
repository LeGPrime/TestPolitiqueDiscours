// pages/api/profile.ts - Version avec notations de joueurs
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔥 API Profile appelée!')
  
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    if (req.method === 'GET') {
      const { userId } = req.query
      const targetUserId = userId as string || session.user.id
      
      console.log('🎯 Recherche utilisateur:', targetUserId)

      // Récupérer l'utilisateur avec TOUTES ses notations
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          bio: true,
          image: true,
          createdAt: true,
          // Notations de matchs
          ratings: {
            include: {
              match: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          // 🆕 Notations de joueurs
          playerRatings: {
            include: {
              player: true,
              match: {
                select: {
                  id: true,
                  homeTeam: true,
                  awayTeam: true,
                  competition: true,
                  date: true,
                  homeScore: true,
                  awayScore: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          _count: {
            select: {
              ratings: true,
              playerRatings: true, // 🆕 Compter les notations de joueurs
              sentFriendships: { where: { status: 'ACCEPTED' } },
              receivedFriendships: { where: { status: 'ACCEPTED' } }
            }
          }
        }
      })

      if (!user) {
        console.log('❌ Utilisateur non trouvé')
        return res.status(404).json({ error: 'Utilisateur non trouvé' })
      }

      console.log('✅ Utilisateur trouvé:', user.name)
      console.log(`📊 ${user.ratings.length} notations de matchs, ${user.playerRatings.length} notations de joueurs`)

      // Essayer de récupérer les nouvelles colonnes séparément (optionnel)
      let location = null
      let favoriteClub = null
      
      try {
        const extraData = await prisma.$queryRaw`
          SELECT location, favorite_club 
          FROM users 
          WHERE id = ${targetUserId}
        ` as any[]
        
        if (extraData.length > 0) {
          location = extraData[0].location
          favoriteClub = extraData[0].favorite_club
        }
      } catch (error) {
        console.log('⚠️ Colonnes location/favorite_club pas encore disponibles')
      }

      // Calculer les statistiques COMPLÈTES
      const totalRatings = user.ratings.length
      const totalPlayerRatings = user.playerRatings.length
      const avgRating = totalRatings > 0 
        ? user.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0
      const avgPlayerRating = totalPlayerRatings > 0 
        ? user.playerRatings.reduce((sum, r) => sum + r.rating, 0) / totalPlayerRatings 
        : 0

      // Top matchs
      const topMatches = user.ratings
        .filter(r => r.rating >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      // 🆕 Top joueurs notés
      const topPlayerRatings = user.playerRatings
        .filter(r => r.rating >= 8)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      // Répartition des notes DE MATCHS
      const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1
        const count = user.ratings.filter(r => r.rating === rating).length
        return { 
          rating, 
          count, 
          percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0 
        }
      })

      // 🆕 Répartition des notes DE JOUEURS (sur 10)
      const playerRatingDistribution = Array.from({ length: 10 }, (_, i) => {
        const rating = i + 1
        const count = user.playerRatings.filter(r => r.rating === rating).length
        return { 
          rating, 
          count, 
          percentage: totalPlayerRatings > 0 ? (count / totalPlayerRatings) * 100 : 0 
        }
      })

      // Compétition préférée
      const competitionCounts: Record<string, number> = {}
      user.ratings.forEach(rating => {
        const comp = rating.match.competition
        competitionCounts[comp] = (competitionCounts[comp] || 0) + 1
      })
      
      const favoriteCompetition = Object.entries(competitionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null

      // 🆕 Joueur le mieux noté
      const bestRatedPlayer = user.playerRatings.length > 0 
        ? user.playerRatings.reduce((best, current) => 
            current.rating > best.rating ? current : best
          )
        : null

      // Activité récente
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const recentActivity = user.ratings
        .filter(r => new Date(r.createdAt) > sixMonthsAgo)
        .length
      
      const recentPlayerActivity = user.playerRatings
        .filter(r => new Date(r.createdAt) > sixMonthsAgo)
        .length

      // Essayer de récupérer les équipes suivies
      let followedTeams = []
      try {
        const teamFollows = await prisma.$queryRaw`
          SELECT tf.created_at as followed_since, t.* 
          FROM team_follows tf
          JOIN teams t ON tf.team_id = t.id
          WHERE tf.user_id = ${targetUserId}
        ` as any[]
        
        followedTeams = teamFollows.map(team => ({
          id: team.id,
          name: team.name,
          logo: team.logo,
          sport: team.sport?.toLowerCase() || 'football',
          league: team.league,
          country: team.country,
          founded: team.founded,
          website: team.website,
          followersCount: 0,
          followedSince: team.followed_since,
          isFollowed: true
        }))
      } catch (error) {
        console.log('⚠️ Tables équipes pas encore disponibles')
      }

      const stats = {
        totalRatings,
        totalPlayerRatings, // 🆕
        avgRating: Number(avgRating.toFixed(1)),
        avgPlayerRating: Number(avgPlayerRating.toFixed(1)), // 🆕
        totalFriends: user._count.sentFriendships + user._count.receivedFriendships,
        favoriteCompetition,
        bestRatedPlayer, // 🆕
        recentActivity,
        recentPlayerActivity, // 🆕
        topMatches,
        topPlayerRatings, // 🆕
        ratingDistribution,
        playerRatingDistribution, // 🆕
        totalTeamsFollowed: followedTeams.length,
        favoriteSports: []
      }

      const profileData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          bio: user.bio,
          image: user.image,
          location,
          favoriteClub,
          createdAt: user.createdAt
        },
        stats,
        recentRatings: user.ratings.slice(0, 10),
        recentPlayerRatings: user.playerRatings.slice(0, 10), // 🆕
        followedTeams
      }

      console.log('✅ Profil complet construit avec succès')
      console.log(`📊 Stats: ${totalRatings} notes matchs, ${totalPlayerRatings} notes joueurs`)
      res.status(200).json(profileData)

    } else if (req.method === 'PUT') {
      // Mise à jour safe
      const { name, username, bio, location, favoriteClub } = req.body

      // Mise à jour des colonnes de base
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { name, username, bio },
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          email: true,
          image: true
        }
      })

      // Essayer de mettre à jour les nouvelles colonnes
      try {
        await prisma.$queryRaw`
          UPDATE users 
          SET location = ${location}, favorite_club = ${favoriteClub}
          WHERE id = ${session.user.id}
        `
      } catch (error) {
        console.log('⚠️ Colonnes location/favorite_club pas disponibles pour la mise à jour')
      }

      res.status(200).json({ user: updatedUser })
    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }

  } catch (error) {
    console.error('💥 ERREUR API PROFILE:', error)
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message
    })
  }
}