// scripts/test-api-matches.js - Tester l'API matches directement
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPIMatches() {
  console.log('🧪 === TEST API MATCHES DIRECT ===\n')
  
  try {
    // Simuler exactement ce que fait l'API /api/matches
    const days = 14
    const limit = 10
    const type = 'recent'
    const sport = 'all'
    
    console.log(`🔍 Test avec paramètres par défaut:`)
    console.log(`   type: ${type}`)
    console.log(`   sport: ${sport}`)
    console.log(`   days: ${days}`)
    console.log(`   limit: ${limit}`)
    
    // Construction du filtre exact comme dans l'API
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(days))
    
    const baseFilters = {
      status: 'FINISHED',
      date: {
        gte: daysAgo
      }
    }
    
    console.log(`📅 Date limite: ${daysAgo.toLocaleDateString()}`)
    
    // Test 1: Requête exacte comme l'API
    const matches = await prisma.match.findMany({
      where: baseFilters,
      include: {
        ratings: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit)
    })
    
    console.log(`\n✅ Résultat requête API: ${matches.length} matchs trouvés`)
    
    if (matches.length === 0) {
      console.log('❌ PROBLÈME: L\'API ne trouve aucun match !')
      
      // Test sans filtre de date
      const allFinished = await prisma.match.findMany({
        where: { status: 'FINISHED' },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          homeTeam: true,
          awayTeam: true,
          sport: true,
          date: true,
          status: true
        }
      })
      
      console.log(`\n🔍 Test sans filtre date: ${allFinished.length} matchs terminés`)
      allFinished.forEach((match, i) => {
        console.log(`${i + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.sport})`)
        console.log(`   📅 ${match.date.toLocaleDateString()}`)
        console.log(`   📊 ${match.status}`)
      })
      
    } else {
      console.log('\n🏆 === MATCHS TROUVÉS PAR L\'API ===')
      matches.slice(0, 5).forEach((match, i) => {
        console.log(`${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`)
        console.log(`   📅 ${match.date.toLocaleDateString()}`)
        console.log(`   🏆 ${match.competition} (${match.sport})`)
        console.log(`   📊 ${match.status}`)
        console.log(`   ⭐ ${match.totalRatings} notes`)
        console.log('')
      })
    }
    
    // Test 2: Conversion sport (problème potentiel)
    const sportsConversion = matches.reduce((acc, match) => {
      const convertedSport = getSportFromEnum(match.sport)
      acc[match.sport] = convertedSport
      return acc
    }, {})
    
    console.log('\n🔄 === CONVERSION SPORTS ===')
    Object.entries(sportsConversion).forEach(([original, converted]) => {
      console.log(`${original} → ${converted}`)
    })
    
    // Test 3: Test avec filtre MMA spécifiquement
    console.log('\n🥊 === TEST FILTRE MMA ===')
    
    const mmaMatches = await prisma.match.findMany({
      where: {
        sport: 'MMA',
        status: 'FINISHED',
        date: {
          gte: daysAgo
        }
      },
      take: 5,
      orderBy: { date: 'desc' }
    })
    
    console.log(`🥊 Combats MMA récents (${days} jours): ${mmaMatches.length}`)
    
    if (mmaMatches.length > 0) {
      mmaMatches.forEach((match, i) => {
        console.log(`${i + 1}. ${match.homeTeam} vs ${match.awayTeam}`)
        console.log(`   📅 ${match.date.toLocaleDateString()}`)
        console.log(`   📊 ${match.status}`)
      })
    }
    
    // Test 4: Statistiques pour debug
    const stats = await prisma.match.groupBy({
      by: ['sport'],
      where: { status: 'FINISHED' },
      _count: { sport: true }
    })
    
    console.log('\n📊 === STATS POUR DEBUG ===')
    stats.forEach(stat => {
      const converted = getSportFromEnum(stat.sport)
      console.log(`${stat.sport} (${converted}): ${stat._count.sport} matchs`)
    })
    
    // Recommandations
    console.log('\n💡 === DIAGNOSTIC ===')
    
    if (matches.length === 0) {
      console.log('❌ PROBLÈME: L\'API ne retourne aucun match')
      console.log('🔧 CAUSES POSSIBLES:')
      console.log('   - Filtre de date trop restrictif (aucun match récent)')
      console.log('   - Problème dans la logique de filtrage')
      console.log('   - Erreur dans l\'API /api/matches')
    } else {
      console.log('✅ L\'API trouve des matchs')
      console.log('🔧 PROBLÈME PROBABLEMENT DANS:')
      console.log('   - La conversion des données côté front-end')
      console.log('   - Les filtres appliqués dans React')
      console.log('   - L\'affichage conditionnel')
      console.log('   - Une erreur JavaScript côté client')
    }
    
    console.log('\n🚀 PROCHAINES ÉTAPES:')
    console.log('1. Ouvrir les DevTools de ton navigateur')
    console.log('2. Aller sur la page d\'accueil')
    console.log('3. Regarder l\'onglet Network pour voir si l\'API /api/matches est appelée')
    console.log('4. Regarder l\'onglet Console pour voir les erreurs JavaScript')
    console.log('5. Regarder la réponse de l\'API dans Network')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction de conversion sport (copie de celle qui devrait être dans l'API)
function getSportFromEnum(sportEnum) {
  const sportMap = {
    'FOOTBALL': 'football',
    'BASKETBALL': 'basketball', 
    'MMA': 'mma',
    'RUGBY': 'rugby',
    'F1': 'f1'
  }
  
  return sportMap[sportEnum] || sportEnum.toLowerCase()
}

testAPIMatches()