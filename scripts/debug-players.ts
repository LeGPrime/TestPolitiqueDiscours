// scripts/debug-players.ts - Script pour diagnostiquer et corriger les problèmes de joueurs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugAndFixPlayers() {
  console.log('🔍 Diagnostic des joueurs...')

  // 1. Trouver les doublons
  console.log('\n📊 Recherche des doublons...')
  
  const players = await prisma.player.findMany({
    orderBy: [
      { name: 'asc' },
      { team: 'asc' },
      { sport: 'asc' }
    ]
  })

  // Grouper par combinaison name+team+sport
  const duplicates = new Map<string, typeof players>()
  
  players.forEach(player => {
    const key = `${player.name}_${player.team}_${player.sport}`
    if (!duplicates.has(key)) {
      duplicates.set(key, [])
    }
    duplicates.get(key)!.push(player)
  })

  // Afficher les doublons
  let duplicateCount = 0
  duplicates.forEach((playersList, key) => {
    if (playersList.length > 1) {
      console.log(`⚠️  DOUBLON: ${key}`)
      playersList.forEach(p => {
        console.log(`   - ID: ${p.id} | Name: ${p.name} | Team: ${p.team} | Position: ${p.position || 'N/A'}`)
      })
      duplicateCount++
    }
  })

  if (duplicateCount === 0) {
    console.log('✅ Aucun doublon trouvé')
  } else {
    console.log(`⚠️  ${duplicateCount} groupes de doublons trouvés`)
  }

  // 2. Nettoyer les doublons
  console.log('\n🧹 Nettoyage des doublons...')
  
  for (const [key, playersList] of duplicates) {
    if (playersList.length > 1) {
      // Garder le premier, supprimer les autres
      const [keepPlayer, ...duplicateToDelete] = playersList
      
      console.log(`Gardé: ${keepPlayer.id} - ${keepPlayer.name}`)
      
      for (const duplicate of duplicateToDelete) {
        // Transférer les votes existants vers le joueur à garder
        await prisma.manOfMatchVote.updateMany({
          where: { playerId: duplicate.id },
          data: { playerId: keepPlayer.id }
        })
        
        // Transférer les ratings existants vers le joueur à garder
        await prisma.playerRating.updateMany({
          where: { playerId: duplicate.id },
          data: { playerId: keepPlayer.id }
        })
        
        // Supprimer le doublon
        await prisma.player.delete({
          where: { id: duplicate.id }
        })
        
        console.log(`Supprimé: ${duplicate.id} - ${duplicate.name}`)
      }
    }
  }

  // 3. Vérifier la contrainte unique
  console.log('\n🔧 Vérification de la contrainte unique...')
  
  try {
    // Recréer la contrainte unique si elle n'existe pas
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        -- Supprimer l'ancienne contrainte si elle existe
        ALTER TABLE players DROP CONSTRAINT IF EXISTS players_name_team_sport_key;
        
        -- Créer la nouvelle contrainte unique
        ALTER TABLE players ADD CONSTRAINT players_name_team_sport_key 
        UNIQUE (name, team, sport);
        
      EXCEPTION 
        WHEN duplicate_table THEN NULL;
      END $$;
    `
    console.log('✅ Contrainte unique mise à jour')
  } catch (error) {
    console.log('⚠️  Erreur lors de la mise à jour de la contrainte:', error)
  }

  // 4. Statistiques finales
  console.log('\n📈 Statistiques finales...')
  
  const finalPlayers = await prisma.player.findMany()
  const finalByTeam = finalPlayers.reduce((acc, player) => {
    acc[player.team] = (acc[player.team] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`Total joueurs: ${finalPlayers.length}`)
  console.log('Répartition par équipe:')
  Object.entries(finalByTeam).forEach(([team, count]) => {
    console.log(`  ${team}: ${count} joueurs`)
  })

  console.log('\n✅ Nettoyage terminé!')
}

// Fonction pour vérifier un joueur spécifique
async function checkSpecificPlayer(playerName: string, team: string) {
  console.log(`\n🔍 Vérification de ${playerName} (${team})...`)
  
  const players = await prisma.player.findMany({
    where: {
      OR: [
        { name: { contains: playerName, mode: 'insensitive' } },
        { name: playerName }
      ],
      team: team
    }
  })

  if (players.length === 0) {
    console.log('❌ Joueur non trouvé')
    
    // Chercher des noms similaires
    const similarPlayers = await prisma.player.findMany({
      where: {
        name: { contains: playerName.split(' ')[0], mode: 'insensitive' },
        team: team
      }
    })
    
    if (similarPlayers.length > 0) {
      console.log('🔍 Joueurs similaires trouvés:')
      similarPlayers.forEach(p => {
        console.log(`  - ${p.id}: ${p.name} (${p.position || 'N/A'})`)
      })
    }
  } else {
    console.log(`✅ ${players.length} joueur(s) trouvé(s):`)
    players.forEach(p => {
      console.log(`  - ${p.id}: ${p.name} | ${p.position || 'N/A'} | Team: ${p.team}`)
    })
  }
}

// Exécution
async function main() {
  try {
    await debugAndFixPlayers()
    
    // Vérifier le joueur spécifique qui pose problème
    await checkSpecificPlayer('I. Gueye', 'Senegal')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()