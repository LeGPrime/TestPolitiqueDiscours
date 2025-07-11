// scripts/quick-mma-debug.js - Diagnostic MMA ultra-rapide
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function quickMMADebug() {
  console.log('🥊 === DIAGNOSTIC MMA RAPIDE ===\n')
  
  try {
    // 1. Compter tous les matchs MMA
    const totalMMA = await prisma.match.count({
      where: { sport: 'MMA' }
    })
    
    console.log(`📊 Total combats MMA en base: ${totalMMA}`)
    
    if (totalMMA === 0) {
      console.log('❌ PROBLÈME: Aucun combat MMA trouvé!')
      console.log('🔧 Solution: Relancer l\'import UFC depuis /admin/dashboard-ufc')
      return
    }
    
    // 2. Compter les combats MMA terminés
    const finishedMMA = await prisma.match.count({
      where: { 
        sport: 'MMA',
        status: 'FINISHED'
      }
    })
    
    console.log(`✅ Combats MMA terminés: ${finishedMMA}`)
    
    // 3. Récupérer 3 exemples
    const examples = await prisma.match.findMany({
      where: { sport: 'MMA' },
      take: 3,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        competition: true,
        status: true,
        date: true,
        sport: true
      }
    })
    
    console.log('\n🥊 === EXEMPLES DE COMBATS ===')
    examples.forEach((match, i) => {
      console.log(`${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`)
      console.log(`   📅 ${match.date.toLocaleDateString()}`)
      console.log(`   🏆 ${match.competition}`)
      console.log(`   📊 Sport: "${match.sport}" | Status: "${match.status}"`)
      console.log(`   🆔 ID: ${match.id}`)
      console.log('')
    })
    
    // 4. Test de l'API
    console.log('🧪 === TEST SIMULATION API ===')
    
    // Simuler la requête API avec filtre MMA
    const apiTestResult = await prisma.match.findMany({
      where: {
        sport: 'MMA',
        status: 'FINISHED'
      },
      take: 5,
      orderBy: { date: 'desc' }
    })
    
    console.log(`🎯 Simulation API avec filtre MMA: ${apiTestResult.length} résultats`)
    
    if (apiTestResult.length === 0) {
      console.log('❌ PROBLÈME: L\'API ne trouve pas les combats MMA!')
      console.log('🔧 Causes possibles:')
      console.log('   - Tous les combats ont status différent de "FINISHED"')
      console.log('   - Problème de mapping sport dans l\'API')
    } else {
      console.log('✅ L\'API devrait fonctionner')
    }
    
    // 5. Vérifier les status
    const statusCount = await prisma.match.groupBy({
      by: ['status'],
      where: { sport: 'MMA' },
      _count: { status: true }
    })
    
    console.log('\n📊 === RÉPARTITION STATUS MMA ===')
    statusCount.forEach(stat => {
      console.log(`${stat.status}: ${stat._count.status} combats`)
    })
    
    // 6. Recommandations
    console.log('\n🎯 === RECOMMANDATIONS ===')
    
    if (finishedMMA === 0 && totalMMA > 0) {
      console.log('⚠️ Tous les combats MMA ont un status différent de "FINISHED"')
      console.log('🔧 Solution: Mettre à jour le status des combats:')
      console.log('   UPDATE matches SET status = \'FINISHED\' WHERE sport = \'MMA\' AND status != \'FINISHED\';')
    } else if (finishedMMA > 0) {
      console.log('✅ Des combats MMA terminés existent')
      console.log('🔧 Problème probablement dans le front-end ou l\'API /api/matches')
      console.log('🔧 Vérifier les filtres sport dans pages/index.tsx')
      console.log('🔧 Vérifier la conversion sport dans /api/matches')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickMMADebug()