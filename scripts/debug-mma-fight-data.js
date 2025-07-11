// scripts/debug-mma-fight-data.js - Voir les vraies données des combats MMA
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugMMAFightData() {
  console.log('🥊 === DEBUG DONNÉES COMBATS MMA ===\n')
  
  try {
    // Récupérer quelques combats MMA avec leurs détails complets
    const mmaFights = await prisma.match.findMany({
      where: { sport: 'MMA' },
      take: 5,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        status: true,
        date: true,
        competition: true,
        details: true // ← IMPORTANT: les détails contiennent winner/method
      }
    })

    console.log(`🔍 Analyse de ${mmaFights.length} combats MMA:\n`)

    mmaFights.forEach((fight, index) => {
      console.log(`${index + 1}. ${fight.homeTeam} vs ${fight.awayTeam}`)
      console.log(`   📅 Date: ${fight.date.toLocaleDateString()}`)
      console.log(`   🏆 Compétition: ${fight.competition}`)
      console.log(`   📊 Scores DB: ${fight.homeScore} - ${fight.awayScore}`)
      console.log(`   📊 Status: ${fight.status}`)
      
      // Analyser les détails (c'est là que sont les vraies infos)
      if (fight.details) {
        console.log(`   📋 Détails disponibles: OUI`)
        
        // Afficher la structure des détails
        const details = fight.details
        console.log(`   🔧 Structure détails:`, Object.keys(details))
        
        // Chercher le gagnant dans différents endroits possibles
        const possibleWinnerFields = [
          'winner', 
          'processed.result.winner', 
          'processed.fighter1.name', 
          'processed.fighter2.name',
          'api_data.winner',
          'api_data.processed.result.winner'
        ]
        
        console.log(`   🏆 Recherche gagnant:`)
        possibleWinnerFields.forEach(field => {
          const value = getNestedValue(details, field)
          if (value) {
            console.log(`     ${field}: "${value}"`)
          }
        })
        
        // Chercher la méthode
        const possibleMethodFields = [
          'method',
          'processed.result.method',
          'api_data.method',
          'api_data.processed.result.method'
        ]
        
        console.log(`   🥊 Recherche méthode:`)
        possibleMethodFields.forEach(field => {
          const value = getNestedValue(details, field)
          if (value) {
            console.log(`     ${field}: "${value}"`)
          }
        })
        
        // Afficher les premières clés des détails pour comprendre la structure
        console.log(`   📂 Détails complets (extrait):`)
        if (details.processed) {
          console.log(`     processed:`, Object.keys(details.processed))
          if (details.processed.result) {
            console.log(`     processed.result:`, details.processed.result)
          }
        }
        if (details.api_data) {
          console.log(`     api_data:`, Object.keys(details.api_data))
        }
        
      } else {
        console.log(`   📋 Détails: AUCUN`)
      }
      
      console.log('')
    })

    // Analyser un combat spécifique en détail
    if (mmaFights.length > 0) {
      const firstFight = mmaFights[0]
      console.log('🔍 === ANALYSE DÉTAILLÉE DU PREMIER COMBAT ===')
      console.log('Combat:', firstFight.homeTeam, 'vs', firstFight.awayTeam)
      console.log('Détails complets:')
      console.log(JSON.stringify(firstFight.details, null, 2))
    }

    // Recommandations pour corriger l'affichage
    console.log('\n💡 === RECOMMANDATIONS ===')
    console.log('1. Les scores homeScore/awayScore ne montrent pas le gagnant')
    console.log('2. Les vraies infos sont dans le champ "details"')
    console.log('3. Il faut modifier le composant d\'affichage pour utiliser:')
    console.log('   - details.winner ou details.processed.result.winner')
    console.log('   - details.method ou details.processed.result.method')
    console.log('4. Le format homeScore/awayScore ne convient pas au MMA')
    console.log('   (en MMA on a gagnant/perdant, pas un score numérique)')

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction utilitaire pour accéder aux propriétés imbriquées
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

debugMMAFightData()