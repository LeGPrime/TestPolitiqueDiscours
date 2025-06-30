// pages/api/profile.ts - Version améliorée avec stats par sport
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
              match: {
                select: {
                  id: true,
                  homeTeam: true,
                  awayTeam: true,
                  competition: true,
                  date: true,
                  homeScore: true,
                  awayScore: true,
                  venue: true,
                  sport: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
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
                  awayScore: true,
                  sport: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          _count: {
            select: {
              ratings: true,
              playerRatings: true,
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

      // 🆕 Calculer les statistiques COMPLÈTES et PAR SPORT
      const totalRatings = user.ratings.length
      const totalPlayerRatings = user.playerRatings.length
      const avgRating = totalRatings > 0 
        ? user.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0
      const avgPlayerRating = totalPlayerRatings > 0 
        ? user.playerRatings.reduce((sum, r) => sum + r.rating, 0) / totalPlayerRatings 
        : 0

      // 🆕 STATS PAR SPORT
      const getSportFromCompetition = (competition: string): string => {
        const basketballCompetitions = ['NBA', 'EuroLeague', 'WNBA', 'FIBA']
        const mmaCompetitions = ['UFC', 'Bellator', 'ONE', 'PFL']
        const rugbyCompetitions = ['Six Nations', 'Top 14', 'Premiership', 'URC']
        const f1Competitions = ['Formula 1', 'F1', 'Monaco GP', 'British GP']
        
        if (basketballCompetitions.some(comp => competition.includes(comp))) return 'basketball'
        if (mmaCompetitions.some(comp => competition.includes(comp))) return 'mma'
        if (rugbyCompetitions.some(comp => competition.includes(comp))) return 'rugby'
        if (f1Competitions.some(comp => competition.includes(comp))) return 'f1'
        
        return 'football'
      }

      // Grouper les notations par sport
      const ratingsBySport: { [sport: string]: any[] } = {}
      const playerRatingsBySport: { [sport: string]: any[] } = {}

      user.ratings.forEach(rating => {
        const sport = rating.match.sport ? rating.match.sport.toLowerCase() : getSportFromCompetition(rating.match.competition)
        if (!ratingsBySport[sport]) ratingsBySport[sport] = []
        ratingsBySport[sport].push(rating)
      })

      user.playerRatings.forEach(rating => {
        const sport = rating.match.sport ? rating.match.sport.toLowerCase() : getSportFromCompetition(rating.match.competition)
        if (!playerRatingsBySport[sport]) playerRatingsBySport[sport] = []
        playerRatingsBySport[sport].push(rating)
      })

      // Calculer les stats par sport
      const statsBySport: { [sport: string]: any } = {}
      
      const allSports = ['football', 'basketball', 'mma', 'rugby', 'f1']
      allSports.forEach(sport => {
        const sportRatings = ratingsBySport[sport] || []
        const sportPlayerRatings = playerRatingsBySport[sport] || []
        
        const sportAvgRating = sportRatings.length > 0
          ? sportRatings.reduce((sum, r) => sum + r.rating, 0) / sportRatings.length
          : 0
        
        const sportAvgPlayerRating = sportPlayerRatings.length > 0
          ? sportPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / sportPlayerRatings.length
          : 0

        // Compétition préférée pour ce sport
        const competitionCounts: Record<string, number> = {}
        sportRatings.forEach(rating => {
          const comp = rating.match.competition
          competitionCounts[comp] = (competitionCounts[comp] || 0) + 1
        })
        
        const favoriteCompetition = Object.entries(competitionCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null

        statsBySport[sport] = {
          totalRatings: sportRatings.length,
          avgRating: Number(sportAvgRating.toFixed(1)),
          totalPlayerRatings: sportPlayerRatings.length,
          avgPlayerRating: Number(sportAvgPlayerRating.toFixed(1)),
          favoriteCompetition
        }
      })

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

      // Compétition préférée (globale)
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
        totalPlayerRatings,
        avgRating: Number(avgRating.toFixed(1)),
        avgPlayerRating: Number(avgPlayerRating.toFixed(1)),
        totalFriends: user._count.sentFriendships + user._count.receivedFriendships,
        favoriteCompetition,
        bestRatedPlayer,
        recentActivity,
        recentPlayerActivity,
        topMatches,
        topPlayerRatings,
        ratingDistribution,
        playerRatingDistribution,
        totalTeamsFollowed: followedTeams.length,
        favoriteSports: [],
        // 🆕 STATS PAR SPORT
        statsBySport
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
        recentPlayerRatings: user.playerRatings.slice(0, 10),
        followedTeams
      }

      console.log('✅ Profil complet construit avec succès')
      console.log(`📊 Stats: ${totalRatings} notes matchs, ${totalPlayerRatings} notes joueurs`)
      console.log(`🏆 Stats par sport calculées pour ${Object.keys(statsBySport).length} sports`)
      res.status(200).json(profileData)

    } else if (req.method === 'PUT') {
      // 🆕 Mise à jour améliorée du profil
      const { name, username, bio, location, favoriteClub } = req.body

      console.log('💾 Mise à jour profil:', { name, username, bio, location, favoriteClub })

      try {
        // Mise à jour des colonnes de base avec validation
        const updateData: any = {}
        
        if (name !== undefined) updateData.name = name.trim().slice(0, 100) // Limite à 100 caractères
        if (username !== undefined) {
          // Validation username: alphanumerique + underscore, 3-30 caractères
          const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
          if (cleanUsername.length >= 3) {
            // Vérifier l'unicité du username
            const existingUser = await prisma.user.findFirst({
              where: { 
                username: cleanUsername,
                id: { not: session.user.id }
              }
            })
            
            if (existingUser) {
              return res.status(400).json({ 
                error: 'Ce nom d\'utilisateur est déjà pris',
                field: 'username'
              })
            }
            
            updateData.username = cleanUsername
          }
        }
        if (bio !== undefined) updateData.bio = bio.trim().slice(0, 200) // Limite à 200 caractères

        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: updateData,
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
        if (location !== undefined || favoriteClub !== undefined) {
          try {
            const locationValue = location?.trim().slice(0, 100) || null
            const favoriteClubValue = favoriteClub?.trim().slice(0, 100) || null
            
            await prisma.$queryRaw`
              UPDATE users 
              SET location = ${locationValue}, favorite_club = ${favoriteClubValue}
              WHERE id = ${session.user.id}
            `
            console.log('✅ Colonnes étendues mises à jour')
          } catch (error) {
            console.log('⚠️ Colonnes location/favorite_club pas disponibles pour la mise à jour')
          }
        }

        console.log('✅ Profil mis à jour avec succès')
        res.status(200).json({ 
          user: updatedUser,
          message: 'Profil mis à jour avec succès !'
        })
        
      } catch (error: any) {
        console.error('❌ Erreur mise à jour profil:', error)
        
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
          return res.status(400).json({ 
            error: 'Ce nom d\'utilisateur est déjà pris',
            field: 'username'
          })
        }
        
        res.status(500).json({ 
          error: 'Erreur lors de la mise à jour du profil',
          details: error.message
        })
      }
      
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