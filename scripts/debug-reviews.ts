// scripts/debug-reviews.ts - Script pour vérifier l'état des reviews et likes
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugReviews() {
  console.log('🔍 ANALYSE DES REVIEWS ET LIKES\n')

  // 1. Statistiques générales
  const [totalReviews, totalComments, totalLikes, totalUsers] = await Promise.all([
    prisma.rating.count(),
    prisma.rating.count({
      where: {
        comment: {
          not: null,
          not: ''
        }
      }
    }),
    prisma.reviewLike.count(),
    prisma.user.count()
  ])

  console.log('📊 STATISTIQUES GÉNÉRALES:')
  console.log(`- Total reviews: ${totalReviews}`)
  console.log(`- Reviews avec commentaires: ${totalComments}`)
  console.log(`- Total likes: ${totalLikes}`)
  console.log(`- Total utilisateurs: ${totalUsers}\n`)

  // 2. Reviews avec le plus de likes
  console.log('🏆 TOP 10 REVIEWS AVEC LE PLUS DE LIKES:')
  const topReviews = await prisma.rating.findMany({
    where: {
      comment: {
        not: null,
        not: ''
      }
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      match: {
        select: { homeTeam: true, awayTeam: true, competition: true }
      },
      _count: {
        select: { likes: true }
      }
    },
    orderBy: {
      likes: {
        _count: 'desc'
      }
    },
    take: 10
  })

  topReviews.forEach((review, index) => {
    console.log(`${index + 1}. 💖 ${review._count.likes} likes`)
    console.log(`   👤 ${review.user.name} (${review.user.email})`)
    console.log(`   ⚽ ${review.match.homeTeam} vs ${review.match.awayTeam} (${review.match.competition})`)
    console.log(`   ⭐ ${review.rating}/5 - "${review.comment?.substring(0, 80)}..."`)
    console.log('')
  })

  // 3. Vérifier les utilisateurs qui ont liké
  console.log('👥 UTILISATEURS QUI ONT LIKÉ:')
  const usersWithLikes = await prisma.user.findMany({
    include: {
      reviewLikes: {
        include: {
          review: {
            include: {
              user: {
                select: { name: true }
              },
              match: {
                select: { homeTeam: true, awayTeam: true }
              }
            }
          }
        }
      }
    },
    where: {
      reviewLikes: {
        some: {}
      }
    }
  })

  usersWithLikes.forEach(user => {
    console.log(`- ${user.name} (${user.email}) a liké ${user.reviewLikes.length} reviews`)
    user.reviewLikes.slice(0, 2).forEach(like => {
      console.log(`  ↳ Review de ${like.review.user.name} sur ${like.review.match.homeTeam} vs ${like.review.match.awayTeam}`)
    })
    console.log('')
  })

  // 4. Problèmes potentiels
  console.log('🔍 VÉRIFICATIONS:')
  
  // Reviews sans likes mais avec commentaires
  const reviewsWithoutLikes = await prisma.rating.count({
    where: {
      comment: {
        not: null,
        not: ''
      },
      likes: {
        none: {}
      }
    }
  })
  console.log(`- Reviews avec commentaires mais sans likes: ${reviewsWithoutLikes}`)

  // Utilisateurs sans reviews
  const usersWithoutReviews = await prisma.user.count({
    where: {
      ratings: {
        none: {}
      }
    }
  })
  console.log(`- Utilisateurs sans reviews: ${usersWithoutReviews}`)

  // Likes orphelins (normalement impossible avec les foreign keys)
  const orphanLikes = await prisma.reviewLike.count({
    where: {
      OR: [
        { user: null },
        { review: null }
      ]
    }
  })
  console.log(`- Likes orphelins: ${orphanLikes}`)

  // 5. Requête de test pour l'API top-reviews
  console.log('\n🧪 TEST REQUÊTE API TOP-REVIEWS:')
  
  try {
    const apiTestReviews = await prisma.rating.findMany({
      where: {
        comment: {
          not: null,
          not: ''
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            _count: {
              select: { ratings: true }
            },
            ratings: {
              select: { rating: true },
              take: 100
            }
          }
        },
        match: {
          select: {
            id: true,
            sport: true,
            homeTeam: true,
            awayTeam: true,
            homeScore: true,
            awayScore: true,
            date: true,
            competition: true,
            venue: true,
            homeTeamLogo: true,
            awayTeamLogo: true
          }
        },
        likes: true,
        _count: {
          select: { likes: true }
        }
      },
      orderBy: {
        likes: {
          _count: 'desc'
        }
      },
      take: 5
    })

    console.log(`✅ Requête API réussie - ${apiTestReviews.length} reviews trouvées`)
    
    const reviewsWithLikesCount = apiTestReviews.filter(r => r._count.likes > 0)
    console.log(`✅ Reviews avec likes: ${reviewsWithLikesCount.length}`)
    
    if (reviewsWithLikesCount.length > 0) {
      console.log(`✅ Top review: "${reviewsWithLikesCount[0].comment?.substring(0, 50)}..." (${reviewsWithLikesCount[0]._count.likes} likes)`)
    } else {
      console.log('⚠️ Aucune review avec likes trouvée')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test API:', error)
  }

  console.log('\n✅ Analyse terminée!')
}

async function main() {
  try {
    await debugReviews()
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
