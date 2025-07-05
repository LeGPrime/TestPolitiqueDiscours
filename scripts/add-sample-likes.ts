// scripts/add-sample-likes.ts - Script pour ajouter des likes aux reviews existantes
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSampleLikes() {
  console.log('🚀 Ajout de likes d\'exemple pour tester le Hall of Fame...')

  // 1. Récupérer toutes les reviews avec des commentaires
  const reviews = await prisma.rating.findMany({
    where: {
      comment: {
        not: null,
        not: ''
      }
    },
    include: {
      user: true,
      match: true
    }
  })

  console.log(`📊 ${reviews.length} reviews avec commentaires trouvées`)

  if (reviews.length === 0) {
    console.log('⚠️ Aucune review avec commentaire trouvée. Ajout de reviews d\'exemple...')
    
    // Créer quelques reviews avec commentaires si aucune n'existe
    const users = await prisma.user.findMany({ take: 5 })
    const matches = await prisma.match.findMany({ take: 5 })
    
    if (users.length > 0 && matches.length > 0) {
      const sampleReviews = [
        {
          userId: users[0].id,
          matchId: matches[0].id,
          rating: 5,
          comment: "🔥 Match absolument exceptionnel ! L'intensité était au rendez-vous du début à la fin. Les deux équipes ont livré un spectacle de très haut niveau avec des actions techniques remarquables. Un vrai régal pour les yeux !"
        },
        {
          userId: users[1]?.id || users[0].id,
          matchId: matches[1]?.id || matches[0].id,
          rating: 4,
          comment: "⚽ Super rencontre avec du suspense jusqu'au bout ! L'ambiance dans le stade était électrique et les joueurs ont tout donné. Quelques occasions ratées qui auraient pu changer la donne, mais dans l'ensemble c'était un très bon match."
        },
        {
          userId: users[2]?.id || users[0].id,
          matchId: matches[2]?.id || matches[0].id,
          rating: 5,
          comment: "🏆 MATCH DE LÉGENDE ! Des buts magnifiques, du fair-play, de l'émotion... Tout y était ! Les supporters ont eu droit à un véritable festival de football. Ce genre de match nous rappelle pourquoi on aime ce sport."
        },
        {
          userId: users[3]?.id || users[0].id,
          matchId: matches[3]?.id || matches[0].id,
          rating: 3,
          comment: "😐 Match correct sans plus. Les deux équipes ont semblé jouer la sécurité, ce qui a donné un spectacle assez terne. Quelques belles actions par moments mais globalement décevant par rapport aux attentes."
        },
        {
          userId: users[4]?.id || users[0].id,
          matchId: matches[4]?.id || matches[0].id,
          rating: 4,
          comment: "👏 Belle performance collective ! Tactiquement c'était très bien orchestré et l'état d'esprit était exemplaire. Même si le score est serré, la qualité de jeu était au rendez-vous. Bravo aux deux équipes !"
        }
      ]

      for (const reviewData of sampleReviews) {
        try {
          await prisma.rating.create({
            data: reviewData
          })
          console.log(`✅ Review créée pour ${reviewData.comment.substring(0, 30)}...`)
        } catch (error) {
          console.log(`⚠️ Review déjà existante, skip...`)
        }
      }

      // Récupérer les nouvelles reviews
      const newReviews = await prisma.rating.findMany({
        where: {
          comment: {
            not: null,
            not: ''
          }
        },
        include: {
          user: true,
          match: true
        }
      })
      
      reviews.push(...newReviews)
    }
  }

  // 2. Récupérer tous les utilisateurs pour créer des likes
  const users = await prisma.user.findMany()
  console.log(`👥 ${users.length} utilisateurs trouvés`)

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé. Impossible d\'ajouter des likes.')
    return
  }

  // 3. Ajouter des likes de manière intelligente
  let totalLikesAdded = 0

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i]
    
    // Calculer le nombre de likes basé sur la qualité supposée du commentaire
    let likesCount = 0
    const commentLength = review.comment?.length || 0
    const rating = review.rating
    
    // Algorithme pour déterminer le nombre de likes
    if (commentLength > 100 && rating >= 4) {
      likesCount = Math.floor(Math.random() * 15) + 5 // 5-20 likes pour les bons commentaires longs
    } else if (commentLength > 50 && rating >= 3) {
      likesCount = Math.floor(Math.random() * 8) + 2  // 2-10 likes pour les commentaires moyens
    } else if (rating >= 4) {
      likesCount = Math.floor(Math.random() * 5) + 1  // 1-6 likes pour les bonnes notes
    } else {
      likesCount = Math.floor(Math.random() * 3)      // 0-3 likes pour les autres
    }

    // Mélanger les utilisateurs pour la variété
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5)
    
    for (let j = 0; j < Math.min(likesCount, users.length); j++) {
      const user = shuffledUsers[j]
      
      // Ne pas liker sa propre review
      if (user.id === review.userId) continue
      
      try {
        await prisma.reviewLike.create({
          data: {
            userId: user.id,
            reviewId: review.id
          }
        })
        totalLikesAdded++
      } catch (error) {
        // Like déjà existant, on continue
      }
    }
    
    console.log(`💖 Review "${review.comment?.substring(0, 50)}..." : ${likesCount} likes ciblés`)
  }

  // 4. Mettre à jour les statistiques des matchs
  console.log('📊 Mise à jour des statistiques des matchs...')
  
  for (const review of reviews) {
    const matchRatings = await prisma.rating.findMany({
      where: { matchId: review.matchId }
    })
    
    if (matchRatings.length > 0) {
      const avgRating = matchRatings.reduce((sum, r) => sum + r.rating, 0) / matchRatings.length
      
      await prisma.match.update({
        where: { id: review.matchId },
        data: {
          avgRating,
          totalRatings: matchRatings.length,
        }
      })
    }
  }

  // 5. Afficher le résumé
  const finalStats = await prisma.reviewLike.count()
  const topReview = await prisma.rating.findFirst({
    where: {
      comment: {
        not: null,
        not: ''
      }
    },
    include: {
      _count: {
        select: { likes: true }
      },
      user: true,
      match: true
    },
    orderBy: {
      likes: {
        _count: 'desc'
      }
    }
  })

  console.log(`
🎉 RÉSUMÉ :
- ${totalLikesAdded} nouveaux likes ajoutés
- ${finalStats} likes totaux dans la base
- Review la plus populaire : "${topReview?.comment?.substring(0, 60)}..." (${topReview?._count.likes} likes)
- Par ${topReview?.user.name} sur le match ${topReview?.match.homeTeam} vs ${topReview?.match.awayTeam}

🚀 Le Hall of Fame est maintenant prêt ! Rendez-vous sur /top-reviews
  `)
}

// Fonction pour créer un utilisateur test si besoin
async function createTestUser() {
  try {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@sportrate.com',
        name: 'Fan de Sport',
        username: 'sportfan'
      }
    })
    console.log('👤 Utilisateur test créé :', testUser.name)
    return testUser
  } catch (error) {
    console.log('👤 Utilisateur test déjà existant')
    return null
  }
}

async function main() {
  try {
    // Créer un utilisateur test si aucun utilisateur n'existe
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      await createTestUser()
    }
    
    await addSampleLikes()
  } catch (error) {
    console.error('❌ Erreur :', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()