// scripts/emergency-debug.js - Diagnostic d'urgence pour voir ce qui s'est passé
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function emergencyDebug() {
  console.log('🚨 === DIAGNOSTIC D\'URGENCE ===\n')
  
  try {
    // 1. Compter tous les matchs
    const totalMatches = await prisma.match.count()
    console.log(`📊 Total matchs en base: ${totalMatches}`)
    
    // 2. Répartition par sport
    const sportStats = await prisma.match.groupBy({
      by: ['sport'],
      _count: { sport: true }
    })
    
    console.log('\n📊 === RÉPARTITION PAR SPORT ===')
    sportStats.forEach(stat => {
      console.log(`${stat.sport}: ${stat._count.sport} matchs`)
    })
    
    // 3. Répartition par status
    const statusStats = await prisma.match.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    
    console.log('\n📊 === RÉPARTITION PAR STATUS ===')
    statusStats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count.status} matchs`)
    })
    
    // 4. Répartition par sport ET status
    const sportStatusStats = await prisma.match.groupBy({
      by: ['sport', 'status'],
      _count: { sport: true }
    })
    
    console.log('\n📊 === RÉPARTITION SPORT + STATUS ===')
    sportStatusStats.forEach(stat => {
      console.log(`${stat.sport} + ${stat.status}: ${stat._count.sport} matchs`)
    })
    
    // 5. Vérifier les matchs récents (derniers 30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentMatches = await prisma.match.count({
      where: {
        date: {
          gte: thirtyDaysAgo
        },
        status: 'FINISHED'
      }
    })
    
    console.log(`\n📅 Matchs terminés des 30 derniers jours: ${recentMatches}`)
    
    // 6. Exemples de matchs non-MMA récents
    const nonMMAExamples = await prisma.match.findMany({
      where: {
        sport: { not: 'MMA' },
        status: 'FINISHED'
      },
      take: 5,
      orderBy: { date: 'desc' },
      select: {
        homeTeam: true,
        awayTeam: true,
        sport: true,
        status: true,
        date: true,
        competition: true
      }
    })
    
    console.log('\n⚽ === EXEMPLES MATCHS NON-MMA ===')
    if (nonMMAExamples.length === 0) {
      console.log('❌ AUCUN match non-MMA trouvé !')
    } else {
      nonMMAExamples.forEach((match, i) => {
        console.log(`${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`)
        console.log(`   📅 ${match.date.toLocaleDateString()}`)
        console.log(`   🏆 ${match.competition} (${match.sport})`)
        console.log(`   📊 Status: ${match.status}`)
        console.log('')
      })
    }
    
    // 7. Vérifier les dates des matchs MMA vs autres
    const mmaDateRange = await prisma.match.aggregate({
      where: { sport: 'MMA' },
      _min: { date: true },
      _max: { date: true }
    })
    
    const nonMMADateRange = await prisma.match.aggregate({
      where: { sport: { not: 'MMA' } },
      _min: { date: true },
      _max: { date: true }
    })
    
    console.log('\n📅 === PLAGES DE DATES ===')
    if (mmaDateRange._min.date && mmaDateRange._max.date) {
      console.log(`MMA: ${mmaDateRange._min.date.toLocaleDateString()} → ${mmaDateRange._max.date.toLocaleDateString()}`)
    }
    if (nonMMADateRange._min.date && nonMMADateRange._max.date) {
      console.log(`Autres: ${nonMMADateRange._min.date.toLocaleDateString()} → ${nonMMADateRange._max.date.toLocaleDateString()}`)
    }
    
    // 8. Test simulation API page d'accueil
    console.log('\n🧪 === TEST SIMULATION PAGE D\'ACCUEIL ===')
    
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    
    const homePageSimulation = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        date: {
          gte: last7Days
        }
      },
      take: 10,
      orderBy: { date: 'desc' }
    })
    
    console.log(`🏠 Simulation page d'accueil (7 derniers jours): ${homePageSimulation.length} matchs`)
    
    if (homePageSimulation.length === 0) {
      console.log('❌ PROBLÈME: Aucun match récent avec status FINISHED !')
      
      // Tester avec 30 jours
      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)
      
      const extended = await prisma.match.count({
        where: {
          status: 'FINISHED',
          date: {
            gte: last30Days
          }
        }
      })
      
      console.log(`📅 Test étendu (30 jours): ${extended} matchs`)
    }
    
    // 9. Recommandations d'urgence
    console.log('\n🆘 === ACTIONS D\'URGENCE ===')
    
    if (recentMatches === 0) {
      console.log('❌ PROBLÈME MAJEUR: Aucun match récent terminé trouvé')
      console.log('🔧 SOLUTIONS:')
      console.log('   1. Relancer le seed: npm run db:seed')
      console.log('   2. Vérifier que les matchs de foot/basket ont bien status="FINISHED"')
      console.log('   3. Vérifier les dates des matchs (pas trop anciennes)')
    } else {
      console.log('✅ Des matchs récents existent, problème probablement ailleurs')
      console.log('🔧 Vérifier l\'API /api/matches ou le front-end')
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error)
  } finally {
    await prisma.$disconnect()
  }
}

emergencyDebug()