// scripts/debug-mma.js - Script pour vérifier les combats MMA en base
// Exécuter avec: node scripts/debug-mma.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugMMA() {
  try {
    console.log('🥊 === DEBUG COMBATS MMA ===')
    
    // 1. Vérifier le total de matchs
    const totalMatches = await prisma.match.count()
    console.log(`📊 Total matchs en base: ${totalMatches}`)
    
    // 2. Vérifier les combats MMA
    const mmaMatches = await prisma.match.findMany({
      where: { sport: 'MMA' },
      orderBy: { date: 'desc' },
      take: 10
    })
    
    console.log(`🥊 Combats MMA trouvés: ${mmaMatches.length}`)
    
    if (mmaMatches.length > 0) {
      console.log('\n🥊 === EXEMPLES DE COMBATS MMA ===')
      mmaMatches.forEach((match, index) => {
        console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`)
        console.log(`   📅 Date: ${match.date.toLocaleDateString()}`)
        console.log(`   🏆 Compétition: ${match.competition}`)
        console.log(`   📊 Sport: ${match.sport}`)
        console.log(`   🎯 Score: ${match.homeScore} - ${match.awayScore}`)
        console.log(`   🏟️ Lieu: ${match.venue}`)
        console.log(`   ⭐ Notes: ${match.totalRatings} (avg: ${match.avgRating})`)
        console.log(`   🆔 ID: ${match.id}`)
        console.log('')
      })
    }
    
    // 3. Vérifier les sports disponibles
    const sportStats = await prisma.match.groupBy({
      by: ['sport'],
      _count: { id: true }
    })
    
    console.log('\n📊 === RÉPARTITION PAR SPORT ===')
    sportStats.forEach(stat => {
      console.log(`${stat.sport}: ${stat._count.id} matchs`)
    })
    
    // 4. Test de recherche
    console.log('\n🔍 === TEST DE RECHERCHE ===')
    const searchResults = await prisma.match.findMany({
      where: {
        sport: 'MMA',
        OR: [
          { homeTeam: { contains: 'Jones', mode: 'insensitive' } },
          { awayTeam: { contains: 'Jones', mode: 'insensitive' } }
        ]
      }
    })
    
    console.log(`🔍 Recherche "Jones" en MMA: ${searchResults.length} résultats`)
    
    // 5. Vérifier les détails des combats
    if (mmaMatches.length > 0) {
      console.log('\n🔍 === DÉTAILS DU PREMIER COMBAT ===')
      const firstMatch = mmaMatches[0]
      console.log(`Combat: ${firstMatch.homeTeam} vs ${firstMatch.awayTeam}`)
      console.log(`Détails disponibles: ${firstMatch.details ? 'OUI' : 'NON'}`)
      
      if (firstMatch.details) {
        console.log('Détails:', JSON.stringify(firstMatch.details, null, 2))
      }
    }
    
    // 6. Vérifier les problèmes potentiels
    console.log('\n⚠️  === DIAGNOSTIC ===')
    
    if (mmaMatches.length === 0) {
      console.log('❌ PROBLÈME: Aucun combat MMA trouvé')
      console.log('   🔧 Solutions possibles:')
      console.log('   - Vérifier que l\'import UFC a fonctionné')
      console.log('   - Relancer l\'import depuis /admin/dashboard-ufc')
      console.log('   - Vérifier que le champ sport est bien "MMA" (pas "mma")')
    } else {
      console.log('✅ Combats MMA présents en base')
      
      // Vérifier les filtres
      const recentMMA = await prisma.match.findMany({
        where: {
          sport: 'MMA',
          status: 'FINISHED'
        },
        take: 5
      })
      
      console.log(`   📊 Combats MMA terminés: ${recentMMA.length}`)
      
      if (recentMMA.length === 0) {
        console.log('   ⚠️  Aucun combat MMA avec status "FINISHED"')
      }
    }
    
    console.log('\n🎯 === RECOMMANDATIONS ===')
    
    if (mmaMatches.length === 0) {
      console.log('1. Aller sur /admin/dashboard-ufc')
      console.log('2. Cliquer sur "Tester API UFC"')
      console.log('3. Cliquer sur "Importer Combats UFC"')
      console.log('4. Vérifier que l\'import fonctionne')
    } else {
      console.log('1. Les combats MMA sont présents ✅')
      console.log('2. Vérifier que les filtres sur la page d\'accueil utilisent sport: "mma" (minuscule)')
      console.log('3. Vérifier que l\'API /api/matches convertit bien "MMA" -> "mma"')
      console.log('4. Redémarrer le serveur Next.js')
    }
    
  } catch (error) {
    console.error('❌ Erreur debug:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le debug
debugMMA().catch(console.error)