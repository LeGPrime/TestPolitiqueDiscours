import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🚀 API Profile Fixed appelée!')
  
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    if (req.method === 'GET') {
      const { userId } = req.query
      const targetUserId = userId as string || session.user.id
      
      console.log('🎯 Recherche utilisateur:', targetUserId)

      // Récupérer l'utilisateur
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
          location: true,
          favorite_club: true
        }
      })

      if (!user) {
        console.log('❌ Utilisateur non trouvé')
        return res.status(404).json({ error: 'Utilisateur non trouvé' })
      }

      console.log('✅ Utilisateur trouvé:', user.name)

      // Essayer de récupérer les données avancées
      let extendedProfile = null
      try {
        const result = await prisma.$queryRaw`
          SELECT * FROM user_profiles WHERE user_id = ${targetUserId}
        ` as any[]
        
        extendedProfile = result[0] || null
        console.log('✅ Données avancées récupérées:', extendedProfile ? 'Oui' : 'Non')
      } catch (error) {
        console.log('⚠️ Table user_profiles pas disponible')
      }

      // RÉCUPÉRER TOUTES LES NOTATIONS DE MATCHS
      const allMatchRatings = await prisma.rating.findMany({
        where: { userId: targetUserId },
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
        orderBy: { createdAt: 'desc' }
      })

      console.log(`📊 ${allMatchRatings.length} notations de matchs trouvées`)

      // RÉCUPÉRER TOUTES LES NOTATIONS DE JOUEURS
      const allPlayerRatings = await prisma.playerRating.findMany({
        where: { userId: targetUserId },
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
        orderBy: { createdAt: 'desc' }
      })

      console.log(`👥 ${allPlayerRatings.length} notations de joueurs trouvées`)

      // CALCULER LES STATISTIQUES
      const totalRatings = allMatchRatings.length
      const totalPlayerRatings = allPlayerRatings.length
      
      const avgRating = totalRatings > 0 
        ? allMatchRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0
        
      const avgPlayerRating = totalPlayerRatings > 0 
        ? allPlayerRatings.reduce((sum, r) => sum + r.rating, 0) / totalPlayerRatings 
        : 0

      // Compter les amis
      const friendsCount = await prisma.friendship.count({
        where: {
          OR: [
            { senderId: targetUserId, status: 'ACCEPTED' },
            { receiverId: targetUserId, status: 'ACCEPTED' }
          ]
        }
      })

      // Top matchs (notes >= 4)
      const topMatches = allMatchRatings
        .filter(r => r.rating >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      // Top joueurs notés (notes >= 8)
      const topPlayerRatings = allPlayerRatings
        .filter(r => r.rating >= 8)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      // Répartition des notes DE MATCHS
      const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1
        const count = allMatchRatings.filter(r => r.rating === rating).length
        return { 
          rating, 
          count, 
          percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0 
        }
      })

      // Répartition des notes DE JOUEURS (sur 10)
      const playerRatingDistribution = Array.from({ length: 10 }, (_, i) => {
        const rating = i + 1
        const count = allPlayerRatings.filter(r => r.rating === rating).length
        return { 
          rating, 
          count, 
          percentage: totalPlayerRatings > 0 ? (count / totalPlayerRatings) * 100 : 0 
        }
      })

      // Compétition préférée
      const competitionCounts: Record<string, number> = {}
      allMatchRatings.forEach(rating => {
        const comp = rating.match.competition
        competitionCounts[comp] = (competitionCounts[comp] || 0) + 1
      })
      
      const favoriteCompetition = Object.entries(competitionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null

      // Meilleur joueur noté
      const bestRatedPlayer = allPlayerRatings.length > 0 
        ? allPlayerRatings.reduce((best, current) => 
            current.rating > best.rating ? current : best
          )
        : null

      // Activité récente (6 derniers mois)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const recentActivity = allMatchRatings
        .filter(r => new Date(r.createdAt) > sixMonthsAgo)
        .length
      
      const recentPlayerActivity = allPlayerRatings
        .filter(r => new Date(r.createdAt) > sixMonthsAgo)
        .length

      // Construire les stats
      const stats = {
        totalRatings,
        totalPlayerRatings,
        avgRating: Number(avgRating.toFixed(1)),
        avgPlayerRating: Number(avgPlayerRating.toFixed(1)),
        totalFriends: friendsCount,
        favoriteCompetition,
        bestRatedPlayer,
        recentActivity,
        recentPlayerActivity,
        topMatches,
        topPlayerRatings,
        ratingDistribution,
        playerRatingDistribution,
        totalTeamsFollowed: 0, // À implémenter plus tard
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
          location: user.location,
          favoriteClub: user.favorite_club,
          createdAt: user.createdAt,
          // Données avancées si disponibles
          age: extendedProfile?.age || null,
          occupation: extendedProfile?.occupation || null,
          favoriteBasketballTeam: extendedProfile?.favorite_basketball_team || null,
          favoriteTennisPlayer: extendedProfile?.favorite_tennis_player || null,
          favoriteF1Driver: extendedProfile?.favorite_f1_driver || null,
          preferredSports: extendedProfile?.preferred_sports || [],
          watchingHabits: extendedProfile?.watching_habits || null,
          languages: extendedProfile?.languages || [],
          visibility: extendedProfile?.visibility || {
            location: true,
            age: false,
            occupation: false,
            favoriteClub: true,
            favoriteBasketballTeam: true,
            favoriteTennisPlayer: true,
            favoriteF1Driver: true
          }
        },
        stats,
        recentRatings: allMatchRatings.slice(0, 20),
        recentPlayerRatings: allPlayerRatings.slice(0, 20),
        followedTeams: []
      }

      console.log('✅ Profil construit avec succès')
      console.log(`📊 Stats finales: ${totalRatings} notes matchs, ${totalPlayerRatings} notes joueurs`)
      
      res.status(200).json(profileData)

    } else if (req.method === 'PUT') {
      // Mise à jour du profil avec support des données avancées
      const { 
        name, username, bio, location, favoriteClub,
        // Nouvelles données avancées
        age, occupation, favoriteBasketballTeam, favoriteTennisPlayer, 
        favoriteF1Driver, preferredSports, watchingHabits, languages, visibility
      } = req.body

      console.log('💾 Mise à jour profil avec données avancées:', req.body)

      try {
        // Mise à jour des champs de base
        const updateData: any = {}
        
        if (name !== undefined) updateData.name = name.trim().slice(0, 100)
        if (username !== undefined) {
          const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
          if (cleanUsername.length >= 3) {
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
        if (bio !== undefined) updateData.bio = bio.trim().slice(0, 200)

        // Mettre à jour les champs de base s'il y en a
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
          })
          console.log('✅ Champs de base mis à jour')
        }

        // Mettre à jour les colonnes étendues
        try {
          await prisma.$queryRaw`
            UPDATE users 
            SET location = ${location?.trim().slice(0, 100) || null}, 
                favorite_club = ${favoriteClub?.trim().slice(0, 100) || null}
            WHERE id = ${session.user.id}
          `
          console.log('✅ Colonnes users étendues mises à jour')
        } catch (error) {
          console.log('⚠️ Colonnes location/favorite_club pas disponibles dans users')
        }

        // Essayer de créer/mettre à jour la table user_profiles pour les données avancées
        if (age || occupation || favoriteBasketballTeam || favoriteTennisPlayer || 
            favoriteF1Driver || preferredSports || watchingHabits || languages || visibility) {
          
          console.log('💾 Tentative sauvegarde données avancées...')
          
          try {
            const extendedData = {
              age: age?.trim() || null,
              occupation: occupation?.trim().slice(0, 100) || null,
              favorite_basketball_team: favoriteBasketballTeam?.trim().slice(0, 100) || null,
              favorite_tennis_player: favoriteTennisPlayer?.trim() || null,
              favorite_f1_driver: favoriteF1Driver?.trim() || null,
              preferred_sports: JSON.stringify(preferredSports || []),
              watching_habits: watchingHabits?.trim() || null,
              languages: JSON.stringify(languages || []),
              visibility: JSON.stringify(visibility || {})
            }

            console.log('📝 Données à sauvegarder:', extendedData)

            // Utiliser une requête SQL plus simple et robuste
            await prisma.$executeRaw`
              INSERT INTO user_profiles (
                user_id, age, occupation, favorite_basketball_team, 
                favorite_tennis_player, favorite_f1_driver, preferred_sports, 
                watching_habits, languages, visibility, updated_at
              )
              VALUES (
                ${session.user.id}, ${extendedData.age}, ${extendedData.occupation},
                ${extendedData.favorite_basketball_team}, ${extendedData.favorite_tennis_player},
                ${extendedData.favorite_f1_driver}, ${extendedData.preferred_sports}::jsonb,
                ${extendedData.watching_habits}, ${extendedData.languages}::jsonb,
                ${extendedData.visibility}::jsonb, NOW()
              )
              ON CONFLICT (user_id) DO UPDATE SET
                age = EXCLUDED.age,
                occupation = EXCLUDED.occupation,
                favorite_basketball_team = EXCLUDED.favorite_basketball_team,
                favorite_tennis_player = EXCLUDED.favorite_tennis_player,
                favorite_f1_driver = EXCLUDED.favorite_f1_driver,
                preferred_sports = EXCLUDED.preferred_sports,
                watching_habits = EXCLUDED.watching_habits,
                languages = EXCLUDED.languages,
                visibility = EXCLUDED.visibility,
                updated_at = NOW()
            `
            console.log('✅ Données avancées sauvegardées dans user_profiles')
            
            // Vérifier que les données ont bien été sauvegardées
            const savedData = await prisma.$queryRaw`
              SELECT * FROM user_profiles WHERE user_id = ${session.user.id}
            ` as any[]
            
            console.log('🔍 Données sauvegardées vérifiées:', savedData[0])
            
          } catch (error: any) {
            console.log('❌ Erreur SQL détaillée:', error.message)
            console.log('📋 Code erreur:', error.code)
            
            if (error.message.includes('relation "user_profiles" does not exist')) {
              console.log('⚠️ Table user_profiles n\'existe pas - Créer la migration SQL d\'abord')
              return res.status(400).json({ 
                error: 'Table user_profiles manquante',
                details: 'Exécutez la migration SQL pour créer la table user_profiles',
                sqlError: error.message
              })
            } else {
              console.log('⚠️ Autre erreur SQL:', error.message)
              return res.status(500).json({ 
                error: 'Erreur lors de la sauvegarde des données avancées',
                details: error.message,
                sqlError: error.code
              })
            }
          }
        }

        console.log('✅ Profil mis à jour avec succès (complet)')
        res.status(200).json({ 
          success: true,
          message: 'Profil mis à jour avec succès !',
          savedData: {
            basic: updateData,
            extended: { location, favoriteClub },
            advanced: {
              age, occupation, favoriteBasketballTeam, favoriteTennisPlayer,
              favoriteF1Driver, preferredSports, watchingHabits, languages, visibility
            }
          }
        })
        
      } catch (error: any) {
        console.error('❌ Erreur mise à jour profil:', error)
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
    console.error('💥 ERREUR API PROFILE FIXED:', error)
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message
    })
  }
}