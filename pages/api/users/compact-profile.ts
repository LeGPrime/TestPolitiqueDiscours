// pages/api/users/compact-profile.ts - API pour récupérer un profil compact
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID requis' })
    }

    console.log('🔍 Récupération profil compact pour:', userId)

    // Récupérer l'utilisateur avec ses données de base
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        favorite_club: true,
        createdAt: true,
        // Compter les relations
        _count: {
          select: {
            ratings: true,
            sentFriendships: { where: { status: 'ACCEPTED' } },
            receivedFriendships: { where: { status: 'ACCEPTED' } }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Récupérer les données étendues si disponibles
    let extendedProfile = null
    try {
      const result = await prisma.$queryRaw`
        SELECT age, occupation, favorite_basketball_team, favorite_tennis_player, 
               favorite_f1_driver, preferred_sports, languages, visibility
        FROM user_profiles WHERE user_id = ${userId}
      ` as any[]
      
      extendedProfile = result[0] || null
    } catch (error) {
      console.log('⚠️ Données étendues non disponibles pour:', userId)
    }

    // Calculer la moyenne des notes
    const ratingsData = await prisma.rating.aggregate({
      where: { userId: userId as string },
      _avg: { rating: true }
    })

    // Calculer l'activité récente (6 derniers mois)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const recentActivity = await prisma.rating.count({
      where: {
        userId: userId as string,
        createdAt: { gte: sixMonthsAgo }
      }
    })

    // Vérifier le statut d'amitié si l'utilisateur est connecté
    let friendshipStatus = 'none'
    
    if (session?.user?.id && session.user.id !== userId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: userId as string },
            { senderId: userId as string, receiverId: session.user.id }
          ]
        }
      })

      if (friendship) {
        if (friendship.status === 'ACCEPTED') {
          friendshipStatus = 'friends'
        } else if (friendship.senderId === session.user.id) {
          friendshipStatus = 'pending_sent'
        } else {
          friendshipStatus = 'pending_received'
        }
      }
    }

    // Construire la réponse
    const compactProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
      
      // Données étendues si disponibles
      age: extendedProfile?.age || null,
      occupation: extendedProfile?.occupation || null,
      favoriteClub: user.favorite_club,
      favoriteBasketballTeam: extendedProfile?.favorite_basketball_team || null,
      favoriteTennisPlayer: extendedProfile?.favorite_tennis_player || null,
      favoriteF1Driver: extendedProfile?.favorite_f1_driver || null,
      preferredSports: extendedProfile?.preferred_sports || [],
      languages: extendedProfile?.languages || [],
      visibility: extendedProfile?.visibility || {
        location: true,
        age: false,
        occupation: false,
        favoriteClub: true,
        favoriteBasketballTeam: true,
        favoriteTennisPlayer: true,
        favoriteF1Driver: true
      },

      // Stats de base
      stats: {
        totalRatings: user._count.ratings,
        avgRating: ratingsData._avg.rating ? Number(ratingsData._avg.rating.toFixed(1)) : 0,
        totalFriends: user._count.sentFriendships + user._count.receivedFriendships,
        recentActivity
      },

      // Statut d'amitié
      friendshipStatus
    }

    console.log('✅ Profil compact construit pour:', user.name || user.username)

    res.status(200).json(compactProfile)

  } catch (error) {
    console.error('❌ Erreur API profil compact:', error)
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message
    })
  }
}