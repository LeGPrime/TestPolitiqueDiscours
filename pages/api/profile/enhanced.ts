// pages/api/profile/enhanced.ts - API étendue pour le profil
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    if (req.method === 'PUT') {
      const { 
        name, username, bio, location, age, occupation,
        favoriteClub, favoriteBasketballTeam, favoriteTennisPlayer, 
        favoriteF1Driver, preferredSports, watchingHabits, languages, visibility
      } = req.body

      console.log('💾 API Enhanced - Sauvegarde complète:', req.body)

      try {
        // 1. Mettre à jour les champs de base dans users
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
        if (bio !== undefined) updateData.bio = bio.trim().slice(0, 300)

        // Mettre à jour users si nécessaire
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
          })
          console.log('✅ Table users mise à jour')
        }

        // 2. Mettre à jour les colonnes étendues dans users
        try {
          await prisma.$queryRaw`
            UPDATE users 
            SET location = ${location?.trim().slice(0, 100) || null}, 
                favorite_club = ${favoriteClub?.trim().slice(0, 100) || null}
            WHERE id = ${session.user.id}
          `
          console.log('✅ Colonnes étendues users mises à jour')
        } catch (error) {
          console.log('⚠️ Colonnes location/favorite_club pas disponibles dans users')
        }

        // 3. Mettre à jour user_profiles
        try {
          const profileData = {
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

          console.log('📝 Données user_profiles à sauvegarder:', profileData)

          await prisma.$executeRaw`
            INSERT INTO user_profiles (
              user_id, age, occupation, favorite_basketball_team, 
              favorite_tennis_player, favorite_f1_driver, preferred_sports, 
              watching_habits, languages, visibility, updated_at
            )
            VALUES (
              ${session.user.id}, ${profileData.age}, ${profileData.occupation},
              ${profileData.favorite_basketball_team}, ${profileData.favorite_tennis_player},
              ${profileData.favorite_f1_driver}, ${profileData.preferred_sports}::jsonb,
              ${profileData.watching_habits}, ${profileData.languages}::jsonb,
              ${profileData.visibility}::jsonb, NOW()
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

          console.log('✅ user_profiles mis à jour avec succès')

          // Vérifier les données sauvegardées
          const verification = await prisma.$queryRaw`
            SELECT * FROM user_profiles WHERE user_id = ${session.user.id}
          ` as any[]

          console.log('🔍 Données vérifiées dans user_profiles:', verification[0])

        } catch (error: any) {
          console.error('❌ Erreur user_profiles:', error)
          return res.status(500).json({ 
            error: 'Erreur lors de la sauvegarde des données avancées',
            details: error.message,
            hint: 'Vérifiez que la table user_profiles existe'
          })
        }

        console.log('✅ Profil enhanced mis à jour avec succès')
        res.status(200).json({ 
          success: true,
          message: 'Profil mis à jour avec succès !',
          timestamp: new Date().toISOString()
        })
        
      } catch (error: any) {
        console.error('❌ Erreur mise à jour profil enhanced:', error)
        res.status(500).json({ 
          error: 'Erreur lors de la mise à jour du profil',
          details: error.message
        })
      }
      
    } else if (req.method === 'GET') {
      const { userId } = req.query
      const targetUserId = userId as string || session.user.id

      try {
        // Récupérer les données de base
        const user = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true, name: true, email: true, username: true, bio: true, 
            image: true, createdAt: true, location: true, favorite_club: true
          }
        })

        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        // Récupérer les données étendues
        let extendedProfile = null
        try {
          const result = await prisma.$queryRaw`
            SELECT * FROM user_profiles WHERE user_id = ${targetUserId}
          ` as any[]
          
          extendedProfile = result[0] || null
          console.log('✅ Données enhanced récupérées:', extendedProfile ? 'Oui' : 'Non')
        } catch (error) {
          console.log('⚠️ Table user_profiles pas disponible')
        }

        const profileData = {
          user: {
            ...user,
            // Données étendues si disponibles
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
          }
        }

        res.status(200).json(profileData)
      } catch (error) {
        console.error('❌ Erreur récupération profil enhanced:', error)
        res.status(500).json({ error: 'Erreur serveur' })
      }
    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }

  } catch (error) {
    console.error('💥 ERREUR API PROFILE ENHANCED:', error)
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message
    })
  }
}