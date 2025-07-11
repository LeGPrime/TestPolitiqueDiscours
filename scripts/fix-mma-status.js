// scripts/fix-mma-status.js - Corriger le status des combats MMA
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixMMAStatus() {
  console.log('🥊 === CORRECTION STATUS COMBATS MMA ===\n')
  
  try {
    // 1. Vérifier l'état actuel
    const beforeStats = await prisma.match.groupBy({
      by: ['status'],
      where: { sport: 'MMA' },
      _count: { status: true }
    })
    
    console.log('📊 AVANT correction:')
    beforeStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status} combats`)
    })
    
    // 2. Mettre à jour tous les combats MMA vers FINISHED
    // On considère que les combats importés depuis l'API sont déjà terminés
    const updateResult = await prisma.match.updateMany({
      where: {
        sport: 'MMA',
        status: 'SCHEDULED'
      },
      data: {
        status: 'FINISHED'
      }
    })
    
    console.log(`\n✅ ${updateResult.count} combats MMA mis à jour vers "FINISHED"`)
    
    // 3. Vérifier le résultat
    const afterStats = await prisma.match.groupBy({
      by: ['status'],
      where: { sport: 'MMA' },
      _count: { status: true }
    })
    
    console.log('\n📊 APRÈS correction:')
    afterStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status} combats`)
    })
    
    // 4. Test de l'API après correction
    const apiTestResult = await prisma.match.findMany({
      where: {
        sport: 'MMA',
        status: 'FINISHED'
      },
      take: 5,
      orderBy: { date: 'desc' },
      select: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        date: true
      }
    })
    
    console.log(`\n🧪 Test API après correction: ${apiTestResult.length} combats trouvés`)
    
    if (apiTestResult.length > 0) {
      console.log('\n🥊 === EXEMPLES DE COMBATS MAINTENANT VISIBLES ===')
      apiTestResult.forEach((match, i) => {
        console.log(`${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`)
        console.log(`   📅 ${match.date.toLocaleDateString()}`)
        console.log(`   🏆 ${match.competition}`)
        console.log('')
      })
    }
    
    console.log('🎉 === RÉSUMÉ ===')
    console.log(`✅ ${updateResult.count} combats MMA sont maintenant visibles`)
    console.log('🚀 Va sur ton app et filtre par sport "MMA" 🥊')
    console.log('💡 Les combats devraient maintenant apparaître !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMMAStatus()